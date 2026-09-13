import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'BLOOMCARE-main', 'index.html');
const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const cssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');
const firebaseJsPath = path.join(rootDir, 'BLOOMCARE-main', 'firebase.js');

test('1. JUMIA MACRO-CATEGORIES BAR: All categories present in index.html and app.js', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="marketplace-categories-bar"'), 'Categories bar must exist in index.html');

  const requiredCategories = [
    'All',
    'Prescription Medicines',
    'Over-the-Counter',
    'Pain & Fever',
    'Personal Care',
    'Baby Care',
    'Vitamins & Supplements',
    'Medical Equipment',
    'Beauty & Wellness'
  ];

  for (const cat of requiredCategories) {
    const escaped = cat.replace(/&/g, '&amp;');
    assert.ok(
      html.includes(`data-macro-category="${cat}"`) || html.includes(`data-macro-category="${escaped}"`),
      `Category pill for "${cat}" must exist in HTML`
    );
  }
});

test('2. SMART SEARCH BAR: Placeholder, clear button, and suggestions dropdown', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(
    html.includes('placeholder="Search medicines, healthcare products and more..."'),
    'Search input must have Jumia-style placeholder'
  );
  assert.ok(html.includes('id="top-search-clear"'), 'Search clear button must exist');
  assert.ok(html.includes('id="top-search-suggestions"'), 'Search suggestions dropdown must exist');
});

test('3. WISHLIST SYSTEM: Nav trigger, count badge, modal, and controller functions', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  assert.ok(html.includes('id="open-wishlist-btn"'), 'Wishlist nav trigger button must exist');
  assert.ok(html.includes('id="nav-wishlist-count"'), 'Wishlist badge count must exist');
  assert.ok(html.includes('id="wishlist-dialog"'), 'Wishlist dialog must exist');
  assert.ok(html.includes('id="wishlist-items-container"'), 'Wishlist items container must exist');

  assert.ok(appJs.includes('export function isInWishlist'), 'isInWishlist function must be exported');
  assert.ok(appJs.includes('export async function toggleProductWishlist'), 'toggleProductWishlist function must be exported');
  assert.ok(appJs.includes('export function saveCartItemForLater'), 'saveCartItemForLater function must be exported');
  assert.ok(appJs.includes('export function openWishlistModal'), 'openWishlistModal function must be exported');
});

test('4. ADDRESS BOOK CRUD: Form dialog, inputs, and Firestore persistence', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const fbJs = fs.readFileSync(firebaseJsPath, 'utf8');

  assert.ok(html.includes('id="address-dialog"'), 'Address dialog must exist');
  assert.ok(html.includes('id="addr-label"'), 'Address label input must exist');
  assert.ok(html.includes('id="addr-division"'), 'Address division select must exist');
  assert.ok(html.includes('id="addr-area"'), 'Address area select must exist');
  assert.ok(html.includes('id="addr-landmark"'), 'Address landmark input must exist');
  assert.ok(html.includes('id="addr-phone"'), 'Address phone input must exist');

  assert.ok(appJs.includes('export function openAddressModal'), 'openAddressModal function must be exported');
  assert.ok(appJs.includes('export function handleAddressFormSubmit'), 'handleAddressFormSubmit function must be exported');
  assert.ok(appJs.includes('export function deleteSavedAddress'), 'deleteSavedAddress function must be exported');
  assert.ok(appJs.includes('export function setDefaultAddress'), 'setDefaultAddress function must be exported');

  assert.ok(fbJs.includes('saveUserAddressesToFirestore'), 'Firebase helper saveUserAddressesToFirestore must exist');
  assert.ok(fbJs.includes('getUserAddressesFromFirestore'), 'Firebase helper getUserAddressesFromFirestore must exist');
});

