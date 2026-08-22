import unittest

from server.payment_api import (
    REFERENCE_PATTERN,
    normalize_phone,
    validation_errors_for_initialize,
)


class PaymentValidationTests(unittest.TestCase):
    def test_normalizes_international_phone(self):
        self.assertEqual(normalize_phone("+256 751234567"), "0751234567")
        self.assertEqual(normalize_phone("075 123 4567"), "0751234567")

    def test_rejects_invalid_initialize_payload(self):
        errors = validation_errors_for_initialize({"provider": "Unknown", "phone": "074159206"})
        self.assertIn("provider", errors)
        self.assertIn("phone", errors)

    def test_accepts_valid_initialize_payload(self):
        self.assertEqual(validation_errors_for_initialize({"provider": "MTN MoMo", "phone": "+256751234567"}), {})

    def test_payment_reference_shape_is_strict(self):
        self.assertIsNotNone(REFERENCE_PATTERN.fullmatch("BC-20260821-ABCDEF12"))
        self.assertIsNone(REFERENCE_PATTERN.fullmatch("anything"))


if __name__ == "__main__":
    unittest.main()
