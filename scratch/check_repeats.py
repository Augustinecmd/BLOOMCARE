import json
import re

with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

catalog = json.loads(text[start_idx + len(start_str):end_idx].strip())

paras = [p for p in catalog if 'paracetamol' in (p.get('name', '') + ' ' + p.get('genericName', '')).lower()]
print(f"Total Paracetamol records across catalog: {len(paras)}")
for p in paras:
    print(f"  [{p['category']}] {p['id']}: {p['name']} | Gen: {p['genericName']} | Str: {p['strength']} | Form: {p['dosageForm']} | Mfr: {p['manufacturer']}")

print("\n--- Amoxicillin records across catalog ---")
amox = [p for p in catalog if 'amoxicillin' in (p.get('name', '') + ' ' + p.get('genericName', '')).lower()]
print(f"Total Amoxicillin records across catalog: {len(amox)}")
for p in amox:
    print(f"  [{p['category']}] {p['id']}: {p['name']} | Gen: {p['genericName']} | Str: {p['strength']} | Form: {p['dosageForm']} | Mfr: {p['manufacturer']}")

print("\n--- Ibuprofen records across catalog ---")
ibup = [p for p in catalog if 'ibuprofen' in (p.get('name', '') + ' ' + p.get('genericName', '')).lower()]
print(f"Total Ibuprofen records across catalog: {len(ibup)}")
for p in ibup:
    print(f"  [{p['category']}] {p['id']}: {p['name']} | Gen: {p['genericName']} | Str: {p['strength']} | Form: {p['dosageForm']} | Mfr: {p['manufacturer']}")
