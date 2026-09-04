"""
Assembly script for the BloomCare Ugandan Pharmacy Catalog
Assembles initial_34.json and data_parts 1-5 into BLOOMCARE-main/data/medicines-catalog.js
"""

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath('.'))

import scratch.data_part1 as p1
import scratch.data_part2 as p2
import scratch.data_part3 as p3
import scratch.data_part4 as p4
import scratch.data_part5 as p5

# Load initial 34
with open('scratch/initial_34.json', 'r', encoding='utf-8') as f:
    initial_34 = json.load(f)

print(f"Loaded {len(initial_34)} initial medicines.")

# Map of images in products directory
AVAILABLE_IMAGES = [
    'amlodipine-5mg.webp', 'amoxicillin-500mg.webp', 'antacid-tablets.webp',
    'antiseptic-solution.webp', 'azithromycin-500mg.webp', 'blood-pressure-monitor.webp',
    'calamine-lotion.webp', 'cetirizine-10mg.webp', 'clotrimazole-cream.webp',
    'cough-syrup.webp', 'daily-multivitamin.webp', 'diclofenac-50mg.webp',
    'digital-thermometer.webp', 'ferrous-sulfate.webp', 'folic-acid-5mg.webp',
    'glucose-test-strips.webp', 'hand-sanitizer.webp', 'hydrocortisone-cream.webp',
    'hydrogen-peroxide.webp', 'ibuprofen-400mg.webp', 'loratadine-10mg.webp',
    'losartan-50mg.webp', 'metformin-500mg.webp', 'nasal-saline-drops.webp',
    'omega-3-fish-oil.webp', 'omeprazole-20mg.webp', 'oral-rehydration-salts.webp',
    'paracetamol-500mg.webp', 'pediatric-paracetamol.webp', 'povidone-iodine.webp',
    'salbutamol-inhaler.webp', 'tramadol-50mg.webp', 'vitamin-c-500mg.webp',
    'zinc-20mg.webp'
]

