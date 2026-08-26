import unittest

from server.payment_api import (
    REFERENCE_PATTERN,
    normalize_phone,
    validated_appointment,
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

    def test_accepts_a_supported_appointment(self):
        appointment, errors = validated_appointment({
            "patientId": "patient-1",
            "service": "Pregnancy Consultation",
            "provider": "Dr. Amina Nanyonga",
            "date": "2999-01-01",
            "time": "09:00 AM",
            "facility": "Kampala Women's Health Centre",
            "untrustedField": "must not be stored",
        })
        self.assertEqual(errors, {})
        self.assertNotIn("untrustedField", appointment)

    def test_rejects_unsupported_or_past_appointment_values(self):
        appointment, errors = validated_appointment({
            "patientId": "patient-1",
            "service": "Free appointment",
            "provider": "Anyone",
            "date": "2020-01-01",
            "time": "Midnight",
            "facility": "Anywhere",
        })
        self.assertIsNone(appointment)
        self.assertIn("appointment.service", errors)
        self.assertIn("appointment.date", errors)


if __name__ == "__main__":
    unittest.main()
