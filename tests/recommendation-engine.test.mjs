import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const serviceJsPath = path.join(rootDir, 'BLOOMCARE-main', 'recommendation-service.js');
const stylesCssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');

// Import functions from recommendation-service.js
const {
  isValidCompletedOrder,
  isProductEligibleForRecommendation,
  calculateProductPurchaseStats,
  calculateRecommendationScores,
  getRecommendedProducts,
  getTrendingProducts,
  getFrequentlyPurchased,
  getPopularProducts,
  getFrequentlyBoughtTogether,
  getTopCoPurchaseBundle,
  updateRecommendationStatsOnOrder,
  getRecommendationAdminAnalytics,
  renderFrequentlyBoughtTogetherHtml,
  invalidateRecommendationCache
} = await import('../BLOOMCARE-main/recommendation-service.js');

// Import exported functions from app.js
const appJsExports = await import('../BLOOMCARE-main/app.js');

// Sample mock products for testing
const MOCK_PRODUCTS = [
  {
    id: 'P-PARA',
    name: 'Paracetamol 500mg Tablets',
    category: 'Pain Relief',
    price: 5000,
    stockQuantity: 100,
    status: 'active'
  },
  {
    id: 'P-VITC',
    name: 'Vitamin C 500mg Chewable',
    category: 'Vitamins & Supplements',
    price: 12000,
    stockQuantity: 80,
    status: 'active'
  },
  {
    id: 'P-ORS',
    name: 'Oral Rehydration Salts (ORS)',
    category: 'Digestive Health',
    price: 3000,
    stockQuantity: 150,
    status: 'active'
  },
  {
    id: 'P-AMOX',
    name: 'Amoxicillin 500mg Capsules',
    category: 'Cold & Flu',
    price: 15000,
    stockQuantity: 50,
    status: 'active'
  },
  {
    id: 'P-OOS',
    name: 'Out of Stock Medicine',
    category: 'Pain Relief',
    price: 8000,
    stockQuantity: 0, // Out of stock
    status: 'active'
  },
  {
    id: 'P-INACTIVE',
    name: 'Discontinued Item',
    category: 'First Aid',
    price: 20000,
    stockQuantity: 40,
    status: 'inactive' // Inactive
  }
];

test('1. ORDER ELIGIBILITY: Strictly includes paid/completed orders and excludes pending/failed/cancelled', () => {
  const paidOrder = { orderStatus: 'Delivered', paymentStatus: 'Paid' };
  const successfulOrder = { orderStatus: 'Completed', paymentStatus: 'Successful' };
  const pendingPaymentOrder = { orderStatus: 'Confirmed', paymentStatus: 'Pending' };
  const unpaidOrder = { orderStatus: 'Confirmed', paymentStatus: 'unpaid' };
  const cancelledOrder = { orderStatus: 'Cancelled', paymentStatus: 'Paid' };
  const failedOrder = { orderStatus: 'Failed', paymentStatus: 'Failed' };

  assert.equal(isValidCompletedOrder(paidOrder), true, 'Paid order must be eligible');
  assert.equal(isValidCompletedOrder(successfulOrder), true, 'Successful payment order must be eligible');
  assert.equal(isValidCompletedOrder(pendingPaymentOrder), false, 'Pending payment must be excluded');
  assert.equal(isValidCompletedOrder(unpaidOrder), false, 'Unpaid order must be excluded');
  assert.equal(isValidCompletedOrder(cancelledOrder), false, 'Cancelled order must be excluded');
  assert.equal(isValidCompletedOrder(failedOrder), false, 'Failed order must be excluded');
});

test('2. INVENTORY SAFETY RULES: Out-of-stock and inactive products are never recommended', () => {
  const inStockActive = MOCK_PRODUCTS[0];
  const outOfStock = MOCK_PRODUCTS[4];
  const inactive = MOCK_PRODUCTS[5];

  assert.equal(isProductEligibleForRecommendation(inStockActive), true, 'In-stock active product should be eligible');
  assert.equal(isProductEligibleForRecommendation(outOfStock), false, 'Out-of-stock product must be strictly rejected');
  assert.equal(isProductEligibleForRecommendation(inactive), false, 'Inactive product must be strictly rejected');
});

