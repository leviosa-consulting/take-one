// Shot list tab: films, scenes, shots, board view, exports.
function renderFilmSelect() {
  const sel = document.getElementById('film-select');
  const films = filmList();
  sel.innerHTML = films.map(f => `<option value="${f.id}" ${f.id === state.currentId ? 'selected' : ''}>${esc(f.title || 'Untitled film')}</option>`).join('') || '<option value="">No films yet</option>';
  sel.disabled = !films.length;
}
function shotLabel(sceneIdx, shotIdx) { return `${sceneIdx + 1}${String.fromCharCode(65 + (shotIdx % 26))}${shotIdx >= 26 ? Math.floor(shotIdx / 26) : ''}`; }
function opts(list, val, key = 'id', label = 'name') { return list.map(o => { const v = typeof o === 'string' ? o : o[key], l = typeof o === 'string' ? o : `${o.abbr} · ${o[label]}`; return `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(l)}</option>`; }).join(''); }
const ICONS = {
  up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg>',
  down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5"/></svg>',
  trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4h10M6 4V2.5h4V4M4.5 4l.7 9h5.6l.7-9"/></svg>',
  dup: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="8" height="8" rx="1"/><path d="M3 11V3h8"/></svg>',
  coach: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.2"/></svg>',
  stage: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="5.5" cy="4.5" r="2"/><path d="M2.5 13v-3a3 3 0 0 1 6 0v3"/><circle cx="11.5" cy="5.5" r="1.6"/><path d="M9.5 13v-2.5a2 2 0 0 1 4 0V13"/></svg>',
};
function tipsFor(shot) {
  const t = [];
  if ((shot.size === 'CU' || shot.size === 'ECU') && shot.lens.startsWith('0.5')) t.push('A 0.5× lens this close will stretch the face. Use 2× and step back.');
  if ((shot.size === 'EWS' || shot.size === 'EST') && (shot.lens.startsWith('2') || shot.lens.startsWith('5'))) t.push('A wide shot on a long lens needs a lot of distance. 1× or 0.5× is easier indoors.');
  if (shot.lens.startsWith('5') && (shot.size === 'MS' || shot.size === 'MWS' || shot.size === 'WS')) t.push('5× needs four to five metres for a medium shot. Check the room is long enough.');
  if (shot.lens.startsWith('0.5') && shot.framing === 'ots') t.push('An over-the-shoulder on 0.5× makes the foreground head huge and the far face tiny. Use 2×.');
  if (shot.move === 'zoom') t.push('Phones only zoom optically at 0.5×, 1× and 2×. A smooth zoom will be digital and soft.');
  if (shot.move === 'handheld' && (shot.size === 'CU' || shot.size === 'ECU')) t.push('Handheld close-ups shake a lot. Brace your elbows or use a gimbal.');
  if (shot.angle === 'dutch') t.push('Dutch angles wear out fast. Make sure this one has a reason.');
  if (shot.framing === 'ots') t.push('Shoot the matching OTS from the same side of the line between the two actors.');
  if (shot.framing === 'insert' && shot.size !== 'ECU' && shot.size !== 'CU') t.push('Inserts are usually CU or ECU. A wider insert stops reading as a detail.');
  if ((shot.move === 'push' || shot.move === 'pull' || shot.move === 'arc' || shot.move === 'truck') && shot.size === 'ECU') t.push('A moving ECU is very hard to keep in focus on a phone. Consider a CU.');
  return t;
}
function coachPanel(shot) {
  const li = Math.max(0, LENSES.indexOf(shot.lens));
  const items = [['size', SIZE[shot.size]], ['framing', FRAME[shot.framing]], ['angle', ANGLE[shot.angle]], ['move', MOVE[shot.move]], ['lens', LENS_INFO[li]]];
  const tips = tipsFor(shot);
  return `<div class="coach"><div class="grid">${items.map(([k, it]) => it ? vocabCard(k, it) : '').join('')}</div>
    ${tips.length ? `<div class="tips">${tips.map(t => `<div class="tip">${esc(t)}</div>`).join('')}</div>` : ''}</div>`;
}
function shotCard(film, sceneIdx, shotIdx) {
  const scene = film.scenes[sceneIdx], shot = scene.shots[shotIdx];
  const open = state.expanded.has(shot.id), stageOpen = state.stageOpen === shot.id;
  return `<div class="shot ${shot.done ? 'done' : ''}" data-shot="${shot.id}">
    <div class="shot-row">
      <div class="thumb" title="${esc(SIZE[shot.size]?.name)}, ${esc(FRAME[shot.framing]?.name)}">${shotThumb(shot, film)}</div>
      <div class="shot-id">${shotLabel(sceneIdx, shotIdx)}</div>
      <div class="shot-main">
        <input class="desc" id="d-${shot.id}" data-f="description" value="${esc(shot.description)}" placeholder="What happens in this shot" aria-label="Shot description">
        <div class="chips">
          <span class="chip"><span class="k">Size</span><select data-f="size" id="s-${shot.id}" aria-label="Shot size">${opts(SIZES, shot.size)}</select></span>
          <span class="chip"><span class="k">Frame</span><select data-f="framing" id="f-${shot.id}" aria-label="Framing">${opts(FRAMING, shot.framing)}</select></span>
          <span class="chip"><span class="k">Angle</span><select data-f="angle" id="a-${shot.id}" aria-label="Camera angle">${opts(ANGLES, shot.angle)}</select></span>
          <span class="chip"><span class="k">Move</span><select data-f="move" id="m-${shot.id}" aria-label="Camera movement">${opts(MOVES, shot.move)}</select></span>
          <span class="chip"><span class="k">Lens</span><select data-f="lens" id="l-${shot.id}" aria-label="Lens">${opts(LENSES, shot.lens)}</select></span>
          <span class="chip notes"><input data-f="notes" id="n-${shot.id}" value="${esc(shot.notes)}" placeholder="Gear, lighting, sound notes" aria-label="Notes"></span>
        </div>
      </div>
      <div class="shot-actions">
        <label class="done-lbl"><input type="checkbox" data-f="done" id="c-${shot.id}" ${shot.done ? 'checked' : ''}> Shot</label>
        <div class="row">
          <button class="icon ${stageOpen ? 'on' : ''}" data-act="stage" title="Place people and props" aria-expanded="${stageOpen}">${ICONS.stage}</button>
          <button class="icon ${open ? 'on' : ''}" data-act="coach" title="Show the drawings for this shot" aria-expanded="${open}">${ICONS.coach}</button>
          <button class="icon" data-act="up" title="Move up">${ICONS.up}</button>
          <button class="icon" data-act="down" title="Move down">${ICONS.down}</button>
          <button class="icon" data-act="dup" title="Duplicate shot">${ICONS.dup}</button>
          <button class="icon danger" data-act="del" title="Delete shot">${ICONS.trash}</button>
        </div>
      </div>
    </div>
    ${stageOpen ? stagePanel(shot, film) : ''}
    ${open ? coachPanel(shot) : ''}
  </div>`;
}
function sceneBlock(film, i) {
  const sc = film.scenes[i];
  const done = sc.shots.filter(s => s.done).length;
  return `<section class="scene" data-scene="${sc.id}">
    <div class="scene-head">
      <div class="sc-badge"><small>Scene</small>${i + 1}</div>
      <div>
        <input class="heading" data-sf="heading" value="${esc(sc.heading)}" placeholder="INT. LOCATION - NIGHT" aria-label="Scene heading">
        <textarea class="desc" data-sf="description" rows="1" placeholder="One line on what happens in the scene" aria-label="Scene description">${esc(sc.description)}</textarea>
      </div>
      <div class="scene-tools">
        <span class="pill">${done}/${sc.shots.length} shot</span>
        <button class="btn small ghost" data-sact="up" title="Move scene up">${ICONS.up}</button>
        <button class="btn small ghost" data-sact="down" title="Move scene down">${ICONS.down}</button>
        <span class="del-slot"><button class="btn small ghost danger" data-sact="del">Delete scene</button></span>
      </div>
    </div>
    <div class="shots">${sc.shots.length ? sc.shots.map((_, j) => shotCard(film, i, j)).join('') : '<div class="empty-shots">No shots yet. Add one, or drop in the standard dialogue coverage.</div>'}</div>
    <div class="add-row">
      <button class="btn" data-sact="add">+ Add shot</button>
      <span class="chip recipe-pick"><span class="k">Add coverage</span><select data-sact="recipe" aria-label="Add coverage recipe"><option value="">choose a scene type…</option>${RECIPES.map(r => `<option value="${r.id}">${esc(r.name)} (${r.shots.length})</option>`).join('')}</select></span>
    </div>
  </section>`;
}
function normalize(film) {
  // shots saved by an earlier version used a framing value for the establishing shot
  film.scenes.forEach(sc => sc.shots.forEach(s => {
    if (s.framing === 'establishing') { s.framing = 'single'; s.size = 'EST'; }
    if (s.lens && !LENSES.includes(s.lens)) { const m = LENSES.find(l => l.split(' ')[0] === s.lens.split(' ')[0]); if (m) s.lens = m; }
  }));
}
function renderList() {
  const el = document.getElementById('view-list');
  const film = currentFilm();
  if (film) normalize(film);
  if (state.mode === 'loading' || (state.mode === 'db' && !state.ready && !film)) { el.innerHTML = '<div class="empty"><p>Loading your films…</p></div>'; placeTopRight(); return; }
  if (!film) {
    el.innerHTML = `<div class="empty"><h3>No film yet</h3><p>Start with a blank film, or load the example film to see how a list reads.</p>
      <div class="acts"><button class="btn primary" id="e-new">New film</button><button class="btn" id="e-example">Load the example</button></div></div>`;
    el.querySelector('#e-new').onclick = () => addFilm(newFilm());
    el.querySelector('#e-example').onclick = () => addFilm(exampleFilm());
    placeTopRight();
    return;
  }
  const shots = film.scenes.reduce((n, s) => n + s.shots.length, 0), done = film.scenes.reduce((n, s) => n + s.shots.filter(x => x.done).length, 0);
  const moving = film.scenes.reduce((n, s) => n + s.shots.filter(x => x.move !== 'static').length, 0);
  el.innerHTML = `
    <div class="film-head">
      <div><input class="title" id="film-title" value="${esc(film.title)}" placeholder="Film title" aria-label="Film title">
        <input class="logline" id="film-logline" value="${esc(film.logline || '')}" placeholder="Logline or a note about this shoot" aria-label="Logline">
        <div class="cast-row"><span class="lbl-inline">Cast</span>${(film.cast || []).map(c => `<span class="cast-chip"><i class="dot" style="background:${c.color}"></i>${esc(c.name)}<button class="x" data-cast-del="${c.id}" title="Remove ${esc(c.name)}">\u00d7</button></span>`).join('')}
          <span class="cast-add"><input class="ctl" id="cast-new" placeholder="Add a character" aria-label="New character name" maxlength="24"><button class="btn small" id="cast-add">Add</button></span></div></div>
      <div class="film-tools">
        <button class="btn ${state.board ? 'primary' : ''}" id="board-toggle">${state.board ? 'List view' : 'Board view'}</button>
        <button class="btn" id="copy-text">Copy as text</button>
        <button class="btn" id="dl-csv" ${state.downloads ? '' : 'hidden'}>Download CSV</button>
        <span class="del-slot"><button class="btn ghost danger" id="del-film">Delete film</button></span>
      </div>
    </div>
    <div class="summary"><span><b>${film.scenes.length}</b>scene${film.scenes.length === 1 ? '' : 's'}</span><span><b>${shots}</b>shots</span><span><b>${moving}</b>moving</span><span><b>${done}</b>shot so far</span></div>
    ${state.mode === 'local' ? '<p class="note-local">Your lists live in this browser only. Sign in to the organisation that owns this page to keep them across devices.</p>' : '<p class="note-local">Your lists are private to you. Nobody else who opens this page can see them.</p>'}
    ${state.board ? boardView(film) : `<div id="scenes">${film.scenes.map((_, i) => sceneBlock(film, i)).join('')}</div>
    <div style="margin-top:16px"><button class="btn primary" id="add-scene">+ Add scene</button></div>`}`;
  wireList(el, film);
  el.querySelectorAll('textarea.desc').forEach(autosize);
  el.querySelectorAll('.stage-panel').forEach(sp => { const shotEl = sp.closest('.shot'), sceneEl = sp.closest('.scene'); const sc = film.scenes.find(x => x.id === sceneEl.dataset.scene); const shot = sc && sc.shots.find(x => x.id === shotEl.dataset.shot); if (shot) wireStage(sp, film, sc, shot); });
  placeTopRight();
}
function boardView(film) {
  return film.scenes.map((sc, i) => `<section class="board-scene">
    <div class="board-head"><div class="sc-badge"><small>Scene</small>${i + 1}</div><div><div class="board-heading">${esc(sc.heading)}</div>${sc.description ? `<div class="board-desc">${esc(sc.description)}</div>` : ''}</div></div>
    ${sc.shots.length ? `<div class="board-grid">${sc.shots.map((s, j) => `<div class="board-frame ${s.done ? 'done' : ''}"><div class="thumb">${shotThumb(s, film)}</div>
      <div class="bf-meta"><b>${shotLabel(i, j)}</b><span>${esc(SIZE[s.size]?.abbr)} \u00b7 ${esc(FRAME[s.framing]?.name)} \u00b7 ${esc(ANGLE[s.angle]?.name)} \u00b7 ${esc(MOVE[s.move]?.name)}</span></div>
      <p>${esc(s.description) || '<span class="muted">No description</span>'}</p>${s.notes ? `<p class="bf-notes">${esc(s.notes)}</p>` : ''}</div>`).join('')}</div>` : '<p class="empty-shots">No shots in this scene.</p>'}
  </section>`).join('');
}
function autosize(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight) + 'px'; }
function confirmInline(slot, label, onYes) {
  const orig = slot.innerHTML;
  slot.innerHTML = `<span class="confirm">${esc(label)} <button class="btn small danger">Yes, delete</button><button class="btn small ghost">Keep</button></span>`;
  const [yes, no] = slot.querySelectorAll('button');
  yes.onclick = onYes; no.onclick = () => { slot.innerHTML = orig; };
  yes.focus();
}
function wireList(el, film) {
  el.querySelector('#film-title').addEventListener('input', e => { film.title = e.target.value; save(film); renderFilmSelect(); });
  el.querySelector('#film-logline').addEventListener('input', e => { film.logline = e.target.value; save(film); });
  const addScene = el.querySelector('#add-scene'); if (addScene) addScene.onclick = () => { film.scenes.push(newScene()); save(film); renderList(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); };
  el.querySelector('#board-toggle').onclick = () => { state.board = !state.board; LS.set('sgn:board', state.board); renderList(); };
  const castNew = el.querySelector('#cast-new'), castAdd = el.querySelector('#cast-add');
  const addCast = () => {
    const name = castNew.value.trim(); if (!name) { castNew.focus(); return; }
    film.cast = film.cast || []; film.cast.push({ id: uid(), name, color: CAST_COLORS[film.cast.length % CAST_COLORS.length] });
    save(film); renderList(); document.getElementById('cast-new')?.focus();
  };
  castAdd.onclick = addCast; castNew.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCast(); } });
  el.querySelectorAll('[data-cast-del]').forEach(b => b.onclick = () => {
    const id = b.dataset.castDel; film.cast = (film.cast || []).filter(c => c.id !== id);
    film.scenes.forEach(sc => sc.shots.forEach(sh => { if (sh.stage) sh.stage.items = sh.stage.items.filter(i => !(i.kind === 'cast' && i.ref === id)); }));
    save(film); renderList();
  });
  el.querySelector('#del-film').onclick = e => confirmInline(e.target.closest('.del-slot'), `Delete "${film.title}" and all its shots?`, () => removeFilm(film.id));
  el.querySelector('#copy-text').onclick = async e => {
    const text = asText(film);
    try { await navigator.clipboard.writeText(text); toast('Shot list copied'); }
    catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:0;top:0;width:90vw;height:60vh'; document.body.appendChild(ta); ta.select(); toast('Select and copy the text, then press Escape'); ta.addEventListener('keydown', ev => { if (ev.key === 'Escape') ta.remove(); }); ta.addEventListener('blur', () => ta.remove()); }
  };
  const dl = el.querySelector('#dl-csv');
  if (dl) dl.onclick = async () => {
    try { await state.downloads.save({ filename: (film.title || 'shot-list').replace(/[^\w\- ]+/g, '').trim() + ' shot list.csv', data: asCSV(film) }); toast('CSV saved'); }
    catch (e) { if (e && e.code !== 'declined') toast('Could not save the CSV: ' + (e.code || 'error')); }
  };
  el.addEventListener('input', e => {
    const t = e.target;
    const sceneEl = t.closest('.scene'); if (!sceneEl) return;
    const sc = film.scenes.find(s => s.id === sceneEl.dataset.scene); if (!sc) return;
    if (t.dataset.sact === 'recipe') { if (t.value) addRecipeToScene(t.value, sc.id); return; }
    if (t.dataset.sf) { sc[t.dataset.sf] = t.value; if (t.tagName === 'TEXTAREA') autosize(t); save(film); return; }
    const shotEl = t.closest('.shot'); if (!shotEl) return;
    const shot = sc.shots.find(s => s.id === shotEl.dataset.shot); if (!shot) return;
    const f = t.dataset.f; if (!f) return;
    if (f === 'done') { shot.done = t.checked; save(film); rerenderShot(film, sc, shot); return; }
    shot[f] = t.value; save(film);
    if (t.tagName === 'SELECT') rerenderShot(film, sc, shot, t.id);
  });
  el.addEventListener('click', e => {
    const b = e.target.closest('button[data-act],button[data-sact]'); if (!b) return;
    const sceneEl = b.closest('.scene'); const si = film.scenes.findIndex(s => s.id === sceneEl.dataset.scene); const sc = film.scenes[si];
    if (b.dataset.sact) {
      const a = b.dataset.sact;
      if (a === 'add') { sc.shots.push(newShot()); save(film); renderList(); const last = sc.shots[sc.shots.length - 1]; document.getElementById('d-' + last.id)?.focus(); }
      if (a === 'up' && si > 0) { [film.scenes[si - 1], film.scenes[si]] = [film.scenes[si], film.scenes[si - 1]]; save(film); renderList(); }
      if (a === 'down' && si < film.scenes.length - 1) { [film.scenes[si + 1], film.scenes[si]] = [film.scenes[si], film.scenes[si + 1]]; save(film); renderList(); }
      if (a === 'del') confirmInline(b.closest('.del-slot'), `Delete scene ${si + 1} and its ${sc.shots.length} shots?`, () => { film.scenes.splice(si, 1); save(film); renderList(); });
      return;
    }
    const shotEl = b.closest('.shot'); const idx = sc.shots.findIndex(s => s.id === shotEl.dataset.shot); const shot = sc.shots[idx];
    const a = b.dataset.act;
    if (a === 'coach') { state.expanded.has(shot.id) ? state.expanded.delete(shot.id) : state.expanded.add(shot.id); rerenderShot(film, sc, shot); }
    if (a === 'stage') { state.stageOpen = state.stageOpen === shot.id ? null : shot.id; state.stageSel = null; rerenderShot(film, sc, shot); }
    if (a === 'up' && idx > 0) { [sc.shots[idx - 1], sc.shots[idx]] = [sc.shots[idx], sc.shots[idx - 1]]; save(film); renderList(); }
    if (a === 'down' && idx < sc.shots.length - 1) { [sc.shots[idx + 1], sc.shots[idx]] = [sc.shots[idx], sc.shots[idx + 1]]; save(film); renderList(); }
    if (a === 'dup') { const copy = JSON.parse(JSON.stringify(shot)); copy.id = uid(); copy.done = false; sc.shots.splice(idx + 1, 0, copy); save(film); renderList(); }
    if (a === 'del') { sc.shots.splice(idx, 1); save(film); renderList(); toast('Shot deleted'); }
  });
}
function rerenderShot(film, sc, shot, focusId) {
  const si = film.scenes.indexOf(sc), idx = sc.shots.indexOf(shot);
  const old = document.querySelector(`.shot[data-shot="${shot.id}"]`); if (!old) return;
  const tmp = document.createElement('div'); tmp.innerHTML = shotCard(film, si, idx);
  const node = tmp.firstElementChild; old.replaceWith(node);
  const sp = node.querySelector('.stage-panel'); if (sp) wireStage(sp, film, sc, shot);
  const pill = document.querySelector(`.scene[data-scene="${sc.id}"] .pill`); if (pill) pill.textContent = `${sc.shots.filter(s => s.done).length}/${sc.shots.length} shot`;
  if (focusId) document.getElementById(focusId)?.focus();
}
function coverage(recipeId = 'dialogue') {
  const r = RECIPES.find(x => x.id === recipeId) || RECIPES[0];
  return r.shots.map(s => newShot({ ...s, lens: LENSES[s.lens] }));
}
function addRecipeToScene(recipeId, sceneId) {
  const film = currentFilm(); if (!film) { toast('Create a film first'); return; }
  let sc = film.scenes.find(s => s.id === sceneId);
  if (!sc) { sc = newScene(); film.scenes.push(sc); }
  const shots = coverage(recipeId);
  sc.shots.push(...shots); save(film); renderList(); showTab('list');
  const r = RECIPES.find(x => x.id === recipeId);
  toast(`${shots.length} shots added to scene ${film.scenes.indexOf(sc) + 1}: ${r.name}`);
  setTimeout(() => document.querySelector(`.scene[data-scene="${sc.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}
