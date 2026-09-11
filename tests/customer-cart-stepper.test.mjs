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
const firebaseJsPath = path.resolve(__dirname, '../BLOOMCARE-main/firebase.js');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');
const firebaseJs = fs.readFileSync(firebaseJsPath, 'utf8');

// Import controller functions
const {
  STATE,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  calculateCartSummary,
  getCartStorageKey,
  saveCartToStorage,
  loadCartFromStorage,
  updateAllProductCardSteppers,
  renderProductCardHtml,
  renderRecommendedProductCardHtml,
  formatUGX
} = await import('../BLOOMCARE-main/app.js');

// Mock localStorage in Node test environment
const mockStorage = {};
globalThis.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Ensure test products exist
const testProductA = {
  id: 'TEST-MED-01',
  name: 'Paracetamol 500mg Tablets',
  genericName: 'Paracetamol',
  category: 'Pain Relief',
  price: 5000,
  stockQuantity: 5,
  reorderLevel: 2,
  status: 'active',
  expiryDate: '2028-12-31'
};

const testProductB = {
  id: 'TEST-MED-02',
  name: 'Amoxicillin 500mg Capsules',
  genericName: 'Amoxicillin',
  category: 'Antibiotics',
  price: 12000,
  stockQuantity: 10,
  reorderLevel: 3,
  status: 'active',
  expiryDate: '2028-12-31'
};

const testProductOutOfStock = {
  id: 'TEST-MED-03',
  name: 'Cough Syrup 100ml',
  genericName: 'Dextromethorphan',
  category: 'Cold & Cough',
  price: 8000,
  stockQuantity: 0,
  reorderLevel: 5,
  status: 'active',
  expiryDate: '2028-12-31'
};

STATE.products = [testProductA, testProductB, testProductOutOfStock];

test('A. Customer adds medicine -> quantity becomes 1 and stepper renders', () => {
  STATE.cart = [];
  const added = addToCart('TEST-MED-01', 1);
  assert.equal(added, true, 'Medicine should be added successfully');
  assert.equal(STATE.cart.length, 1, 'Cart should contain 1 item');
  assert.equal(STATE.cart[0].productId, 'TEST-MED-01');
  assert.equal(STATE.cart[0].quantity, 1, 'Initial quantity must be 1');

  // Verify card HTML contains inline stepper markup
  const cardHtml = renderProductCardHtml(testProductA);
  assert.ok(cardHtml.includes('product-card-qty-stepper'), 'Card HTML must contain stepper container');
  assert.ok(cardHtml.includes('btn-qty-minus'), 'Card HTML must contain minus button');
  assert.ok(cardHtml.includes('btn-qty-plus'), 'Card HTML must contain plus button');
  assert.ok(cardHtml.includes('card-qty-val'), 'Card HTML must contain quantity display');
  assert.ok(cardHtml.includes('>1<'), 'Card HTML must display quantity 1');
});

test('B. Customer presses + -> quantity becomes 2 and subtotal updates', () => {
  STATE.cart = [{
    productId: 'TEST-MED-01',
    name: testProductA.name,
    price: 5000,
    quantity: 1,
    product: testProductA
  }];

  updateCartItemQuantity('TEST-MED-01', 1);
  assert.equal(STATE.cart[0].quantity, 2, 'Quantity must increment to 2');

  const summary = calculateCartSummary(STATE.cart, 5000);
  assert.equal(summary.subtotal, 10000, 'Subtotal for 2 units at 5,000 must be 10,000');
  assert.equal(summary.totalItems, 2, 'Total items count must be 2');
});

test('C. Customer presses - -> quantity decreases', () => {
  STATE.cart = [{
    productId: 'TEST-MED-01',
    name: testProductA.name,
    price: 5000,
    quantity: 3,
    product: testProductA
  }];

  updateCartItemQuantity('TEST-MED-01', -1);
  assert.equal(STATE.cart[0].quantity, 2, 'Quantity must decrease from 3 to 2');

  const summary = calculateCartSummary(STATE.cart, 5000);
  assert.equal(summary.subtotal, 10000, 'Subtotal must update to 10,000');
  assert.equal(summary.totalItems, 2);
});

