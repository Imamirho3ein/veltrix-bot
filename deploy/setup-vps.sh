#!/usr/bin/env bash
# One-time setup for an Ubuntu/Debian VPS (run as root).
# Expects the project already uploaded to /opt/veltrix-bot (override with APP_DIR=...).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/veltrix-bot}"
APP_USER="${APP_USER:-veltrixbot}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root: sudo bash deploy/setup-vps.sh" >&2
  exit 1
fi

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Could not find $APP_DIR/package.json — upload the project first." >&2
  exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo "Missing $APP_DIR/.env — copy .env.example and fill in the token/IDs." >&2
  exit 1
fi

echo "==> Installing Node.js 22 and build tools"
apt-get update
apt-get install -y curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "==> Creating service user $APP_USER"
id -u "$APP_USER" >/dev/null 2>&1 || \
  useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"

echo "==> Installing dependencies"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci
sudo -u "$APP_USER" npm run typecheck

echo "==> Installing systemd service"
install -m 0644 "$APP_DIR/deploy/veltrix-bot.service" /etc/systemd/system/veltrix-bot.service
systemctl daemon-reload
systemctl enable --now veltrix-bot

echo
echo "Done. Follow the logs with:"
echo "  journalctl -u veltrix-bot -f"
echo
sleep 2
systemctl --no-pager --lines=15 status veltrix-bot || true
