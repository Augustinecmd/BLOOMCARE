import os
import shutil
import base64
from PIL import Image

src_img_path = r"C:\Users\USER\.gemini\antigravity\brain\c78c151e-8c4f-4305-8350-f2c74731f1be\.user_uploaded\media_1789307127553.png"

dest_dirs = [
    r"c:\Users\USER\OneDrive\Desktop\ccna",
    r"c:\Users\USER\OneDrive\Desktop\ccna\BLOOMCARE-main",
    r"c:\Users\USER\OneDrive\Desktop\ccna\BLOOMCARE-main\dist",
    r"c:\Users\USER\OneDrive\Desktop\ccna\dist"
]

if not os.path.exists(src_img_path):
    raise FileNotFoundError(f"Source logo not found: {src_img_path}")

img = Image.open(src_img_path)
width, height = img.size
print(f"Loaded official BloomCare logo: {width}x{height}, mode={img.mode}")

# Create base64 of exact logo for SVG wrapping
with open(src_img_path, "rb") as f:
    b64_png = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_png}" width="{width}" height="{height}"/>
</svg>'''

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)
    # 1. Exact uploaded logo as bloomcare-logo.png
    dest_png = os.path.join(d, "bloomcare-logo.png")
    shutil.copy2(src_img_path, dest_png)
    
    # 2. Also save bloomcare-logo-dark.png (for backwards compatibility)
    shutil.copy2(src_img_path, os.path.join(d, "bloomcare-logo-dark.png"))
    
    # 3. Save SVG wrapper
    with open(os.path.join(d, "bloomcare-logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
        
    # 4. Generate favicon.ico
    favicon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    ico_img = img.copy().convert("RGBA")
    ico_img.save(os.path.join(d, "favicon.ico"), format="ICO", sizes=favicon_sizes)
    
    print(f"Deployed logo assets to: {d}")

print("Logo deployment complete!")

