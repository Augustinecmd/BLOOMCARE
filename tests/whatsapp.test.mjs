import test from "node:test";
import assert from "node:assert/strict";
import { createWhatsAppUrl, normalizeWhatsAppPhone, validateWhatsAppPhone } from "../BLOOMCARE-main/whatsapp.js";

test("formats Ugandan phone numbers for WhatsApp", () => {
  assert.equal(normalizeWhatsAppPhone("+256 751 234 567"), "256751234567");
  assert.deepEqual(validateWhatsAppPhone("0751234567").valid, true);
  assert.equal(validateWhatsAppPhone("07512345").valid, false);
});

test("creates an encoded wa.me inquiry URL", () => {
  const url = createWhatsAppUrl("0751234567");
  assert.equal(url, "https://wa.me/256751234567?text=Hello%20BloomCare%20Pharmacy%2C%20I%20would%20like%20to%20make%20an%20inquiry.");
});