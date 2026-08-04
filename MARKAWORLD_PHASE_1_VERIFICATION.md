# Marka World — Phase 1 Deployment Öncesi Doğrulama Raporu

**Tarih:** 2026-08-04  
**Tür:** Salt okunur doğrulama (kaynak kod değiştirilmedi)  
**Branch:** `main` @ `ad959ab`  
**İncelenen kapsam:** Phase 1 (SEC-001/002/003/004/006/010, CONFIG-002, BUG-001/005) + önceki mail timeout/SMTP lokal değişiklikleri  

**Bu turda yapılmayanlar:** kod değişikliği, fix, commit, push, deploy, `.env` okuma/yazma, migration, paket güncelleme, `npm audit fix`.

---

## 1. Yönetici özeti

Phase 1 güvenlik/bug düzeltmeleri teknik olarak tutarlı ve testlerle destekleniyor. Ancak **deploy şu an “koşullu”**: runtime için zorunlu bazı dosyalar hâlâ **untracked**, production’da `ADMIN_PASSWORD_HASH` hazırlanmadan deploy script’leri fail-fast eder, ve staged `Server-credentials.md` silme diff’i **geçmişteki gizli içeriği tekrar commit nesnesine gömer**.

Kullanıcının önceki mail timeout / SMTP cache / delay değişiklikleri diff’te korunmuş görünüyor. Finansal iş kurallarına (BUG-002/003/004/006) dokunulmamış.

---

## 2. Deploy kararı

### CONDITIONAL GO

**GO** ancak aşağıdaki blocker ve manuel adımlar tamamlanmadan production’a çıkılmamalı.

| Koşul | Zorunluluk |
|-------|------------|
| `server/utils/backupPath.js` ve `server/utils/safeLog.js` commit’e dahil | **Zorunlu** — aksi halde `require` ile backend çöker |
| `server/package.json` + `package-lock.json` (helmet, express-rate-limit) commit | **Zorunlu** |
| VPS `.env` içinde geçerli `ADMIN_PASSWORD_HASH` + `JWT_SECRET` | **Zorunlu** — deploy script exit 1 |
| Credential rotasyonu (credentials dosyası / eski admin şifresi) | **Zorunlu (güvenlik)** |
| Untracked test/rapor/geçici HTML’nin bilinçli seçimi | Önerilir |
| nginx security header’ları | Deploy sonrası / düşük-orta risk |

---

## 3. Deployment blocker’ları

### Deploy öncesi mutlaka çözülmeli

| # | Madde | Risk | Neden | Doğrulama |
|---|--------|------|-------|----------|
| B1 | Untracked runtime utility’ler | **Kritik** | `backupService.js` → `../utils/backupPath`; `auth.js` → `../utils/safeLog`. `git reset --hard origin/main` sonrası bu dosyalar yoksa MODULE_NOT_FOUND | `git ls-files server/utils/backupPath.js server/utils/safeLog.js` dolu olmalı |
| B2 | Yeni npm bağımlılıkları commit edilmeden deploy | **Kritik** | `helmet`, `express-rate-limit` package.json’da; sunucuda `npm install` lock/package ile uyumlu olmalı | package.json/lock push edilmiş mi |
| B3 | `ADMIN_PASSWORD_HASH` yoksa admin login 503; deploy script fail-fast | **Yüksek** | Plaintext fallback yok (bilinçli). Hash yoksa admin paneli açılamaz; deploy script bilinçli durur | VPS `.env` grep `ADMIN_PASSWORD_HASH=^\$2` (değeri paylaşmadan) |
| B4 | Staged credentials silme diff’inde gizli içerik | **Yüksek (süreç)** | `git diff --cached` deletion hunk’ı dosya içeriğini gösterir; commit bu blob’u yeniden kaydeder. History’de zaten var (`5cbd813`) | Diff’i chat/ticket’a yapıştırmayın; secret rotate; history scrub ayrı plan |

### Deploy öncesi manuel işlem

