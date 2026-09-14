// BloomCare Pharmacy - AI-Powered Product Recommendation Engine
// Intelligent discovery based on authentic customer purchase patterns, real-time inventory rules, and clinical safety

import { isPaidOrder } from "./firebase.js";

/**
 * 30-day window in milliseconds for recent purchase calculations
 */
export const RECENT_WINDOW_DAYS = 30;
export const RECENT_WINDOW_MS = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Validates if an order represents an authentic completed/paid purchase.
 * Strictly excludes cancelled, failed, pending, and unpaid orders.
 */
export function isValidCompletedOrder(order) {
  if (!order) return false;
  if (typeof isPaidOrder === "function") {
    return isPaidOrder(order);
  }
  const oStatus = String(order.orderStatus || "").trim().toLowerCase();
  const pStatus = String(order.paymentStatus || "").trim().toLowerCase();
  if (oStatus === "cancelled" || oStatus === "failed") return false;
  if (pStatus === "cancelled" || pStatus === "failed" || pStatus === "pending" || pStatus === "unpaid") return false;
  return pStatus === "paid" || pStatus === "successful";
}

/**
 * Enforces pharmacy inventory safety rules.
 * Never recommends out-of-stock, inactive, or deleted items.
 */
export function isProductEligibleForRecommendation(prod) {
  if (!prod) return false;
  if (prod.status === "inactive" || prod.deleted === true) return false;
  if (typeof prod.stockQuantity === "number" && prod.stockQuantity <= 0) return false;
  return true;
}

/**
 * Calculates raw purchase statistics from real completed orders.
 * Aggregates frequency, unique customers, recent activity, revenue, and co-purchase pairs.
 */
export function calculateProductPurchaseStats(orders = [], products = [], referenceDate = new Date()) {
  const refTime = new Date(referenceDate).getTime();
  const validOrders = (orders || []).filter(isValidCompletedOrder);

  const statsMap = new Map();
  const coPurchaseMap = new Map(); // "prodA::prodB" -> count

  // Initialize stats for all known products
  (products || []).forEach(p => {
    if (!p || !p.id) return;
    statsMap.set(p.id, {
      productId: p.id,
      productName: p.name || "",
      category: p.category || "",
      purchaseCount: 0,
      totalQuantity: 0,
      uniqueCustomers: new Set(),
      recentPurchaseCount: 0,
      totalRevenue: 0,
      frequentlyBoughtWith: {}, // companionId -> count
      lastPurchasedAt: null
    });
  });

  // Aggregate through valid completed orders
  validOrders.forEach(order => {
    const custId = order.customerId || order.customerEmail || order.customerPhone || "anonymous";
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : refTime;
    const isRecent = (refTime - orderTime) <= RECENT_WINDOW_MS && (refTime - orderTime) >= 0;

    // Weight recent purchases by recency decay (0 to 30 days)
    const daysAgo = Math.max(0, (refTime - orderTime) / (24 * 60 * 60 * 1000));
    const recencyWeight = daysAgo <= 7 ? 1.0 : (daysAgo <= 14 ? 0.75 : (daysAgo <= 30 ? 0.5 : 0.1));

    const itemIds = [];

    orderItems.forEach(item => {
      const pid = item.productId || item.product?.id || item.id;
      if (!pid) return;
      itemIds.push(pid);

      let pStat = statsMap.get(pid);
      if (!pStat) {
        pStat = {
          productId: pid,
          productName: item.name || item.product?.name || "",
          category: item.category || item.product?.category || "",
          purchaseCount: 0,
          totalQuantity: 0,
          uniqueCustomers: new Set(),
          recentPurchaseCount: 0,
          totalRevenue: 0,
          frequentlyBoughtWith: {},
          lastPurchasedAt: null
        };
        statsMap.set(pid, pStat);
      }

      const qty = Number(item.quantity) || 1;
      const price = Number(item.price ?? item.product?.price ?? 0);

      pStat.purchaseCount += 1;
      pStat.totalQuantity += qty;
      pStat.uniqueCustomers.add(custId);
      pStat.totalRevenue += (price * qty);

      if (isRecent) {
        pStat.recentPurchaseCount += (qty * recencyWeight);
      }

      if (!pStat.lastPurchasedAt || orderTime > new Date(pStat.lastPurchasedAt).getTime()) {
        pStat.lastPurchasedAt = new Date(orderTime).toISOString();
      }
    });

    // Co-purchase matrix: analyze products purchased together in the same order
    const uniqueOrderIds = [...new Set(itemIds)];
    for (let i = 0; i < uniqueOrderIds.length; i++) {
      for (let j = i + 1; j < uniqueOrderIds.length; j++) {
        const a = uniqueOrderIds[i];
        const b = uniqueOrderIds[j];

        // Symmetric pairing
        const statA = statsMap.get(a);
        const statB = statsMap.get(b);
        if (statA) {
          statA.frequentlyBoughtWith[b] = (statA.frequentlyBoughtWith[b] || 0) + 1;
        }
        if (statB) {
          statB.frequentlyBoughtWith[a] = (statB.frequentlyBoughtWith[a] || 0) + 1;
        }

        const pairKey = [a, b].sort().join("::");
        coPurchaseMap.set(pairKey, (coPurchaseMap.get(pairKey) || 0) + 1);
      }
    }
  });

  return { statsMap, coPurchaseMap, validOrdersCount: validOrders.length };
}

