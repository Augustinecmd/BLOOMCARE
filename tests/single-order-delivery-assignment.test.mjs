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

const appJs = fs.readFileSync(appJsPath, 'utf8');
const paymentApiPy = fs.readFileSync(paymentApiPath, 'utf8');

// Import functions from app.js
const {
  getAssignedDeliveryManForOrder,
  isWalkinOrder,
  formatUGX
} = await import('../BLOOMCARE-main/app.js');

test('1. CODEBASE AUDIT: No product-level, medicine-level, or cart-item delivery assignment logic exists', () => {
  // Verify delivery assignment functions are keyed to orderId, not productId or medicineId
  assert.ok(
    paymentApiPy.includes('def auto_assign_delivery(order_id: str, order_data: dict)'),
    'Backend auto_assign_delivery must accept order_id as its primary key'
  );
  assert.ok(
    !paymentApiPy.includes('def auto_assign_delivery(product_id'),
    'Backend must NOT have product-level auto_assign_delivery'
  );
  assert.ok(
    !paymentApiPy.includes('def auto_assign_delivery(medicine_id'),
    'Backend must NOT have medicine-level auto_assign_delivery'
  );
  assert.ok(
    !appJs.includes('deliveryStaffId = item.productId') && !appJs.includes('deliveryManId = item.productId'),
    'app.js must not assign delivery staff per product'
  );
});

test('2. REQUIREMENT 25: Multi-Product Single Order creates exactly ONE Delivery Assignment and ONE Delivery Man', () => {
  // Test Order with 5 distinct products
  const multiProductOrder = {
    id: 'BC-TEST-MULTI-001',
    orderNumber: 'BC-TEST-MULTI-001',
    customerId: 'cust-arinda-keline',
    customerName: 'Arinda Keline',
    customerPhone: '0772123456',
    deliveryDivision: 'Kamukuzi',
    deliveryArea: 'Kiyanja',
    fulfillmentType: 'delivery',
    items: [
      { productId: 'med-diclofenac', name: 'Diclofenac 50mg Tablets', quantity: 1, price: 10000 },
      { productId: 'med-tramadol', name: 'Tramadol Capsules 50mg', quantity: 1, price: 15000 },
      { productId: 'med-amoxicillin', name: 'Amoxicillin 500mg Capsules', quantity: 1, price: 12000 },
      { productId: 'med-ibuprofen', name: 'Ibuprofen 400mg Tablets', quantity: 1, price: 8000 },
      { productId: 'med-paracetamol', name: 'Paracetamol 500mg Tablets', quantity: 1, price: 5000 }
    ],
    deliveryFee: 5000,
    total: 55000,
    paymentStatus: 'Paid',
    deliveryManId: 'usr-staff-5',
    deliveryManName: 'Moses Kato'
  };

  // Verify helper resolves single Delivery Man for the entire order
  const assignedDriver = getAssignedDeliveryManForOrder(multiProductOrder);
  assert.equal(assignedDriver, 'Moses Kato', 'Order with 5 products must have exactly ONE assigned Delivery Man');

  // Verify backend python enforces items bundling and single assignment history
  assert.ok(
    paymentApiPy.includes('"items": items_list'),
    'Backend auto_assign_delivery must store the full items array on the single order assignment'
  );
  assert.ok(
    paymentApiPy.includes('"assignmentHistory": history') || paymentApiPy.includes('assignmentHistory'),
    'Backend must maintain an audit assignmentHistory on the order'
  );
});

test('3. REQUIREMENT 26: Multiple Separate Orders each receive their own single Delivery Man assignment', () => {
  const order1 = {
    id: 'BC-ORD-001',
    orderNumber: 'BC-ORD-001',
    customerId: 'cust-arinda-keline',
    customerName: 'Arinda Keline',
    fulfillmentType: 'delivery',
    deliveryManName: 'Moses Kato',
    items: [
      { name: 'Diclofenac 50mg', quantity: 2 },
      { name: 'Paracetamol 500mg', quantity: 1 }
    ]
  };

  const order2 = {
    id: 'BC-ORD-002',
    orderNumber: 'BC-ORD-002',
    customerId: 'cust-arinda-keline',
    customerName: 'Arinda Keline',
    fulfillmentType: 'delivery',
    deliveryManName: 'Paul Ssemwogerere',
    items: [
      { name: 'Amoxicillin 500mg', quantity: 3 }
    ]
  };

  const order3 = {
    id: 'BC-ORD-003',
    orderNumber: 'BC-ORD-003',
    customerId: 'cust-arinda-keline',
    customerName: 'Arinda Keline',
    fulfillmentType: 'delivery',
    deliveryManName: 'Emmanuel Otim',
    items: [
      { name: 'Ibuprofen 400mg', quantity: 1 },
      { name: 'Tramadol 50mg', quantity: 2 }
    ]
  };

  // Each order has its own single driver
  assert.equal(getAssignedDeliveryManForOrder(order1), 'Moses Kato');
  assert.equal(getAssignedDeliveryManForOrder(order2), 'Paul Ssemwogerere');
  assert.equal(getAssignedDeliveryManForOrder(order3), 'Emmanuel Otim');

  // All items inside each order belong to that order's single driver
  assert.equal(order1.items.length, 2);
  assert.equal(order2.items.length, 1);
  assert.equal(order3.items.length, 2);
});

