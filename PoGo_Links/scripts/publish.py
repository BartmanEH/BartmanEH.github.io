#!/usr/bin/env python3
"""Publish Bart's Pokémon GO link pages from Google Drive to GitHub Pages.

The pages live in PoGo_Links/ itself (2026-10-10: Google Drive is no longer used). Pokémap quest Exports arrive on
their own via BartmanEH/pogo-links-inbox, whose GitHub job runs this script with --index-only; pages made by the
coord-link-page skill are written into PoGo_Links/ and published with this script: it pulls, rebuilds
PoGo_Links/index.html (the list, newest first), commits and pushes. It never deletes pages; to take one down, delete
the file and publish. Exception (2026-10-13): pages with a pogolinks-expires time (quest Exports) are deleted after it by --expire,
which the scheduled job in BartmanEH/pogo-links-inbox runs. Pages are copied byte for byte: each one already embeds its GPX and keeps
its Done ticks under its own localStorage key.

Usage (from anywhere):
  python3 -I PoGo_Links/scripts/publish.py           # publish, commit and push
  python3 -I PoGo_Links/scripts/publish.py -n        # dry run: show what would change, touch nothing
  python3 -I PoGo_Links/scripts/publish.py --no-push # write and commit, don't push
  python3 -I PoGo_Links/scripts/publish.py --src DIR # first import the .html pages in DIR
  python3 -I PoGo_Links/scripts/publish.py --expire  # delete expired pages, rebuild the list (the inbox job)
Called by the coord-link-page skill after it writes a page (2026-10-10).
"""
import argparse
import datetime
import glob
import html
import json
import os
import re
import subprocess
import sys
import unicodedata

# Shown just below the footer (Bart's standard); bump when the list page changes.
# 2.0 = redesign + reorder; 2.1 = IES logo (home link) top right; 2.2 = logo bigger and centred, floating footer
# (all 2026-10-10); 2.3 = version in the footer, sticky footer.
LIST_VERSION = "2.19"   # 2.19 = bottom link "← PoGO Tools" (to ../PoGO_Tools/; BEFORE "← Home" to the site root; Bart 2026-10-15; the IES logo goes to PoGO Tools too; the footer picture still goes to the root); 2.18 = live counts from JoyRoute's HopRoute stream (2026-10-15, Bart); 2.17 = "updated today 12:28 PM": the publish time, not just the day, on its own second line; 2.16 = quest Exports (pages with an expiry) always on top, above a saved order; 2.15 = pages past their pogolinks-expires time are hidden (quest Exports, daily); 2.14 = floating footer less tall (notice line 49 → 38px); 2.13 = iOS: reordering no longer cancelled by the long-press link menu; 2.12 = a Remaining tile (places − done); 2.11 = the Done tile counts ticks again (was always 0 since 2.7); 2.10 = JoyRoute note matches JoyRoute 2026-10-11 (no longer opens Pokémon GO); 2.9 = ?joyroute=on|off switches JoyRoute links (from JoyRoute's Settings); 2.8 = a page can mark itself not complete (pogolinks-open meta); 2.7 = to-be-announced stops count in a page's total; 2.6 = long titles condensed to one line; 2.4 = progress bars actually fill (were 0px wide); 2.5 = yellow in progress, green complete
FIRST_YEAR = "2026"   # the list page was first published in 2026: "© 2026", then "© 2026–<year>"

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)                      # PoGo_Links/
REPO = os.path.dirname(OUT)                      # BartmanEH.github.io/


def git(*args, check=True):
    r = subprocess.run(["git", "-C", REPO, *args], capture_output=True, text=True)
    if check and r.returncode:
        sys.exit(f"git {' '.join(args)} failed:\n{r.stderr.strip()}")
    return r.stdout.strip()


def page_info(path):
    """What the list shows about a page, read from the page itself: title, place keys (for the progress bar),
    its localStorage key, and an icon (the page's first event icon or quest reward icon) if it has one."""
    s = open(path, encoding="utf-8").read()
    m = re.search(r"<title>(.*?)</title>", s, re.S)
    title = html.unescape(m.group(1).strip()) if m else os.path.splitext(os.path.basename(path))[0]
    # Em dashes closed up, no spaces (The Canadian Style; Bart, 2026-10-10). The pages themselves keep their titles.
    title = re.sub(r"\s*\u2014\s*", "\u2014", title)
    info = {"title": title, "keys": [], "tba": 0, "storage": None, "icon": None}
    # <meta name="pogolinks-open" content="why">: the game doesn't call this rally completed, so the list never shows
    # "Complete" for it, however many stops are ticked (Bart, 2026-10-11, LEGO at 219/219; v2.8).
    m = re.search(r'<meta name="pogolinks-open" content="([^"]*)"', s)
    info["open"] = html.unescape(m.group(1)) if m else ""
    # <meta name="pogolinks-expires" content="<UTC ISO time>">: after this the list hides the page and --expire deletes it.
    # Pokémap quest Exports set it to the next local midnight of their map, when quests rotate (Bart, 2026-10-13; v2.15).
    m = re.search(r'<meta name="pogolinks-expires" content="([^"]*)"', s)
    info["expires"] = m.group(1) if m else ""
    dec = json.JSONDecoder()
    m = re.search(r"var D\s*=\s*", s)                 # coord-link-page pages
    if m:
        try:
            d = dec.raw_decode(s[m.end():])[0]
            # Places without coordinates are "to be announced" placeholders: no Done button, so they can't be ticked,
            # but they count towards the total. 2026-10-11 BEFORE: not counted, so PokéXciting (4 stops + Bangkok to
            # come) showed "Complete" at 4/4. WHY: Bart: it's 4/5 in the game. NOW: total = located + TBA (v2.7).
            info["keys"] = [p["key"] for p in d.get("points", []) if p.get("lat") is not None]
            info["tba"] = sum(1 for p in d.get("points", []) if p.get("lat") is None)
            info["storage"] = d.get("storageKey")
            info["icon"] = (d.get("icons") or [None])[0]
        except (ValueError, KeyError):
            pass
    else:                                              # Pokémap quest Export pages
        m = re.search(r"var POINTS\s*=\s*", s)
        if m:
            try:
                info["keys"] = [p["key"] for p in dec.raw_decode(s[m.end():])[0]]
            except (ValueError, KeyError):
                pass
        m = re.search(r"STORAGE_KEY\s*=\s*'([^']+)'", s)
        info["storage"] = m.group(1) if m else None
        m = re.search(r"var REWARD_ICONS\s*=\s*", s)
        if m:
            try:
                info["icon"] = (dec.raw_decode(s[m.end():])[0] or [None])[0]
            except ValueError:
                pass
    return info


