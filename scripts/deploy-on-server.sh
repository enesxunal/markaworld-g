#!/usr/bin/env bash
# Sunucuda çalıştırın: bash /var/www/markaworld/scripts/deploy-on-server.sh
# Varsayılan admin şifresi YAZMAZ. ADMIN_PASSWORD_HASH yoksa fail-fast.
set -euo pipefail

ROOT="${MARKAWORLD_ROOT:-/var/www/markaworld}"
cd "$ROOT"

echo "=== Veritabanı yedeği ==="
cp "$ROOT/server/database/database.sqlite" \
  "$ROOT/server/database/database.sqlite.backup-$(date +%Y%m%d-%H%M)"

echo "=== Kod güncelleme ==="
git fetch origin main
git reset --hard origin/main
git log -1 --oneline

ENV="$ROOT/server/.env"
if [ ! -f "$ENV" ]; then
  echo "HATA: $ENV yok."
  echo "server/env.example dosyasını kopyalayıp JWT_SECRET ve ADMIN_PASSWORD_HASH ayarlayın."
  echo "Hash üretmek için: bash scripts/reset-admin-password.sh \"GucluSifreniz\""
  exit 1
fi

if ! grep -qE '^ADMIN_PASSWORD_HASH=\$.+' "$ENV" 2>/dev/null; then
  echo "HATA: ADMIN_PASSWORD_HASH tanımlı değil veya geçersiz."
  echo "Düzeltme: bash scripts/reset-admin-password.sh \"GucluSifreniz\""
  exit 1
fi

if ! grep -qE '^JWT_SECRET=.+' "$ENV" 2>/dev/null; then
  echo "HATA: JWT_SECRET tanımlı değil."
  exit 1
fi

grep -q '^ADMIN_USERNAME=' "$ENV" 2>/dev/null || echo 'ADMIN_USERNAME=markaworld' >> "$ENV"
grep -q '^FRONTEND_URL=' "$ENV" 2>/dev/null || echo 'FRONTEND_URL=https://markaworld.com.tr' >> "$ENV"
grep -q '^NODE_ENV=' "$ENV" 2>/dev/null || echo 'NODE_ENV=production' >> "$ENV"
grep -q '^PORT=' "$ENV" 2>/dev/null || echo 'PORT=5000' >> "$ENV"

echo "=== Backend ==="
cd "$ROOT/server"
npm install --omit=dev
pm2 restart markaworld-backend
sleep 2

echo "=== Frontend ==="
cd "$ROOT/client"
npm install
CI=false npm run build
cp -r build/* /var/www/html/

echo "=== Sağlık kontrolü ==="
curl -sf http://127.0.0.1:5000/api/health
echo ""
curl -sf https://markaworld.com.tr/api/health || true
echo ""
echo "Deploy tamamlandı."
