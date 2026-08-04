# Marka World — Fix Phase 1 Raporu

**Tarih:** 2026-08-04  
**Kapsam:** SEC-001, SEC-002, SEC-003, SEC-004, SEC-006, SEC-010, CONFIG-002, BUG-001, BUG-005  
**Branch:** `main`  
**Baz commit:** `ad959ab` — *Mail: SMTP öncelikli gönderim ve Gmail token düşünce yedek.*  
**Commit/push/deploy:** Yapılmadı (bilinçli).

---

## Yönetici Özeti

### Düzeltilen bulgular
- **SEC-001** — Sabit/varsayılan admin kimlik bilgisi kaldırıldı; `api/` stub silindi; deploy fail-fast.
- **SEC-002** — Admin login bcrypt hash + rate limit (IP+kullanıcı adı).
- **SEC-003** — Kayıt ve auth yollarında şifre/token/PII logları temizlendi.
- **SEC-004** — Yedek dosya adı path traversal engellendi.
- **SEC-006** — `X-Powered-By` kapatıldı; Helmet ile temel güvenlik header’ları eklendi.
- **SEC-010** — Admin auth middleware Authorization/header logları kaldırıldı.
- **CONFIG-002** — `Server-credentials.md` working tree takibinden çıkarıldı (lokal kopya duruyor).
- **BUG-001** — Müşteri login yönlendirmesi `/customer/profile`; bozuk localStorage güvenli.
- **BUG-005** — `email_templates` için `DROP TABLE` kaldırıldı; `INSERT OR IGNORE` ile idempotent init.

### Kısmen düzeltilen bulgular
- **SEC-006** — Express tarafı tamam; nginx’te CSP/HSTS/frame header’larının da ayarlanması önerilir (manuel).
- **CONFIG-002** — Dosya untrack edildi; **Git history scrub** yapılmadı (bilinçli; force history rewrite yok).

### Düzeltilmeyen bulgular (bu turda yasak alanlar)
- BUG-002, BUG-003, BUG-004, BUG-006 ve diğer finansal/iş kuralı bulguları
- SEC-005 HttpOnly cookie migration
- SEO/PERF kapsamı, major dependency upgrade

### Manuel işlem gerekenler
1. Production’da `ADMIN_PASSWORD_HASH` üretip `.env`’e yazmak (`scripts/reset-admin-password.sh`).
2. Eski düz metin `ADMIN_PASSWORD` satırını production `.env`’den kaldırmak.
3. Bilinen varsayılan/sızmış admin şifresini **rotate** etmek.
4. `Server-credentials.md` Git geçmişinde olduğu için secret rotasyonu + ileride history temizliği planı.
5. GitHub Actions / VPS secret’larını güncellemek; PM2 `--update-env` ile reload.
6. nginx security header’larını doğrulamak.

### Production deploy öncesi kritik uyarılar
- Deploy script’leri artık `.env` yoksa veya `ADMIN_PASSWORD_HASH` yoksa **bilinçli olarak fail eder**.
- Eski plaintext `ADMIN_PASSWORD` ile login **çalışmaz**.
- Bu turda production DB’ye dokunulmadı; commit/push/deploy yapılmadı.

---

## Başlangıçta mevcut lokal değişiklikler (korundu)

| Dosya | Kullanıcı değişikliği | Bu turda |
|-------|----------------------|----------|
| `client/src/pages/BulkEmail.js` | Toplu mail timeout 5 dk | Korundu |
| `client/src/services/api.js` | Bulk timeout + `post(data,config)` | Korundu |
| `server/services/emailService.js` | SMTP cache, rate-limit hatası, sleep 800 | Korundu |
| `server/services/verificationService.js` | `delayMs` varsayılan 800 | Korundu |
| `server/routes/admin.js` | Bulk verification `delayMs: 800` | Korundu; üzerine auth/backup eklendi |
| `Server-credentials.md` | Lokal içerik | İçeriğe dokunulmadı; yalnızca `git rm --cached` |

Untracked (önceden vardı, bu turda dokunulmayanlar): `scripts/fix-dns-and-deploy.sh`, `scripts/setup-github-deploy-secrets.py`, `tmp-mail-preview.html`, `MARKAWORLD_TECHNICAL_AUDIT.md`.

---

## Bulgu Bazlı Sonuç

