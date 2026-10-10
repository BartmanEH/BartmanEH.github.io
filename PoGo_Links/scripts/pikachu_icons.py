#!/usr/bin/env python3
"""Make the Pikachu list icons from PokeMiners/pogo_assets originals, all with ONE crop so they match (2026-10-10).

The game's 256 px Pokémon icons are all drawn at the same scale, so cutting every one with the same square (CROP)
keeps them the same size on the list, as in the game (Bart: the hanbok looked small when sized on its own).
Writes PoGo_Links/icons/:
  esa-astronaut-pikachu-links.png  pm25.fGLASS_HELMET_2026
  seoul-hanbok-links.png           pm25.fK_2026_A_01
  pokexciting-links.png            rainbow wig: the wig is where the four wig variants (Malaysia, Taiwan, Singapore,
                                   Philippines; the grey Bangkok one is a placeholder and left out) differ, recoloured
                                   red -> violet in diagonal bands, keeping the Malaysia icon's shading.
Needs Pillow and network access (e.g. in a scratch venv):
  python3 -m venv /tmp/v && /tmp/v/bin/pip install pillow && /tmp/v/bin/python -I PoGo_Links/scripts/pikachu_icons.py
"""
import colorsys
import io
import os
import urllib.parse
import urllib.request

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(os.path.dirname(HERE), "icons")
BASE = "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon - 256x256/Addressable Assets/"
CROP = (73, 90, 217, 234)      # 144 px square around the Pikachu body; the tail runs off the right, as in the game
SIZE = 132                     # 2x the 66 px the list draws icons at


def get(form):
    url = urllib.parse.quote(BASE + f"pm25.f{form}.icon.png", safe=":/")
    return Image.open(io.BytesIO(urllib.request.urlopen(url).read())).convert("RGBA")


def icon(im):
    return im.crop(CROP).resize((SIZE, SIZE), Image.LANCZOS)


os.makedirs(ICONS, exist_ok=True)
for form, name in (("GLASS_HELMET_2026", "esa-astronaut-pikachu-links"), ("K_2026_A_01", "seoul-hanbok-links")):
    icon(get(form)).save(os.path.join(ICONS, name + ".png"), optimize=True)

ims = [get(f"ANNIVERSARY_2026_{c}_01") for c in ("MALAYSIA", "TAIWAN", "SINGAPORE", "PHILIPPINE")]
W, H = ims[0].size
base = ims[0].load()
px = [im.load() for im in ims]

mask = Image.new("L", (W, H), 0)
m = mask.load()
for y in range(H):
    for x in range(W):
        if base[x, y][3] < 20:
            continue
        diff = max(abs(px[a][x, y][c] - px[b][x, y][c]) for a in range(4) for b in range(a + 1, 4) for c in range(3))
        if diff > 60:
            m[x, y] = 255
mask = mask.filter(ImageFilter.MedianFilter(3))
m = mask.load()

xs = sorted(x for y in range(H) for x in range(W) if m[x, y])
ys = sorted(y for y in range(H) for x in range(W) if m[x, y])
q = lambda v, f: v[int(f * (len(v) - 1))]
x0, x1, y0, y1 = q(xs, .03), q(xs, .97), q(ys, .03), q(ys, .97)   # ignore stray pixels

out = ims[0].copy()
o = out.load()
for y in range(H):
    for x in range(W):
        if not m[x, y]:
            continue
        r, g, b, a = base[x, y]
        lum = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)[1]
        t = min(1, max(0, (x - x0) / max(1, x1 - x0) * .75 + (y - y0) / max(1, y1 - y0) * .25))
        rr, gg, bb = colorsys.hls_to_rgb(.83 * t, min(.78, max(.32, lum * .9)), .95)
        o[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
icon(out).save(os.path.join(ICONS, "pokexciting-links.png"), optimize=True)
print(f"Wrote 3 icons to {ICONS} ({len(xs)} wig pixels)")