| # | Madde | Doğrulama |
|---|--------|-----------|
| M1 | `bash scripts/reset-admin-password.sh "..."` ile hash üret | Admin login 200 |
| M2 | Düz metin `ADMIN_PASSWORD` satırını VPS `.env`’den kaldır | Login yalnızca hash ile |
| M3 | PM2 `--update-env` | Yeni env yüklenir |
| M4 | Bilinen/sızmış SSH/root/admin credential rotate | Eski değerlerle erişim yok |
| M5 | GitHub Actions secret’ları gözden geçir | Workflow SSH ile bağlanır |
| M6 | DB yedeği | Deploy script zaten kopyalar; ek manuel yedek önerilir |

### Deploy sonrasına bırakılabilir

| # | Madde | Neden |
|---|--------|-------|
| L1 | nginx CSP / X-Frame-Options / HSTS | Helmet yalnızca Express API’ye etki eder; statik site nginx’te |
| L2 | `npm audit` 25 açık (SEC-007) | Bu turda force fix yasak; hedefli patch sonra |
| L3 | Git history scrub (filter-repo/BFG) | Ayrı kontrollü operasyon |
| L4 | `location.state.from` ile login sonrası derin link | CustomerLogin sabit `/customer/profile` — UX, güvenlik blocker değil |
| L5 | Backup testlerinde URL-encoded / symlink senaryolarının genişletilmesi | Mevcut koruma katmanları yeterli; test kapsamı kısmi |

---

## 4. Diff inceleme sonuçları

### Özet metrikler

| Komut | Sonuç |
|-------|--------|
| `git status --short` | Staged silmeler + unstaged Phase1/mail + untracked utils/test/rapor |
| `git diff --stat` (unstaged) | 21 dosya, +1234 / −194 |
| `git diff --cached --stat` | 9 dosya silme (credentials + `api/*`), −373 |
| Untracked | 14 path (utils, test, workflow, raporlar, tmp, eski scriptler) |

### Kapsam uygunluğu

- Phase 1 ile ilgili: admin auth, logs, backup path, helmet, ProtectedRoute, email_templates, deploy/env, `api/` silme, credentials untrack — **uygun**.
- Kullanıcı mail değişiklikleri (BulkEmail timeout, api.js timeout/post imzası, emailService SMTP cache/rate-limit, verification delay 800) — **korunmuş**.
- Finansal/satış/taksit/limit koduna dokunulmamış (sales.js’te yalnızca hassas header log satırları).
- Otomatik formatlama kaynaklı repo geneli büyük diff yok; `package-lock.json` şişmesi yeni bağımlılıklardan.
- İlgisiz untracked: `tmp-mail-preview.html` (commit edilmemeli), audit/fix raporları opsiyonel.

### `Server-credentials.md` / `api/`

- Lokal dosya **mevcut**; `.gitignore` satır 9 ile ignore; index’ten çıkarılmış (`git ls-files` eşleşmez).
- **Dikkat:** staged deletion diff içeriği gösterir (değerler bu rapora **yazılmadı**).
- History: `git log -- Server-credentials.md` → en az `5cbd813`.
- `api/` silme: `vercel.json` → `server/index.js`; deploy script’ler `server/` + PM2. Aktif runtime kullanmıyor — **silme güvenli**.

### Untracked dosyaların unutulma riski

| Dosya | Runtime gerekli mi? | Commit? |
|-------|---------------------|---------|
| `server/utils/backupPath.js` | **Evet** | **Evet — blocker** |
| `server/utils/safeLog.js` | **Evet** | **Evet — blocker** |
| `server/test/*` | Hayır | Evet (kalite) |
| `client/.../ProtectedRoute.test.js` | Hayır | Evet (kalite) |
| `.github/workflows/deploy.yml` | CI için | Evet (SEC-001) |
| `MARKAWORLD_*.md` | Hayır | İsteğe bağlı |
| `tmp-mail-preview.html` | Hayır | **Hayır** |
| `scripts/fix-dns-and-deploy.sh`, `setup-github-deploy-secrets.py` | Hayır (önceki) | Ayrı inceleme |

### Dosya bazlı tablo