def category(title, name):
    """Guessed from the title: drives the card's colour and fallback icon."""
    t = f"{title} {name}".lower()
    if "quest" in t:
        return "q", "Quests"
    if "stamp" in t or "rally" in t or "lego" in t:      # "LEGO — outstanding" is the rest of the LEGO rally
        return "s", "Stamp rally"
    return "e", "Event"


# Fallback icons (no icon in the page), drawn in the category colour.
GLYPHS = {
    "q": '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="currentColor"/></svg>',
    "s": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.6 2"/><circle cx="12" cy="12" r="5.5" fill="currentColor"/></svg>',
    "e": '<svg viewBox="0 0 24 24"><path d="M12 2c.8 5.2 4.8 9.2 10 10-5.2.8-9.2 4.8-10 10-.8-5.2-4.8-9.2-10-10 5.2-.8 9.2-4.8 10-10z" fill="currentColor"/></svg>',
}

PAGE = r"""<!DOCTYPE html>
<!-- Generated by PoGo_Links/scripts/publish.py on __STAMP__. Don't edit by hand: changes are overwritten on the next publish. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#2b2b29">
<title>BartmanEH's PoGO Link Pages</title>
<link rel="icon" type="image/png" href="../img/favicon/favicon-32x32.png" sizes="32x32">
<style>
  /* Colours: Bart's VS Code palette, same as the link pages and JoyRoute: page #2b2b29, cards #33332f, borders #404040,
     text #d1d5db, bold #e5e5e5, grey #9ca3af; blue #74aeea, purple #bb7cd8, green #a1c281, tan #c99c6e, red #e06c75.
     Category colours: event purple, stamp rally tan, quests green. Width capped at 412px (Pixel 6 Pro) like the pages.
     Everything spans the same width (header tiles, cards, footer): Bart's symmetry rule. */
  :root { --bg: #2b2b29; --card: #33332f; --line: #404040; --text: #d1d5db; --bold: #e5e5e5; --grey: #9ca3af;
          --blue: #74aeea; --purple: #bb7cd8; --green: #a1c281; --tan: #c99c6e; --red: #e06c75; --yellow: #e5c07b; }
  html { background: var(--bg); height: 100%; }
  body { max-width: 412px; box-sizing: border-box; margin: 0 auto; padding: 20px 16px 0; min-height: calc(100vh + 22px); min-height: calc(100dvh + 22px);
         display: flex; flex-direction: column; color: var(--text);
         font-family: -apple-system, system-ui, sans-serif; -webkit-tap-highlight-color: transparent;
         background: radial-gradient(120% 220px at 50% 0, rgba(116,174,234,.16), rgba(187,124,216,.07) 55%, transparent 100%) var(--bg); }
  .hero { display: flex; align-items: center; gap: 12px; margin: 0 0 16px; }
  /* IES logo: the home link, as on Bart's other pages (same light grey: css/style.css .filter-white = invert 90%).
     2026-10-10 BEFORE (v2.1): 18px, top right on the kicker line. WHY: Bart: too small, should be centred to balance the
     header. NOW (v2.2): 26px, vertically centred at the right; title 26 -> 22px and Poké Ball 46 -> 40px make room. */
  .ies { margin-left: auto; flex: 0 0 auto; line-height: 0; }
  .ies img { height: 26px; width: auto; filter: invert(90%); opacity: .85; transition: transform .5s ease-in-out; }
  .ies img:hover { transform: scale(1.2); }
  .ball { width: 40px; height: 40px; flex: 0 0 auto; filter: drop-shadow(0 3px 8px rgba(0,0,0,.45)); }
  /* Kicker "BartmanEH's" as he writes it. 2026-10-10 BEFORE (v2.2 draft): uppercase "BARTMANEH'S", wide tracking.
     WHY: Bart: better as BartmanEH's. NOW: his own capitalisation, normal case. */
  .kicker { color: var(--purple); font-size: 14px; font-weight: 700; letter-spacing: .2px; }
  h1 { margin: 2px 0 0; font-size: 22px; line-height: 1.1; font-weight: 800; letter-spacing: -.3px; color: var(--bold);
       background: linear-gradient(90deg, var(--blue), var(--purple)); -webkit-background-clip: text; background-clip: text;
       -webkit-text-fill-color: transparent; }
  /* v2.12 BEFORE: three tiles (Pages, Places, Done). WHY: Bart wanted what's left at a glance. NOW: + Remaining. */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 0 0 16px; }
  .stat { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 8px 6px; text-align: center; }
  .stat b { display: block; font-size: 20px; font-weight: 800; color: var(--tan); font-variant-numeric: tabular-nums; }
  .stat span { font-size: 11px; color: var(--grey); text-transform: uppercase; letter-spacing: .8px; }
  .stat.done b { color: var(--green); }
  .card { --c: var(--purple); display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 3px 12px; align-items: center;
          background: linear-gradient(135deg, rgba(255,255,255,.035), transparent 60%) var(--card); border: 1px solid var(--line);
          border-left: 3px solid var(--c); border-radius: 12px; padding: 12px 12px 10px 10px; margin-bottom: 10px; text-decoration: none;
          box-shadow: 0 2px 10px rgba(0,0,0,.25); transition: transform 90ms ease, box-shadow 90ms ease, background-color 90ms; }
  .card[hidden] { display: none; }   /* expired pages (v2.15); display:grid above would override [hidden] */
  .card:active { transform: scale(.985); background-color: #3a3a36; }
  @media (hover: hover) { .card:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.35); } }
  .card.s { --c: var(--tan); } .card.q { --c: var(--green); }
  /* 2026-10-10 BEFORE: 52px icon beside title + meta, progress bar on its own full-width row below.
     WHY: Bart wanted bigger icons; the bar moved up beside the icon to make room. NOW: 72px icon spanning all three rows. */
  .ic { grid-row: 1 / span 3; width: 72px; height: 72px; border-radius: 12px; display: grid; place-items: center; overflow: hidden;
        background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--c) 28%, transparent), transparent 70%) #2b2b29;
        border: 1px solid color-mix(in srgb, var(--c) 45%, var(--line)); color: var(--c); }
  .ic img { width: 66px; height: 66px; object-fit: contain; }
  .ic svg { width: 34px; height: 34px; }
  .t { color: var(--blue); font-weight: 700; font-size: 15px; line-height: 1.25; }
  /* Long titles fit on one line (2026-10-10, Bart: the astronaut title was too long): fitTitles() below first tightens
     the letter spacing (to -0.5px), then shrinks the text (to 12px at the least); a title that still doesn't fit wraps. */
  .t.fit { white-space: nowrap; }
  .m { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 12px; color: var(--grey); }
  .chip { color: var(--c); border: 1px solid color-mix(in srgb, var(--c) 55%, transparent); border-radius: 999px;
          padding: 0 7px; font-size: 11px; font-weight: 700; line-height: 17px; }
  .m .n { color: var(--tan); font-variant-numeric: tabular-nums; }
  /* v2.17 (2026-10-13). BEFORE: the info line wrapped wherever it ran out of room (at 412 px the file name dropped to a
     second line, sometimes the date). WHY: Bart, "the split should be purposeful". NOW: always two lines on every card,
     line 1 = category, places, file name (cut with "…" when long); line 2 = "updated today 12:28 PM". */
  .m .when { order: 9; flex-basis: 100%; }
  .m .file { flex: 1 1 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } /* a long name ends in "…" instead of taking a line */
  .bar { grid-column: 2; display: flex; align-items: center; gap: 8px; margin-top: 3px; font-size: 11px; color: var(--grey);
         font-variant-numeric: tabular-nums; }
  .track { flex: 1; height: 6px; border-radius: 3px; background: #232321; overflow: hidden; box-shadow: inset 0 0 0 1px #4a4a44; }
  /* 2026-10-10 BEFORE (v2.3): track #2b2b29 edged #3a3a36, too faint to see on a #33332f card (Bart: no bar at all).
     NOW (v2.4): darker track, lighter edge. */
  /* display: block: the fill is a <span>, and an inline element ignores width, so before 2026-10-10 (v2.3) every bar drew
     0px wide whatever the progress (Bart: "Complete" but not filled in). NOW (v2.4) block, so the width shows. */
  .fill { display: block; height: 100%; width: 0; border-radius: 3px; background: var(--yellow); transition: width 400ms ease; }
  /* 2026-10-10 BEFORE (v2.4): fill in the card's category colour. WHY: Bart: in progress yellow, completed green.
     NOW (v2.5): yellow while in progress, green when complete. */
  .bar.complete { color: var(--green); font-weight: 700; }
  .bar.complete .fill { background: var(--green); }
  .file { color: #6b7280; }
  /* Reorder (2026-10-10, Bart): "Reorder" shows a grip on each card; drag it to move the card. The order is saved in this
     browser (localStorage, like the Done ticks), so each device keeps its own. Pages not in the saved order (new ones)
     go on top, newest first. v2.16: pages with an expiry (quest Exports) always go first, above the saved order. */
  .order { display: flex; justify-content: space-between; align-items: center; margin: 0 0 10px; font-size: 12px; color: var(--grey); }
  .order button { font: inherit; font-size: 13px; font-weight: 700; color: var(--blue); background: var(--card); border: 1px solid var(--line);
                  border-radius: 999px; padding: 5px 14px; cursor: pointer; }
  .order button.on { color: var(--bg); background: var(--blue); border-color: var(--blue); }
  .order #reset { color: var(--red); }
  .grip { display: none; }
  body.reorder .card { position: relative; padding-right: 44px; }
  /* v2.13 (Bart, iOS): holding a card a moment too long opened iOS's link menu (a haptic buzz) and cancelled the drag;
     Android doesn't do this. While reordering, cards offer no link menu, no text selection and no image dragging. */
  body.reorder .card { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  body.reorder .card img { -webkit-user-drag: none; pointer-events: none; }
  body.reorder .card:active { transform: none; }
  body.reorder .grip { display: grid; place-items: center; position: absolute; top: 0; right: 0; bottom: 0; width: 40px;
                       color: var(--grey); touch-action: none; cursor: grab; }
  body.reorder .grip svg { width: 18px; height: 18px; }
  .card.dragging { z-index: 2; box-shadow: 0 10px 28px rgba(0,0,0,.55); background-color: #3a3a36; transition: none; }
  .card.dragging .grip { color: var(--blue); cursor: grabbing; }
  .links { display: flex; justify-content: space-between; font-size: 12px; color: var(--grey); margin: 14px 0; }
  .links a { color: var(--blue); text-decoration: none; }
  /* JoyRoute links switch (v2.9): JoyRoute's Settings opens this list with ?joyroute=on|off; the note confirms it. */
  .jrnote { background: var(--card); border: 1px solid var(--line); border-left: 3px solid var(--green); border-radius: 12px;
            padding: 10px 12px; margin: 0 0 16px; font-size: 13.5px; line-height: 1.45; }
  .jrnote.off { border-left-color: var(--tan); }
  .jrnote b { color: var(--green); } .jrnote.off b { color: var(--tan); }
  /* Footer: Bart's standard ("© years [Bart] Stassen, P.Eng." centred at 14px, the picture grows on hover, version in
     grey 12px just off screen), for a list longer than a screen.
     2026-10-10 BEFORE (v2.2): fixed footer, version alone at the very end of the page. WHY: Bart: the version belongs in
     the footer, out of view until the footer is scrolled. NOW (v2.3): the footer is the last thing on the page and
     sticky with bottom -22px: its notice line stays at the bottom of the screen while the list scrolls, its version
     line hangs just below the screen edge, and both come into view at the end of the page. The body is at least a
     screen + 22px tall, so on a short page the version is also just off screen. */
  /* v2.14 BEFORE: notice line 49px (footer 72px). WHY: Bart: the floating footer was too tall. NOW: 38px (footer 61px),
     4px above and below the 30px picture. */
  .footer { position: sticky; bottom: -22px; margin: 18px -16px 0; margin-top: auto; z-index: 3; height: 61px;
            display: flex; flex-direction: column; align-items: center; font-size: 14px; color: var(--grey); white-space: nowrap;
            background: rgba(43,43,41,.94); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
            border-top: 1px solid var(--line); box-sizing: border-box; }
  .footer .note { height: 38px; display: flex; align-items: center; }
  .footer img { height: 30px; vertical-align: middle; margin: 0 4px; transition: transform .5s ease-in-out; }
  .footer img:hover { transform: scale(1.5); }
  .footer #version { height: 22px; font-size: 12px; line-height: 1; color: #888; }
</style>
</head>
<body>
<div class="hero">
  <svg class="ball" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#e5e5e5"/>
    <path d="M2 24a22 22 0 0 1 44 0z" fill="#e06c75"/>
    <rect x="2" y="21.5" width="44" height="5" fill="#2b2b29"/>
    <circle cx="24" cy="24" r="22" fill="none" stroke="#2b2b29" stroke-width="2.5"/>
    <circle cx="24" cy="24" r="7.5" fill="#e5e5e5" stroke="#2b2b29" stroke-width="3"/>
    <circle cx="24" cy="24" r="3" fill="#74aeea"/>
  </svg>
  <div><div class="kicker">BartmanEH's</div><h1>PoGO Link Pages</h1></div>
  <a class="ies" href="../PoGO_Tools/" aria-label="PoGO Tools"><img src="../img/IES_logo.svg" alt="IES"></a>
</div>
<div class="stats">
  <div class="stat"><b>__PAGES__</b><span>Pages</span></div>
  <div class="stat"><b>__PLACES__</b><span>Places</span></div>
  <div class="stat done"><b id="done">&ndash;</b><span>Done</span></div>
  <div class="stat"><b id="left">&ndash;</b><span>Remaining</span></div>
</div>
<div class="jrnote" id="jrnote" hidden></div>
<div class="order"><button id="reset" type="button" hidden>Reset</button><span id="ordlbl">Newest first</span><button id="reorder" type="button">Reorder</button></div>
<div id="list">
__ROWS__
</div>
<div class="links"><a href="../PoGO_Tools/">&larr; PoGO Tools</a><span>Published __STAMP__</span></div>
<div class="footer"><span class="note">&copy; <span id="year">__FIRST__</span><a href="../"><img src="../img/BartmanEH.png" alt="Bart"></a>Stassen, P.Eng.</span><span id="version">v__VERSION__</span></div>
<script>
  // 2026-10-14 BEFORE: storage/clipboard failures were swallowed with `catch (e) {}`. WHY: the site's ESLint now checks
  // HTML pages too (no-empty, no-unused-vars). NOW: `catch { /* ignore: ... */ }`, same behaviour, lint-clean.
// JoyRoute links (v2.9, 2026-10-11): JoyRoute's Settings opens this list with ?joyroute=on|off. It switches this
// browser's localStorage "joyroute", which every link page reads (USE_JOYROUTE): on, their GPS JoyStick buttons use
// joyroute://teleport (JoyRoute teleports in the background, then opens Pokémon GO); off, gpsjoystick:// as before.
// v2.10 BEFORE: the note said on = "then open Pokémon GO", off = "open GPS JoyStick". WHY: JoyRoute now only brings
// an already-running Pokémon GO forward (Bart starts it through Pokemod), and GPS JoyStick's own link often stays in
// the browser. NOW: wording below.
(function () {
  var q = new URLSearchParams(location.search), v = String(q.get('joyroute') || '').toLowerCase();
  if (v !== 'on' && v !== 'off') return;
  try { if (v === 'on') localStorage.setItem('joyroute', 'on'); else localStorage.removeItem('joyroute'); } catch { /* ignore: not available in this browser */ }
  q.delete('joyroute');
  history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
  var n = document.getElementById('jrnote');
  n.className = 'jrnote ' + v;
  n.innerHTML = 'JoyRoute links: <b>' + v + '</b>. GPS JoyStick buttons on these pages ' +
    (v === 'on' ? 'teleport through JoyRoute, out of sight; Pokémon GO comes to the front if it’s running.' : 'use GPS JoyStick’s own link, as before.') + ' This browser only.';
  n.hidden = false;
})();
// Progress: each page keeps its Done ticks in localStorage on this same site, so the list can read them.
// A place counts as done when its key is in the page's saved state (the two LEGO pages share one key on purpose).
var PAGES = __DATA__;
var jrDone = {};   // file -> the points JoyRoute says are ticked ({"lat,lng": true})
function refresh() {
  var total = 0, left = 0;
  document.querySelectorAll('.card').forEach(function (card) {
    var p = PAGES[card.dataset.file], st = {};
    // Past its expiry (quest Exports: local midnight of their map): hidden here until the inbox job deletes it (v2.15).
    card.hidden = !!(p.expires && Date.now() >= Date.parse(p.expires));
    if (card.hidden) return;
    try { st = JSON.parse(localStorage.getItem(p.storage) || '{}') || {}; } catch { /* ignore: not available in this browser */ }
    // v2.18 (2026-10-15, Bart) BEFORE: only the page's own saved ticks. WHY: with a HopRoute running, a route page in a background tab is paused
    // by the browser and can't apply JoyRoute's ticks, so this count stayed old until Bart went into that page and back. NOW: the larger of the saved
    // ticks and what JoyRoute reports for this page over its stream (jrDone, below); the route page writes the real ticks when it next wakes.
    var stored = p.keys.filter(function (k) { return st[k] && st[k].done !== false; }).length;
    var done = Math.min(p.keys.length, Math.max(stored, Object.keys(jrDone[card.dataset.file] || {}).length));
    total += done;
    var bar = card.querySelector('.bar');
    // v2.11 BEFORE: this was "var total", which shadowed the outer total (JS var scoping), so the ticks above were added
    // to it and the Done tile always showed 0 (since v2.7). WHY: Bart, 2026-10-12. NOW: its own name, places.
    var places = p.keys.length + (p.tba || 0);   // stops still to be announced count too (v2.7)
    left += places - done;
    bar.querySelector('.fill').style.width = (places ? 100 * done / places : 0) + '%';
    var complete = done > 0 && done === places && !p.open;   // "open": the game doesn't call it completed yet (v2.8)
    bar.querySelector('.lbl').textContent = complete ? 'Complete' : done + ' / ' + places;
    bar.querySelector('.lbl').title = p.open || '';
    bar.classList.toggle('complete', complete);
  });
  document.getElementById('done').textContent = total.toLocaleString('en-US');
  document.getElementById('left').textContent = left.toLocaleString('en-US');
}
// Fit each title on one line: tighten the letter spacing first, then shrink the text, never below 12px.
function fitTitles() {
  document.querySelectorAll('.card .t').forEach(function (t) {
    t.style.letterSpacing = ''; t.style.fontSize = ''; t.classList.add('fit');
    var size = parseFloat(getComputedStyle(t).fontSize), ls = 0;
    while (t.scrollWidth > t.clientWidth && ls > -0.5) { ls -= 0.1; t.style.letterSpacing = ls.toFixed(1) + 'px'; }
    while (t.scrollWidth > t.clientWidth && size > 12) { size -= 0.25; t.style.fontSize = size + 'px'; }
    if (t.scrollWidth > t.clientWidth) { t.classList.remove('fit'); t.style.letterSpacing = ''; t.style.fontSize = ''; }
  });
}
fitTitles();
window.addEventListener('resize', fitTitles);
// "updated today 12:28 PM / yesterday 4:10 PM / 3 days ago 9:05 AM" (the page shows the plain date without scripts).
// v2.17 (2026-10-13). BEFORE: "updated today / yesterday / N days ago" from the publish date only (data-day). WHY: Bart:
// "updated today" isn't enough to tell whether a fresh Export has landed (quest Exports are re-published several times a
// day). NOW: data-t = the publish time (the page's last commit, page_date) and the viewer's local clock time is added;
// a week or older shows the date and time.
document.querySelectorAll('.when').forEach(function (el) {
  var t = +el.dataset.t, when = t ? new Date(t) : new Date(el.dataset.day + 'T00:00');
  var d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(when).setHours(0, 0, 0, 0)) / 864e5);
  var clock = t ? ' ' + when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  if (d >= 0 && d < 7) el.textContent = (d === 0 ? 'updated today' : d === 1 ? 'updated yesterday' : 'updated ' + d + ' days ago') + clock;
  else if (t) el.textContent = 'updated ' + when.toLocaleDateString([], { month: 'short', day: 'numeric' }) + clock;
});
// © first year of this page, widening to "2026–2027" etc. as years pass (Bart, 2026-10-10;
// BEFORE: "© 2014–current year", the IES site's span, which isn't this page's).
var first = __FIRST__, now = new Date().getFullYear();
if (now > first) document.getElementById('year').textContent = first + '\u2013' + now;
refresh();
window.addEventListener('pageshow', refresh);   // coming Back from a page (bfcache) shows the new ticks
// Live counts from JoyRoute (v2.18, 2026-10-15, Bart): a page that has a HopRoute keeps a token under 'joyroute_hop_token:<its storage key>' on this
// site, so for each such card the list opens JoyRoute's local event stream (127.0.0.1:48730, the same one the page itself uses; Edge's one-time
// permission for this site covers it) and shows the larger of the saved count and JoyRoute's. Only on Android with JoyRoute links on, only while
// this page is showing (a background tab is paused anyway), and a stream that fails 3 times is dropped until the page is shown again.
var jrStreams = {};
function jrToken(p) { try { return p.storage ? localStorage.getItem('joyroute_hop_token:' + p.storage) : null; } catch { return null; } }
function jrOpen() {
  var on = false;
  try { on = localStorage.getItem('joyroute') === 'on'; } catch { /* ignore: not available in this browser */ }
  if (!on || !/Android/i.test(navigator.userAgent) || !window.EventSource || document.visibilityState !== 'visible') return;
  document.querySelectorAll('.card').forEach(function (card) {
    var file = card.dataset.file, token = card.hidden ? null : jrToken(PAGES[file]);
    if (!token || jrStreams[file]) return;
    var fails = 0, src = new EventSource('http://127.0.0.1:48730/events?token=' + token);
    jrStreams[file] = src;
    src.onopen = function () { fails = 0; };
    src.onmessage = function (ev) {
      var m;
      try { m = JSON.parse(ev.data); } catch { return; }
      var list = m && (m.type === 'state' ? m.done : m.at);
      if (!list) return;
      if (m.type === 'state') jrDone[file] = {};
      var set = jrDone[file] || (jrDone[file] = {});
      list.forEach(function (k) { set[k] = true; });
      refresh();
    };
    src.onerror = function () { if (++fails >= 3) { src.close(); delete jrStreams[file]; } };
  });
}
function jrClose() { Object.keys(jrStreams).forEach(function (f) { jrStreams[f].close(); delete jrStreams[f]; }); }
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') jrOpen(); else jrClose(); });
jrOpen();

// Reorder: drag a card by its grip. Saved order = list of file names; files not in it go first, in the published order.
var ORDER_KEY = 'pogolinks.order.v1', list = document.getElementById('list'), lbl = document.getElementById('ordlbl'),
    btn = document.getElementById('reorder'), reset = document.getElementById('reset');
function cards() { return Array.prototype.slice.call(list.querySelectorAll('.card')); }
function saved() { try { return JSON.parse(localStorage.getItem(ORDER_KEY) || 'null'); } catch { return null; } }
function applyOrder() {
  var o = saved(), pos = {};
  (o || []).forEach(function (f, i) { pos[f] = i; });
  // v2.16 (2026-10-13). BEFORE: a page in the saved order kept its saved place, so a fresh quest Export (same file name
  // every day, e.g. quests_nyc.html, already in the order) stayed wherever it had been dragged, last on Bart's phone.
  // WHY: Bart wants new Exports at the top; he chose "quest Exports always on top" (over "re-published pages on top").
  // NOW: pages with an expiry (pogolinks-expires: the quest Exports) come first in published order (newest first),
  // then pages not in the saved order, then the saved order. Dragging an Export lower is undone on the next load.
  function rank(c) {
    var f = c.dataset.file, i = +c.dataset.i;
    if (PAGES[f] && PAGES[f].expires) return -2e6 + i;
    return f in pos ? pos[f] : -1e6 + i;
  }
  cards().sort(function (a, b) { return rank(a) - rank(b); }).forEach(function (c) { list.appendChild(c); });
  lbl.textContent = o ? 'Your order' : 'Newest first';
}
function saveOrder() {
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(cards().map(function (c) { return c.dataset.file; }))); } catch { /* ignore: not available in this browser */ }
  lbl.textContent = 'Your order';
}
cards().forEach(function (c) {
  var g = document.createElement('span');
  g.className = 'grip'; g.setAttribute('aria-hidden', 'true');
  g.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>';
  c.appendChild(g);
});
function setMode(on) {
  document.body.classList.toggle('reorder', on);
  btn.textContent = on ? 'Done' : 'Reorder'; btn.classList.toggle('on', on);
  reset.hidden = !on; lbl.hidden = on;
}
btn.addEventListener('click', function () { setMode(!document.body.classList.contains('reorder')); });
reset.addEventListener('click', function () {
  try { localStorage.removeItem(ORDER_KEY); } catch { /* ignore: not available in this browser */ }
  applyOrder();
});
// In reorder mode a tap must not open the page.
list.addEventListener('click', function (e) { if (document.body.classList.contains('reorder')) e.preventDefault(); });

var drag = null;
function place() {   // move the dragged card in the list to where the finger is, then keep it under the finger
  var c = drag.card, y = drag.y;
  var others = cards().filter(function (o) { return o !== c; }), before = null;
  for (var i = 0; i < others.length; i++) {
    var r = others[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) { before = others[i]; break; }
  }
  if (c.nextElementSibling !== before || (before === null && list.lastElementChild !== c)) list.insertBefore(c, before);
  c.style.transform = '';
  var natural = c.getBoundingClientRect().top + window.scrollY;
  c.style.transform = 'translateY(' + (drag.top + (y + window.scrollY - drag.startY) - natural) + 'px)';
}
function tick() {   // scroll when the finger is near the top or bottom edge
  if (!drag) return;
  var edge = 70, v = drag.y < edge ? -(edge - drag.y) / 5 : drag.y > innerHeight - edge ? (drag.y - innerHeight + edge) / 5 : 0;
  if (v) { window.scrollBy(0, v); place(); }
  requestAnimationFrame(tick);
}
list.addEventListener('pointerdown', function (e) {
  var g = e.target.closest('.grip');
  if (!g || !document.body.classList.contains('reorder')) return;
  var c = g.closest('.card');
  e.preventDefault();
  g.setPointerCapture(e.pointerId);
  drag = { card: c, y: e.clientY, startY: e.clientY + window.scrollY, top: c.getBoundingClientRect().top + window.scrollY };
  c.classList.add('dragging');
  requestAnimationFrame(tick);
});
list.addEventListener('pointermove', function (e) { if (drag) { drag.y = e.clientY; place(); } });
// iOS: claim a touch on the grip at once, so Safari never starts its long-press (link menu) and cancels the drag (v2.13).
list.addEventListener('touchstart', function (e) {
  if (document.body.classList.contains('reorder') && e.target.closest('.grip')) e.preventDefault();
}, { passive: false });
function drop() {
  if (!drag) return;
  drag.card.classList.remove('dragging'); drag.card.style.transform = '';
  drag = null; saveOrder();
}
list.addEventListener('pointerup', drop);
list.addEventListener('pointercancel', drop);
applyOrder();   // coming Back from a page (bfcache) shows the new ticks
</script>
</body>
</html>
"""


