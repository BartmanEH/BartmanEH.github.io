# CLAUDE.md

Bart's GitHub Pages site: static HTML/JS, served from `main`. Deploy by **pushing straight to `main`** (no pull
requests); batch changes and push when Bart says the batch is done. Each tool is documented in `README.md`; read its
section before changing it. `npm run lint` is the local check.

**Lint must be clean (0 errors, 0 warnings) before every push** (Bart, 2026-10-14). Since 2026-10-14 it covers the
`<script>` blocks inside every `.html` page too (eslint-plugin-html), generated pages included: the PoGO link pages
(coord-link-page skill's `page_template.html` / `build_page.py` / `rerender_page.py`), the list page (`publish.py`) and
Pokémap's quest Exports. Fix problems in the generator, then re-render; never hand-edit generated output only. Only
third-party minified files (`*.min.js`) are ignored. On a new Mac run `npm install` once (node_modules is git-ignored).
VS Code's ESLint extension shows the same problems in HTML files via `.vscode/settings.json` (`eslint.validate`).