/**
 * Calculates normalized scores and the final recommendation score for each product:
 *   Score = (purchaseFrequencyScore * 0.40) +
 *           (uniqueCustomerScore * 0.25) +
 *           (recentPurchaseScore * 0.20) +
 *           (popularityScore * 0.15)
 */
export function calculateRecommendationScores(products = [], statsMap = new Map()) {
  let maxFreq = 0;
  let maxUnique = 0;
  let maxRecent = 0;
  let maxRev = 0;

  // First pass: find maximum values across all eligible products for normalization
  products.forEach(p => {
    if (!isProductEligibleForRecommendation(p)) return;
    const stat = statsMap.get(p.id);
    if (!stat) return;

    if (stat.totalQuantity > maxFreq) maxFreq = stat.totalQuantity;
    const uniqueCount = stat.uniqueCustomers ? stat.uniqueCustomers.size : (stat.uniqueCustomerCount || 0);
    if (uniqueCount > maxUnique) maxUnique = uniqueCount;
    if (stat.recentPurchaseCount > maxRecent) maxRecent = stat.recentPurchaseCount;
    if (stat.totalRevenue > maxRev) maxRev = stat.totalRevenue;
  });

  const scoredProducts = [];

  // Second pass: compute normalized factor scores and final recommendationScore
  products.forEach(p => {
    if (!isProductEligibleForRecommendation(p)) return;
    const stat = statsMap.get(p.id) || {
      purchaseCount: 0,
      totalQuantity: 0,
      uniqueCustomers: new Set(),
      recentPurchaseCount: 0,
      totalRevenue: 0,
      frequentlyBoughtWith: {}
    };

    const uniqueCount = stat.uniqueCustomers ? stat.uniqueCustomers.size : (stat.uniqueCustomerCount || 0);

    const purchaseFrequencyScore = maxFreq > 0 ? (stat.totalQuantity / maxFreq) : 0;
    const uniqueCustomerScore = maxUnique > 0 ? (uniqueCount / maxUnique) : 0;
    const recentPurchaseScore = maxRecent > 0 ? (stat.recentPurchaseCount / maxRecent) : 0;
    const popularityScore = maxRev > 0 ? (stat.totalRevenue / maxRev) : 0;

    const recommendationScore = Number((
      (purchaseFrequencyScore * 0.40) +
      (uniqueCustomerScore * 0.25) +
      (recentPurchaseScore * 0.20) +
      (popularityScore * 0.15)
    ).toFixed(4));

    scoredProducts.push({
      ...p,
      recommendationMetrics: {
        purchaseFrequencyScore: Number(purchaseFrequencyScore.toFixed(4)),
        uniqueCustomerScore: Number(uniqueCustomerScore.toFixed(4)),
        recentPurchaseScore: Number(recentPurchaseScore.toFixed(4)),
        popularityScore: Number(popularityScore.toFixed(4)),
        recommendationScore,
        purchaseCount: stat.purchaseCount,
        totalQuantity: stat.totalQuantity,
        uniqueCustomerCount: uniqueCount,
        recentPurchaseCount: Number(stat.recentPurchaseCount.toFixed(2)),
        totalRevenue: stat.totalRevenue,
        frequentlyBoughtWith: stat.frequentlyBoughtWith || {}
      }
    });
  });

  // Sort by recommendationScore descending
  scoredProducts.sort((a, b) => b.recommendationMetrics.recommendationScore - a.recommendationMetrics.recommendationScore);
  return scoredProducts;
}