def build_index(pages):
    """pages: list of (file name, info, mtime), newest first."""
    rows, data = [], {}
    for i, (name, info, mtime) in enumerate(pages):
        cat, cat_label = category(info["title"], name)
        n = len(info["keys"]) + info["tba"]
        day = datetime.date.fromtimestamp(mtime).isoformat()
        # A list-only icon in PoGo_Links/icons/<page stem>.png wins over the page's own first icon (e.g. the
        # PokéXciting rainbow wig standing for all the wig colours, made by scripts/pikachu_icons.py).
        override = f"icons/{os.path.splitext(name)[0]}.png"
        if os.path.exists(os.path.join(OUT, override)):
            icon = f'<img src="./{html.escape(override, quote=True)}" alt="">'
        elif info["icon"] and info["icon"].startswith("data:image/"):
            icon = f'<img src="{html.escape(info["icon"], quote=True)}" alt="">'
        else:
            icon = GLYPHS[cat]
        stem = os.path.splitext(name)[0]
        rows.append(
            f'<a class="card {cat}" href="./{html.escape(name, quote=True)}" data-file="{html.escape(name, quote=True)}" data-i="{i}">'
            f'<span class="ic">{icon}</span>'
            f'<span class="t">{html.escape(info["title"])}</span>'
            f'<span class="m"><span class="chip">{cat_label}</span><span><span class="n">{n}</span> place{"s" if n != 1 else ""}</span>'
            f'<span class="when" data-day="{day}" data-t="{int(mtime * 1000)}">updated {day}</span><span class="file">{html.escape(stem)}</span></span>'
            f'<span class="bar"><span class="track"><span class="fill"></span></span><span class="lbl">{n} places</span></span></a>'
        )
        data[name] = {"storage": info["storage"] or "", "keys": info["keys"], "tba": info["tba"], "open": info["open"],
                      "expires": info["expires"]}
    stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    places = sum(len(i["keys"]) + i["tba"] for _, i, _ in pages)
    out = PAGE
    for k, v in (("__STAMP__", stamp), ("__VERSION__", LIST_VERSION), ("__FIRST__", FIRST_YEAR), ("__PAGES__", str(len(pages))),
                 ("__PLACES__", f"{places:,}"), ("__ROWS__", "\n".join(rows)),
                 ("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c"))):
        out = out.replace(k, v)
    return out


