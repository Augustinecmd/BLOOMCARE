import assert from "node:assert/strict";
import test from "node:test";

function calculateCartSummary(cartItems, flatDeliveryFee = 5000) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cartItems.length > 0 ? flatDeliveryFee : 0;
  const total = subtotal + deliveryFee;
  const requiresPrescription = cartItems.some(item => item.requiresPrescription);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    deliveryFee,
    total,
    requiresPrescription,
    totalItems
  };
}

test("calculates cart subtotals, delivery fees, and total accurately in UGX", () => {
  const items = [
    { productId: "BC-1", name: "Panadol Extra", price: 6500, quantity: 2, requiresPrescription: false },
    { productId: "BC-2", name: "Cetirizine 10mg", price: 8500, quantity: 1, requiresPrescription: false }
  ];

  const summary = calculateCartSummary(items, 5000);
  assert.equal(summary.subtotal, 21500); // (6500 * 2) + 8500 = 21500
  assert.equal(summary.deliveryFee, 5000);
  assert.equal(summary.total, 26500);
  assert.equal(summary.totalItems, 3);
  assert.equal(summary.requiresPrescription, false);
});

test("detects when prescription items are present in cart", () => {
  const items = [
    { productId: "BC-1", name: "Panadol Extra", price: 6500, quantity: 1, requiresPrescription: false },
    { productId: "BC-2", name: "Amoxicillin 500mg", price: 18000, quantity: 1, requiresPrescription: true }
  ];

  const summary = calculateCartSummary(items, 5000);
  assert.equal(summary.subtotal, 24500);
  assert.equal(summary.requiresPrescription, true);
});

test("handles empty cart correctly", () => {
  const summary = calculateCartSummary([]);
  assert.equal(summary.subtotal, 0);
  assert.equal(summary.deliveryFee, 0);
  assert.equal(summary.total, 0);
  assert.equal(summary.totalItems, 0);
  assert.equal(summary.requiresPrescription, false);
});

