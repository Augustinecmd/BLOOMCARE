import urllib.request
import urllib.parse
import json
import os
import sys
import io
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

PRODUCTS_DIR = r"c:\Users\USER\OneDrive\Desktop\ccna\BLOOMCARE-main\products"

TARGETS = [
    ("DEMO-MED-003", "diclofenac-50mg", ["diclofenac sodium 50mg", "diclofenac tablets", "diclofenac"]),
    ("DEMO-MED-026", "tramadol-50mg", ["tramadol 50mg", "tramadol capsules", "tramadol"]),
    ("DEMO-MED-005", "azithromycin-500mg", ["azithromycin 500mg", "azithromycin tablets", "azithromycin"]),
    ("DEMO-MED-022", "nasal-saline-drops", ["saline nasal spray", "saline nasal drops", "saline spray"]),
    ("DEMO-MED-007", "loratadine-10mg", ["loratadine 10mg", "loratadine tablets", "loratadine"]),
    ("DEMO-MED-009", "oral-rehydration-salts", ["Oral rehydration salts (ORS) - Packet", "Oral Rehydration Salts BP-UNICEF", "oral rehydration salts"]),
    ("DEMO-MED-010", "antacid-tablets", ["antacid chewable tablets", "antacid tablets", "tums antacid"]),
    ("DEMO-MED-012", "zinc-20mg", ["zinc sulfate tablets", "zinc supplement bottle", "zinc tablets"]),
    ("DEMO-MED-027", "daily-multivitamin", ["multivitamin tablets bottle", "daily multivitamin", "multivitamin bottle"]),
    ("DEMO-MED-013", "ferrous-sulfate", ["ferrous sulfate tablets", "iron supplement bottle", "ferrous sulfate"]),
    ("DEMO-MED-028", "folic-acid-5mg", ["folic acid tablets bottle", "folic acid tablets", "folic acid supplement"]),
    ("DEMO-MED-015", "hydrogen-peroxide", ["hydrogen peroxide bottle", "hydrogen peroxide 3%", "hydrogen peroxide"]),
    ("DEMO-MED-016", "povidone-iodine", ["povidone iodine bottle", "povidone-iodine", "betadine"]),
    ("DEMO-MED-017", "hydrocortisone-cream", ["Tube of hydrocortisone cream", "Medpride Hydrocortisone Cream1", "hydrocortisone cream"]),
    ("DEMO-MED-018", "clotrimazole-cream", ["clotrimazole cream", "clotrimazole 1%", "canesten"]),
    ("DEMO-MED-019", "calamine-lotion", ["calamine lotion bottle", "calamine lotion", "calamine"]),
    ("DEMO-MED-025", "hand-sanitizer", ["Hand sanitizer bottle", "alcohol hand sanitizer", "hand sanitizer"]),
    ("DEMO-MED-029", "amlodipine-5mg", ["amlodipine 5mg", "amlodipine tablets", "amlodipine"]),
    ("DEMO-MED-030", "losartan-50mg", ["losartan 50mg", "losartan potassium", "losartan"]),
    ("DEMO-MED-031", "metformin-500mg", ["Metformin 500mg Tablets", "Glucophage 500mg tbl", "metformin 500mg"]),
    ("DEMO-MED-032", "glucose-test-strips", ["blood glucose test strips", "glucose test strips", "accu-chek"]),
    ("DEMO-MED-034", "omega-3-fish-oil", ["omega 3 fish oil bottle", "fish oil capsules", "omega-3 capsules"])
]

def search_wikimedia(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(query)}&gsrlimit=5&prop=imageinfo&iiprop=url|mime|size"
    req = urllib.request.Request(url, headers={'User-Agent': 'BloomCareBot/1.0 (contact@bloomcare.com)'})
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            results = []
            for pid, p in pages.items():
                title = p.get('title', '')
                info = p.get('imageinfo', [{}])[0]
                mime = info.get('mime', '')
                img_url = info.get('url', '')
                size = info.get('size', 0)
                if mime in ('image/jpeg', 'image/png', 'image/webp') and size > 15000:
                    results.append((title, img_url))
            return results
    except Exception as e:
        print(f"Error querying {query}: {e}", flush=True)
        return []

def download_and_process(img_url, out_path):
    req = urllib.request.Request(img_url, headers={'User-Agent': 'BloomCareBot/1.0 (contact@bloomcare.com)'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        content = resp.read()
    
    img = Image.open(io.BytesIO(content))
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img = img.convert('RGBA')
    else:
        img = img.convert('RGB')
    
    # Target size: 600x600 clean white background
    max_dim = 540
    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGB', (600, 600), (255, 255, 255))
    x = (600 - img.width) // 2
    y = (600 - img.height) // 2
    
    if img.mode == 'RGBA':
        canvas.paste(img, (x, y), img)
    else:
        canvas.paste(img, (x, y))
    
    canvas.save(out_path, 'WEBP', quality=85, method=6)
    jpg_path = out_path.replace('.webp', '.jpg')
    canvas.save(jpg_path, 'JPEG', quality=88)
    print(f"  ✓ Saved packshot: {os.path.basename(out_path)} ({os.path.getsize(out_path)} bytes)", flush=True)

if __name__ == '__main__':
    print(f"Starting packshot search and download for {len(TARGETS)} medicines...", flush=True)
    success = 0
    for med_id, slug, queries in TARGETS:
        out_webp = os.path.join(PRODUCTS_DIR, f"{slug}.webp")
        print(f"\nProcessing {med_id} ({slug})...", flush=True)
        candidates = []
        for q in queries:
            c = search_wikimedia(q)
            if c:
                candidates = c
                break
        
        if candidates:
            title, url = candidates[0]
            print(f"  Found candidate: {title}\n  URL: {url}", flush=True)
            try:
                download_and_process(url, out_webp)
                success += 1
            except Exception as e:
                print(f"  Error processing image: {e}", flush=True)
        else:
            print(f"  No suitable image found on Wikimedia for {slug}", flush=True)
            
    print(f"\nCompleted: {success}/{len(TARGETS)} images processed.", flush=True)

