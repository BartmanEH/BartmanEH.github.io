# CLAUDE.md

Bart's GitHub Pages user site (`bartmaneh.github.io`), plain static HTML/JS, no build step. `README.md` documents each
tool; read the relevant section before changing one.

## Deploying

- The site serves from `main`; a push to `main` is live in a minute or two.
- Bart deploys by **pushing straight to `main`**: no pull requests (they're noise to him). Batch related changes,
  then push to `main` when he says the batch is done.
- `npm run lint` (ESLint) is the local check.

## Local Event Times (`Event_Times/index.html`)

- Places live in the `places` array inside the page's script (`var D = {"places":[...]`, one line): `name`, `region`,
  `tz`, `lat`, `lon`, `key` (`first` / `last` / `Pokémap` = shown in the Key view; `""` = All zones only).
- Bumping `#version` in the footer (currently v1.1) helps Bart see a deploy has landed.
- Map button switch **Maps | PoGoMap**. PoGoMap's link format is
  `https://www.pogomap.info/location/<lat>/<lon>/17` with **decimal commas** (`45,385069`), confirmed on his phone;
  `lat,lng` with dots opens London (the site's default).

### Coordinate tweaks (in progress, started 2026-10-14)

Bart scouts each place on pogomap.info (opens via the PoGoMap button), taps ⓘ on a gym/stop and sends the
coordinates shown there; replace that place's `lat`/`lon` with them as given. pogomap.info and the live site are
blocked from cloud sessions, so the links can't be checked from there.

- Done: Kiritimati (Unity Mini Stadium), Waitangi, Apia, Nukuʻalofa.
- Next in All-zones order: Auckland, then the rest. Places are listed in data order, not the order the page shows
  (the page sorts by when the event reaches each place, which shifts with daylight saving).
