# Running Take One on the server

Take One runs on the gbsims.com droplet (139.59.79.131) behind Caddy:

```
browser ──HTTPS──> Caddy (take-one.gbsims.com) ──> node server/index.js on 127.0.0.1:3310 ──> SQLite in /var/lib/take-one
```

The Node app serves the page and the `/api` routes. Every push to `main` runs the server tests and, when they pass, deploys over SSH (`.github/workflows/deploy.yml`).

| What | Where |
| --- | --- |
| Releases, one folder per commit (last five kept) | `/srv/take-one/releases/<sha>` |
| The live release | `/srv/take-one/current` (a symlink) |
| Database and daily backups (14 days) | `/var/lib/take-one/take-one.db`, `/var/lib/take-one/backups/` |
| Settings | `/etc/take-one/env` |
| Service | `systemctl status take-one`, logs with `journalctl -u take-one` |

## One-time setup

### 1. Google sign-in

In the [Google Cloud console](https://console.cloud.google.com/apis/credentials):

1. Create a project (or use an existing one) and set up the OAuth consent screen: app name "Take One", your support email, and the `email`, `profile` and `openid` scopes. Publish it so anyone can sign in.
2. Create credentials, then **OAuth client ID**, then **Web application**.
3. Under **Authorised JavaScript origins**, add `https://take-one.gbsims.com`. Add `http://localhost:3310` too if you want to run it on your own machine.
4. Leave redirect URIs empty. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`). There is no secret to keep; the page only needs the ID.

### 2. A deploy key

On your own computer:

```
ssh-keygen -t ed25519 -f take-one-deploy -N "" -C take-one-deploy
```

This makes `take-one-deploy` (private, goes to GitHub) and `take-one-deploy.pub` (public, goes to the server).

### 3. The server

Log in to the droplet and run, with your values:

```
curl -fsSLO https://raw.githubusercontent.com/leviosa-consulting/take-one/main/deploy/setup.sh
sudo DEPLOY_PUBKEY="$(cat take-one-deploy.pub)" GOOGLE_CLIENT_ID="1234.apps.googleusercontent.com" bash setup.sh
```

(Paste the contents of `take-one-deploy.pub` in place of the `$(cat ...)` if the file is not on the server.)

The script needs Node.js 20 or newer and says how to install it if it is missing. It creates a `takeone` user that owns the app and may restart only its own service. Run it again at any time; it changes nothing that is already right.

Then add this block to the Caddyfile (usually `/etc/caddy/Caddyfile`) and reload Caddy:

```
take-one.gbsims.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3310
}
```

```
sudo systemctl reload caddy
```

Caddy gets the HTTPS certificate by itself. The DNS A record for `take-one.gbsims.com` must point at this droplet.

### 4. GitHub secrets

In the repo, open **Settings, Secrets and variables, Actions** and add:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | `139.59.79.131` |
| `DEPLOY_SSH_KEY` | the whole contents of the private key file `take-one-deploy` |
| `DEPLOY_KNOWN_HOSTS` | the output of `ssh-keyscan 139.59.79.131` (run it from your computer) |

Then open **Actions, Deploy to the server, Run workflow**. When it goes green, https://take-one.gbsims.com is live.

Turn GitHub Pages off (**Settings, Pages**, source **None**) so the old copy at github.io stops serving.

## Everyday

- **Deploy:** merge to `main`. A failing test stops the deploy.
- **Undo a bad release:** on the server, `ls -t /srv/take-one/releases`, then `sudo -u takeone ln -sfn /srv/take-one/releases/<older sha> /srv/take-one/current && sudo systemctl restart take-one`.
- **Restore the database:** `sudo systemctl stop take-one`, copy a file from `backups/` over `take-one.db` (delete `take-one.db-wal` and `take-one.db-shm` first), then start the service. Copy the backups off the droplet now and then too; DigitalOcean droplet backups cover this if they are on.
- **Change a setting:** edit `/etc/take-one/env`, then `sudo systemctl restart take-one`.

## Running it on your own machine

```
cd server
npm install
GOOGLE_CLIENT_ID=1234.apps.googleusercontent.com COOKIE_SECURE=0 npm start
```

Open http://localhost:3310. The database goes to `server/data/`. `npm test` runs the API tests with a stand-in for Google.
