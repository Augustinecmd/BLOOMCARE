import json
import re

with open('scratch/analyze_duplicates.py', 'r', encoding='utf-8') as f:
    pass

# Read medicines-catalog.js
with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

json_str = text[start_idx + len(start_str):end_idx].strip()
catalog = json.loads(json_str)

# Let's inspect by category
by_cat = {}
for p in catalog:
    by_cat.setdefault(p['category'], []).append(p)

for cat, items in by_cat.items():
    print(f"\n=== CATEGORY: {cat} (Total {len(items)}) ===")
    # Extract base molecule name (e.g. Paracetamol, Ibuprofen, Diclofenac, etc.)
    # Show active ingredient / generic name frequencies
    gen_counts = {}
    for it in items:
        # Normalize generic name
        g = it.get('genericName', '').split('+')[0].strip()
        g_base = re.sub(r'\s*\d+.*$', '', g).strip()
        gen_counts[g_base] = gen_counts.get(g_base, 0) + 1
    
    repeated = {k: v for k, v in gen_counts.items() if v > 1}
    print(f"Repeated generic base compounds: {len(repeated)}")
    for k, v in sorted(repeated.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - '{k}': {v} records")
        # print the names of those records
        names = [x['name'] for x in items if k.lower() in (x.get('genericName') or '').lower()]
        for n in names[:5]:
            print(f"      * {n}")
