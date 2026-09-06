import json
import unittest
from server import payment_api


class TestPharmacyPaymentAPI(unittest.TestCase):
    def test_normalize_phone(self):
        self.assertEqual(payment_api.normalize_phone("+256751234567"), "0751234567")
        self.assertEqual(payment_api.normalize_phone("0772 123 456"), "0772123456")

    def test_validation_errors_for_initialize(self):
        errors = payment_api.validation_errors_for_initialize({
            "provider": "MTN MoMo",
            "phone": "0772123456",
            "amount": 26500
        })
        self.assertEqual(errors, {})

        errors_invalid = payment_api.validation_errors_for_initialize({
            "provider": "InvalidProvider",
            "phone": "123",
            "amount": -500
        })
        self.assertIn("provider", errors_invalid)
        self.assertIn("phone", errors_invalid)
        self.assertIn("amount", errors_invalid)

    def test_create_and_verify_pharmacy_payment(self):
        order_details = {
            "orderNumber": "BC-ORD-2026-9999",
            "customerName": "Grace Nakato",
            "items": [{"name": "Panadol Extra", "quantity": 2, "price": 6500}]
        }
        record = payment_api.create_payment("MTN MoMo", "0772123456", order_details, 26500)
        self.assertTrue(record["reference"].startswith("BC-"))
        self.assertTrue(record["receiptNumber"].startswith("RCP-"))
        self.assertEqual(record["status"], "PENDING")
        self.assertEqual(record["amount"], 26500)

        verified = payment_api.verify_payment(record["reference"])
        self.assertIsNotNone(verified)
        self.assertEqual(verified["status"], "SUCCESSFUL")
        self.assertTrue(verified["transactionId"].startswith("MM-UGX-"))


    def test_consultation_payment_workflow(self):
        # 1. Test validation for consultation fee
        consult_details = {
            "pharmacist": "Dr. Amina Nanyonga",
            "date": "2026-09-10",
            "time": "11:00 AM",
            "patientName": "Grace Nakato",
            "patientPhone": "0751234567"
        }

        # Valid consultation payment with Airtel Money
        errors_airtel = payment_api.validation_errors_for_initialize({
            "provider": "Airtel Money",
            "phone": "0751234567",
            "amount": 15000,
            "type": "consultation"
        })
        self.assertEqual(errors_airtel, {})

        # Valid consultation payment with MTN Mobile Money
        errors_mtn = payment_api.validation_errors_for_initialize({
            "provider": "MTN Mobile Money",
            "phone": "0772123456",
            "amount": 15000,
            "type": "consultation"
        })
        self.assertEqual(errors_mtn, {})

        # Rejects consultation with incorrect fee
        errors_bad_fee = payment_api.validation_errors_for_initialize({
            "provider": "Airtel Money",
            "phone": "0751234567",
            "amount": 5000,
            "type": "consultation"
        })
        self.assertIn("amount", errors_bad_fee)

        # Rejects Airtel Money with MTN number (carrier mismatch)
        errors_airtel_with_mtn = payment_api.validation_errors_for_initialize({
            "provider": "Airtel Money",
            "phone": "0771234567",
            "amount": 15000,
            "type": "consultation"
        })
        self.assertIn("phone", errors_airtel_with_mtn)
        self.assertEqual(
            errors_airtel_with_mtn["phone"],
            "Invalid Airtel number. Please enter a valid Airtel Uganda number beginning with 070, 074 or 075."
        )

        # Rejects MTN Mobile Money with Airtel number (carrier mismatch)
        errors_mtn_with_airtel = payment_api.validation_errors_for_initialize({
            "provider": "MTN Mobile Money",
            "phone": "0751234567",
            "amount": 15000,
            "type": "consultation"
        })
        self.assertIn("phone", errors_mtn_with_airtel)
        self.assertEqual(
            errors_mtn_with_airtel["phone"],
            "Invalid MTN number. Please enter a valid MTN Uganda number beginning with 076, 077 or 078."
        )

        # Rejects incomplete phone (< 10 digits)
        errors_incomplete = payment_api.validation_errors_for_initialize({
            "provider": "Airtel Money",
            "phone": "075123",
            "amount": 15000,
            "type": "consultation"
        })
        self.assertIn("phone", errors_incomplete)
        self.assertEqual(errors_incomplete["phone"], "Please enter a valid 10-digit Ugandan mobile number.")

        # 2. Test create consultation payment with Airtel Money
        record = payment_api.create_payment("Airtel Money", "0751234567", consult_details, 15000, payment_type="consultation")
        self.assertTrue(record["reference"].startswith("BC-CNS-"))
        self.assertEqual(record["amount"], 15000)
        self.assertEqual(record["provider"], "Airtel Money")
        self.assertEqual(record["status"], "PENDING")

        # 3. Test verification
        verified = payment_api.verify_payment(record["reference"])
        self.assertIsNotNone(verified)
        self.assertEqual(verified["status"], "SUCCESSFUL")
        self.assertTrue(verified["transactionId"].startswith("MM-UGX-"))
        self.assertIsNotNone(verified["verifiedAt"])

    def test_admin_authorization_headers(self):
        # Admin header
        is_admin, role, meta = payment_api.is_admin_request({"X-Admin-Role": "admin", "X-Admin-Name": "Dr. Admin Mugisha"})
        self.assertTrue(is_admin)
        self.assertEqual(role, "admin")
        self.assertEqual(meta.get("name"), "Dr. Admin Mugisha")

        # Developer header
        is_admin_dev, role_dev, _ = payment_api.is_admin_request({"X-User-Role": "developer"})
        self.assertTrue(is_admin_dev)
        self.assertEqual(role_dev, "developer")

        # Bearer token
        is_admin_bearer, role_bearer, _ = payment_api.is_admin_request({"Authorization": "Bearer admin"})
        self.assertTrue(is_admin_bearer)
        self.assertEqual(role_bearer, "admin")

        # Non-admin roles (customer, pharmacist, visitor) must be rejected
        for forbidden_role in ["customer", "pharmacist", "assistant_pharmacist", "delivery_person", "visitor"]:
            is_admin_bad, role_bad, _ = payment_api.is_admin_request({"X-Admin-Role": forbidden_role})
            self.assertFalse(is_admin_bad)

        # Empty headers
        is_admin_empty, _, _ = payment_api.is_admin_request({})
        self.assertFalse(is_admin_empty)

    def test_admin_users_and_audit_store(self):
        users = payment_api.read_users()
        self.assertIsInstance(users, list)
        self.assertGreater(len(users), 0)

        # Verify default roles exist
        roles = {u["role"] for u in users}
        self.assertIn("admin", roles)
        self.assertIn("pharmacist", roles)
        self.assertIn("customer", roles)

        # Test audit log creation
        log = payment_api.record_audit_log(
            admin_name="Dr. Admin Mugisha",
            admin_role="admin",
            action="TEST_ACTION",
            target_user="Grace Nakato",
            target_user_id="usr-cust-101",
            description="Automated unit test audit entry"
        )
        self.assertIsNotNone(log)
        self.assertEqual(log["action"], "TEST_ACTION")
        self.assertEqual(log["affectedUserId"], "usr-cust-101")

        recent_logs = payment_api.read_audit_logs()
        self.assertGreater(len(recent_logs), 0)
        self.assertEqual(recent_logs[0]["action"], "TEST_ACTION")

    def test_admin_http_endpoints_rbac_protection(self):
        import urllib.request
        import urllib.error

        base_url = "http://127.0.0.1:8787"

        # Check if local server is accessible
        try:
            with urllib.request.urlopen(f"{base_url}/health", timeout=2) as resp:
                if resp.status != 200:
                    return
        except Exception:
            return  # Skip live HTTP tests if server is offline

        # 1. Non-admin request to /api/admin/users should be rejected with 403 Forbidden
        req_unauth = urllib.request.Request(f"{base_url}/api/admin/users")
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req_unauth)
        self.assertEqual(ctx.exception.code, 403)

        # 2. Customer role request to /api/admin/users should be rejected with 403 Forbidden
        req_cust = urllib.request.Request(
            f"{base_url}/api/admin/users",
            headers={"X-Admin-Role": "customer"}
        )
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req_cust)
        self.assertEqual(ctx.exception.code, 403)

        # 3. Authorized admin request to /api/admin/users should return 200 OK
        req_admin = urllib.request.Request(
            f"{base_url}/api/admin/users",
            headers={"X-Admin-Role": "admin"}
        )
        with urllib.request.urlopen(req_admin) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data.get("success"))
            self.assertIsInstance(data.get("users"), list)

        # 4. Admin request to /api/admin/stats should return aggregated user counts
        req_stats = urllib.request.Request(
            f"{base_url}/api/admin/stats",
            headers={"X-Admin-Role": "admin"}
        )
        with urllib.request.urlopen(req_stats) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data.get("success"))
            stats = data.get("stats")
            self.assertIn("totalUsers", stats)
            self.assertIn("activeUsers", stats)
            self.assertIn("customers", stats)
            self.assertIn("pharmacists", stats)

        # 5. Admin request to /api/admin/audit-logs should return audit trail
        req_audit = urllib.request.Request(
            f"{base_url}/api/admin/audit-logs",
            headers={"X-Admin-Role": "admin"}
        )
        with urllib.request.urlopen(req_audit) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data.get("success"))
            self.assertIsInstance(data.get("auditLogs"), list)

        # 6. Admin POST /api/admin/users/status to suspend and restore test account
        suspend_payload = json.dumps({
            "userId": "usr-cust-202",
            "status": "suspended",
            "reason": "Test suspension from unit test",
            "duration": "7"
        }).encode("utf-8")
        req_suspend = urllib.request.Request(
            f"{base_url}/api/admin/users/status",
            data=suspend_payload,
            headers={"Content-Type": "application/json", "X-Admin-Role": "admin"}
        )
        with urllib.request.urlopen(req_suspend) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data.get("success"))
            self.assertEqual(data.get("user", {}).get("status"), "suspended")

        # Restore user back to active
        restore_payload = json.dumps({
            "userId": "usr-cust-202",
            "status": "active"
        }).encode("utf-8")
        req_restore = urllib.request.Request(
            f"{base_url}/api/admin/users/status",
            data=restore_payload,
            headers={"Content-Type": "application/json", "X-Admin-Role": "admin"}
        )
        with urllib.request.urlopen(req_restore) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data.get("success"))
            self.assertEqual(data.get("user", {}).get("status"), "active")

    def test_delivery_auto_assignment_and_notifications(self):
        # 1. Test finding eligible delivery driver
        driver = payment_api.find_eligible_delivery_man()
        self.assertIsNotNone(driver)
        self.assertIn("name", driver)
        self.assertIn("id", driver)
        self.assertEqual(driver.get("role"), "delivery_person")

        # 2. Test auto assigning an online customer order
        test_order = {
            "orderNumber": "BC-TEST-AUTO-001",
            "paymentStatus": "PAID",
            "customerName": "Joan Atuhaire",
            "customerEmail": "joan@example.com",
            "customerPhone": "0770123456",
            "deliveryDivision": "Mbarara City South",
            "deliveryArea": "Kakoba",
            "address": "Kakoba Central, Mbarara",
            "specificLocation": "Near Kakoba Market",
            "items": [{"name": "Amoxicillin 500mg", "quantity": 1, "price": 15000}],
            "total": 20000
        }
        res = payment_api.auto_assign_delivery("BC-TEST-AUTO-001", test_order)
        self.assertIsNotNone(res)
        self.assertEqual(res.get("orderNumber"), "BC-TEST-AUTO-001")
        self.assertEqual(res.get("status"), "ASSIGNED")
        self.assertIsNotNone(res.get("deliveryManId"))
        driver_id = res["deliveryManId"]

        # 3. Verify notification created for delivery person (even without customer message)
        notifs = payment_api.read_notifications()
        driver_notif = next((n for n in notifs if n.get("orderId") == "BC-TEST-AUTO-001" and n.get("type") == "NEW_DELIVERY_ASSIGNED"), None)
        self.assertIsNotNone(driver_notif, "Delivery driver must receive NEW_DELIVERY_ASSIGNED notification")
        self.assertEqual(driver_notif.get("recipientId"), driver_id)

        # 4. Verify atomic conversation creation
        convs = payment_api.read_conversations()
        conv = convs.get("CHAT-BC-TEST-AUTO-001")
        self.assertIsNotNone(conv, "1:1 Chat conversation must be created atomically upon assignment")
        self.assertEqual(conv.get("deliveryManId"), driver_id)

        # 5. Customer sends a message -> delivery driver gets NEW_CUSTOMER_MESSAGE notification
        msg_res = payment_api.add_message_to_conversation(
            order_id="BC-TEST-AUTO-001",
            sender_role="customer",
            sender_id="usr-test-cust",
            sender_name="Joan Atuhaire",
            text="Please call when you reach the gate."
        )
        self.assertTrue(msg_res.get("success"))

        notifs_after_msg = payment_api.read_notifications()
        cust_msg_notif = next((n for n in notifs_after_msg if n.get("orderId") == "BC-TEST-AUTO-001" and n.get("type") == "NEW_CUSTOMER_MESSAGE"), None)
        self.assertIsNotNone(cust_msg_notif, "Driver must receive NEW_CUSTOMER_MESSAGE notification")

        # 6. Mark delivery complete
        status_res = payment_api.update_delivery_status(
            order_id="BC-TEST-AUTO-001",
            status="Delivered",
            updated_by=driver_id,
            notes="Handed over to customer"
        )
        self.assertTrue(status_res.get("success"))

        # Verify conversation marked COMPLETED
        convs_after_del = payment_api.read_conversations()
        conv_del = convs_after_del.get("CHAT-BC-TEST-AUTO-001")
        self.assertEqual(conv_del.get("status"), "COMPLETED")

        # 7. Test Driver Load Balancing (find driver with fewest active deliveries)
        next_driver = payment_api.find_eligible_delivery_man()
        self.assertIsNotNone(next_driver)

        # 8. Test Scenario C: When no driver is available (overload simulated)
        original_deliveries = payment_api.read_deliveries()
        try:
            active_drivers = [u for u in payment_api.read_users() if u.get("role") in {"delivery_person", "deliveryStaff"} and u.get("status", "active") == "active"]
            fake_deliveries = dict(original_deliveries)
            for d in active_drivers:
                d_id = d.get("id") or d.get("uid")
                for i in range(5):
                    k = f"DEL-OVERLOAD-{d_id}-{i}"
                    fake_deliveries[k] = {
                        "id": k,
                        "orderId": k,
                        "deliveryStaffId": d_id,
                        "status": "Assigned"
                    }
            payment_api.write_deliveries(fake_deliveries)

            overload_order = {
                "orderNumber": "BC-TEST-OVERLOAD-001",
                "paymentStatus": "PAID",
                "customerName": "Test Customer",
                "deliveryDivision": "Kamukuzi",
                "deliveryArea": "Kiyanja",
                "items": [{"name": "Panadol", "quantity": 1, "price": 5000}],
                "total": 10000
            }
            overload_res = payment_api.auto_assign_delivery("BC-TEST-OVERLOAD-001", overload_order)
            self.assertEqual(overload_res.get("status"), "WAITING_FOR_AVAILABLE_DELIVERY_MAN")
            self.assertIsNone(overload_res.get("deliveryManId"))

            notifs_overload = payment_api.read_notifications()
            admin_alert = next((n for n in notifs_overload if n.get("orderId") == "BC-TEST-OVERLOAD-001" and n.get("type") == "DELIVERY_ASSIGNMENT_PENDING"), None)
            self.assertIsNotNone(admin_alert, "Admin must receive DELIVERY_ASSIGNMENT_PENDING notification")
            self.assertEqual(admin_alert.get("role"), "admin")
        finally:
            payment_api.write_deliveries(original_deliveries)


if __name__ == "__main__":
    unittest.main()
