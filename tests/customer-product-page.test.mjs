import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const bloomcareDir = path.join(rootDir, 'BLOOMCARE-main');
const appJsPath = path.join(bloomcareDir, 'app.js');
const indexHtmlPath = path.join(bloomcareDir, 'index.html');
const stylesCssPath = path.join(bloomcareDir, 'styles.css');

test('1. HERO SECTION & BRANDING: Top hero contains image, back button, logo avatar, favorite, and share controls', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  assert.ok(html.includes('id="customer-storefront-wrapper"'), 'Customer storefront wrapper must exist');
  assert.ok(html.includes('pharmacy-hero-container'), 'Hero container must exist');
  assert.ok(html.includes('pharmacy-hero.jpg'), 'Hero image pharmacy-hero.jpg must be referenced');
  assert.ok(html.includes('id="store-back-btn"'), 'Back button #store-back-btn must exist on hero');
  assert.ok(html.includes('pharmacy-avatar-badge'), 'Avatar badge must exist');
  assert.ok(html.includes('bloomcare-logo.png'), 'Pharmacy logo bloomcare-logo.png must be displayed');
  assert.ok(html.includes('id="store-fav-btn"'), 'Hero favorite button #store-fav-btn must exist');
  assert.ok(html.includes('id="store-share-btn"'), 'Hero share button #store-share-btn must exist');
});

test('2. STORE DETAILS & LOCATION: Displays exact Mbarara Dispensary address and strictly no Kampala address', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  assert.ok(html.includes('BLOOMCARE PHARMACY'), 'Must display BLOOMCARE PHARMACY store title');
  assert.ok(html.includes('Professional Pharmacy Services'), 'Must display Professional Pharmacy Services tagline');

  const expectedAddress = 'Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda';
  assert.ok(html.includes(expectedAddress), `Must contain exact Mbarara address: ${expectedAddress}`);

  // Inspect the customer-storefront-wrapper slice specifically
  const storefrontSlice = html.slice(html.indexOf('id="customer-storefront-wrapper"'), html.indexOf('id="staff-medicines-table-card"'));
  assert.ok(!storefrontSlice.includes('Kampala Road'), 'Customer storefront must NOT contain Kampala Road');
  assert.ok(!storefrontSlice.includes('Central Kampala'), 'Customer storefront must NOT contain Central Kampala');
});

test('3. DYNAMIC OPERATING HOURS: getPharmacyOpenStatus computes correct status based on openingHours', async () => {
  const { getPharmacyOpenStatus } = await import('../BLOOMCARE-main/app.js');
  assert.strictEqual(typeof getPharmacyOpenStatus, 'function', 'getPharmacyOpenStatus must be exported');

  // Monday 11:00 AM (weekday open hours 8:00 AM - 8:00 PM)
  const mondayOpen = new Date('2026-09-07T11:00:00');
  const mondayStatus = getPharmacyOpenStatus(mondayOpen);
  assert.strictEqual(mondayStatus.isOpen, true, 'Monday 11:00 AM must be open');
  assert.strictEqual(mondayStatus.badgeText, '🟢 Open Now');
  assert.strictEqual(mondayStatus.statusClass, 'open');

  // Monday 22:00 (after 8:00 PM close)
  const mondayClosed = new Date('2026-09-07T22:00:00');
  const mondayClosedStatus = getPharmacyOpenStatus(mondayClosed);
  assert.strictEqual(mondayClosedStatus.isOpen, false, 'Monday 10:00 PM must be closed');
  assert.strictEqual(mondayClosedStatus.badgeText, '🔴 Closed');
  assert.strictEqual(mondayClosedStatus.statusClass, 'closed');

  // Sunday 12:00 PM (open 10:00 AM - 4:00 PM)
  const sundayOpen = new Date('2026-09-06T12:00:00');
  const sundayStatus = getPharmacyOpenStatus(sundayOpen);
  assert.strictEqual(sundayStatus.isOpen, true, 'Sunday noon must be open');

  // Sunday 18:00 (after 4:00 PM close)
  const sundayClosed = new Date('2026-09-06T18:00:00');
  const sundayClosedStatus = getPharmacyOpenStatus(sundayClosed);
  assert.strictEqual(sundayClosedStatus.isOpen, false, 'Sunday 6:00 PM must be closed');
});

