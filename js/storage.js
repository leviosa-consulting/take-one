// State and storage: private per-viewer store when available, browser storage otherwise.
const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));
const state = { films: {}, currentId: null, db: null, downloads: null, mode: 'loading', dirty: {}, timers: {}, chains: {}, expanded: new Set(), tab: 'learn' };
const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } };

function newShot(p = {}) { return { id: uid(), size: 'MS', framing: 'single', angle: 'eye', move: 'static', lens: LENSES[1], description: '', notes: '', done: false, ...p }; }
function newScene(p = {}) { return { id: uid(), heading: 'INT. LOCATION - NIGHT', description: '', shots: [], ...p }; }
function newFilm(title = 'Untitled film') { const now = Date.now(); return { id: uid(), title, logline: '', createdAt: now, updatedAt: now, scenes: [newScene()] }; }

function exampleFilm() {
  const f = newFilm('After Hours (example)');
  f.logline = 'Two colleagues, an empty office, and a message neither wants to send. Example scenes to show how a list reads.';
  f.cast = [{ id: 'maya', name: 'Maya', color: CAST_COLORS[0] }, { id: 'dev', name: 'Dev', color: CAST_COLORS[1] }];
  const st = (...items) => ({ items: items.map(i => ({ id: uid(), face: 'camera', pose: 'stand', z: 0, ...i })) });
  const maya = (x, o = {}) => ({ kind: 'cast', ref: 'maya', x, ...o }), dev = (x, o = {}) => ({ kind: 'cast', ref: 'dev', x, ...o }), prop = (ref, x, z = 1) => ({ kind: 'prop', ref, x, z });
  f.scenes = [
    newScene({ heading: 'INT. OFFICE - NIGHT', description: 'Maya works alone at her desk. The lights cut out.', shots: [
      newShot({ size: 'WS', framing: 'single', angle: 'eye', move: 'static', lens: LENSES[1], description: 'Master. Maya at the desk, the empty office around her.', notes: 'Tripod on the far table. Practical lamps on.', stage: st(prop('window', -70, 2), prop('desk', 0, 0), maya(0, { pose: 'sit' }), prop('lamp', 46, 1), prop('door', 100, 2)) }),
      newShot({ size: 'MS', framing: 'single', angle: 'high', move: 'static', lens: LENSES[1], description: 'Maya types. She looks small in the frame.', notes: 'Gimbal held overhead, or phone clamped to the shelf.' }),
      newShot({ size: 'CU', framing: 'single', angle: 'eye', move: 'push', lens: LENSES[2], description: 'She notices the time. Slow push in.', notes: 'Very slow walk. Two takes minimum.', stage: st(maya(0, { pose: 'sit' }), prop('window', -60, 2)) }),
      newShot({ size: 'ECU', framing: 'insert', angle: 'high', move: 'static', lens: LENSES[2], description: 'Insert: laptop clock reads 11:58.', notes: 'Lock focus. Shoot 10 seconds.' }),
      newShot({ size: 'ECU', framing: 'single', angle: 'eye', move: 'static', lens: LENSES[2], description: 'Her eyes, as the lights cut.', notes: 'Kill the lights on cue, hold for 3 seconds.' }),
    ]}),
    newScene({ heading: 'INT. CORRIDOR - NIGHT', description: 'Maya meets Dev with a torch. Neither expected the other.', shots: [
      newShot({ size: 'MWS', framing: 'two', angle: 'eye', move: 'static', lens: LENSES[1], description: 'Master two-shot. Torch beam finds Maya.', notes: 'Shoot the whole scene.', stage: st(prop('door', 80, 2), maya(-24, { face: 'right' }), dev(26, { face: 'left' })) }),
      newShot({ size: 'MCU', framing: 'ots', angle: 'eye', move: 'static', lens: LENSES[2], description: 'Over Maya’s shoulder onto Dev.', notes: 'Camera on the window side of the line.', stage: st(maya(-22, { face: 'away' }), dev(10, { face: 'left', z: 1 }), prop('door', 70, 2)) }),
      newShot({ size: 'MCU', framing: 'ots', angle: 'eye', move: 'static', lens: LENSES[2], description: 'Over Dev’s shoulder onto Maya.', notes: 'Same side of the line as 2B.', stage: st(dev(22, { face: 'away' }), maya(-10, { face: 'right', z: 1 })) }),
      newShot({ size: 'CU', framing: 'single', angle: 'low', move: 'static', lens: LENSES[2], description: 'Dev. He knows more than he says.', notes: 'Slight low angle only.', stage: st(dev(0, { face: 'left' })) }),
      newShot({ size: 'ECU', framing: 'insert', angle: 'high', move: 'static', lens: LENSES[2], description: 'Insert: Dev’s keys.', notes: '' }),
    ]}),
  ];
  return f;
}

function setPill(text, cls = '') { const p = document.getElementById('save-pill'); p.textContent = text; p.className = 'pill ' + cls; }
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2200); }

