import os
import shutil
import base64
from PIL import Image
import numpy as np

src_img_path = r"C:\Users\USER\.gemini\antigravity\brain\c78c151e-8c4f-4305-8350-f2c74731f1be\.user_uploaded\media_1788203564708.png"

dest_dirs = [
    r"c:\Users\USER\OneDrive\Desktop\ccna",
    r"c:\Users\USER\OneDrive\Desktop\ccna\BLOOMCARE-main",
    r"c:\Users\USER\OneDrive\Desktop\ccna\BLOOMCARE-main\dist"
]

# Open image
img = Image.open(src_img_path).convert("RGBA")

# 1. Clean transparent version
arr = np.array(img, dtype=np.float32)
r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
brightness = np.maximum(np.maximum(r, g), b)
# Smooth alpha curve for black background
alpha = np.clip((brightness - 6) / 28.0 * 255.0, 0, 255)
arr[:,:,3] = np.minimum(a, alpha)
transparent_img = Image.fromarray(np.uint8(arr))

# Also read base64 of transparent PNG for SVG embedding
import io
buf = io.BytesIO()
transparent_img.save(buf, format="PNG")
b64_png = base64.b64encode(buf.getvalue()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {img.width} {img.height}" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_png}" width="{img.width}" height="{img.height}"/>
</svg>'''

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)
    # Save transparent PNG
    transparent_img.save(os.path.join(d, "bloomcare-logo.png"))
    # Save original PNG
    img.save(os.path.join(d, "bloomcare-logo-dark.png"))
    # Overwrite SVG so any legacy .svg reference shows the new logo seamlessly
    with open(os.path.join(d, "bloomcare-logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Updated logo assets in {d}")

print("All logo assets generated and replaced successfully!")

