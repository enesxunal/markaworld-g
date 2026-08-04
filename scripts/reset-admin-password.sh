#!/usr/bin/env bash
# Admin şifresini bcrypt hash olarak .env'e yazar (sunucuda SSH ile).
# Kullanım: bash scripts/reset-admin-password.sh "YeniSifreniz"
# Plaintext ADMIN_PASSWORD yazılmaz; yalnızca ADMIN_PASSWORD_HASH.
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

if [[ ! -f "$ENV" ]]; then
  echo "HATA: $ENV bulunamadı."
  exit 1
fi

cp "$ENV" "${ENV}.bak.$(date +%Y%m%d-%H%M)" 2>/dev/null || true

HASH="$(
  cd "$ROOT/server"
  node -e "const bcrypt=require('bcrypt'); bcrypt.hash(process.argv[1], 12).then((h)=>process.stdout.write(h));" "$NEW_PASS"
)"

if [[ -z "$HASH" || "$HASH" != \$2* ]]; then
  echo "HATA: bcrypt hash üretilemedi (server/node_modules/bcrypt kurulu mu?)."
  exit 1
fi

grep -vE '^ADMIN_USERNAME=|^ADMIN_PASSWORD=|^ADMIN_PASSWORD_HASH=' "$ENV" > "${ENV}.tmp" || touch "${ENV}.tmp"
{
  cat "${ENV}.tmp"
  echo "ADMIN_USERNAME=markaworld"
  echo "ADMIN_PASSWORD_HASH=${HASH}"
} > "$ENV"
rm -f "${ENV}.tmp"

grep -qE '^JWT_SECRET=.+' "$ENV" || echo "JWT_SECRET=markaworld-jwt-$(openssl rand -hex 16)" >> "$ENV"

cd "$ROOT/server"
pm2 restart markaworld-backend --update-env
sleep 2

echo ""
echo "Admin güncellendi (hash kaydedildi; şifre dosyaya düz metin yazılmadı)."
echo "  Kullanıcı: markaworld"
echo "Giriş: https://markaworld.com.tr/admin/login"
echo ""
curl -s -X POST "http://127.0.0.1:5000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"markaworld\",\"password\":\"${NEW_PASS}\"}" | head -c 200
echo ""