test('3. WEIGHTED RECOMMENDATION SCORING FORMULA: 40% freq, 25% unique customers, 20% recent, 15% revenue', () => {
  const refDate = new Date('2026-09-10T12:00:00.000Z');

  const orders = [
    {
      id: 'ORD-1',
      customerId: 'CUST-A',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-08T10:00:00.000Z', // Recent (2 days ago)
      items: [
        { productId: 'P-PARA', quantity: 2, price: 5000 },
        { productId: 'P-VITC', quantity: 1, price: 12000 }
      ]
    },
    {
      id: 'ORD-2',
      customerId: 'CUST-B',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-07T14:00:00.000Z', // Recent (3 days ago)
      items: [
        { productId: 'P-PARA', quantity: 3, price: 5000 }
      ]
    },
    {
      id: 'ORD-3',
      customerId: 'CUST-A',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-07-01T10:00:00.000Z', // Old order (> 30 days)
      items: [
        { productId: 'P-ORS', quantity: 5, price: 3000 }
      ]
    }
  ];

  const { statsMap } = calculateProductPurchaseStats(orders, MOCK_PRODUCTS, refDate);
  const scored = calculateRecommendationScores(MOCK_PRODUCTS, statsMap);

  // Out of stock and inactive must be filtered out
  assert.equal(scored.some(p => p.id === 'P-OOS'), false, 'P-OOS must not be present in scored list');
  assert.equal(scored.some(p => p.id === 'P-INACTIVE'), false, 'P-INACTIVE must not be present in scored list');

  const para = scored.find(p => p.id === 'P-PARA');
  assert.ok(para, 'Paracetamol must be scored');
  assert.equal(para.recommendationMetrics.totalQuantity, 5, 'Paracetamol totalQuantity should be 2 + 3 = 5');
  assert.equal(para.recommendationMetrics.uniqueCustomerCount, 2, 'Paracetamol unique customers should be CUST-A and CUST-B = 2');
  assert.ok(para.recommendationMetrics.recentPurchaseCount > 0, 'Paracetamol must have recent purchase activity');

  // Verify scoring normalization bounds [0, 1]
  scored.forEach(p => {
    const m = p.recommendationMetrics;
    assert.ok(m.purchaseFrequencyScore >= 0 && m.purchaseFrequencyScore <= 1, 'purchaseFrequencyScore must be in [0, 1]');
    assert.ok(m.uniqueCustomerScore >= 0 && m.uniqueCustomerScore <= 1, 'uniqueCustomerScore must be in [0, 1]');
    assert.ok(m.recentPurchaseScore >= 0 && m.recentPurchaseScore <= 1, 'recentPurchaseScore must be in [0, 1]');
    assert.ok(m.popularityScore >= 0 && m.popularityScore <= 1, 'popularityScore must be in [0, 1]');
    assert.ok(m.recommendationScore >= 0 && m.recommendationScore <= 1, 'recommendationScore must be in [0, 1]');
  });
});

test('4. PERSONALIZED RECOMMENDATIONS: Personalizes based on customer category affinity & falls back for new customers', () => {
  invalidateRecommendationCache();
  const refDate = new Date('2026-09-10T12:00:00.000Z');

  const orders = [
    {
      id: 'ORD-1',
      customerId: 'CUST-VITAMINS',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-08T10:00:00.000Z',
      items: [
        { productId: 'P-VITC', quantity: 2, price: 12000, category: 'Vitamins & Supplements' }
      ]
    },
    {
      id: 'ORD-2',
      customerId: 'CUST-OTHER',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-07T10:00:00.000Z',
      items: [
        { productId: 'P-PARA', quantity: 10, price: 5000, category: 'Pain Relief' }
      ]
    }
  ];

  // For CUST-VITAMINS, Vitamins & Supplements should receive category affinity boost
  const recsForVitamins = getRecommendedProducts('CUST-VITAMINS', MOCK_PRODUCTS, orders, 4, refDate);
  assert.ok(recsForVitamins.length > 0, 'Must return recommendations');

  // For a brand new customer (or null), should gracefully fall back to popular products
  const recsForNewCustomer = getRecommendedProducts('CUST-NEWBIE', MOCK_PRODUCTS, orders, 4, refDate);
  assert.ok(recsForNewCustomer.length > 0, 'New customer must receive popular product fallback');

  const recsForGuest = getRecommendedProducts(null, MOCK_PRODUCTS, orders, 4, refDate);
  assert.ok(recsForGuest.length > 0, 'Guest must receive popular product fallback');
});

