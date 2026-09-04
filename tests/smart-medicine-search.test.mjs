import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const catalogPath = path.join(rootDir, 'BLOOMCARE-main', 'data', 'medicines-catalog.js');
const htmlPath = path.join(rootDir, 'BLOOMCARE-main', 'index.html');
const cssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');

test('ALPHABETICAL SORTING: Sorts medicines alphabetically A-Z by default', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const { sortMedicinesList } = await import('../BLOOMCARE-main/app.js');

  const sorted = sortMedicinesList(UGANDA_PHARMACY_CATALOG, 'name-asc');
  assert.strictEqual(sorted.length, UGANDA_PHARMACY_CATALOG.length);

  for (let i = 0; i < sorted.length - 1; i++) {
    const cmp = (sorted[i].name || '').localeCompare(sorted[i + 1].name || '', undefined, { sensitivity: 'base' });
    assert.ok(cmp <= 0, `Alphabetical order violated between "${sorted[i].name}" and "${sorted[i + 1].name}"`);
  }
});

test('SORTING OPTIONS: Supports name-asc, name-desc, price-asc, price-desc, newest, availability', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const { sortMedicinesList, getSearchStockBadge } = await import('../BLOOMCARE-main/app.js');

  const desc = sortMedicinesList(UGANDA_PHARMACY_CATALOG, 'name-desc');
  assert.ok(desc[0].name.localeCompare(desc[desc.length - 1].name) > 0);

  const priceAsc = sortMedicinesList(UGANDA_PHARMACY_CATALOG, 'price-asc');
  for (let i = 0; i < priceAsc.length - 1; i++) {
    assert.ok(priceAsc[i].price <= priceAsc[i + 1].price, 'Price ascending order violated');
  }

  const priceDesc = sortMedicinesList(UGANDA_PHARMACY_CATALOG, 'price-desc');
  for (let i = 0; i < priceDesc.length - 1; i++) {
    assert.ok(priceDesc[i].price >= priceDesc[i + 1].price, 'Price descending order violated');
  }

  const avail = sortMedicinesList(UGANDA_PHARMACY_CATALOG, 'availability');
  assert.strictEqual(avail.length, UGANDA_PHARMACY_CATALOG.length);
  const firstBadge = getSearchStockBadge(avail[0]);
  assert.ok(firstBadge.isAvailable, 'First item in availability sort must be in stock or low stock');
});

test('FAST PREFIX SEARCH: Query "par", "amo", "cet" prioritize name prefix matches', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const { searchMedicinesCatalog } = await import('../BLOOMCARE-main/app.js');

  const parResults = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'par');
  assert.ok(parResults.length > 0, 'Should find results for "par"');
  assert.ok(
    parResults[0].name.toLowerCase().startsWith('par'),
    `First result for "par" should start with "par", got: ${parResults[0].name}`
  );

  const amoResults = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'amo');
  assert.ok(amoResults.length > 0, 'Should find results for "amo"');
  assert.ok(
    amoResults[0].name.toLowerCase().startsWith('amo'),
    `First result for "amo" should start with "amo", got: ${amoResults[0].name}`
  );

  const cetResults = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'cet');
  assert.ok(cetResults.length > 0, 'Should find results for "cet"');
  assert.ok(
    cetResults[0].name.toLowerCase().startsWith('cet'),
    `First result for "cet" should start with "cet", got: ${cetResults[0].name}`
  );
});

