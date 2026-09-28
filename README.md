# Take One

A tool that teaches the language of shots and helps you plan them. Made for people who make short films with a phone or a small camera.

Three tabs:

- **Learn.** Eleven chapters with drawings: shot sizes, framing, camera angles, camera movements, lenses, rules of the cut, exposure for video, light, sound, and sources.
- **Coverage.** Ten starting shot sets for common kinds of scene, from two people talking to the passage of time. Each one drops into a scene with one click.
- **Shot list.** Films, scenes and shots. Each shot has a size, framing, angle, move, lens, description and notes. A coach panel shows the drawings for the choices you made and warns about combinations that fight each other. A stage per shot lets you place cast and props and produces the shot's frame. A board view shows each scene as a storyboard.

## Run it

Everything is static. Open `index.html` through any local web server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening the file directly also works in most browsers, but the fonts and the store will be missing.

## Structure

```
index.html        page skeleton: header, tabs, three empty views
css/app.css       all styles; colour tokens at the top, light and dark
js/data.js        vocabulary and coverage recipes (the content)
js/drawings.js    SVG drawings: the figure, compositions, diagrams
js/stage.js       people and props per shot, frame rendering, framing detection
js/learn.js       Learn tab chapters and navigation
js/storage.js     state, private store, browser storage fallback
js/list.js        Shot list tab: films, scenes, shots, board view, exports
js/coverage.js    Coverage tab
js/app.js         tabs and boot
```

The scripts are plain scripts loaded in order, sharing one global scope. No build step, no framework, no dependencies beyond three Google Fonts.

## Storage

When the page runs as a claude.ai artifact, it uses the artifact's document store with the `db`, `user` and `downloads` capabilities. Each signed-in viewer's films live under their own private subtree (`data/users/<id>/notebook/films/<filmId>`), so nobody else can read them. Outside that host, or for a visitor without an identity, films live in the browser's local storage and the page says so.

## Data model

```
film   { id, title, logline, cast: [{id, name, color}], createdAt, updatedAt, scenes: [scene] }
scene  { id, heading, description, shots: [shot] }
shot   { id, size, framing, angle, move, lens, description, notes, done, stage? }
stage  { items: [{ id, kind: 'cast'|'prop', ref, x, z, face, pose }] }
```

`size`, `framing`, `angle` and `move` are ids from `js/data.js`. `lens` is one of the labels in `LENSES`. `x` is the horizontal position in figure units, `z` is depth (0 front, 1 middle, 2 back).

## Publishing

The live page is published as a claude.ai artifact from these files: `index.html` as the page and the `css` and `js` folders as supporting files. The published skeleton adds the doctype, head and a small reset; `index.html` starts with `<title>`.

The same files also go to GitHub Pages, served at https://take-one.gbsims.com (custom domain set in the repo's Pages settings, DNS is a CNAME to `leviosa-consulting.github.io`). The workflow in `.github/workflows/pages.yml` runs on every push to `main`. It adds the doctype and head that the artifact host would add. On Pages there is no store, so films stay in the visitor's browser.

## Sources

The vocabulary follows the standard film-school material (StudioBinder's guides; Katz, *Film Directing: Shot by Shot*; Brown, *Cinematography: Theory and Practice*; Mercado, *The Filmmaker's Eye*). The two-person dialogue recipe matches those sources. The other recipes are arrangements of the same building blocks. The Sources chapter in the Learn tab lists the links.
