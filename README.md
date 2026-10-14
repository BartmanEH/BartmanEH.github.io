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
- **Quest Exports expire** (Pokémap 7.53+, list v2.15, 2026-10-13; Bart: quests change every day): each Export carries
  `<meta name="pogolinks-expires" content="<UTC time>">` = the next midnight in its map's city. After that the list hides
  it, the page shows a red Expired bar, and the inbox repo's scheduled job (`expire.yml`, just after each map's midnight
  plus a 05:00-local fallback) deletes it from both repos with `publish.py --expire`. Only pages with that meta expire;
  link pages never do. Git history keeps the deleted pages.
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
  A page with `<meta name="pogolinks-open" content="why">` never shows "Complete" (v2.8): used by the LEGO page while
  the game doesn't list that rally as completed; remove the meta when it does.
- Titles: em dashes closed up (The Canadian Style); long titles are condensed to one line by script (tighter letter
  spacing, then smaller text, never below 12 px).
- Reorder: Reorder → drag a card's grip → Done; Reset = newest first. Saved per browser (localStorage
  `pogolinks.order.v1`); pages not in it (new ones) show on top, newest first.
- Header: Poké Ball, "BartmanEH's PoGO Link Pages", the IES logo linking home. Footer: Bart's standard (see the shared
  notes), sticky at the bottom of the screen with the version just below the edge until you reach the end.

## JoyRoute links (`?joyroute=on|off`)

The list page switches a per-browser setting when opened with `?joyroute=on` or `?joyroute=off` (localStorage `joyroute`,
shared by every page on the site) and confirms it in a note under the tiles (v2.9). On, link pages' GPS JoyStick buttons use
`joyroute://teleport?…` (Bart's JoyRoute app teleports GPS JoyStick in the background, then opens Pokémon GO) instead of
`gpsjoystick://`; the pages read it once (`USE_JOYROUTE` in the coord-link-page template and the Pokémap Export). JoyRoute's
Settings (gear) has the On/Off links, next to the same switch for the Pokémap map sites. 2026-10-11: replaced a separate
unlisted switch page (joyroute.html) so link pages and map sites work the same way. Details: the joyroute repo's README.

## Icons

- A list-only icon in `PoGo_Links/icons/<page file stem>.png` replaces a page's own first icon (pages without either
  get a category glyph). All are official in-game art from PokeMiners/pogo_assets, made by two scripts that reproduce
  the committed files exactly:
  - `scripts/pikachu_icons.py`: ESA astronaut, Seoul hanbok and the PokéXciting rainbow wig (shiny variants;
    the Asia-Pacific rally page keeps it on purpose instead of its rally badge, Bart's exception 2026-10-11; one shared
    crop so they're the same size, as in the game).
  - `scripts/badge_icons.py`: Poké Lid, Pokémon Center, Japan rallies (generic stamp), PokéXciting Malaysia (its
    regional badge) and the LEGO page (the rally's green Pikachu stamp), every circle the same size.
- Every new page gets one, as a normal step before publishing (Bart, 2026-10-11): look in PokeMiners/pogo_assets first
  (it's canonical), add it to one of the scripts, run it (the other icons must come out unchanged), commit.

## Other

- The pages are public but not advertised: `robots.txt` keeps search engines out of `/PoGo_Links/`.
- `favicon.ico` at the site root: pages without an icon link (the link pages) ask for it.
- Done ticks are saved per browser and per site, so ticks from copies opened elsewhere (e.g. Solid Explorer)
  don't carry over; use a page's Export progress / Import progress buttons to move them.

# Local Event Times (`Event_Times/`)

When an event that starts at the same **local** time everywhere (e.g. a Pokémon GO event at 6:00 pm local) reaches each
time zone, in your own time. From Bart's "Event Times" Google Sheets (2026-10-13). One static page, no server: the
browser's own time-zone data does the maths, so daylight saving is right for any date.

- Inputs (remembered per browser): event date, local start time, duration (default 3 h; None = started places stay
  neutral), your time zone (the browser's by default).
- Switches: **Key** (first and last in the world + the 5 Pokémap cities) | **All zones** (42 places, one per UTC offset or
  daylight-saving rule, incl. the half/quarter-hour ones), and iPogo | GPS JoyStick (shared with the link pages; GPS JoyStick goes
  through JoyRoute when `?joyroute=on` is set, see "JoyRoute links"), and on its own row **Maps** | **PoGoMap** (the
  map button opens Google Maps or pogomap.info at the place, `/location/<lat>/<lon>/17` with decimal commas;
  remembered per browser).
- Rows in the order the event reaches them; stoplight states: live = green, next to start = orange, finished = dark
  card with a dark red outline. The "now" line and **Go to now** scroll to the live (or next) places, leaving one
  finished place above; the page does this once on opening.
- Places: the Sheet's 39 (Vanuatu's zone fixed to `Pacific/Efate`, old zone names updated) + 8 missing offsets
  (Marquesas, Tehran, Kabul, Kathmandu, Yangon, Eucla, Lord Howe, Chatham), all checked on land with OpenStreetMap's
  reverse lookup; 6 moved to city centres (Adelaide, Anchorage, Adak were in or by the water). Open idea: use each
  zone's most populous place. 2026-10-14: 5 dropped that matched another place's offset all year (Wake Island,
  Nukuʻalofa, Seoul, Taipei, Midway; Bart kept Suva, Apia, Tokyo, Singapore, Pago Pago). The list is the `places`
  data inside the page's script.
  Each entry: `name`, `region`, `tz`, `lat`, `lon`, `key` (`first` / `last` / `Pokémap` = in the Key view; `""` = All
  zones only), `site` (Pokémap places: the city's map site, shown as a **Pokémap ↗** badge link). The footer version
  (`#version`, v1.2) shows a deploy has landed.
- Coordinate tweaks (started 2026-10-14): Bart scouts each place on pogomap.info (the PoGoMap button), taps ⓘ on a
  gym or stop and sends the coordinates shown there, which replace that place's `lat`/`lon` as given. Done: Kiritimati
  (Unity Mini Stadium), Waitangi, Apia, Auckland, Suva, Port Vila, Lord Howe Island, Sydney, Adelaide, Gold Coast (was Brisbane), Tokyo, Eucla, Singapore, Bangkok, Yangon, Dhaka, Kathmandu, Mumbai, Karachi, Kabul, Dubai, Tehran, Baghdad, Athens, Amsterdam (was Brussels), London, Reykjavik, Praia, Nuuk, Fernando de Noronha, St. John's, Halifax, New York (the NYC Pokémap's Default spot); next in All zones order: Chicago. pogomap.info and the
  live site can't be reached from cloud sessions, so check links on a phone.
- Root-page button "Local Event Times", second (after PoGO Link Pages).
