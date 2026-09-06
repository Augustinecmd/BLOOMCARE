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
DELIVERIES_FILE = Path(__file__).parent / "data" / "deliveries.json"
ASSIGNMENTS_FILE = Path(__file__).parent / "data" / "delivery_assignments.json"
CONVERSATIONS_FILE = Path(__file__).parent / "data" / "conversations.json"
NOTIFICATIONS_FILE = Path(__file__).parent / "data" / "notifications.json"
MAX_ACTIVE_DELIVERIES_PER_DRIVER = 5
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
        "id": "usr-staff-6",
        "name": "Paul Ssemwogerere",
        "email": "paul.s@bloomcare.com",
        "phone": "0700000006",
        "role": "delivery_person",
        "status": "active",
        "createdAt": "2026-02-20T11:00:00Z",
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


def read_json_store(file_path: Path, default_val: object) -> object:
    if not file_path.exists():
        return default_val
    try:
        with file_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
            return data
    except Exception:
        return default_val


def write_json_store(file_path: Path, data: object) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = file_path.with_suffix(".tmp")
    for attempt in range(5):
        try:
            with temp_path.open("w", encoding="utf-8") as file:
                json.dump(data, file, indent=2)
            temp_path.replace(file_path)
            return
        except PermissionError:
            if attempt == 4:
                try:
                    with file_path.open("w", encoding="utf-8") as file:
                        json.dump(data, file, indent=2)
                    if temp_path.exists():
                        temp_path.unlink()
                    return
                except Exception as inner_exc:
                    raise RuntimeError(f"Failed to write store {file_path}: {inner_exc}") from inner_exc
            time.sleep(0.06)
        except Exception as exc:
            if temp_path.exists():
                temp_path.unlink()
            raise RuntimeError(f"Failed to write store {file_path}: {exc}") from exc


def read_deliveries() -> dict:
    return read_json_store(DELIVERIES_FILE, {})


def write_deliveries(data: dict) -> None:
    write_json_store(DELIVERIES_FILE, data)


def read_assignments() -> dict:
    return read_json_store(ASSIGNMENTS_FILE, {})


def write_assignments(data: dict) -> None:
    write_json_store(ASSIGNMENTS_FILE, data)


def read_conversations() -> dict:
    return read_json_store(CONVERSATIONS_FILE, {})


def write_conversations(data: dict) -> None:
    write_json_store(CONVERSATIONS_FILE, data)


def read_notifications() -> list[dict]:
    return read_json_store(NOTIFICATIONS_FILE, [])


def write_notifications(data: list[dict]) -> None:
    write_json_store(NOTIFICATIONS_FILE, data)


def create_notification_backend(notif: dict) -> dict:
    notifs = read_notifications()
    now_iso = datetime.now(timezone.utc).isoformat()
    new_notif = {
        "id": notif.get("id") or f"NOTIF-{int(time.time() * 1000)}-{secrets.token_hex(2).upper()}",
        "recipientId": notif.get("recipientId"),
        "role": notif.get("role", "delivery_person"),
        "type": notif.get("type", "info"),
        "orderId": notif.get("orderId"),
        "conversationId": notif.get("conversationId"),
        "title": notif.get("title", "Notification"),
        "message": notif.get("message", ""),
        "customerName": notif.get("customerName", ""),
        "deliveryArea": notif.get("deliveryArea", ""),
        "deliveryLocation": notif.get("deliveryLocation", ""),
        "landmark": notif.get("landmark", ""),
        "deliveryFee": notif.get("deliveryFee", 5000),
        "read": False,
        "createdAt": notif.get("createdAt") or now_iso
    }
    notifs.insert(0, new_notif)
    write_notifications(notifs[:500])
    return new_notif


