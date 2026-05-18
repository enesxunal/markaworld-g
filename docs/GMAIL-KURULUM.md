# Gmail ile e-posta (canlı sunucu)

## 1. `.env` dosyası (her satır ayrı)

Dosya: `/var/www/markaworld/server/.env`

```env
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_USER=...

JWT_SECRET=...
ADMIN_USERNAME=markaworld
ADMIN_PASSWORD=...
FRONTEND_URL=https://markaworld.com.tr
NODE_ENV=production
PORT=5000
```

**EMAIL_ satırlarını kullanmayın** (Gmail yeterli).

## 2. Güncelle ve yeniden başlat

```bash
cd /var/www/markaworld && git pull origin main
cd server && npm install --omit=dev
pm2 restart markaworld-backend
pm2 logs markaworld-backend --lines 20 --nostream
```

Logda: `✅ E-posta: Gmail OAuth hazır`

## 3. Test

```bash
cd /var/www/markaworld/server
node scripts/test-smtp.js alici@email.com
```

## 4. Kayıt maili tekrar gönder

```bash
curl -X POST https://markaworld.com.tr/api/customers/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"musteri@email.com"}'
```
