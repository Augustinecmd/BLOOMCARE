import json

with open('BLOOMCARE-main/data/medicines-catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = 'export const UGANDA_PHARMACY_CATALOG = '
start_idx = text.find(start_str)
end_str = ';\n\nexport const CATALOG_CATEGORIES'
end_idx = text.find(end_str)

catalog = json.loads(text[start_idx + len(start_str):end_idx].strip())

with open('scratch/catalog_utf8.txt', 'w', encoding='utf-8') as out:
    for cat in [
        "Pain Relief", "Cold & Flu", "Vitamins & Supplements", "Digestive Health",
        "First Aid", "Skin Care", "Personal Care", "Baby & Child Care",
        "Maternal Health", "Chronic Care", "Diabetes Care", "Respiratory Care",
        "Allergy Care", "Medical Devices", "Wellness Products"
    ]:
        items = [x for x in catalog if x['category'] == cat]
        out.write(f"\n========================================\n")
        out.write(f"CATEGORY: {cat} ({len(items)} items)\n")
        out.write(f"========================================\n")
        for idx, it in enumerate(items, 1):
            out.write(f"{idx:2d}. [{it['id']}] {it['name']} | Gen: {it.get('genericName', '')} | Str: {it.get('strength', '')} | Form: {it.get('dosageForm', '')}\n")

print("Wrote scratch/catalog_utf8.txt in utf-8")
