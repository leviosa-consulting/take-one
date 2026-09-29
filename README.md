# Take One

A tool that teaches the language of shots and helps you plan them. Made for people who make short films with a phone or a small camera.

Three tabs:

- **Learn.** Eleven chapters with drawings: shot sizes, framing, camera angles, camera movements, lenses, rules of the cut, exposure for video, light, sound, and sources.
- **Coverage.** Ten starting shot sets for common kinds of scene, from two people talking to the passage of time. Each one drops into a scene with one click.
- **Shot list.** Films, scenes and shots. Each shot has a size, framing, angle, move, lens, length, description and notes. Scenes and the film show their running time, and each scene lists the props on set. A coach panel shows the drawings for the choices you made and warns about combinations that fight each other. A stage per shot lets you place cast and eighteen props, indoor and outdoor, and produces the shot's frame, seen from the shot's camera angle. The list warns when a shot crosses the line or an eyeline points the wrong way. A board view shows each scene as a storyboard.

## Run it

With accounts, through the server (needs Node.js 20 or newer):

```
cd server && npm install
GOOGLE_CLIENT_ID=<your client id> COOKIE_SECURE=0 npm start
```

Then open http://localhost:3310. `npm test` runs the API tests.

The page on its own, with films in the browser only, from any static web server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Structure

```
index.html        page skeleton: header, tabs, three empty views
css/app.css       all styles; colour tokens at the top, light and dark
js/data.js        vocabulary and coverage recipes (the content)
js/drawings.js    SVG drawings: the figure, compositions, diagrams
js/stage.js       people and props per shot, frame rendering per camera angle, framing detection
js/continuity.js  line-crossing and eyeline checks across the shots of a scene
js/learn.js       Learn tab chapters and navigation
js/storage.js     state, saving, the claude.ai store, browser storage fallback
js/account.js     Google sign-in and films saved through our server's /api
js/list.js        Shot list tab: films, scenes, shots, board view, exports
js/coverage.js    Coverage tab
js/app.js         tabs and boot
```

The scripts are plain scripts loaded in order, sharing one global scope. No build step, no framework, no dependencies beyond three Google Fonts.

```
server/index.js   entry point: settings from the environment, daily backups
server/app.js     HTTP: serves the page, the /api routes, sign-in and sessions
server/db.js      SQLite: users, sessions, films, and the schema migrations
server/test/      API tests with a stand-in for Google
deploy/           server setup script and the guide to running it
```

## Storage

On take-one.gbsims.com the page talks to our server. People sign in with Google. Each person's films are stored as JSON documents in SQLite, one row per film, and nobody else can read them. Signed out, films live in the browser, and on first sign-in the page offers to move them into the account. The session is an HttpOnly cookie that lasts 30 days.

When the page runs as a claude.ai artifact, it uses the artifact's document store with the `db`, `user` and `downloads` capabilities. Each signed-in viewer's films live under their own private subtree (`data/users/<id>/notebook/films/<filmId>`), so nobody else can read them. Outside that host, or for a visitor without an identity, films live in the browser's local storage and the page says so.

## Data model

```
film   { id, title, logline, cast: [{id, name, color}], createdAt, updatedAt, scenes: [scene] }
scene  { id, heading, description, shots: [shot] }
shot   { id, size, framing, angle, move, lens, dur?, description, notes, done, stage? }
stage  { items: [{ id, kind: 'cast'|'prop', ref, x, z, face, pose }] }
```

`size`, `framing`, `angle` and `move` are ids from `js/data.js`. `lens` is one of the labels in `LENSES`. `dur` is the shot's length in whole seconds; shots without one are left out of the totals. `x` is the horizontal position in figure units. `z` is depth from 0 (front) to 3; the menu names 0, 1 and 2 Front, Middle and Back, and dragging sets anything in between. Items further back are drawn first. At the same depth, the order of `items` decides: earlier is behind. The Behind and In front buttons change that order.

## Publishing

The live page is published as a claude.ai artifact from these files: `index.html` as the page and the `css` and `js` folders as supporting files. The published skeleton adds the doctype, head and a small reset; `index.html` starts with `<title>`.

The public site is https://take-one.gbsims.com, on the gbsims.com droplet behind Caddy. `.github/workflows/deploy.yml` tests the server and deploys on every push to `main`. The server adds the doctype and head, as the artifact host does. Setup, secrets and everyday tasks are in `deploy/README.md`.

## Sources

The vocabulary follows the standard film-school material (StudioBinder's guides; Katz, *Film Directing: Shot by Shot*; Brown, *Cinematography: Theory and Practice*; Mercado, *The Filmmaker's Eye*). The two-person dialogue recipe matches those sources. The other recipes are arrangements of the same building blocks. The Sources chapter in the Learn tab lists the links.
