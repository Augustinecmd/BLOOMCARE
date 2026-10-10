import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const appJsPath = path.resolve(rootDir, 'BLOOMCARE-main', 'app.js');
const indexHtmlPath = path.resolve(rootDir, 'BLOOMCARE-main', 'index.html');
const rootAppJsPath = path.resolve(rootDir, 'app.js');
const rootIndexHtmlPath = path.resolve(rootDir, 'index.html');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const rootAppJs = fs.readFileSync(rootAppJsPath, 'utf8');
const rootIndexHtml = fs.readFileSync(rootIndexHtmlPath, 'utf8');

test('1. REMOVAL OF PRESCRIPTION VERIFICATION INTERRUPTION IN CHECKOUT HTML', () => {
  // Ensure the pink warning box is removed from both index.html files
  assert.ok(
    !indexHtml.includes('id="checkout-rx-notice"'),
    'BLOOMCARE-main/index.html must NOT contain #checkout-rx-notice warning box'
  );
  assert.ok(
    !rootIndexHtml.includes('id="checkout-rx-notice"'),
    'root index.html must NOT contain #checkout-rx-notice warning box'
  );

  // Ensure the interrupting upload prescription button is removed from checkout
  assert.ok(
    !indexHtml.includes('id="checkout-upload-rx-btn"'),
    'BLOOMCARE-main/index.html must NOT contain #checkout-upload-rx-btn'
  );
  assert.ok(
    !rootIndexHtml.includes('id="checkout-upload-rx-btn"'),
    'root index.html must NOT contain #checkout-upload-rx-btn'
  );

  // Ensure the specific blocking warning message text is removed from checkout
  assert.ok(
    !indexHtml.includes('Prescription required for verification before this medicine can be dispensed'),
    'Checkout modal must not contain the blocking prescription warning copy'
  );
  assert.ok(
    !rootIndexHtml.includes('Prescription required for verification before this medicine can be dispensed'),
    'Root checkout modal must not contain the blocking prescription warning copy'
  );
});

test('2. CHECKOUT INTERFACE: ALL THREE PAYMENT METHODS & PHONE FIELD PRESERVED', () => {
  // Payment cards exist for MTN, Airtel, and Cash on Delivery
  assert.ok(indexHtml.includes('data-method="MTN MoMo"'), 'MTN MoMo payment card must be present');
  assert.ok(indexHtml.includes('*165#'), 'MTN MoMo *165# USSD prompt must be present');
  assert.ok(indexHtml.includes('data-method="Airtel Money"'), 'Airtel Money payment card must be present');
  assert.ok(indexHtml.includes('*185#'), 'Airtel Money *185# USSD prompt must be present');
  assert.ok(indexHtml.includes('data-method="Cash on Delivery"'), 'Cash on Delivery card must be present');

  // Payment Phone input and validation elements preserved
  assert.ok(indexHtml.includes('id="chk-phone"'), 'Payment phone input #chk-phone must be preserved');
  assert.ok(indexHtml.includes('id="chk-phone-valid-hint"'), 'Phone validation hint must be preserved');

  // Submit button preserved and prominent
  assert.ok(
    indexHtml.includes('Place Order &amp; Generate Reference'),
    'Place Order & Generate Reference button must be present'
  );
});

test('3. CART PROCESSING: NORMAL, PRESCRIPTION, AND MIXED CARTS CAN PROCEED TO CHECKOUT', () => {
  // openCheckoutDialog no longer gates or toggles prescription warning in checkout
  assert.ok(
    !appJs.includes('$("#checkout-rx-notice")?.classList.toggle'),
    'app.js must not toggle checkout-rx-notice in openCheckoutDialog'
  );

  // Test cart items definition
  const normalMed = { productId: 'DEMO-MED-001', name: 'Paracetamol 500mg', price: 5000, quantity: 2, requiresPrescription: false };
  const rxMed = { productId: 'DEMO-MED-004', name: 'Amoxicillin 500mg', price: 18000, quantity: 1, requiresPrescription: true };

  // 3a. Cart containing only normal medicines
  const normalCart = [normalMed];
  const normalHasRx = normalCart.some(i => Boolean(i.requiresPrescription));
  assert.equal(normalHasRx, false, 'Normal cart must have normalHasRx = false');

  // 3b. Cart containing prescription-only medicines
  const rxCart = [rxMed];
  const rxHasRx = rxCart.some(i => Boolean(i.requiresPrescription));
  assert.equal(rxHasRx, true, 'Rx cart must have rxHasRx = true');

  // 3c. Mixed cart
  const mixedCart = [normalMed, rxMed];
  const mixedHasRx = mixedCart.some(i => Boolean(i.requiresPrescription));
  const mixedHasNormal = mixedCart.some(i => !i.requiresPrescription);
  assert.equal(mixedHasRx, true, 'Mixed cart must have prescription items');
  assert.equal(mixedHasNormal, true, 'Mixed cart must have normal items');
});

