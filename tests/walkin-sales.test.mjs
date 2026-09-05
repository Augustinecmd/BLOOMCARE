import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, '../BLOOMCARE-main/app.js');
const indexHtmlPath = path.resolve(__dirname, '../BLOOMCARE-main/index.html');
const stylesCssPath = path.resolve(__dirname, '../BLOOMCARE-main/styles.css');

// Import exported functions from app.js
const {
  ROLE_PERMISSIONS,
  PERMISSIONS,
  calculateSalesOverviewData,
  isWalkinOrder,
  generateWalkinSaleReference,
  searchMedicinesCatalog,
  sortMedicinesList,
  formatUGX
} = await import('../BLOOMCARE-main/app.js');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

test('1. RBAC & AUTHORIZATION: Pharmacist, Assistant, Admin, Dev have walk-in permission; Customers blocked', () => {
  assert.ok(PERMISSIONS.SALE_CREATE_WALKIN, 'SALE_CREATE_WALKIN permission must exist');
  assert.equal(PERMISSIONS.SALE_CREATE_WALKIN, 'sale:create_walkin');

  // Authorized roles
  assert.ok(ROLE_PERMISSIONS.developer.includes(PERMISSIONS.SALE_CREATE_WALKIN), 'Developer must have walk-in permission');
  assert.ok(ROLE_PERMISSIONS.admin.includes(PERMISSIONS.SALE_CREATE_WALKIN), 'Admin must have walk-in permission');
  assert.ok(ROLE_PERMISSIONS.pharmacist.includes(PERMISSIONS.SALE_CREATE_WALKIN), 'Pharmacist must have walk-in permission');
  assert.ok(ROLE_PERMISSIONS.assistant_pharmacist.includes(PERMISSIONS.SALE_CREATE_WALKIN), 'Assistant Pharmacist must have walk-in permission');

  // Blocked roles
  assert.ok(!ROLE_PERMISSIONS.customer.includes(PERMISSIONS.SALE_CREATE_WALKIN), 'Customer must NOT have walk-in permission');
  assert.ok(!ROLE_PERMISSIONS.delivery_person.includes(PERMISSIONS.SALE_CREATE_WALKIN), 'Delivery person must NOT have walk-in permission');
  assert.ok(!ROLE_PERMISSIONS.visitor.includes(PERMISSIONS.SALE_CREATE_WALKIN), 'Visitor must NOT have walk-in permission');
});

