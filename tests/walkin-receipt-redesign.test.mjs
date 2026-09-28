import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateUgandanPhone, normalizeUgandanPhone } from '../validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, '../BLOOMCARE-main/app.js');
const indexHtmlPath = path.resolve(__dirname, '../BLOOMCARE-main/index.html');
const stylesCssPath = path.resolve(__dirname, '../BLOOMCARE-main/styles.css');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

test('1. COMPLETE WALK-IN SALE DOES NOT ATTACH DUMMY EMAIL', () => {
  // Ensure "walkin@bloomcare.local" does not exist in app.js
  assert.ok(!appJs.includes('walkin@bloomcare.local'), 'Must not contain walkin@bloomcare.local anywhere in app.js');
  // Ensure customerEmail is set to empty string for walk-in sales
  assert.ok(appJs.includes('customerEmail: "",'), 'Walk-in order creation must set customerEmail to empty string');
});

test('2. RECEIPT MODAL SUPPRESSES CUSTOMER EMAIL ROW FOR WALK-IN SALES', () => {
  assert.ok(appJs.includes('if (custEmailRow) custEmailRow.style.display = "none";'), 'app.js must hide custEmailRow for walk-ins');
  assert.ok(appJs.includes('if (custEmailEl) custEmailEl.textContent = "";'), 'app.js must clear custEmailEl for walk-ins');
  assert.ok(stylesCss.includes('.receipt-sheet.walkin-receipt-mode #rec-cust-email-row'), 'CSS must strictly suppress #rec-cust-email-row in walkin-receipt-mode');
  assert.ok(stylesCss.includes('body.thermal-print-mode #rec-cust-email-row'), 'CSS must strictly suppress #rec-cust-email-row in thermal-print-mode');
});

test('3. MINIMAL CUSTOMER SECTION: PHONE OPTIONAL & DEFAULTS TO WALK-IN CUSTOMER', () => {
  assert.ok(appJs.includes('"Walk-in Customer"'), 'Must default customer name to Walk-in Customer');
  assert.ok(appJs.includes('if (custPhoneRow) custPhoneRow.style.display = "none";'), 'Must hide phone row when phone is not provided');
});

test('4. ATTENDED BY PHARMACIST DYNAMIC ATTRIBUTION', () => {
  assert.ok(appJs.includes('staffLabelEl.textContent = isWalkin ? "Attended By:" : "Dispensed / Sold By:";'), 'Must label staff as Attended By for walk-in sales');
  assert.ok(appJs.includes('staffNameVal.textContent = `${order.staffName} (${order.staffRole || "Pharmacist"})`;'), 'Must display staff name and role');
  assert.ok(appJs.includes('Dr. Amina Nanyonga'), 'Must provide realistic pharmacist fallback');
});

test('5. COMPACT RX STATUS LINE FOR WALK-IN SALES', () => {
  assert.ok(appJs.includes('RX: Verified ✓'), 'Must format verified Rx compactly');
  assert.ok(appJs.includes('RX: Not Required'), 'Must format non-Rx items as RX: Not Required');
  assert.ok(appJs.includes('RX: Not Verified'), 'Must format unverified Rx items as RX: Not Verified');
  assert.ok(stylesCss.includes('.receipt-sheet.walkin-receipt-mode #rec-rx-verified-section'), 'CSS must format compact Rx section');
  assert.ok(stylesCss.includes('.receipt-sheet.walkin-receipt-mode #rec-rx-verified-section .receipt-section-heading'), 'Must hide large heading in walkin Rx section');
});

test('6. COMPACT STATUS & TOTALS', () => {
  assert.ok(appJs.includes('"✓ PAID"'), 'Must show ✓ PAID status badge on walk-in receipt');
  assert.ok(stylesCss.includes('status-paid-verified'), 'CSS must define status-paid-verified pill');
  assert.ok(appJs.includes('formatUGX(order.amountReceived)'), 'Must format cash received');
  assert.ok(appJs.includes('formatUGX(order.changeGiven || 0)'), 'Must format cash change');
});

test('7. DOWNLOAD RECEIPT & THERMAL RECEIPT ARE COMPACT AND EMAIL-FREE', () => {
  assert.ok(appJs.includes('.walkin-receipt-mode #rec-cust-email-row { display: none !important; }'), 'Downloaded receipt must include CSS hiding email');
  assert.ok(appJs.includes('.walkin-receipt-mode #rec-rx-verified-section'), 'Downloaded receipt must include compact Rx styles');
  assert.ok(stylesCss.includes('width: 80mm'), 'Thermal print must be 80mm width');
});

test('8. POS FORM: OPTIONAL CUSTOMER INFORMATION SECTION NEAR TOP', () => {
  assert.ok(indexHtml.includes('id="pos-customer-input-section"'), 'POS form must have #pos-customer-input-section');
  assert.ok(indexHtml.includes('CUSTOMER INFORMATION'), 'POS form must label section CUSTOMER INFORMATION');
  assert.ok(indexHtml.includes('id="walkin-cust-name"'), 'POS form must include #walkin-cust-name input');
  assert.ok(indexHtml.includes('id="walkin-cust-phone"'), 'POS form must include #walkin-cust-phone input');
  assert.ok(indexHtml.includes('id="walkin-cust-phone-error"'), 'POS form must include #walkin-cust-phone-error for validation messages');
  // Check that customer section is positioned before the prescription warning banner or cart list
  const custPos = indexHtml.indexOf('id="pos-customer-input-section"');
  const cartPos = indexHtml.indexOf('id="walkin-cart-list"');
  assert.ok(custPos < cartPos, 'Customer Information section must be located near the top, above the cart list');
});

test('9. UGANDAN PHONE VALIDATION: ACCEPTS 07XXXXXXXX AND +2567XXXXXXXX, REJECTS INVALID', () => {
  // Test local 07 format
  const valid07 = validateUgandanPhone('0701234567');
  assert.ok(valid07.valid, '0701234567 must be valid');
  assert.equal(valid07.normalized, '0701234567');

  // Test international +2567 format
  const valid256 = validateUgandanPhone('+256701234567');
  assert.ok(valid256.valid, '+256701234567 must be valid');
  assert.equal(valid256.normalized, '0701234567');

  // Test formatted with spaces: +256 701 234 567
  const validSpaced = validateUgandanPhone('+256 701 234 567');
  assert.ok(validSpaced.valid, '+256 701 234 567 must be valid');
  assert.equal(validSpaced.normalized, '0701234567');

  // Test invalid numbers
  const invalidShort = validateUgandanPhone('070123');
  assert.ok(!invalidShort.valid, 'Short number must be invalid');
  assert.ok(invalidShort.message, 'Must return error message');

  const invalidPrefix = validateUgandanPhone('0801234567');
  assert.ok(!invalidPrefix.valid, 'Non-07 number must be invalid');

  // Ensure app.js uses validateUgandanPhone for customer phone check
  assert.ok(appJs.includes('validateUgandanPhone(rawCustPhone)'), 'completeWalkinSale must validate rawCustPhone');
});

test('10. RECEIPT FORMATTING: CUSTOMER AND PHONE LABELS', () => {
  assert.ok(appJs.includes('custNameLabel.textContent = "Customer:";'), 'Walk-in receipt must label customer as Customer:');
  assert.ok(appJs.includes('custPhoneLabel.textContent = "Phone:";'), 'Walk-in receipt must label phone as Phone:');
});