### SEC-001 — Sabit/varsayılan admin kimlik bilgisi
- **Önceki durum:** `api/admin.js` sabit kullanıcı/şifre; deploy script’leri varsayılan `ADMIN_PASSWORD` yazıyordu.
- **Yapılan:** `api/` klasörü silindi (`vercel.json` → `server/index.js`; VPS deploy `server/` kullanıyor). Deploy script’leri varsayılan şifre yazmayı bıraktı; hash yoksa exit 1. `reset-admin-password.sh` bcrypt hash yazar.
- **Dosyalar:** `api/*` (silindi), `.github/workflows/deploy.yml`, `scripts/deploy-on-server.sh`, `scripts/reset-admin-password.sh`, `server/env.example`, `server/.env.production.example`, `docs/GMAIL-KURULUM.md`
- **Güvenlik etkisi:** Repodan sabit credential kaldırıldı; yeni deploy sessizce zayıf şifre açmaz.
- **Uyumluluk:** Eski plaintext `ADMIN_PASSWORD` ile login kırılır (bilinçli).
- **Testler:** Pattern araması temiz; backend auth testleri.
- **Kalan risk:** Eski secret’lar history/VPS’te olabilir → rotasyon şart.
- **Manuel:** Production hash üret + rotate.

### SEC-002 — Admin auth sertleştirme
- **Önceki durum:** Düz metin karşılaştırma; rate limit yok; `bcrypt` import edilip kullanılmıyordu.
- **Yapılan:** `ADMIN_PASSWORD_HASH` + `bcrypt.compare`; dummy hash ile timing dengeleme; `express-rate-limit` (15 dk / 5 deneme, başarılı atlanır); genel hata mesajı.
- **Dosyalar:** `server/routes/admin.js`, `server/package.json`, `server/package-lock.json`
- **Güvenlik etkisi:** Brute-force ve plaintext storage riski azaltıldı.
- **Uyumluluk:** Hash zorunlu; plaintext env fallback yok.
- **Testler:** `server/test/adminAuth.test.js` — yanlış şifre, geçersiz hash (503), doğru hash+JWT, 429.
- **Sonuç:** Geçti.
- **Kalan risk:** Rate limit reverse-proxy IP’si için `trust proxy` açıldı; nginx doğru `X-Forwarded-For` göndermeli.
- **Manuel:** Hash’i production’a koy.

### SEC-003 / SEC-010 — Hassas log temizliği
- **Önceki durum:** `customers` register `req.body`/token/tc_no log; auth middleware Authorization + tüm header log.
- **Yapılan:** Hassas loglar kaldırıldı; `safeLog` yardımcıları; debug middleware production kapalı ve body scrub; sales `Headers` logu kaldırıldı.
- **Dosyalar:** `server/routes/customers.js`, `server/middleware/auth.js`, `server/index.js`, `server/routes/sales.js`, `server/utils/safeLog.js`
- **Güvenlik etkisi:** Log erişimiyle token/şifre sızıntısı azaltıldı.
- **Testler:** `safeLog.test.js`; kaynak tarama (riskli eşleşme yok).
- **Kalan risk:** `sales.js` ve diğer sayfalarda operasyonel debug logları (PII olmayan) hâlâ olabilir — bu turda finansal akışa dokunulmadı.