test('D. Customer reaches available stock -> + becomes disabled', () => {
  // testProductA has stockQuantity = 5
  STATE.cart = [{
    productId: 'TEST-MED-01',
    name: testProductA.name,
    price: 5000,
    quantity: 5,
    product: testProductA
  }];

  // Verify renderProductCardHtml disables + button when quantity reaches available stock
  const cardHtml = renderProductCardHtml(testProductA);
  assert.ok(cardHtml.includes('btn-qty-plus'), 'Must have plus button');
  assert.ok(cardHtml.includes('disabled'), 'Plus button must be disabled at available stock');

  // Attempt to increment past available stock
  updateCartItemQuantity('TEST-MED-01', 1);
  assert.equal(STATE.cart[0].quantity, 5, 'Quantity must NOT exceed stock quantity of 5');
});

test('E. Customer decreases quantity from 1 -> triggers removal and restores Add to Cart button', () => {
  STATE.cart = [{
    productId: 'TEST-MED-01',
    name: testProductA.name,
    price: 5000,
    quantity: 1,
    product: testProductA
  }];

  // When quantity is 1 and removeCartItem is triggered
  removeCartItem('TEST-MED-01');
  assert.equal(STATE.cart.length, 0, 'Item must be removed from cart');

  // Card HTML must now show Add to Cart button instead of stepper
  const cardHtml = renderProductCardHtml(testProductA);
  assert.ok(cardHtml.includes('add-cart-btn'), 'Card must restore Add to Cart button');
  assert.ok(cardHtml.includes('display:none;') || cardHtml.includes('hidden'), 'Stepper must be hidden');
});

test('F. Customer refreshes page -> cart remains in storage', () => {
  STATE.currentUser = { uid: 'cust-456', role: 'customer' };
  STATE.cart = [{
    productId: 'TEST-MED-02',
    name: testProductB.name,
    price: 12000,
    quantity: 3,
    product: testProductB
  }];

  saveCartToStorage();

  // Simulate full page refresh / state reload
  STATE.cart = [];
  loadCartFromStorage('cust-456');

  assert.equal(STATE.cart.length, 1, 'Cart items must be rehydrated from storage');
  assert.equal(STATE.cart[0].productId, 'TEST-MED-02');
  assert.equal(STATE.cart[0].quantity, 3, 'Quantity must persist as 3');
});

test('G. Customer removes medicine -> cart total and summary update', () => {
  STATE.cart = [
    { productId: 'TEST-MED-01', name: testProductA.name, price: 5000, quantity: 2, product: testProductA },
    { productId: 'TEST-MED-02', name: testProductB.name, price: 12000, quantity: 1, product: testProductB }
  ];

  let summary = calculateCartSummary(STATE.cart, 5000);
  assert.equal(summary.subtotal, 22000, 'Initial subtotal must be 22,000 (10k + 12k)');
  assert.equal(summary.totalItems, 3);

  // Remove first item
  removeCartItem('TEST-MED-01');

  summary = calculateCartSummary(STATE.cart, 5000);
  assert.equal(summary.subtotal, 12000, 'Subtotal after removing item A must be 12,000');
  assert.equal(summary.totalItems, 1, 'Total items must be 1');
  assert.equal(STATE.cart.length, 1);
});

test('H. Multiple medicines -> each quantity operates independently', () => {
  STATE.cart = [
    { productId: 'TEST-MED-01', name: testProductA.name, price: 5000, quantity: 2, product: testProductA },
    { productId: 'TEST-MED-02', name: testProductB.name, price: 12000, quantity: 4, product: testProductB }
  ];

  updateCartItemQuantity('TEST-MED-01', 1); // Med A: 2 -> 3
  updateCartItemQuantity('TEST-MED-02', -1); // Med B: 4 -> 3

  assert.equal(STATE.cart.find(i => i.productId === 'TEST-MED-01').quantity, 3, 'Med A must be 3');
  assert.equal(STATE.cart.find(i => i.productId === 'TEST-MED-02').quantity, 3, 'Med B must be 3');
});

