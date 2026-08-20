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
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8787
AMOUNT = 20000
CURRENCY = "UGX"
DATA_FILE = Path(__file__).parent / "data" / "payments.json"
LOCK = threading.Lock()


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

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            response_payload(self, 400, {"error": "Request body must be valid JSON."})
            return

        if path == "/api/payments/initialize":
            self.initialize(payload)
        elif path == "/api/payments/verify":
            self.verify(payload)
        else:
            response_payload(self, 404, {"error": "Payment endpoint not found."})

    def initialize(self, payload: dict) -> None:
        provider = payload.get("provider")
        phone = str(payload.get("phone", "")).strip()
        if provider not in {"MTN MoMo", "Airtel Money"}:
            response_payload(self, 400, {"error": "Choose MTN MoMo or Airtel Money."})
            return
        if not phone:
            response_payload(self, 400, {"error": "A mobile-money phone number is required."})
            return

        reference = f"BC-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(4).upper()}"
        payment = {
            "reference": reference,
            "provider": provider,
            "phone": phone,
            "amount": AMOUNT,
            "currency": CURRENCY,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "appointment": payload.get("appointment", {}),
        }
        with LOCK:
            payments = read_payments()
            payments[reference] = payment
            write_payments(payments)
        response_payload(self, 201, {
            "reference": reference,
            "amount": AMOUNT,
            "currency": CURRENCY,
            "provider": provider,
            "status": "pending",
            "message": f"A payment prompt would be sent to {phone} through {provider} in production.",
        })

    def verify(self, payload: dict) -> None:
        reference = str(payload.get("reference", "")).strip()
        with LOCK:
            payments = read_payments()
            payment = payments.get(reference)
            if not payment:
                response_payload(self, 404, {"error": "Payment reference not found."})
                return
            # Demo adapter: production code must ask the provider for this status.
            payment["status"] = "paid"
            payment["verifiedAt"] = datetime.now(timezone.utc).isoformat()
            payments[reference] = payment
            write_payments(payments)
        response_payload(self, 200, {"payment": payment, "receipt": {
            "receiptNumber": f"RCP-{reference[3:]}",
            "reference": reference,
            "amount": AMOUNT,
            "currency": CURRENCY,
            "provider": payment["provider"],
            "status": "paid",
            "issuedAt": payment["verifiedAt"],
        }})


if __name__ == "__main__":
    print(f"BloomCare payment API listening on http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), PaymentHandler).serve_forever()
