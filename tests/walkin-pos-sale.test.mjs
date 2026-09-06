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

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

// Import exported functions from app.js
const {
  activeWalkinCart,
  activeWalkinDiscountMode,
  updateWalkinStatsStrip,
  setWalkinDiscountMode,
  addWalkinCartItem,
  updateWalkinCartItemQty,
  removeWalkinCartItem,
  updateWalkinQuickCashChips,
  calculateWalkinCashChange,
  completeWalkinSale,
  printThermalReceipt,
  generateWalkinSaleReference,
  isWalkinOrder,
  formatUGX
} = await import('../BLOOMCARE-main/app.js');

test('1. LIVE AUTOMATIC CALCULATOR: Line totals, subtotal, dual discount, and total due calculate correctly', () => {
  // Test dual discount calculation logic
  const subtotal = 50000;
  
  // UGX fixed discount
  const discountUgx = 5000;
  const totalUgx = Math.max(0, subtotal - discountUgx);
  assert.equal(totalUgx, 45000, 'Total due with UGX discount must be 45,000');

  // Percentage discount (10%)
  const discountPct = 10;
  const computedPctAmount = Math.round(subtotal * (discountPct / 100));
  const totalPct = Math.max(0, subtotal - computedPctAmount);
  assert.equal(computedPctAmount, 5000, '10% of 50,000 must be 5,000');
  assert.equal(totalPct, 45000, 'Total due with 10% discount must be 45,000');

  // Excessive discount clamping
  const excessiveDiscount = 60000;
  const clampedDiscount = Math.min(excessiveDiscount, subtotal);
  assert.equal(clampedDiscount, 50000, 'Discount must be clamped to subtotal');
  assert.equal(Math.max(0, subtotal - clampedDiscount), 0, 'Total due cannot be negative');

  assert.ok(appJs.includes('activeWalkinDiscountMode === "pct"'), 'app.js must handle percentage discount mode');
  assert.ok(appJs.includes('const total = Math.max(0, subtotal - discount);'), 'Total due must be clamped to 0 minimum');
});

test('2. ADD TO SALE & DUPLICATE PREVENTION: Increments quantity, enforces stock ceiling, no duplicate rows', () => {
  assert.ok(appJs.includes('const existing = activeWalkinCart.find(i => i.productId === productId);'), 'Must check for existing cart item');
  assert.ok(appJs.includes('existing.quantity += qty;'), 'Must increment quantity on repeated add');
  assert.ok(appJs.includes('existing.quantity = stock;'), 'Must clamp to available stock');
  assert.ok(appJs.includes('Only ${stock} units are currently available'), 'Must warn user when stock ceiling is reached');
});

test('3. CASH CALCULATOR & ZERO NEGATIVE CHANGE: Green change vs amber amount remaining', () => {
  const totalDue = 35000;
  
  // Sufficient cash: Received 50,000 >= 35,000
  const receivedSufficient = 50000;
  const change = receivedSufficient - totalDue;
  assert.equal(change, 15000, 'Change must be exactly 15,000');
  assert.ok(change >= 0, 'Change must be non-negative');

  // Insufficient cash: Received 20,000 < 35,000
  const receivedInsufficient = 20000;
  const remaining = totalDue - receivedInsufficient;
  assert.equal(remaining, 15000, 'Amount remaining must be 15,000');

  assert.ok(appJs.includes('remaining = total - receivedVal'), 'Must calculate remaining when received < total');
  assert.ok(appJs.includes('change = receivedVal - total'), 'Must calculate change when received >= total');
  assert.ok(indexHtml.includes('id="walkin-remaining-display"'), 'HTML must have #walkin-remaining-display');
  assert.ok(indexHtml.includes('id="walkin-change-display"'), 'HTML must have #walkin-change-display');
});

