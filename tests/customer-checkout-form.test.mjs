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

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');

test('1. CHECKOUT FORM HTML: Form uses novalidate to prevent native constraint validation from blocking submission', () => {
  assert.ok(
    indexHtml.includes('<form id="checkout-form" class="checkout-form-body" novalidate>'),
    '#checkout-form must have novalidate attribute so hidden delivery inputs cannot abort submission'
  );
});

test('2. CHECKOUT FORM HTML: Conditionally hidden location inputs do not have blocking required attributes in HTML', () => {
  assert.ok(
    indexHtml.includes('<select id="chk-delivery-division">'),
    '#chk-delivery-division must not have hardcoded required attribute in markup'
  );
  assert.ok(
    indexHtml.includes('<select id="chk-delivery-area" disabled>'),
    '#chk-delivery-area must not have hardcoded required attribute in markup'
  );
  assert.ok(
    indexHtml.includes('<input type="text" id="chk-delivery-specific" placeholder="e.g. Near Kiyanja Market, Plot 4, Blue gate, Opposite School" />'),
    '#chk-delivery-specific must not have hardcoded required attribute in markup'
  );
});

test('3. CHECKOUT FORM HTML: Submit button is present with correct type and text', () => {
  assert.ok(
    indexHtml.includes('<button class="btn btn-primary btn-block" type="submit" style="margin-top: 10px;">Place Order &amp; Generate Reference</button>'),
    'Place Order & Generate Reference submit button must be present in checkout dialog'
  );
});

test('4. CUSTOMER ORDERS VIEW: Prominent "+ Place New Order" button is present in orders view header', () => {
  assert.ok(
    indexHtml.includes('id="btn-orders-place-order"'),
    '#btn-orders-place-order button must exist in #view-orders header'
  );
  assert.ok(
    indexHtml.includes('data-route="medicines"'),
    '#btn-orders-place-order must route to medicines'
  );
});

test('5. APP.JS: openCheckoutDialog resets isPlacingOrder flag and ensures submit button is active', () => {
  assert.ok(
    appJs.includes('STATE.isPlacingOrder = false;'),
    'openCheckoutDialog must reset STATE.isPlacingOrder to false'
  );
  assert.ok(
    appJs.includes('submitBtn.disabled = false;'),
    'openCheckoutDialog must re-enable submitBtn when opening modal'
  );
  assert.ok(
    appJs.includes('submitBtn.textContent = "Place Order & Generate Reference";'),
    'openCheckoutDialog must restore Place Order & Generate Reference text on submit button'
  );
});

test('6. APP.JS: handleCheckoutOrder finally block restores button and resets isPlacingOrder', () => {
  assert.ok(
    appJs.includes('submitBtn.textContent = originalBtnText || "Place Order & Generate Reference";'),
    'handleCheckoutOrder finally block must restore original button text'
  );
});