| Dosya | Amaç | Phase1? | Regresyon | Gizli veri | Commit? | Manuel inceleme |
|-------|------|---------|-----------|------------|---------|-----------------|
| `api/*` (D staged) | Stub/credential kaldırma | Evet SEC-001 | Düşük | Silinen stub’ta eski sabit şifre hunk’ta görünür | Evet | Diff’i paylaşmayın |
| `Server-credentials.md` (D staged) | Untrack | Evet CONFIG-002 | — | **Deletion hunk’ta secret** | Evet (dikkatli) | **Evet — rotate** |
| `server/routes/admin.js` | Hash login, rate limit, backup | Evet | Orta (auth kırılır hash yoksa) | Yok | Evet | Hash hazırlığı |
| `server/middleware/auth.js` | Log scrub | Evet | Düşük | Yok | Evet | — |
| `server/routes/customers.js` | Register log scrub | Evet | Düşük | Yok | Evet | — |
| `server/routes/sales.js` | Headers log kaldırma | Evet (yan) | Düşük | Yok | Evet | — |
| `server/index.js` | Helmet, trust proxy, scrub debug | Evet | Düşük-orta | Yok | Evet | nginx notu |
| `server/services/backupService.js` | Safe path | Evet | Düşük | Yok | Evet | utils untracked! |
| `server/database/init.js` | DROP kaldır, OR IGNORE | Evet | Düşük | Yok | Evet | UNIQUE doğrula |
| `server/package.json` / lock | helmet, rate-limit, test | Evet | Düşük | Yok | **Evet** | — |
| `scripts/deploy-on-server.sh` | Fail-fast | Evet | Deploy durur hash yoksa | Yok | Evet | — |
| `scripts/reset-admin-password.sh` | Hash üretir | Evet | — | Çalıştırınca şifre argümanı | Evet | — |
| `server/env.example` | Placeholder hash | Evet | — | Placeholder (gerçek değil) | Evet | — |
| `server/.env.production.example` | Hash alanı | Evet | — | Boş | Evet | — |
| `docs/GMAIL-KURULUM.md` | Örnek env | Evet | — | Placeholder | Evet | — |
| `client/.../ProtectedRoute.js` | Redirect/session | Evet | Düşük | Yok | Evet | — |
| `client/src/App.js` | Login wrap | Evet | Düşük | Yok | Evet | — |
| `client/src/App.test.js` | Smoke | Evet | Düşük | Yok | Evet | — |
| `BulkEmail.js` / `api.js` / `emailService` / `verificationService` | Kullanıcı mail işi | Hayır (önceki) ama korunmalı | Düşük | Yok | Evet (birlikte) | — |
| `server/utils/backupPath.js` (??) | Path güvenliği | Evet | **Commit unutulursa çöküş** | Yok | **Evet** | — |
| `server/utils/safeLog.js` (??) | Maskeleme | Evet | **Commit unutulursa çöküş** | Yok | **Evet** | — |
| `server/test/*` (??) | Testler | Evet | — | Test JWT string (prod değil) | Evet | — |
| `ProtectedRoute.test.js` (??) | FE test | Evet | — | Yok | Evet | — |
| `.github/workflows/deploy.yml` (??) | CI fail-fast | Evet | — | Secrets refs only | Evet | — |
| `tmp-mail-preview.html` (??) | Geçici | Hayır | — | İçerik kontrol | **Hayır** | — |

---

## 5. Admin auth doğrulaması

**Kanıt dosyası:** `server/routes/admin.js` (login ~52–112), `server/index.js` (trust proxy ~23), deploy/reset scriptleri, `env.example`.

