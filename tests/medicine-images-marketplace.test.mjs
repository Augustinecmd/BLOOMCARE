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
const productsDir = path.join(bloomcareDir, 'products');

test('MARKETPLACE ASSETS: Product images directory and fallback SVG exist', () => {
  assert.ok(fs.existsSync(productsDir), 'products directory must exist in BLOOMCARE-main');

  const placeholderSvgPath = path.join(productsDir, 'placeholder-medicine.svg');
  assert.ok(fs.existsSync(placeholderSvgPath), 'placeholder-medicine.svg must exist');

  const svgContent = fs.readFileSync(placeholderSvgPath, 'utf8');
  assert.ok(svgContent.includes('Medicine Image Unavailable'), 'Placeholder SVG must state "Medicine Image Unavailable"');
  assert.ok(svgContent.includes('#NDA/UG/PHARM/2026/894'), 'Placeholder SVG must include NDA license number');
});

test('MARKETPLACE ASSETS: High-resolution WebP and JPG packshots exist for core medicines', () => {
  const coreProducts = [
    'paracetamol-500mg',
    'ibuprofen-400mg',
    'amoxicillin-500mg',
    'cough-syrup',
    'salbutamol-inhaler',
    'blood-pressure-monitor',
    'digital-thermometer',
    'omeprazole-20mg',
    'cetirizine-10mg',
    'vitamin-c-500mg',
    'antiseptic-solution',
    'pediatric-paracetamol',
  ];

  for (const name of coreProducts) {
    const webpPath = path.join(productsDir, `${name}.webp`);
    const jpgPath = path.join(productsDir, `${name}.jpg`);
    assert.ok(fs.existsSync(webpPath), `WebP packshot must exist for ${name}`);
    assert.ok(fs.existsSync(jpgPath), `JPG packshot must exist for ${name}`);
    const statWebp = fs.statSync(webpPath);
    assert.ok(statWebp.size > 20000, `WebP for ${name} must be substantial (>20KB), got ${statWebp.size}`);
  }
});

test('CATALOG DATA: INITIAL_MEDICINES in app.js defines explicit imageUrl for every product', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('const INITIAL_MEDICINES = ['), 'app.js must contain INITIAL_MEDICINES');

  const initMedSlice = appJs.slice(appJs.indexOf('const INITIAL_MEDICINES = ['), appJs.indexOf('];', appJs.indexOf('const INITIAL_MEDICINES = [')) + 2);
  
  // Verify key packshot mappings
  assert.ok(initMedSlice.includes('products/paracetamol-500mg.webp'), 'Paracetamol must reference packshot');
  assert.ok(initMedSlice.includes('products/amoxicillin-500mg.webp'), 'Amoxicillin must reference packshot');
  assert.ok(initMedSlice.includes('products/blood-pressure-monitor.webp'), 'BP Monitor must reference packshot');
  assert.ok(initMedSlice.includes('products/placeholder-medicine.svg'), 'Unverified products must default to placeholder SVG');
});

test('IMAGE FALLBACK & GETTER: getProductImage function handles images and fallback', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('export const BLOOMCARE_PLACEHOLDER_IMAGE = "products/placeholder-medicine.svg";'), 'Must export BLOOMCARE_PLACEHOLDER_IMAGE');
  assert.ok(appJs.includes('export function getProductImage(prod) {'), 'Must export getProductImage function');
  assert.ok(appJs.includes('if (!prod) return BLOOMCARE_PLACEHOLDER_IMAGE;'), 'getProductImage must fall back safely when prod is null');
  assert.ok(appJs.includes('return prod.imageUrl.trim();'), 'getProductImage returns imageUrl');
  assert.ok(appJs.includes('return BLOOMCARE_PLACEHOLDER_IMAGE;'), 'getProductImage returns placeholder when empty');
});

test('PRODUCT CARD: renderProductCardHtml includes generous image container, lazy loading, and error fallback', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('function renderProductCardHtml(prod) {'), 'renderProductCardHtml must exist');

  const cardHtmlSlice = appJs.slice(appJs.indexOf('function renderProductCardHtml(prod) {'), appJs.indexOf('function openProductFormModal', appJs.indexOf('function renderProductCardHtml(prod) {')));

  assert.ok(cardHtmlSlice.includes('product-thumb-container'), 'Must have product-thumb-container');
  assert.ok(cardHtmlSlice.includes('product-thumb-img'), 'Must have product-thumb-img');
  assert.ok(cardHtmlSlice.includes('loading="lazy"'), 'Must have loading="lazy" for performance');
  assert.ok(cardHtmlSlice.includes('onerror="this.onerror=null;this.src=\'products/placeholder-medicine.svg\';"'), 'Must have onerror fallback');
  assert.ok(cardHtmlSlice.includes('product-card-qty-stepper'), 'Must have product-card-qty-stepper on card');
  assert.ok(cardHtmlSlice.includes('btn-qty-minus'), 'Must have btn-qty-minus');
  assert.ok(cardHtmlSlice.includes('prod-card-qty-input'), 'Must have prod-card-qty-input');
  assert.ok(cardHtmlSlice.includes('btn-qty-plus'), 'Must have btn-qty-plus');
  assert.ok(cardHtmlSlice.includes('add-cart-btn'), 'Must have add-cart-btn');
});