def find_eligible_delivery_man(customer_division: str = "", customer_area: str = "") -> dict | None:
    users = read_users()
    active_drivers = [
        u for u in users
        if u.get("role") in {"delivery_person", "deliveryStaff"}
        and str(u.get("status", "")).lower() == "active"
    ]
    if not active_drivers:
        return None

    # Count active deliveries for each driver
    deliveries = read_deliveries()
    active_counts = {u.get("id") or u.get("uid"): 0 for u in active_drivers}

    deliv_items = deliveries.values() if isinstance(deliveries, dict) else deliveries
    for item in deliv_items:
        status = str(item.get("status", "")).strip().lower()
        if status not in {"delivered", "cancelled", "failed"}:
            staff_id = item.get("deliveryStaffId") or item.get("deliveryManId")
            if staff_id in active_counts:
                active_counts[staff_id] += 1

    # Filter drivers below the configured active-delivery limit
    eligible_drivers = [
        d for d in active_drivers
        if active_counts.get(d.get("id") or d.get("uid"), 0) < MAX_ACTIVE_DELIVERIES_PER_DRIVER
    ]
    if not eligible_drivers:
        return None

    # Prefer Delivery Man with fewest active deliveries; tie-break deterministically by ID
    eligible_drivers.sort(key=lambda d: (
        active_counts.get(d.get("id") or d.get("uid"), 0),
        d.get("id") or d.get("uid", "")
    ))
    return eligible_drivers[0]


