import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeUgandanPhone,
  validateUgandanPhone,
  validateEmail,
  validatePassword,
  validateName,
  validateProduct,
  validateOrder,
  validatePrescription,
  validatePrescriptionFile,
  validateConsultation,
  validateRefill,
  validateStockAdjustment
} from "../validators.js";

test("accepts and normalizes valid Ugandan phone numbers", () => {
  for (const phone of ["0741592069", "0786426344", "0751234567", "0771234567", "+256741592069", "+256786426344", "075 123 4567"]) {
    assert.equal(validateUgandanPhone(phone).valid, true, phone);
  }
  assert.equal(normalizeUgandanPhone("+256751234567"), "0751234567");
  assert.equal(normalizeUgandanPhone("075 123 4567"), "0751234567");
});

test("rejects invalid Ugandan phone numbers", () => {
  for (const phone of ["074159206", "741592069", "07415920699", "0841592069", "07415ABC69", "abcdefghij"]) {
    assert.equal(validateUgandanPhone(phone).valid, false, phone);
  }
});

test("validates email, password, and customer names", () => {
  assert.equal(validateEmail("care@bloomcare.com").valid, true);
  assert.equal(validateEmail("user@").valid, false);
  assert.equal(validatePassword("WeakPass").valid, false);
  assert.equal(validatePassword("BloomCare2026!").valid, true);
  assert.equal(validateName("Grace Nakato").valid, true);
  assert.equal(validateName("12345").valid, false);
});

test("validates pharmacy products and prices", () => {
  assert.equal(validateProduct({ name: "Panadol Extra", category: "Pain Relief", price: 6500, stockQuantity: 50 }).valid, true);
  assert.equal(validateProduct({ name: "", category: "Pain Relief", price: 6500 }).valid, false);
  assert.equal(validateProduct({ name: "Panadol", category: "Pain Relief", price: -100 }).valid, false);
});

test("validates customer orders and cart checkout", () => {
  const validOrder = {
    customerName: "Grace Nakato",
    customerPhone: "0751234567",
    deliveryAddress: "Bukoto, Kampala",
    items: [{ productId: "BC-1", name: "Amoxicillin", price: 18000, quantity: 1 }],
    total: 23000
  };
  assert.equal(validateOrder(validOrder).valid, true);
  assert.equal(validateOrder({ ...validOrder, items: [] }).valid, false);
  assert.equal(validateOrder({ ...validOrder, deliveryAddress: "" }).valid, false);
});

test("validates prescriptions, consultations, and refills", () => {
  assert.equal(validatePrescription({ customerId: "user-1", notes: "Amoxicillin 500mg TDS" }).valid, true);
  assert.equal(validatePrescription({ customerId: "" }).valid, false);

  assert.equal(validateConsultation({
    consultationType: "Medication Consultation",
    pharmacist: "Dr. Amina",
    date: "2099-01-01",
    time: "10:00 AM"
  }).valid, true);

  assert.equal(validateRefill({ medicineName: "Amlodipine 5mg", quantity: 2 }).valid, true);
  assert.equal(validateRefill({ medicineName: "", quantity: 0 }).valid, false);

  assert.equal(validateStockAdjustment({ productId: "BC-1", type: "stock_in", quantity: 50 }).valid, true);
  assert.equal(validateStockAdjustment({ productId: "BC-1", type: "invalid_type", quantity: 50 }).valid, false);
});

test("validates PC prescription file uploads (images & PDF)", () => {
  // Valid PC files
  assert.equal(validatePrescriptionFile({ name: "dr_prescription.png", type: "image/png", size: 450000 }).valid, true);
  assert.equal(validatePrescriptionFile({ name: "dr_prescription.jpg", type: "image/jpeg", size: 950000 }).valid, true);
  assert.equal(validatePrescriptionFile({ name: "clinic_scan.pdf", type: "application/pdf", size: 1500000 }).valid, true);
  assert.equal(validatePrescriptionFile({ name: "photo.webp", type: "image/webp", size: 200000 }).valid, true);

  // Invalid PC files
  assert.equal(validatePrescriptionFile(null).valid, false);
  assert.equal(validatePrescriptionFile({ name: "notes.txt", type: "text/plain", size: 1000 }).valid, false);
  assert.equal(validatePrescriptionFile({ name: "virus.exe", type: "application/x-msdownload", size: 5000 }).valid, false);
  assert.equal(validatePrescriptionFile({ name: "huge_scan.pdf", type: "application/pdf", size: 15 * 1024 * 1024 }).valid, false); // > 10MB
});

