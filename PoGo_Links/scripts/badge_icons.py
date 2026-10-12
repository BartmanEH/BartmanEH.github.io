#!/usr/bin/env python3
"""Make the round-badge list icons from PokeMiners/pogo_assets originals (2026-10-10).

Every badge circle is drawn 112 px across in a 132 px canvas (2x the 66 px the list shows), whole badge centred, so
they look the same size side by side (Bart: "not normalized"). Measure the circle, not the bounding box: the Poké
Lid circle is 190 px of its 256 px image because its Pikachu pokes out at the top right.
Writes PoGo_Links/icons/:
  pokelid-links.png                          StampRally/CollectionIcon/stamp_pokelid_icon.png (English badge)
  pokecenter-links.png                       StampRally/CollectionIcon/stamp_pokecenter_icon.png
  jp-stamp-rallies.png                       StampRally/StampUiIcon/stamp_generic_icon.png (mixed rallies, no badge)
  pokexciting-malaysia-links.png             StampRally/CollectionIcon/stamp_regional_malaysia_icon.png (circle 250 px)
  pokexciting-taiwan-links.png               StampRally/CollectionIcon/stamp_regional_taiwan_icon.png (circle 250 px)
  lego-stamp-rally-links.png
                                             StampRally/stamp_pikachu_11.png, the LEGO rally's stamp: a mask
                                             (white = ink), tinted green on white as the game shows it
The Pikachu icons are made by pikachu_icons.py. Needs Pillow and network access (e.g. in a scratch venv):
  python3 -m venv /tmp/v && /tmp/v/bin/pip install pillow && /tmp/v/bin/python -I PoGo_Links/scripts/badge_icons.py
"""
import io
import os
import urllib.parse
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(os.path.dirname(HERE), "icons")
BASE = "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/StampRally/"
N, D = 132, 112                 # canvas, circle diameter
GREEN, WHITE = (84, 172, 84, 255), (255, 255, 255, 255)


def get(path):
    url = urllib.parse.quote(BASE + path, safe=":/")
    return Image.open(io.BytesIO(urllib.request.urlopen(url).read())).convert("RGBA")


def badge(im, circle_d):
    """Scale so the circle is D px across, then centre the whole badge (trimmed to its alpha box) on the canvas."""
    im = im.crop(im.getchannel("A").getbbox())
    s = D / circle_d
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    c = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    c.alpha_composite(im, ((N - im.width) // 2, (N - im.height) // 2))
    return c


def save(im, name):
    im.save(os.path.join(ICONS, name + ".png"), optimize=True)


os.makedirs(ICONS, exist_ok=True)
save(badge(get("CollectionIcon/stamp_pokelid_icon.png"), 190), "pokelid-links")
save(badge(get("CollectionIcon/stamp_pokecenter_icon.png"), 256), "pokecenter-links")
g = get("StampUiIcon/stamp_generic_icon.png")
bb = g.getchannel("A").getbbox()
save(badge(g, bb[2] - bb[0]), "jp-stamp-rallies")
# 2026-10-11 BEFORE: no Malaysia badge. WHY: new page pokexciting-malaysia-links (Bart: every new page gets its
# PokeMiners badge). NOW: the rally's own badge, as on the in-game stamp sheet; its circle is 250 of 256 px.
save(badge(get("CollectionIcon/stamp_regional_malaysia_icon.png"), 250), "pokexciting-malaysia-links")
# 2026-10-12: new page pokexciting-taiwan-links; the Taiwan rally's own badge, circle 250 of 256 px like Malaysia's.
save(badge(get("CollectionIcon/stamp_regional_taiwan_icon.png"), 250), "pokexciting-taiwan-links")

p = get("stamp_pikachu_11.png")
p = p.crop(p.getchannel("A").getbbox())
ink = Image.composite(Image.new("RGBA", p.size, GREEN), Image.new("RGBA", p.size, WHITE), p.convert("L"))
ink.putalpha(p.getchannel("A"))
lego = badge(ink, ink.width)
save(lego, "lego-stamp-rally-links")
# 2026-10-11 BEFORE: also lego-outstanding.png. WHY: Bart deleted that page (rally complete, 219/219). NOW: one LEGO icon.
print(f"Wrote 5 badge icons to {ICONS}")