test('4. THREE-COLUMN METRICS STRIP: Rating, Location, and Delivery Time columns exist', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  assert.ok(html.includes('pharmacy-metrics-strip'), 'Metrics strip must exist');
  assert.ok(html.includes('4.8'), 'Must include 4.8 rating metric');
  assert.ok(html.includes('120+ ratings'), 'Must include 120+ ratings meta text');
  assert.ok(html.includes('Mbarara City'), 'Must include Mbarara City location metric');
  assert.ok(html.includes('10–15 min') || html.includes('10-15 min'), 'Must include 10–15 min delivery time metric');
});

test('5. RECOMMENDED CAROUSEL: renderRecommendedProductCardHtml renders compact cards with price, discount, and plus button', async () => {
  const { renderRecommendedProductCardHtml } = await import('../BLOOMCARE-main/app.js');
  assert.strictEqual(typeof renderRecommendedProductCardHtml, 'function', 'renderRecommendedProductCardHtml must be exported');

  const testProd = {
    id: 'TEST-REC-01',
    name: 'Amoxicillin 500mg Capsules',
    genericName: 'Amoxicillin',
    packSize: 'Pack of 20 Capsules',
    price: 12000,
    originalPrice: 15000,
    stockQuantity: 45,
    requiresPrescription: true,
    imageUrl: 'products/packshots/TEST-REC-01.svg',
    status: 'active'
  };

  const html = renderRecommendedProductCardHtml(testProd);
  assert.ok(html.includes('recommended-prod-card'), 'Must have recommended-prod-card class');
  assert.ok(html.includes('20% OFF'), 'Must compute 20% OFF discount ribbon for 12,000 vs 15,000');
  assert.ok(html.includes('prod-card-fav-btn'), 'Must have favorite button');
  assert.ok(html.includes('circular-plus-btn'), 'Must have circular plus button');
  assert.ok(html.includes('add-cart-btn'), 'Must have add-cart-btn class for cart delegation');
  assert.ok(html.includes('UGX 12,000'), 'Must format selling price in UGX');
  assert.ok(html.includes('UGX 15,000'), 'Must display original strikethrough price');
});

test('6. MAIN PRODUCT LIST: renderProductCardHtml renders modern horizontal cards with all necessary test hooks', async () => {
  const { renderProductCardHtml } = await import('../BLOOMCARE-main/app.js');
  assert.strictEqual(typeof renderProductCardHtml, 'function', 'renderProductCardHtml must be exported');

  const testProd = {
    id: 'TEST-MAIN-01',
    name: 'Paracetamol 500mg Tablets',
    genericName: 'Paracetamol',
    category: 'Pain Relief',
    packSize: 'Pack of 20 Tablets',
    dosageForm: 'Pack of 20 Tablets',
    price: 5000,
    originalPrice: 6000,
    stockQuantity: 100,
    requiresPrescription: false,
    imageUrl: 'products/paracetamol-500mg.webp',
    status: 'active'
  };

  const html = renderProductCardHtml(testProd);
  assert.ok(html.includes('horizontal-card'), 'Must have horizontal-card class');
  assert.ok(html.includes('17% OFF'), 'Must compute 17% OFF discount ribbon for 5,000 vs 6,000');
  assert.ok(html.includes('product-thumb-container'), 'Must have product-thumb-container');
  assert.ok(html.includes('product-thumb-img'), 'Must have product-thumb-img');
  assert.ok(html.includes('loading="lazy"'), 'Must have lazy loading');
  assert.ok(html.includes('prod-card-fav-btn'), 'Must have heart favorite button');
  assert.ok(html.includes('product-title'), 'Must have product-title');
  assert.ok(html.includes('product-generic'), 'Must have product-generic metadata');
  assert.ok(html.includes('rx-pill otc-ok'), 'Must have OTC badge');
  assert.ok(html.includes('UGX 5,000'), 'Must show formatted UGX price');
  assert.ok(html.includes('UGX 6,000'), 'Must show formatted original price');
  assert.ok(html.includes('circular-plus-btn'), 'Must have circular plus button');
  assert.ok(html.includes('product-card-qty-stepper'), 'Must retain stepper for backward compatibility');
});

test('7. FLOATING PRESCRIPTION ORDER BUTTON: Exists and triggers prescription order flow', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  assert.ok(html.includes('id="floating-rx-order-btn"'), 'Floating prescription button #floating-rx-order-btn must exist');
  assert.ok(html.includes('data-route="prescriptions"'), 'Floating prescription button must link to prescriptions');
  assert.ok(html.includes('Prescription Order'), 'Must display "Prescription Order" text');
});

