// Accounts on our own server: Google sign-in, films saved through /api. Off on any host without that API.
const API = {
  async call(method, url, body) {
    const res = await fetch('/api' + url, { method, credentials: 'same-origin', headers: { 'X-Take-One': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'HTTP ' + res.status); e.code = data.error; e.status = res.status; throw e; }
    return data;
  },
};
// Same shape as the claude.ai store, so save() and removeFilm() work unchanged.
const apiCol = () => ({ doc: id => ({ set: body => API.call('PUT', '/films/' + encodeURIComponent(id), body), delete: () => API.call('DELETE', '/films/' + encodeURIComponent(id)) }) });

// True when this page is served by our server; it then owns storage for the session.
async function initServer() {
  if (window.claude || location.protocol === 'file:') return false;
  let config;
  try {
    const r = await fetch('/api/config', { headers: { Accept: 'application/json' } });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return false;
    config = await r.json();
  } catch { return false; }
  state.server = { clientId: config.googleClientId, user: null };
  const me = await API.call('GET', '/me').catch(() => ({ user: null }));
  if (me.user) await startAccount(me.user); else { startLocal(); renderAccount(); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshFromServer(); });
  return true;
}
async function startAccount(user) {
  state.server.user = user; state.mode = 'db'; state.ready = false; state.col = apiCol();
  setPill('Loading'); renderAccount(); renderList();
  try {
    const { films } = await API.call('GET', '/films');
    state.films = {}; films.forEach(f => { state.films[f.id] = f; });
  } catch (e) { if (e.status === 401) return sessionEnded(); fallToLocal('Could not load your films. They stay in this browser for now.'); return; }
  state.ready = true;
  if (!state.films[state.currentId]) state.currentId = LS.get('sgn:current', null);
  if (!state.films[state.currentId]) state.currentId = (filmList()[0] || {}).id || null;
  setPill('Saved to your account', 'ok');
  renderFilmSelect(); renderList();
  if (!filmList().length && !importable().length) addFilm(exampleFilm());
}
// Films in this browser that the account lacks, or has an older copy of.
function importable() {
  if (!state.server || !state.server.user) return [];
  const local = LS.get('sgn:films', {}), gone = new Set(LS.get('sgn:import-skip', []));
  // an example film nobody has touched is not worth offering
  return Object.values(local).filter(f => f && f.id && Array.isArray(f.scenes) && !gone.has(f.id + ':' + f.updatedAt) && !(f.example && f.updatedAt === f.createdAt)
    && (!state.films[f.id] || (f.updatedAt || 0) > (state.films[f.id].updatedAt || 0)));
}
async function importLocal() {
  const films = importable(); let done = 0;
  for (const f of films) {
    try { await API.call('PUT', '/films/' + encodeURIComponent(f.id), f); state.films[f.id] = f; done++; } catch (e) { console.error(e); }
  }
  if (done === films.length) LS.set('sgn:films', {});
  toast(done === films.length ? `Added ${done} film${done === 1 ? '' : 's'} to your account` : `Added ${done} of ${films.length} films. Try again for the rest.`);
  if (!state.films[state.currentId]) state.currentId = (filmList()[0] || {}).id || null;
  renderFilmSelect(); renderList();
}
function skipImport() { LS.set('sgn:import-skip', [...LS.get('sgn:import-skip', []), ...importable().map(f => f.id + ':' + f.updatedAt)]); renderList(); }
// Pick up changes made on another device, except in films with edits still on their way.
async function refreshFromServer() {
  if (!state.server || !state.server.user || !state.ready) return;
  try {
    const { films } = await API.call('GET', '/films'), seen = new Set();
    let changed = false;
    films.forEach(f => { seen.add(f.id); if (state.dirty[f.id]) return; if (JSON.stringify(state.films[f.id]) !== JSON.stringify(f)) { state.films[f.id] = f; changed = true; } });
    Object.keys(state.films).forEach(id => { if (!seen.has(id) && !state.dirty[id]) { delete state.films[id]; changed = true; } });
    if (!state.films[state.currentId]) state.currentId = (filmList()[0] || {}).id || null;
    if (changed) { renderFilmSelect(); renderList(); }
  } catch (e) { if (e.status === 401) sessionEnded(); }
}
// The session expired or was ended elsewhere: keep working in this browser and ask to sign in again.
function sessionEnded() {
  state.server.user = null;
  fallToLocal('You were signed out. Your changes are kept in this browser. Sign in to save them to your account.');
  renderAccount();
}