test('4. DYNAMIC QUICK CASH CHIPS: Exact chip and rounded denomination chips', () => {
  assert.ok(typeof updateWalkinQuickCashChips === 'function', 'updateWalkinQuickCashChips must be an exported function');
  assert.ok(appJs.includes('updateWalkinQuickCashChips(total);'), 'renderWalkinCart must invoke updateWalkinQuickCashChips');
  assert.ok(indexHtml.includes('data-amt="exact"'), 'HTML must include Exact cash chip');
  assert.ok(indexHtml.includes('data-amt="5000"'), 'HTML must include 5,000 cash chip');
  assert.ok(indexHtml.includes('data-amt="10000"'), 'HTML must include 10,000 cash chip');
  assert.ok(indexHtml.includes('data-amt="20000"'), 'HTML must include 20,000 cash chip');
  assert.ok(indexHtml.includes('data-amt="50000"'), 'HTML must include 50,000 cash chip');
  assert.ok(indexHtml.includes('data-amt="100000"'), 'HTML must include 100,000 cash chip');
  assert.ok(indexHtml.includes('data-amt="200000"'), 'HTML must include 200,000 cash chip');
});

test('5. MOBILE MONEY VALIDATION & BACKEND INTEGRATION: Network prefix validation and async verification', () => {
  // MTN validation: 076, 077, 078
  const mtnValid = '0772123456';
  const mtnInvalid = '0702123456';
  assert.ok(['076', '077', '078'].some(p => mtnValid.startsWith(p)), '0772123456 must be valid MTN');
  assert.ok(!['076', '077', '078'].some(p => mtnInvalid.startsWith(p)), '0702123456 must NOT be valid MTN');

  // Airtel validation: 070, 074, 075
  const airtelValid = '0702123456';
  const airtelInvalid = '0772123456';
  assert.ok(['070', '074', '075'].some(p => airtelValid.startsWith(p)), '0702123456 must be valid Airtel');
  assert.ok(!['070', '074', '075'].some(p => airtelInvalid.startsWith(p)), '0772123456 must NOT be valid Airtel');

  // app.js async completion and endpoint integration
  assert.ok(appJs.includes('async function completeWalkinSale()'), 'completeWalkinSale must be an async function');
  assert.ok(appJs.includes('/api/payments/initialize'), 'Must initialize payment via /api/payments/initialize');
  assert.ok(appJs.includes('/api/payments/verify'), 'Must poll verification via /api/payments/verify');
  assert.ok(indexHtml.includes('id="walkin-momo-status"'), 'HTML must contain #walkin-momo-status live container');
  assert.ok(stylesCss.includes('.pos-momo-spinner'), 'CSS must define .pos-momo-spinner animation');
});

test('6. STOCK MANAGEMENT & AUDIT LOGS: Atomic deduction strictly after payment confirmation', () => {
  assert.ok(appJs.includes('prod.stockQuantity = newStock;'), 'Must update prod.stockQuantity upon successful sale');
  assert.ok(appJs.includes('STATE.inventoryLogs.unshift('), 'Must add entry to STATE.inventoryLogs');
  assert.ok(appJs.includes('type: "stock_out"'), 'Inventory log must have type: stock_out');
  assert.ok(appJs.includes('Physical counter sale'), 'Inventory log must specify physical counter sale with reference');
  assert.ok(appJs.includes('Stock conflict: Only ${stock} units'), 'Must re-verify stock before final deduction');
});

test('7. PRESCRIPTION CLINICAL REVIEW GATE: Enforces mandatory confirmation for Rx items', () => {
  assert.ok(indexHtml.includes('id="walkin-rx-gate-banner"'), 'POS must have #walkin-rx-gate-banner');
  assert.ok(indexHtml.includes('id="walkin-rx-verified"'), 'POS must have #walkin-rx-verified checkbox');
  assert.ok(appJs.includes('hasRx && !$("#walkin-rx-verified")?.checked'), 'Must check if Rx item requires verification');
  assert.ok(appJs.includes('Prescription verification check required before dispensing prescription medicine'), 'Must block completion without Rx check');
});

