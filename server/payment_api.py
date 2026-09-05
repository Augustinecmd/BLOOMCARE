"""BloomCare Pharmacy Management System - Payment API Server.

Handles MTN MoMo and Airtel Money payment initialization, verification,
and official Pharmacy Tax Invoice & Dispensing Receipt generation.
"""
from __future__ import annotations

import json
import secrets
import threading
from datetime import date, datetime, timezone, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import time
from urllib.parse import urlparse, parse_qs

HOST = "127.0.0.1"
PORT = 8787
CURRENCY = "UGX"
MAX_REQUEST_BODY_BYTES = 64 * 1024
DATA_FILE = Path(__file__).parent / "data" / "payments.json"
USERS_FILE = Path(__file__).parent / "data" / "users.json"
AUDIT_FILE = Path(__file__).parent / "data" / "audit_logs.json"
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
    for attempt in range(5):
        try:
            with temp_path.open("w", encoding="utf-8") as file:
                json.dump(data, file, indent=2)
            temp_path.replace(DATA_FILE)
            return
        except PermissionError:
            if attempt == 4:
                try:
                    with DATA_FILE.open("w", encoding="utf-8") as file:
                        json.dump(data, file, indent=2)
                    if temp_path.exists():
                        temp_path.unlink()
                    return
                except Exception as inner_exc:
                    raise PaymentStoreError(f"Failed to write payments store: {inner_exc}") from inner_exc
            time.sleep(0.06)
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


DEFAULT_SYSTEM_USERS = [
    {
        "id": "usr-staff-1",
        "name": "Dr. Admin Mugisha",
        "email": "admin@bloomcare.com",
        "phone": "0751001122",
        "role": "admin",
        "status": "active",
        "createdAt": "2026-01-01T08:00:00Z",
        "lastLogin": "Today",
        "permissions": ["all"]
    },
    {
        "id": "usr-dev-001",
        "name": "Lead Systems Developer",
        "email": "dev@bloomcare.com",
        "phone": "0751000999",
        "role": "developer",
        "status": "active",
        "createdAt": "2026-01-01T08:00:00Z",
        "lastLogin": "Today",
        "permissions": ["all"]
    },
    {
        "id": "usr-staff-2",
        "name": "Dr. Amina Nanyonga",
        "email": "amina.n@bloomcare.com",
        "phone": "0700000002",
        "role": "pharmacist",
        "status": "active",
        "createdAt": "2026-01-10T09:30:00Z",
        "lastLogin": "Yesterday",
        "permissions": ["prescription:clinical_review", "consultation:provide", "inventory:adjust"]
    },
    {
        "id": "usr-staff-3",
        "name": "Pharm. David Mukasa",
        "email": "david.m@bloomcare.com",
        "phone": "0700000003",
        "role": "pharmacist",
        "status": "active",
        "createdAt": "2026-01-15T11:00:00Z",
        "lastLogin": "03 Sep 2026",
        "permissions": ["prescription:clinical_review", "consultation:provide"]
    },
    {
        "id": "usr-staff-4",
        "name": "Sarah Namusoke",
        "email": "sarah.n@bloomcare.com",
        "phone": "0700000004",
        "role": "assistant_pharmacist",
        "status": "active",
        "createdAt": "2026-02-01T08:15:00Z",
        "lastLogin": "Today",
        "permissions": ["order:pack", "inventory:view"]
    },
    {
        "id": "usr-staff-5",
        "name": "Moses Kato",
        "email": "moses.k@bloomcare.com",
        "phone": "0700000005",
        "role": "delivery_person",
        "status": "active",
        "createdAt": "2026-02-10T14:20:00Z",
        "lastLogin": "Today",
        "permissions": ["order:dispatch", "order:deliver"]
    },
    {
        "id": "usr-cust-101",
        "name": "Grace Nakato",
        "email": "grace.nakato@example.com",
        "phone": "0751234567",
        "role": "customer",
        "status": "active",
        "createdAt": "2026-03-01T10:00:00Z",
        "lastLogin": "Today",
        "permissions": ["catalog:browse", "cart:checkout", "prescription:upload"]
    },
    {
        "id": "usr-cust-202",
        "name": "Florence Kembabazi",
        "email": "florence.k@example.com",
        "phone": "0701889900",
        "role": "customer",
        "status": "active",
        "createdAt": "2026-03-18T16:45:00Z",
        "lastLogin": "02 Sep 2026",
        "permissions": ["catalog:browse", "cart:checkout"]
    }
]


