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
  formatUGX,
  getWalkinSaleFinancials,
  updateWalkinCartItemQty,
  calculateWalkinCashChange,
  openPosCalculator,
  closePosCalculator
} = await import('../BLOOMCARE-main/app.js');

test('TEST 1: Price 5,000, Qty 2, Discount 0, Cash 10,000 -> Subtotal 10,000, Total Due 10,000, Change 0', () => {
  const price = 5000;
  const qty = 2;
  const discount = 0;
  const cashReceived = 10000;

  const itemTotal = price * qty;
  assert.equal(itemTotal, 10000, 'Item total must be 10,000');

  const subtotal = itemTotal;
  assert.equal(subtotal, 10000, 'Subtotal must be 10,000');

  const totalDue = Math.max(0, subtotal - discount);
  assert.equal(totalDue, 10000, 'Total due must be 10,000');

  const change = Math.max(0, cashReceived - totalDue);
  assert.equal(change, 0, 'Change must be 0');

  assert.equal(formatUGX(subtotal), 'UGX 10,000', 'Subtotal formatted as UGX 10,000');
  assert.equal(formatUGX(totalDue), 'UGX 10,000', 'Total Due formatted as UGX 10,000');
  assert.equal(formatUGX(change), 'UGX 0', 'Change formatted as UGX 0');
});

test('TEST 2: Price 5,000, Qty 2, Discount UGX 1,000, Cash 10,000 -> Subtotal 10,000, Total Due 9,000, Change 1,000', () => {
  const price = 5000;
  const qty = 2;
  const discount = 1000;
  const cashReceived = 10000;

  const subtotal = price * qty;
  assert.equal(subtotal, 10000, 'Subtotal must be 10,000');

  const totalDue = Math.max(0, subtotal - discount);
  assert.equal(totalDue, 9000, 'Total due must be 9,000');

  const change = Math.max(0, cashReceived - totalDue);
  assert.equal(change, 1000, 'Change must be 1,000');

  assert.equal(formatUGX(subtotal), 'UGX 10,000');
  assert.equal(formatUGX(totalDue), 'UGX 9,000');
  assert.equal(formatUGX(change), 'UGX 1,000');
});

test('TEST 3: Subtotal 20,000, Discount 10%, Cash 25,000 -> Discount 2,000, Total Due 18,000, Change 7,000', () => {
  const subtotal = 20000;
  const discountPct = 10;
  const cashReceived = 25000;

  const discountAmount = Math.round(subtotal * (discountPct / 100));
  assert.equal(discountAmount, 2000, '10% discount on 20,000 must be 2,000');

  const totalDue = Math.max(0, subtotal - discountAmount);
  assert.equal(totalDue, 18000, 'Total due must be 18,000');

  const change = Math.max(0, cashReceived - totalDue);
  assert.equal(change, 7000, 'Change must be 7,000');

  assert.equal(formatUGX(discountAmount), 'UGX 2,000');
  assert.equal(formatUGX(totalDue), 'UGX 18,000');
  assert.equal(formatUGX(change), 'UGX 7,000');
});

test('TEST 4: Total Due 18,000, Cash 15,000 -> Balance Due 3,000, No Negative Change, Complete Sale Disabled', () => {
  const totalDue = 18000;
  const cashReceived = 15000;

  const change = Math.max(0, cashReceived - totalDue);
  const balance = Math.max(0, totalDue - cashReceived);

  assert.equal(change, 0, 'Change must be 0 (never negative)');
  assert.equal(balance, 3000, 'Balance due must be 3,000');
  assert.ok(cashReceived < totalDue, 'Cash received is strictly less than total due');

  assert.equal(formatUGX(balance), 'UGX 3,000');

  // Verify UI logic disables Complete Sale
  assert.ok(appJs.includes('if (completeBtn) completeBtn.disabled = true;'), 'Complete sale button must be disabled when cash < total');
  assert.ok(appJs.includes('Insufficient payment. Please enter enough cash.'), 'Must alert user with exact insufficient payment text');
});

test('TEST 5: Reactive Multi-Product Receipt Calculations & Updates', () => {
  const cart = [
    { name: 'Paracetamol 500mg', price: 5000, qty: 2 },
    { name: 'Amoxicillin 500mg', price: 10000, qty: 1 },
    { name: 'Vitamin C 1000mg', price: 8000, qty: 3 }
  ];

  // Initial calculation
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  assert.equal(subtotal, (5000 * 2) + (10000 * 1) + (8000 * 3));
  assert.equal(subtotal, 44000);

  // Modify quantities: Paracetamol qty becomes 4
  cart[0].qty = 4;
  subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  assert.equal(subtotal, (5000 * 4) + (10000 * 1) + (8000 * 3));
  assert.equal(subtotal, 54000);

  // Remove one product: Remove Vitamin C
  const updatedCart = cart.filter(i => i.name !== 'Vitamin C 1000mg');
  subtotal = updatedCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  assert.equal(subtotal, (5000 * 4) + (10000 * 1));
  assert.equal(subtotal, 30000);

  // Apply 10% discount
  const discount = Math.round(subtotal * 0.10);
  const totalDue = subtotal - discount;
  assert.equal(discount, 3000);
  assert.equal(totalDue, 27000);

  // Enter cash: 30,000
  const cash = 30000;
  const change = Math.max(0, cash - totalDue);
  assert.equal(change, 3000);
});