def auto_assign_delivery(order_id: str, order_data: dict) -> dict:
    with LOCK:
        assignments = read_assignments()
        order_key = str(order_id).strip()
        if not order_key:
            return {"status": "ERROR", "message": "orderId cannot be empty"}

        # Format items summary from items list if not provided
        items_list = order_data.get("items") or []
        if not order_data.get("itemsSummary") and items_list:
            order_data["itemsSummary"] = ", ".join(f"{i.get('quantity', 1)}x {i.get('name', 'Item')}" for i in items_list)

        # Check if already assigned (idempotent / prevent duplicate assignments)
        existing = assignments.get(order_key)
        if existing and existing.get("status") == "ASSIGNED" and existing.get("deliveryManId"):
            return existing

        # Check payment status: Payment must be verified before automated assignment
        payment_status = str(order_data.get("paymentStatus") or "").strip().upper()
        if payment_status not in {"SUCCESSFUL", "PAID"}:
            return {
                "orderId": order_key,
                "status": "PAYMENT_NOT_VERIFIED",
                "message": "Payment must be verified before automated delivery assignment."
            }

        now_iso = datetime.now(timezone.utc).isoformat()
        driver = find_eligible_delivery_man(
            order_data.get("deliveryDivision", ""),
            order_data.get("deliveryArea", "")
        )

        if not driver:
            # Scenario C: No available delivery man -> queue safely
            rec = {
                "orderId": order_key,
                "orderNumber": order_data.get("orderNumber", order_key),
                "customerId": order_data.get("customerId"),
                "customerName": order_data.get("customerName", "Customer"),
                "customerPhone": order_data.get("customerPhone", ""),
                "deliveryManId": None,
                "deliveryManName": None,
                "status": "WAITING_FOR_AVAILABLE_DELIVERY_MAN",
                "deliveryStatus": "WAITING_FOR_AVAILABLE_DELIVERY_MAN",
                "assignedAt": now_iso,
                "updatedAt": now_iso,
                "deliveryArea": order_data.get("deliveryArea", "Mbarara City"),
                "deliveryDivision": order_data.get("deliveryDivision", "Kamukuzi"),
                "deliveryLocation": order_data.get("specificLocation") or order_data.get("deliveryAddress", "Mbarara City"),
                "landmark": order_data.get("landmark", ""),
                "deliveryFee": order_data.get("deliveryFee", 5000),
                "itemsSummary": order_data.get("itemsSummary", ""),
                "items": items_list,
                "assignmentHistory": [
                    {
                        "timestamp": now_iso,
                        "action": "QUEUED_WAITING_FOR_DRIVER",
                        "status": "WAITING_FOR_AVAILABLE_DELIVERY_MAN"
                    }
                ]
            }
            assignments[order_key] = rec
            write_assignments(assignments)

            create_notification_backend({
                "role": "admin",
                "type": "DELIVERY_ASSIGNMENT_PENDING",
                "orderId": order_key,
                "title": "DELIVERY ASSIGNMENT PENDING",
                "message": f"Order #{order_key} is confirmed and paid, waiting for an available Delivery Man.",
                "read": False,
                "createdAt": now_iso
            })
            return rec

        driver_id = driver.get("id") or driver.get("uid")
        driver_name = driver.get("name") or driver.get("displayName") or "Moses Kato"
        driver_phone = driver.get("phone", "0700000005")

        history = (existing.get("assignmentHistory") if existing else None) or []
        history.append({
            "timestamp": now_iso,
            "action": "ASSIGNED",
            "deliveryManId": driver_id,
            "deliveryManName": driver_name
        })

        assignment = {
            "orderId": order_key,
            "orderNumber": order_data.get("orderNumber", order_key),
            "customerId": order_data.get("customerId"),
            "customerName": order_data.get("customerName", "Customer"),
            "customerPhone": order_data.get("customerPhone", ""),
            "deliveryManId": driver_id,
            "deliveryManName": driver_name,
            "deliveryManPhone": driver_phone,
            "deliveryArea": order_data.get("deliveryArea", "Mbarara City"),
            "deliveryDivision": order_data.get("deliveryDivision", "Kamukuzi"),
            "deliveryLocation": order_data.get("specificLocation") or order_data.get("deliveryAddress", "Mbarara City"),
            "landmark": order_data.get("landmark", ""),
            "deliveryFee": order_data.get("deliveryFee", 5000),
            "itemsSummary": order_data.get("itemsSummary", ""),
            "items": items_list,
            "status": "ASSIGNED",
            "deliveryStatus": "ASSIGNED",
            "assignedAt": now_iso,
            "updatedAt": now_iso,
            "assignmentHistory": history
        }
        assignments[order_key] = assignment
        write_assignments(assignments)

        # Update deliveries store
        deliveries = read_deliveries()
        del_key = f"DEL-{order_key}"
        deliveries[del_key] = {
            "id": del_key,
            "orderId": order_key,
            "orderNumber": order_data.get("orderNumber", order_key),
            "customerName": order_data.get("customerName", "Customer"),
            "phone": order_data.get("customerPhone", ""),
            "address": order_data.get("deliveryAddress", "Mbarara City"),
            "deliveryDivision": order_data.get("deliveryDivision", "Kamukuzi"),
            "deliveryArea": order_data.get("deliveryArea", "Kiyanja"),
            "landmark": order_data.get("landmark", ""),
            "itemsSummary": order_data.get("itemsSummary", ""),
            "items": items_list,
            "deliveryStaffId": driver_id,
            "deliveryStaffName": driver_name,
            "status": "Assigned",
            "createdAt": now_iso,
            "assignedAt": now_iso
        }
        write_deliveries(deliveries)

        # Automatically create ONE 1:1 conversation for this order
        conv_id = f"CHAT-{order_key}"
        conversations = read_conversations()
        if conv_id not in conversations:
            conversations[conv_id] = {
                "id": conv_id,
                "conversationId": conv_id,
                "orderId": order_key,
                "orderNumber": order_data.get("orderNumber", order_key),
                "customerId": order_data.get("customerId"),
                "customerName": order_data.get("customerName", "Customer"),
                "customerPhone": order_data.get("customerPhone", ""),
                "deliveryManId": driver_id,
                "deliveryManName": driver_name,
                "deliveryStatus": "ASSIGNED",
                "status": "ACTIVE",
                "unreadDelivery": 0,
                "unreadCustomer": 0,
                "lastMessage": None,
                "createdAt": now_iso,
                "updatedAt": now_iso,
                "messages": []
            }
        else:
            conversations[conv_id]["deliveryManId"] = driver_id
            conversations[conv_id]["deliveryManName"] = driver_name
            conversations[conv_id]["deliveryStatus"] = "ASSIGNED"
            conversations[conv_id]["updatedAt"] = now_iso
        write_conversations(conversations)

        # Delivery Man must be notified of the delivery itself!
        create_notification_backend({
            "recipientId": driver_id,
            "role": "delivery_person",
            "type": "NEW_DELIVERY_ASSIGNED",
            "orderId": order_key,
            "conversationId": conv_id,
            "title": "NEW DELIVERY ASSIGNED",
            "message": f"Order #{order_key} assigned to you in {order_data.get('deliveryArea', 'Mbarara')}.",
            "customerName": order_data.get("customerName", "Customer"),
            "deliveryArea": order_data.get("deliveryArea", ""),
            "deliveryLocation": order_data.get("specificLocation") or order_data.get("deliveryAddress", ""),
            "landmark": order_data.get("landmark", ""),
            "deliveryFee": order_data.get("deliveryFee", 5000),
            "read": False,
            "createdAt": now_iso
        })

        return assignment