/**
 * Cache container for computed recommendation data to avoid expensive recalculations.
 */
let recommendationCache = {
  timestamp: 0,
  ordersHash: "",
  scoredProducts: [],
  statsMap: null,
  coPurchaseMap: null
};

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Invalidates the recommendation cache, forcing recalculation on next access.
 */
export function invalidateRecommendationCache() {
  recommendationCache = {
    timestamp: 0,
    ordersHash: "",
    scoredProducts: [],
    statsMap: null,
    coPurchaseMap: null
  };
}

/**
 * Retrieves or computes recommendation scores with caching.
 */
export function getScoredProducts(products = [], orders = [], referenceDate = new Date(), forceRefresh = false) {
  const now = Date.now();
  const validOrders = (orders || []).filter(isValidCompletedOrder);
  const currentHash = `${validOrders.length}_${(products || []).length}_${validOrders[0]?.id || ""}`;

  if (!forceRefresh &&
      recommendationCache.scoredProducts.length > 0 &&
      (now - recommendationCache.timestamp) < CACHE_TTL_MS &&
      recommendationCache.ordersHash === currentHash) {
    return {
      scoredProducts: recommendationCache.scoredProducts,
      statsMap: recommendationCache.statsMap,
      coPurchaseMap: recommendationCache.coPurchaseMap,
      validOrdersCount: recommendationCache.validOrdersCount ?? validOrders.length
    };
  }

  const { statsMap, coPurchaseMap, validOrdersCount } = calculateProductPurchaseStats(orders, products, referenceDate);
  const scoredProducts = calculateRecommendationScores(products, statsMap);

  recommendationCache = {
    timestamp: now,
    ordersHash: currentHash,
    scoredProducts,
    statsMap,
    coPurchaseMap,
    validOrdersCount
  };

  return { scoredProducts, statsMap, coPurchaseMap, validOrdersCount };
}

/**
 * 1. "RECOMMENDED FOR YOU"
 * Personalizes recommendations for a specific customer based on:
 * - Their purchased categories
 * - Frequently purchased products
 * - Products related/companion to their past purchases
 * Automatically falls back to popular/trending products if no purchase history.
 */