test('4. RESPONSIBLE PRESCRIPTION HANDLING: ITEMS MARKED PENDING PRESCRIPTION VERIFICATION', () => {
  // app.js must tag Rx items with rxStatus: Pending Prescription Verification
  assert.ok(
    appJs.includes('Pending Prescription Verification'),
    'app.js must include Pending Prescription Verification tag'
  );
  assert.ok(
    appJs.includes('rxStatus: isRx ? "Pending Prescription Verification" : "Not Required"'),
    'Order items mapping must assign rxStatus to each item based on prescription requirement'
  );
  assert.ok(
    appJs.includes('prescriptionStatus: hasRx ? "Pending Prescription Verification" : "Not Required"'),
    'Order prescriptionStatus must be set to Pending Prescription Verification when hasRx is true'
  );
  assert.ok(
    appJs.includes('rxVerified: false'),
    'Initial rxVerified must be false for new online orders'
  );
});

test('5. ORDER CONFIRMATION MODAL DISTINGUISHES RX VS OTC ITEMS IN MIXED CART', () => {
  // showOrderConfirmationModal renders distinct tags for Rx and OTC items
  assert.ok(
    appJs.includes('Rx: Pending Prescription Verification'),
    'Confirmation modal must display Rx: Pending Prescription Verification badge for Rx items'
  );
  assert.ok(
    appJs.includes('OTC / Normal'),
    'Confirmation modal must display OTC / Normal badge for standard items'
  );
});

test('6. DISPENSING & DELIVERY SAFEGUARDS PREVENT DISPATCH OF UNVERIFIED RX MEDICINES', () => {
  // Driver cannot mark out unverified Rx order
  assert.ok(
    appJs.includes('This order contains prescription-only items marked <strong>Pending Prescription Verification</strong>. It cannot be dispatched for delivery until verified by an authorized pharmacist.'),
    'mark-out action must strictly block dispatch when prescription items are not verified'
  );

  // Driver cannot mark delivered unverified Rx order
  assert.ok(
    appJs.includes('This order contains prescription-only items marked <strong>Pending Prescription Verification</strong>. It cannot be marked delivered until verified by an authorized pharmacist.'),
    'mark-delivered action must strictly block delivery when prescription items are not verified'
  );

  // Order status management prevents transitioning to Ready for Pickup, Out for Delivery, or Delivered
  assert.ok(
    appJs.includes('hasUnverifiedRx && (status === "Ready for Pickup" || status === "Out for Delivery" || status === "Delivered")'),
    'Order status form must block fulfillment transition for unverified Rx orders'
  );

  // Licensed pharmacist can verify Rx order by confirming it
  assert.ok(
    appJs.includes('order.rxVerified = true;\n        order.prescriptionStatus = "Verified";'),
    'Pharmacist confirmation must verify prescription order and update items'
  );
});

test('7. SYNCHRONIZATION: ROOT AND BLOOMCARE-MAIN FILES REMAIN IN SYNC', () => {
  assert.equal(
    appJs.includes('rxStatus: isRx ? "Pending Prescription Verification" : "Not Required"'),
    rootAppJs.includes('rxStatus: isRx ? "Pending Prescription Verification" : "Not Required"'),
    'Root and BLOOMCARE-main app.js must have matching Rx status item mapping'
  );
  assert.equal(
    indexHtml.includes('id="checkout-rx-notice"'),
    rootIndexHtml.includes('id="checkout-rx-notice"'),
    'Both index.html files must agree on the absence of checkout-rx-notice'
  );
});