test('8. MOBILE BOTTOM NAVIGATION: Home, Medicines, Cart with live count badge, Orders, and Profile', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  assert.ok(html.includes('id="mobile-bottom-nav"'), 'Mobile bottom nav must exist');
  assert.ok(html.includes('data-route="customer/dashboard"'), 'Mobile nav must have Home item');
  assert.ok(html.includes('data-route="medicines"'), 'Mobile nav must have Medicines item');
  assert.ok(html.includes('id="mobile-nav-cart-btn"'), 'Mobile nav must have Cart button');
  assert.ok(html.includes('id="mobile-bottom-cart-badge"'), 'Mobile nav must have cart count badge');
  assert.ok(html.includes('data-route="customer/orders"'), 'Mobile nav must have Orders item');
  assert.ok(html.includes('data-route="profile"'), 'Mobile nav must have Profile item');
});

test('9. CART BADGE SYNCHRONIZATION: updateCartBadge updates both desktop and mobile bottom navigation badges', async () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  assert.ok(appJs.includes('mobileBadge.textContent = String(total);'), 'updateCartBadge must update mobile bottom cart badge');
  assert.ok(appJs.includes('mobileBadge.classList.toggle("hidden", total === 0);'), 'updateCartBadge must hide badge when cart is 0');
});

test('10. PRODUCT & PHARMACY FAVORITES PERSISTENCE: Helpers exported and handle localStorage gracefully', async () => {
  const {
    getFavoriteProductIds,
    isProductFavorited,
    toggleProductFavorite,
    isPharmacyFavorited,
    togglePharmacyFavorite
  } = await import('../BLOOMCARE-main/app.js');

  assert.strictEqual(typeof getFavoriteProductIds, 'function');
  assert.strictEqual(typeof isProductFavorited, 'function');
  assert.strictEqual(typeof toggleProductFavorite, 'function');
  assert.strictEqual(typeof isPharmacyFavorited, 'function');
  assert.strictEqual(typeof togglePharmacyFavorite, 'function');
});

test('11. STORE FILTER MODAL: Dialog exists and filter methods are implemented', async () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert.ok(html.includes('id="catalog-filter-dialog"'), 'Filter modal dialog must exist');
  assert.ok(html.includes('id="modal-filter-category"'), 'Category select must exist in modal');
  assert.ok(html.includes('name="modal-filter-rx"'), 'Rx radio buttons must exist in modal');
  assert.ok(html.includes('name="modal-filter-avail"'), 'Availability radio buttons must exist in modal');
  assert.ok(html.includes('id="modal-filter-sort"'), 'Sort select must exist in modal');
  assert.ok(html.includes('id="btn-apply-modal-filters"'), 'Apply button must exist in modal');
  assert.ok(html.includes('id="btn-reset-modal-filters"'), 'Reset button must exist in modal');

  const {
    openCatalogFilterDialog,
    closeCatalogFilterDialog,
    applyCatalogModalFilters,
    resetCatalogModalFilters
  } = await import('../BLOOMCARE-main/app.js');

  assert.strictEqual(typeof openCatalogFilterDialog, 'function');
  assert.strictEqual(typeof closeCatalogFilterDialog, 'function');
  assert.strictEqual(typeof applyCatalogModalFilters, 'function');
  assert.strictEqual(typeof resetCatalogModalFilters, 'function');
});

test('12. CSS RESPONSIVE RULES: Stylesheet defines comprehensive rules for all components', () => {
  const css = fs.readFileSync(stylesCssPath, 'utf8');

  assert.ok(css.includes('.pharmacy-hero-container'), 'Must style .pharmacy-hero-container');
  assert.ok(css.includes('.pharmacy-avatar-badge'), 'Must style .pharmacy-avatar-badge');
  assert.ok(css.includes('.pharmacy-metrics-strip'), 'Must style .pharmacy-metrics-strip');
  assert.ok(css.includes('.recommended-scroll-track'), 'Must style .recommended-scroll-track');
  assert.ok(css.includes('.recommended-prod-card'), 'Must style .recommended-prod-card');
  assert.ok(css.includes('.circular-plus-btn'), 'Must style .circular-plus-btn');
  assert.ok(css.includes('.discount-ribbon'), 'Must style .discount-ribbon');
  assert.ok(css.includes('.horizontal-card'), 'Must style .horizontal-card');
  assert.ok(css.includes('.floating-prescription-btn'), 'Must style .floating-prescription-btn');
  assert.ok(css.includes('.mobile-bottom-nav'), 'Must style .mobile-bottom-nav');
});