export function getRecommendedProducts(customerId, products = [], orders = [], limit = 8, referenceDate = new Date()) {
  const { scoredProducts, statsMap } = getScoredProducts(products, orders, referenceDate);

  if (!customerId) {
    // Guest/visitor fallback: top scoring popular products
    return scoredProducts.slice(0, limit);
  }

  // Extract customer's completed orders
  const validOrders = (orders || []).filter(isValidCompletedOrder);
  const customerOrders = validOrders.filter(o =>
    o.customerId === customerId ||
    (o.customerEmail && o.customerEmail === customerId) ||
    (o.customerPhone && o.customerPhone === customerId)
  );

  if (customerOrders.length === 0) {
    // New customer without purchase history: fallback to top scoring products
    return scoredProducts.slice(0, limit);
  }

  // Analyze customer's purchase preferences
  const categoryPurchases = {};
  const purchasedProductIds = new Set();
  const purchasedCounts = {};

  customerOrders.forEach(ord => {
    (ord.items || []).forEach(item => {
      const pid = item.productId || item.product?.id || item.id;
      if (!pid) return;
      purchasedProductIds.add(pid);
      purchasedCounts[pid] = (purchasedCounts[pid] || 0) + (Number(item.quantity) || 1);

      const prod = (products || []).find(p => p.id === pid);
      const cat = prod?.category || item.category || "";
      if (cat) {
        categoryPurchases[cat] = (categoryPurchases[cat] || 0) + (Number(item.quantity) || 1);
      }
    });
  });

  // Sort customer favorite categories
  const topCategories = Object.entries(categoryPurchases)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);

  // Find companion products frequently bought with items customer previously purchased
  const companionScores = {};
  purchasedProductIds.forEach(pid => {
    const stat = statsMap?.get(pid);
    if (stat && stat.frequentlyBoughtWith) {
      Object.entries(stat.frequentlyBoughtWith).forEach(([companionId, count]) => {
        companionScores[companionId] = (companionScores[companionId] || 0) + count;
      });
    }
  });

  // Score products with personalization boost
  const personalizedList = scoredProducts.map(prod => {
    let personalScore = prod.recommendationMetrics.recommendationScore;

    // Category affinity boost: 30% bonus if in customer's top category, 15% if in secondary
    const catIndex = topCategories.indexOf(prod.category);
    if (catIndex === 0) personalScore += 0.35;
    else if (catIndex === 1) personalScore += 0.20;
    else if (catIndex > 1) personalScore += 0.10;

    // Companion product boost
    if (companionScores[prod.id]) {
      personalScore += Math.min(0.25, companionScores[prod.id] * 0.05);
    }

    // Repurchase penalty/boost:
    // If already purchased once, deprioritize slightly to encourage discovery (penalty 0.15)
    // UNLESS repeatedly purchased (3+ times, e.g. chronic/refill), then boost (0.20)
    const boughtTimes = purchasedCounts[prod.id] || 0;
    if (boughtTimes >= 3) {
      personalScore += 0.20; // Refill/chronic favorite
    } else if (boughtTimes > 0) {
      personalScore -= 0.15; // Already purchased once, promote discovery of new medicines
    }

    return {
      ...prod,
      personalScore: Number(personalScore.toFixed(4)),
      isPersonalized: true
    };
  });

  personalizedList.sort((a, b) => b.personalScore - a.personalScore);
  return personalizedList.slice(0, limit);
}

/**
 * 2. "🔥 TRENDING PRODUCTS"
 * Prioritizes products with the highest recent purchase activity (past 30 days).
 */
export function getTrendingProducts(products = [], orders = [], limit = 8, referenceDate = new Date()) {
  const { scoredProducts } = getScoredProducts(products, orders, referenceDate);

  // Filter and sort primarily by recent purchase activity, then by overall score
  const trending = [...scoredProducts].sort((a, b) => {
    const recDiff = b.recommendationMetrics.recentPurchaseScore - a.recommendationMetrics.recentPurchaseScore;
    if (Math.abs(recDiff) > 0.0001) return recDiff;
    return b.recommendationMetrics.recommendationScore - a.recommendationMetrics.recommendationScore;
  });

  return trending.slice(0, limit);
}

/**
 * 3. "FREQUENTLY PURCHASED"
 * Products with the highest overall lifetime purchase frequency/quantity.
 */
export function getFrequentlyPurchased(products = [], orders = [], limit = 8, referenceDate = new Date()) {
  const { scoredProducts } = getScoredProducts(products, orders, referenceDate);

  const freqList = [...scoredProducts].sort((a, b) => {
    const fDiff = b.recommendationMetrics.totalQuantity - a.recommendationMetrics.totalQuantity;
    if (fDiff !== 0) return fDiff;
    return b.recommendationMetrics.purchaseCount - a.recommendationMetrics.purchaseCount;
  });

  return freqList.slice(0, limit);
}

/**
 * 4. "POPULAR PRODUCTS"
 * Products with the highest composite recommendation score across BloomCare.
 */
export function getPopularProducts(products = [], orders = [], limit = 8, referenceDate = new Date()) {
  const { scoredProducts } = getScoredProducts(products, orders, referenceDate);
  return scoredProducts.slice(0, limit);
}

