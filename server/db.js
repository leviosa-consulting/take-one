// SQLite storage: users, sessions and films. Each film is one JSON document, the same shape the page keeps.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// Each entry moves the schema one version forward. Never edit an entry that has shipped; add a new one.
const MIGRATIONS = [
  `CREATE TABLE users (
     id TEXT PRIMARY KEY,
     google_sub TEXT NOT NULL UNIQUE,
     email TEXT NOT NULL,
     name TEXT NOT NULL DEFAULT '',
     picture TEXT NOT NULL DEFAULT '',
     created_at INTEGER NOT NULL,
     last_seen_at INTEGER NOT NULL
   );
   CREATE TABLE sessions (
     token_hash TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at INTEGER NOT NULL,
     expires_at INTEGER NOT NULL
   );
   CREATE INDEX sessions_user ON sessions(user_id);
   CREATE TABLE films (
     user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     id TEXT NOT NULL,
     data TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     PRIMARY KEY (user_id, id)
   );`,
];

const SESSION_DAYS = 30;
const hash = token => crypto.createHash('sha256').update(token).digest('hex');

function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  const version = db.pragma('user_version', { simple: true });
  MIGRATIONS.slice(version).forEach((sql, i) => db.transaction(() => { db.exec(sql); db.pragma(`user_version = ${version + i + 1}`); })());
  return store(db);
}

function store(db) {
  const q = {
    userBySub: db.prepare('SELECT * FROM users WHERE google_sub = ?'),
    insertUser: db.prepare('INSERT INTO users (id, google_sub, email, name, picture, created_at, last_seen_at) VALUES (@id, @sub, @email, @name, @picture, @now, @now)'),
    updateUser: db.prepare('UPDATE users SET email = @email, name = @name, picture = @picture, last_seen_at = @now WHERE id = @id'),
    insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'),
    session: db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    films: db.prepare('SELECT data FROM films WHERE user_id = ? ORDER BY created_at'),
    filmCount: db.prepare('SELECT COUNT(*) AS n FROM films WHERE user_id = ?'),
    filmExists: db.prepare('SELECT 1 FROM films WHERE user_id = ? AND id = ?'),
    upsertFilm: db.prepare(`INSERT INTO films (user_id, id, data, created_at, updated_at) VALUES (@user, @id, @data, @now, @now)
      ON CONFLICT (user_id, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
    deleteFilm: db.prepare('DELETE FROM films WHERE user_id = ? AND id = ?'),
  };
  return {
    db,
    // Find or create the user for a verified Google account, and refresh their name and picture.
    userFromGoogle({ sub, email, name, picture }) {
      const now = Date.now(), found = q.userBySub.get(sub), p = { sub, email, name: name || '', picture: picture || '', now };
      if (found) { q.updateUser.run({ ...p, id: found.id }); return { ...found, email, name: p.name, picture: p.picture }; }
      const id = crypto.randomUUID(); q.insertUser.run({ ...p, id });
      return q.userBySub.get(sub);
    },
    createSession(userId) {
      const token = crypto.randomBytes(32).toString('base64url'), now = Date.now();
      q.insertSession.run(hash(token), userId, now, now + SESSION_DAYS * 864e5);
      return { token, maxAge: SESSION_DAYS * 86400 };
    },
    userForSession(token) { return token ? q.session.get(hash(token), Date.now()) || null : null; },
    endSession(token) { if (token) q.deleteSession.run(hash(token)); },
    purgeSessions() { return q.purgeSessions.run(Date.now()).changes; },
    films(userId) { return q.films.all(userId).map(r => JSON.parse(r.data)); },
    filmCount(userId) { return q.filmCount.get(userId).n; },
    filmExists(userId, id) { return !!q.filmExists.get(userId, id); },
    saveFilm(userId, film) { q.upsertFilm.run({ user: userId, id: film.id, data: JSON.stringify(film), now: Date.now() }); },
    deleteFilm(userId, id) { return q.deleteFilm.run(userId, id).changes > 0; },
    // A consistent copy of the whole database, safe to take while the app runs.
    backup(file) { return db.backup(file); },
    close() { db.close(); },
  };
}

module.exports = { openDb };
