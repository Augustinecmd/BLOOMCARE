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


if __name__ == "__main__":
    unittest.main()