def reassign_delivery(order_id: str, new_driver_id: str, admin_meta: dict) -> dict:
    with LOCK:
        assignments = read_assignments()
        order_key = str(order_id).strip()
        if order_key not in assignments:
            return {"success": False, "message": "Order delivery assignment not found."}

        users = read_users()
        new_driver = next((u for u in users if (u.get("id") == new_driver_id or u.get("uid") == new_driver_id)), None)
        if not new_driver or new_driver.get("role") not in {"delivery_person", "deliveryStaff"}:
            return {"success": False, "message": "Invalid delivery person account."}

        now_iso = datetime.now(timezone.utc).isoformat()
        prev_driver_id = assignments[order_key].get("deliveryManId")
        new_driver_name = new_driver.get("name") or new_driver.get("displayName")
        new_driver_phone = new_driver.get("phone", "")

        history = assignments[order_key].get("assignmentHistory") or []
        history.append({
            "timestamp": now_iso,
            "action": "REASSIGNED",
            "fromDeliveryManId": prev_driver_id,
            "toDeliveryManId": new_driver_id,
            "toDeliveryManName": new_driver_name
        })

        assignments[order_key]["deliveryManId"] = new_driver_id
        assignments[order_key]["deliveryManName"] = new_driver_name
        assignments[order_key]["deliveryManPhone"] = new_driver_phone
        assignments[order_key]["status"] = "ASSIGNED"
        assignments[order_key]["updatedAt"] = now_iso
        assignments[order_key]["assignmentHistory"] = history
        write_assignments(assignments)

        # Update delivery record
        deliveries = read_deliveries()
        del_key = f"DEL-{order_key}"
        if del_key in deliveries:
            deliveries[del_key]["deliveryStaffId"] = new_driver_id
            deliveries[del_key]["deliveryStaffName"] = new_driver_name
            deliveries[del_key]["status"] = "Assigned"
            deliveries[del_key]["updatedAt"] = now_iso
            write_deliveries(deliveries)

        # Update existing conversation without creating a duplicate
        conv_id = f"CHAT-{order_key}"
        conversations = read_conversations()
        if conv_id in conversations:
            conversations[conv_id]["deliveryManId"] = new_driver_id
            conversations[conv_id]["deliveryManName"] = new_driver_name
            conversations[conv_id]["updatedAt"] = now_iso
            write_conversations(conversations)

        # Notify the newly assigned driver
        create_notification_backend({
            "recipientId": new_driver_id,
            "role": "delivery_person",
            "type": "DELIVERY_REASSIGNED",
            "orderId": order_key,
            "conversationId": conv_id,
            "title": "DELIVERY REASSIGNED",
            "message": f"Order #{order_key} has been reassigned to you.",
            "read": False,
            "createdAt": now_iso
        })

        record_audit_log(
            admin_meta.get("name", "Dr. Admin Mugisha"),
            admin_meta.get("role", "admin"),
            "DELIVERY_REASSIGNED",
            new_driver_name,
            new_driver_id,
            f"Order #{order_key} reassigned from {prev_driver_id} to {new_driver_name}"
        )

        return {"success": True, "assignment": assignments[order_key]}


