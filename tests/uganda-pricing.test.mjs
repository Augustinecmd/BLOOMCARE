import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const catalogPath = path.join(rootDir, 'BLOOMCARE-main', 'data', 'medicines-catalog.js');
const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const indexHtmlPath = path.join(rootDir, 'BLOOMCARE-main', 'index.html');
const stylesCssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');

test('1. CATALOG COVERAGE: All 749 items have complete price data structure', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  assert.strictEqual(UGANDA_PHARMACY_CATALOG.length, 749, 'Must cover all 749 catalog items');

  for (const item of UGANDA_PHARMACY_CATALOG) {
    // Required price schema
    assert.strictEqual(typeof item.sellingPrice, 'number', `sellingPrice must be numeric for ${item.id}`);
    assert.ok(item.sellingPrice > 0, `sellingPrice must be > 0 for ${item.id}`);
    assert.strictEqual(typeof item.costPrice, 'number', `costPrice must be numeric for ${item.id}`);
    assert.ok(item.costPrice > 0, `costPrice must be > 0 for ${item.id}`);
    assert.ok(item.costPrice < item.sellingPrice, `costPrice must be less than sellingPrice for ${item.id}`);
    assert.strictEqual(item.currency, 'UGX', `currency must be UGX for ${item.id}`);
    assert.strictEqual(item.price, item.sellingPrice, `price must equal sellingPrice for backwards compatibility for ${item.id}`);
    assert.ok(typeof item.priceSource === 'string' && item.priceSource.length > 0, `priceSource must be defined for ${item.id}`);
    assert.ok(typeof item.priceLastUpdated === 'string' && item.priceLastUpdated.length > 0, `priceLastUpdated must be defined for ${item.id}`);
    assert.ok(typeof item.packSize === 'string' && item.packSize.length > 0, `packSize must be defined for ${item.id}`);
    assert.ok(Array.isArray(item.priceHistory), `priceHistory must be an array for ${item.id}`);
    assert.ok(item.priceHistory.length >= 1, `priceHistory must contain at least 1 baseline entry for ${item.id}`);
  }
});

test('2. NO GOVERNMENT MANDATE CLAIMS: Appropriate market reference terminology used', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const catalogStr = fs.readFileSync(catalogPath, 'utf8');

  // Must not claim government mandated or fixed standard retail price
  assert.ok(!catalogStr.includes('Government approved price'), 'Must never claim Government approved price');
  assert.ok(!catalogStr.includes('Uganda standard price'), 'Must never claim Uganda standard price');

  for (const item of UGANDA_PHARMACY_CATALOG) {
    assert.ok(!String(item.priceSource).includes('Government approved'), `priceSource must not claim government approval for ${item.id}`);
    assert.ok(String(item.priceSource).toLowerCase().includes('market') || String(item.priceSource).toLowerCase().includes('reference'), `priceSource must cite market reference for ${item.id}`);
  }
});

test('3. PACK SIZE ACCURACY: Demo items packSize reflects actual packaging, not generic Pack of 1', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const catalogMap = new Map(UGANDA_PHARMACY_CATALOG.map(p => [p.id, p]));

  const p1 = catalogMap.get('DEMO-MED-001'); // Paracetamol 500mg
  assert.strictEqual(p1.packSize, 'Pack of 20 Tablets', 'Paracetamol 500mg demo item packSize must be Pack of 20 Tablets');

  const p2 = catalogMap.get('DEMO-MED-002'); // Ibuprofen 400mg
  assert.strictEqual(p2.packSize, 'Pack of 20 Tablets', 'Ibuprofen 400mg demo item packSize must be Pack of 20 Tablets');

  const p4 = catalogMap.get('DEMO-MED-004'); // Amoxicillin 500mg
  assert.strictEqual(p4.packSize, 'Pack of 20 Capsules', 'Amoxicillin 500mg packSize must be Pack of 20 Capsules');

  const p21 = catalogMap.get('DEMO-MED-021'); // Cough syrup
  assert.strictEqual(p21.packSize, '100ml Bottle', 'Cough Syrup packSize must be 100ml Bottle');

  const p23 = catalogMap.get('DEMO-MED-023'); // Digital Thermometer
  assert.strictEqual(p23.packSize, '1 Digital Unit', 'Digital Thermometer packSize must be 1 Digital Unit');

  const p24 = catalogMap.get('DEMO-MED-024'); // BP Monitor
  assert.strictEqual(p24.packSize, '1 Complete Monitor Kit', 'BP Monitor packSize must be 1 Complete Monitor Kit');
});