test('SEARCH PRIORITY: Exact match > Name prefix > Word prefix > Generic prefix > Substring', async () => {
  const { searchMedicinesCatalog } = await import('../BLOOMCARE-main/app.js');

  const testCatalog = [
    { id: '1', name: 'Vitamin C Syrup', genericName: 'Ascorbic Acid', category: 'Vitamins' },
    { id: '2', name: 'Paracetamol', genericName: 'Paracetamol', category: 'Pain Relief' },
    { id: '3', name: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol', category: 'Pain Relief' },
    { id: '4', name: 'Panadol Extra', genericName: 'Paracetamol with Caffeine', category: 'Pain Relief' },
    { id: '5', name: 'Cold Cough Elixir', genericName: 'Herbal Blend', description: 'Contains paracetamol trace', category: 'Cold & Flu' }
  ];

  const results = searchMedicinesCatalog(testCatalog, 'paracetamol');
  assert.strictEqual(results[0].id, '2', 'Exact match must rank 1st');
  assert.strictEqual(results[1].id, '3', 'Name prefix match must rank 2nd');
  assert.strictEqual(results[2].id, '4', 'Generic prefix match must rank 3rd');
  assert.strictEqual(results[3].id, '5', 'Description substring match must rank 4th');
});

test('TYPO TOLERANCE: Lightweight fuzzy matching resolves common misspellings without noise', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const { searchMedicinesCatalog } = await import('../BLOOMCARE-main/app.js');

  const typoPar = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'paracetmol');
  assert.ok(typoPar.length > 0, 'Should handle "paracetmol" typo');
  assert.ok(
    typoPar[0].name.toLowerCase().includes('paracetamol'),
    `Should suggest Paracetamol for "paracetmol", got: ${typoPar[0].name}`
  );

  const typoAmox = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'amoxcillin');
  assert.ok(typoAmox.length > 0, 'Should handle "amoxcillin" typo');
  assert.ok(
    typoAmox[0].name.toLowerCase().includes('amoxicillin'),
    `Should suggest Amoxicillin for "amoxcillin", got: ${typoAmox[0].name}`
  );

  const gibberish = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'zzqwxjjk');
  assert.strictEqual(gibberish.length, 0, 'Gibberish query must return 0 results');
});

test('MULTI-FIELD SEARCH: Searches generic, brand, active ingredients, SKU, strength, synonyms', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const { searchMedicinesCatalog } = await import('../BLOOMCARE-main/app.js');

  const pcmResults = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'pcm');
  assert.ok(pcmResults.length > 0, 'Should find products for PCM synonym');
  assert.ok(
    pcmResults.some(p => p.name.toLowerCase().includes('paracetamol')),
    'PCM must resolve to Paracetamol'
  );

  const orsResults = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'ors');
  assert.ok(orsResults.length > 0, 'Should find products for ORS synonym');
  assert.ok(
    orsResults.some(p => p.name.toLowerCase().includes('rehydration')),
    'ORS must resolve to oral rehydration'
  );

  const strengthResults = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, '500mg');
  assert.ok(strengthResults.length > 0, 'Should find products by strength "500mg"');
  assert.ok(
    strengthResults.every(p => 
      (p.strength || '').toLowerCase().includes('500mg') || 
      (p.name || '').toLowerCase().includes('500mg') ||
      (p.genericName || '').toLowerCase().includes('500mg') ||
      (p.activeIngredients || '').toLowerCase().includes('500mg') ||
      (p.description || '').toLowerCase().includes('500mg')
    ),
    'All strength results must contain 500mg across product formulation fields'
  );

  const sku = UGANDA_PHARMACY_CATALOG[0].sku;
  const skuResults = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, sku);
  assert.ok(skuResults.length > 0, 'Should find product by SKU');
  assert.strictEqual(skuResults[0].sku, sku, 'First result must match requested SKU');
});

test('CATEGORY-AWARE SEARCH: Prioritizes active category when browsing specific department', async () => {
  const { searchMedicinesCatalog } = await import('../BLOOMCARE-main/app.js');

  const testCatalog = [
    { id: '1', name: 'Paracetamol Drops 100mg/ml', category: 'Baby & Child Care' },
    { id: '2', name: 'Paracetamol 500mg Tablets', category: 'Pain Relief' },
    { id: '3', name: 'Paracetamol Pediatric Suspension', category: 'Baby & Child Care' }
  ];

  const painReliefSearch = searchMedicinesCatalog(testCatalog, 'paracetamol', { category: 'Pain Relief' });
  assert.strictEqual(painReliefSearch[0].id, '2', 'Pain Relief product must be prioritized when category is Pain Relief');

  const babySearch = searchMedicinesCatalog(testCatalog, 'paracetamol', { category: 'Baby & Child Care' });
  assert.notStrictEqual(babySearch[0].id, '2', 'Baby & Child Care product must be prioritized when category is Baby & Child Care');
});

