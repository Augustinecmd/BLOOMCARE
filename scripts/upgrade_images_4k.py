"""BloomCare Pharmacy - 4K Ultra-HD Image Enhancement Script.

Upscales and enhances core storefront, brand, pharmacist, and product images
to 4K Ultra-HD resolution using high-fidelity Lanczos resampling and
unsharp-mask edge/contrast enhancement.
"""
from __future__ import annotations

import os
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
BLOOMCARE_DIR = WORKSPACE_ROOT / "BLOOMCARE-main"
PRODUCTS_DIR = BLOOMCARE_DIR / "products"

# Key image 4K resolution targets (width, height)
TARGET_SPECS = {
    # 16:9 and wide banners -> 3840px 4K width
    "pharmacy-hero.jpg": (3840, 2144),
    "pharmacy-cold-chain.jpg": (3840, 2144),
    "pharmacy-medicines.jpg": (3840, 2867),
    # Logos -> 3840px crisp width
    "bloomcare-logo.png": (3840, 2344),
    "bloomcare-logo-dark.png": (3840, 2344),
    # Hero media and paper bag -> 4K Ultra-HD (~2160px)
    "bloomcare-customer-hero.png": (2188, 2084),
    "bloomcare-paper-bag.jpg": (2048, 2158),
    # Pharmacist clinical profiles -> 4K Ultra-HD (~2160px)
    "pharmacist-amina.jpg": (2560, 1911),
    "pharmacist-david.jpg": (2160, 2160),
    "pharmacist-sarah.jpg": (2160, 2160),
}


def process_image(src_path: Path, target_w: int, target_h: int) -> None:
    if not src_path.exists():
        print(f"Skipping missing: {src_path.name}")
        return

    with Image.open(src_path) as im:
        orig_w, orig_h = im.size
        orig_format = im.format or ("PNG" if src_path.suffix.lower() == ".png" else "JPEG")
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)

        print(f"Processing {src_path.name}: {orig_w}x{orig_h} -> {target_w}x{target_h} ({orig_format})")

        # Lanczos high-quality resampling
        resampling_filter = getattr(Image, "Resampling", Image).LANCZOS
        resized = im.resize((target_w, target_h), resample=resampling_filter)

        # Subtle unsharp masking to enhance crisp edges on 4K displays
        if has_alpha:
            # Preserve alpha channel during sharpening
            r, g, b, a = resized.split()
            rgb = Image.merge("RGB", (r, g, b))
            sharp_rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.6, percent=120, threshold=2))
            sr, sg, sb = sharp_rgb.split()
            final_img = Image.merge("RGBA", (sr, sg, sb, a))
            final_img.save(src_path, format="PNG", optimize=True)
        else:
            # RGB JPEG processing
            rgb = resized.convert("RGB")
            sharp_rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.6, percent=120, threshold=2))
            # Subtle contrast enhancement (+4%) for rich pharmacy branding
            enhancer = ImageEnhance.Contrast(sharp_rgb)
            final_img = enhancer.enhance(1.04)
            final_img.save(src_path, format="JPEG", quality=92, optimize=True)


def process_products() -> None:
    if not PRODUCTS_DIR.exists():
        return

    resampling_filter = getattr(Image, "Resampling", Image).LANCZOS

    for file in sorted(PRODUCTS_DIR.iterdir()):
        if file.suffix.lower() in (".jpg", ".jpeg"):
            try:
                with Image.open(file) as im:
                    w, h = im.size
                    if w < 1600 or h < 1600:
                        scale = max(1600 / w, 1600 / h)
                        target_w = int(round(w * scale))
                        target_h = int(round(h * scale))
                        print(f"Upscaling product {file.name}: {w}x{h} -> {target_w}x{target_h}")
                        resized = im.resize((target_w, target_h), resample=resampling_filter).convert("RGB")
                        sharp = resized.filter(ImageFilter.UnsharpMask(radius=1.4, percent=115, threshold=3))
                        sharp.save(file, format="JPEG", quality=90, optimize=True)

                        # Also sync matching webp if present
                        webp_file = file.with_suffix(".webp")
                        if webp_file.exists():
                            sharp.save(webp_file, format="WEBP", quality=90)
            except Exception as e:
                print(f"Error processing product {file.name}: {e}")


def main() -> None:
    print("=== Upgrading BloomCare Images to 4K Ultra-HD ===")

    for name, (tw, th) in TARGET_SPECS.items():
        src = BLOOMCARE_DIR / name
        process_image(src, tw, th)

    print("\n=== Upgrading Product Catalog Images ===")
    process_products()

    print("\n4K Image Upgrade Complete!")


if __name__ == "__main__":
    main()

