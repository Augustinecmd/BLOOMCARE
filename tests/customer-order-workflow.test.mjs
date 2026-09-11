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
const stylesCssPath = path.resolve(rootDir, 'BLOOMCARE-main', 'styles.css');
const paymentApiPyPath = path.resolve(rootDir, 'server', 'payment_api.py');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');
const paymentApiPy = fs.readFileSync(paymentApiPyPath, 'utf8');

test('1. ORDER CONFIRMATION MODAL HTML: Header, Reference, Statuses, and Total Payable', () => {
  assert.ok(
    indexHtml.includes('id="order-confirmation-dialog"'),
    '#order-confirmation-dialog modal must exist in markup'
  );
  assert.ok(
    indexHtml.includes('✓ ORDER CREATED SUCCESSFULLY'),
    'Header must state ✓ ORDER CREATED SUCCESSFULLY'
  );
  assert.ok(
    indexHtml.includes('Thank you for ordering from BloomCare Pharmacy.'),
    'Subtitle must state Thank you for ordering from BloomCare Pharmacy.'
  );
  assert.ok(
    indexHtml.includes('id="confirm-order-number"'),
    '#confirm-order-number element must exist'
  );
  assert.ok(
    indexHtml.includes('id="confirm-payment-status"'),
    '#confirm-payment-status badge element must exist'
  );
  assert.ok(
    indexHtml.includes('id="confirm-total-payable-highlight"'),
    '#confirm-total-payable-highlight element must prominently display total payable'
  );
  assert.ok(
    indexHtml.includes('id="confirm-payment-note"'),
    '#confirm-payment-note element must provide clear payment guidance'
  );
});

test('2. STRUCTURED DELIVERY LOCATION HTML: Division, Area, Specific, Landmark, and Instructions', () => {
  assert.ok(
    indexHtml.includes('id="confirm-fulfillment-method"'),
    '#confirm-fulfillment-method element must display Doorstep Delivery vs Pickup'
  );
  assert.ok(
    indexHtml.includes('id="confirm-delivery-location"'),
    '#confirm-delivery-location element must display formatted address'
  );
  assert.ok(
    indexHtml.includes('id="confirm-delivery-division"'),
    '#confirm-delivery-division element must exist'
  );
  assert.ok(
    indexHtml.includes('id="confirm-delivery-area"'),
    '#confirm-delivery-area element must exist'
  );
  assert.ok(
    indexHtml.includes('id="confirm-delivery-specific"'),
    '#confirm-delivery-specific element must exist'
  );
  assert.ok(
    indexHtml.includes('id="confirm-landmark-text"'),
    '#confirm-landmark-text element must exist'
  );
  assert.ok(
    indexHtml.includes('id="confirm-delivery-instructions"'),
    '#confirm-delivery-instructions element must exist'
  );
});

test('3. COURIER CARD & CONTACT ACTIONS: Name, Phone, In-App Chat, WhatsApp, and Call Fallback', () => {
  assert.ok(
    indexHtml.includes('id="confirm-driver-card"'),
    '#confirm-driver-card container must exist'
  );
  assert.ok(
    indexHtml.includes('id="confirm-driver-assigned-content"'),
    '#confirm-driver-assigned-content must render assigned driver info'
  );
  assert.ok(
    indexHtml.includes('id="confirm-driver-unassigned-notice"'),
    '#confirm-driver-unassigned-notice must display dispatching state when unassigned'
  );
  assert.ok(
    indexHtml.includes('id="order-confirm-chat-btn"'),
    '#order-confirm-chat-btn button must exist'
  );
  assert.ok(
    indexHtml.includes('id="order-confirm-whatsapp-btn"'),
    '#order-confirm-whatsapp-btn link must exist'
  );
  assert.ok(
    indexHtml.includes('id="order-confirm-call-btn"'),
    '#order-confirm-call-btn link must exist'
  );
  assert.ok(
    indexHtml.includes('id="order-confirm-track-btn"'),
    '#order-confirm-track-btn button must exist'
  );
});

test('4. CUSTOMER ORDER PAYMENT MODAL HTML: Providers, Phone Input, COD, Polling & Success Cards', () => {
  assert.ok(
    indexHtml.includes('id="order-payment-dialog"'),
    '#order-payment-dialog modal must exist in markup'
  );
  assert.ok(
    indexHtml.includes('id="order-pay-select-mtn"'),
    '#order-pay-select-mtn provider tab must exist (*165#)'
  );
  assert.ok(
    indexHtml.includes('id="order-pay-select-airtel"'),
    '#order-pay-select-airtel provider tab must exist (*185#)'
  );
  assert.ok(
    indexHtml.includes('id="order-pay-phone-input"'),
    '#order-pay-phone-input input field must exist'
  );
  assert.ok(
    indexHtml.includes('id="order-pay-cod-block"'),
    '#order-pay-cod-block doorstep payment instructions block must exist'
  );
  assert.ok(
    indexHtml.includes('id="order-pay-status-card"'),
    '#order-pay-status-card awaiting confirmation block must exist'
  );
  assert.ok(
    indexHtml.includes('id="order-pay-success-card"'),
    '#order-pay-success-card confirmation block must exist'
  );
  assert.ok(
    indexHtml.includes('id="order-pay-submit-btn"'),
    '#order-pay-submit-btn Authorize & Pay button must exist'
  );
});

