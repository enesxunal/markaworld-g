# Canlı sunucuya deploy (Marka World)

## Önce yedek

```bash
cp /var/www/markaworld/server/database/database.sqlite \
   /var/www/markaworld/server/database/database.sqlite.backup-$(date +%Y%m%d)
```

## Kodu çek

```bash
cd /var/www/markaworld
git pull origin main
```

## server/.env (zorunlu alanlar)

`server/env.example` dosyasını kopyalayıp doldurun:

- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin panel girişi
- `JWT_SECRET` — uzun rastgele anahtar
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` — hosting SMTP
- `FRONTEND_URL=https://markaworld.com.tr`
- `NODE_ENV=production`

## Backend

```bash
cd /var/www/markaworld/server
npm install
pm2 restart markaworld-backend
pm2 logs markaworld-backend --lines 30
```

## Frontend

```bash
cd /var/www/markaworld/client
npm install
npm run build
cp -r build/* /var/www/html/
# roundcube klasörüne dokunmayın
```

## Test

```bash
curl -s https://markaworld.com.tr/api/health
```

Tarayıcıda yeni müşteri kaydı → e-posta → doğrulama linki → sözleşme → giriş.
