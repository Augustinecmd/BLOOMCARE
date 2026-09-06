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

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

// Import functions from app.js
const {
  isWalkinOrder,
  formatUGX,
  ROLE_SIDEBAR_CONFIGS,
  checkRouteAccess
} = await import('../BLOOMCARE-main/app.js');

test('1. DOM STRUCTURE: Order Confirmation Modal (#order-confirmation-dialog) exists and meets requirements', () => {
  assert.ok(indexHtml.includes('id="order-confirmation-dialog"'), '#order-confirmation-dialog must exist');
  assert.ok(indexHtml.includes('id="confirm-order-number"'), '#confirm-order-number must exist');
  assert.ok(indexHtml.includes('id="confirm-order-status"'), '#confirm-order-status must exist');
  assert.ok(indexHtml.includes('id="confirm-payment-status"'), '#confirm-payment-status must exist');
  assert.ok(indexHtml.includes('id="confirm-delivery-fee"'), '#confirm-delivery-fee must exist');
  assert.ok(indexHtml.includes('id="confirm-delivery-location"'), '#confirm-delivery-location must exist');
  assert.ok(indexHtml.includes('id="confirm-delivery-eta"'), '#confirm-delivery-eta must exist');
  assert.ok(indexHtml.includes('id="confirm-driver-card"'), '#confirm-driver-card must exist');
  assert.ok(indexHtml.includes('id="confirm-driver-name"'), '#confirm-driver-name must exist');
  assert.ok(indexHtml.includes('id="confirm-driver-phone"'), '#confirm-driver-phone must exist');
  assert.ok(indexHtml.includes('id="order-confirm-chat-btn"'), '#order-confirm-chat-btn must exist');
  assert.ok(indexHtml.includes('id="order-confirm-view-orders-btn"'), '#order-confirm-view-orders-btn must exist');
  assert.ok(indexHtml.includes('id="order-confirm-continue-btn"'), '#order-confirm-continue-btn must exist');
});

test('2. DOM STRUCTURE: Delivery Details Modal (#delivery-details-dialog) exists for Delivery Person', () => {
  assert.ok(indexHtml.includes('id="delivery-details-dialog"'), '#delivery-details-dialog must exist');
  assert.ok(indexHtml.includes('id="delivery-details-content"'), '#delivery-details-content must exist');
  assert.ok(indexHtml.includes('id="btn-delivery-details-chat"'), '#btn-delivery-details-chat must exist');
  assert.ok(indexHtml.includes('id="btn-delivery-details-close"'), '#btn-delivery-details-close must exist');
});

test('3. SCENARIO A: Online Customer Orders DO NOT Require Counter Receipt', () => {
  // Verify app.js uses showOrderConfirmationModal upon online checkout
  assert.ok(appJs.includes('showOrderConfirmationModal(newOrder)'), 'handleCheckoutOrder must call showOrderConfirmationModal for online orders');
  assert.ok(!appJs.includes('showReceiptModal(newOrder)'), 'handleCheckoutOrder must NOT show counter receipt to online customer');

  // Verify online customer clicking order details gets Order Confirmation
  assert.ok(
    appJs.includes('if (getEffectiveRole() === "customer" && !isWalkinOrder(order))'),
    'view-rec-btn click handler must route online customers to showOrderConfirmationModal'
  );
});

test('4. SCENARIO D: Walk-In Counter POS Sales PRESERVE Receipt Workflow', () => {
  // Walk-in orders MUST still use showReceiptModal and thermal printing
  assert.ok(appJs.includes('completeWalkinSale'), 'completeWalkinSale must exist');
  assert.ok(appJs.includes('showReceiptModal(newSaleOrder)'), 'completeWalkinSale must show counter receipt to walk-in customer');
  assert.ok(appJs.includes('printThermalReceipt'), 'printThermalReceipt must exist');

  // isWalkinOrder correctly differentiates walk-in sales from online delivery
  const walkinSale = { saleSource: 'WALK_IN', total: 15000, fulfillmentType: 'counter walk-in sale' };
  const onlineOrder = { saleSource: 'ONLINE', total: 35000, fulfillmentType: 'delivery', deliveryArea: 'Kakoba' };

  assert.equal(isWalkinOrder(walkinSale), true, 'walkinSale must be identified as walk-in order');
  assert.equal(isWalkinOrder(onlineOrder), false, 'onlineOrder must NOT be identified as walk-in order');
});