def page_date(path):
    """When a page was last published: its last commit, or now if it has uncommitted changes (about to be published).
    2026-10-10 BEFORE: the Drive file's modified time. WHY: the list is now also rebuilt by a GitHub job, which has no
    Drive; one source of dates wherever it runs. NOW: git."""
    rel = os.path.relpath(path, REPO)
    if git("status", "--porcelain", "--", rel, check=False):
        return datetime.datetime.now().timestamp()
    ts = git("log", "-1", "--format=%ct", "--", rel, check=False)
    return float(ts) if ts else os.path.getmtime(path)


def site_pages():
    """The pages on the site (PoGo_Links/*.html except the list itself).
    2026-10-11: the unlisted JoyRoute links page (joyroute.html) existed for a few hours and was dropped for the list
    page's ?joyroute=on|off switch (Bart: one pattern with the Pokémap map sites)."""
    return sorted(unicodedata.normalize("NFC", f) for f in os.listdir(OUT) if f.endswith(".html") and f != "index.html")


def write_index():
    """Rebuild PoGo_Links/index.html from the pages on the site, newest first. Returns True if it changed."""
    pages = sorted(((n, page_info(os.path.join(OUT, n)), page_date(os.path.join(OUT, n))) for n in site_pages()),
                   key=lambda t: t[2], reverse=True)
    index = os.path.join(OUT, "index.html")
    old = open(index, encoding="utf-8").read() if os.path.exists(index) else ""
    new_index = build_index(pages)
    # Ignore the generated timestamp when deciding whether the list changed.
    strip = lambda s: re.sub(r"(on|Published) \d{4}-\d\d-\d\d \d\d:\d\d", "", s)
    if strip(old) == strip(new_index):
        return False
    with open(index, "w", encoding="utf-8") as f:
        f.write(new_index)
    return True


