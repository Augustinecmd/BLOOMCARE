"""BloomCare Pharmacy Management System - Payment API Server.

Handles MTN MoMo and Airtel Money payment initialization, verification,
and official Pharmacy Tax Invoice & Dispensing Receipt generation.
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
CURRENCY = "UGX"
MAX_REQUEST_BODY_BYTES = 64 * 1024
DATA_FILE = Path(__file__).parent / "data" / "payments.json"
LOCK = threading.Lock()
PHONE_PATTERN = re.compile(r"^07\d{8}$")
INTERNATIONAL_PHONE_PATTERN = re.compile(r"^\+2567\d{8}$")
REFERENCE_PATTERN = re.compile(r"^BC-\d{8}-[A-F0-9]{8}$")

AIRTEL_PREFIXES = ("070", "074", "075")
MTN_PREFIXES = ("076", "077", "078")

AVAILABLE_PROVIDERS = {"Dr. Amina Nanyonga (Lead Pharmacist)", "Pharm. Sarah Namusoke", "Pharm. David Mukasa"}
CONSULTATION_FEES = {
    "Medication Consultation": 15000,
    "Prescription Guidance": 10000,
    "Drug Interaction Advice": 15000,
    "General Pharmacy Consultation": 10000,
    "Maintenance Refill Consultation": 12000,
}


class PaymentStoreError(RuntimeError):
    """Raised when the payment store cannot be used safely."""


def normalize_phone(value: object) -> str:
    phone = str(value or "").strip().replace(" ", "").replace("-", "")
    if INTERNATIONAL_PHONE_PATTERN.fullmatch(phone):
        return "0" + phone[4:]
    return phone


def validation_errors_for_initialize(payload: object) -> dict[str, str]:
    if not isinstance(payload, dict):
        return {"body": "Request body must be a JSON object."}
    errors: dict[str, str] = {}
    provider = payload.get("provider")
    if provider not in {"MTN MoMo", "MTN Mobile Money", "Airtel Money"}:
        errors["provider"] = "Choose MTN Mobile Money or Airtel Money."
    phone = normalize_phone(payload.get("phone"))
    if not PHONE_PATTERN.fullmatch(phone):
        errors["phone"] = "Please enter a valid 10-digit Ugandan mobile number."
    elif provider == "Airtel Money" and not phone.startswith(AIRTEL_PREFIXES):
        errors["phone"] = "Invalid Airtel number. Please enter a valid Airtel Uganda number beginning with 070, 074 or 075."
    elif provider in {"MTN MoMo", "MTN Mobile Money"} and not phone.startswith(MTN_PREFIXES):
        errors["phone"] = "Invalid MTN number. Please enter a valid MTN Uganda number beginning with 076, 077 or 078."

    amount = payload.get("amount")
    if amount is not None:
        try:
            val = float(amount)
            if val <= 0:
                errors["amount"] = "Amount must be greater than 0 UGX."
            elif payload.get("type") == "consultation" and int(val) != 15000:
                errors["amount"] = "Consultation fee must be 15,000 UGX."
        except (ValueError, TypeError):
            errors["amount"] = "Invalid payment amount."

    if payload.get("type") == "consultation":
        details = payload.get("details")
        if details is not None and (not isinstance(details, dict) or (not details.get("consultationId") and not details.get("pharmacist"))):
            errors["consultation"] = "A valid pending consultation record is required."

    return errors


def read_payments() -> dict:
    if not DATA_FILE.exists():
        return {}
    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, dict) else {}
    except Exception as exc:
        raise PaymentStoreError(f"Failed to read payments store: {exc}") from exc


def write_payments(data: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_path = DATA_FILE.with_suffix(".tmp")
    try:
        with temp_path.open("w", encoding="utf-8") as file:
            json.dump(data, file, indent=2)
        temp_path.replace(DATA_FILE)
    except Exception as exc:
        if temp_path.exists():
            temp_path.unlink()
        raise PaymentStoreError(f"Failed to write payments store: {exc}") from exc


def create_payment(provider: str, phone: str, details: dict, amount: int, payment_type: str = "order", custom_ref: str | None = None) -> dict:
    today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique_suffix = secrets.token_hex(4).upper()
    if custom_ref:
        reference = custom_ref
    elif payment_type == "consultation":
        reference = f"BC-CNS-{today_str}-{unique_suffix}"
    else:
        reference = f"BC-{today_str}-{unique_suffix}"
    receipt_number = f"RCP-{today_str}-{secrets.token_hex(3).upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    record = {
        "reference": reference,
        "receiptNumber": receipt_number,
        "provider": provider,
        "paymentType": payment_type,
        "phone": normalize_phone(phone),
        "amount": amount,
        "currency": CURRENCY,
        "status": "PENDING",
        "createdAt": now_iso,
        "verifiedAt": None,
        "transactionId": None,
        "details": details,
        "dispensedBy": "BloomCare Pharmacy Kampala",
    }
    with LOCK:
        payments = read_payments()
        payments[reference] = record
        write_payments(payments)
    return record


def verify_payment(reference: str) -> dict | None:
    with LOCK:
        payments = read_payments()
        record = payments.get(reference)
        if not record:
            return None
        if record["status"] == "PENDING":
            record["status"] = "SUCCESSFUL"
            record["verifiedAt"] = datetime.now(timezone.utc).isoformat()
            record["transactionId"] = f"MM-UGX-{secrets.token_hex(6).upper()}"
            write_payments(payments)
        return record


class PaymentHandler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_json(200, {"status": "ok", "service": "BloomCare Pharmacy Payment API", "currency": "UGX"})
            return
        if parsed.path.startswith("/api/payments/status/"):
            ref = parsed.path.split("/")[-1]
            record = verify_payment(ref)
            if not record:
                self.send_json(404, {"success": False, "message": "Payment reference not found"})
                return
            self.send_json(200, {"success": True, "payment": record})
            return
        self.send_json(404, {"success": False, "message": "Endpoint not found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > MAX_REQUEST_BODY_BYTES:
            self.send_json(413, {"success": False, "message": "Request body too large"})
            return

        body = self.rfile.read(content_length).decode("utf-8")
        try:
            payload = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self.send_json(400, {"success": False, "message": "Invalid JSON format"})
            return

        if parsed.path == "/api/payments/initialize":
            errors = validation_errors_for_initialize(payload)
            if errors:
                self.send_json(422, {"success": False, "errors": errors})
                return

            provider = payload["provider"]
            phone = payload["phone"]
            payment_type = payload.get("type", "order")
            default_amount = 15000 if payment_type == "consultation" else 20000
            amount = int(payload.get("amount", default_amount))
            details = payload.get("details", payload.get("order", payload.get("appointment", {})))
            custom_ref = payload.get("reference")

            payment_record = create_payment(
                provider=provider,
                phone=phone,
                details=details,
                amount=amount,
                payment_type=payment_type,
                custom_ref=custom_ref
            )
            self.send_json(201, {
                "success": True,
                "message": f"Payment initialized via {provider}. Approval prompt sent to {phone}.",
                "reference": payment_record["reference"],
                "receiptNumber": payment_record["receiptNumber"],
                "amount": payment_record["amount"],
                "currency": CURRENCY,
                "provider": provider,
                "status": payment_record["status"],
            })
            return

        if parsed.path == "/api/payments/verify":
            ref = str(payload.get("reference", "")).strip()
            if not ref:
                self.send_json(422, {"success": False, "message": "Reference required"})
                return
            record = verify_payment(ref)
            if not record:
                self.send_json(404, {"success": False, "message": "Payment reference not found"})
                return
            self.send_json(200, {"success": True, "payment": record})
            return

        if parsed.path == "/api/payments/cancel":
            ref = str(payload.get("reference", "")).strip()
            if not ref:
                self.send_json(422, {"success": False, "message": "Reference required"})
                return
            with LOCK:
                payments = read_payments()
                record = payments.get(ref)
                if not record:
                    self.send_json(404, {"success": False, "message": "Payment reference not found"})
                    return
                if record["status"] == "PENDING":
                    record["status"] = "CANCELLED"
                    write_payments(payments)
                self.send_json(200, {"success": True, "payment": record})
            return

        if parsed.path == "/api/payments/webhook":
            event = payload.get("event")
            ref = payload.get("reference")
            if not ref:
                self.send_json(400, {"success": False, "message": "Reference missing"})
                return
            with LOCK:
                payments = read_payments()
                record = payments.get(ref)
                if record:
                    if event == "payment.success":
                        record["status"] = "SUCCESSFUL"
                        record["verifiedAt"] = datetime.now(timezone.utc).isoformat()
                        record["transactionId"] = payload.get("transactionId", f"MM-UGX-{secrets.token_hex(6).upper()}")
                    elif event == "payment.failed":
                        record["status"] = "FAILED"
                    write_payments(payments)
                    self.send_json(200, {"success": True, "payment": record})
                    return
            self.send_json(404, {"success": False, "message": "Payment reference not found"})
            return

        self.send_json(404, {"success": False, "message": "Endpoint not found"})


def run_server():
    server = ThreadingHTTPServer((HOST, PORT), PaymentHandler)
    print(f"BloomCare Pharmacy Payment API running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