def update_delivery_status(order_id: str, status: str, updated_by: str = None, notes: str = "") -> dict:
    with LOCK:
        order_key = str(order_id).strip()
        new_status = str(status).strip()
        deliveries = read_deliveries()
        del_key = f"DEL-{order_key}"
        item = deliveries.get(del_key)
        if not item:
            for k, v in deliveries.items():
                if str(v.get("orderId")) == order_key or str(v.get("orderNumber")) == order_key:
                    item = v
                    del_key = k
                    break
        now_iso = datetime.now(timezone.utc).isoformat()
        if not item:
            item = {
                "id": del_key,
                "orderId": order_key,
                "orderNumber": order_key,
                "status": new_status,
                "createdAt": now_iso
            }
            deliveries[del_key] = item

        item["status"] = new_status
        item["updatedAt"] = now_iso
        if notes:
            item["notes"] = notes
        if new_status.lower() == "delivered":
            item["deliveredAt"] = now_iso
        write_deliveries(deliveries)

        assignments = read_assignments()
        if order_key in assignments:
            assignments[order_key]["deliveryStatus"] = new_status
            assignments[order_key]["status"] = new_status
            assignments[order_key]["updatedAt"] = now_iso
            write_assignments(assignments)

        conv_id = f"CHAT-{order_key}"
        conversations = read_conversations()
        if conv_id in conversations:
            conversations[conv_id]["deliveryStatus"] = new_status
            if new_status.lower() == "delivered":
                conversations[conv_id]["status"] = "COMPLETED"
            write_conversations(conversations)

        if new_status.lower() == "delivered":
            cust_id = assignments.get(order_key, {}).get("customerId") or item.get("customerId")
            if cust_id:
                create_notification_backend({
                    "recipientId": cust_id,
                    "role": "customer",
                    "type": "ORDER_DELIVERED",
                    "orderId": order_key,
                    "title": "ORDER DELIVERED",
                    "message": f"Your order #{order_key} has been successfully delivered. Thank you for choosing BloomCare Pharmacy!",
                    "read": False,
                    "createdAt": now_iso
                })

        return {"success": True, "delivery": item}


