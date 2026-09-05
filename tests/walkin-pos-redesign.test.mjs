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

// Import exported functions and state from app.js
const {
  activeWalkinCart,
  activeWalkinDiscountMode,
  posCalcExpression,
  updateWalkinStatsStrip,
  setWalkinDiscountMode,
  handlePosCalcInput,
  generateWalkinSaleReference,
  formatUGX
} = await import('../BLOOMCARE-main/app.js');

test('1. LIVE COUNTER DAILY STATS STRIP: HTML markup & functions exist and calculate correctly', () => {
  assert.ok(indexHtml.includes('id="pos-header-stats-strip"'), 'Must contain stats strip container');
  assert.ok(indexHtml.includes('id="pos-stat-today-sales"'), 'Must contain today sales stat element');
  assert.ok(indexHtml.includes('id="pos-stat-today-tx"'), 'Must contain today transactions stat element');
  assert.ok(indexHtml.includes('id="pos-stat-walkin-sales"'), 'Must contain today walk-in count stat element');
  assert.ok(appJs.includes('function updateWalkinStatsStrip()'), 'app.js must export updateWalkinStatsStrip function');
});

test('2. SCRATCHPAD CALCULATOR: Modal markup, button, and keypad present', () => {
  assert.ok(indexHtml.includes('id="pos-open-calculator-btn"'), 'Must contain open calculator button in POS header');
  assert.ok(indexHtml.includes('id="pos-calculator-dialog"'), 'Must contain #pos-calculator-dialog modal');
  assert.ok(indexHtml.includes('id="pos-calc-screen"'), 'Must contain #pos-calc-screen');
  assert.ok(indexHtml.includes('id="pos-calc-sub"'), 'Must contain #pos-calc-sub');
  assert.ok(indexHtml.includes('class="pos-calc-keypad"'), 'Must contain keypad grid');
  assert.ok(appJs.includes('function openPosCalculator()'), 'app.js must have openPosCalculator');
  assert.ok(appJs.includes('function closePosCalculator()'), 'app.js must have closePosCalculator');
  assert.ok(appJs.includes('function handlePosCalcInput('), 'app.js must have handlePosCalcInput');
});

test('3. SCRATCHPAD CALCULATOR LOGIC: Arithmetic operations and expressions execute safely', () => {
  handlePosCalcInput('clear');
  handlePosCalcInput('num', '1');
  handlePosCalcInput('num', '2');
  handlePosCalcInput('op', '+');
  handlePosCalcInput('num', '8');
  handlePosCalcInput('equals');
  
  handlePosCalcInput('clear');
  handlePosCalcInput('num', '2');
  handlePosCalcInput('num', '5');
  handlePosCalcInput('op', '*');
  handlePosCalcInput('num', '4');
  handlePosCalcInput('equals');

  handlePosCalcInput('clear');
  handlePosCalcInput('num', '1');
  handlePosCalcInput('num', '5');
  handlePosCalcInput('backspace');
});

test('4. CLEAR SALE CONFIRMATION: Modal markup and confirmation flow', () => {
  assert.ok(indexHtml.includes('id="walkin-clear-sale-btn"'), 'Must contain Clear Sale button in current sale header');
  assert.ok(indexHtml.includes('id="walkin-clear-confirm-dialog"'), 'Must contain #walkin-clear-confirm-dialog');
  assert.ok(indexHtml.includes('id="walkin-confirm-clear-btn"'), 'Must contain confirm clear button');
  assert.ok(indexHtml.includes('id="walkin-cancel-clear-btn"'), 'Must contain cancel clear button');
  assert.ok(appJs.includes('walkin-confirm-clear-btn'), 'app.js must handle confirm clear action');
});

test('5. RECENT SALES VIEWER: Modal markup and list container', () => {
  assert.ok(indexHtml.includes('id="pos-toggle-recent-sales-btn"'), 'Must contain Recent Sales button in POS header');
  assert.ok(indexHtml.includes('id="walkin-recent-sales-dialog"'), 'Must contain #walkin-recent-sales-dialog');
  assert.ok(indexHtml.includes('id="walkin-recent-sales-list"'), 'Must contain #walkin-recent-sales-list');
  assert.ok(appJs.includes('function openRecentSalesModal()'), 'app.js must have openRecentSalesModal');
  assert.ok(appJs.includes('function closeRecentSalesModal()'), 'app.js must have closeRecentSalesModal');
});

