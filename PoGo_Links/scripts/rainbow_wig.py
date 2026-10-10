#!/usr/bin/env python3
"""Make the PokéXciting list icon: Wig Pikachu with a rainbow wig standing for all the wig colours (2026-10-10).

Reads the page's own wig icons (D.icons 0-3: Malaysia, Taiwan, Singapore, Philippines; icon 4, the grey Bangkok
wig, is a placeholder and left out), finds the wig as the pixels where those variants differ, and recolours it
red → violet in diagonal bands, keeping the first icon's shading. Writes PoGo_Links/icons/pokexciting-links.png,
which publish.py uses on the list instead of the page's first icon. Needs Pillow (e.g. in a scratch venv):
  python3 -m venv /tmp/v && /tmp/v/bin/pip install pillow && /tmp/v/bin/python -I PoGo_Links/scripts/rainbow_wig.py
"""
import base64
import colorsys
import glob
import io
import json
import os
import re
import sys

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "icons", "pokexciting-links.png")
SRC = os.path.join(os.path.dirname(HERE), "pokexciting-links.html")   # the published copy of the Drive page

s = open(sys.argv[1] if len(sys.argv) > 1 else SRC, encoding="utf-8").read()
d = json.JSONDecoder().raw_decode(s[re.search(r"var D\s*=\s*", s).end():])[0]
ims = [Image.open(io.BytesIO(base64.b64decode(i.split(",", 1)[1]))).convert("RGBA") for i in d["icons"][:4]]
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
os.makedirs(os.path.dirname(OUT), exist_ok=True)
out.save(OUT, optimize=True)
print(f"Wrote {OUT} ({len(xs)} wig pixels)")
