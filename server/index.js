// Entry point. Settings come from the environment; see deploy/README.md.
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const { openDb } = require('./db');
const { createApp } = require('./app');

const env = process.env;
const PORT = +(env.PORT || 3310);
const DATA_DIR = env.DATA_DIR || path.join(__dirname, 'data');
const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
const ROOT_DIR = env.ROOT_DIR || path.join(__dirname, '..');
const BACKUP_DAYS = 14;

if (!GOOGLE_CLIENT_ID) console.warn('GOOGLE_CLIENT_ID is not set. Sign-in will not work.');

const store = openDb(path.join(DATA_DIR, 'take-one.db'));
const google = new OAuth2Client(GOOGLE_CLIENT_ID);
async function verifyGoogle(credential) {
  const ticket = await google.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
  return ticket.getPayload();
}

const app = createApp({ store, verifyGoogle, googleClientId: GOOGLE_CLIENT_ID, secureCookies: env.COOKIE_SECURE !== '0', rootDir: ROOT_DIR });
// Listen on localhost only: Caddy sits in front and handles HTTPS.
const server = app.listen(PORT, env.HOST || '127.0.0.1', () => console.log(`Take One listening on ${env.HOST || '127.0.0.1'}:${PORT}, data in ${DATA_DIR}`));

// Once a day: drop expired sessions and keep a dated copy of the database for two weeks.
async function daily() {
  try {
    store.purgeSessions();
    const dir = path.join(DATA_DIR, 'backups'); fs.mkdirSync(dir, { recursive: true });
    await store.backup(path.join(dir, `take-one-${new Date().toISOString().slice(0, 10)}.db`));
    fs.readdirSync(dir).filter(f => f.endsWith('.db')).sort().slice(0, -BACKUP_DAYS).forEach(f => fs.unlinkSync(path.join(dir, f)));
  } catch (e) { console.error('daily upkeep failed:', e); }
}
setTimeout(daily, 60 * 1000); setInterval(daily, 24 * 3600 * 1000).unref();

function stop() { server.close(() => { store.close(); process.exit(0); }); setTimeout(() => process.exit(0), 5000).unref(); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
