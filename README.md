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

# PoGO Link Pages

https://bartmaneh.github.io/PoGo_Links/ lists Bart's Pokémon GO link pages (made by the coord-link-page skill and the
Pokémap quest Export). The pages live in Google Drive, `Other/Pokémon GO/web pages w links/`; Drive can't serve them
as web pages, so they are copied here.

- Publish after adding, changing or deleting a page in Drive: `python3 -I PoGo_Links/scripts/publish.py`
  (`-n` = dry run). It copies the pages unchanged, removes ones no longer in Drive, rebuilds the list, commits
  and pushes. GitHub Pages is live a minute or two later.
- Don't edit `PoGo_Links/*.html` here: the next publish overwrites them from Drive.
- The list can be reordered by drag and drop (Reorder → drag a card's grip → Done; Reset = newest first). The order
  is saved per browser (localStorage `pogolinks.order.v1`); pages not in it (new ones) show on top, newest first.
- A list-only icon can override a page's own: `PoGo_Links/icons/<page file stem>.png`. The Pikachu ones (ESA, Seoul
  hanbok, the PokéXciting rainbow wig) are made by `PoGo_Links/scripts/pikachu_icons.py` with one shared crop, so
  they're the same size, as in the game.
  The others come from PokeMiners/pogo_assets (official in-game art): stamp-rally collection icons
  (`Images/StampRally/CollectionIcon/`), Pokémon icons (`Images/Pokemon - 256x256/Addressable Assets/`) and location
  backgrounds (`Images/LocationCards/`), trimmed to a 132 px square. Sources per page: the coord-link-page skill's
  `references/sources.md`.
- The pages are public but not advertised: `robots.txt` keeps search engines out of `/PoGo_Links/`.
- Done ticks are saved per browser and per site, so ticks from copies opened elsewhere (e.g. Solid Explorer)
  don't carry over; use a page's Export progress / Import progress buttons to move them.