test('5. MULTI-STEP CHECKOUT & DELIVERY SPEEDS: Steps indicator, speed cards, and Buy Now', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  assert.ok(html.includes('id="checkout-steps-bar"'), 'Checkout steps bar must exist');
  assert.ok(html.includes('id="chk-delivery-speed-wrap"'), 'Delivery speed selector wrap must exist');
  assert.ok(html.includes('id="speed-card-standard"'), 'Standard speed card (UGX 5,000) must exist');
  assert.ok(html.includes('id="speed-card-express"'), 'Express priority speed card (UGX 8,000) must exist');
  assert.ok(html.includes('id="chk-saved-addresses-cards"'), 'Saved addresses cards row must exist');

  assert.ok(appJs.includes('export function handleBuyNow'), 'handleBuyNow function must be exported');
  assert.ok(appJs.includes('export function switchCheckoutStep'), 'switchCheckoutStep function must be exported');
  assert.ok(appJs.includes('export function handleDeliverySpeedChange'), 'handleDeliverySpeedChange function must be exported');
  assert.ok(appJs.includes('export function renderCheckoutSavedAddresses'), 'renderCheckoutSavedAddresses function must be exported');
});

test('6. CUSTOMER ACCOUNT HUB: 5 Navigation tabs and panels', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  assert.ok(html.includes('id="account-hub-tabs"'), 'Account hub navigation tabs must exist');
  assert.ok(html.includes('id="account-panel-profile"'), 'Profile panel must exist');
  assert.ok(html.includes('id="account-panel-orders"'), 'Orders panel must exist');
  assert.ok(html.includes('id="account-panel-wishlist"'), 'Wishlist panel must exist');
  assert.ok(html.includes('id="account-panel-addresses"'), 'Addresses panel must exist');
  assert.ok(html.includes('id="account-panel-prescriptions"'), 'Prescriptions panel must exist');

  assert.ok(appJs.includes('export function switchAccountTab'), 'switchAccountTab function must be exported');
  assert.ok(appJs.includes('export function renderAccountOrders'), 'renderAccountOrders function must be exported');
  assert.ok(appJs.includes('export function renderAccountWishlist'), 'renderAccountWishlist function must be exported');
  assert.ok(appJs.includes('export function renderAccountAddresses'), 'renderAccountAddresses function must be exported');
  assert.ok(appJs.includes('export function renderAccountPrescriptions'), 'renderAccountPrescriptions function must be exported');
});

test('7. IDEMPOTENT INVENTORY DEDUCTION: Stock deduction checks inventoryDeducted guard', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(
    appJs.includes('!newOrder.inventoryDeducted') && appJs.includes('newOrder.inventoryDeducted = true'),
    'handleCheckoutOrder must guard stock deduction with inventoryDeducted flag'
  );
});

test('8. PROMOTIONAL HERO BANNER & VALUE STRIP: Responsive merchandising and trust badges', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="marketplace-promo-banner"'), 'Merchandising hero promo banner must exist');
  assert.ok(html.includes('class="marketplace-value-strip"'), 'Value strip must exist');
  assert.ok(html.includes('Genuine Medicines'), 'Value strip must highlight genuine medicines');
  assert.ok(html.includes('Express Delivery'), 'Value strip must highlight express delivery');
  assert.ok(html.includes('Pharmacist Support') || html.includes('Clinical Support'), 'Value strip must highlight clinical pharmacist support');
});

test('9. CSS STYLESHEET INTEGRATION: Styling for all new e-commerce components', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.ok(css.includes('.marketplace-categories-bar'), 'CSS must style macro categories bar');
  assert.ok(css.includes('.macro-category-pill'), 'CSS must style category pills');
  assert.ok(css.includes('.marketplace-hero-banner'), 'CSS must style promo banner');
  assert.ok(css.includes('.marketplace-value-strip'), 'CSS must style value strip');
  assert.ok(css.includes('.btn-buy-now'), 'CSS must style Buy Now button');
  assert.ok(css.includes('.checkout-steps-bar'), 'CSS must style checkout steps bar');
  assert.ok(css.includes('.account-hub-tabs'), 'CSS must style account hub tabs');
});