def read_users() -> list[dict]:
    if not USERS_FILE.exists():
        write_users(DEFAULT_SYSTEM_USERS)
        return DEFAULT_SYSTEM_USERS
    try:
        with USERS_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, list) else DEFAULT_SYSTEM_USERS
    except Exception:
        return DEFAULT_SYSTEM_USERS


def write_users(users: list[dict]) -> None:
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_path = USERS_FILE.with_suffix(".tmp")
    for attempt in range(5):
        try:
            with temp_path.open("w", encoding="utf-8") as file:
                json.dump(users, file, indent=2)
            temp_path.replace(USERS_FILE)
            return
        except PermissionError:
            if attempt == 4:
                try:
                    with USERS_FILE.open("w", encoding="utf-8") as file:
                        json.dump(users, file, indent=2)
                    if temp_path.exists():
                        temp_path.unlink()
                    return
                except Exception as inner:
                    raise RuntimeError(f"Failed to write users store: {inner}") from inner
            time.sleep(0.06)
        except Exception as exc:
            if temp_path.exists():
                temp_path.unlink()
            raise RuntimeError(f"Failed to write users store: {exc}") from exc


def read_audit_logs() -> list[dict]:
    if not AUDIT_FILE.exists():
        return []
    try:
        with AUDIT_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, list) else []
    except Exception:
        return []


def write_audit_logs(logs: list[dict]) -> None:
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_path = AUDIT_FILE.with_suffix(".tmp")
    for attempt in range(5):
        try:
            with temp_path.open("w", encoding="utf-8") as file:
                json.dump(logs, file, indent=2)
            temp_path.replace(AUDIT_FILE)
            return
        except PermissionError:
            if attempt == 4:
                try:
                    with AUDIT_FILE.open("w", encoding="utf-8") as file:
                        json.dump(logs, file, indent=2)
                    if temp_path.exists():
                        temp_path.unlink()
                    return
                except Exception as inner:
                    raise RuntimeError(f"Failed to write audit logs: {inner}") from inner
            time.sleep(0.06)
        except Exception as exc:
            if temp_path.exists():
                temp_path.unlink()
            raise RuntimeError(f"Failed to write audit logs: {exc}") from exc


def record_audit_log(admin_name: str, admin_role: str, action: str, target_user: str, target_user_id: str, description: str) -> dict:
    with LOCK:
        logs = read_audit_logs()
        entry = {
            "id": f"AUDIT-{int(time.time() * 1000)}",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "admin": admin_name or "Dr. Admin Mugisha",
            "adminRole": admin_role or "admin",
            "action": action,
            "affectedUser": target_user or "System User",
            "affectedUserId": target_user_id or "",
            "description": description,
        }
        logs.insert(0, entry)
        write_audit_logs(logs[:500])
        return entry


def is_admin_request(headers) -> tuple[bool, str, dict]:
    role = (headers.get("X-Admin-Role") or headers.get("X-User-Role") or "").strip().lower()
    auth_header = (headers.get("Authorization") or "").strip()
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip().lower()
        if token in {"admin", "developer"}:
            role = token

    if role in {"admin", "developer"}:
        return True, role, {"role": role, "name": headers.get("X-Admin-Name", "Dr. Admin Mugisha")}
    return False, role or "anonymous", {}


def is_paid_payment(item: dict) -> bool:
    if not isinstance(item, dict):
        return False
    status = str(item.get("status") or "").strip().lower()
    return status in {"paid", "successful"}


