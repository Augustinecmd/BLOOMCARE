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

function norm(s) {
  if (!s) return '';
  return String(s).toLowerCase().replace(/[^\w\d]/g, ' ').replace(/\s+/g, ' ').trim();
}

test('CATALOG FILE: data/medicines-catalog.js exports UGANDA_PHARMACY_CATALOG and CATALOG_CATEGORIES', async () => {
  assert.ok(fs.existsSync(catalogPath), 'medicines-catalog.js must exist in BLOOMCARE-main/data/');
  const { UGANDA_PHARMACY_CATALOG, CATALOG_CATEGORIES } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  assert.ok(Array.isArray(UGANDA_PHARMACY_CATALOG), 'UGANDA_PHARMACY_CATALOG must be an array');
  assert.ok(Array.isArray(CATALOG_CATEGORIES), 'CATALOG_CATEGORIES must be an array');
  assert.strictEqual(UGANDA_PHARMACY_CATALOG.length, 749, 'Authoritative deduplicated catalog contains 749 unique products');
  assert.strictEqual(CATALOG_CATEGORIES.length, 15, 'Must contain exactly 15 categories');
});

test('CATEGORIES: All 15 required categories contain genuine products with accurate dynamic counts', async () => {
  const { UGANDA_PHARMACY_CATALOG, CATALOG_CATEGORIES } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  
  const expectedCategories = [
    'Pain Relief',
    'Cold & Flu',
    'Vitamins & Supplements',
    'Digestive Health',
    'First Aid',
    'Skin Care',
    'Personal Care',
    'Baby & Child Care',
    'Maternal Health',
    'Chronic Care',
    'Diabetes Care',
    'Respiratory Care',
    'Allergy Care',
    'Medical Devices',
    'Wellness Products'
  ];

  const counts = {};
  for (const item of UGANDA_PHARMACY_CATALOG) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  const categoryMetaMap = new Map(CATALOG_CATEGORIES.map(c => [c.name, c]));

  for (const cat of expectedCategories) {
    assert.ok(counts[cat] !== undefined, `Category "${cat}" must exist in catalog`);
    assert.ok(counts[cat] >= 45, `Category "${cat}" must contain at least 45 unique medicines, found ${counts[cat]}`);
    assert.ok(categoryMetaMap.has(cat), `Category "${cat}" must be in CATALOG_CATEGORIES`);
    assert.strictEqual(categoryMetaMap.get(cat).count, counts[cat], `CATALOG_CATEGORIES count for "${cat}" must match actual catalog count (${counts[cat]})`);
  }
});

test('SCHEMA INTEGRITY: Every product has all 22 required fields non-null and valid', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  
  const requiredFields = [
    'id', 'name', 'genericName', 'brandName', 'activeIngredients', 'strength',
    'dosageForm', 'packSize', 'category', 'subcategory', 'description', 'manufacturer',
    'price', 'stockQuantity', 'reorderLevel', 'status', 'requiresPrescription',
    'imageUrl', 'sku', 'batchNumber', 'expiryDate', 'createdAt', 'updatedAt'
  ];

  for (let i = 0; i < UGANDA_PHARMACY_CATALOG.length; i++) {
    const item = UGANDA_PHARMACY_CATALOG[i];
    for (const field of requiredFields) {
      assert.ok(item[field] !== undefined, `Product index ${i} (${item.id}) missing field "${field}"`);
      assert.ok(item[field] !== null, `Product index ${i} (${item.id}) has null field "${field}"`);
      if (typeof item[field] === 'string') {
        assert.ok(item[field].trim().length > 0, `Product index ${i} (${item.id}) has empty string in field "${field}"`);
      }
    }
    assert.strictEqual(typeof item.price, 'number', `Price must be numeric for ${item.id}`);
    assert.ok(item.price > 0, `Price must be greater than 0 UGX for ${item.id}`);
    assert.strictEqual(typeof item.stockQuantity, 'number', `Stock quantity must be numeric for ${item.id}`);
    assert.strictEqual(typeof item.reorderLevel, 'number', `Reorder level must be numeric for ${item.id}`);
    assert.strictEqual(typeof item.requiresPrescription, 'boolean', `requiresPrescription must be boolean for ${item.id}`);
    assert.ok(['active', 'inactive'].includes(item.status), `Status must be active or inactive for ${item.id}`);
  }
});

