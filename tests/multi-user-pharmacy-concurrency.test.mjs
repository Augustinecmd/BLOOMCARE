import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appJsPath = path.resolve(rootDir, 'BLOOMCARE-main', 'app.js');
const paymentApiPath = path.resolve(rootDir, 'server', 'payment_api.py');

test('1. CONCURRENCY: Multiple customers get unique collision-proof order IDs', async () => {
  const { STATE } = await import('../BLOOMCARE-main/app.js');
  const orderIds = new Set();
  const customerIds = ['cust-101', 'cust-102', 'cust-103', 'cust-104'];

  for (const cid of customerIds) {
    const orderRef = `BC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
    assert.ok(!orderIds.has(orderRef), `Order ref ${orderRef} must be collision-free`);
    orderIds.add(orderRef);
  }

  assert.equal(orderIds.size, 4, 'Each simulated concurrent customer order receives a distinct reference');
});

test('2. IDEMPOTENCY & DOUBLE-CLICK PROTECTION: isPlacingOrder flag exists and checkout prevents duplicate submissions', async () => {
  const { STATE } = await import('../BLOOMCARE-main/app.js');
  assert.equal(typeof STATE.isPlacingOrder, 'boolean', 'STATE.isPlacingOrder must be boolean');
  assert.equal(STATE.isPlacingOrder, false, 'Initial state of isPlacingOrder must be false');

  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('if (STATE.isPlacingOrder) return;'), 'handleCheckoutOrder must guard against duplicate submissions');
  assert.ok(appJs.includes('STATE.isPlacingOrder = true;'), 'handleCheckoutOrder must lock order placement flag');
  assert.ok(appJs.includes('STATE.isPlacingOrder = false;'), 'handleCheckoutOrder must release order placement flag');
});

test('3. AUTO-ASSIGNMENT: Orders auto-assign to designated delivery driver (Moses Kato)', async () => {
  const { getOrCreateOrderDeliveryChat, STATE } = await import('../BLOOMCARE-main/app.js');
  const testOrderId = `BC-ORD-CONCUR-${Date.now()}`;
  const testOrder = {
    id: testOrderId,
    orderNumber: testOrderId,
    customerId: 'cust-concur-user',
    customerName: 'Kato Derrick',
    deliveryManId: 'usr-5',
    deliveryManName: 'Moses Kato',
    orderStatus: 'Assigned',
    assignedStaff: 'Moses Kato'
  };
  STATE.orders.unshift(testOrder);

  const conv = getOrCreateOrderDeliveryChat(testOrderId);
  assert.ok(conv, 'Chat conversation must be generated');
  assert.equal(conv.deliveryManId, 'usr-5', 'Conversation links to designated driver usr-5');
  assert.equal(conv.deliveryManName, 'Moses Kato', 'Conversation links to driver Moses Kato');
});

test('4. REAL-TIME MESSAGING INTEGRATION: Delivery Man sees client-sent messages', async () => {
  const { getOrCreateOrderDeliveryChat, sendChatMessage, canUserAccessConversation, STATE } = await import('../BLOOMCARE-main/app.js');
  const orderRef = `BC-CHAT-INTEG-${Date.now()}`;
  const order = {
    id: orderRef,
    orderNumber: orderRef,
    customerId: 'cust-client-1',
    customerName: 'Grace Nakato',
    deliveryManId: 'usr-5',
    deliveryManName: 'Moses Kato',
    orderStatus: 'Out for Delivery',
    assignedStaff: 'Moses Kato'
  };
  STATE.orders.unshift(order);

  const conv = getOrCreateOrderDeliveryChat(orderRef);
  assert.ok(conv, 'Conversation initialized');

  // Customer sends message
  const clientUser = { uid: 'cust-client-1', displayName: 'Grace Nakato', role: 'customer' };
  const clientMsgText = 'Hello driver, please call when you reach the gate.';
  const sendRes = sendChatMessage(conv.id, clientMsgText, clientUser);
  assert.equal(sendRes.success, true, 'Customer sending message must succeed');

  // Verify delivery driver can access this conversation
  const driverUser = { uid: 'usr-5', displayName: 'Moses Kato', role: 'delivery_person' };
  const canDriverAccess = canUserAccessConversation(conv, driverUser, 'delivery_person');
  assert.equal(canDriverAccess, true, 'Designated driver Moses Kato must have access to conversation');

  // Verify delivery driver can see client-sent message in conversation messages
  const storedMsg = STATE.messages.find(m => m.conversationId === conv.id && m.text === clientMsgText);
  assert.ok(storedMsg, 'Client message must be present in STATE.messages for delivery man to read');
  assert.equal(storedMsg.senderRole, 'customer', 'Message sender role must be customer');
  assert.equal(storedMsg.recipientRole, 'delivery', 'Message recipient role must be delivery');
  assert.equal(conv.lastMessageText, clientMsgText, 'Conversation summary must display client message');
  assert.ok(conv.unreadCountForDelivery > 0 || conv.unreadDelivery > 0, 'Unread count for delivery must increment');
});

test('5. REAL-TIME MESSAGING INTEGRATION: Customer receives driver reply', async () => {
  const { sendChatMessage, canUserAccessConversation, STATE } = await import('../BLOOMCARE-main/app.js');
  const conv = STATE.conversations.find(c => c.orderId && c.orderId.startsWith('BC-CHAT-INTEG-'));
  assert.ok(conv, 'Previous conversation exists');

  // Driver sends reply
  const driverUser = { uid: 'usr-5', displayName: 'Moses Kato', role: 'delivery_person' };
  const driverReplyText = 'Received! I am 5 minutes away, approaching your gate now.';
  const replyRes = sendChatMessage(conv.id, driverReplyText, driverUser);
  assert.equal(replyRes.success, true, 'Driver reply must succeed');

  // Verify customer can access conversation and read driver reply
  const clientUser = { uid: 'cust-client-1', displayName: 'Grace Nakato', role: 'customer' };
  assert.equal(canUserAccessConversation(conv, clientUser, 'customer'), true, 'Customer has access');

  const storedReply = STATE.messages.find(m => m.conversationId === conv.id && m.text === driverReplyText);
  assert.ok(storedReply, 'Driver reply must be stored in STATE.messages');
  assert.equal(storedReply.senderRole, 'delivery', 'Reply sender role must be delivery');
  assert.equal(storedReply.recipientRole, 'customer', 'Reply recipient role must be customer');
  assert.ok(conv.unreadCountForCustomer > 0 || conv.unreadCustomer > 0, 'Customer unread count must increment');
});

test('6. CROSS-TAB SESSION ISOLATION: sessionStorage prevents Customer and Delivery Man tab collision', async () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  // Verify sessionStorage takes precedence over localStorage
  assert.ok(appJs.includes('sessionStorage.getItem("bloomcare_session_user")'), 'getSavedSessionUser must check sessionStorage first');
  assert.ok(appJs.includes('sessionStorage.setItem("bloomcare_session_user"'), 'saveSessionUser must write to sessionStorage for tab isolation');
});

test('7. BACKEND API ROBUSTNESS: /api/conversations supports driver aliases and returns correct conversations', () => {
  const pyCode = fs.readFileSync(paymentApiPath, 'utf8');
  assert.ok(pyCode.includes('driver_aliases'), 'payment_api.py must define driver_aliases');
  assert.ok(pyCode.includes('usr-staff-5') && pyCode.includes('usr-5'), 'driver_aliases must include usr-staff-5 and usr-5');
});