def expired_pages(now=None):
    """Pages whose pogolinks-expires time has passed (file names)."""
    now = now or datetime.datetime.now(datetime.timezone.utc)
    out = []
    for n in site_pages():
        exp = page_info(os.path.join(OUT, n))["expires"]
        if not exp:
            continue
        try:
            when = datetime.datetime.fromisoformat(exp.replace("Z", "+00:00"))
        except ValueError:
            continue
        if when <= now:
            out.append(n)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-n", "--dry-run", action="store_true")
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--src", help="also import every .html in this folder first (e.g. old pages from the Drive archive)")
    ap.add_argument("--index-only", action="store_true",
                    help="only rebuild the list (no pull, no commit): used by the GitHub job in BartmanEH/pogo-links-inbox")
    ap.add_argument("--expire", action="store_true",
                    help="delete pages past their pogolinks-expires time and rebuild the list (no pull, no commit): used by "
                         "the scheduled job in BartmanEH/pogo-links-inbox; prints one 'Expired: <file>' line per page")
    a = ap.parse_args()

    if a.expire:
        for n in expired_pages():
            os.remove(os.path.join(OUT, n))
            print("Expired: " + n)
        print("List changed." if write_index() else "List unchanged.")
        return

    if a.index_only:
        print("List changed." if write_index() else "List unchanged.")
        return

    # Several Macs, one repo, and the inbox job pushes Exports: never publish onto a stale checkout.
    git("fetch", "-q")
    ahead_behind = git("rev-list", "--left-right", "--count", "HEAD...@{u}").split()
    if ahead_behind[1] != "0":
        if git("status", "--porcelain", "--untracked-files=no") or a.dry_run:
            sys.exit("This checkout is behind GitHub. Pull first (git pull --ff-only).")
        git("pull", "-q", "--ff-only")

    # 2026-10-10 BEFORE: pages were copied from Google Drive "Other/Pokémon GO/web pages w links/" (the default source).
    # WHY: Bart abandoned Drive: Exports publish themselves (pogo-links-inbox) and the coord-link-page skill writes its
    # pages straight into PoGo_Links/. NOW: the pages in PoGo_Links/ are the source; --src imports from a folder if asked.
    if a.src:
        for p in sorted(glob.glob(os.path.join(a.src, "*.html"))):
            name = unicodedata.normalize("NFC", os.path.basename(p))
            dst = os.path.join(OUT, name)
            new = open(p, "rb").read()
            if os.path.exists(dst) and open(dst, "rb").read() == new:
                continue
            print(("Updated: " if os.path.exists(dst) else "Added: ") + name)
            if not a.dry_run:
                with open(dst, "wb") as f:
                    f.write(new)

    changed = [l[3:] for l in git("status", "--porcelain", "PoGo_Links").splitlines() if l[3:].endswith(".html")]
    if a.dry_run:
        print("Would publish: " + (", ".join(changed) if changed else "nothing (only the list may refresh)"))
        return
    write_index()
    git("add", "-A", "PoGo_Links")
    if not git("status", "--porcelain", "PoGo_Links"):
        print("Nothing to publish.")
        return
    pages = [os.path.basename(c) for c in changed if not c.endswith("index.html")]
    git("commit", "-q", "-m", "PoGo Links: publish (" + (", ".join(pages) if pages else "list refreshed") + ")")
    if a.no_push:
        print("Committed, not pushed (--no-push).")
        return
    git("push", "-q")
    print("Pushed. Live in a minute or two: https://bartmaneh.github.io/PoGo_Links/")


if __name__ == "__main__":
    main()
