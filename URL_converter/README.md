# Shiny URL Converter

A static utility for converting legacy `pokemongo-shiny` and classic `Pokemon-shiny` URLs into the current grouped status format.

## What it does

- Accepts an old long URL with `?status=...`
- Accepts classic `https://rplus.github.io/Pokemon-shiny/?dex=...&own=...&offer=...` URLs
- Accepts a raw legacy flat status string
- Tries to resolve TinyURL input in-browser
- Emits a current-format URL for `https://rplus.github.io/pokemongo-shiny/`
- Shows migration notes for dropped or duplicated legacy index positions

## GitHub Pages deployment

This project is intentionally no-build:

1. Push these files to a GitHub repository.
2. Enable GitHub Pages for the repo and serve from the repository root.
3. Open the published site.

`index.html` loads `data/current-mapping.json` directly, so no bundler or framework is required.

## TinyURL limitation

A pure static site cannot reliably resolve every third-party short URL because browsers often block cross-origin redirect inspection. The app tries anyway, but the fallback path is:

1. Open the TinyURL once.
2. Copy the final long URL from the address bar.
3. Paste that long URL into the converter.

That path works fully client-side on GitHub Pages.

## Refreshing the data snapshots

The bundled files are snapshots of:

- the current grouped checklist layout from the live `pm2026` custom URL sheet feed
- the classic `Pokemon-shiny` legacy id crosswalk

To rebuild the current grouped snapshot:

```bash
npm run build:mapping
```

The mapping builder follows the same default source the live webpage uses for its custom URL setting: the `pm2026` sheet feed exposed through `opensheet`.

If that live sheet feed has no `_index`, the refresh script will preserve legacy flat indices by reading the previous `data/current-mapping.json` and matching rows by `pid`, with a family/group fallback for simple renames.

Rows only count as released if they have a non-empty `debut` date earlier than the chosen effective date, matching the live page's filtering. Placeholder rows without a release date are skipped.

To rebuild the classic crosswalk:

```bash
npm run build:classic-crosswalk
```

The classic crosswalk is written to `data/classic-crosswalk.json`. It resolves old ids such as `25_4thY` or `710_xs` to current `pid`s ahead of time so the GitHub Pages app can stay fully static.

Classic summary counts do not always line up 1:1 with the new app's cards. The old `Pokemon-shiny` app counts raw `dex`/`own`/`offer` bucket entries, while the new app counts current released rows and surfaces `extra` separately. Duplicated classic ids therefore collapse to a single current row in the converted result.

You can also pin the effective date:

```bash
python3 scripts/build_mapping.py --effective-date 2026-04-19
```

## Running the known-case test

```bash
npm test
```