test('CARD STEPPER & CART: Event delegation handles card quantity stepper and custom add-to-cart quantity', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('.product-card-qty-stepper .btn-qty-minus'), 'Must handle card minus stepper');
  assert.ok(appJs.includes('.product-card-qty-stepper .btn-qty-plus'), 'Must handle card plus stepper');
  assert.ok(appJs.includes('addToCart(prodId, qty)'), 'Must add selected quantity to cart');
});

test('DETAILS MODAL: openProductDetailsModal renders large hero packshot and interactive quantity stepper', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('function openProductDetailsModal(productId) {'), 'openProductDetailsModal must exist');

  const modalFnSlice = appJs.slice(appJs.indexOf('function openProductDetailsModal(productId) {'), appJs.indexOf('// MODULE 3: CATEGORIES MODULE', appJs.indexOf('function openProductDetailsModal(productId) {')));

  assert.ok(modalFnSlice.includes('modal-product-hero'), 'Must contain modal-product-hero');
  assert.ok(modalFnSlice.includes('modal-product-img-wrap'), 'Must contain modal-product-img-wrap');
  assert.ok(modalFnSlice.includes('modal-product-large-img'), 'Must contain modal-product-large-img');
  assert.ok(modalFnSlice.includes('onerror="this.onerror=null;this.src=\'products/placeholder-medicine.svg\';"'), 'Modal image must have fallback');
});

test('INDEX.HTML: Product details dialog contains quantity stepper elements', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert.ok(html.includes('id="product-details-dialog"'), 'Must have product-details-dialog');
  assert.ok(html.includes('id="modal-qty-minus"'), 'Must have modal-qty-minus');
  assert.ok(html.includes('id="modal-product-qty"'), 'Must have modal-product-qty input');
  assert.ok(html.includes('id="modal-qty-plus"'), 'Must have modal-qty-plus');
  assert.ok(html.includes('id="modal-add-cart-btn"'), 'Must have modal-add-cart-btn');
});

test('ADMIN IMAGE MANAGEMENT: Product form dialog includes image preview, upload button, and remove button', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert.ok(html.includes('id="product-form-dialog"'), 'Must have product-form-dialog');
  assert.ok(html.includes('id="prod-img-preview"'), 'Must have prod-img-preview');
  assert.ok(html.includes('id="prod-image-file"'), 'Must have prod-image-file file input');
  assert.ok(html.includes('id="prod-image-url"'), 'Must have prod-image-url hidden input');
  assert.ok(html.includes('id="btn-upload-prod-img"'), 'Must have btn-upload-prod-img');
  assert.ok(html.includes('id="btn-remove-prod-img"'), 'Must have btn-remove-prod-img');
});

test('ADMIN CONTROLS IN APP.JS: Image file validation and canvas compression wired up', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('$("#btn-upload-prod-img")?.addEventListener'), 'Must wire upload button');
  assert.ok(appJs.includes('$("#btn-remove-prod-img")?.addEventListener'), 'Must wire remove button');
  assert.ok(appJs.includes('$("#prod-image-file")?.addEventListener("change"'), 'Must listen to file input change');
  assert.ok(appJs.includes('file.size > 5 * 1024 * 1024'), 'Must validate 5MB max file size');
  assert.ok(appJs.includes('imageUrl: $("#prod-image-url")?.value.trim() || ""'), 'Must save imageUrl in productData');
});

test('CSS STYLING: Professional packshot layout, object-fit contain, and responsive rules', () => {
  const css = fs.readFileSync(stylesCssPath, 'utf8');
  assert.ok(css.includes('.product-thumb-container'), 'Must style .product-thumb-container');
  assert.ok(css.includes('object-fit: contain'), 'Must use object-fit: contain to preserve packshot integrity');
  assert.ok(css.includes('.product-card-qty-stepper'), 'Must style .product-card-qty-stepper');
  assert.ok(css.includes('.modal-product-img-wrap'), 'Must style .modal-product-img-wrap');
  assert.ok(css.includes('.modal-product-large-img'), 'Must style .modal-product-large-img');
  assert.ok(css.includes('.admin-img-upload-section'), 'Must style .admin-img-upload-section');
  assert.ok(css.includes('@media (max-width: 640px)'), 'Must have responsive rules for mobile');
});
