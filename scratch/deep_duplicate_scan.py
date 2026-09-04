import json
import re

with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

catalog = json.loads(text[start_idx + len(start_str):end_idx].strip())

def clean_term(t):
    if not t: return ""
    t = t.lower()
    t = re.sub(r'\(.*?\)', ' ', t)
    t = re.sub(r'[^\w\d]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def get_tokens(item):
    # Extract significant tokens from name, generic, brand, active
    s = f"{item['name']} {item.get('genericName', '')} {item.get('brandName', '')} {item.get('activeIngredients', '')} {item.get('strength', '')}"
    s = s.lower()
    # Find all words with at least 3 letters
    tokens = set(re.findall(r'[a-z0-9]{3,}', s))
    return tokens

# 1. Exact or near-identical active + strength + form across entire catalog
from collections import defaultdict
signature_map = defaultdict(list)

def get_signature(item):
    # Normalize strength: extract numbers and units
    st = item.get('strength', '')
    st_norm = ''.join(re.findall(r'\d+(?:\.\d+)?(?:mg|g|mcg|ml|%|iu|u)', st.lower()))
    
    # Generic base
    gen = item.get('genericName', '') or item.get('name', '')
    gen_words = [w for w in re.findall(r'[a-z]{3,}', gen.lower()) if w not in {'tablets', 'tablet', 'capsules', 'capsule', 'syrup', 'suspension', 'drops', 'oral', 'cream', 'ointment', 'solution', 'pack', 'bottle', 'box'}]
    gen_base = ' '.join(sorted(gen_words[:3]))
    
    # Form base
    form = item.get('dosageForm', '')
    form_type = 'tab' if 'tab' in form.lower() else ('cap' if 'cap' in form.lower() else ('syr' if 'syr' in form.lower() or 'susp' in form.lower() else ('crm' if 'cream' in form.lower() or 'oint' in form.lower() else ('inh' if 'inhal' in form.lower() else ('drop' if 'drop' in form.lower() else form.lower()[:5])))))
    
    return f"{gen_base}___{st_norm}___{form_type}"

for it in catalog:
    sig = get_signature(it)
    signature_map[sig].append(it)

dup_sigs = {k: v for k, v in signature_map.items() if len(v) > 1 and k != '___'}

print(f"Total potential duplicate clinical signatures: {len(dup_sigs)}")
print(f"Total items involved in these signatures: {sum(len(v) for v in dup_sigs.values())}")

print("\n--- Detailed Duplicates Found ---")
for sig, items in sorted(dup_sigs.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"\nSignature: {sig} ({len(items)} items)")
    for x in items:
        print(f"   [{x['category']}] {x['id']}: {x['name']} (Str: {x.get('strength')} | Form: {x.get('dosageForm')} | Mfr: {x.get('manufacturer')})")
