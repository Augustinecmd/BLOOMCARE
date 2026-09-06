import assert from 'node:assert/strict';

const API_HOST = 'http://127.0.0.1:8787';

async function request(path, options = {}) {
  const url = `${API_HOST}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('--- STARTING LIVE END-TO-END DELIVERY WORKFLOW VERIFICATION ---');

  // Check health
  const health = await request('/health');
  assert.equal(health.status, 200, 'API must be healthy');
  console.log('✓ API health check passed');

  // 1. Check pending payment does NOT assign driver
  const pendingOrderNum = `BC-LIVE-PEND-${Date.now()}`;
  const pendingAssign = await request('/api/deliveries/auto-assign', {
    method: 'POST',
    body: JSON.stringify({
      orderId: pendingOrderNum,
      orderData: {
        orderNumber: pendingOrderNum,
        paymentStatus: 'PENDING',
        total: 35000,
        customerName: 'Test Customer',
        customerPhone: '0772123456'
      }
    })
  });
  assert.equal(pendingAssign.status, 400, 'Unverified / Pending payment must reject auto-assignment');
  assert.equal(pendingAssign.data.status, 'PAYMENT_NOT_VERIFIED');
  console.log('✓ Pending payment blocked from auto-assignment');

  // 2. Initialize and verify payment
  const orderNum = `BC-LIVE-${Date.now()}`;
  const initPayment = await request('/api/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'MTN Mobile Money',
      phone: '0772123456',
      amount: 35000,
      orderDetails: {
        orderNumber: orderNum,
        customerId: 'usr-live-cust-1',
        customerName: 'Sarah Mwine',
        customerPhone: '0772123456',
        deliveryDivision: 'Kamukuzi',
        deliveryArea: 'Kiyanja',
        address: 'Plot 12, Kiyanja Road, Kamukuzi',
        specificLocation: 'Near Catholic Church, Blue Gate',
        landmark: 'Opposite Shell Fuel Station',
        deliveryFee: 5000,
        itemsSummary: '2x Paracetamol, 1x Amoxicillin',
        items: [
          { name: 'Paracetamol 500mg', quantity: 2, price: 5000 },
          { name: 'Amoxicillin 500mg', quantity: 1, price: 20000 }
        ],
        total: 35000
      }
    })
  });
  const paymentRef = initPayment.data.reference || initPayment.data.paymentReference;
  assert.ok(paymentRef, 'Must receive payment reference');
  console.log(`✓ Payment initialized with reference ${paymentRef}`);

  // Verify payment
  const verifyPayment = await request('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference: paymentRef })
  });
  assert.equal(verifyPayment.status, 200, 'Payment verification must succeed');
  assert.equal(verifyPayment.data.payment?.status, 'SUCCESSFUL');
  console.log('✓ Payment verified as SUCCESSFUL');
  if (verifyPayment.data.deliveryAssignment) {
    console.log(`✓ Payment verification automatically assigned driver: ${verifyPayment.data.deliveryAssignment.deliveryManName}`);
  }

  // 3. Automated delivery assignment
  const assignRes = await request('/api/deliveries/auto-assign', {
    method: 'POST',
    body: JSON.stringify({
      orderId: orderNum,
      orderData: {
        orderNumber: orderNum,
        paymentStatus: 'PAID',
        customerId: 'usr-live-cust-1',
        customerName: 'Sarah Mwine',
        customerPhone: '0772123456',
        deliveryDivision: 'Kamukuzi',
        deliveryArea: 'Kiyanja',
        deliveryAddress: 'Plot 12, Kiyanja Road, Kamukuzi',
        specificLocation: 'Near Catholic Church, Blue Gate',
        landmark: 'Opposite Shell Fuel Station',
        deliveryFee: 5000,
        itemsSummary: '2x Paracetamol, 1x Amoxicillin',
        total: 35000
      }
    })
  });
  assert.equal(assignRes.status, 200, 'Auto-assignment must succeed');
  const assignment = assignRes.data.assignment;
  assert.equal(assignment.orderNumber, orderNum);
  assert.equal(assignment.status, 'ASSIGNED');
  assert.ok(assignment.deliveryManId, 'Delivery Man ID must be present');
  const driverId = assignment.deliveryManId;
  const driverName = assignment.deliveryManName;
  console.log(`✓ Order automatically assigned to Driver: ${driverName} (${driverId})`);

  // 4. Test idempotency: Calling auto-assign again returns existing assignment without duplicating
  const reAssignCheck = await request('/api/deliveries/auto-assign', {
    method: 'POST',
    body: JSON.stringify({
      orderId: orderNum,
      orderData: { orderNumber: orderNum, paymentStatus: 'PAID' }
    })
  });
  assert.equal(reAssignCheck.data.assignment.deliveryManId, driverId, 'Duplicate assignment prevented');
  console.log('✓ Idempotency verified: Duplicate assignment prevented');

  // 5. Verify NEW_DELIVERY_ASSIGNED notification dispatched to driver (before customer messages)
  const notifsRes = await request('/api/notifications');
  assert.equal(notifsRes.status, 200);
  const driverNotif = notifsRes.data.notifications.find(n => n.orderId === orderNum && n.type === 'NEW_DELIVERY_ASSIGNED');
  assert.ok(driverNotif, 'Driver must receive NEW_DELIVERY_ASSIGNED notification');
  assert.equal(driverNotif.recipientId, driverId);
  console.log(`✓ NEW_DELIVERY_ASSIGNED notification verified for ${driverName}`);

  // 6. Verify 1:1 conversation created atomically
  const convsRes = await request('/api/conversations');
  assert.equal(convsRes.status, 200);
  const conv = convsRes.data.conversations.find(c => c.orderId === orderNum);
  assert.ok(conv, '1:1 Conversation must exist atomically for order');
  assert.equal(conv.deliveryManId, driverId);
  assert.equal(conv.status, 'ACTIVE');
  console.log(`✓ 1:1 Chat Conversation verified: ${conv.conversationId}`);

  // 7. Customer sends message
  const custMsgRes = await request('/api/conversations/messages', {
    method: 'POST',
    body: JSON.stringify({
      orderId: orderNum,
      senderId: 'usr-live-cust-1',
      senderRole: 'customer',
      senderName: 'Sarah Mwine',
      text: 'Please call me when you reach the blue gate.'
    })
  });
  assert.equal(custMsgRes.status, 201, 'Customer message must be saved');
  console.log('✓ Customer sent instructions successfully');

  // Verify NEW_CUSTOMER_MESSAGE notification generated for driver
  const notifsAfterMsg = await request('/api/notifications');
  const custMsgNotif = notifsAfterMsg.data.notifications.find(n => n.orderId === orderNum && n.type === 'NEW_CUSTOMER_MESSAGE');
  assert.ok(custMsgNotif, 'Driver must receive NEW_CUSTOMER_MESSAGE notification');
  assert.equal(custMsgNotif.recipientId, driverId);
  console.log('✓ Driver received NEW_CUSTOMER_MESSAGE notification');

  // 8. Driver replies
  const driverReplyRes = await request('/api/conversations/messages', {
    method: 'POST',
    body: JSON.stringify({
      orderId: orderNum,
      senderId: driverId,
      senderRole: 'delivery_person',
      senderName: driverName,
      text: 'Got it Sarah, I am on my way with your medication.'
    })
  });
  assert.equal(driverReplyRes.status, 201, 'Driver reply must be saved');
  console.log('✓ Driver replied successfully');

  // Verify NEW_DELIVERY_MESSAGE notification generated for customer
  const notifsAfterReply = await request('/api/notifications');
  const driverReplyNotif = notifsAfterReply.data.notifications.find(n => n.orderId === orderNum && n.type === 'NEW_DELIVERY_MESSAGE');
  assert.ok(driverReplyNotif, 'Customer must receive NEW_DELIVERY_MESSAGE notification');
  assert.equal(driverReplyNotif.recipientId, 'usr-live-cust-1');
  console.log('✓ Customer received NEW_DELIVERY_MESSAGE notification');

  // 9. Mark driver notification as read
  const markReadRes = await request('/api/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notificationId: driverNotif.id })
  });
  assert.equal(markReadRes.status, 200);
  console.log('✓ Driver marked notification as read');

  // 10. Mark delivery as Delivered
  const deliveredRes = await request('/api/deliveries/status', {
    method: 'POST',
    body: JSON.stringify({
      orderId: orderNum,
      status: 'Delivered',
      notes: 'Handed directly to Sarah Mwine at the blue gate'
    })
  });
  assert.equal(deliveredRes.status, 200, 'Delivery status update to Delivered must succeed');
  assert.equal(deliveredRes.data.delivery.status, 'Delivered');

  // Verify conversation is COMPLETED
  const convsAfterDel = await request('/api/conversations');
  const convDel = convsAfterDel.data.conversations.find(c => c.orderId === orderNum);
  assert.equal(convDel.status, 'COMPLETED');

  // Verify ORDER_DELIVERED notification for customer
  const notifsAfterDel = await request('/api/notifications');
  const delNotif = notifsAfterDel.data.notifications.find(n => n.orderId === orderNum && n.type === 'ORDER_DELIVERED');
  assert.ok(delNotif, 'Customer must receive ORDER_DELIVERED notification');
  console.log('✓ Delivery completed, conversation archived as COMPLETED, and customer notified');

  console.log('\n--- ALL LIVE WORKFLOW CHECKS PASSED PERFECTLY ---');
}

run().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
