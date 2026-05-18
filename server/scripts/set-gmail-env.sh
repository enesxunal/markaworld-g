#!/usr/bin/env bash
# Gmail .env güncelleme (nano gerekmez)
# Kullanım:
#   bash scripts/set-gmail-env.sh "REFRESH_TOKEN" "gmail@adres.com"

set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env"
TOKEN="${1:-}"
USER_EMAIL="${2:-enesunal700@gmail.com}"

if [[ -z "$TOKEN" ]]; then
  echo "Kullanım: bash scripts/set-gmail-env.sh \"REFRESH_TOKEN\" \"gmail@adres.com\""
  exit 1
fi

cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d-%H%M)"

# Eski satırları kaldır, dosyanın geri kalanını tut
grep -v '^GMAIL_REFRESH_TOKEN=' "$ENV_FILE" | grep -v '^GMAIL_USER=' > "${ENV_FILE}.tmp"

{
  cat "${ENV_FILE}.tmp"
  echo "GMAIL_REFRESH_TOKEN=${TOKEN}"
  echo "GMAIL_USER=${USER_EMAIL}"
} > "$ENV_FILE"

rm -f "${ENV_FILE}.tmp"

echo "OK — .env güncellendi (yedek: ${ENV_FILE}.bak.*)"
echo "GMAIL_USER=${USER_EMAIL}"
echo "GMAIL_REFRESH_TOKEN uzunluk: ${#TOKEN} karakter"

pm2 restart markaworld-backend --update-env 2>/dev/null || echo "pm2 restart markaworld-backend çalıştır"