| Soru | Sonuç | Risk | Deploy engeller mi? |
|------|--------|------|---------------------|
| Plaintext `ADMIN_PASSWORD` fallback kaldırıldı mı? | **Evet** — yalnızca `ADMIN_PASSWORD_HASH` okunuyor | — | Hayır |
| Başka fallback var mı? | **Hayır** (username default `''`; boş → 503) | — | Hayır |
| Hash eksik → tüm backend mi kapanır? | **Hayır** — yalnızca login 503; `startServer`/`/api/health` bağımsız | Orta (admin paneli kapalı) | Hash yoksa **işlevsel blocker** |
| Health çalışır mı? | Evet — `app.get('/api/health')` auth’suz | — | Hayır |
| Customer login/kayıt etkilenir mi? | Hayır — ayrı route/middleware | — | Hayır |
| `bcrypt.compare` argüman sırası | `compare(password, hash)` doğru | — | Hayır |
| Hash format doğrulama | `isBcryptHash` regex `$2[aby]$` | — | Hayır |
| Login response hassas mı? | token + username/role; hash/şifre yok | Düşük (JWT localStorage — SEC-005 dışı) | Hayır |
| Rate limit kapsamı | Yalnızca `POST /login` üzerinde `adminLoginLimiter` | — | Hayır |
| `trust proxy` | `app.set('trust proxy', 1)` var; nginx arkası için uygun | Yanlış proxy → IP spoof / rate limit zayıflığı | nginx doğru `X-Forwarded-For` |
| `validate: { ip: false }` | Custom keyGenerator ile ERL uyarısını kapatır | Operasyonel | Hayır |
| Başarılı login rate limit | `skipSuccessfulRequests: true` | — | Hayır |
| `delayMs: 800` vs rate limit | **İlişkisiz** — delay bulk verification/mail; login’e uygulanmaz | Yok | Hayır |
| Timing / username enumeration | Yanlış user/pass aynı 401 mesajı; dummy hash ile compare. Hash eksikte 503 erken dönüş → timing farkı (config sızıntısı, düşük) | Düşük | Hayır |

**Öneri:** Deploy öncesi staging/VPS’te hash ile login + 6 yanlış denemede 429 smoke.

---

## 6. Secret ve credential kontrolü

| Kontrol | Sonuç |
|---------|--------|
| Lokal `Server-credentials.md` mevcut mu? | Evet |
| Index’ten çıkarıldı mı? | Evet |
| `.gitignore` engelliyor mu? | Evet (satır 9) |
| `git diff --cached` içerik gösterir mi? | **Evet — deletion hunk** (değerler rapora yazılmadı) |
| Git history’de kalıyor mu? | Evet (`5cbd813`+) |
| Deploy script sabit secret? | Varsayılan admin şifre yazma **yok**; fail-fast |
| env.example gerçek secret? | Placeholder (`REPLACE_WITH_...`, `uzun-rastgele-...`, `eposta-sifreniz`) — tahmin edilebilir şablon, gerçek production değeri değil |
| Test/rapor credential? | Testte izole JWT string (`phase1-test-jwt-secret-not-for-prod`); prod değeri değil |

### Secret pattern taraması (yalnızca yol + risk türü)

| Yol | Risk türü |
|-----|-----------|
| Staged diff: `Server-credentials.md` deletion | History/commit’e gömülü sunucu erişim bilgisi |
| Staged diff: `api/admin.js` deletion | Eski sabit admin credential literal (hunk) |
| `scripts/reset-admin-password.sh` | Çalıştırma anında plaintext argüman / curl test (operasyonel) |
| `server/env.example` | Zayıf placeholder JWT metni (örnek) |
| `server/test/adminAuth.test.js` | Test-only secret string |

**Deploy engeller mi?** Uygulama kodu açısından hayır; **güvenlik süreci** açısından rotate yapılmadan GO önerilmez.

---

## 7. Backup güvenliği

**Dosyalar:** `server/utils/backupPath.js`, `backupService.js` restore/delete, `admin.js` download/restore/delete.