test('5. SCENARIO B: Delivery Driver Dashboard & Automatic Notifications', () => {
  // Delivery Dashboard must contain NEW & ACTIVE DELIVERIES container and delivery notifications
  assert.ok(appJs.includes('NEW &amp; ACTIVE DELIVERIES') || appJs.includes('NEW & ACTIVE DELIVERIES'), 'Delivery dashboard must render NEW DELIVERIES');
  assert.ok(appJs.includes('view-dash-del-details'), 'Delivery card must have View Delivery Details button');
  assert.ok(appJs.includes('quick-driver-chat-btn'), 'Delivery card must have Chat with Customer button');
  assert.ok(appJs.includes('quick-driver-action') && appJs.includes('mark-delivered'), 'Delivery card must have Mark Delivered button');

  // Viewing delivery run marks notification read WITHOUT marking delivery complete
  assert.ok(appJs.includes('openDeliveryDetailsModal'), 'openDeliveryDetailsModal must exist');
  assert.ok(appJs.includes('/api/notifications/mark-read'), 'openDeliveryDetailsModal must mark notifications read');
  const detailsFnSlice = appJs.slice(appJs.indexOf('function openDeliveryDetailsModal'), appJs.indexOf('function syncDeliverySystemWithBackend'));
  assert.ok(!detailsFnSlice.includes('d.status = "Delivered"') && !detailsFnSlice.includes('d.status="Delivered"'), 'Viewing details must NOT mark delivery as Delivered');
});

test('6. SCENARIO B: 1:1 Customer Chat Creation & Message Notification Flow', () => {
  // Verify chat conversation creation helper
  assert.ok(appJs.includes('getOrCreateOrderDeliveryChat'), 'getOrCreateOrderDeliveryChat must exist');
  assert.ok(appJs.includes('/api/conversations/messages'), 'sendChatMessage must sync messages with backend');

  // Verify Customer Chat item in delivery person sidebar
  const deliveryItems = ROLE_SIDEBAR_CONFIGS.delivery_person;
  const chatSidebarItem = deliveryItems.find(item => item.label === 'Customer Chat');
  assert.ok(chatSidebarItem, 'Customer Chat must be in delivery person sidebar');
  assert.equal(chatSidebarItem.badgeId, 'delivery-chat-unread-badge');
});

test('7. SCENARIO C: Driver Queueing & Backend Sync', () => {
  // Verify syncDeliverySystemWithBackend is implemented and polled
  assert.ok(appJs.includes('syncDeliverySystemWithBackend'), 'syncDeliverySystemWithBackend must be exported');
  assert.ok(appJs.includes('/api/deliveries/assignments'), 'syncDeliverySystemWithBackend must fetch assignments');
  assert.ok(appJs.includes('/api/notifications'), 'syncDeliverySystemWithBackend must fetch notifications');
  assert.ok(appJs.includes('/api/conversations'), 'syncDeliverySystemWithBackend must fetch conversations');
  assert.ok(appJs.includes('setInterval(syncDeliverySystemWithBackend, 4000)'), 'syncDeliverySystemWithBackend must poll every 4s');
});

test('8. CSS STYLING: Modal and Delivery Dashboard Styles Exist', () => {
  assert.ok(stylesCss.includes('.order-confirm-dialog'), '.order-confirm-dialog CSS class must exist');
  assert.ok(stylesCss.includes('.delivery-notifs-container'), '.delivery-notifs-container CSS class must exist');
  assert.ok(stylesCss.includes('.delivery-notif-card'), '.delivery-notif-card CSS class must exist');
  assert.ok(stylesCss.includes('.new-deliveries-section'), '.new-deliveries-section CSS class must exist');
  assert.ok(stylesCss.includes('.new-delivery-card'), '.new-delivery-card CSS class must exist');
});
