#!/usr/bin/env bash
# One-time server setup for Take One. Run as root on the server. Safe to run again.
#
#   sudo DEPLOY_PUBKEY="ssh-ed25519 AAAA... take-one-deploy" GOOGLE_CLIENT_ID="123.apps.googleusercontent.com" bash setup.sh
#
# It creates the takeone user, the folders, the settings file and the service.
# It does not touch Caddy; deploy/README.md shows the lines to add.
set -euo pipefail

APP_USER=takeone
APP_DIR=/srv/take-one
DATA_DIR=/var/lib/take-one
ENV_DIR=/etc/take-one
PORT="${PORT:-3310}"

[ "$(id -u)" = 0 ] || { echo "Run this as root (sudo bash setup.sh)."; exit 1; }

NODE="$(command -v node || true)"
if [ -z "$NODE" ] || [ "$("$NODE" -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "Take One needs Node.js 20 or newer. On Ubuntu:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs build-essential"
  exit 1
fi
command -v rsync >/dev/null || { echo "Installing rsync"; apt-get install -y rsync; }

if ss -ltn "sport = :$PORT" | grep -q LISTEN && ! systemctl is-active --quiet take-one; then
  echo "Port $PORT is already in use. Run again with PORT=<free port>."; exit 1
fi

id "$APP_USER" >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR" --create-home --shell /bin/bash "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 755 "$APP_DIR" "$APP_DIR/releases"
install -d -o "$APP_USER" -g "$APP_USER" -m 700 "$DATA_DIR"
install -d -o root -g "$APP_USER" -m 750 "$ENV_DIR"

if [ ! -f "$ENV_DIR/env" ]; then
  cat > "$ENV_DIR/env" <<EOF
PORT=$PORT
DATA_DIR=$DATA_DIR
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
EOF
  chown root:"$APP_USER" "$ENV_DIR/env"; chmod 640 "$ENV_DIR/env"
  echo "Wrote $ENV_DIR/env"
elif [ -n "${GOOGLE_CLIENT_ID:-}" ]; then
  sed -i "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" "$ENV_DIR/env"
  echo "Updated GOOGLE_CLIENT_ID in $ENV_DIR/env"
fi

# The GitHub deploy logs in as takeone with this key.
if [ -n "${DEPLOY_PUBKEY:-}" ]; then
  install -d -o "$APP_USER" -g "$APP_USER" -m 700 "$APP_DIR/.ssh"
  touch "$APP_DIR/.ssh/authorized_keys"
  grep -qxF "$DEPLOY_PUBKEY" "$APP_DIR/.ssh/authorized_keys" || echo "$DEPLOY_PUBKEY" >> "$APP_DIR/.ssh/authorized_keys"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.ssh/authorized_keys"; chmod 600 "$APP_DIR/.ssh/authorized_keys"
  echo "Added the deploy key for $APP_USER"
fi

# takeone may restart its own service and nothing else.
SYSTEMCTL="$(command -v systemctl)"
cat > /etc/sudoers.d/take-one <<EOF
$APP_USER ALL=(root) NOPASSWD: $SYSTEMCTL restart take-one, $SYSTEMCTL is-active take-one
EOF
chmod 440 /etc/sudoers.d/take-one
visudo -cf /etc/sudoers.d/take-one >/dev/null

cat > /etc/systemd/system/take-one.service <<EOF
[Unit]
Description=Take One
After=network.target

[Service]
User=$APP_USER
Group=$APP_USER
EnvironmentFile=$ENV_DIR/env
WorkingDirectory=$APP_DIR/current/server
ExecStart=$NODE index.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable take-one >/dev/null
echo "Installed the take-one service. It starts after the first deploy."
echo
echo "Next: add the Caddy lines from deploy/README.md, then run the deploy from GitHub."
grep -q '^GOOGLE_CLIENT_ID=.\+' "$ENV_DIR/env" || echo "Also set GOOGLE_CLIENT_ID in $ENV_DIR/env, then: systemctl restart take-one"
