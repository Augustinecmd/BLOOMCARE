import json
import re

# Read medicines-catalog.js
with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract JSON array
start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

json_str = text[start_idx + len(start_str):end_idx].strip()
catalog = json.loads(json_str)

print(f"Total items in catalog: {len(catalog)}")

def normalize_text(s):
    if not s:
        return ""
    s = s.lower()
    # Remove dosage/packaging punctuation, normalize spacing
    s = re.sub(r'[^\w\d]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def get_name_key(item):
    return normalize_text(item.get('name', ''))

def get_clinical_key(item):
    # Match on active ingredient/generic + strength + form
    gen = normalize_text(item.get('genericName') or item.get('name') or '')
    act = normalize_text(item.get('activeIngredients') or gen)
    st = normalize_text(item.get('strength') or '')
    form = normalize_text(item.get('dosageForm') or '')
    return f"{act}____{st}____{form}"

# Group by normalized name
by_name = {}
for p in catalog:
    nk = get_name_key(p)
    by_name.setdefault(nk, []).append(p)

dup_names = {k: v for k, v in by_name.items() if len(v) > 1}
print(f"\nGroups with duplicate normalized names: {len(dup_names)}")

total_extra_by_name = sum(len(v) - 1 for v in dup_names.values())
print(f"Total redundant records by name: {total_extra_by_name}")

print("\n--- Duplicate Name Samples (first 25) ---")
for k, v in list(dup_names.items())[:25]:
    cats = [f"{x['id']} ({x['category']})" for x in v]
    print(f"Name '{k}': {len(v)} copies -> {', '.join(cats)}")

# Also check by clinical key
by_clinical = {}
for p in catalog:
    ck = get_clinical_key(p)
    by_clinical.setdefault(ck, []).append(p)

dup_clinical = {k: v for k, v in by_clinical.items() if len(v) > 1}
print(f"\nGroups with duplicate clinical key (active+strength+form): {len(dup_clinical)}")
total_extra_by_clinical = sum(len(v) - 1 for v in dup_clinical.values())
print(f"Total redundant records by clinical key: {total_extra_by_clinical}")
