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


if __name__ == "__main__":
    unittest.main()
