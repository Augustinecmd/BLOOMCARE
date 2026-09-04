import json
import re

with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

catalog = json.loads(text[start_idx + len(start_str):end_idx].strip())

def normalize_name(name):
    n = name.lower()
    # remove parenthetical details like (Pack of 20), (50s), (Clinic Size), etc.
    n = re.sub(r'\(.*?\)', '', n)
    # remove pack size words at the end like 100ml, 50g, 20g, 15g, 500ml, 250ml
    n = re.sub(r'\b\d+(\.\d+)?\s*(ml|g|kg|l|oz|sachets?|capsules?|tablets?|vials?|amps?|doses?|strips?)\b', '', n)
    n = re.sub(r'\s+(jumbo|economy|clinic|family|mini|pack|bottle|tube|box)\b', '', n)
    n = re.sub(r'[^\w\d]', ' ', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def extract_strength(item):
    s = item.get('strength', '') or item.get('name', '')
    # Match strengths like 500mg, 10mg, 120mg/5ml, 0.1%, 100mcg
    m = re.search(r'\b\d+(\.\d+)?\s*(mg(?:\s*/\s*\d*\s*ml)?|mcg|g|%|iu|u)\b', s.lower())
    return m.group(0).replace(' ', '') if m else ''

def extract_form(item):
    f = (item.get('dosageForm', '') + ' ' + item.get('name', '')).lower()
    if 'tablet' in f or 'caplet' in f: return 'tablet'
    if 'capsule' in f: return 'capsule'
    if 'syrup' in f or 'suspension' in f or 'liquid' in f or 'solution' in f or 'elixir' in f or 'drops' in f: return 'liquid'
    if 'cream' in f: return 'cream'
    if 'ointment' in f: return 'ointment'
    if 'gel' in f: return 'gel'
    if 'inhal' in f or 'evohaler' in f or 'turbuhaler' in f: return 'inhaler'
    if 'suppository' in f: return 'suppository'
    if 'infusion' in f or 'injection' in f: return 'injectable'
    if 'bandage' in f or 'gauze' in f or 'tape' in f: return 'dressing'
    if 'monitor' in f or 'thermometer' in f or 'oximeter' in f or 'meter' in f: return 'device'
    return 'other'

def get_dedup_key(item):
    # Active compound
    active = clean_active(item.get('activeIngredients') or item.get('genericName') or item.get('name'))
    strn = extract_strength(item)
    form = extract_form(item)
    return f"{active}___{strn}___{form}"

def clean_active(a):
    a = a.lower()
    a = re.sub(r'\(.*?\)', '', a)
    a = re.sub(r'\b\d+(\.\d+)?\s*(mg|mcg|g|ml|%|iu)\b', '', a)
    a = re.sub(r'[^\w\d]', ' ', a)
    words = [w for w in a.split() if w not in {'hydrochloride', 'sodium', 'potassium', 'sulfate', 'sulphate', 'trihydrate', 'besylate', 'maleate', 'dihydrate', 'valerate', 'propionate', 'fumarate', 'monohydrate', 'phosphate', 'acetate', 'tablets', 'tablet', 'capsules', 'capsule', 'syrup', 'suspension', 'cream', 'ointment', 'pack', 'bottle'}]
    return ' '.join(sorted(words[:3]))

groups = {}
for item in catalog:
    key = get_dedup_key(item)
    groups.setdefault(key, []).append(item)

duplicates = {k: v for k, v in groups.items() if len(v) > 1}
print(f"Deduplication Analysis:")
print(f"Total products in catalog: {len(catalog)}")
print(f"Total duplicate groups: {len(duplicates)}")
total_dups = sum(len(v) - 1 for v in duplicates.values())
print(f"Total redundant items to merge/remove: {total_dups}")
print(f"Expected unique products after cleanup: {len(catalog) - total_dups}")

print("\n--- Listing All Duplicate Groups ---")
for k, items in sorted(duplicates.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"\nGroup [{k}] ({len(items)} items):")
    for it in items:
        print(f"  * {it['id']} [{it['category']}]: '{it['name']}' (Generic: {it.get('genericName')}, Mfr: {it.get('manufacturer')}, Form: {it.get('dosageForm')})")