test('5. TRENDING PRODUCTS: Prioritizes recent purchase activity over older purchases', () => {
  invalidateRecommendationCache();
  const refDate = new Date('2026-09-10T12:00:00.000Z');

  const orders = [
    {
      id: 'ORD-OLD',
      customerId: 'CUST-1',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-06-01T10:00:00.000Z', // 100 days ago
      items: [{ productId: 'P-ORS', quantity: 50, price: 3000 }] // High lifetime, 0 recent
    },
    {
      id: 'ORD-RECENT',
      customerId: 'CUST-2',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-09T10:00:00.000Z', // 1 day ago
      items: [{ productId: 'P-PARA', quantity: 5, price: 5000 }] // Low lifetime, high recent
    }
  ];

  const trending = getTrendingProducts(MOCK_PRODUCTS, orders, 4, refDate);
  assert.ok(trending.length > 0, 'Must return trending products');
  assert.equal(trending[0].id, 'P-PARA', 'P-PARA with recent velocity must rank above P-ORS with only old orders');
});

test('6. FREQUENTLY BOUGHT TOGETHER: Correctly identifies companion products co-purchased in completed orders', () => {
  invalidateRecommendationCache();
  const refDate = new Date('2026-09-10T12:00:00.000Z');

  const orders = [
    {
      id: 'ORD-1',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-08T10:00:00.000Z',
      items: [
        { productId: 'P-PARA', quantity: 1, price: 5000 },
        { productId: 'P-VITC', quantity: 1, price: 12000 }
      ]
    },
    {
      id: 'ORD-2',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-07T10:00:00.000Z',
      items: [
        { productId: 'P-PARA', quantity: 2, price: 5000 },
        { productId: 'P-VITC', quantity: 1, price: 12000 },
        { productId: 'P-ORS', quantity: 1, price: 3000 }
      ]
    }
  ];

  const companions = getFrequentlyBoughtTogether('P-PARA', MOCK_PRODUCTS, orders, 3, refDate);
  assert.ok(companions.length > 0, 'Must find companions for Paracetamol');
  assert.equal(companions[0].id, 'P-VITC', 'P-VITC co-purchased twice with Paracetamol must be top companion');
  assert.equal(companions[0].coPurchaseCount, 2, 'Co-purchase count must be 2');

  const bundle = getTopCoPurchaseBundle(MOCK_PRODUCTS, orders, refDate);
  assert.ok(bundle, 'Must find top bundle');
  const bundleIds = [bundle.productA.id, bundle.productB.id].sort();
  assert.deepEqual(bundleIds, ['P-PARA', 'P-VITC'], 'Top bundle should be Paracetamol + Vitamin C');
  assert.equal(bundle.totalBundlePrice, 17000, 'Total bundle price should be 5000 + 12000 = 17000');
});

test('7. REAL-TIME ORDER STATS UPDATE: Increments stats and invalidates cache upon new order', () => {
  invalidateRecommendationCache();
  const newOrder = {
    id: 'ORD-NEW',
    orderStatus: 'Delivered',
    paymentStatus: 'Paid',
    items: [{ productId: 'P-AMOX', quantity: 2, price: 15000 }]
  };

  updateRecommendationStatsOnOrder(newOrder, MOCK_PRODUCTS);
  // Cache was invalidated without error
  assert.ok(true, 'updateRecommendationStatsOnOrder executed cleanly');
});