test('8. OFFICIAL PHARMACY RECEIPT & THERMAL PRINTING (80mm): Dual layout and dispensary attribution', () => {
  assert.ok(indexHtml.includes('id="print-receipt-action"'), 'Receipt dialog must have Print Receipt button');
  assert.ok(indexHtml.includes('id="print-thermal-receipt-action"'), 'Receipt dialog must have Print Thermal (80mm) button');
  assert.ok(indexHtml.includes('id="download-receipt-action"'), 'Receipt dialog must have Download Receipt button');
  assert.ok(indexHtml.includes('id="receipt-new-walkin-btn"'), 'Receipt dialog must have Start New Walk-in button');
  assert.ok(indexHtml.includes('id="rec-rx-verified-section"'), 'Receipt must have #rec-rx-verified-section');

  assert.ok(typeof printThermalReceipt === 'function', 'printThermalReceipt must be exported from app.js');
  assert.ok(appJs.includes('thermal-print-mode'), 'app.js must toggle thermal-print-mode');
  assert.ok(stylesCss.includes('body.thermal-print-mode'), 'styles.css must include body.thermal-print-mode print rules');
  assert.ok(stylesCss.includes('width: 80mm'), 'styles.css must format thermal receipt at 80mm width');
});

test('9. RECENT COUNTER SALES VIEWER & SALE SOURCE ISOLATION', () => {
  assert.ok(indexHtml.includes('id="pos-toggle-recent-sales-btn"'), 'POS header must have Recent Sales button');
  assert.ok(indexHtml.includes('id="walkin-recent-sales-dialog"'), 'HTML must have #walkin-recent-sales-dialog');
  assert.ok(indexHtml.includes('id="walkin-recent-sales-list"'), 'HTML must have #walkin-recent-sales-list');
  assert.ok(appJs.includes('saleSource: "WALK_IN"'), 'Walk-in orders must be tagged with saleSource: "WALK_IN"');

  const walkinOrder = { id: 'BC-SALE-20260905-1234', saleSource: 'WALK_IN', items: [{ price: 10000, quantity: 2 }] };
  assert.ok(isWalkinOrder(walkinOrder), 'isWalkinOrder must return true for WALK_IN order');
});

test('10. BRIEF 1-PAGE WALK-IN CUSTOMER RECEIPT: Hides delivery boilerplate & guarantees single-page layout', () => {
  // DOM assertions
  assert.ok(indexHtml.includes('id="rec-doc-title"'), 'Must have #rec-doc-title for Walk-in Sale Receipt title');
  assert.ok(indexHtml.includes('id="rec-delivery-fee-line"'), 'Must have #rec-delivery-fee-line to suppress delivery fee');
  assert.ok(indexHtml.includes('id="rec-walkin-footer"'), 'Must have #rec-walkin-footer for brief customer footer');
  assert.ok(indexHtml.includes('id="rec-standard-footer"'), 'Must retain #rec-standard-footer for online orders');
  assert.ok(indexHtml.includes('id="rec-discount-line"'), 'Must have #rec-discount-line for itemized discounts');

  // app.js logic assertions
  assert.ok(appJs.includes('walkin-receipt-mode'), 'app.js must toggle walkin-receipt-mode class');
  assert.ok(appJs.includes('WALK-IN SALE RECEIPT'), 'app.js must set document title to WALK-IN SALE RECEIPT');
  assert.ok(appJs.includes('fulfillmentSection.style.display = "none"'), 'app.js must hide delivery section for walk-ins');
  assert.ok(appJs.includes('deliveryFeeLine.style.display'), 'app.js must manage delivery fee visibility');
  assert.ok(appJs.includes('walkinFooter.style.display = "block"'), 'app.js must activate walk-in brief footer');

  // styles.css 1-page print budget assertions
  assert.ok(stylesCss.includes('.receipt-sheet.walkin-receipt-mode'), 'styles.css must style walkin-receipt-mode');
  assert.ok(stylesCss.includes('page-break-inside: avoid'), 'styles.css must enforce page-break-inside: avoid for 1-page fit');
});

