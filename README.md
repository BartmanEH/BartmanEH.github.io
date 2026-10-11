# Wordle Solver
<ul class="main-ul">
  <li>Enter your guess words for NYT <a href="https://www.nytimes.com/games/wordle/index.html">Wordle</a></li>
  <li>Results are automatic for today's answer</li>
    <ul>
      <li>Black:&nbsp;&nbsp;&nbsp;exclude letter</li>
      <li>Yellow:&nbsp;include letter, wrong position</li>
      <li>Green:&nbsp;&nbsp;include letter, correct position</li>
    </ul>
  </li>
  <li>Possible answers will be shown (scroll down!)</li>
  <li>Other features:</li>
    <ul>
      <li>Tap Wordle Solver logo to reset</li>
      <li>Tap the Date Picker to play a Wordle Archive date</li>
        <ul>
          <li>...or the day# to choose day directly</li>
        </ul>
      </li>
      <li>Tap Bart image in footer for manual results mode</li>
        <ul>
          <li>Then tap each guess letter to match Wordle results</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>

Files use Unix (LF) line endings; the last two with Windows ones (`DVB_Calc/index.html`, `DVB_Calc/main_form.js`)
were converted on 2026-10-10, like the Pi site's (innoengserv) on 2026-10-09.

# PoGO Link Pages

https://bartmaneh.github.io/PoGo_Links/ lists Bart's Pokémon GO link pages (made by the coord-link-page skill and the
Pokémap quest Export). The pages live here, in `PoGo_Links/` (since 2026-10-10; before that they were copied from
Google Drive `Other/Pokémon GO/web pages w links/`, now an untouched archive).

## On any Mac

- Clone this repo (Bart's Macs: `~/Documents/VS Code/BartmanEH.github.io`) and `git pull` before working; commit and
  push at the end, never force-push.
- Publishing needs only this repo (and `gh`/git logged in to GitHub). No Google Drive.
- Icon scripts need Pillow, which isn't installed system-wide: `python3 -m venv /tmp/v && /tmp/v/bin/pip install pillow`,
  then run them with `/tmp/v/bin/python -I PoGo_Links/scripts/<script>.py`.
- Preview locally before pushing: `python3 -m http.server 8765` in the repo, open http://localhost:8765/PoGo_Links/
  at 412 px wide (Bart's Pixel 6 Pro and OnePlus 8; no need to go narrower) and measure: header, tiles, cards and
  footer all span the same 16–396 px, no sideways scroll.
- Background (map links, icon sources, KML quirks, sizing rules): the coord-link-page skill's
  `references/sources.md` (BartmanEH/claude-skills, `~/.claude/skills`).

## Publishing

- **Pokémap quest Exports publish themselves** (Pokémap 7.38+, 2026-10-10): each Export uploads its page to the private
  repo BartmanEH/pogo-links-inbox, whose GitHub job copies it into `PoGo_Links/`, rebuilds the list
  (`publish.py --index-only`) and pushes. Event-driven, live in about 1 to 2 minutes, no Mac needed. Setup and tokens:
  that repo's README.
- Link pages (made by the coord-link-page skill): `git pull`, put the page's `.html` into `PoGo_Links/`, then
  `python3 -I PoGo_Links/scripts/publish.py` (`-n` = dry run, `--no-push`, `--src DIR` to import pages from a folder).
  It pulls, rebuilds `PoGo_Links/index.html`, commits and pushes. It never deletes pages: to take one down, delete the
  file and publish. List dates are each page's last commit. GitHub Pages is live a minute or two later.
- Always pull before editing pages here: the inbox job pushes Exports at any time. Git history is the backup. Never
  change a place's `key` in a page: Done ticks are stored by key.
- Don't edit `PoGo_Links/index.html` either: it is generated from the `PAGE` template in `publish.py`.

## The list page (`publish.py`)

- `LIST_VERSION` (shown in the footer; bump it and add a line to its comment whenever the list page changes) and
  `FIRST_YEAR` (the footer says "© 2026", widening by script to "© 2026–<this year>").
- Cards: icon, title, category chip (guessed from the title: quests / stamp rally / event), place count, "updated …"
  (the page's last commit), file name, and a progress bar read from each page's own Done ticks in localStorage
  (yellow in progress, green "Complete"). Stops still to be announced (no location yet, e.g. PokéXciting's
  Bangkok) count in a page's total, so it can't show "Complete" before they're done (v2.7).
- Titles: em dashes closed up (The Canadian Style); long titles are condensed to one line by script (tighter letter
  spacing, then smaller text, never below 12 px).
- Reorder: Reorder → drag a card's grip → Done; Reset = newest first. Saved per browser (localStorage
  `pogolinks.order.v1`); pages not in it (new ones) show on top, newest first.
- Header: Poké Ball, "BartmanEH's PoGO Link Pages", the IES logo linking home. Footer: Bart's standard (see the shared
  notes), sticky at the bottom of the screen with the version just below the edge until you reach the end.

## Icons

- A list-only icon in `PoGo_Links/icons/<page file stem>.png` replaces a page's own first icon (pages without either
  get a category glyph). All are official in-game art from PokeMiners/pogo_assets, made by two scripts that reproduce
  the committed files exactly:
  - `scripts/pikachu_icons.py`: ESA astronaut, Seoul hanbok and the PokéXciting rainbow wig (shiny variants, one shared
    crop so they're the same size, as in the game).
  - `scripts/badge_icons.py`: Poké Lid, Pokémon Center, Japan rallies (generic stamp) and the LEGO page (the rally's
    green Pikachu stamp), every circle the same size.
- New page? Look in PokeMiners/pogo_assets first (it's canonical); add it to one of the scripts, run it, commit.

## Other

- The pages are public but not advertised: `robots.txt` keeps search engines out of `/PoGo_Links/`.
- `favicon.ico` at the site root: pages without an icon link (the link pages) ask for it.
- Done ticks are saved per browser and per site, so ticks from copies opened elsewhere (e.g. Solid Explorer)
  don't carry over; use a page's Export progress / Import progress buttons to move them.