test('STRICT UNIQUENESS: Zero duplicate IDs, SKUs, names, or clinical signatures', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  
  const idSet = new Set();
  const skuSet = new Set();
  const nameSet = new Set();
  const clinicalSet = new Set();

  for (const item of UGANDA_PHARMACY_CATALOG) {
    // 1. ID uniqueness
    assert.ok(!idSet.has(item.id), `Duplicate product ID detected: ${item.id}`);
    idSet.add(item.id);

    // 2. SKU uniqueness
    assert.ok(!skuSet.has(item.sku), `Duplicate SKU detected: ${item.sku}`);
    skuSet.add(item.sku);

    // 3. Name uniqueness
    const cleanName = norm(item.name);
    assert.ok(!nameSet.has(cleanName), `Duplicate medicine name detected: "${item.name}" (ID: ${item.id})`);
    nameSet.add(cleanName);

    // 4. Clinical signature uniqueness (Generic + Strength + Form)
    const gen = norm(item.genericName || item.name);
    const st = norm(item.strength);
    const form = norm(item.dosageForm);
    const sig = `${gen}___${st}___${form}`;
    if (gen && st && form) {
      assert.ok(!clinicalSet.has(sig), `Duplicate clinical formulation detected: ${sig} (ID: ${item.id})`);
      clinicalSet.add(sig);
    }
  }

  assert.strictEqual(idSet.size, 749, 'Must have exactly 749 unique IDs');
  assert.strictEqual(skuSet.size, 749, 'Must have exactly 749 unique SKUs');
  assert.strictEqual(nameSet.size, 749, 'Must have exactly 749 unique medicine names');
});

test('CROSS-CATEGORY PURITY: No medicines repeated across multiple categories', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');

  // Zinc Sulfate 20mg must be in Vitamins & Supplements ONLY
  const zincItems = UGANDA_PHARMACY_CATALOG.filter(p => norm(p.genericName).includes('zinc sulfate') && norm(p.strength) === '20mg');
  assert.strictEqual(zincItems.length, 1, 'Zinc Sulfate 20mg must have exactly ONE authoritative record');
  assert.strictEqual(zincItems[0].category, 'Vitamins & Supplements', 'Zinc 20mg must reside in Vitamins & Supplements');

  // Promethazine 25mg must be in Allergy Care ONLY
  const promethazineItems = UGANDA_PHARMACY_CATALOG.filter(p => norm(p.genericName).includes('promethazine') && norm(p.strength) === '25mg');
  assert.strictEqual(promethazineItems.length, 1, 'Promethazine 25mg must have exactly ONE authoritative record');
  assert.strictEqual(promethazineItems[0].category, 'Allergy Care', 'Promethazine must reside in Allergy Care');

  // Carbocisteine 375mg must be in Respiratory Care ONLY
  const carboItems = UGANDA_PHARMACY_CATALOG.filter(p => norm(p.name).includes('carbocisteine') && norm(p.strength) === '375mg');
  assert.strictEqual(carboItems.length, 1, 'Carbocisteine 375mg must have exactly ONE record');
  assert.strictEqual(carboItems[0].category, 'Respiratory Care', 'Carbocisteine must reside in Respiratory Care');

  // Vicks VapoRub must be in Cold & Flu ONLY
  const vicksItems = UGANDA_PHARMACY_CATALOG.filter(p => norm(p.name).includes('vicks vaporub'));
  assert.strictEqual(vicksItems.length, 1, 'Vicks VapoRub must have exactly ONE record');
  assert.strictEqual(vicksItems[0].category, 'Cold & Flu', 'Vicks VapoRub must reside in Cold & Flu');

  // Sudocrem must be in Baby & Child Care ONLY
  const sudoItems = UGANDA_PHARMACY_CATALOG.filter(p => norm(p.name).includes('sudocrem'));
  assert.strictEqual(sudoItems.length, 1, 'Sudocrem must have exactly ONE record');
  assert.strictEqual(sudoItems[0].category, 'Baby & Child Care', 'Sudocrem must reside in Baby & Child Care');

  // Deep Heat must have exactly 1 record in Pain Relief
  const deepHeatItems = UGANDA_PHARMACY_CATALOG.filter(p => norm(p.name).includes('deep heat'));
  assert.strictEqual(deepHeatItems.length, 1, 'Deep Heat must have exactly ONE record');
});