| Kontrol | Sonuç |
|---------|--------|
| Download/delete/restore aynı resolver? | **Evet** (`resolveSafeBackupPath`) |
| `path.basename` eşleşmesi? | Evet (satır 28–31) |
| `resolve` + root+sep prefix? | Evet (37–42) — `/backups` vs `/backups2` bypass’ına karşı `+ path.sep` kullanılmış |
| `\` / `..` / null byte / mutlak path? | Evet (19–26, absolute basename fail) |
| URL-encoded traversal | Express decode sonrası `../` → reddedilir (doğrudan test yok; mantıksal OK) |
| Symlink | Dosya varsa `realpathSync` ile root dışı reddi; yoksa resolve root içinde kalır |
| Regex dar mı? | `backup_YYYY-MM-DDTHH-mm-ss-sssZ.xml.gz` — dar |
| Path sızıntısı response’ta? | Genel mesajlar (`Geçersiz yedek dosya adı`, `Dosya bulunamadı`) |
| Testler gerçek yedek siler mi? | Hayır — `os.tmpdir()` |

### Test kapsamı vs 16 backend testi

Backup grubu (~7 test): normal ad, `../`, `..\`, absolute, yanlış uzantı, basename mismatch, regex.  
**Eksik:** URL-encoded, symlink, HTTP download entegrasyonu, 404 path sızıntısı assert.  
**Sonuç:** Birim seviyesinde yeterli; HTTP E2E kısmi boşluk — blocker değil.

---

## 8. Security header değerlendirmesi

**Dosya:** `server/index.js` ~23–39.

| Madde | Durum | Deploy riski |
|-------|--------|--------------|
| `X-Powered-By` | `app.disable` + Helmet | Düşük |
| Middleware sırası | trust proxy → disable → helmet → cors → json | Uygun |
| API header’ları | Helmet API yanıtlarına uygulanır | OK |
| Ana site (statik) | nginx `/var/www/html` — **Helmet etkilemez** | nginx manuel header gerekir |
| CSP | **Kapalı** (`contentSecurityPolicy: false`) | MUI/Maps kırılmaz; XSS yüzeyi açık kalır |
| HSTS | Yalnızca `NODE_ENV=production` | HTTPS nginx arkasında genelde OK; HTTP ile API’ye doğrudan erişim yoksa sorun düşük |
| CORS vs Helmet | Çatışma yok; CORP `cross-origin` | API JSON için makul |
| CORP | `cross-origin` — sıkı `same-origin` değil | Asset kırılma riski düşük |

**Nginx önerileri (manuel):** `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, Referrer-Policy, HSTS, dikkatli CSP (Emotion/`unsafe-inline`, Maps, iframe).

---

## 9. Email template veri koruma değerlendirmesi

**Dosya:** `server/database/init.js`.

| Kontrol | Kanıt / sonuç |
|---------|----------------|
| `DROP TABLE email_templates` | **Kaldırılmış** (eski satırlar yok) |
| `CREATE TABLE IF NOT EXISTS` | Satır 141–148 |
| UNIQUE constraint | **`name TEXT NOT NULL UNIQUE`** (satır 143) — `INSERT OR IGNORE` buna dayanır |
| Production’da UNIQUE yoksa? | `CREATE IF NOT EXISTS` şemayı değiştirmez → IGNORE etkisiz kalır, **duplicate riski** | Deploy öncesi: `PRAGMA index_list(email_templates)` / şema kontrolü (prod’da bu turda çalıştırılmadı) |
| Kolon uyumu | id, name, subject, html, timestamps — eski CREATE ile aynı; yeni kolon yok |
| Init 2× özel template | Test senaryosu geçici DB ile doğruluyor |
| Varsayılan ezme | `INSERT OR IGNORE` — mevcut `name` ezilmez |
| Test izolasyonu | `os.tmpdir()` + ayrı sqlite — **production path kullanmaz** |

**Not:** `index.js` içinde `insertDefaultData()` ayrı çağrı yorum satırı; fakat `initDatabase()` **içeride hâlâ** `insertDefaultData()` çağırır → restart’ta IGNORE çalışır. Bu beklenen ve BUG-005 için gerekli.

**False positive yok:** UNIQUE kodda kesin.

**Risk seviyesi:** Düşük (şema historically aynı init’ten geldiyse). UNIQUE kaybı senaryosu orta — manuel schema check önerilir. Deploy’u engellemez (kod doğru).

---

## 10. Frontend auth/routing değerlendirmesi

