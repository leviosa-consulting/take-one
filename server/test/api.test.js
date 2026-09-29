// API tests with a stand-in for Google. Run with: npm test
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { openDb } = require('../db');
const { createApp, COOKIE } = require('../app');

const PEOPLE = { 'token-ana': { sub: 'g-ana', email: 'ana@example.com', email_verified: true, name: 'Ana' }, 'token-ben': { sub: 'g-ben', email: 'ben@example.com', email_verified: true, name: 'Ben' }, 'token-unverified': { sub: 'g-x', email: 'x@example.com', email_verified: false } };

async function withServer(fn) {
  const store = openDb(':memory:');
  const verifyGoogle = async c => { if (!PEOPLE[c]) throw new Error('bad token'); return PEOPLE[c]; };
  const app = createApp({ store, verifyGoogle, googleClientId: 'test-client', secureCookies: false, rootDir: path.join(__dirname, '..', '..'), log: { warn() {}, error() {} } });
  const server = await new Promise(r => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base, store); } finally { server.close(); store.close(); }
}
function client(base) {
  let cookie = '';
  const call = async (method, url, body, headers = { 'X-Take-One': '1' }) => {
    const res = await fetch(base + url, { method, headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const set = res.headers.get('set-cookie'); if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    const type = res.headers.get('content-type') || '';
    return { status: res.status, body: type.includes('json') ? await res.json() : await res.text(), headers: res.headers };
  };
  return { call, signIn: token => call('POST', '/api/auth/google', { credential: token }), get cookie() { return cookie; } };
}
const film = (id, title = 'A film') => ({ id, title, scenes: [{ id: 's1', heading: 'INT. ROOM', shots: [] }] });

test('serves the page with a doctype', () => withServer(async base => {
  const res = await fetch(base + '/');
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<title>Take One<\/title>/);
  assert.match(res.headers.get('content-security-policy'), /accounts\.google\.com/);
  assert.equal((await fetch(base + '/js/stage.js')).status, 200);
  assert.equal((await fetch(base + '/server/db.js')).status, 404, 'server code is not served');
  assert.equal((await fetch(base + '/../server/db.js')).status, 404);
}));

test('signed out: config and me work, films do not', () => withServer(async base => {
  const c = client(base);
  assert.deepEqual((await c.call('GET', '/api/config')).body, { googleClientId: 'test-client' });
  assert.deepEqual((await c.call('GET', '/api/me')).body, { user: null });
  assert.equal((await c.call('GET', '/api/films')).status, 401);
  assert.equal((await c.call('PUT', '/api/films/f1', film('f1'))).status, 401);
}));

test('sign in, save, list, update, delete, sign out', () => withServer(async base => {
  const c = client(base);
  const s = await c.signIn('token-ana');
  assert.equal(s.status, 200); assert.equal(s.body.user.email, 'ana@example.com');
  assert.match(s.headers.get('set-cookie'), new RegExp(`^${COOKIE}=.+HttpOnly.+SameSite=Lax`, 'i'));
  assert.equal((await c.call('GET', '/api/me')).body.user.name, 'Ana');
  assert.equal((await c.call('PUT', '/api/films/f1', film('f1', 'First'))).status, 200);
  assert.equal((await c.call('PUT', '/api/films/f2', film('f2', 'Second'))).status, 200);
  assert.equal((await c.call('PUT', '/api/films/f1', film('f1', 'First, again'))).status, 200);
  let list = (await c.call('GET', '/api/films')).body.films;
  assert.deepEqual(list.map(f => f.title), ['First, again', 'Second']);
  assert.equal((await c.call('DELETE', '/api/films/f2')).status, 200);
  list = (await c.call('GET', '/api/films')).body.films;
  assert.deepEqual(list.map(f => f.id), ['f1']);
  assert.equal((await c.call('POST', '/api/auth/logout', {})).status, 200);
  assert.equal((await c.call('GET', '/api/films')).status, 401);
}));

test('signing in again finds the same account', () => withServer(async base => {
  const a = client(base), b = client(base);
  await a.signIn('token-ana'); await a.call('PUT', '/api/films/f1', film('f1'));
  await b.signIn('token-ana');
  assert.equal((await b.call('GET', '/api/films')).body.films.length, 1);
}));

test('people only see their own films', () => withServer(async base => {
  const ana = client(base), ben = client(base);
  await ana.signIn('token-ana'); await ben.signIn('token-ben');
  await ana.call('PUT', '/api/films/f1', film('f1', 'Ana film'));
  assert.deepEqual((await ben.call('GET', '/api/films')).body.films, []);
  // Ben writing the same id makes his own copy, and leaves Ana's alone
  await ben.call('PUT', '/api/films/f1', film('f1', 'Ben film'));
  await ben.call('DELETE', '/api/films/f1');
  assert.equal((await ana.call('GET', '/api/films')).body.films[0].title, 'Ana film');
}));

test('rejects bad sign-ins and bad writes', () => withServer(async base => {
  const c = client(base);
  assert.equal((await c.signIn('forged')).status, 401);
  assert.equal((await c.signIn('token-unverified')).status, 401);
  assert.equal((await c.call('POST', '/api/auth/google', { credential: 42 })).status, 400);
  await c.signIn('token-ana');
  assert.equal((await c.call('PUT', '/api/films/f1', film('f1'), {})).status, 403, 'writes need the X-Take-One header');
  assert.equal((await c.call('PUT', '/api/films/f1', film('other'))).status, 400, 'id in body must match the path');
  assert.equal((await c.call('PUT', '/api/films/f1', { id: 'f1' })).status, 400, 'a film has scenes');
  assert.equal((await c.call('PUT', '/api/films/bad%20id', film('bad id'))).status, 400);
  const big = film('f1'); big.notes = 'x'.repeat(3 * 1024 * 1024);
  assert.equal((await c.call('PUT', '/api/films/f1', big)).status, 413);
  const raw = await fetch(base + '/api/films/f1', { method: 'PUT', headers: { 'X-Take-One': '1', 'Content-Type': 'application/json', Cookie: c.cookie }, body: '{nope' });
  assert.equal(raw.status, 400);
}));

test('a stolen-looking or expired cookie is ignored', () => withServer(async (base, store) => {
  const c = client(base); await c.signIn('token-ana');
  store.db.prepare('UPDATE sessions SET expires_at = 0').run();
  assert.deepEqual((await c.call('GET', '/api/me')).body, { user: null });
  const res = await fetch(base + '/api/me', { headers: { Cookie: `${COOKIE}=made-up` } });
  assert.deepEqual(await res.json(), { user: null });
}));