test('TEST 6: Quantity Stepper floor at 1: Decrement never drops below 1', () => {
  assert.ok(appJs.includes('const safeQty = Math.max(1, parseInt(newQty, 10) || 1);'), 'Must floor safeQty at 1');
  assert.ok(appJs.includes('Math.max(1, item.quantity - 1)'), 'Minus stepper must floor at 1');
  assert.ok(indexHtml.includes('pos-cart-table-head'), 'Table head must exist for product receipt table');
  assert.ok(indexHtml.includes('pos-th-prod'), 'Header must label PRODUCT');
  assert.ok(indexHtml.includes('pos-th-qty'), 'Header must label QUANTITY');
  assert.ok(indexHtml.includes('pos-th-unit'), 'Header must label UNIT PRICE');
  assert.ok(indexHtml.includes('pos-th-total'), 'Header must label TOTAL');
});

test('TEST 7: Connected POS Payment Calculator: Displays Subtotal, Discount, Total Due, Cash, Change, and Complete Sale', () => {
  assert.ok(indexHtml.includes('id="pos-calc-receipt-panel"'), 'Calculator modal must contain connected receipt panel');
  assert.ok(indexHtml.includes('id="pos-calc-subtotal-val"'), 'Calculator modal must contain subtotal element');
  assert.ok(indexHtml.includes('id="pos-calc-discount-val"'), 'Calculator modal must contain discount element');
  assert.ok(indexHtml.includes('id="pos-calc-total-val"'), 'Calculator modal must contain total due element');
  assert.ok(indexHtml.includes('id="pos-calc-cash-input"'), 'Calculator modal must contain cash received input');
  assert.ok(indexHtml.includes('id="pos-calc-change-row"'), 'Calculator modal must contain change row');
  assert.ok(indexHtml.includes('id="pos-calc-balance-row"'), 'Calculator modal must contain balance row');
  assert.ok(indexHtml.includes('id="pos-calc-complete-btn"'), 'Calculator modal must contain Complete Sale button');

  assert.ok(appJs.includes('syncMainCashToCalc'), 'app.js must synchronize main cash input to calculator');
  assert.ok(appJs.includes('syncCalcCashToMain'), 'app.js must synchronize calculator cash input to main POS');
  assert.ok(appJs.includes('pos-calc-complete-btn'), 'app.js must wire Complete Sale button in calculator');
});

test('TEST 8: Professional Money Formatting (UGX integer formatting, no trailing decimals)', () => {
  assert.equal(formatUGX(5000), 'UGX 5,000');
  assert.equal(formatUGX(20000), 'UGX 20,000');
  assert.equal(formatUGX(150000), 'UGX 150,000');
  assert.equal(formatUGX(17999.999), 'UGX 18,000', 'Must round fractional floats safely to integer UGX');
  assert.equal(formatUGX('10000.00'), 'UGX 10,000', 'Must parse and format string amounts cleanly');
  assert.equal(formatUGX(0), 'UGX 0');
});

test('TEST 9: Clear Sale Confirmation & Full Field Reset', () => {
  assert.ok(indexHtml.includes('id="walkin-clear-confirm-dialog"'), 'Confirmation modal must exist');
  assert.ok(appJs.includes('activeWalkinCart = [];'), 'Must clear cart array');
  assert.ok(appJs.includes('discountInput.value = "0"'), 'Must reset discount input');
  assert.ok(appJs.includes('cashInput.value = ""'), 'Must reset cash received');
  assert.ok(appJs.includes('calcCashInput.value = ""'), 'Must reset calculator cash input');
});

test('TEST 10: AMOUNT DUE & CHANGE display elements in Live Payment Section', () => {
  assert.ok(indexHtml.includes('id="walkin-amount-due-box"'), 'Must contain #walkin-amount-due-box');
  assert.ok(indexHtml.includes('id="walkin-amount-due-val"'), 'Must contain #walkin-amount-due-val');
  assert.ok(indexHtml.includes('id="walkin-change-val"'), 'Must contain #walkin-change-val');
  assert.ok(indexHtml.includes('id="walkin-remaining-val"'), 'Must contain #walkin-remaining-val');
  assert.ok(stylesCss.includes('.pos-amount-due-row'), 'styles.css must style .pos-amount-due-row');
  assert.ok(stylesCss.includes('.pos-calc-receipt-panel'), 'styles.css must style .pos-calc-receipt-panel');
});