function currentFilm() { return state.films[state.currentId] || null; }
function filmList() { return Object.values(state.films).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); }

function persistLocal() { LS.set('sgn:films', state.films); LS.set('sgn:current', state.currentId); }
function save(film) {
  film.updatedAt = Date.now();
  state.dirty[film.id] = film.updatedAt;
  if (state.mode !== 'db') { persistLocal(); setPill('Saved in this browser', 'warn'); return; }
  setPill('Saving…');
  clearTimeout(state.timers[film.id]);
  state.timers[film.id] = setTimeout(() => flush(film.id), 600);
}
function flush(id) {
  const film = state.films[id]; if (!film || !state.col) return;
  const body = JSON.parse(JSON.stringify(film));
  const prev = state.chains[id] || Promise.resolve();
  state.chains[id] = prev.then(() => state.col.doc(id).set(body)).then(() => {
    setPill('Saved, private to you', 'ok');
    setTimeout(() => { delete state.dirty[id]; }, 1500);
  }).catch(e => {
    console.error(e);
    if (e && e.code === 'invalid_argument') { fallToLocal('This view cannot write to the store, so your lists live in this browser only.'); return; }
    setPill('Not saved', 'warn'); toast('Could not save: ' + (e && e.message || e.code || 'unknown error'));
  });
}
function fallToLocal(msg) {
  if (state.unsub) { try { state.unsub(); } catch { } state.unsub = null; }
  state.mode = 'local'; state.col = null; persistLocal(); setPill('Saved in this browser', 'warn'); if (msg) toast(msg); renderList();
}
function removeFilm(id) {
  delete state.films[id]; delete state.dirty[id];
  if (state.mode === 'db' && state.col) state.col.doc(id).delete().catch(console.error); else persistLocal();
  if (state.currentId === id) state.currentId = (filmList()[0] || {}).id || null;
  LS.set('sgn:current', state.currentId);
  renderList(); renderFilmSelect();
}
function addFilm(film) {
  state.films[film.id] = film; state.currentId = film.id; LS.set('sgn:current', film.id);
  save(film);
  renderFilmSelect(); renderList();
}

async function initStorage() {
  const claude = window.claude;
  const use = n => claude && claude.use ? claude.use(n).catch(() => null) : Promise.resolve(null);
  const [db, user, downloads] = await Promise.all([use('db'), use('user'), use('downloads')]);
  state.downloads = downloads;
  const uid = user ? await user.id() : null;
  if (!db || !uid) {
    // no store, or no identity to keep a private one: keep lists in this browser
    state.mode = 'local';
    state.films = LS.get('sgn:films', {});
    if (!Object.keys(state.films).length) { const ex = exampleFilm(); state.films[ex.id] = ex; }
    state.currentId = LS.get('sgn:current', null) || filmList()[0].id;
    persistLocal(); setPill('Saved in this browser', 'warn');
    renderFilmSelect(); renderList();
    return;
  }
  state.db = db; state.mode = 'db';
  // every viewer keeps their own films under their private subtree; nobody else can read them
  state.col = db.doc('data/users/' + uid + '/notebook').collection('films');
  const isOwner = await user.isOwner();
  let first = true;
  state.unsub = state.col.onSnapshot(async snap => {
    if (first && !snap.metadata.fromCache && snap.empty && isOwner) {
      // one-time move of films saved by an earlier version into the owner's private store
      try {
        const shared = await db.collection('films').get();
        for (const d of shared.docs) { const data = d.data(); if (!data) continue; await state.col.doc(d.id).set(data); await db.doc('films/' + d.id).delete(); }
        if (!shared.empty) { toast('Moved your earlier films into your private store'); return; }
      } catch (e) { console.error(e); }
    }
    let changed = false;
    const seen = new Set();
    snap.docs.forEach(d => {
      const data = d.data(); if (!data) return; seen.add(d.id);
      const local = state.films[d.id];
      if (state.dirty[d.id]) return;
      if (!local || JSON.stringify(local) !== JSON.stringify(data)) { state.films[d.id] = { ...data, id: d.id }; changed = true; }
    });
    Object.keys(state.films).forEach(id => { if (!seen.has(id) && !state.dirty[id] && !snap.metadata.fromCache) { delete state.films[id]; changed = true; } });
    if (!state.currentId || !state.films[state.currentId]) {
      let next = LS.get('sgn:current', null); if (!state.films[next]) next = (filmList()[0] || {}).id || null;
      if (next !== state.currentId) { state.currentId = next; changed = true; }
    }
    if (first && !snap.metadata.fromCache) { first = false; state.ready = true; setPill('Saved, private to you', 'ok'); changed = true; }
    if (changed) { renderFilmSelect(); renderList(); }
  }, e => {
    console.error(e);
    if (e.code === 'invalid_argument') { fallToLocal('This view cannot use the store, so your lists live in this browser only.'); return; }
    setPill('Offline', 'warn'); toast('Storage error: ' + e.code);
  });
}
