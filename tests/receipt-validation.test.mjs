import assert from 'node:assert/strict';
import test from 'node:test';

function generateOrderReference(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `BC-${year}${month}${day}-${rand}`;
}

function calculateReceiptTotals(orderItems, fulfillmentType = 'delivery', flatDeliveryFee = 5000) {
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = fulfillmentType === 'pickup' ? 0 : (orderItems.length > 0 ? flatDeliveryFee : 0);
  const total = subtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    total,
    itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}

function validateCheckoutInputs({ cart, name, email, phone, fulfillmentType, address }) {
  if (!cart || cart.length === 0) {
    return { valid: false, error: 'Cart is empty' };
  }
  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Missing customer name' };
  }
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Invalid email' };
  }
  if (!phone || phone.trim().length < 9) {
    return { valid: false, error: 'Invalid phone number' };
  }
  if (fulfillmentType === 'delivery' && (!address || address.trim().length < 3)) {
    return { valid: false, error: 'Missing delivery address' };
  }
  return { valid: true };
}

test('generates unique order reference in BC-YYYYMMDD-XXXXX format', () => {
  const ref = generateOrderReference(new Date('2026-09-03T12:00:00Z'));
  assert.match(ref, /^BC-20260903-\d{5}$/, 'Order reference must match BC-YYYYMMDD-XXXXX format');
});

test('calculates receipt subtotal, delivery fee and total correctly for home delivery', () => {
  const items = [
    { name: 'Paracetamol 500mg Tablets', quantity: 2, price: 5000 },
    { name: 'Amoxicillin 500mg Capsules', quantity: 1, price: 18000 }
  ];
  const receipt = calculateReceiptTotals(items, 'delivery', 5000);
  assert.equal(receipt.subtotal, 28000);
  assert.equal(receipt.deliveryFee, 5000);
  assert.equal(receipt.total, 33000);
  assert.equal(receipt.itemCount, 3);
});

test('calculates receipt totals correctly with zero delivery fee for pharmacy pickup', () => {
  const items = [
    { name: 'Vitamin C 500mg Tablets', quantity: 3, price: 12000 }
  ];
  const receipt = calculateReceiptTotals(items, 'pickup', 5000);
  assert.equal(receipt.subtotal, 36000);
  assert.equal(receipt.deliveryFee, 0);
  assert.equal(receipt.total, 36000);
  assert.equal(receipt.itemCount, 3);
});

test('validates required checkout information before receipt generation', () => {
  const validOrder = {
    cart: [{ productId: 'P1', name: 'Paracetamol', price: 5000, quantity: 1 }],
    name: 'Grace Nakato',
    email: 'grace@example.com',
    phone: '0751234567',
    fulfillmentType: 'delivery',
    address: 'Plot 14, Bukoto, Kampala'
  };

  assert.equal(validateCheckoutInputs(validOrder).valid, true);

  // Missing cart
  assert.equal(validateCheckoutInputs({ ...validOrder, cart: [] }).valid, false);

  // Missing name
  assert.equal(validateCheckoutInputs({ ...validOrder, name: '' }).valid, false);

  // Missing delivery address when delivery chosen
  assert.equal(validateCheckoutInputs({ ...validOrder, address: '' }).valid, false);

  // Pickup does not require delivery address
  assert.equal(validateCheckoutInputs({ ...validOrder, fulfillmentType: 'pickup', address: '' }).valid, true);
});