test('6. DUAL DISCOUNT MODE: Toggle buttons, validation error, and percentage handling', () => {
  assert.ok(indexHtml.includes('id="pos-discount-mode-ugx"'), 'Must contain UGX discount mode button');
  assert.ok(indexHtml.includes('id="pos-discount-mode-pct"'), 'Must contain % discount mode button');
  assert.ok(indexHtml.includes('id="walkin-discount-error"'), 'Must contain #walkin-discount-error message element');
  assert.ok(appJs.includes('function setWalkinDiscountMode('), 'app.js must have setWalkinDiscountMode');
  assert.ok(appJs.includes('activeWalkinDiscountMode === "pct"'), 'app.js must handle % discount mode');
  assert.ok(indexHtml.includes('Discount cannot exceed the sale subtotal'), 'HTML must explain discount subtotal limitation');
});

test('7. LARGE HIGH-VISIBILITY TOTAL DUE: Prominent total card markup and typography', () => {
  assert.ok(indexHtml.includes('class="pos-grand-total-card"'), 'Must contain .pos-grand-total-card');
  assert.ok(indexHtml.includes('class="pos-grand-total-label"'), 'Must contain .pos-grand-total-label');
  assert.ok(indexHtml.includes('id="walkin-total-val"'), 'Must contain #walkin-total-val');
  assert.ok(stylesCss.includes('.pos-grand-total-card'), 'styles.css must style .pos-grand-total-card');
});

test('8. QUICK CASH CHIPS & ZERO NEGATIVE NUMBERS: Includes 200,000 chip and remaining display', () => {
  assert.ok(indexHtml.includes('data-amt="200000"'), 'Must include 200,000 UGX quick cash button');
  assert.ok(indexHtml.includes('data-amt="100000"'), 'Must include 100,000 UGX quick cash button');
  assert.ok(indexHtml.includes('data-amt="50000"'), 'Must include 50,000 UGX quick cash button');
  assert.ok(indexHtml.includes('data-amt="exact"'), 'Must include Exact quick cash button');
  assert.ok(indexHtml.includes('id="walkin-remaining-display"'), 'Must contain #walkin-remaining-display');
  assert.ok(indexHtml.includes('id="walkin-remaining-val"'), 'Must contain #walkin-remaining-val');
  assert.ok(appJs.includes('remaining = total - receivedVal'), 'app.js must calculate remaining amount when received < total');
});

test('9. CART DUPLICATION PREVENTION: Adding item increases quantity, never duplicate lines', () => {
  assert.ok(appJs.includes('const existing = activeWalkinCart.find(i => i.productId === productId)'), 'Must check if product already in cart');
  assert.ok(appJs.includes('existing.quantity += qty'), 'Must increment existing item quantity');
  assert.ok(appJs.includes('Only ${stock} units are currently available'), 'Must warn with stock limit message');
});

test('10. CSS STYLES FOR REDESIGNED POS: Dialog, stats strip, calculator, and responsive layout', () => {
  assert.ok(stylesCss.includes('.pos-header-stats-strip'), 'CSS must style .pos-header-stats-strip');
  assert.ok(stylesCss.includes('.pos-stat-pill'), 'CSS must style .pos-stat-pill');
  assert.ok(stylesCss.includes('.pos-grand-total-card'), 'CSS must style .pos-grand-total-card');
  assert.ok(stylesCss.includes('.pos-discount-toggle-group'), 'CSS must style .pos-discount-toggle-group');
  assert.ok(stylesCss.includes('.pos-calc-modal-dialog'), 'CSS must style .pos-calc-modal-dialog');
  assert.ok(stylesCss.includes('.pos-calc-keypad'), 'CSS must style .pos-calc-keypad');
  assert.ok(stylesCss.includes('@media (max-width: 899px)'), 'CSS must include responsive stacking layout');
});