### SEC-004 — Backup path traversal
- **Önceki durum:** `path.join(BACKUP_DIR, filename)` sanitize yok.
- **Yapılan:** `resolveSafeBackupPath()` — basename eşleşmesi, `..`/`/`/`\`/null byte reddi, regex allowlist, resolve+realpath kontrolü; download/restore/delete ortak.
- **Dosyalar:** `server/utils/backupPath.js`, `server/services/backupService.js`, `server/routes/admin.js`
- **Testler:** `backupPath.test.js` — traversal/absolute/uzantı reddi.
- **Kalan risk:** Düşük (auth hâlâ gerekli).

### SEC-006 — Security headers
- **Önceki durum:** Canlıda header yok; `X-Powered-By: Express`.
- **Yapılan:** `app.disable('x-powered-by')` + Helmet (CSP bilerek kapalı — MUI/Emotion/iframe kırılmasın). HSTS yalnızca `NODE_ENV=production`.
- **Dosyalar:** `server/index.js`
- **Testler:** `securityHeaders.test.js`
- **Kalan risk:** Statik frontend nginx’te ayrı CSP/HSTS gerekir.
- **Manuel:** nginx header kontrolü.

### CONFIG-002 — Credential dosyası
- **Önceki durum:** `.gitignore`’da ama tracked.
- **Yapılan:** `git rm --cached Server-credentials.md`; lokal dosya silinmedi; içeriğe dokunulmadı.
- **History scrub:** Yapılmadı.
- **Manuel:** Tüm listedeki secret’ları rotate et; history temizliği ayrı plan.

### BUG-001 — Müşteri yönlendirme / bozuk oturum
- **Önceki durum:** `/sale/:id` (yok); `JSON.parse` try/catch yok.
- **Yapılan:** `/customer/profile`; token+customer tutarlılık; bozuk JSON temizlenir; admin/müşteri oturum ayrımı; login route’ları ProtectedRoute ile sarıldı.
- **Dosyalar:** `client/src/components/ProtectedRoute.js`, `client/src/App.js`, testler
- **Testler:** `ProtectedRoute.test.js` (7) + smoke — geçti.

### BUG-005 — email_templates DROP
- **Önceki durum:** Her init’te `DROP TABLE` + `INSERT OR REPLACE`.
- **Yapılan:** `CREATE TABLE IF NOT EXISTS`; `INSERT OR IGNORE`. (Yan etki: `email_logs` için de DROP kaldırıldı — aynı güvenli kalıp.)
- **Dosyalar:** `server/database/init.js`
- **Testler:** `emailTemplates.test.js` — özel şablon 2. init sonrası duruyor.
- **Production DB:** Dokunulmadı.

---

## Değiştirilen Dosyalar

| Dosya | Neden | Özet | Kullanıcı değişikliği korundu mu |
|-------|-------|------|----------------------------------|
| `api/*` | SEC-001 | Stub silindi | N/A |
| `.github/workflows/deploy.yml` | SEC-001 | Fail-fast; varsayılan şifre yok | N/A (önceden untracked) |
| `scripts/deploy-on-server.sh` | SEC-001 | Fail-fast | N/A |
| `scripts/reset-admin-password.sh` | SEC-001/002 | bcrypt hash yazar | N/A |
| `server/env.example` | SEC-001/002 | `ADMIN_PASSWORD_HASH` | N/A |
| `server/.env.production.example` | SEC-001/002 | Hash alanı | N/A |
| `docs/GMAIL-KURULUM.md` | SEC-001 | Örnek env güncellendi | N/A |
| `server/routes/admin.js` | SEC-002/004 | Hash login, rate limit, safe backup | Evet (`delayMs: 800`) |
| `server/package.json` / lock | SEC-002/006 | `helmet`, `express-rate-limit`, `test` script | N/A |
| `server/middleware/auth.js` | SEC-010 | Hassas log yok | N/A |
| `server/routes/customers.js` | SEC-003 | Register log scrub | N/A |
| `server/routes/sales.js` | SEC-003 | Headers log kaldırıldı | N/A (iş mantığı yok) |
| `server/index.js` | SEC-006/003 | Helmet, X-Powered-By, scrubbed debug | N/A |
| `server/utils/safeLog.js` | SEC-003 | Yeni | N/A |
| `server/utils/backupPath.js` | SEC-004 | Yeni | N/A |
| `server/services/backupService.js` | SEC-004 | Safe path | N/A |
| `server/database/init.js` | BUG-005 | DROP kaldır, IGNORE | N/A |
| `client/.../ProtectedRoute.js` | BUG-001 | Redirect + session | N/A |
| `client/src/App.js` | BUG-001 | Login wrap | N/A |
| `client/.../ProtectedRoute.test.js` | BUG-001 | Yeni test | N/A |
| `client/src/App.test.js` | TEST | Axios kırık şablon kaldırıldı | N/A |
| `server/test/*` | TEST | Backend testleri | N/A |
| `Server-credentials.md` | CONFIG-002 | Untrack only | İçerik korunmuş |
| `client/.../BulkEmail.js` vb. | Önceki kullanıcı | — | Korundu |

---

## Komut Sonuçları

| Komut | Exit | Sonuç | Not |
|-------|------|-------|-----|
| `git status --short` (başlangıç) | 0 | OK | Önceden M: BulkEmail, api.js, admin, email, verification, credentials |
| `cd server && npm test` | 0 | **16/16 geçti** | adminAuth, backupPath, emailTemplates, safeLog, securityHeaders |
| `cd client && CI=true npm test -- --watchAll=false --testPathPattern=ProtectedRoute\|App.test` | 0 | **8/8 geçti** | CRA deprecation uyarıları (eski) |
| `npx eslint src/components/ProtectedRoute.js src/App.js` | 0 | OK | Yeni hata yok |
| `CI=false npm run build` (client) | 0 | OK | Mevcut ESLint uyarıları (Home unused vars vb.) — regresyon değil |
| `node --check` (index, admin, auth, backup, init, utils) | 0 | OK | |
| `npm audit` (server) | 0* | 25 vuln (1 critical) | `npm audit fix --force` **kullanılmadı**; SEC-007 bu turda yok |
| `git diff --check` | 0 | OK | |
| Tam sunucu health smoke (local sqlite) | — | Atlandı | Lokal `database.sqlite` 0 bayt boş dosyaydı (test açılışı); silindi. Header testi izole geçti. Production DB yok. |

\* npm audit exit kodu toolchain’e göre değişebilir; raporlanan sayı: 25.

### Yeni bağımlılıklar
- `helmet@^7.2.0` — security headers
- `express-rate-limit@^7.5.1` — admin login rate limit  
Mevcut `bcrypt` kullanıldı (yeni auth paketi yok).

---

## Secret Rotasyon Kontrol Listesi

Gerçek değer yazılmadan:

- [ ] Admin şifresini güçlü yeni bir değerle değiştir
- [ ] Sunucuda: `bash scripts/reset-admin-password.sh "YeniSifre"` → `ADMIN_PASSWORD_HASH` yazılır
- [ ] Production `.env` içinden düz metin `ADMIN_PASSWORD` satırını kaldır
- [ ] JWT_SECRET sızmış olabilir → rotate değerlendirmesi
- [ ] Eski deploy/script varsayılan credential’larını geçersiz say
- [ ] GitHub Actions `SSH_*` secret’larını gözden geçir / güncelle
- [ ] VPS `.env` güncelle
- [ ] `pm2 restart markaworld-backend --update-env`
- [ ] Aktif admin JWT oturumlarını geçersiz kıl (secret rotate veya 24s süre bekle)
- [ ] `Server-credentials.md` history’de → tüm listedeki erişim bilgilerini rotate et; history scrub ayrı plan (`git filter-repo` / BFG — bu turda çalıştırılmadı)

---

## Deploy Öncesi Kontrol Listesi

- [ ] Database yedeği al
- [ ] `ADMIN_PASSWORD_HASH` + `JWT_SECRET` hazır
- [ ] Hash ile admin login testi
- [ ] Backup list/download (normal ad) + traversal denemesi (400)
- [ ] Restart sonrası `email_templates` özel kayıtları duruyor
- [ ] `/api/health` 200
- [ ] Frontend build
- [ ] Response’da `X-Powered-By` yok; `X-Content-Type-Options` var
- [ ] nginx header kontrolü (CSP/HSTS)
- [ ] Rollback: önceki release + `.env.bak.*`

---

## Dokunulmayan Alanlar (doğrulandı)

- Gecikme faizi hesaplama / BUG-002 şema düzeltmesi — **değiştirilmedi**
- Limit artırma iş kuralı (BUG-004) — **değiştirilmedi**
- Satış onay iş akışı (BUG-003) — **değiştirilmedi**
- Satış/taksit/borç transaction mimarisi (BUG-006) — **değiştirilmedi**
- Ödeme kayıt iş mantığı — **değiştirilmedi**
- Production veritabanı — **dokunulmadı**
- HttpOnly cookie migration — **yapılmadı**
- SEO / performans kapsamı — **yapılmadı**
- Major dependency upgrade / `npm audit fix --force` — **yapılmadı**
- Commit / push / production deploy — **yapılmadı**

---

## Son Doğrulama Özeti

| Kontrol | Durum |
|---------|--------|
| Sabit admin şifresi kaynakta yok | OK |
| Plaintext admin password karşılaştırması yok | OK |
| Admin login rate limit | OK |
| Şifre/token/Authorization loglanmıyor | OK |
| Backup traversal engelli | OK |
| X-Powered-By kapalı | OK |
| Temel security header’lar | OK |
| Müşteri redirect `/customer/profile` | OK |
| Bozuk localStorage çökertmiyor | OK |
| email_templates DROP yok; idempotent | OK |
| Production DB dokunulmadı | OK |
| Kullanıcı lokal değişiklikleri korundu | OK |
| Gerçek secret raporlanmadı | OK |
| Finansal iş kuralları değiştirilmedi | OK |

---

## Notlar

1. **CSP:** API’de Helmet CSP kapalı bırakıldı; MUI Emotion + Maps iframe + e-posta preview kırılmasın diye. Frontend için nginx CSP sonraki aşama.
2. **Lokal boş sqlite:** Test sırasında 0 baytlık `server/database/database.sqlite` oluştuğu görüldü ve silindi (içerik yoktu). Production yolu değil.
3. **`email_logs`:** DROP kaldırıldı (BUG-005 ile aynı blok); log birikimi artabilir — kabul edilebilir.