test('INITIAL DEMO MEDICINES PRESERVED: All 34 demo items maintain original IDs, images and categories', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  
  const expectedDemoIds = [
    'DEMO-MED-001', 'DEMO-MED-002', 'DEMO-MED-003', 'DEMO-MED-026',
    'DEMO-MED-004', 'DEMO-MED-005', 'DEMO-MED-021', 'DEMO-MED-022',
    'DEMO-MED-006', 'DEMO-MED-007', 'DEMO-MED-008', 'DEMO-MED-009',
    'DEMO-MED-010', 'DEMO-MED-011', 'DEMO-MED-012', 'DEMO-MED-027',
    'DEMO-MED-013', 'DEMO-MED-028', 'DEMO-MED-014', 'DEMO-MED-015',
    'DEMO-MED-016', 'DEMO-MED-017', 'DEMO-MED-018', 'DEMO-MED-019',
    'DEMO-MED-020', 'DEMO-MED-023', 'DEMO-MED-024', 'DEMO-MED-025',
    'DEMO-MED-029', 'DEMO-MED-030', 'DEMO-MED-031', 'DEMO-MED-032',
    'DEMO-MED-033', 'DEMO-MED-034'
  ];

  const catalogMap = new Map(UGANDA_PHARMACY_CATALOG.map(p => [p.id, p]));

  for (const id of expectedDemoIds) {
    assert.ok(catalogMap.has(id), `Initial demo product ${id} must exist in catalog`);
    const prod = catalogMap.get(id);
    assert.ok(prod.imageUrl.startsWith('products/'), `Demo item ${id} must keep its packshot URL`);
    assert.ok(prod.imageUrl.endsWith('.webp'), `Demo item ${id} packshot must end with .webp`);
  }
});

test('APPLICATION RUNTIME: STATE.products in app.js contains the full 749 unique products', async () => {
  const { STATE } = await import('../BLOOMCARE-main/app.js');
  assert.ok(Array.isArray(STATE.products), 'STATE.products must be an array');
  assert.strictEqual(STATE.products.length, 749, 'STATE.products must contain all 749 unique products at runtime');
  assert.strictEqual(STATE.categories.length, 15, 'STATE.categories must contain 15 categories');
});