function loadGoogle() {
  return loadGoogle.p = loadGoogle.p || new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = resolve; s.onerror = () => { loadGoogle.p = null; reject(new Error('Google sign-in did not load')); };
    document.head.appendChild(s);
  });
}
async function onGoogleCredential(resp) {
  try {
    const { user } = await API.call('POST', '/auth/google', { credential: resp.credential });
    Object.values(state.timers).forEach(clearTimeout); state.dirty = {};
    await startAccount(user);
    toast('Signed in as ' + (user.name || user.email));
  } catch (e) { console.error(e); toast('Sign-in failed. Try again.'); }
}
async function signOut() {
  try { await API.call('POST', '/auth/logout', {}); } catch (e) { console.error(e); }
  location.reload();
}
function renderAccount() {
  let box = document.getElementById('account');
  if (!box) { box = document.createElement('div'); box.id = 'account'; box.className = 'account'; topRight.appendChild(box); }
  const u = state.server && state.server.user;
  if (u) {
    box.innerHTML = `${u.picture ? `<img class="avatar" src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : ''}<span class="acct-name" title="${esc(u.email)}">${esc(u.name || u.email)}</span><button class="btn small ghost" id="sign-out">Sign out</button>`;
    box.querySelector('#sign-out').onclick = signOut;
    return;
  }
  box.innerHTML = '<div id="g-signin" class="g-signin"></div>';
  if (!state.server.clientId) { box.innerHTML = '<span class="muted" style="font-size:13px">Sign-in is not set up yet</span>'; return; }
  loadGoogle().then(() => {
    google.accounts.id.initialize({ client_id: state.server.clientId, callback: onGoogleCredential, ux_mode: 'popup', auto_select: false });
    const theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'filled_black' : 'outline';
    google.accounts.id.renderButton(document.getElementById('g-signin'), { type: 'standard', theme, size: 'medium', text: 'signin_with', shape: 'pill' });
  }).catch(() => { box.innerHTML = '<button class="btn small" id="g-retry">Sign in with Google</button>'; box.querySelector('#g-retry').onclick = renderAccount; });
}
// The line under the film summary: where films live, and the offer to bring browser films into the account.
function storageNote() {
  if (state.server) {
    if (!state.server.user) return '<p class="note-local">Your films live in this browser only. Sign in with Google to keep them in your account and open them on any device.</p>';
    const extra = importable();
    const offer = extra.length ? `<div class="import-offer"><p>This browser has ${extra.length} film${extra.length === 1 ? '' : 's'} that ${extra.length === 1 ? 'is' : 'are'} not in your account: ${extra.map(f => '<b>' + esc(f.title || 'Untitled film') + '</b>').join(', ')}.</p><div class="acts"><button class="btn primary small" data-import="yes">Add to my account</button><button class="btn small ghost" data-import="no">Not now</button></div></div>` : '';
    return offer + '<p class="note-local">Your films are saved to your account. Nobody else can see them.</p>';
  }
  return state.mode === 'local' ? '<p class="note-local">Your lists live in this browser only. Sign in to the organisation that owns this page to keep them across devices.</p>' : '<p class="note-local">Your lists are private to you. Nobody else who opens this page can see them.</p>';
}
document.addEventListener('click', e => { const b = e.target.closest('[data-import]'); if (!b) return; b.disabled = true; b.dataset.import === 'yes' ? importLocal() : skipImport(); });