def add_message_to_conversation(order_id: str, sender_role: str, sender_id: str, sender_name: str, text: str, conversation_id: str = None) -> dict:
    order_key = str(order_id).strip()
    conv_id = conversation_id or f"CHAT-{order_key}"
    with LOCK:
        conversations = read_conversations()
        conv = conversations.get(conv_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        if not conv:
            assignments = read_assignments()
            assign = assignments.get(order_key, {})
            driver_id = assign.get("deliveryManId", "usr-staff-5")
            driver_name = assign.get("deliveryManName", "Moses Kato")
            conv = {
                "id": conv_id,
                "conversationId": conv_id,
                "orderId": order_key,
                "orderNumber": assign.get("orderNumber", order_key),
                "customerId": assign.get("customerId", sender_id if sender_role in {"customer", "patient"} else None),
                "customerName": assign.get("customerName", sender_name if sender_role in {"customer", "patient"} else "Customer"),
                "customerPhone": assign.get("customerPhone", ""),
                "deliveryManId": driver_id,
                "deliveryManName": driver_name,
                "deliveryStatus": assign.get("deliveryStatus", "ASSIGNED"),
                "status": "ACTIVE",
                "unreadDelivery": 0,
                "unreadCustomer": 0,
                "lastMessage": None,
                "createdAt": now_iso,
                "updatedAt": now_iso,
                "messages": []
            }
            conversations[conv_id] = conv

        msg_id = f"MSG-{int(time.time() * 1000)}"
        msg = {
            "id": msg_id,
            "senderId": sender_id,
            "senderRole": sender_role,
            "senderName": sender_name,
            "text": text,
            "timestamp": now_iso
        }
        conv["messages"].append(msg)
        conv["lastMessage"] = text
        conv["updatedAt"] = now_iso

        is_customer = sender_role in {"customer", "patient"} or sender_id == conv.get("customerId")
        if is_customer:
            conv["unreadDelivery"] = conv.get("unreadDelivery", 0) + 1
            driver_id = conv.get("deliveryManId")
            if driver_id:
                create_notification_backend({
                    "recipientId": driver_id,
                    "role": "delivery_person",
                    "type": "NEW_CUSTOMER_MESSAGE",
                    "orderId": order_key,
                    "conversationId": conv_id,
                    "title": "NEW CUSTOMER MESSAGE",
                    "message": f"New message from {sender_name} for order #{order_key}: \"{text[:60]}\"",
                    "customerName": sender_name,
                    "read": False,
                    "createdAt": now_iso
                })
        else:
            conv["unreadCustomer"] = conv.get("unreadCustomer", 0) + 1
            cust_id = conv.get("customerId")
            if cust_id:
                create_notification_backend({
                    "recipientId": cust_id,
                    "role": "customer",
                    "type": "NEW_DELIVERY_MESSAGE",
                    "orderId": order_key,
                    "conversationId": conv_id,
                    "title": "MESSAGE FROM DELIVERY MAN",
                    "message": f"{sender_name}: \"{text[:60]}\"",
                    "read": False,
                    "createdAt": now_iso
                })

        write_conversations(conversations)
        return {"success": True, "message": msg, "conversation": conv}


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

        if parsed.path == "/api/deliveries/assignments":
            query_params = parse_qs(parsed.query)
            order_id = query_params.get("orderId", [None])[0]
            assignments = read_assignments()
            if order_id:
                rec = assignments.get(str(order_id).strip())
                if not rec:
                    self.send_json(404, {"success": False, "message": "Assignment not found"})
                    return
                self.send_json(200, {"success": True, "assignment": rec})
                return
            self.send_json(200, {"success": True, "assignments": list(assignments.values()), "total": len(assignments)})
            return

        if parsed.path == "/api/deliveries":
            query_params = parse_qs(parsed.query)
            staff_id = query_params.get("staffId", [None])[0] or query_params.get("deliveryStaffId", [None])[0]
            deliveries = read_deliveries()
            del_list = list(deliveries.values()) if isinstance(deliveries, dict) else deliveries
            if staff_id:
                del_list = [d for d in del_list if d.get("deliveryStaffId") == staff_id or d.get("deliveryManId") == staff_id]
            self.send_json(200, {"success": True, "deliveries": del_list, "total": len(del_list)})
            return

        if parsed.path == "/api/notifications":
            query_params = parse_qs(parsed.query)
            user_id = query_params.get("userId", [None])[0]
            role = query_params.get("role", [None])[0]
            notifs = read_notifications()
            filtered = []
            for n in notifs:
                rec_id = n.get("recipientId") or n.get("userId")
                n_role = n.get("role")
                if user_id and rec_id and rec_id == user_id:
                    filtered.append(n)
                elif role and n_role and n_role == role:
                    filtered.append(n)
                elif not user_id and not role:
                    filtered.append(n)
            unread_count = len([n for n in filtered if not n.get("read")])
            self.send_json(200, {"success": True, "notifications": filtered, "unreadCount": unread_count, "total": len(filtered)})
            return

        if parsed.path == "/api/conversations":
            query_params = parse_qs(parsed.query)
            order_id = query_params.get("orderId", [None])[0]
            user_id = query_params.get("userId", [None])[0]
            conversations = read_conversations()
            conv_list = list(conversations.values())
            if order_id:
                conv_id = f"CHAT-{order_id}"
                c = conversations.get(conv_id) or next((x for x in conv_list if str(x.get("orderId")) == str(order_id)), None)
                if not c:
                    self.send_json(404, {"success": False, "message": "Conversation not found for order"})
                    return
                self.send_json(200, {"success": True, "conversation": c})
                return
            if user_id:
                conv_list = [c for c in conv_list if c.get("customerId") == user_id or c.get("deliveryManId") == user_id]
            self.send_json(200, {"success": True, "conversations": conv_list, "total": len(conv_list)})
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

            assignment = None
            if record.get("status") == "SUCCESSFUL" and record.get("paymentType") == "order":
                order_details = record.get("details") or {}
                order_id = str(order_details.get("orderId") or order_details.get("id") or record.get("orderId") or ref).strip()
                assign_payload = {
                    "orderNumber": order_details.get("orderNumber") or order_id,
                    "customerId": order_details.get("customerId"),
                    "customerName": order_details.get("customerName", "Customer"),
                    "customerPhone": order_details.get("customerPhone") or record.get("phone", ""),
                    "deliveryArea": order_details.get("deliveryArea") or order_details.get("area", "Mbarara City"),
                    "deliveryDivision": order_details.get("deliveryDivision") or order_details.get("division", "Kamukuzi"),
                    "deliveryLocation": order_details.get("specificLocation") or order_details.get("deliveryAddress") or order_details.get("address", "Mbarara City"),
                    "landmark": order_details.get("landmark", ""),
                    "deliveryFee": order_details.get("deliveryFee", 5000),
                    "itemsSummary": order_details.get("itemsSummary", ""),
                    "paymentStatus": "PAID"
                }
                assignment = auto_assign_delivery(order_id, assign_payload)

            self.send_json(200, {"success": True, "payment": record, "deliveryAssignment": assignment})
            return

        if parsed.path == "/api/deliveries/auto-assign":
            order_id = str(payload.get("orderId", "")).strip()
            order_data = payload.get("orderData", {})
            if not order_id:
                self.send_json(422, {"success": False, "message": "orderId is required"})
                return
            assignment = auto_assign_delivery(order_id, order_data)
            if assignment.get("status") == "PAYMENT_NOT_VERIFIED":
                self.send_json(400, {"success": False, "status": "PAYMENT_NOT_VERIFIED", "message": assignment.get("message")})
                return
            self.send_json(200, {"success": True, "assignment": assignment})
            return

        if parsed.path == "/api/deliveries/reassign":
            order_id = str(payload.get("orderId", "")).strip()
            delivery_man_id = str(payload.get("deliveryManId", "")).strip()
            if not order_id or not delivery_man_id:
                self.send_json(422, {"success": False, "message": "orderId and deliveryManId are required"})
                return
            _, admin_role, admin_meta = is_admin_request(self.headers)
            result = reassign_delivery(order_id, delivery_man_id, admin_meta or {"role": "admin", "name": "Dr. Admin Mugisha"})
            status_code = 200 if result.get("success") else 400
            self.send_json(status_code, result)
            return

        if parsed.path == "/api/deliveries/status":
            order_id = str(payload.get("orderId", "")).strip()
            new_status = str(payload.get("status", "")).strip()
            notes = str(payload.get("notes", "")).strip()
            if not order_id or not new_status:
                self.send_json(422, {"success": False, "message": "orderId and status are required"})
                return
            res = update_delivery_status(order_id, new_status, payload.get("updatedBy"), notes)
            self.send_json(200, res)
            return

        if parsed.path == "/api/notifications/mark-read":
            notif_id = payload.get("notificationId")
            user_id = payload.get("userId")
            role = payload.get("role")
            mark_all = payload.get("markAll", False)
            with LOCK:
                notifs = read_notifications()
                updated_count = 0
                for n in notifs:
                    if mark_all:
                        if (user_id and (n.get("recipientId") == user_id or n.get("userId") == user_id)) or (role and n.get("role") == role):
                            n["read"] = True
                            updated_count += 1
                    elif notif_id and n.get("id") == notif_id:
                        n["read"] = True
                        updated_count += 1
                        break
                write_notifications(notifs)
            self.send_json(200, {"success": True, "updatedCount": updated_count})
            return

        if parsed.path == "/api/conversations/messages":
            order_id = str(payload.get("orderId", "")).strip()
            sender_id = str(payload.get("senderId", "")).strip()
            sender_role = str(payload.get("senderRole", "")).strip().lower()
            sender_name = str(payload.get("senderName", "")).strip() or "User"
            text = str(payload.get("text", "")).strip()
            conv_id = payload.get("conversationId") or f"CHAT-{order_id}"

            if not order_id or not text:
                self.send_json(422, {"success": False, "message": "orderId and text are required"})
                return

            res = add_message_to_conversation(order_id, sender_role, sender_id, sender_name, text, conv_id)
            self.send_json(201, res)
            return

        if parsed.path == "/api/conversations/read":
            order_id = str(payload.get("orderId", "")).strip()
            user_role = str(payload.get("role", "")).strip().lower()
            conv_id = payload.get("conversationId") or f"CHAT-{order_id}"
            with LOCK:
                conversations = read_conversations()
                conv = conversations.get(conv_id)
                if conv:
                    if user_role in {"delivery_person", "deliverystaff", "delivery"}:
                        conv["unreadDelivery"] = 0
                    else:
                        conv["unreadCustomer"] = 0
                    write_conversations(conversations)
                    self.send_json(200, {"success": True, "conversation": conv})
                    return
            self.send_json(404, {"success": False, "message": "Conversation not found"})
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