**Dosyalar:** `ProtectedRoute.js`, `App.js` 44–58, testler.

| Senaryo | Sonuç |
|---------|--------|
| `/customer-login` + ProtectedRoute sonsuz döngü? | **Hayır** — oturum yoksa `children` (login formu) |
| Geçerli müşteri → `/customer/profile`? | Evet |
| Admin login | Token yok → form; var → dashboard |
| Admin token → customer profile | Redirect login (customer yok) |
| Customer token → admin dashboard | Redirect admin login |
| Bozuk JSON | clear + login |
| Token/customer tek taraflı | clear |
| `clearCustomerSession` | Yalnızca `customer` + `customerToken`; `adminToken` silinmez |
| Refresh | localStorage okuma — geçerliyse aynı mantık |
| `location.state.from` | ProtectedRoute set eder; **CustomerLogin kullanmaz**, sabit profile — önceden de benzer; kırılma sınırlı |
| 8 FE test | MemoryRouter + gerçek ProtectedRoute; axios/App mock yok — davranışa yakın. Eksik: gerçek App.js tree, JWT doğrulama, refresh E2E |

**Regresyon riski:** Düşük. **Deploy engeli:** Yok.

---

## 11. Test güvenilirliği

### Backend (16/16 bildirilen)

| Grup | Gerçek davranış | Mock | False positive | Prod benzerliği | Eksikler | İzolasyon / temizlik |
|------|-----------------|------|----------------|-----------------|----------|----------------------|
| adminAuth (4) | HTTP login, bcrypt, 429 | Mini Express; gerçek admin router | Düşük-orta (env process’te kalabilir) | Yüksek | Proxy IP, timing | Server kapanır; **env restore yok**; `require(admin)` gerçek DB path açabilir |
| backupPath (7) | Resolver birim | tmp dir | Düşük | Yüksek (fonksiyon) | symlink, URL-encode, HTTP | tmp temizlenmiyor (OS tmp) |
| emailTemplates (1) | SQL IGNORE | tmp sqlite | Düşük | Orta (init.js kopyası SQL) | gerçek `initDatabase()` | tmp DB |
| safeLog (3) | mask helpers | yok | Düşük | Yüksek | log çağrı entegrasyonu | — |
| securityHeaders (1) | helmet mini app | index.js tam kopya değil | Orta | Orta | tam `server/index.js` | server close |

**Özel sorular:**

| Soru | Cevap |
|------|--------|
| Sıra bağımlılığı? | adminAuth içi kısmen (hash restore); rate limit ayrı username ile izole |
| Production API? | Hayır (127.0.0.1 ephemeral) |
| Gerçek e-posta? | Hayır |
| Gerçek backup? | Hayır |
| Env kirliliği? | **Evet riski** — adminAuth `process.env` set eder, after’da temizlemez |
| Rate limit diğer testler? | Ayrı key; aynı process’te limiter state kalabilir |
| Open handle? | after’da `server.close`; genelde OK |

### Frontend (8/8)

| Test | Güvenilirlik |
|------|----------------|
| ProtectedRoute 7 | İyi — gerçek bileşen |
| App.test smoke | Çok zayıf (1+1) — axios/App kaçınımı; yanıltıcı yeşil riski düşük çünkü asıl koruma ProtectedRoute testlerinde |

---

## 12. Manuel production adımları

1. DB yedeği al (deploy script + ekstra kopya).  
2. Commit’e **mutlaka** ekle: utils, package/lock, Phase1 kodu, deploy scriptleri; credentials **untrack commit**’ini dikkatli yap (diff paylaşmadan).  
3. `tmp-mail-preview.html` commit etme.  
4. VPS: `reset-admin-password.sh` ile hash; plaintext `ADMIN_PASSWORD` kaldır.  
5. Secret rotate (SSH/root/eski admin — değerleri burada yazılmadı).  
6. `pm2 restart ... --update-env`.  
7. Admin login + customer login + health smoke.  
8. `PRAGMA` / şema ile `email_templates.name` UNIQUE doğrula.  
9. nginx header planını not et (sonraki iş).

---