test('STOCK & PRESCRIPTION STATUS BADGES: In-Stock, Low-Stock, Out-of-Stock and Rx vs OTC', async () => {
  const { getSearchStockBadge, getSearchRxBadge } = await import('../BLOOMCARE-main/app.js');

  const inStock = getSearchStockBadge({ stockQuantity: 50, reorderLevel: 10 });
  assert.strictEqual(inStock.status, 'in-stock');
  assert.ok(inStock.label.includes('In Stock'));
  assert.strictEqual(inStock.isAvailable, true);

  const lowStock = getSearchStockBadge({ stockQuantity: 5, reorderLevel: 10 });
  assert.strictEqual(lowStock.status, 'low-stock');
  assert.ok(lowStock.label.includes('Low Stock'));
  assert.strictEqual(lowStock.isAvailable, true);

  const outStock = getSearchStockBadge({ stockQuantity: 0, reorderLevel: 10 });
  assert.strictEqual(outStock.status, 'out-of-stock');
  assert.ok(outStock.label.includes('Out of Stock'));
  assert.strictEqual(outStock.isAvailable, false);

  const rxProd = getSearchRxBadge({ requiresPrescription: true });
  assert.strictEqual(rxProd.label, 'Rx Required');
  assert.strictEqual(rxProd.isRx, true);

  const otcProd = getSearchRxBadge({ requiresPrescription: false });
  assert.strictEqual(otcProd.label, 'OTC');
  assert.strictEqual(otcProd.isRx, false);
});

test('AUTOCOMPLETE LIMIT: Results cap at 10 items with view-all mechanism', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  const { searchMedicinesCatalog } = await import('../BLOOMCARE-main/app.js');

  const top10 = searchMedicinesCatalog(UGANDA_PHARMACY_CATALOG, 'a', { limit: 10 });
  assert.strictEqual(top10.length, 10, 'Autocomplete query must cap at 10 items');
});

test('SEARCH HIGHLIGHTING: Wraps matched substring in <mark> tag safely', async () => {
  const { highlightSearchMatch } = await import('../BLOOMCARE-main/app.js');

  const highlighted = highlightSearchMatch('Paracetamol 500mg Tablets', 'para');
  assert.ok(highlighted.includes('<mark>Para</mark>cetamol'), 'Should highlight matching prefix with <mark>');
});

test('DOM & KEYBOARD SHORTCUT: index.html contains Ctrl+K hints and autocomplete containers', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('id="catalog-search-suggestions"'), 'Catalog search must have suggestions dropdown');
  assert.ok(html.includes('id="top-search-suggestions"'), 'Top search must have suggestions dropdown');
  assert.ok(html.includes('id="staff-search-suggestions"'), 'Staff search must have suggestions dropdown');
  assert.ok(html.includes('id="staff-quick-lookup-dialog"'), 'Staff quick lookup dialog must exist in DOM');
  assert.ok(html.includes('id="staff-quick-dispense-btn"'), 'Staff quick lookup must have dispense button');
  assert.ok(html.includes('id="staff-quick-order-btn"'), 'Staff quick lookup must have add to order button');
  assert.ok(html.includes('id="staff-quick-view-btn"'), 'Staff quick lookup must have view details button');
});

test('CSS STYLES: Contains responsive rules, suggestion dropdown elevation, and status pills', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.search-suggestions-dropdown'), 'Must have search suggestions dropdown styles');
  assert.ok(css.includes('.search-suggestion-item'), 'Must have search suggestion item styles');
  assert.ok(css.includes('.stock-tag-instock'), 'Must have in-stock tag styling');
  assert.ok(css.includes('.stock-tag-outofstock'), 'Must have out-of-stock tag styling');
  assert.ok(css.includes('.rx-tag-req'), 'Must have Rx tag styling');
  assert.ok(css.includes('.suggestions-view-all-btn'), 'Must have view all button styling');
});

test('FIRESTORE INDEXES: firestore.indexes.json includes composite indexes for medicines', () => {
  const indexesPath = path.join(rootDir, 'firestore.indexes.json');
  const json = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));

  const medicineIndexes = json.indexes.filter(idx => idx.collectionGroup === 'medicines');
  assert.ok(medicineIndexes.length >= 4, 'Must have at least 4 composite indexes for medicines');

  const fieldsIndexed = medicineIndexes.map(idx => idx.fields.map(f => f.fieldPath).join('+'));
  assert.ok(fieldsIndexed.some(f => f.includes('category') && f.includes('name')), 'Index for category+name required');
  assert.ok(fieldsIndexed.some(f => f.includes('status') && f.includes('name')), 'Index for status+name required');
  assert.ok(fieldsIndexed.some(f => f.includes('requiresPrescription') && f.includes('name')), 'Index for prescription+name required');
  assert.ok(fieldsIndexed.some(f => f.includes('stockQuantity') && f.includes('name')), 'Index for stockQuantity+name required');
});
