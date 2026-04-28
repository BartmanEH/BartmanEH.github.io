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

Do this whenever new Pokémon are added to the old `Pokemon-shiny` site (e.g. Orthworm) or when the live `pm2026` sheet gets new debut dates. All commands are run from the **repository root** (not from inside `URL_converter/`).

### Step-by-step update process

**1. Rebuild the mapping** (fetches the live `pm2026` sheet, outputs `data/current-mapping.json`):

```bash
npm run build:mapping
```

**2. Rebuild the classic crosswalk** (fetches `Pokemon-shiny/pms.json` and re-resolves all legacy ids against the new mapping, outputs `data/classic-crosswalk.json`). Always run this after step 1:

```bash
npm run build:classic-crosswalk
```

**3. Run the regression test** to confirm the known-case URLs still convert cleanly. If the test fails you need to update the expected hashes in `URL_converter/scripts/test-converter.mjs` to match the new output (the test prints the actual hash):

```bash
npm test
```

**4. Update the snapshot date** in `URL_converter/index.html` — search for the string `"data snapshot from"` and change the date to today's date (matches the `effectiveDate` written by `build:mapping`).

**5. Bump the version** in `URL_converter/index.html` — search for `id="version"` and increment the version string.

**6. Commit and push.**

### Notes on the build scripts

The mapping builder preserves legacy flat indices by reading the existing `data/current-mapping.json` and matching rows by `pid`, with a family/group fallback for simple renames. New Pokémon with no legacy equivalent receive a synthetic index appended after the current maximum.

Rows only count as released if they have a non-empty `debut` date earlier than today's date. To pin an older effective date:

```bash
cd URL_converter && python3 scripts/build_mapping.py --effective-date 2026-04-19
```

The classic crosswalk resolves old ids such as `25_4thY` or `710_xs` to current `pid`s ahead of time so the GitHub Pages app can stay fully static. Classic summary counts do not always line up 1:1 with the new app's cards — duplicated classic ids collapse to a single current row in the converted result.

## Running the known-case test

```bash
npm test
```