## 13. Rollback planı

1. `git reset --hard <önceki-deploy-sha>` (VPS).  
2. Önceki `server/node_modules` / `npm ci` veya `npm install`.  
3. `.env`: gerekirse geçici olarak **bilinen çalışan** yapılandırma (hash dönemi sonrası plaintext’e geri dönmek güvenlik regresyonu — mümkünse hash’li önceki `.env.bak.*`).  
4. PM2 restart.  
5. SQLite: deploy script’in aldığı `database.sqlite.backup-*` ile geri yükleme (yalnızca gerekirse; restore iş kuralları ayrı risk).  
6. Frontend: önceki `build` veya yeniden build.

---

## 14. Deploy sonrası smoke test listesi

- [ ] `GET /api/health` → 200  
- [ ] Response’da `X-Powered-By` yok; `X-Content-Type-Options: nosniff` (API)  
- [ ] Admin login doğru hash → 200 + token  
- [ ] Admin yanlış şifre → 401 genel mesaj  
- [ ] 6+ başarısız → 429  
- [ ] Customer login / register çalışıyor  
- [ ] `/customer-login` girişliyken → `/customer/profile`  
- [ ] Backup list; geçersiz `../../` filename → 400  
- [ ] Restart sonrası özel email template duruyor  
- [ ] Toplu mail timeout davranışı (önceki lokal değişiklik)  
- [ ] Ana site HTML header’ları (nginx) — ayrı kontrol  

---

## Bulgu kartları (özet)

### V-001 — Untracked runtime utils
- **Risk:** Kritik  
- **Dosya:** `server/utils/backupPath.js`, `server/utils/safeLog.js` (untracked); require: `backupService.js:7`, `auth.js:3`  
- **Kanıt:** `git status` `??`; runtime `require`  
- **Etki:** Deploy sonrası backend ayağa kalkmaz  
- **Deploy engeller mi?** **Evet**  
- **İşlem:** Commit’e al, push, sonra deploy  

### V-002 — ADMIN_PASSWORD_HASH zorunluluğu
- **Risk:** Yüksek (işlev)  
- **Dosya:** `admin.js:58–63`; `deploy-on-server.sh:26–29`  
- **Etki:** Admin login 503 / deploy exit 1  
- **Engeller mi?** Hash yoksa **Evet**  
- **İşlem:** reset-admin-password + PM2 env  

### V-003 — Credentials staged deletion içeriği + history
- **Risk:** Yüksek (gizlilik)  
- **Dosya:** `Server-credentials.md` cached diff / history `5cbd813`  
- **Etki:** Secret’ların tekrar yayılması / kalıcılığı  
- **Engeller mi?** Kod GO’sunu değil; **güvenlik GO’sunu**  
- **İşlem:** Rotate; diff paylaşmama; history scrub planı  

### V-004 — Helmet yalnızca API; nginx eksik
- **Risk:** Orta  
- **Dosya:** `server/index.js:27–38`  
- **Etki:** Ana site header’sız kalabilir  
- **Engeller mi?** Hayır (CONDITIONAL)  
- **İşlem:** nginx header  

### V-005 — email_templates UNIQUE varsayımı
- **Risk:** Düşük–Orta  
- **Dosya:** `init.js:143`, `350`  
- **Etki:** UNIQUE yoksa duplicate  
- **Engeller mi?** Hayır (önce schema check)  
- **İşlem:** Production şema doğrula  

### V-006 — Test env kirliliği / zayıf App smoke
- **Risk:** Düşük  
- **Dosya:** `server/test/adminAuth.test.js`; `App.test.js`  
- **Etki:** Yanıltıcı güven veya test etkileşimi  
- **Engeller mi?** Hayır  
- **İşlem:** İleride after hook ile env restore  

---

## Sonuç cümlesi

**CONDITIONAL GO:** Phase 1 kodu deploy edilebilir kalitede; önce untracked runtime dosyaları ve bağımlılıkları commit edin, VPS’te hash’i hazırlayın, credential rotasyonunu tamamlayın, ardından smoke listesini uygulayın.