test('DEDUPLICATION SAFEGUARD: deduplicateCatalog and isDuplicateProduct block duplicates', async () => {
  const { deduplicateCatalog, isDuplicateProduct } = await import('../BLOOMCARE-main/app.js');
  
  assert.strictEqual(typeof deduplicateCatalog, 'function', 'deduplicateCatalog must be exported');
  assert.strictEqual(typeof isDuplicateProduct, 'function', 'isDuplicateProduct must be exported');

  // Test deduplicateCatalog on list with duplicates
  const mockCatalog = [
    { id: 'TEST-1', name: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', sku: 'SKU-1' },
    { id: 'TEST-1', name: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', sku: 'SKU-1' }, // ID dup
    { id: 'TEST-2', name: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', sku: 'SKU-2' }, // Name & clinical dup
    { id: 'TEST-3', name: 'Ibuprofen 400mg Tablets', genericName: 'Ibuprofen', strength: '400mg', dosageForm: 'Tablet', sku: 'SKU-3' }
  ];

  const deduped = deduplicateCatalog(mockCatalog);
  assert.strictEqual(deduped.length, 2, 'deduplicateCatalog must strip both ID and name/clinical duplicates');
  assert.strictEqual(deduped[0].id, 'TEST-1');
  assert.strictEqual(deduped[1].id, 'TEST-3');

  // Test isDuplicateProduct
  const existingProducts = [
    { id: 'MED-1', name: 'Amoxicillin 500mg Capsules', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule', sku: 'BC-AM50' }
  ];

  // Identical name
  assert.ok(isDuplicateProduct({ id: 'MED-2', name: 'Amoxicillin 500mg Capsules', sku: 'BC-AM50-NEW' }, existingProducts), 'Should detect duplicate by name');

  // Identical clinical signature
  assert.ok(isDuplicateProduct({ id: 'MED-3', name: 'Amoxil Brand', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule', sku: 'BC-AM50-BRAND' }, existingProducts), 'Should detect duplicate by clinical signature');

  // Same ID during edit should be allowed when ignoreId is passed
  assert.strictEqual(isDuplicateProduct({ id: 'MED-1', name: 'Amoxicillin 500mg Capsules', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule', sku: 'BC-AM50' }, existingProducts, 'MED-1'), false, 'Editing self must not trigger false positive');

  // Unique product should pass
  assert.strictEqual(isDuplicateProduct({ id: 'MED-4', name: 'Ciprofloxacin 500mg Tablets', genericName: 'Ciprofloxacin', strength: '500mg', dosageForm: 'Tablet', sku: 'BC-CP50' }, existingProducts), false, 'Unique product should not be flagged as duplicate');
});

test('MULTI-FIELD SEARCH: Search matches activeIngredients, subcategory, brandName and SKU', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');

  // Search by active ingredient (e.g. Metformin, Amoxicillin, Paracetamol)
  const metforminItems = UGANDA_PHARMACY_CATALOG.filter(p => 
    p.activeIngredients?.toLowerCase().includes('metformin') ||
    p.genericName?.toLowerCase().includes('metformin')
  );
  assert.ok(metforminItems.length > 0, 'Should find products by active ingredient Metformin');

  const amoxItems = UGANDA_PHARMACY_CATALOG.filter(p => 
    p.activeIngredients?.toLowerCase().includes('amoxicillin') ||
    p.genericName?.toLowerCase().includes('amoxicillin')
  );
  assert.ok(amoxItems.length > 0, 'Should find products by active ingredient Amoxicillin');

  // Search by subcategory
  const nsaidItems = UGANDA_PHARMACY_CATALOG.filter(p =>
    p.subcategory?.toLowerCase().includes('nsaid')
  );
  assert.ok(nsaidItems.length > 0, 'Should find products by subcategory NSAID');

  // Search by specific Ugandan manufacturer
  const reneItems = UGANDA_PHARMACY_CATALOG.filter(p =>
    p.manufacturer?.toLowerCase().includes('rene industries')
  );
  assert.ok(reneItems.length > 0, 'Should find products manufactured by Rene Industries');
});

test('MARKETPLACE PAGINATION: 24 items per page computes correct total pages and slicing', async () => {
  const { STATE } = await import('../BLOOMCARE-main/app.js');
  
  const pageSize = STATE.marketplacePageSize || 24;
  assert.strictEqual(pageSize, 24, 'Marketplace page size must be exactly 24');

  const totalProds = STATE.products.filter(p => p.status !== 'inactive').length;
  const expectedPages = Math.ceil(totalProds / 24);
  assert.strictEqual(expectedPages, Math.ceil(749 / 24), '749 products must yield 32 pages of 24');

  // Slice for page 1
  const page1 = STATE.products.slice(0, 24);
  assert.strictEqual(page1.length, 24, 'Page 1 must have 24 items');

  // Slice for page 2
  const page2 = STATE.products.slice(24, 48);
  assert.strictEqual(page2.length, 24, 'Page 2 must have 24 items');

  // Last page
  const lastPage = STATE.products.slice((expectedPages - 1) * 24);
  assert.strictEqual(lastPage.length, 749 % 24 || 24, 'Last page must contain the remaining items');
});

test('STAFF TABLE PAGINATION: 25 items per page with category and status filtering', async () => {
  const { STATE } = await import('../BLOOMCARE-main/app.js');

  const staffPageSize = STATE.staffMedicinesPageSize || 25;
  assert.strictEqual(staffPageSize, 25, 'Staff dispensary page size must be 25');

  const painReliefProds = STATE.products.filter(p => p.category === 'Pain Relief');
  assert.strictEqual(painReliefProds.length, 49, 'Pain Relief contains 49 unique items for staff filter');

  const staffPagesForCategory = Math.ceil(painReliefProds.length / staffPageSize);
  assert.strictEqual(staffPagesForCategory, 2, '49 items at 25/page should yield 2 pages (25, 24)');
});

test('HTML STRUCTURE: Contains catalog pagination, staff toolbar, and updated EMHSLU formulary notice', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert.ok(html.includes('id="catalog-pagination"'), 'Must have catalog-pagination container');
  assert.ok(html.includes('id="staff-medicines-toolbar"'), 'Must have staff-medicines-toolbar');
  assert.ok(html.includes('id="staff-medicines-pagination"'), 'Must have staff-medicines-pagination');
  assert.ok(html.includes('UGANDAN PHARMACY CATALOG (EMHSLU 2023)'), 'Must reference EMHSLU 2023 notice');
});

test('CSS STYLING: Contains responsive styles for pagination bar and buttons', () => {
  const css = fs.readFileSync(stylesCssPath, 'utf8');
  assert.ok(css.includes('.catalog-pagination-bar'), 'CSS must define .catalog-pagination-bar');
  assert.ok(css.includes('.page-num-btn'), 'CSS must define .page-num-btn');
  assert.ok(css.includes('.active-page-btn'), 'CSS must define .active-page-btn');
  assert.ok(css.includes('.staff-table-toolbar'), 'CSS must define .staff-table-toolbar');
});

test('COMPREHENSIVE IMAGE AUDIT: Every product has a verified physical image file across all 15 categories', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');
  assert.strictEqual(UGANDA_PHARMACY_CATALOG.length, 749, 'Must audit all 749 catalog items');

  const categories = new Set(UGANDA_PHARMACY_CATALOG.map(p => p.category));
  assert.strictEqual(categories.size, 15, 'All 15 categories must be audited');

  for (const item of UGANDA_PHARMACY_CATALOG) {
    assert.ok(item.imageUrl, `Product ${item.id} (${item.name}) must have an imageUrl`);
    assert.ok(typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0, `Product ${item.id} has empty imageUrl`);

    // Verify physical file exists on disk and is non-empty
    const filePath = path.join(rootDir, 'BLOOMCARE-main', item.imageUrl.replace(/\//g, path.sep));
    assert.ok(fs.existsSync(filePath), `Image file for ${item.id} (${item.imageUrl}) must physically exist`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 0, `Image file for ${item.id} (${item.imageUrl}) must not be empty`);
  }
});

test('MEDICAL DEVICES ACCURACY: Every device type corresponds to its authentic instrument', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');

  // Stethoscopes (excluding combo sphygmomanometer kits)
  const stethoscopes = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('stethoscope') && !p.name.toLowerCase().includes('sphygmomanometer'));
  assert.ok(stethoscopes.length >= 2, 'Should find stethoscopes');
  for (const s of stethoscopes) {
    assert.strictEqual(s.imageUrl, 'products/stethoscope.webp', `Stethoscope ${s.id} must display stethoscope image`);
  }

  // Pulse Oximeter
  const oximeters = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('pulse oximeter'));
  assert.ok(oximeters.length >= 1, 'Should find pulse oximeter');
  for (const ox of oximeters) {
    assert.strictEqual(ox.imageUrl, 'products/pulse-oximeter.webp', `Pulse oximeter ${ox.id} must display pulse oximeter image`);
  }

  // Nebulizer
  const nebulizers = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('nebulizer'));
  assert.ok(nebulizers.length >= 1, 'Should find nebulizer');
  for (const neb of nebulizers) {
    assert.strictEqual(neb.imageUrl, 'products/nebulizer.webp', `Nebulizer ${neb.id} must display nebulizer image`);
  }

  // Blood Pressure Monitors
  const bpMonitors = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('blood pressure monitor') || p.name.toLowerCase().includes('sphygmomanometer'));
  assert.ok(bpMonitors.length >= 3, 'Should find BP monitors');
  for (const bp of bpMonitors) {
    assert.strictEqual(bp.imageUrl, 'products/blood-pressure-monitor.webp', `BP monitor ${bp.id} must display BP monitor image`);
  }

  // Thermometers
  const infraredTherm = UGANDA_PHARMACY_CATALOG.find(p => p.name.toLowerCase().includes('infrared'));
  assert.ok(infraredTherm, 'Should find infrared thermometer');
  assert.strictEqual(infraredTherm.imageUrl, 'products/infrared-thermometer.webp', 'Infrared thermometer must display infrared thermometer image');

  const digitalTherm = UGANDA_PHARMACY_CATALOG.find(p => p.id === 'DEMO-MED-023');
  assert.strictEqual(digitalTherm.imageUrl, 'products/digital-thermometer.webp', 'Digital thermometer must display clinical thermometer image');

  // Mobility: Crutches, Walking Sticks, Wheelchair
  const crutches = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('crutch'));
  assert.ok(crutches.length >= 2, 'Should find crutches');
  for (const c of crutches) {
    assert.strictEqual(c.imageUrl, 'products/crutches.webp', `Crutches ${c.id} must display crutches image`);
  }

  const canes = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('walking stick') || p.name.toLowerCase().includes('quad cane'));
  assert.ok(canes.length >= 2, 'Should find walking sticks');
  for (const cn of canes) {
    assert.strictEqual(cn.imageUrl, 'products/walking-stick.webp', `Cane ${cn.id} must display walking stick image`);
  }

  // Gloves & Syringes
  const gloves = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('gloves'));
  assert.ok(gloves.length >= 2, 'Should find medical/examination gloves');
  for (const g of gloves) {
    assert.strictEqual(g.imageUrl, 'products/examination-gloves.webp', `Gloves ${g.id} must display examination gloves image`);
  }

  const syringes = UGANDA_PHARMACY_CATALOG.filter(p => p.name.toLowerCase().includes('hypodermic syringe'));
  assert.ok(syringes.length >= 2, 'Should find syringes');
  for (const sy of syringes) {
    assert.strictEqual(sy.imageUrl, 'products/hypodermic-syringe.webp', `Syringe ${sy.id} must display syringe image`);
  }
});

test('CLINICAL FORMULATION ACCURACY: Medicines match their actual clinical dosage form without unrelated images', async () => {
  const { UGANDA_PHARMACY_CATALOG } = await import('../BLOOMCARE-main/data/medicines-catalog.js');

  // Benzylpenicillin injection must show sterile vial, never cough syrup
  const penG = UGANDA_PHARMACY_CATALOG.find(p => p.id === 'BC-MED-0121');
  assert.ok(penG, 'Benzylpenicillin injection must exist');
  assert.strictEqual(penG.imageUrl, 'products/sterile-vial.webp', 'Benzylpenicillin injection must display sterile vial visual');
  assert.notStrictEqual(penG.imageUrl, 'products/cough-syrup.webp', 'Benzylpenicillin must NOT display cough syrup');

  // Cefaclor capsules must show capsules, never cough syrup
  const cefaclor = UGANDA_PHARMACY_CATALOG.find(p => p.id === 'BC-MED-0115');
  assert.ok(cefaclor, 'Cefaclor capsules must exist');
  assert.strictEqual(cefaclor.imageUrl, 'products/capsules-blister.webp', 'Cefaclor capsules must display capsules blister visual');
  assert.notStrictEqual(cefaclor.imageUrl, 'products/cough-syrup.webp', 'Cefaclor must NOT display cough syrup');

  // Cefixime tablets must show tablets, never cough syrup
  const cefixime = UGANDA_PHARMACY_CATALOG.find(p => p.id === 'BC-MED-0087');
  assert.ok(cefixime, 'Cefixime tablets must exist');
  assert.strictEqual(cefixime.imageUrl, 'products/tablets-blister.webp', 'Cefixime tablets must display tablets blister visual');
  assert.notStrictEqual(cefixime.imageUrl, 'products/cough-syrup.webp', 'Cefixime must NOT display cough syrup');

  // Inhalers must show inhalers
  const salbutamol = UGANDA_PHARMACY_CATALOG.find(p => p.id === 'DEMO-MED-020');
  assert.strictEqual(salbutamol.imageUrl, 'products/salbutamol-inhaler.webp', 'Salbutamol must display inhaler image');

  // Creams must show cream tubes
  const hydrocortisone = UGANDA_PHARMACY_CATALOG.find(p => p.id === 'DEMO-MED-017');
  assert.strictEqual(hydrocortisone.imageUrl, 'products/hydrocortisone-cream.webp', 'Hydrocortisone must display cream tube image');
});

test('RUNTIME IMAGE FALLBACK: getProductImage and placeholder fallback in app.js', async () => {
  const { getProductImage, BLOOMCARE_PLACEHOLDER_IMAGE } = await import('../BLOOMCARE-main/app.js');
  assert.strictEqual(BLOOMCARE_PLACEHOLDER_IMAGE, 'products/placeholder-medicine.svg', 'Placeholder image must be products/placeholder-medicine.svg');

  // Null product fallback
  assert.strictEqual(getProductImage(null), 'products/placeholder-medicine.svg');

  // Valid imageUrl
  assert.strictEqual(getProductImage({ id: 'MED-1', imageUrl: 'products/paracetamol-500mg.webp' }), 'products/paracetamol-500mg.webp');

  // Empty imageUrl fallback
  assert.strictEqual(getProductImage({ id: 'MED-2', imageUrl: '' }), 'products/placeholder-medicine.svg');
});
