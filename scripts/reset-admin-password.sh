#!/usr/bin/env bash
# Admin şifresini sıfırla (sunucuda SSH ile)
# Kullanım: bash scripts/reset-admin-password.sh "YeniSifreniz"
set -euo pipefail

ROOT="${MARKAWORLD_ROOT:-/var/www/markaworld}"
ENV="$ROOT/server/.env"
NEW_PASS="${1:-}"

if [[ -z "$NEW_PASS" ]]; then
  echo "Kullanım: bash scripts/reset-admin-password.sh \"YeniSifreniz\""
  exit 1
fi

if [[ ${#NEW_PASS} -lt 8 ]]; then
  echo "Şifre en az 8 karakter olmalı."
  exit 1
fi

cp "$ENV" "${ENV}.bak.$(date +%Y%m%d-%H%M)" 2>/dev/null || true

grep -v '^ADMIN_USERNAME=' "$ENV" 2>/dev/null | grep -v '^ADMIN_PASSWORD=' > "${ENV}.tmp" || touch "${ENV}.tmp"
{
  cat "${ENV}.tmp"
  echo "ADMIN_USERNAME=markaworld"
  echo "ADMIN_PASSWORD=${NEW_PASS}"
} > "$ENV"
rm -f "${ENV}.tmp"

grep -q '^JWT_SECRET=' "$ENV" || echo "JWT_SECRET=markaworld-jwt-$(openssl rand -hex 16)" >> "$ENV"

cd "$ROOT/server"
pm2 restart markaworld-backend --update-env
sleep 2

echo ""
echo "Admin güncellendi:"
echo "  Kullanıcı: markaworld"
echo "  Şifre: (az önce verdiğiniz)"
echo ""
echo "Giriş: https://markaworld.com.tr/admin/login"
echo ""
curl -s -X POST "http://127.0.0.1:5000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"markaworld\",\"password\":\"${NEW_PASS}\"}" | head -c 200
echo ""
