import json
import re

with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

catalog = json.loads(text[start_idx + len(start_str):end_idx].strip())

cats = [
    "Pain Relief", "Cold & Flu", "Vitamins & Supplements", "Digestive Health",
    "First Aid", "Skin Care", "Personal Care", "Baby & Child Care",
    "Maternal Health", "Chronic Care", "Diabetes Care", "Respiratory Care",
    "Allergy Care", "Medical Devices", "Wellness Products"
]

for c in cats:
    items = [x for x in catalog if x['category'] == c]
    print(f"\n=======================================================")
    print(f"CATEGORY: {c} ({len(items)} items)")
    print(f"=======================================================")
    for idx, it in enumerate(items, 1):
        print(f"{idx:2d}. [{it['id']}] {it['name']} | Gen: {it.get('genericName', '')} | Str: {it.get('strength', '')} | Form: {it.get('dosageForm', '')}")