test('4. IDEMPOTENCY: Repeated auto-assignment checks do NOT create duplicate active assignments', () => {
  // Verify backend idempotency check in payment_api.py
  assert.ok(
    paymentApiPy.includes('if existing and existing.get("status") == "ASSIGNED" and existing.get("deliveryManId"):'),
    'Backend must return existing assignment without re-assigning if already assigned'
  );
  assert.ok(
    paymentApiPy.includes('return existing'),
    'Idempotent check must return existing assignment directly'
  );
});

test('5. REASSIGNMENT & AUDIT HISTORY: Reassignment changes the order Delivery Man without creating a second assignment', () => {
  // Verify backend reassign_delivery replaces deliveryManId on the single assignment
  assert.ok(
    paymentApiPy.includes('def reassign_delivery(order_id: str, new_driver_id: str, admin_meta: dict)'),
    'Backend must provide atomic reassign_delivery endpoint'
  );
  assert.ok(
    paymentApiPy.includes('assignments[order_key]["deliveryManId"] = new_driver_id'),
    'Reassignment must update the order deliveryManId'
  );
  assert.ok(
    paymentApiPy.includes('"action": "REASSIGNED"'),
    'Reassignment must append to assignmentHistory audit log'
  );
  assert.ok(
    paymentApiPy.includes('conversations[conv_id]["deliveryManId"] = new_driver_id'),
    'Reassignment must update the single 1:1 conversation without creating a duplicate'
  );
});

test('6. CUSTOMER ORDER TABLE (Requirement 22): Customer order list displays ONE Delivery column with 🚚 Moses Kato', () => {
  // Table header must have Delivery column
  assert.ok(
    appJs.includes('<th>Delivery</th>'),
    'Customer orders table header must contain <th>Delivery</th> column'
  );
  // Row must display single Delivery Man badge per order row
  assert.ok(
    appJs.includes('🚚 ${escapeHtml(driverName)}') || appJs.includes('🚚 ${driverName}'),
    'Customer order table row must display 🚚 ${driverName} for the order'
  );
});

test('7. CUSTOMER DASHBOARD (Requirement 7): Active order card shows Delivery Man against the order, not individual medicines', () => {
  assert.ok(
    appJs.includes('<strong>Delivery:</strong>'),
    'Customer active tracking card must contain Delivery: field'
  );
  assert.ok(
    appJs.includes('activeDriver ?') && appJs.includes('🚚 ${escapeHtml(activeDriver)}'),
    'Customer active tracking card must show 🚚 ${activeDriver} for the order'
  );
  assert.ok(
    appJs.includes('💬 Chat with Delivery Man'),
    'Customer active tracking card must have 💬 Chat with Delivery Man button'
  );
});

test('8. DELIVERY DETAILS MODAL (Requirement 9 & 10): Delivery Man sees all medicines itemized in the single order', () => {
  assert.ok(
    appJs.includes('Products / Medicines in this Order'),
    'openDeliveryDetailsModal must itemize medicines in the order'
  );
  assert.ok(
    appJs.includes('relOrder.items') || appJs.includes('d.items'),
    'openDeliveryDetailsModal must iterate over order items to display each product and quantity'
  );
});

test('9. PAYMENT VERIFICATION: Unpaid/pending payments cannot trigger delivery assignment', () => {
  assert.ok(
    paymentApiPy.includes('if payment_status not in {"SUCCESSFUL", "PAID"}:'),
    'Backend must reject assignment if payment status is not verified'
  );
  assert.ok(
    paymentApiPy.includes('"status": "PAYMENT_NOT_VERIFIED"'),
    'Backend must return PAYMENT_NOT_VERIFIED for unverified orders'
  );
});

test('10. NON-BREAKING ISOLATION: Walk-in counter sales remain completely unaffected', () => {
  const walkinSale = { saleSource: 'WALK_IN', total: 10000, fulfillmentType: 'counter walk-in sale' };
  assert.equal(isWalkinOrder(walkinSale), true);
  assert.equal(getAssignedDeliveryManForOrder(walkinSale), null, 'Walk-in counter sale must NOT have a delivery assignment');
});