test('2. DASHBOARD TRIGGERS: Prominent + New Walk-in Sale button in staff dashboards; absent in customer view', () => {
  assert.ok(appJs.includes('id="pharmacist-btn-walkin-sale"'), 'Pharmacist dashboard must have walk-in button');
  assert.ok(appJs.includes('id="assistant-btn-walkin-sale"'), 'Assistant Pharmacist dashboard must have walk-in button');
  assert.ok(appJs.includes('id="admin-btn-walkin-sale"'), 'Admin dashboard must have walk-in button');
  assert.ok(appJs.includes('id="dev-btn-walkin-sale"'), 'Developer dashboard must have walk-in button');

  // Check customer dashboard section in app.js
  const customerSectionMatch = appJs.match(/role === "customer"[\s\S]*?else \{/);
  assert.ok(customerSectionMatch, 'Customer section must exist in app.js');
  assert.ok(!customerSectionMatch[0].includes('btn-walkin-sale'), 'Customer dashboard must never contain walk-in sale button');
});

test('3. POS DIALOG STRUCTURE: HTML contains full 2-column POS interface with search, cart, and payment boxes', () => {
  assert.ok(indexHtml.includes('id="walkin-sale-dialog"'), 'Must contain #walkin-sale-dialog');
  assert.ok(indexHtml.includes('class="walkin-pos-dialog"'), 'Must contain class walkin-pos-dialog');
  assert.ok(indexHtml.includes('id="walkin-search-input"'), 'Must contain #walkin-search-input');
  assert.ok(indexHtml.includes('id="walkin-category-bar"'), 'Must contain #walkin-category-bar');
  assert.ok(indexHtml.includes('id="walkin-results-container"'), 'Must contain #walkin-results-container');
  assert.ok(indexHtml.includes('id="walkin-cust-name"'), 'Must contain #walkin-cust-name');
  assert.ok(indexHtml.includes('id="walkin-cust-phone"'), 'Must contain #walkin-cust-phone');
  assert.ok(indexHtml.includes('id="walkin-rx-gate-banner"'), 'Must contain #walkin-rx-gate-banner');
  assert.ok(indexHtml.includes('id="walkin-rx-verified"'), 'Must contain #walkin-rx-verified');
  assert.ok(indexHtml.includes('id="walkin-cart-list"'), 'Must contain #walkin-cart-list');
  assert.ok(indexHtml.includes('id="walkin-subtotal-val"'), 'Must contain #walkin-subtotal-val');
  assert.ok(indexHtml.includes('id="walkin-discount-input"'), 'Must contain #walkin-discount-input');
  assert.ok(indexHtml.includes('id="walkin-total-val"'), 'Must contain #walkin-total-val');
  assert.ok(indexHtml.includes('id="pos-btn-method-cash"'), 'Must contain Cash payment button');
  assert.ok(indexHtml.includes('id="pos-btn-method-mtn"'), 'Must contain MTN MoMo button');
  assert.ok(indexHtml.includes('id="pos-btn-method-airtel"'), 'Must contain Airtel Money button');
  assert.ok(indexHtml.includes('id="pos-btn-method-card"'), 'Must contain Card / POS button');
  assert.ok(indexHtml.includes('id="walkin-cash-received"'), 'Must contain Cash Received input');
  assert.ok(indexHtml.includes('id="walkin-quick-cash-chips"'), 'Must contain quick cash chips');
  assert.ok(indexHtml.includes('id="walkin-change-val"'), 'Must contain change display');
  assert.ok(indexHtml.includes('id="walkin-complete-btn"'), 'Must contain complete sale button');
});

test('4. REFERENCE GENERATOR: Generates unique BC-SALE-YYYYMMDD-XXXX references', () => {
  const ref1 = generateWalkinSaleReference();
  const ref2 = generateWalkinSaleReference();
  assert.notEqual(ref1, ref2, 'Sale references must be unique');

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  assert.ok(ref1.startsWith(`BC-SALE-${todayStr}-`), `Reference ${ref1} must start with BC-SALE-YYYYMMDD-`);
  assert.match(ref1, /^BC-SALE-\d{8}-\d{4}$/, 'Reference must match BC-SALE-YYYYMMDD-XXXX format');
});

test('5. FAST SEARCH & ALPHABETICAL ORDER: Search finds medicines by name, generic, brand, SKU', () => {
  const sampleProducts = [
    { id: 'M01', name: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol', brandName: 'Panadol', category: 'Pain Relief', price: 5000, stockQuantity: 50 },
    { id: 'M02', name: 'Amoxicillin 500mg Capsules', genericName: 'Amoxicillin Trihydrate', brandName: 'Amoxil', category: 'Antibiotics', price: 15000, stockQuantity: 30 },
    { id: 'M03', name: 'Amlodipine 5mg Tablets', genericName: 'Amlodipine Besylate', brandName: 'Norvasc', category: 'Chronic Care', price: 12000, stockQuantity: 25 },
    { id: 'M04', name: 'Ibuprofen 400mg Tablets', genericName: 'Ibuprofen', brandName: 'Brufen', category: 'Pain Relief', price: 8000, stockQuantity: 40 }
  ];

  // Search by brand name
  const brandSearch = searchMedicinesCatalog(sampleProducts, 'Panadol');
  assert.ok(brandSearch.length > 0, 'Brand search should find Panadol');
  assert.equal(brandSearch[0].id, 'M01');

  // Search by generic name
  const genericSearch = searchMedicinesCatalog(sampleProducts, 'Amoxicillin');
  assert.ok(genericSearch.length > 0, 'Generic search should find Amoxicillin');
  assert.equal(genericSearch[0].id, 'M02');

  // Prefix search
  const prefixSearch = searchMedicinesCatalog(sampleProducts, 'Am');
  assert.ok(prefixSearch.length >= 2, 'Prefix Am should match Amoxicillin and Amlodipine');

  // Alphabetical sorting
  const sorted = sortMedicinesList(sampleProducts, 'name-asc');
  assert.equal(sorted[0].name, 'Amlodipine 5mg Tablets');
  assert.equal(sorted[1].name, 'Amoxicillin 500mg Capsules');
  assert.equal(sorted[2].name, 'Ibuprofen 400mg Tablets');
  assert.equal(sorted[3].name, 'Paracetamol 500mg Tablets');
});

test('6. PRESCRIPTION GATE: Requires explicit verification checkbox before dispensing Rx medicine', () => {
  assert.ok(appJs.includes('walkin-rx-gate-banner'), 'app.js must manage #walkin-rx-gate-banner');
  assert.ok(appJs.includes('walkin-rx-verified'), 'app.js must check #walkin-rx-verified');
  assert.ok(appJs.includes('Prescription verification check required before dispensing prescription medicine'), 'app.js must enforce prescription verification check');
});

test('7. CASH PAYMENT & CHANGE DUE: Change = Received - Total; blocks completion if Received < Total', () => {
  assert.ok(appJs.includes('change = receivedVal - total'), 'app.js must calculate change as receivedVal - total');
  assert.ok(appJs.includes('Insufficient cash received'), 'app.js must detect insufficient cash');
  assert.ok(appJs.includes('walkin-insufficient-cash-alert'), 'app.js must show insufficient cash alert');
});

test('8. MOBILE MONEY VALIDATION: Validates MTN (076/077/078) and Airtel (070/074/075) numbers', () => {
  assert.ok(appJs.includes('076') && appJs.includes('077') && appJs.includes('078'), 'Must check MTN Uganda prefixes');
  assert.ok(appJs.includes('070') && appJs.includes('074') && appJs.includes('075'), 'Must check Airtel Uganda prefixes');
});

test('9. CENTRAL ORDER CREATION: Sale recorded in central STATE.orders with saleSource: WALK_IN and staff attribution', () => {
  assert.ok(appJs.includes('saleSource: "WALK_IN"'), 'Must assign saleSource: WALK_IN to walk-in orders');
  assert.ok(appJs.includes('orderStatus: "Completed"'), 'Must assign orderStatus: Completed to counter sales');
  assert.ok(appJs.includes('paymentStatus: "Paid"'), 'Must assign paymentStatus: Paid to counter sales');
  assert.ok(appJs.includes('staffId') && appJs.includes('staffName') && appJs.includes('staffRole'), 'Must record staff member attribution');
  assert.ok(appJs.includes('STATE.orders.unshift(newSaleOrder)'), 'Must save directly to central STATE.orders');
});

test('10. INVENTORY DEDUCTION: Stock decremented in STATE.products and recorded in STATE.inventoryLogs', () => {
  assert.ok(appJs.includes('prod.stockQuantity = newStock'), 'Must update prod.stockQuantity upon sale');
  assert.ok(appJs.includes('type: "stock_out"'), 'Must record stock_out in inventory logs');
  assert.ok(appJs.includes('Physical counter sale'), 'Must provide physical sale reason in inventory logs');
});

test('11. OFFICIAL RECEIPT EXTENSION: Displays staff name, role, cash received, change given, and + Start New Walk-in Sale', () => {
  assert.ok(indexHtml.includes('id="rec-staff-meta-item"'), 'Receipt dialog must have #rec-staff-meta-item');
  assert.ok(indexHtml.includes('id="rec-cash-received-row"'), 'Receipt dialog must have #rec-cash-received-row');
  assert.ok(indexHtml.includes('id="rec-cash-change-row"'), 'Receipt dialog must have #rec-cash-change-row');
  assert.ok(indexHtml.includes('id="receipt-new-walkin-btn"'), 'Receipt dialog must have #receipt-new-walkin-btn');
  assert.ok(appJs.includes('rec-staff-name'), 'app.js must populate rec-staff-name');
  assert.ok(appJs.includes('rec-cash-received-val'), 'app.js must populate rec-cash-received-val');
  assert.ok(appJs.includes('rec-cash-change-val'), 'app.js must populate rec-cash-change-val');
  assert.ok(appJs.includes('receipt-new-walkin-btn'), 'app.js must manage receipt-new-walkin-btn visibility');
});

test('12. ADMIN SALES OVERVIEW UNIFICATION: Total Sales = Online Sales + Walk-in Sales', () => {
  const refDate = new Date(2026, 8, 5, 14, 0, 0); // Sep 5, 2026 2:00 PM

  const testOrders = [
    // Online Order 1: 500,000 UGX
    {
      id: 'ORD-ONLINE-01',
      orderNumber: 'ORD-ONLINE-01',
      saleSource: 'ONLINE',
      source: 'ONLINE',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 500000,
      createdAt: new Date(2026, 8, 5, 9, 30, 0).toISOString()
    },
    // Walk-in Counter Sale: 300,000 UGX
    {
      id: 'BC-SALE-20260905-1001',
      orderNumber: 'BC-SALE-20260905-1001',
      saleSource: 'WALK_IN',
      source: 'WALK_IN',
      orderStatus: 'Completed',
      paymentStatus: 'Paid',
      total: 300000,
      staffName: 'Pharm. Sarah Namusoke',
      staffRole: 'Pharmacist',
      createdAt: new Date(2026, 8, 5, 10, 15, 0).toISOString()
    }
  ];

  // 1. All Sales (default)
  const allSalesData = calculateSalesOverviewData('today', testOrders, refDate, 'all');
  assert.equal(allSalesData.totalSales, 800000, 'Admin Total Sales must equal Online (500,000) + Walk-in (300,000) = 800,000 UGX');
  assert.equal(allSalesData.totalOrders, 2, 'Admin Total Orders must equal 2');
  assert.equal(allSalesData.onlineSales, 500000, 'Online Sales must be 500,000 UGX');
  assert.equal(allSalesData.onlineOrders, 1, 'Online Orders count must be 1');
  assert.equal(allSalesData.walkinSales, 300000, 'Walk-in Sales must be 300,000 UGX');
  assert.equal(allSalesData.walkinOrders, 1, 'Walk-in Orders count must be 1');

  // 2. Online Sales Filter
  const onlineOnlyData = calculateSalesOverviewData('today', testOrders, refDate, 'online');
  assert.equal(onlineOnlyData.totalSales, 500000, 'Online Filter must strictly return 500,000 UGX');
  assert.equal(onlineOnlyData.totalOrders, 1, 'Online Filter must strictly return 1 order');

  // 3. Walk-in Sales Filter
  const walkinOnlyData = calculateSalesOverviewData('today', testOrders, refDate, 'walk_in');
  assert.equal(walkinOnlyData.totalSales, 300000, 'Walk-in Filter must strictly return 300,000 UGX');
  assert.equal(walkinOnlyData.totalOrders, 1, 'Walk-in Filter must strictly return 1 sale');
});

test('13. ADMIN ORDERS & SALES HISTORY TABLE: Displays Channel / Source and Staff Member columns', () => {
  assert.ok(appJs.includes('Channel / Source'), 'Orders table must include Channel / Source column');
  assert.ok(appJs.includes('Staff Member'), 'Orders table must include Staff Member column');
  assert.ok(appJs.includes('source-walkin'), 'Orders table must include source-walkin badge class');
  assert.ok(appJs.includes('source-online'), 'Orders table must include source-online badge class');
});

test('14. CSS STYLING: Stylesheet contains complete POS and Sales Channel breakdown classes', () => {
  assert.ok(stylesCss.includes('.walkin-pos-dialog'), 'Must contain .walkin-pos-dialog CSS');
  assert.ok(stylesCss.includes('.pos-container-grid'), 'Must contain .pos-container-grid CSS');
  assert.ok(stylesCss.includes('.pos-med-card'), 'Must contain .pos-med-card CSS');
  assert.ok(stylesCss.includes('.pos-quick-cash-chips'), 'Must contain .pos-quick-cash-chips CSS');
  assert.ok(stylesCss.includes('.pos-chip-btn'), 'Must contain .pos-chip-btn CSS');
  assert.ok(stylesCss.includes('.pos-change-display'), 'Must contain .pos-change-display CSS');
  assert.ok(stylesCss.includes('.sales-source-tabs'), 'Must contain .sales-source-tabs CSS');
  assert.ok(stylesCss.includes('.sales-source-pill'), 'Must contain .sales-source-pill CSS');
  assert.ok(stylesCss.includes('.sales-source-breakdown-grid'), 'Must contain .sales-source-breakdown-grid CSS');
  assert.ok(stylesCss.includes('.source-pill.source-walkin'), 'Must contain .source-pill.source-walkin CSS');
  assert.ok(stylesCss.includes('.source-pill.source-online'), 'Must contain .source-pill.source-online CSS');
});