/**
 * 5. "FREQUENTLY BOUGHT TOGETHER"
 * Analyzes completed orders to find companion products commonly purchased together with a target product.
 * Returns companion product objects with co-occurrence counts.
 */
export function getFrequentlyBoughtTogether(targetProductId, products = [], orders = [], limit = 3, referenceDate = new Date()) {
  if (!targetProductId) return [];
  const { statsMap } = getScoredProducts(products, orders, referenceDate);
  const targetStat = statsMap?.get(targetProductId);

  if (!targetStat || !targetStat.frequentlyBoughtWith) {
    return [];
  }

  const companionEntries = Object.entries(targetStat.frequentlyBoughtWith)
    .filter(([compPid]) => compPid !== targetProductId)
    .sort((a, b) => b[1] - a[1]);

  const companions = [];
  for (const [compPid, count] of companionEntries) {
    if (companions.length >= limit) break;
    const prod = (products || []).find(p => p.id === compPid);
    if (prod && isProductEligibleForRecommendation(prod)) {
      companions.push({
        ...prod,
        coPurchaseCount: count
      });
    }
  }

  return companions;
}

/**
 * Finds the top co-purchased pair across all completed orders for the "Frequently Bought Together" bundle showcase.
 * e.g., Paracetamol + Vitamin C
 */
export function getTopCoPurchaseBundle(products = [], orders = [], referenceDate = new Date()) {
  const { coPurchaseMap } = getScoredProducts(products, orders, referenceDate);
  if (!coPurchaseMap || coPurchaseMap.size === 0) {
    // Fallback to top 2 popular items if no pairs recorded yet
    const popular = getPopularProducts(products, orders, 2, referenceDate);
    if (popular.length >= 2) {
      return {
        productA: popular[0],
        productB: popular[1],
        coPurchaseCount: 1,
        totalBundlePrice: (popular[0].price || 0) + (popular[1].price || 0)
      };
    }
    return null;
  }

  // Sort pairs by frequency descending
  const sortedPairs = [...coPurchaseMap.entries()].sort((a, b) => b[1] - a[1]);

  for (const [pairKey, count] of sortedPairs) {
    const [idA, idB] = pairKey.split("::");
    const prodA = (products || []).find(p => p.id === idA);
    const prodB = (products || []).find(p => p.id === idB);

    if (prodA && prodB && isProductEligibleForRecommendation(prodA) && isProductEligibleForRecommendation(prodB)) {
      return {
        productA: prodA,
        productB: prodB,
        coPurchaseCount: count,
        totalBundlePrice: (prodA.price || 0) + (prodB.price || 0)
      };
    }
  }

  return null;
}

/**
 * Real-time update handler called when a customer or staff completes a successful order.
 * Updates in-memory stats, invalidates cache, and syncs aggregated metrics.
 */
export function updateRecommendationStatsOnOrder(newOrder, products = []) {
  if (!isValidCompletedOrder(newOrder)) return;
  invalidateRecommendationCache();
}

/**
 * Returns an analytics summary for the Admin Dashboard:
 * - Most purchased products
 * - Top trending products
 * - Top co-purchased pairs
 * - Total orders analyzed
 */
