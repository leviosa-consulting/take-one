# Take One: notes for working sessions

Read README.md first for what the tool is and how the files fit together.

## Conventions

- Plain HTML, CSS and JavaScript. No build step, no framework. Keep it that way unless the owner decides otherwise.
- The page has no npm dependencies. `server/` is the one place with npm packages: Node, Express, better-sqlite3 and Google's auth library.
- Scripts are classic scripts loaded in order from `index.html`; they share one global scope. Add a new file by adding a `<script>` tag in the right place.
- Content lives in `js/data.js`. Drawings live in `js/drawings.js`. Keep content changes out of rendering code.
- All drawings are inline SVG strings built by functions. Colours come from CSS tokens (`var(--ink)` and friends) so they follow light and dark themes.
- Advice in the content is general: phones and small cameras, no brand, model or one person's gear.
- Writing style: active voice, short sentences, no em dashes.

## Storage rules

- The page must work with no store at all (browser storage fallback). Never assume `window.claude` or the `/api` server exists.
- The server stores each film as the JSON the page sends. It checks the shape only lightly; the page owns the data model.
- Schema changes go in a new entry in `MIGRATIONS` in `server/db.js`. Never edit an entry that has shipped.
- Every API write needs the `X-Take-One: 1` header (CSRF guard). Keep it on new routes.
- One write at a time per film; writes are debounced in `storage.js`. Do not write from render code.
- Old data shapes are converted in `normalize()` in `list.js`. Add a conversion there when a field changes meaning; never break saved films.

## Checking a change

Run `cd server && npm test` for the API. For the page, run the server (see README) or `python3 -m http.server 8000`, open it, and click through Learn, Coverage and Shot list. A Playwright screenshot script is fine for a quick look, but do not build a test loop around it.

## Publishing

The live artifact is published from these files with the Artifact tool: `index.html` as the page, `css/` and `js/` as supporting files, capabilities `{db: {}, user: {}, downloads: true}`. Republish to the same URL; never create a second artifact.

The public site is https://take-one.gbsims.com, served by `server/` on the gbsims.com droplet behind Caddy. `.github/workflows/deploy.yml` tests and deploys it on every push to `main`. See `deploy/README.md`.

## Open items, in priority order

1. Reference images per shot and location photos per scene. Store files in `/var/lib/take-one/uploads`, with a `files` table in a new migration.
2. Setups (camera positions) and a shoot-order view.
3. Character names in coverage recipes.
4. Shots without a stage still draw every angle except Dutch at eye level.
