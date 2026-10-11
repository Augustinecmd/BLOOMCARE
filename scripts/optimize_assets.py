import os
from PIL import Image

def optimize_image(filepath, max_dim=None, quality=82):
    if not os.path.exists(filepath):
        return
    orig_size = os.path.getsize(filepath)
    ext = os.path.splitext(filepath)[1].lower()
    
    try:
        with Image.open(filepath) as im:
            # Generate WebP sibling
            webp_path = os.path.splitext(filepath)[0] + ".webp"
            if ext in ('.png', '.jpg', '.jpeg'):
                im_webp = im.copy()
                if max_dim:
                    im_webp.thumbnail(max_dim, Image.Resampling.LANCZOS)
                im_webp.save(webp_path, format="WEBP", quality=quality, method=6)
                print(f"[WebP] {os.path.basename(webp_path)}: {os.path.getsize(webp_path):,} bytes")
            
            # Now optimize original in-place
            im_orig = im.copy()
            if max_dim:
                im_orig.thumbnail(max_dim, Image.Resampling.LANCZOS)
            
            tmp_path = filepath + ".tmp"
            if ext == '.png':
                im_orig.save(tmp_path, format="PNG", optimize=True)
            elif ext in ('.jpg', '.jpeg'):
                # Convert RGBA to RGB if needed
                if im_orig.mode in ('RGBA', 'LA'):
                    im_orig = im_orig.convert('RGB')
                im_orig.save(tmp_path, format="JPEG", quality=quality, optimize=True)
            
            if os.path.exists(tmp_path):
                new_size = os.path.getsize(tmp_path)
                if new_size < orig_size:
                    os.replace(tmp_path, filepath)
                    print(f"[Optimized] {os.path.basename(filepath)}: {orig_size:,} -> {new_size:,} (saved {orig_size - new_size:,} bytes)")
                else:
                    os.remove(tmp_path)
                    print(f"[Retained] {os.path.basename(filepath)}: {orig_size:,} bytes (already optimal)")
    except Exception as e:
        print(f"[Error] Failed to optimize {filepath}: {e}")

targets = [
    # Main branding and heroes in BLOOMCARE-main
    ("BLOOMCARE-main/bloomcare-customer-hero.png", (1400, 1400), 82),
    ("BLOOMCARE-main/bloomcare-logo.png", (800, 800), 85),
    ("BLOOMCARE-main/bloomcare-logo-dark.png", (800, 800), 85),
    ("BLOOMCARE-main/pharmacy-cold-chain.jpg", (1200, 1200), 82),
    ("BLOOMCARE-main/pharmacy-hero.jpg", (1200, 1200), 82),
    ("BLOOMCARE-main/pharmacy-medicines.jpg", (1200, 1200), 82),
    ("BLOOMCARE-main/pharmacist-amina.jpg", (600, 600), 82),
    ("BLOOMCARE-main/pharmacist-david.jpg", (600, 600), 82),
    ("BLOOMCARE-main/pharmacist-sarah.jpg", (600, 600), 82),
    ("BLOOMCARE-main/bloomcare-paper-bag.jpg", (800, 800), 82),

    # Main branding and heroes in root
    ("bloomcare-customer-hero.png", (1400, 1400), 82),
    ("bloomcare-logo.png", (800, 800), 85),
    ("bloomcare-logo-dark.png", (800, 800), 85),
    ("pharmacy-cold-chain.jpg", (1200, 1200), 82),
    ("pharmacy-hero.jpg", (1200, 1200), 82),
    ("pharmacy-medicines.jpg", (1200, 1200), 82),
    ("pharmacist-amina.jpg", (600, 600), 82),
    ("pharmacist-david.jpg", (600, 600), 82),
    ("pharmacist-sarah.jpg", (600, 600), 82),
    ("bloomcare-paper-bag.jpg", (800, 800), 82),
]

for path, max_dim, q in targets:
    optimize_image(path, max_dim, q)

# Optimize product images in products/ directories
for prod_dir in ["BLOOMCARE-main/products", "products"]:
    if os.path.exists(prod_dir):
        for fname in os.listdir(prod_dir):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                fpath = os.path.join(prod_dir, fname)
                optimize_image(fpath, (600, 600), 82)

print("\nAsset optimization completed!")