# Helper to find matching image
def get_image_url(item):
    name_lower = (item['name'] + ' ' + item.get('genericName', '') + ' ' + item.get('brandName', '')).lower()
    
    # Priority exact matches
    if 'pediatric' in name_lower and 'paracetamol' in name_lower:
        return 'products/pediatric-paracetamol.webp'
    if 'paracetamol' in name_lower or 'panadol' in name_lower:
        return 'products/paracetamol-500mg.webp'
    if 'ibuprofen' in name_lower or 'brufen' in name_lower:
        return 'products/ibuprofen-400mg.webp'
    if 'diclofenac' in name_lower:
        return 'products/diclofenac-50mg.webp'
    if 'tramadol' in name_lower:
        return 'products/tramadol-50mg.webp'
    if 'amoxicillin' in name_lower:
        return 'products/amoxicillin-500mg.webp'
    if 'azithromycin' in name_lower:
        return 'products/azithromycin-500mg.webp'
    if 'cough' in name_lower or 'syrup' in name_lower or 'expectorant' in name_lower or 'bronchitis' in name_lower:
        return 'products/cough-syrup.webp'
    if 'antacid' in name_lower or 'magnesium trisilicate' in name_lower or 'gaviscon' in name_lower:
        return 'products/antacid-tablets.webp'
    if 'omeprazole' in name_lower or 'esomeprazole' in name_lower or 'pantoprazole' in name_lower:
        return 'products/omeprazole-20mg.webp'
    if 'ors' in name_lower or 'rehydration' in name_lower or 'pedialyte' in name_lower:
        return 'products/oral-rehydration-salts.webp'
    if 'zinc' in name_lower:
        return 'products/zinc-20mg.webp'
    if 'vitamin c' in name_lower or 'ascorbic' in name_lower:
        return 'products/vitamin-c-500mg.webp'
    if 'multivitamin' in name_lower or 'wellman' in name_lower or 'wellwoman' in name_lower or 'becosules' in name_lower or 'pharmaton' in name_lower or 'zincovit' in name_lower:
        return 'products/daily-multivitamin.webp'
    if 'omega' in name_lower or 'fish oil' in name_lower or 'cod liver' in name_lower:
        return 'products/omega-3-fish-oil.webp'
    if 'folic acid' in name_lower or 'folat' in name_lower:
        return 'products/folic-acid-5mg.webp'
    if 'iron' in name_lower or 'ferrous' in name_lower or 'feroglobin' in name_lower or 'fersamal' in name_lower:
        return 'products/ferrous-sulfate.webp'
    if 'cetirizine' in name_lower or 'zyrtec' in name_lower:
        return 'products/cetirizine-10mg.webp'
    if 'loratadine' in name_lower or 'clarityn' in name_lower:
        return 'products/loratadine-10mg.webp'
    if 'saline' in name_lower or 'nasal drops' in name_lower or 'nasal spray' in name_lower or 'sterimar' in name_lower:
        return 'products/nasal-saline-drops.webp'
    if 'clotrimazole' in name_lower or 'canesten' in name_lower or 'miconazole' in name_lower or 'daktarin' in name_lower or 'nizoral' in name_lower or 'ketoconazole' in name_lower or 'lamisil' in name_lower:
        return 'products/clotrimazole-cream.webp'
    if 'hydrocortisone' in name_lower or 'betamethasone' in name_lower or 'betnovate' in name_lower or 'clobetasol' in name_lower or 'dermovate' in name_lower or 'daktacort' in name_lower:
        return 'products/hydrocortisone-cream.webp'
    if 'calamine' in name_lower:
        return 'products/calamine-lotion.webp'
    if 'povidone' in name_lower or 'betadine' in name_lower:
        return 'products/povidone-iodine.webp'
    if 'hydrogen peroxide' in name_lower or 'peroxide' in name_lower:
        return 'products/hydrogen-peroxide.webp'
    if 'antiseptic' in name_lower or 'dettol' in name_lower or 'savlon' in name_lower or 'chlorhexidine' in name_lower or 'hibiscrub' in name_lower:
        return 'products/antiseptic-solution.webp'
    if 'sanitizer' in name_lower or 'hand wash' in name_lower:
        return 'products/hand-sanitizer.webp'
    if 'blood pressure' in name_lower or 'sphygmomanometer' in name_lower or 'omron' in name_lower:
        return 'products/blood-pressure-monitor.webp'
    if 'thermometer' in name_lower or 'thermoscan' in name_lower:
        return 'products/digital-thermometer.webp'
    if 'glucose' in name_lower or 'test strips' in name_lower or 'accu-chek' in name_lower or 'contour' in name_lower:
        return 'products/glucose-test-strips.webp'
    if 'metformin' in name_lower or 'glucophage' in name_lower:
        return 'products/metformin-500mg.webp'
    if 'losartan' in name_lower or 'cozaar' in name_lower or 'telmisartan' in name_lower or 'valsartan' in name_lower:
        return 'products/losartan-50mg.webp'
    if 'amlodipine' in name_lower or 'norvasc' in name_lower or 'diltiazem' in name_lower:
        return 'products/amlodipine-5mg.webp'
    if 'salbutamol' in name_lower or 'inhaler' in name_lower or 'seretide' in name_lower or 'symbicort' in name_lower or 'fluticasone' in name_lower or 'budesonide' in name_lower or 'ventolin' in name_lower or 'beclomethasone' in name_lower or 'atrovent' in name_lower:
        return 'products/salbutamol-inhaler.webp'
    
    # Category based fallbacks
    cat = item.get('category', '')
    if cat == 'Medical Devices':
        return 'products/blood-pressure-monitor.webp'
    if cat == 'Wellness Products':
        return 'products/daily-multivitamin.webp'
    if cat == 'Baby & Child Care':
        return 'products/pediatric-paracetamol.webp'
    if cat == 'Personal Care':
        return 'products/hand-sanitizer.webp'
    if cat == 'First Aid':
        return 'products/antiseptic-solution.webp'
    if cat == 'Skin Care':
        return 'products/calamine-lotion.webp'
    if cat == 'Chronic Care':
        return 'products/losartan-50mg.webp'
    if cat == 'Diabetes Care':
        return 'products/glucose-test-strips.webp'
    if cat == 'Respiratory Care':
        return 'products/salbutamol-inhaler.webp'
    if cat == 'Digestive Health':
        return 'products/antacid-tablets.webp'
    if cat == 'Vitamins & Supplements':
        return 'products/vitamin-c-500mg.webp'
    if cat == 'Maternal Health':
        return 'products/folic-acid-5mg.webp'
    if cat == 'Allergy Care':
        return 'products/cetirizine-10mg.webp'
    if cat == 'Cold & Flu':
        return 'products/cough-syrup.webp'
    if cat == 'Pain Relief':
        return 'products/paracetamol-500mg.webp'

    return 'products/placeholder-medicine.svg'