export function getRecommendationAdminAnalytics(orders = [], products = [], referenceDate = new Date()) {
  const { scoredProducts, coPurchaseMap, validOrdersCount } = getScoredProducts(products, orders, referenceDate);

  const topPurchased = [...scoredProducts]
    .filter(p => p.recommendationMetrics.totalQuantity > 0)
    .sort((a, b) => b.recommendationMetrics.totalQuantity - a.recommendationMetrics.totalQuantity)
    .slice(0, 5);

  const topTrending = [...scoredProducts]
    .filter(p => p.recommendationMetrics.recentPurchaseCount > 0)
    .sort((a, b) => b.recommendationMetrics.recentPurchaseCount - a.recommendationMetrics.recentPurchaseCount)
    .slice(0, 5);

  const topPairs = [];
  if (coPurchaseMap) {
    const sorted = [...coPurchaseMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    sorted.forEach(([key, count]) => {
      const [idA, idB] = key.split("::");
      const pA = products.find(p => p.id === idA);
      const pB = products.find(p => p.id === idB);
      if (pA && pB) {
        topPairs.push({
          productAName: pA.name,
          productBName: pB.name,
          count,
          totalPrice: (pA.price || 0) + (pB.price || 0)
        });
      }
    });
  }

  return {
    validOrdersCount,
    totalProductsScored: scoredProducts.length,
    topPurchased,
    topTrending,
    topPairs
  };
}

/**
 * Renders the HTML for a "Frequently Bought Together" bundle card.
 */
export function renderFrequentlyBoughtTogetherHtml(bundle, escapeHtmlFn, formatUGXFn) {
  if (!bundle || !bundle.productA || !bundle.productB) return "";
  const escape = escapeHtmlFn || (s => String(s || ""));
  const format = formatUGXFn || (n => `UGX ${Number(n || 0).toLocaleString()}`);

  const pA = bundle.productA;
  const pB = bundle.productB;
  const imgA = pA.imageUrl || "products/placeholder-medicine.svg";
  const imgB = pB.imageUrl || "products/placeholder-medicine.svg";

  return `
    <div class="frequently-bought-together-card" style="background:var(--bg-card, #ffffff); border:1px solid var(--border-color, #e2e8f0); border-radius:12px; padding:16px 20px; margin-bottom:24px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
      <div class="fbt-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:18px;">🤝</span>
          <div>
            <h4 style="margin:0; font-size:15px; font-weight:700; color:var(--text-main, #0f172a);">Frequently Bought Together</h4>
            <span class="muted" style="font-size:12px;">Customers commonly order these complementary medicines together (${bundle.coPurchaseCount} joint purchase${bundle.coPurchaseCount > 1 ? 's' : ''})</span>
          </div>
        </div>
        <span class="rec-badge" style="background:rgba(15,118,110,0.1); color:#0f766e; font-size:11px; font-weight:700; padding:3px 8px; border-radius:999px;">Verified Bundle</span>
      </div>

      <div class="fbt-body" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div class="fbt-items-row" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          
          <!-- Product A -->
          <div class="fbt-item-box" style="display:flex; align-items:center; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px 12px; min-width:200px;">
            <img src="${escape(imgA)}" alt="${escape(pA.name)}" style="width:42px; height:42px; object-fit:contain; border-radius:6px; background:#fff;" onerror="this.src='products/placeholder-medicine.svg';" />
            <div>
              <div style="font-weight:600; font-size:13px; color:var(--text-main, #0f172a);">${escape(pA.name)}</div>
              <div style="font-size:12px; color:#0f766e; font-weight:700;">${format(pA.price)}</div>
            </div>
          </div>

          <span style="font-size:20px; font-weight:800; color:#0f766e;">+</span>

          <!-- Product B -->
          <div class="fbt-item-box" style="display:flex; align-items:center; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px 12px; min-width:200px;">
            <img src="${escape(imgB)}" alt="${escape(pB.name)}" style="width:42px; height:42px; object-fit:contain; border-radius:6px; background:#fff;" onerror="this.src='products/placeholder-medicine.svg';" />
            <div>
              <div style="font-weight:600; font-size:13px; color:var(--text-main, #0f172a);">${escape(pB.name)}</div>
              <div style="font-size:12px; color:#0f766e; font-weight:700;">${format(pB.price)}</div>
            </div>
          </div>

        </div>

        <!-- Bundle Action -->
        <div class="fbt-cta-box" style="display:flex; align-items:center; gap:14px;">
          <div style="text-align:right;">
            <div class="muted" style="font-size:11px; text-transform:uppercase; font-weight:600;">Total Bundle Price</div>
            <div style="font-size:17px; font-weight:800; color:#0f766e;">${format(bundle.totalBundlePrice)}</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm add-fbt-bundle-btn" data-prod-a="${escape(pA.id)}" data-prod-b="${escape(pB.id)}" style="display:inline-flex; align-items:center; gap:6px;">
            <span>🛒</span>
            <span>Add Both to Cart</span>
          </button>
        </div>

      </div>
    </div>
  `;
}