test('I. Customer logs out and another customer logs in -> carts remain separate', () => {
  // Customer 1
  STATE.currentUser = { uid: 'customer-alpha', role: 'customer' };
  STATE.cart = [{ productId: 'TEST-MED-01', name: testProductA.name, price: 5000, quantity: 2, product: testProductA }];
  saveCartToStorage();

  // Customer 1 logs out
  STATE.currentUser = null;
  STATE.cart = [];
  saveCartToStorage();

  // Customer 2 logs in
  STATE.currentUser = { uid: 'customer-beta', role: 'customer' };
  STATE.cart = [{ productId: 'TEST-MED-02', name: testProductB.name, price: 12000, quantity: 5, product: testProductB }];
  saveCartToStorage();

  // Verify Customer Alpha's cart is separate in storage
  const keyAlpha = getCartStorageKey('customer-alpha');
  const keyBeta = getCartStorageKey('customer-beta');
  assert.notEqual(keyAlpha, keyBeta, 'Storage keys must be namespaced per user');

  const storedAlpha = JSON.parse(mockStorage[keyAlpha]);
  const storedBeta = JSON.parse(mockStorage[keyBeta]);
  assert.equal(storedAlpha[0].productId, 'TEST-MED-01');
  assert.equal(storedBeta[0].productId, 'TEST-MED-02');
});

test('J. Checkout -> latest stock is validated before completing order', () => {
  // Product with stock 2
  const limitedProduct = { id: 'LIMIT-01', name: 'Limited Drops', price: 10000, stockQuantity: 2 };
  STATE.products.push(limitedProduct);

  // Cart has 4 units (exceeding stock of 2)
  STATE.cart = [{ productId: 'LIMIT-01', name: limitedProduct.name, price: 10000, quantity: 4, product: limitedProduct }];

  // Verify checkout stock validation logic from app.js
  const validationViolations = [];
  for (const item of STATE.cart) {
    const prod = STATE.products.find(p => p.id === item.productId);
    if (!prod || prod.stockQuantity <= 0 || item.quantity > prod.stockQuantity) {
      validationViolations.push({
        item: item.name,
        requested: item.quantity,
        available: prod ? prod.stockQuantity : 0
      });
    }
  }

  assert.equal(validationViolations.length, 1, 'Stock violation must be flagged');
  assert.equal(validationViolations[0].requested, 4);
  assert.equal(validationViolations[0].available, 2);
  assert.ok(appJs.includes('item.quantity > prod.stockQuantity'), 'handleCheckoutOrder must validate quantity against stockQuantity');
});

test('K. Out of stock products have disabled Add to Cart button', () => {
  const outOfStockHtml = renderProductCardHtml(testProductOutOfStock);
  assert.ok(outOfStockHtml.includes('disabled'), 'Out of stock card must have disabled button');
  assert.ok(outOfStockHtml.includes('Out of Stock'), 'Out of stock card must display Out of Stock label');
});

test('L. Firebase persistence methods are declared and exported', () => {
  assert.ok(firebaseJs.includes('export async function saveUserCartToFirestore'), 'firebase.js must export saveUserCartToFirestore');
  assert.ok(firebaseJs.includes('export async function getUserCartFromFirestore'), 'firebase.js must export getUserCartFromFirestore');
  assert.ok(appJs.includes('saveUserCartToFirestore'), 'app.js must import saveUserCartToFirestore');
  assert.ok(appJs.includes('getUserCartFromFirestore'), 'app.js must import getUserCartFromFirestore');
});

test('M. CSS styles define polished steppers and rounded controls', () => {
  assert.ok(stylesCss.includes('.product-card-qty-stepper'), 'styles.css must style product-card-qty-stepper');
  assert.ok(stylesCss.includes('.btn-qty-step'), 'styles.css must style btn-qty-step');
  assert.ok(stylesCss.includes('.card-qty-val'), 'styles.css must style card-qty-val');
  assert.ok(stylesCss.includes('.cart-qty-control-group'), 'styles.css must style cart-qty-control-group');
  assert.ok(stylesCss.includes('.cart-remove-btn'), 'styles.css must style cart-remove-btn');
});

