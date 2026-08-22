"""Demo payment API for BloomCare appointment fees.

This module models the server boundary needed for MTN MoMo/Airtel Money.
Replace the demo provider adapter with authenticated provider API calls before
using it with real money or patient data.
"""
from __future__ import annotations

import json
import secrets
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8787
AMOUNT = 20000
CURRENCY = "UGX"
DATA_FILE = Path(__file__).parent / "data" / "payments.json"
LOCK = threading.Lock()
PHONE_PATTERN = re.compile(r"^07\d{8}$")
INTERNATIONAL_PHONE_PATTERN = re.compile(r"^\+2567\d{8}$")
REFERENCE_PATTERN = re.compile(r"^BC-\d{8}-[A-F0-9]{8}$")
APPOINTMENT_REFERENCE_PATTERN = re.compile(r"^BC-APT-\d{4}-\d{6}$")


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


def validation_error_payload(errors: dict[str, str]) -> dict[str, object]:
    return {"success": False, "message": "Validation failed", "errors": errors}


def read_payments() -> dict:
    if not DATA_FILE.exists():
        return {}
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def write_payments(payments: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(payments, indent=2), encoding="utf-8")


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
            payload = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            response_payload(self, 400, {"error": "Request body must be valid JSON."})
            return

        if path == "/api/payments/initialize":
            errors = validation_errors_for_initialize(payload)
            if errors:
                response_payload(self, 400, validation_error_payload(errors))
                return
            self.initialize(payload)
        elif path == "/api/payments/verify":
            self.verify(payload)
        else:
            response_payload(self, 404, {"error": "Payment endpoint not found."})

    def initialize(self, payload: dict) -> None:
        provider = payload.get("provider")
        phone = normalize_phone(payload.get("phone"))

        reference = f"BC-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(4).upper()}"
        appointment = payload.get("appointment")
        if not isinstance(appointment, dict) or not all(str(appointment.get(key, "")).strip() for key in ("patientId", "service", "provider", "date", "time", "facility")):
            response_payload(self, 400, validation_error_payload({"appointment": "Select a service, provider, date, time, and facility before paying."}))
            return
        # The backend, not the browser, decides the fee from the requested service.
        amount = 15000 if appointment["service"] == "Follow-up Consultation" else AMOUNT
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
            "message": f"A payment prompt would be sent to {phone} through {provider} in production.",
            "message": f"A payment prompt would be sent to {phone} through {provider} in production.",
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
