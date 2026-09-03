"""Demo payment API for BloomCare appointment fees.

This module models the server boundary needed for MTN MoMo/Airtel Money.
Replace the demo provider adapter with authenticated provider API calls before
using it with real money or patient data.
"""
from __future__ import annotations

import json
import secrets
import threading
from datetime import date, datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8787
AMOUNT = 20000
CURRENCY = "UGX"
MAX_REQUEST_BODY_BYTES = 16 * 1024
DATA_FILE = Path(__file__).parent / "data" / "payments.json"
LOCK = threading.Lock()
PHONE_PATTERN = re.compile(r"^07\d{8}$")
INTERNATIONAL_PHONE_PATTERN = re.compile(r"^\+2567\d{8}$")
REFERENCE_PATTERN = re.compile(r"^BC-\d{8}-[A-F0-9]{8}$")
APPOINTMENT_REFERENCE_PATTERN = re.compile(r"^BC-APT-\d{4}-\d{6}$")
SERVICE_FEES = {
    "Pregnancy Consultation": 20000,
    "Follow-up Consultation": 15000,
}
AVAILABLE_PROVIDERS = {"Dr. Amina Nanyonga", "Dr. Sarah Namusoke"}
AVAILABLE_FACILITIES = {
    "Kampala Women's Health Centre",
    "Mulago National Referral Hospital",
}
AVAILABLE_TIMES = {"09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM"}


class PaymentStoreError(RuntimeError):
    """Raised when the local demo payment store cannot be used safely."""


def normalize_phone(value: object) -> str:
    phone = str(value or "").strip().replace(" ", "")
    if INTERNATIONAL_PHONE_PATTERN.fullmatch(phone):
        return "0" + phone[4:]
    return phone


def validation_errors_for_initialize(payload: object) -> dict[str, str]:
    if not isinstance(payload, dict):
        return {"body": "Request body must be a JSON object."}
    errors: dict[str, str] = {}
    provider = payload.get("provider")
    if provider not in {"MTN MoMo", "Airtel Money"}:
        errors["provider"] = "Choose MTN MoMo or Airtel Money."
    phone = normalize_phone(payload.get("phone"))
    if not PHONE_PATTERN.fullmatch(phone):
        errors["phone"] = "Enter a valid Ugandan number such as 0751234567 or +256751234567."
    return errors


def validated_appointment(value: object) -> tuple[dict[str, str] | None, dict[str, str]]:
    """Return a storage-safe appointment payload or field-level validation errors."""
    if not isinstance(value, dict):
        return None, {"appointment": "Select an appointment before paying."}

    appointment = {
        key: str(value.get(key, "")).strip()
        for key in ("patientId", "service", "provider", "date", "time", "facility")
    }
    errors: dict[str, str] = {}
    if not appointment["patientId"]:
        errors["appointment.patientId"] = "A patient identifier is required."
    if appointment["service"] not in SERVICE_FEES:
        errors["appointment.service"] = "Choose a supported appointment service."
    if appointment["provider"] not in AVAILABLE_PROVIDERS:
        errors["appointment.provider"] = "Choose an available healthcare provider."
    if appointment["facility"] not in AVAILABLE_FACILITIES:
        errors["appointment.facility"] = "Choose an available healthcare facility."
    if appointment["time"] not in AVAILABLE_TIMES:
        errors["appointment.time"] = "Choose an available appointment time."
    try:
        appointment_date = date.fromisoformat(appointment["date"])
        if appointment_date < datetime.now(timezone.utc).date():
            errors["appointment.date"] = "Choose an appointment date that is today or later."
    except ValueError:
        errors["appointment.date"] = "Enter a valid appointment date."
    return (appointment if not errors else None), errors


def validation_error_payload(errors: dict[str, str]) -> dict[str, object]:
    return {"success": False, "message": "Validation failed", "errors": errors}


def read_payments() -> dict:
    if not DATA_FILE.exists():
        return {}
    try:
        payments = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise PaymentStoreError("Payment records could not be read safely.") from error
    if not isinstance(payments, dict):
        raise PaymentStoreError("Payment records have an invalid format.")
    return payments


def write_payments(payments: dict) -> None:
    temporary_file = DATA_FILE.with_suffix(".tmp")
    try:
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        temporary_file.write_text(json.dumps(payments, indent=2), encoding="utf-8")
        temporary_file.replace(DATA_FILE)
    except OSError as error:
        raise PaymentStoreError("Payment records could not be saved safely.") from error