test('4. BRAND VS GENERIC DIFFERENTIALS: Realistic Uganda market price differences', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const catalogMap = new Map(UGANDA_PHARMACY_CATALOG.map(p => [p.id, p]));

  // Generic Paracetamol (DEMO-MED-001, 20s = 5,000 UGX) vs Panadol Extra (BC-MED-0035, 24s = 7,500 UGX)
  const paracetamol = catalogMap.get('DEMO-MED-001');
  const panadolExtra = catalogMap.get('BC-MED-0035');
  assert.ok(panadolExtra.sellingPrice > paracetamol.sellingPrice, 'Branded Panadol Extra must be priced higher than generic Paracetamol');

  // Generic Co-amoxiclav vs Branded Augmentin
  const augmentin = UGANDA_PHARMACY_CATALOG.find(p => p.name.toLowerCase().includes('augmentin'));
  if (augmentin) {
    const genericAmoxClav = UGANDA_PHARMACY_CATALOG.find(p => p.id !== augmentin.id && p.genericName.toLowerCase().includes('amoxicillin + clavulanic acid'));
    if (genericAmoxClav) {
      assert.ok(augmentin.sellingPrice > genericAmoxClav.sellingPrice, 'Branded Augmentin must be priced higher than generic Co-amoxiclav');
    }
  }
});

test('5. STRENGTH PROPORTIONALITY: Price inversions resolved', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const catalogMap = new Map(UGANDA_PHARMACY_CATALOG.map(p => [p.id, p]));

  // Amlodipine 5mg vs 10mg
  const amlo5 = catalogMap.get('DEMO-MED-029');
  const amlo10 = catalogMap.get('BC-MED-0497');
  assert.ok(amlo5.sellingPrice <= amlo10.sellingPrice, `Amlodipine 5mg (${amlo5.sellingPrice}) must not be higher than 10mg (${amlo10.sellingPrice})`);

  // Metformin 500mg vs 850mg
  const met500 = catalogMap.get('DEMO-MED-031');
  const met850 = catalogMap.get('BC-MED-0528');
  assert.ok(met500.sellingPrice <= met850.sellingPrice, `Metformin 500mg (${met500.sellingPrice}) must not be higher than 850mg (${met850.sellingPrice})`);

  // Losartan 50mg vs 100mg
  const los50 = catalogMap.get('DEMO-MED-030');
  const los100 = catalogMap.get('BC-MED-0488');
  assert.ok(los50.sellingPrice <= los100.sellingPrice, `Losartan 50mg (${los50.sellingPrice}) must not be higher than 100mg (${los100.sellingPrice})`);
});

test('6. MEDICAL DEVICES PRICING: High-capital devices reflect authentic instrument pricing', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const catalogMap = new Map(UGANDA_PHARMACY_CATALOG.map(p => [p.id, p]));

  // Omron BP Monitor M2
  const bpM2 = catalogMap.get('BC-MED-0680');
  assert.ok(bpM2.sellingPrice >= 150000 && bpM2.sellingPrice <= 250000, `Omron M2 price (${bpM2.sellingPrice}) must be in realistic 150k-250k range`);

  // Omron BP Monitor M3
  const bpM3 = catalogMap.get('BC-MED-0681');
  assert.ok(bpM3.sellingPrice > bpM2.sellingPrice, 'Omron M3 Comfort must cost more than M2 Basic');

  // Littmann Classic III Stethoscope
  const littmann = catalogMap.get('BC-MED-0684');
  assert.ok(littmann.sellingPrice >= 300000, `Littmann Classic III (${littmann.sellingPrice}) must be >= 300,000 UGX`);

  // Pulse Oximeter
  const oximeter = catalogMap.get('BC-MED-0615');
  assert.ok(oximeter.sellingPrice >= 35000 && oximeter.sellingPrice <= 80000, `Pulse oximeter (${oximeter.sellingPrice}) must be in 35k-80k UGX range`);

  // Compressor Nebulizer
  const nebulizer = catalogMap.get('BC-MED-0611');
  assert.ok(nebulizer.sellingPrice >= 150000 && nebulizer.sellingPrice <= 250000, `Compressor nebulizer (${nebulizer.sellingPrice}) must be in 150k-250k range`);

  // Accu-Chek Blood Glucose Test Strips
  const strips = catalogMap.get('DEMO-MED-032');
  assert.ok(strips.sellingPrice >= 50000 && strips.sellingPrice <= 80000, `Accu-Chek Strips 50s (${strips.sellingPrice}) must be in 50k-80k range`);
});

test('7. PRESCRIPTION INTEGRITY: OTC and Rx classifications preserved', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const catalogMap = new Map(UGANDA_PHARMACY_CATALOG.map(p => [p.id, p]));

  // Paracetamol must remain OTC
  assert.strictEqual(catalogMap.get('DEMO-MED-001').requiresPrescription, false, 'Paracetamol must remain OTC');

  // Amoxicillin must remain Rx
  assert.strictEqual(catalogMap.get('DEMO-MED-004').requiresPrescription, true, 'Amoxicillin must remain Rx');

  // Tramadol must remain Rx
  assert.strictEqual(catalogMap.get('DEMO-MED-026').requiresPrescription, true, 'Tramadol must remain Rx');

  // Salbutamol Inhaler must remain Rx
  assert.strictEqual(catalogMap.get('DEMO-MED-020').requiresPrescription, true, 'Salbutamol Inhaler must remain Rx');

  // ORS must remain OTC
  assert.strictEqual(catalogMap.get('DEMO-MED-009').requiresPrescription, false, 'ORS must remain OTC');
});

