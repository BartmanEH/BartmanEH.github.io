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
- A list-only icon can override a page's own: `PoGo_Links/icons/<page file stem>.png` (e.g. the PokéXciting
  rainbow wig, made by `PoGo_Links/scripts/rainbow_wig.py` from the page's four wig icons).
- The pages are public but not advertised: `robots.txt` keeps search engines out of `/PoGo_Links/`.
- Done ticks are saved per browser and per site, so ticks from copies opened elsewhere (e.g. Solid Explorer)
  don't carry over; use a page's Export progress / Import progress buttons to move them.
