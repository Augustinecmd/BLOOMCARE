import json
import re

with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

catalog = json.loads(text[start_idx + len(start_str):end_idx].strip())

print(f"Total starting products: {len(catalog)}")

# Look for duplicates across categories:
# normalized active ingredient + normalized strength + normalized form
def norm(s):
    if not s: return ""
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\d]', ' ', s.lower())).strip()

# Check cross-category overlap
cross_cat = {}
for item in catalog:
    # Key for clinical product
    # E.g. genericName or activeIngredients + strength + dosageForm
    # Also clean generic name from brand
    gen = norm(item.get('genericName', ''))
    act = norm(item.get('activeIngredients', ''))
    st = norm(item.get('strength', ''))
    # Clean strength of packaging (e.g. 100ml, 50g)
    st_pure = re.findall(r'\d+(?:\.\d+)?\s*(?:mg|mcg|g|%|iu|u)', st)
    st_pure_str = ''.join(st_pure) if st_pure else st
    
    # Form type
    f = norm(item.get('dosageForm', ''))
    f_type = 'tab' if 'tab' in f else ('cap' if 'cap' in f else ('syr' if 'syr' in f or 'susp' in f or 'drop' in f or 'liquid' in f else ('crm' if 'cream' in f or 'oint' in f or 'gel' in f else ('inh' if 'inhal' in f else ('supp' if 'supp' in f else f)))))
    
    key = f"{gen or act}____{st_pure_str}____{f_type}"
    cross_cat.setdefault(key, []).append(item)

exact_dups = {k: v for k, v in cross_cat.items() if len(v) > 1}
print(f"Total clinical duplicates (including cross-category): {len(exact_dups)}")
for k, v in sorted(exact_dups.items(), key=lambda x: len(x[1]), reverse=True):
    cats = set(x['category'] for x in v)
    print(f"\nKey: {k} (Categories: {cats})")
    for it in v:
        print(f"   [{it['category']}] {it['id']}: {it['name']} ({it['dosageForm']}, Mfr: {it['manufacturer']})")