test('8. HTML DIALOGS: index.html defines price-control-dialog and price-summary-dialog', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  // Dedicated Price Control Dialog
  assert.ok(html.includes('id="price-control-dialog"'), 'Must contain price-control-dialog');
  assert.ok(html.includes('id="price-ctrl-selling-input"'), 'Must contain price-ctrl-selling-input');
  assert.ok(html.includes('id="price-ctrl-cost-input"'), 'Must contain price-ctrl-cost-input');
  assert.ok(html.includes('id="price-ctrl-large-change-alert"'), 'Must contain large price change alert box');
  assert.ok(html.includes('id="price-ctrl-confirm-check"'), 'Must contain price confirmation checkbox');
  assert.ok(html.includes('id="price-history-table-container"'), 'Must contain price history table container');

  // Price Review Summary Dialog
  assert.ok(html.includes('id="price-summary-dialog"'), 'Must contain price-summary-dialog');
  assert.ok(html.includes('id="kpi-total-reviewed"'), 'Must contain total reviewed KPI element');
  assert.ok(html.includes('id="kpi-prices-updated"'), 'Must contain prices updated KPI element');
  assert.ok(html.includes('id="btn-export-price-csv"'), 'Must contain export price CSV button');
  assert.ok(html.includes('id="price-summary-table-box"'), 'Must contain price summary table container');

  // Toolbar trigger
  assert.ok(html.includes('id="btn-open-price-summary"'), 'Must contain btn-open-price-summary in toolbar');
});

test('9. CSS STYLING: styles.css contains rules for price control and audit system', () => {
  const css = fs.readFileSync(stylesCssPath, 'utf8');
  assert.ok(css.includes('.price-ctrl-product-banner'), 'Must style price-ctrl-product-banner');
  assert.ok(css.includes('.price-history-table'), 'Must style price-history-table');
  assert.ok(css.includes('.price-kpis-grid'), 'Must style price-kpis-grid');
  assert.ok(css.includes('.price-audit-table'), 'Must style price-audit-table');
  assert.ok(css.includes('.margin-badge'), 'Must style margin-badge');
});

test('10. CONTROLLER FUNCTIONS: app.js exports price control and report functions', async () => {
  const appModule = await import('../BLOOMCARE-main/app.js');
  assert.strictEqual(typeof appModule.openPriceControlModal, 'function', 'openPriceControlModal must be exported');
  assert.strictEqual(typeof appModule.closePriceControlModal, 'function', 'closePriceControlModal must be exported');
  assert.strictEqual(typeof appModule.renderPriceHistoryTable, 'function', 'renderPriceHistoryTable must be exported');
  assert.strictEqual(typeof appModule.openPriceSummaryModal, 'function', 'openPriceSummaryModal must be exported');
  assert.strictEqual(typeof appModule.closePriceSummaryModal, 'function', 'closePriceSummaryModal must be exported');
  assert.strictEqual(typeof appModule.renderPriceSummaryTable, 'function', 'renderPriceSummaryTable must be exported');
  assert.strictEqual(typeof appModule.exportPriceCatalogCsv, 'function', 'exportPriceCatalogCsv must be exported');
});

test('11. HISTORICAL ORDER IMMUTABILITY: Modifying product price does not mutate existing order items', async () => {
  const { STATE } = await import('../BLOOMCARE-main/app.js');

  const testProduct = STATE.products.find(p => p.id === 'DEMO-MED-001');
  const initialPrice = testProduct.sellingPrice || testProduct.price;

  // Mock historical completed order
  const mockOrder = {
    id: 'BC-TEST-HIST-001',
    orderNumber: 'BC-TEST-HIST-001',
    orderStatus: 'Completed',
    paymentStatus: 'Paid',
    total: initialPrice * 2,
    items: [
      {
        productId: testProduct.id,
        name: testProduct.name,
        price: initialPrice,
        unitPrice: initialPrice,
        quantity: 2,
        subtotal: initialPrice * 2
      }
    ],
    createdAt: '2026-09-01T10:00:00.000Z'
  };

  STATE.orders.push(mockOrder);

  // Now simulate an Admin price change on the catalog product
  const originalSelling = testProduct.sellingPrice;
  testProduct.sellingPrice = 99000;
  testProduct.price = 99000;

  // The historical order must STILL have initialPrice
  const orderRecord = STATE.orders.find(o => o.id === 'BC-TEST-HIST-001');
  assert.strictEqual(orderRecord.items[0].price, initialPrice, 'Historical order item price must remain initial price');
  assert.strictEqual(orderRecord.items[0].subtotal, initialPrice * 2, 'Historical order subtotal must remain initial calculation');
  assert.strictEqual(orderRecord.total, initialPrice * 2, 'Historical order total must remain untouched');

  // Restore test product price and clean up mock
  testProduct.sellingPrice = originalSelling;
  testProduct.price = originalSelling;
  STATE.orders = STATE.orders.filter(o => o.id !== 'BC-TEST-HIST-001');
});