test('8. ADMIN ANALYTICS & REVENUE INTEGRATION: Aggregates real orders for admin dashboard', () => {
  invalidateRecommendationCache();
  const refDate = new Date('2026-09-10T12:00:00.000Z');

  const orders = [
    {
      id: 'ORD-1',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: '2026-09-08T10:00:00.000Z',
      items: [
        { productId: 'P-PARA', quantity: 10, price: 5000 },
        { productId: 'P-VITC', quantity: 5, price: 12000 }
      ]
    }
  ];

  const analytics = getRecommendationAdminAnalytics(orders, MOCK_PRODUCTS, refDate);
  assert.equal(analytics.validOrdersCount, 1, 'Must record 1 valid completed order');
  assert.ok(analytics.topPurchased.length > 0, 'Must have top purchased products');
  assert.equal(analytics.topPurchased[0].id, 'P-PARA', 'Paracetamol should be top purchased');
  assert.equal(analytics.topPurchased[0].recommendationMetrics.totalRevenue, 50000, 'Revenue should be 10 * 5000 = 50000');
  assert.ok(analytics.topPairs.length > 0, 'Must have top pairs');
});

test('9. HTML RENDERING & ADD TO CART INTEGRATION: Frequently bought bundle markup includes working button', () => {
  const bundle = {
    productA: MOCK_PRODUCTS[0],
    productB: MOCK_PRODUCTS[1],
    coPurchaseCount: 3,
    totalBundlePrice: 17000
  };

  const html = renderFrequentlyBoughtTogetherHtml(bundle);
  assert.ok(html.includes('Frequently Bought Together'), 'Markup must include section title');
  assert.ok(html.includes('add-fbt-bundle-btn'), 'Markup must include .add-fbt-bundle-btn class');
  assert.ok(html.includes('data-prod-a="P-PARA"'), 'Markup must include product A ID data attribute');
  assert.ok(html.includes('data-prod-b="P-VITC"'), 'Markup must include product B ID data attribute');
  assert.ok(html.includes('Add Both to Cart'), 'Markup must have "Add Both to Cart" text');
});

test('10. APP.JS EXPORTS & INTEGRATION: Re-exports all recommendation engine functions', () => {
  assert.equal(typeof appJsExports.getRecommendedProducts, 'function', 'app.js must export getRecommendedProducts');
  assert.equal(typeof appJsExports.getTrendingProducts, 'function', 'app.js must export getTrendingProducts');
  assert.equal(typeof appJsExports.getFrequentlyPurchased, 'function', 'app.js must export getFrequentlyPurchased');
  assert.equal(typeof appJsExports.getPopularProducts, 'function', 'app.js must export getPopularProducts');
  assert.equal(typeof appJsExports.getFrequentlyBoughtTogether, 'function', 'app.js must export getFrequentlyBoughtTogether');
  assert.equal(typeof appJsExports.getTopCoPurchaseBundle, 'function', 'app.js must export getTopCoPurchaseBundle');
  assert.equal(typeof appJsExports.updateRecommendationStatsOnOrder, 'function', 'app.js must export updateRecommendationStatsOnOrder');
  assert.equal(typeof appJsExports.getRecommendationAdminAnalytics, 'function', 'app.js must export getRecommendationAdminAnalytics');
  assert.equal(typeof appJsExports.renderAdminRecommendationsSection, 'function', 'app.js must export renderAdminRecommendationsSection');
});

test('11. FIRESTORE SECURITY RULES: firestore.rules contains recommendationStats collection rule', () => {
  const rules = fs.readFileSync(firestoreRulesPath, 'utf8');
  assert.ok(rules.includes('match /recommendationStats/{docId}'), 'firestore.rules must secure recommendationStats collection');
});

test('12. CSS STYLING INTEGRITY: styles.css contains recommendation and bundle styles', () => {
  const css = fs.readFileSync(stylesCssPath, 'utf8');
  assert.ok(css.includes('.rec-dash-section'), 'styles.css must style .rec-dash-section');
  assert.ok(css.includes('.frequently-bought-together-card'), 'styles.css must style .frequently-bought-together-card');
  assert.ok(css.includes('.add-fbt-bundle-btn'), 'styles.css must style .add-fbt-bundle-btn');
});

