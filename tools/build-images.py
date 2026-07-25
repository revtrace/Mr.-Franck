#!/usr/bin/env python3
"""
build-images.py

Turns full-size photographs into the web-ready images the site expects:
each slot gets a WebP (primary) and a JPEG (fallback), cropped to the aspect
ratio the CSS lays out, and compressed.

Usage:
    pip install Pillow
    python3 tools/build-images.py <source-dir>

Source files are matched to slots by filename prefix — so name them after the
slot: franck-portrait.jpg, vehicle.jpg, hero-riviera.jpg, dest-monaco.jpg, etc.
Anything unmatched is listed and skipped, nothing is overwritten silently.

Focal point: crops are centred by default. Portraits use "top" so heads are
not cropped off. Override per slot in SLOTS below if a particular photo needs it.
"""

import os
import sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")

# slot name -> (width, height, focal)
# focal: "center" | "top" | "bottom"
SLOTS = {
    "hero-riviera":     (1920, 1080, "center"),
    "franck-portrait":  (1000, 1250, "top"),
    "vehicle":          (1000, 1250, "center"),
    "dest-monaco":      (900, 900, "center"),
    "dest-cannes":      (900, 900, "center"),
    "dest-saint-tropez": (900, 900, "center"),
    "dest-villefranche": (900, 900, "center"),
    "dest-eze":         (900, 900, "center"),
    "dest-provence":    (900, 900, "center"),
    "dest-italy":       (900, 900, "center"),
    "dest-antibes":     (900, 900, "center"),
    "dest-saint-paul":  (900, 900, "center"),
}

WEBP_QUALITY = 82
JPEG_QUALITY = 84


def focal_box(focal):
    """Pillow centring tuple: (x, y) each 0..1."""
    return {"center": (0.5, 0.5), "top": (0.5, 0.2), "bottom": (0.5, 0.8)}[focal]


def process(src_path, slot):
    width, height, focal = SLOTS[slot]
    with Image.open(src_path) as im:
        # Honour EXIF orientation — phone photos are routinely rotated.
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        fitted = ImageOps.fit(
            im, (width, height), method=Image.LANCZOS, centering=focal_box(focal)
        )

        webp = os.path.join(OUT, slot + ".webp")
        jpg = os.path.join(OUT, slot + ".jpg")
        fitted.save(webp, "WEBP", quality=WEBP_QUALITY, method=6)
        fitted.save(jpg, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)

    kb = lambda p: os.path.getsize(p) // 1024
    print(f"  ✓ {slot:20s} {width}x{height}  webp {kb(webp)}KB  jpg {kb(jpg)}KB")
    return slot


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 tools/build-images.py <source-dir>")
    src_dir = sys.argv[1]
    if not os.path.isdir(src_dir):
        sys.exit(f"not a directory: {src_dir}")

    os.makedirs(OUT, exist_ok=True)
    done, skipped = [], []

    for name in sorted(os.listdir(src_dir)):
        path = os.path.join(src_dir, name)
        if not os.path.isfile(path):
            continue
        stem = os.path.splitext(name)[0].lower()
        if stem in SLOTS:
            done.append(process(path, stem))
        else:
            skipped.append(name)

    print(f"\n{len(done)} image(s) built into assets/img/")
    if skipped:
        print("\nSkipped — filename did not match a slot:")
        for s in skipped:
            print("  ·", s)
        print("\nValid slot names:")
        for s in SLOTS:
            print("  ·", s)

    missing = [s for s in SLOTS if s not in done]
    if missing:
        print("\nStill using placeholder artwork (no photo supplied):")
        for m in missing:
            print("  ·", m)


if __name__ == "__main__":
    main()