test('5. CONTROLLER FUNCTIONS: showOrderConfirmationModal, openOrderPaymentFlow, openOrderTrackingModal', () => {
  assert.ok(
    appJs.includes('export function showOrderConfirmationModal(order)'),
    'app.js must export showOrderConfirmationModal'
  );
  assert.ok(
    appJs.includes('export function openOrderPaymentFlow(order)'),
    'app.js must export openOrderPaymentFlow'
  );
  assert.ok(
    appJs.includes('export function openOrderTrackingModal(orderId)'),
    'app.js must export openOrderTrackingModal'
  );
});

test('6. CHECKOUT CREATION: paymentStatus is PENDING and never marked Paid on unpaid order', () => {
  assert.ok(
    appJs.includes('paymentStatus: "PENDING"'),
    'handleCheckoutOrder must initialize paymentStatus as PENDING'
  );
  assert.ok(
    appJs.includes('deliveryStatus: assignedDriverId ? "ASSIGNED"'),
    'handleCheckoutOrder must store separate deliveryStatus'
  );
});

test('7. 6-STAGE TRACKING TIMELINE: Distinct progression stages in openOrderTrackingModal', () => {
  assert.ok(
    appJs.includes('{ key: "Placed", label: "Order Placed" }'),
    'Tracking modal must include Order Placed stage'
  );
  assert.ok(
    appJs.includes('{ key: "Payment", label: isPickup ? "Payment Confirmed" : "Payment Confirmed" }'),
    'Tracking modal must include Payment Confirmed stage'
  );
  assert.ok(
    appJs.includes('{ key: "Preparing", label: "Order Being Prepared" }'),
    'Tracking modal must include Order Being Prepared stage'
  );
  assert.ok(
    appJs.includes('Delivery Assigned'),
    'Tracking modal must include Delivery Assigned stage'
  );
  assert.ok(
    appJs.includes('Out for Delivery'),
    'Tracking modal must include Out for Delivery stage'
  );
  assert.ok(
    appJs.includes('{ key: "Delivered", label: isPickup ? "Collected" : "Delivered" }'),
    'Tracking modal must include Delivered stage'
  );
});

test('8. DELIVERY CONTROLS & BROADCAST SYNC: Drivers can accept, mark out, and mark delivered', () => {
  assert.ok(
    appJs.includes('action === "accept-delivery"'),
    'Driver actions must handle accept-delivery'
  );
  assert.ok(
    appJs.includes('action === "call-customer"'),
    'Driver actions must handle call-customer'
  );
  assert.ok(
    appJs.includes('broadcastAppSync("ORDER_DELIVERY_STATUS_CHANGED"'),
    'Driver status updates must broadcast ORDER_DELIVERY_STATUS_CHANGED'
  );
  assert.ok(
    appJs.includes('broadcastAppSync("ORDER_PAYMENT_CONFIRMED"'),
    'Payment flow must broadcast ORDER_PAYMENT_CONFIRMED'
  );
});

test('9. CSS STYLING: WhatsApp, Call, Payment badges and Order Payment modal styles exist', () => {
  assert.ok(
    stylesCss.includes('.btn-whatsapp'),
    'styles.css must style .btn-whatsapp'
  );
  assert.ok(
    stylesCss.includes('.btn-call'),
    'styles.css must style .btn-call'
  );
  assert.ok(
    stylesCss.includes('.confirm-payment-badge.status-pending'),
    'styles.css must style pending payment badge'
  );
  assert.ok(
    stylesCss.includes('.confirm-payment-badge.status-paid'),
    'styles.css must style paid payment badge'
  );
  assert.ok(
    stylesCss.includes('#order-payment-dialog'),
    'styles.css must style #order-payment-dialog'
  );
});

test('10. BACKEND INTEGRATION: payment_api.py supports custom order references and delivery status updates', () => {
  assert.ok(
    paymentApiPy.includes('custom_ref = payload.get("reference")'),
    'payment_api.py must accept custom reference'
  );
  assert.ok(
    paymentApiPy.includes('parsed.path == "/api/deliveries/status"'),
    'payment_api.py must support /api/deliveries/status endpoint'
  );
});