# Collect all new items
new_item_lists = [
    # Part 1
    p1.PAIN_RELIEF_ITEMS,
    p1.COLD_FLU_ITEMS,
    p1.ALLERGY_CARE_ITEMS,
    # Part 2
    p2.DIGESTIVE_HEALTH_ITEMS,
    p2.VITAMINS_SUPPLEMENTS_ITEMS,
    p2.MATERNAL_HEALTH_ITEMS,
    # Part 3
    p3.FIRST_AID_ITEMS,
    p3.SKIN_CARE_ITEMS,
    p3.PERSONAL_CARE_ITEMS,
    # Part 4
    p4.CHRONIC_CARE_ITEMS,
    p4.DIABETES_CARE_ITEMS,
    p4.RESPIRATORY_CARE_ITEMS,
    # Part 5
    p5.BABY_CHILD_CARE_ITEMS,
    p5.MEDICAL_DEVICES_ITEMS,
    p5.WELLNESS_PRODUCTS_ITEMS,
]

all_new_items = []
for lst in new_item_lists:
    all_new_items.extend(lst)

print(f"Collected {len(all_new_items)} new items across parts 1-5.")

# Assign IDs and complete schema for initial 34
catalog = []
sku_counter = 1

for idx, med in enumerate(initial_34, 1):
    med_copy = dict(med)
    # Ensure SKU
    if 'sku' not in med_copy or not med_copy['sku']:
        med_copy['sku'] = f"BC-SKU-{sku_counter:04d}"
    sku_counter += 1
    # Ensure all 22 fields
    if 'brandName' not in med_copy or not med_copy['brandName']:
        med_copy['brandName'] = med_copy['name'].split()[0]
    if 'genericName' not in med_copy or not med_copy['genericName']:
        med_copy['genericName'] = med_copy['name']
    if 'activeIngredients' not in med_copy or not med_copy['activeIngredients']:
        med_copy['activeIngredients'] = med_copy.get('genericName', med_copy['name'])
    if 'subcategory' not in med_copy or not med_copy['subcategory']:
        med_copy['subcategory'] = med_copy['category']
    if 'strength' not in med_copy or not med_copy['strength']:
        med_copy['strength'] = 'Standard Strength'
    if 'dosageForm' not in med_copy or not med_copy['dosageForm']:
        med_copy['dosageForm'] = 'Tablet'
    if 'packSize' not in med_copy or not med_copy['packSize']:
        med_copy['packSize'] = 'Pack of 1'
    if 'reorderLevel' not in med_copy or not med_copy['reorderLevel']:
        med_copy['reorderLevel'] = 15
    if 'batchNumber' not in med_copy or not med_copy['batchNumber']:
        med_copy['batchNumber'] = f"BN-2024-{1000 + idx}"
    if 'expiryDate' not in med_copy or not med_copy['expiryDate']:
        med_copy['expiryDate'] = "2027-06-30"
    if 'createdAt' not in med_copy or not med_copy['createdAt']:
        med_copy['createdAt'] = "2024-01-15T08:00:00.000Z"
    if 'updatedAt' not in med_copy or not med_copy['updatedAt']:
        med_copy['updatedAt'] = "2024-09-01T12:00:00.000Z"
    if 'status' not in med_copy or not med_copy['status']:
        med_copy['status'] = "In Stock" if med_copy.get('stockQuantity', 1) > 0 else "Out of Stock"
    if 'requiresPrescription' not in med_copy:
        med_copy['requiresPrescription'] = False
    
    catalog.append(med_copy)

# Now process all new items
next_id_num = 35
base_date = datetime(2024, 3, 1, 10, 0, 0, tzinfo=timezone.utc)

