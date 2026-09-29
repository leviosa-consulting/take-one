// HTTP app: serves the page and a small JSON API for accounts and films.
const fs = require('fs');
const path = require('path');
const express = require('express');

const COOKIE = 'take_one_session';
const FILM_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_FILMS = 500;
const MAX_FILM_BYTES = 2 * 1024 * 1024;

// The page is written for a host that adds the doctype and head (see README). Add them here.
function pageHtml(rootDir) {
  const body = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  return '<!doctype html>\n<html lang="en">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + body;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim()); }
  return null;
}

// verifyGoogle(credential) resolves to { sub, email, email_verified, name, picture } or throws.
function createApp({ store, verifyGoogle, googleClientId, secureCookies = true, rootDir, log = console }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' https://accounts.google.com/gsi/client",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://*.googleusercontent.com",
        "frame-src https://accounts.google.com/gsi/",
        "connect-src 'self' https://accounts.google.com/gsi/",
        "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
      ].join('; '),
    });
    next();
  });

  const api = express.Router();
  api.use(express.json({ limit: MAX_FILM_BYTES }));
  api.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  // Writes must carry this header. A page on another site cannot add it without a CORS preflight, which this API never grants.
  api.use((req, res, next) => {
    if (req.method !== 'GET' && req.get('X-Take-One') !== '1') return res.status(403).json({ error: 'missing_header' });
    next();
  });
  api.use((req, res, next) => { req.user = store.userForSession(readCookie(req, COOKIE)); next(); });
  const signedIn = (req, res, next) => req.user ? next() : res.status(401).json({ error: 'signed_out' });
  const publicUser = u => ({ id: u.id, email: u.email, name: u.name, picture: u.picture });
  const setSession = (res, token, maxAge) => res.cookie(COOKIE, token, { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: '/', maxAge: maxAge * 1000 });

  api.get('/health', (req, res) => res.json({ ok: true }));
  api.get('/config', (req, res) => res.json({ googleClientId }));
  api.get('/me', (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));

  api.post('/auth/google', async (req, res) => {
    const credential = req.body && req.body.credential;
    if (typeof credential !== 'string' || credential.length > 4096) return res.status(400).json({ error: 'bad_credential' });
    let p;
    try { p = await verifyGoogle(credential); } catch (e) { log.warn('google sign-in rejected:', e.message); return res.status(401).json({ error: 'bad_credential' }); }
    if (!p || !p.sub || !p.email || p.email_verified === false) return res.status(401).json({ error: 'unverified_email' });
    const user = store.userFromGoogle(p);
    const { token, maxAge } = store.createSession(user.id);
    setSession(res, token, maxAge);
    res.json({ user: publicUser(user) });
  });
  api.post('/auth/logout', (req, res) => {
    store.endSession(readCookie(req, COOKIE));
    res.clearCookie(COOKIE, { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: '/' });
    res.json({ ok: true });
  });

  api.get('/films', signedIn, (req, res) => res.json({ films: store.films(req.user.id) }));
  api.put('/films/:id', signedIn, (req, res) => {
    const id = req.params.id, film = req.body;
    if (!FILM_ID.test(id)) return res.status(400).json({ error: 'bad_id' });
    if (!film || typeof film !== 'object' || Array.isArray(film) || film.id !== id || !Array.isArray(film.scenes)) return res.status(400).json({ error: 'bad_film' });
    if (!store.filmExists(req.user.id, id) && store.filmCount(req.user.id) >= MAX_FILMS) return res.status(409).json({ error: 'too_many_films' });
    store.saveFilm(req.user.id, film);
    res.json({ ok: true });
  });
  api.delete('/films/:id', signedIn, (req, res) => {
    if (!FILM_ID.test(req.params.id)) return res.status(400).json({ error: 'bad_id' });
    store.deleteFilm(req.user.id, req.params.id);
    res.json({ ok: true });
  });

  api.use((req, res) => res.status(404).json({ error: 'not_found' }));
  // Body too large or not JSON: answer in JSON, never with a stack trace.
  api.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'too_large' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'bad_json' });
    log.error(err); res.status(500).json({ error: 'server_error' });
  });
  app.use('/api', api);

  // The page. Files change on every deploy and have no hashed names, so browsers check back each time (cheap with ETags).
  const statics = { etag: true, lastModified: true, setHeaders: res => res.set('Cache-Control', 'no-cache') };
  app.use('/css', express.static(path.join(rootDir, 'css'), statics));
  app.use('/js', express.static(path.join(rootDir, 'js'), statics));
  const html = pageHtml(rootDir);
  app.get('/', (req, res) => res.type('html').set('Cache-Control', 'no-cache').send(html));
  app.use((req, res) => res.status(404).type('text').send('Not found'));
  return app;
}

module.exports = { createApp, COOKIE };
