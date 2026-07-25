#!/usr/bin/env python3
"""
build-og-image.py

Generates assets/img/og-image.jpg — the 1200x630 preview card used by
WhatsApp, Facebook, LinkedIn, iMessage and X.

Why a JPEG and not the site's SVG artwork: none of those platforms render
SVG previews. An SVG og:image means the link shares with no image at all,
which matters here because WhatsApp is the primary booking channel.

Re-run after changing the wordmark or strapline:
    pip install Pillow
    python3 tools/build-og-image.py
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "og-image.jpg")

FONTS = "/mnt/skills/examples/canvas-design/canvas-fonts"
SERIF = os.path.join(FONTS, "LibreBaskerville-Regular.ttf")
SANS = os.path.join(FONTS, "Inter-Regular.ttf")
SANS_BOLD = os.path.join(FONTS, "Inter-Bold.ttf")

W, H = 1200, 630

INK = (13, 21, 29)
BRASS = (193, 153, 79)
BRASS_LT = (221, 189, 125)
PAPER = (247, 242, 233)


def font(path, size, fallback_size=None):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(
            "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
            fallback_size or size,
        )


def ridge(draw, seed, base_y, amp, colour, points=13):
    rnd = random.Random(seed)
    step = W / (points - 1)
    pts = []
    for i in range(points):
        env = math.sin((i / (points - 1)) * math.pi) ** 0.7
        pts.append((i * step, base_y - rnd.random() * amp * env))
    poly = [(0, H)] + pts + [(W, H)]
    draw.polygon(poly, fill=colour)


def main():
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)

    # Sky gradient
    for y in range(H):
        t = y / H
        r = int(13 + (58 - 13) * t ** 1.4)
        g = int(21 + (76 - 21) * t ** 1.4)
        b = int(29 + (86 - 29) * t ** 1.4)
        d.line([(0, y), (W, y)], fill=(r, g, b))

    # Warm glow low-right, like the site hero
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W * 0.55, H * 0.28, W * 1.05, H * 0.95], fill=(120, 92, 48))
    glow = glow.filter(ImageFilter.GaussianBlur(110))
    im = Image.blend(im, Image.blend(im, glow, 0.0), 0.0)
    im = Image.composite(
        Image.blend(im, glow, 0.55), im, Image.new("L", (W, H), 200)
    )
    d = ImageDraw.Draw(im)

    # Headlands
    ridge(d, 11, H * 0.80, 90, (18, 34, 47))
    ridge(d, 27, H * 0.90, 110, (11, 22, 32))
    ridge(d, 41, H * 1.02, 120, (6, 12, 18))

    # Wordmark
    f_mark = font(SERIF, 78)
    d.text((80, 196), "MR. FRANCK", font=f_mark, fill=PAPER)

    # Brass rule
    d.rectangle([82, 300, 82 + 96, 304], fill=BRASS)

    # Strapline
    f_tag = font(SERIF, 40)
    d.text((80, 336), "The Riviera, without the driving.", font=f_tag, fill=(233, 227, 216))

    # Kicker
    f_kick = font(SANS_BOLD, 22, 22)
    d.text((80, 132), "P R I V A T E   D R I V E R  ·  F R E N C H   R I V I E R A",
           font=f_kick, fill=BRASS_LT)

    # Footer facts
    f_foot = font(SANS, 24, 24)
    d.text((80, 470), "Fixed prices  ·  Fluent English  ·  Over a decade on these roads",
           font=f_foot, fill=(178, 188, 198))
    d.text((80, 512), "Nice  ·  Cannes  ·  Monaco  ·  Antibes  ·  Saint-Tropez",
           font=f_foot, fill=(140, 152, 164))

    im.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"✓ {os.path.relpath(OUT, ROOT)}  {W}x{H}  {os.path.getsize(OUT)//1024}KB")


if __name__ == "__main__":
    main()