def get_sales_analytics(period: str = "today", custom_now: datetime | None = None, source: str = "all") -> dict:
    payments_dict = read_payments()
    now = custom_now or datetime.now().astimezone()

    paid_entries = []
    for item in payments_dict.values():
        if not is_paid_payment(item):
            continue
        raw_ts = item.get("createdAt") or item.get("verifiedAt")
        if not raw_ts:
            continue
        try:
            ts_str = str(raw_ts).strip()
            if ts_str.endswith("Z"):
                ts_str = ts_str[:-1] + "+00:00"
            dt = datetime.fromisoformat(ts_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=now.tzinfo)
            else:
                dt = dt.astimezone(now.tzinfo)
            amount = int(float(item.get("amount") or 0))
            is_walkin = (
                item.get("saleSource") == "WALK_IN"
                or item.get("source") == "WALK_IN"
                or item.get("type") == "walkin_sale"
                or str(item.get("reference", "")).startswith("BC-SALE-")
                or str(item.get("orderId", "")).startswith("BC-SALE-")
            )
            paid_entries.append({"dt": dt, "amount": amount, "item": item, "is_walkin": is_walkin})
        except Exception:
            continue

    period = (period or "today").strip().lower()
    source = (source or "all").strip().lower()
    total_sales = 0
    total_orders = 0
    online_sales = 0
    online_orders = 0
    walkin_sales = 0
    walkin_orders = 0
    breakdown = []
    prev_total_sales = 0

    if period == "today":
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_today = start_of_today + timedelta(days=1)
        start_of_prev = start_of_today - timedelta(days=1)
        end_of_prev = start_of_today

        hourly_data = {h: {"sales": 0, "orders": 0} for h in range(24)}
        for entry in paid_entries:
            edt = entry["dt"]
            is_w = entry["is_walkin"]
            amt = entry["amount"]
            if start_of_today <= edt < end_of_today:
                if is_w:
                    walkin_sales += amt
                    walkin_orders += 1
                else:
                    online_sales += amt
                    online_orders += 1

                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue

                hourly_data[edt.hour]["sales"] += amt
                hourly_data[edt.hour]["orders"] += 1
                total_sales += amt
                total_orders += 1
            elif start_of_prev <= edt < end_of_prev:
                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue
                prev_total_sales += amt

        for h in range(24):
            if h == 0:
                label = "12 AM"
            elif h < 12:
                label = f"{h} AM"
            elif h == 12:
                label = "12 PM"
            else:
                label = f"{h - 12} PM"
            breakdown.append({
                "label": label,
                "hour": h,
                "sales": hourly_data[h]["sales"],
                "orders": hourly_data[h]["orders"]
            })

    elif period == "week":
        start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=7)
        start_of_prev = start_of_week - timedelta(days=7)
        end_of_prev = start_of_week

        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        daily_data = {d: {"sales": 0, "orders": 0} for d in range(7)}

        for entry in paid_entries:
            edt = entry["dt"]
            is_w = entry["is_walkin"]
            amt = entry["amount"]
            if start_of_week <= edt < end_of_week:
                if is_w:
                    walkin_sales += amt
                    walkin_orders += 1
                else:
                    online_sales += amt
                    online_orders += 1

                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue

                w_day = edt.weekday()
                daily_data[w_day]["sales"] += amt
                daily_data[w_day]["orders"] += 1
                total_sales += amt
                total_orders += 1
            elif start_of_prev <= edt < end_of_prev:
                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue
                prev_total_sales += amt

        for d in range(7):
            breakdown.append({
                "label": day_names[d],
                "day": d,
                "sales": daily_data[d]["sales"],
                "orders": daily_data[d]["orders"]
            })

    elif period == "month":
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            next_month = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            next_month = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

        if now.month == 1:
            prev_month = now.replace(year=now.year - 1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            prev_month = now.replace(month=now.month - 1, day=1, hour=0, minute=0, second=0, microsecond=0)

        num_days = (next_month - start_of_month).days
        month_abbr = now.strftime("%b")
        daily_data = {d: {"sales": 0, "orders": 0} for d in range(1, num_days + 1)}

        for entry in paid_entries:
            edt = entry["dt"]
            is_w = entry["is_walkin"]
            amt = entry["amount"]
            if start_of_month <= edt < next_month:
                if is_w:
                    walkin_sales += amt
                    walkin_orders += 1
                else:
                    online_sales += amt
                    online_orders += 1

                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue

                daily_data[edt.day]["sales"] += amt
                daily_data[edt.day]["orders"] += 1
                total_sales += amt
                total_orders += 1
            elif prev_month <= edt < start_of_month:
                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue
                prev_total_sales += amt

        for d in range(1, num_days + 1):
            breakdown.append({
                "label": f"{d} {month_abbr}",
                "day": d,
                "sales": daily_data[d]["sales"],
                "orders": daily_data[d]["orders"]
            })

    else:  # "year"
        start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        next_year = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_year = now.replace(year=now.year - 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        monthly_data = {m: {"sales": 0, "orders": 0} for m in range(1, 13)}

        for entry in paid_entries:
            edt = entry["dt"]
            is_w = entry["is_walkin"]
            amt = entry["amount"]
            if start_of_year <= edt < next_year:
                if is_w:
                    walkin_sales += amt
                    walkin_orders += 1
                else:
                    online_sales += amt
                    online_orders += 1

                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue

                monthly_data[edt.month]["sales"] += amt
                monthly_data[edt.month]["orders"] += 1
                total_sales += amt
                total_orders += 1
            elif prev_year <= edt < start_of_year:
                if source == "online" and is_w:
                    continue
                if (source == "walk_in" or source == "walkin") and not is_w:
                    continue
                prev_total_sales += amt

        for m in range(1, 13):
            breakdown.append({
                "label": month_names[m - 1],
                "month": m,
                "sales": monthly_data[m]["sales"],
                "orders": monthly_data[m]["orders"]
            })

    avg_order_value = int(round(total_sales / total_orders)) if total_orders > 0 else 0

    comparison = None
    if prev_total_sales > 0:
        pct_diff = int(round(((total_sales - prev_total_sales) / prev_total_sales) * 100))
        comparison = f"{'+' if pct_diff >= 0 else ''}{pct_diff}% compared with previous period"

    return {
        "period": period,
        "source": source,
        "totalSales": total_sales,
        "totalOrders": total_orders,
        "onlineSales": online_sales,
        "onlineOrders": online_orders,
        "walkinSales": walkin_sales,
        "walkinOrders": walkin_orders,
        "avgOrderValue": avg_order_value,
        "comparison": comparison,
        "breakdown": breakdown
    }


class PaymentHandler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Role, X-Admin-Name, X-User-Role")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Role, X-Admin-Name, X-User-Role")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_json(200, {"status": "ok", "service": "BloomCare Pharmacy Payment API", "currency": "UGX"})
            return

        # ADMIN ENDPOINTS
        if parsed.path == "/api/admin/users":
            is_admin, role, meta = is_admin_request(self.headers)
            if not is_admin:
                self.send_json(403, {"success": False, "message": "Access Denied: Administrative privileges required."})
                return
            users = read_users()
            self.send_json(200, {"success": True, "users": users, "total": len(users)})
            return

        if parsed.path == "/api/admin/audit-logs":
            is_admin, role, meta = is_admin_request(self.headers)
            if not is_admin:
                self.send_json(403, {"success": False, "message": "Access Denied: Administrative privileges required."})
                return
            logs = read_audit_logs()
            self.send_json(200, {"success": True, "auditLogs": logs, "total": len(logs)})
            return

        if parsed.path == "/api/admin/stats":
            is_admin, role, meta = is_admin_request(self.headers)
            if not is_admin:
                self.send_json(403, {"success": False, "message": "Access Denied: Administrative privileges required."})
                return
            users = read_users()
            stats = {
                "totalUsers": len(users),
                "activeUsers": len([u for u in users if u.get("status") == "active"]),
                "suspendedUsers": len([u for u in users if u.get("status") == "suspended"]),
                "deactivatedUsers": len([u for u in users if u.get("status") == "deactivated"]),
                "customers": len([u for u in users if u.get("role") == "customer"]),
                "pharmacists": len([u for u in users if u.get("role") == "pharmacist"]),
                "staff": len([u for u in users if u.get("role") in {"assistant_pharmacist", "delivery_person", "pharmacist"}])
            }
            self.send_json(200, {"success": True, "stats": stats})
            return

        if parsed.path == "/api/admin/sales-analytics":
            is_admin, role, meta = is_admin_request(self.headers)
            if not is_admin:
                self.send_json(403, {"success": False, "message": "Access Denied: Administrative privileges required."})
                return
            query_params = parse_qs(parsed.query)
            period = query_params.get("period", ["today"])[0]
            source = query_params.get("source", ["all"])[0]
            data = get_sales_analytics(period, source=source)
            self.send_json(200, {"success": True, **data})
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

        # ADMIN ENDPOINTS (Restricted to Admin & Developer)
        if parsed.path.startswith("/api/admin/"):
            is_admin, admin_role, admin_meta = is_admin_request(self.headers)
            if not is_admin:
                self.send_json(403, {"success": False, "message": "Access Denied: Administrative privileges required."})
                return

            admin_name = admin_meta.get("name", "Dr. Admin Mugisha")

            if parsed.path == "/api/admin/users":
                name = str(payload.get("name", "")).strip()
                email = str(payload.get("email", "")).strip().lower()
                role = str(payload.get("role", "customer")).strip().lower()
                phone = str(payload.get("phone", "")).strip()
                status = str(payload.get("status", "active")).strip().lower()
                if not name or not email:
                    self.send_json(422, {"success": False, "message": "User name and email are required."})
                    return
                with LOCK:
                    users = read_users()
                    if any(u.get("email", "").lower() == email for u in users):
                        self.send_json(409, {"success": False, "message": f"A user with email {email} already exists."})
                        return
                    new_user = {
                        "id": payload.get("id") or f"usr-{int(time.time() * 1000)}",
                        "name": name,
                        "displayName": name,
                        "email": email,
                        "phone": phone,
                        "role": role,
                        "status": status,
                        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "lastLogin": "Never",
                        "permissions": payload.get("permissions", [])
                    }
                    users.append(new_user)
                    write_users(users)
                record_audit_log(admin_name, admin_role, "USER_CREATED", name, new_user["id"], f"Created user {name} ({email}) with role {role} and status {status}")
                self.send_json(201, {"success": True, "user": new_user, "message": f"User {name} created successfully."})
                return

            if parsed.path == "/api/admin/users/role":
                user_id = str(payload.get("userId", "")).strip()
                new_role = str(payload.get("role", "")).strip().lower()
                if not user_id or not new_role:
                    self.send_json(422, {"success": False, "message": "userId and role are required."})
                    return
                updated_user = None
                old_role = ""
                with LOCK:
                    users = read_users()
                    for u in users:
                        if u.get("id") == user_id or u.get("uid") == user_id:
                            old_role = u.get("role", "user")
                            u["role"] = new_role
                            u["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                            updated_user = u
                            break
                    if updated_user:
                        write_users(users)
                if not updated_user:
                    self.send_json(404, {"success": False, "message": "User not found."})
                    return
                record_audit_log(admin_name, admin_role, "USER_ROLE_CHANGED", updated_user.get("name", user_id), user_id, f"Role changed from {old_role} to {new_role}")
                self.send_json(200, {"success": True, "user": updated_user, "message": f"Role updated to {new_role}."})
                return

            if parsed.path == "/api/admin/users/status":
                user_id = str(payload.get("userId", "")).strip()
                new_status = str(payload.get("status", "")).strip().lower()
                reason = str(payload.get("reason", "")).strip()
                duration = str(payload.get("duration", "")).strip()
                if not user_id or new_status not in {"active", "suspended", "deactivated"}:
                    self.send_json(422, {"success": False, "message": "Valid userId and status (active, suspended, deactivated) are required."})
                    return
                updated_user = None
                old_status = ""
                with LOCK:
                    users = read_users()
                    for u in users:
                        if u.get("id") == user_id or u.get("uid") == user_id:
                            old_status = u.get("status", "active")
                            u["status"] = new_status
                            u["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                            if new_status == "suspended":
                                u["suspensionReason"] = reason or "Administrative Review"
                                u["suspensionDuration"] = duration or "Until manually restored"
                                u["suspendedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                            elif new_status == "active":
                                u.pop("suspensionReason", None)
                                u.pop("suspensionDuration", None)
                                u.pop("suspendedAt", None)
                            updated_user = u
                            break
                    if updated_user:
                        write_users(users)
                if not updated_user:
                    self.send_json(404, {"success": False, "message": "User not found."})
                    return
                action_name = "USER_SUSPENDED" if new_status == "suspended" else "USER_ACTIVATED" if new_status == "active" else "USER_DEACTIVATED"
                desc = f"Status changed from {old_status} to {new_status}"
                if reason:
                    desc += f". Reason: {reason} ({duration})"
                record_audit_log(admin_name, admin_role, action_name, updated_user.get("name", user_id), user_id, desc)
                self.send_json(200, {"success": True, "user": updated_user, "message": f"User status set to {new_status}."})
                return

            if parsed.path == "/api/admin/users/permissions":
                user_id = str(payload.get("userId", "")).strip()
                perms = payload.get("permissions", [])
                if not user_id or not isinstance(perms, list):
                    self.send_json(422, {"success": False, "message": "userId and permissions list are required."})
                    return
                updated_user = None
                with LOCK:
                    users = read_users()
                    for u in users:
                        if u.get("id") == user_id or u.get("uid") == user_id:
                            u["permissions"] = perms
                            u["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                            updated_user = u
                            break
                    if updated_user:
                        write_users(users)
                if not updated_user:
                    self.send_json(404, {"success": False, "message": "User not found."})
                    return
                record_audit_log(admin_name, admin_role, "PERMISSION_CHANGED", updated_user.get("name", user_id), user_id, f"Permissions updated: {', '.join(perms) if perms else 'Default role permissions'}")
                self.send_json(200, {"success": True, "user": updated_user, "message": "Permissions updated successfully."})
                return

            if parsed.path == "/api/admin/users/reset-password":
                email = str(payload.get("email", "")).strip().lower()
                user_name = str(payload.get("name", email)).strip()
                if not email:
                    self.send_json(422, {"success": False, "message": "User email is required."})
                    return
                record_audit_log(admin_name, admin_role, "PASSWORD_RESET_SENT", user_name, "", f"Administrative password reset link dispatched to {email}")
                self.send_json(200, {"success": True, "message": f"Password reset link dispatched to {email}."})
                return

            if parsed.path == "/api/admin/users/bulk":
                action = str(payload.get("action", "")).strip().lower()
                user_ids = payload.get("userIds", [])
                target_role = str(payload.get("role", "")).strip().lower()
                reason = str(payload.get("reason", "")).strip()
                if not user_ids or not isinstance(user_ids, list):
                    self.send_json(422, {"success": False, "message": "List of userIds is required."})
                    return
                affected_count = 0
                with LOCK:
                    users = read_users()
                    for u in users:
                        uid = u.get("id") or u.get("uid")
                        if uid in user_ids:
                            if action == "activate":
                                u["status"] = "active"
                                u.pop("suspensionReason", None)
                                u.pop("suspensionDuration", None)
                            elif action == "deactivate":
                                u["status"] = "deactivated"
                            elif action == "suspend":
                                u["status"] = "suspended"
                                u["suspensionReason"] = reason or "Bulk Administrative Suspension"
                                u["suspensionDuration"] = "Until manually restored"
                            elif action == "assign_role" and target_role:
                                u["role"] = target_role
                            u["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                            affected_count += 1
                    if affected_count > 0:
                        write_users(users)
                record_audit_log(admin_name, admin_role, f"BULK_{action.upper()}", f"{affected_count} Users", "", f"Bulk {action} performed on {affected_count} accounts")
                self.send_json(200, {"success": True, "affected": affected_count, "message": f"Bulk {action} applied to {affected_count} users."})
                return

            if parsed.path == "/api/admin/audit-logs":
                action = str(payload.get("action", "ADMIN_ACTION")).strip()
                target_user = str(payload.get("affectedUser", "System")).strip()
                target_id = str(payload.get("affectedUserId", "")).strip()
                desc = str(payload.get("description", "")).strip()
                entry = record_audit_log(admin_name, admin_role, action, target_user, target_id, desc)
                self.send_json(201, {"success": True, "log": entry})
                return

            self.send_json(404, {"success": False, "message": "Admin endpoint not found."})
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