def response_payload(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class PaymentHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        print(format % args)

    def do_OPTIONS(self) -> None:
        response_payload(self, 204, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in {"/", "/health"}:
            response_payload(self, 200, {"service": "BloomCare payment API", "status": "ok"})
            return
        response_payload(self, 404, {"error": "Payment endpoint not found."})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 0 or length > MAX_REQUEST_BODY_BYTES:
                response_payload(self, 413, {"error": "Request body is too large."})
                return
            payload = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            response_payload(self, 400, {"error": "Request body must be valid JSON."})
            return

        if path == "/api/payments/initialize":
            errors = validation_errors_for_initialize(payload)
            if errors:
                response_payload(self, 400, validation_error_payload(errors))
                return
            try:
                self.initialize(payload)
            except PaymentStoreError:
                response_payload(self, 503, {"error": "Payment service is temporarily unavailable."})
        elif path == "/api/payments/verify":
            try:
                self.verify(payload)
            except PaymentStoreError:
                response_payload(self, 503, {"error": "Payment service is temporarily unavailable."})
        else:
            response_payload(self, 404, {"error": "Payment endpoint not found."})

    def initialize(self, payload: dict) -> None:
        provider = payload.get("provider")
        phone = normalize_phone(payload.get("phone"))

        appointment, errors = validated_appointment(payload.get("appointment"))
        if errors:
            response_payload(self, 400, validation_error_payload(errors))
            return
        # The backend, not the browser, decides the fee from the requested service.
        amount = SERVICE_FEES[appointment["service"]]
        reference = f"BC-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(4).upper()}"
        slot_key = "|".join(str(appointment[key]).strip() for key in ("provider", "date", "time"))
        payment = {
            "reference": reference,
            "provider": provider,
            "phone": phone,
            "amount": amount,
            "currency": CURRENCY,
            "status": "PENDING",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "appointment": appointment,
            "appointmentStatus": "UNCONFIRMED",
            "slotKey": slot_key,
        }
        with LOCK:
            payments = read_payments()
            for existing in payments.values():
                if existing.get("slotKey") == slot_key and existing.get("status") in {"PENDING", "PROCESSING", "PAID"}:
                    existing_appointment = existing.get("appointment", {})
                    if (
                        existing.get("status") in {"PENDING", "PROCESSING"}
                        and existing_appointment.get("patientId") == appointment["patientId"]
                    ):
                        response_payload(self, 200, {
                            "reference": existing["reference"],
                            "amount": existing["amount"],
                            "currency": existing["currency"],
                            "provider": existing["provider"],
                            "message": "Your existing payment request has been resumed. Complete or verify it to confirm the appointment.",
                            "status": existing["status"],
                        })
                        return
                    response_payload(self, 409, {"error": "This provider time slot already has an active booking or payment."})
                    return
            payments[reference] = payment
            write_payments(payments)
        response_payload(self, 201, {
            "reference": reference,
            "amount": amount,
            "currency": CURRENCY,
            "provider": provider,
            "message": f"A payment prompt would be sent to {phone} through {provider} in production.",
            "status": "PENDING",
        })

    def verify(self, payload: dict) -> None:
        if not isinstance(payload, dict):
            response_payload(self, 400, validation_error_payload({"body": "Request body must be a JSON object."}))
            return
        reference = str(payload.get("reference", "")).strip()
        if not REFERENCE_PATTERN.fullmatch(reference):
            response_payload(self, 400, validation_error_payload({"reference": "Enter a valid payment reference."}))
            return
        with LOCK:
            payments = read_payments()
            payment = payments.get(reference)
            if not payment:
                response_payload(self, 404, {"error": "Payment reference not found."})
                return
            if payment.get("status") != "PENDING":
                response_payload(self, 409, {"error": "This payment has already been verified."})
                return
            # Demo adapter: production code must ask the provider for this status.
            payment["status"] = "PAID"
            payment["appointmentStatus"] = "CONFIRMED"
            payment["transactionId"] = f"TXN-{secrets.token_hex(6).upper()}"
            payment["appointmentReference"] = f"BC-APT-{datetime.now(timezone.utc):%Y}-{secrets.randbelow(1_000_000):06d}"
            payment["verifiedAt"] = datetime.now(timezone.utc).isoformat()
            payments[reference] = payment
            write_payments(payments)
        response_payload(self, 200, {"payment": payment, "receipt": {
            "receiptNumber": f"RCP-{reference[3:]}",
            "reference": reference,
            "amount": payment["amount"],
            "currency": CURRENCY,
            "provider": payment["provider"],
            "status": "PAID",
            "issuedAt": payment["verifiedAt"],
        }})


if __name__ == "__main__":
    print(f"BloomCare payment API listening on http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), PaymentHandler).serve_forever()
