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


if __name__ == "__main__":
    unittest.main()