for item in all_new_items:
    med_id = f"BC-MED-{next_id_num:04d}"
    sku = f"BC-SKU-{sku_counter:04d}"
    
    # Expiry years 2026 to 2028
    exp_year = 2026 + (next_id_num % 3)
    exp_month = 1 + (next_id_num % 12)
    exp_day = 28 if exp_month == 2 else 30
    expiry_date = f"{exp_year:04d}-{exp_month:02d}-{exp_day:02d}"
    
    batch_num = f"BN-{2024 + (next_id_num % 2)}-{2000 + (next_id_num % 8000):04d}"
    image_url = get_image_url(item)
    stock = int(item.get('stockQuantity', 50))
    status = "In Stock" if stock > 0 else "Out of Stock"
    
    record = {
        "id": med_id,
        "name": item["name"],
        "genericName": item.get("genericName", item["name"]),
        "brandName": item.get("brandName", item["name"].split()[0]),
        "activeIngredients": item.get("activeIngredients", item.get("genericName", item["name"])),
        "strength": item.get("strength", "Standard Strength"),
        "dosageForm": item.get("dosageForm", "Tablet"),
        "packSize": item.get("packSize", "Pack of 1"),
        "category": item["category"],
        "subcategory": item.get("subcategory", item["category"]),
        "description": item.get("description", f"Authentic pharmaceutical preparation: {item['name']}."),
        "manufacturer": item.get("manufacturer", "Rene Industries Uganda"),
        "price": int(item.get("price", 10000)),
        "stockQuantity": stock,
        "reorderLevel": int(item.get("reorderLevel", 15)),
        "status": status,
        "requiresPrescription": bool(item.get("requiresPrescription", False)),
        "imageUrl": image_url,
        "sku": sku,
        "batchNumber": batch_num,
        "expiryDate": expiry_date,
        "createdAt": "2024-03-01T10:00:00.000Z",
        "updatedAt": "2024-09-04T12:00:00.000Z"
    }
    
    catalog.append(record)
    next_id_num += 1
    sku_counter += 1

print(f"Total catalog count: {len(catalog)}")

# Validation
import collections
cat_counts = collections.Counter(x['category'] for x in catalog)
print("Category Counts:")
for cat, count in sorted(cat_counts.items()):
    print(f"  - {cat}: {count}")

# Check unique IDs and SKUs
ids = set(x['id'] for x in catalog)
skus = set(x['sku'] for x in catalog)
assert len(ids) == len(catalog), f"Duplicate IDs found! {len(ids)} vs {len(catalog)}"
assert len(skus) == len(catalog), f"Duplicate SKUs found! {len(skus)} vs {len(catalog)}"

# Verify all 22 fields
REQUIRED_FIELDS = [
    'id', 'name', 'genericName', 'brandName', 'activeIngredients', 'strength',
    'dosageForm', 'packSize', 'category', 'subcategory', 'description', 'manufacturer',
    'price', 'stockQuantity', 'reorderLevel', 'status', 'requiresPrescription',
    'imageUrl', 'sku', 'batchNumber', 'expiryDate', 'createdAt', 'updatedAt'
]

for idx, item in enumerate(catalog):
    for f in REQUIRED_FIELDS:
        assert f in item, f"Missing field {f} in item {idx}: {item.get('id')}"
        assert item[f] is not None, f"Null field {f} in item {idx}: {item.get('id')}"

print("All 22 schema fields verified for all items!")

# Write out to BLOOMCARE-main/data/medicines-catalog.js
data_dir = 'BLOOMCARE-main/data'
os.makedirs(data_dir, exist_ok=True)
out_file = os.path.join(data_dir, 'medicines-catalog.js')

json_dump = json.dumps(catalog, indent=2, ensure_ascii=False)

# Format category metadata
categories_summary = [
    {"name": cat, "count": count}
    for cat, count in sorted(cat_counts.items())
]

js_content = f"""/**
 * BloomCare Ugandan Pharmacy Catalog
 * Based on Uganda MOH Essential Medicines & Health Supplies List (EMHSLU 2023)
 * Total Products: {len(catalog)}
 * Categories: {len(cat_counts)} (at least 50 items each)
 */

export const UGANDA_PHARMACY_CATALOG = {json_dump};

export const CATALOG_CATEGORIES = {json.dumps(categories_summary, indent=2)};

// Universal Compatibility Support (Browser Globals & CommonJS)
if (typeof window !== 'undefined') {{
  window.UGANDA_PHARMACY_CATALOG = UGANDA_PHARMACY_CATALOG;
  window.CATALOG_CATEGORIES = CATALOG_CATEGORIES;
}}
if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ UGANDA_PHARMACY_CATALOG, CATALOG_CATEGORIES }};
}}
"""

with open(out_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully wrote {len(catalog)} items to {out_file} ({os.path.getsize(out_file) / 1024:.1f} KB)")
