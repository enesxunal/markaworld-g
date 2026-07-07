#!/usr/bin/env bash
# Hosting SMTP ayarı — Gmail token sürekli düşerse bunu kullanın
# Kullanım:
#   bash scripts/set-smtp-env.sh "mail.markaworld.com.tr" 587 "info@markaworld.com.tr" "eposta-sifresi"

set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env"
HOST="${1:-mail.markaworld.com.tr}"
PORT="${2:-587}"
USER_EMAIL="${3:-info@markaworld.com.tr}"
PASS="${4:-}"

if [[ -z "$PASS" ]]; then
  echo "Kullanım: bash scripts/set-smtp-env.sh HOST PORT EMAIL SIFRE"
  echo "Örnek:   bash scripts/set-smtp-env.sh mail.markaworld.com.tr 587 info@markaworld.com.tr 'Sifren123'"
  exit 1
fi

cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d-%H%M)"

grep -v '^EMAIL_HOST=' "$ENV_FILE" \
  | grep -v '^EMAIL_PORT=' \
  | grep -v '^EMAIL_SECURE=' \
  | grep -v '^EMAIL_USER=' \
  | grep -v '^EMAIL_PASS=' \
  | grep -v '^EMAIL_FROM=' \
  | grep -v '^EMAIL_DRIVER=' > "${ENV_FILE}.tmp"

{
  cat "${ENV_FILE}.tmp"
  echo "EMAIL_DRIVER=smtp"
  echo "EMAIL_HOST=${HOST}"
  echo "EMAIL_PORT=${PORT}"
  echo "EMAIL_SECURE=false"
  echo "EMAIL_USER=${USER_EMAIL}"
  echo "EMAIL_PASS=${PASS}"
  echo "EMAIL_FROM=Marka World <${USER_EMAIL}>"
} > "$ENV_FILE"

rm -f "${ENV_FILE}.tmp"

echo "OK — SMTP ayarlandı (${HOST}:${PORT}, ${USER_EMAIL})"
echo "Test: node scripts/test-smtp.js alici@email.com"

pm2 restart markaworld-backend --update-env 2>/dev/null || echo "pm2 restart markaworld-backend --update-env"
