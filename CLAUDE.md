# Take One: notes for working sessions

Read README.md first for what the tool is and how the files fit together.

## Conventions

- Plain HTML, CSS and JavaScript. No build step, no framework. Keep it that way unless the owner decides otherwise.
- Scripts are classic scripts loaded in order from `index.html`; they share one global scope. Add a new file by adding a `<script>` tag in the right place.
- Content lives in `js/data.js`. Drawings live in `js/drawings.js`. Keep content changes out of rendering code.
- All drawings are inline SVG strings built by functions. Colours come from CSS tokens (`var(--ink)` and friends) so they follow light and dark themes.
- Advice in the content is general: phones and small cameras, no brand, model or one person's gear.
- Writing style: active voice, short sentences, no em dashes.

## Storage rules

- The page must work with no store at all (browser storage fallback). Never assume `window.claude` exists.
- One write at a time per film; writes are debounced in `storage.js`. Do not write from render code.
- Old data shapes are converted in `normalize()` in `list.js`. Add a conversion there when a field changes meaning; never break saved films.

## Checking a change

Run `python3 -m http.server 8000`, open the page, and click through Learn, Coverage and Shot list. A Playwright screenshot script is fine for a quick look, but do not build a test loop around it.

## Publishing

The live artifact is published from these files with the Artifact tool: `index.html` as the page, `css/` and `js/` as supporting files, capabilities `{db: {}, user: {}, downloads: true}`. Republish to the same URL; never create a second artifact.

The public site is https://take-one.gbsims.com, on GitHub Pages. `.github/workflows/pages.yml` deploys it on every push to `main`. There it has no store, so films live in browser storage until a backend for login and saved films is added behind `storage.js`.

## Open items, in priority order

1. Duration per shot, with totals per scene.
2. Setups (camera positions) and a shoot-order view.
3. Character names in coverage recipes.
4. Shots without a stage still draw every angle except Dutch at eye level.
