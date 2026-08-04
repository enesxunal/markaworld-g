# Marka World — Teknik Denetim Raporu

**Tarih:** 4 Ağustos 2026  
**Canlı adres:** https://www.markaworld.com.tr/  
**İnceleme türü:** Salt okunur (kaynak kod değiştirilmedi)  
**Denetçi rolleri:** Full-stack mimar, frontend, backend, QA, güvenlik, SEO, erişilebilirlik  

> **Önemli bağlam:** Bu proje klasik online sepetli e-ticaret değildir. **Mağaza içi taksitli satış + müşteri limit/borç takip paneli + tanıtım (landing) sitesidir.** Ürün kataloğu, sepet, online ödeme gateway’i ve checkout akışı yoktur. E-ticaret maddeleri bu modele göre yorumlanmıştır.

---

## Yönetici Özeti

| Metrik | Puan (0–100) | Kısa gerekçe |
|--------|-------------:|--------------|
| **Genel sağlık** | **52** | Canlı API ayakta; temel akışlar çalışıyor. Güvenlik, test ve SEO borçları ağır. |
| **Güvenlik** | **34** | Repo/deploy’da sabit admin şifresi, düz metin admin auth, hassas loglar, rate limit yok, path traversal riski. |
| **Performans** | **58** | Build başarılı; tek ana JS ~321 kB gzip. Code splitting yok; SPA yükü orta. |
| **SEO** | **28** | CSR SPA; sayfa bazlı meta yok; `sitemap.xml` soft-404 (HTML dönüyor); OG/schema yok; robots admin’i engellemiyor. |
| **Erişilebilirlik** | **46** | MUI form label’ları kısmen iyi; iframe title, icon-only butonlar, skip link eksik. |
| **Kod kalitesi** | **48** | ESLint 58 uyarı; büyük sayfalar; ölü `api/` mock; schema–kod uyumsuzluğu. |
| **Test güvenilirliği** | **12** | Backend test yok; tek frontend test axios/Jest uyumsuzluğuyla suite’i çalıştıramıyor. |

### Production’a uygunluk durumu

**Kısmen uygun — dikkatli kullanım.** Canlı sağlık kontrolü (`/api/health`) 200 dönüyor; müşteri kayıt/giriş ve admin paneli production’da hizmet veriyor. Ancak **admin kimlik bilgilerinin repoda/deploy script’lerinde sabitlenmesi**, **hassas veri loglama** ve **yedek path traversal** riskleri nedeniyle güvenlik sertleştirmesi yapılmadan “üretim-güvenli” sayılmamalıdır.

### En kritik 5 bulgu

1. **SEC-001** — Repo ve deploy script’lerinde sabit/varsayılan admin kimlik bilgisi  
2. **SEC-002** — Admin şifresinin bcrypt olmadan düz metin karşılaştırılması + brute-force koruması yok  
3. **SEC-003** — Kayıt ve auth katmanında şifre/token/PII loglanması  
4. **BUG-001** — Girişli müşterinin `/customer-login` sonrası var olmayan `/sale/:id` route’una yönlendirilmesi  
5. **BUG-002** — Gecikme faizi tablosu/kolonları şemada yok; cron ve ödeme faiz akışı kırık

### En hızlı kazanım sağlayacak 5 iyileştirme

1. Deploy/CI ve `api/admin.js` içindeki varsayılan/sabit admin şifrelerini kaldırıp güçlü rastgele şifre + bcrypt  
2. `ProtectedRoute` müşteri yönlendirmesini `/customer/profile` yapmak  
3. Production’da hassas `console.log`’ları kapatmak / PII maskelemek  
4. Yedek `filename` için `path.basename` + `..` reddi  
5. `robots.txt` ile `/admin` ve `/customer` engellemek; gerçek `sitemap.xml` eklemek  

### Puanlandırma notu

Puanlar yalnızca kod, komut çıktısı ve canlı HTTP yanıtlarıyla doğrulanan bulgulara dayanır. Ödeme gateway paneli, gerçek SMTP teslim oranı ve manuel tarayıcı/a11y audit araçları bu aşamada tam çalıştırılmadığı için ilgili alanlarda spekülatif puan düşürme yapılmamıştır.

---

## 1. Proje Tanıma

### Stack özeti

| Alan | Tespit |
|------|--------|
| Uygulama türü | Müşteri ödeme/taksit takip + landing + admin panel |
| Frontend | **React 18.2** + **Create React App** (`react-scripts` 5.0.1) — **JavaScript** (TypeScript yok) |
| UI | MUI 5 (`@mui/material`, icons, x-date-pickers), Emotion |
| Router | `react-router-dom` 6.20 |
| HTTP | Axios 1.6 |
| Backend | **Node.js** (≥16) + **Express** 4.18 |
| DB | **SQLite3** (ORM yok; doğrudan `sqlite3` API) |
| Auth | **JWT** (`jsonwebtoken`); müşteri şifreleri **bcrypt**; admin env düz metin |
| Validation | `express-validator` (kısmi) |
| E-posta | Nodemailer + isteğe bağlı Gmail OAuth (`googleapis`) |
| Cron | `node-cron` |
| State | React local state + `localStorage` (Redux/Zustand yok) |
| Form | Kontrollü React state; Zod/Yup yok |
| CSS | MUI theme + `sx` / `styled`; minimal `index.css` |
| CDN/görsel | Statik nginx; harici CDN yok |
| Ödeme | Online ödeme yok; admin manuel taksit ödeme kaydı |
| Analytics | Yok (web-vitals çağrılıyor, gönderilmiyor) |
| Hosting | VPS (nginx + PM2); `DEPLOY.md` / GitHub Actions SSH deploy |
| PWA | `manifest.json` var; service worker yok |
| Monorepo | **Hayır** — kök + `client/` + `server/` + kullanılmayan `api/` |
| Paket yöneticisi | npm (`package-lock.json` her pakette) |

### Klasör sorumlulukları

| Klasör | Sorumluluk |
|--------|------------|
| `client/` | React SPA (landing, müşteri panel, admin panel) |
| `server/` | Express API, SQLite, e-posta, cron, yedek |
| `api/` | Eski Vercel-style stub’lar — **aktif deploy kullanmıyor** (`vercel.json` → `server/index.js`) |
| `scripts/` | Deploy, DNS, admin şifre reset |
| `.github/workflows/` | SSH ile VPS deploy |
| `docs/` | Kurulum notları |

### Environment değişkenleri (değerler yazılmadı)

`server/env.example` ve `server/.env.production.example`: `ADMIN_*`, `JWT_SECRET`, `EMAIL_*` / `GMAIL_*`, `FRONTEND_URL`, `PORT`, `NODE_ENV`, şirket alanları.

Frontend: `REACT_APP_API_URL` (yoksa `https://markaworld.com.tr/api`).

---

## 2. Çalıştırılabilir Kontroller

> Not: İnceleme başında `client/node_modules` yoktu. Yalnızca mevcut lockfile ile `npm ci` çalıştırıldı (paket ekleme/güncelleme yok). Build çıktısı `client/build/` gitignore altındadır.

| Komut | Sonuç | Özet |
|-------|--------|------|
| `cd client && CI=true npm test -- --watchAll=false` | **Başarısız** | Suite çalışamadı: Axios ESM → Jest `SyntaxError`. 0 test geçti. |
| `cd client && CI=false npm run build` | **Başarılı (uyarılarla)** | ESLint uyarıları; bundle: `main` **321.01 kB** gzip, css 3.65 kB, chunk 1.77 kB |
| `cd client && npx eslint src --ext .js,.jsx` | **Uyarı** | **58 problems (0 error, 58 warning)** — unused vars, hooks deps, 1 a11y |
| `cd client && npm audit` | **Bulgu** | **62** (13 low, 15 moderate, 31 high, **3 critical**) — çoğunlukla CRA/dev zinciri |
| `cd server && npm audit` | **Bulgu** | **24–25** (1 critical, ~15–16 high) — tar, validator, uuid/node-cron vb. |
| `cd server && npm test` | **Yok** | Script tanımlı değil |
| Type-check | **Yok** | TypeScript kullanılmıyor |
| Coverage | **Yok** | Çalıştırılacak coverage script’i yok |

### Build / lint detayı

- **Tam komut:** `CI=false npm run build` (client)  
- **Sonuç:** Compiled with warnings  
- **Önemli uyarılar:** çok sayıda `no-unused-vars`; `react-hooks/exhaustive-deps` (CustomerProfile, Customers, FuturePayments, SaleDetail, Sales); `jsx-a11y/iframe-has-title` (Home.js)  
- **Kök neden:** Temizlik yapılmamış import’lar; effect bağımlılıkları ihmal edilmiş  
- **Etki:** Build’i engellemez; bakım ve subtle bug riski  
- **Öneri:** Unused temizliği + hooks düzeltmesi; CI’da `CI=true` ile warning=error politikası

### Test detayı

- **Tam komut:** `CI=true npm test -- --watchAll=false`  
- **Sonuç:** FAIL — `App.test.js` axios import zincirinde Jest parse hatası  
- **Ek:** Test içeriği hâlâ CRA şablonu (`/learn react/i`) — uygulama ile uyumsuz  
- **Öneri:** Axios transformIgnorePatterns veya mock; gerçek smoke testler

### Dependency audit

- Client critical’ler büyük ölçüde **webpack-dev-server / ws / websocket-driver** (dev-time). Production runtime etkisi sınırlı olabilir; yine de CRA güncelleme planı gerekir.  
- Server: **tar / validator / express-validator** zinciri production’a daha yakın — `npm audit fix` (breaking force olmadan) değerlendirilmeli.

---

## 3. Derleme ve TypeScript Denetimi

- TypeScript **yok** — tip denetimi uygulanamaz.  
- Production build **başarılı**.  
- Tek ana bundle; route-based `React.lazy` **yok**.  
- Kaynak map’ler build’de üretiliyor (`main.*.js.map` ~4.9 MB) — production nginx’te map servis edilip edilmediği panelle doğrulanmalı (Eksik Bilgi).  
- API response / form / env tipleri yok; runtime hataları ancak çalışma anında görünür.

---

## 4–18. Bulgu Tablosu

| ID | Öncelik | Kategori | Başlık | Dosya/Satır | Etki | Güven | Önerilen Çözüm | Efor |
|----|---------|----------|--------|-------------|------|-------|----------------|------|
| SEC-001 | P0 | Güvenlik | Sabit/varsayılan admin kimlik bilgisi repoda | `api/admin.js`, `.github/workflows/deploy.yml`, `scripts/deploy-on-server.sh` | Admin paneli ele geçirme | Kesin | Stub sil; varsayılan şifre yazmayı kaldır; secret manager | 2–4s |
| SEC-002 | P0 | Güvenlik | Admin şifresi düz metin + rate limit yok | `server/routes/admin.js:34` | Brute-force | Kesin | bcrypt hash + rate limit | 1–2g |
| SEC-003 | P0 | Güvenlik | Şifre/token/PII loglama | `customers.js:233,273–287`, `auth.js:10–11` | Veri sızıntısı | Kesin | Log scrubbing; prod’da debug kapat | 1g |
| SEC-004 | P1 | Güvenlik | Yedek filename path traversal | `admin.js:152–154`, `backupService.js:151` | Dosya okuma/yazma | Yüksek | basename + allowlist | 0.5g |
| SEC-005 | P1 | Güvenlik | JWT localStorage + XSS yüzeyi | `AdminLogin.js:58`, `api.js` | Token çalma | Yüksek | HttpOnly cookie veya sıkı CSP | 2–4g |
| SEC-006 | P1 | Güvenlik | Security header yok (canlı) | nginx/Express | Clickjacking vb. | Kesin | Helmet + nginx headers | 0.5–1g |
| SEC-007 | P1 | Güvenlik | npm audit high/critical | client/server lockfiles | Tedarik zinciri | Kesin | Hedefli patch; CRA stratejisi | 1–3g |
| SEC-008 | P2 | Güvenlik | Unsubscribe auth’suz | `email.js` unsubscribe | Liste manipülasyonu | Yüksek | Signed token link | 1g |
| SEC-009 | P2 | Güvenlik | Bulk HTML sanitization yok | `admin` send-bulk-email | Stored XSS (e-posta) | Orta | Sanitize + alıcı limiti | 1–2g |
| SEC-010 | P2 | Güvenlik | Auth header log (admin middleware) | `middleware/auth.js` | Token sızıntısı logda | Kesin | Log’ları kaldır/maskele | 0.5g |
| BUG-001 | P0 | Bug/UX | Müşteri login → `/sale/:id` (route yok) | `ProtectedRoute.js:28–30` | Çıkmaz/yanlış yönlendirme | Kesin | `/customer/profile` | 0.5s |
| BUG-002 | P0 | Bug | `late_payment_fees` / `late_fee_amount` şemada yok | `init.js` vs `cronService.js`/`sales.js` | Faiz özelliği çalışmaz | Kesin | Migration veya dead code temizliği | 1–2g |
| BUG-003 | P1 | Bug/İş | Satış doğrudan `approved`; onay akışı tutarsız | `sales.js:324–329` vs approve | Onay/borç tutarsızlığı | Yüksek | Tek akış + transaction | 2g |
| BUG-004 | P1 | Bug/İş | Limit artışı her ödemede (düzenlilik yok) | `sales.js:524–526` | Limit şişmesi | Yüksek | İş kuralı netleştir | 1–2g |
| BUG-005 | P1 | Bug | `email_templates` her restart’ta DROP | `init.js:130–142` | Şablon kaybı | Kesin | DROP kaldır; migrate | 0.5–1g |
| BUG-006 | P2 | Bug | Satış+taksit+borç transaction yok | `sales.js:325–368` | Kısmi kayıt | Yüksek | `BEGIN/COMMIT` | 1g |
| CODE-001 | P2 | Kod | ESLint 58 uyarı; büyük sayfalar | Home 993, Customers 650 satır | Bakım maliyeti | Kesin | Böl/temizle | 3–5g |
| CODE-002 | P2 | Kod | Ölü `api/` stub’ları | `api/*.js` | Yanlış deploy riski | Kesin | Klasörü kaldır veya arşivle | 0.5g |
| CODE-003 | P3 | Kod | Production console.log (FuturePayments vb.) | `FuturePayments.js:81–103` | Gürültü/PII | Kesin | Kaldır | 0.5g |
| SEO-001 | P1 | SEO | CSR SPA; boş ilk HTML | canlı index.html | Zayıf indeksleme | Kesin | Prerender veya meta SSR | 3–10g |
| SEO-002 | P1 | SEO | sitemap soft-404 (HTML) | canlı `/sitemap.xml` | Crawl hatası | Kesin | Gerçek XML + nginx kuralı | 0.5g |
| SEO-003 | P1 | SEO | robots tüm path açık | `robots.txt` | Admin indexlenebilir | Kesin | Disallow /admin /customer | 0.5s |
| SEO-004 | P2 | SEO | Sayfa bazlı title/OG/schema yok | `index.html` tek meta | Paylaşım/SERP | Kesin | react-helmet-async + JSON-LD | 1–2g |
| PERF-001 | P2 | Perf | Route lazy-load yok; 321 kB tek bundle | `App.js` eager imports | İlk yükleme | Kesin | React.lazy | 1g |
| PERF-002 | P3 | Perf | date-fns + dayjs birlikte | package.json | Bundle şişmesi | Yüksek | Tek tarih lib | 0.5–1g |
| A11Y-001 | P2 | A11y | Maps iframe title yok | `Home.js` ~844 | WCAG | Kesin | title ekle | 0.5s |
| A11Y-002 | P2 | A11y | Icon-only butonlarda aria-label eksik | Layout/Home/Login | Klavye/SR | Yüksek | aria-label | 0.5–1g |
| A11Y-003 | P3 | A11y | Skip link / landmark zayıf | genel | Navigasyon | Orta | skip + main | 0.5g |
| UX-001 | P1 | UX | Kayıtta KVKK checkbox yok | `CustomerRegister.js` | Yasal/UX boşluk | Kesin | Onay checkbox + link | 0.5–1g |
| UX-002 | P2 | UX | Admin mobilde menü yok | `Layout.js` | Mobil kullanılabilirlik | Yüksek | Drawer menü | 1g |
| UX-003 | P2 | UX | 404 yerine ana sayfaya redirect | `App.js` fallback | Soft-404 SEO/UX | Yüksek | 404 sayfası | 0.5g |
| UX-004 | P2 | UX | Şifre sıfırlama yok | route/API yok | Hesap kilidi | Kesin | Reset akışı | 2–3g |
| TEST-001 | P1 | Test | Frontend test kırık; backend test yok | `App.test.js`, server | Regresyon körlüğü | Kesin | Smoke + API testleri | 3–5g |
| CONFIG-001 | P2 | Config | CI’da test/lint yok; sadece deploy | `deploy.yml` | Kalite kapısı yok | Kesin | lint/test job | 1g |
| CONFIG-002 | P2 | Config | `Server-credentials.md` git’te tracked geçmiş | kök | Secret riski | Yüksek | history scrub; ignore | 0.5–1g |
| LEGAL-001 | P1 | Yasal/UX | Mesafeli satış / ön bilgilendirme / iade sayfası yok | route yok | E-ticaret mevzuatı (online satış yoksa kısmen N/A) | Orta | İş modeline göre ekle | 1–3g |

---

## Bulgu Ayrıntıları

#### [SEC-001] Sabit/varsayılan admin kimlik bilgisi repoda

* **Öncelik:** P0  
* **Kategori:** Güvenlik  
* **Durum:** Açık  
* **Güven düzeyi:** Kesin  
* **Etkilenen dosya:** `api/admin.js` (~15); `.github/workflows/deploy.yml` (~35); `scripts/deploy-on-server.sh` (~23)  
* **Açıklama:** Kullanılmayan stub API’de sabit admin kullanıcı/şifre karşılaştırması var. Deploy script’leri `.env` yoksa varsayılan `ADMIN_PASSWORD` yazıyor. Değerler bu rapora **yazılmadı**.  
* **Kanıt:** Kodda plaintext credential literal’ları ve `echo 'ADMIN_PASSWORD=...'` satırları.  
* **Kullanıcı/işletme/güvenlik etkisi:** Admin paneline yetkisiz erişim; müşteri PII, satış, yedek indirme.  
* **Yeniden üretim:** Dosyaları salt okunur incele; (değerleri paylaşmadan) credential pattern ara.  
* **Çözüm:** Stub’ı sil; deploy’da rastgele üret veya fail-fast; mevcut şifreleri rotate et.  
* **Risk / efor:** Düşük riskli değişiklik; 2–4 saat.  
* **Test:** Eski varsayılanla login başarısız; yeni secret ile başarılı.  
* **Bağımlı:** SEC-002  

#### [SEC-002] Admin şifresi düz metin + rate limit yok

* **Öncelik:** P0 · **Kesin**  
* **Dosya:** `server/routes/admin.js:12–34` (`bcrypt` import edilip kullanılmıyor)  
* **Açıklama:** Admin şifresi env ile string eşitliği; login’de rate limiting yok.  
* **Etki:** Brute-force ve zayıf şifre riski.  
* **Çözüm:** Hash’li admin credential + `express-rate-limit` (IP+user).  

#### [SEC-003] Şifre/token/PII loglama

* **Öncelik:** P0 · **Kesin**  
* **Dosya:** `server/routes/customers.js:233` (`req.body`); `273–287` (verification token, tc_no); `server/middleware/auth.js:10–11` (Authorization header)  
* **Açıklama:** Kayıt sırasında şifre düz metin body log’a düşebilir; token plaintext loglanır.  
* **Etki:** Log erişimi = hesap ele geçirme.  
* **Çözüm:** Hassas alanları asla loglama; production debug middleware kapalı (şu an `NODE_ENV!==production` ile sınırlı — iyi, ama register log’ları koşulsuz).  

#### [SEC-004] Yedek path traversal

* **Öncelik:** P1 · **Yüksek**  
* **Dosya:** `server/routes/admin.js:152–154`; `backupService.js` restore/delete  
* **Açıklama:** `:filename` sanitize edilmeden `path.join(..., filename)`.  
* **Senaryo:** `../../` içeren isimle admin token’lı istek (auth gerekli — yine de savunmasız).  
* **Çözüm:** `path.basename`, resolve + prefix check.  

#### [SEC-005] Token’ların localStorage’da tutulması

* **Öncelik:** P1 · **Yüksek**  
* **Dosya:** `AdminLogin.js:58–59`, `CustomerLogin.js`, `api.js` interceptor  
* **Açıklama:** XSS durumunda token çalınır. `dangerouslySetInnerHTML` yok (iyi); BulkEmail `iframe srcDoc` sandbox’lı.  
* **Çözüm:** Uzun vadede HttpOnly Secure cookie + CSRF stratejisi; kısa vadede CSP.  

#### [SEC-006] Security header eksikliği (canlı)

* **Öncelik:** P1 · **Kesin**  
* **Kanıt:** `curl -I https://www.markaworld.com.tr/` — CSP, X-Frame-Options, HSTS, X-Content-Type-Options **yok**. API’de `X-Powered-By: Express` görünür.  
* **Çözüm:** nginx + `helmet`.  

#### [SEC-007] Bağımlılık açıkları

* **Öncelik:** P1 · **Kesin**  
* **Kanıt:** client `npm audit` 62 (3 critical); server ~24–25 (1 critical).  
* **Not:** Client critical’lerin çoğu dev-server; server tar/validator daha kritik. Force major güncelleme önermeden hedefli patch.  

#### [BUG-001] Bozuk müşteri login yönlendirmesi

* **Öncelik:** P0 · **Kesin**  
* **Dosya:** `client/src/components/ProtectedRoute.js:27–30`  
* **Kanıt:** `Navigate to={/sale/${customerData.sales[0]?.id || 1}}` — App.js’de `/sale/:id` **yok**; fallback `*` → `/`. Ayrıca `JSON.parse(customer)` try/catch yok; `sales` alanı login response’ta olmayabilir.  
* **Etki:** Girişli kullanıcı login URL’sine gelince çıkmaza düşer / ana sayfaya atılır.  
* **Çözüm:** `/customer/profile`.  

#### [BUG-002] Gecikme faizi şema uyumsuzluğu

* **Öncelik:** P0 · **Kesin**  
* **Dosya:** `cronService.js:276,324`; `sales.js:710`; `init.js` şemasında tablo/kolon yok  
* **Etki:** Cron faiz hesabı ve faiz ödeme endpoint’leri runtime’da hata verir.  
* **Çözüm:** Migration veya özelliği kapat/temizle.  

#### [BUG-003] Satış onay akışı tutarsız

* **Öncelik:** P1 · **Yüksek**  
* **Dosya:** `sales.js:324–329` INSERT `status='approved'` + borç güncelleme; ayrı `POST /approve/:token` farklı mantık  
* **Etki:** E-posta onay akışı fiilen bypass; borç/onay çift kaynak.  

#### [BUG-004] Limit artışı iş kuralı zayıf

* **Öncelik:** P1 · **Yüksek**  
* **Dosya:** `checkForLimitIncrease` ödeme sonrası çağrılıyor  
* **Etki:** Her taksit ödemesinde limit artışı riski (iş kuralı “düzenli ödeme” değilse).  

#### [BUG-005] email_templates DROP TABLE

* **Öncelik:** P1 · **Kesin**  
* **Dosya:** `database/init.js:130–142`  
* **Etki:** Sunucu restart’ında şablon özelleştirmeleri silinir.  

#### [SEO-001..004] SPA SEO

* **Kanıt:** Canlı HTML yalnızca `#root` + tek title/description; OG yok. `/sitemap.xml` **200** ama `Content-Type: text/html` ve SPA shell (soft-404). `robots.txt` `Disallow:` boş — `/admin/login` indexlenebilir.  
* **Öneri:** nginx’te gerçek sitemap; Disallow admin/customer; landing için prerender veya en azından statik meta güçlendirme. Klasik e-ticaret ürün sayfası olmadığı için Product schema **şu an N/A**; Organization/LocalBusiness faydalı olur.  

#### [UX-001] Kayıtta KVKK onayı yok

* **Kesin:** `CustomerRegister.js` içinde checkbox/KVKK eşleşmesi yok. Onay `EmailVerification` adımında (`complete-registration`) — teknik olarak geç ama kayıt anında açık rıza zayıf.  

#### [UX-004] Şifre sıfırlama yok

* **Kesin:** Route/API yok (`password_reset` şablon adı init’te geçse de akış yok).  

#### [TEST-001] Test altyapısı

* Backend: test script yok.  
* Frontend: tek test kırık (axios ESM + learn react).  
* Kritik akışlar (kayıt, satış, ödeme kaydı, auth) test edilmiyor.  

#### [CONFIG-002] Credentials dosyası

* `.gitignore` `Server-credentials.md` içeriyor ama dosya **hâlâ tracked** (`git status` modified). İçerik rapora alınmadı. History’den scrub + rotate önerilir.

---

## 5. React / Frontend (özet)

* Hook kuralları: ESLint `exhaustive-deps` uyarıları mevcut (sonsuz döngü kanıtı yok; stale closure riski).  
* Lazy/Suspense/ErrorBoundary: **yok**.  
* Liste key’leri: MUI tablolarda genelde id (örnek dosyalarda tutarlı görünüyor).  
* Prop drilling sınırlı; global state yok.  
* Controlled inputs: formlarda yaygın.  

---

## 6. Routing Tablosu

| URL | Component | Erişim | SEO meta | Loading/Error/Empty | Not |
|-----|-----------|--------|----------|---------------------|-----|
| `/` | Home | Public | Statik ortak | Kısmi | Landing |
| `/admin/login` | AdminLogin | Public | Statik | Error Alert | |
| `/customer-login` | CustomerLogin | Public | Statik | | BUG-001 redirect |
| `/customer-register`, `/register` | CustomerRegister | Public | Statik | Step UI | KVKK checkbox yok |
| `/verify-email/:token` | EmailVerification | Public | Statik | Loading/Error | |
| `/contract-approve/:token`, `/contracts/:token` | EmailVerification | Public | Statik | | Aynı component |
| `/privacy-policy` | PrivacyPolicy | Public | Statik | | |
| `/terms` | Terms | Public | Statik | | |
| `/kvkk` | KVKK | Public | Statik | | |
| `/unsubscribe` | Unsubscribe | Public | Statik | | |
| `/admin/dashboard` | Dashboard | Admin JWT | Statik | Loading/Alert | |
| `/admin/customers` | Customers | Admin | Statik | | |
| `/admin/customers/:id` | CustomerDetail | Admin | Statik | | |
| `/admin/sales` | Sales | Admin | Statik | | |
| `/admin/sales/new` | NewSale | Admin | Statik | alert() | |
| `/admin/sales/:id` | SaleDetail | Admin | Statik | | |
| `/admin/future-payments` | FuturePayments | Admin | Statik | console.debug | |
| `/admin/backups` | Backups | Admin | Statik | | |
| `/admin/bulk-email` | BulkEmail | Admin | Statik | | |
| `/customer/profile` | CustomerProfile | Customer | Statik | Skeleton iyi | |
| `*` | → `/` | — | Soft-404 | | UX-003 |

**Eksik (klasik e-ticaret / beklenen):** ürün, kategori, sepet, checkout, online ödeme sonucu, şifre sıfırlama, 404 sayfası, mesafeli satış, iade politikası, çerez paneli.

**SPA yenileme:** Production’da nginx/frontend static + API ayrı; admin/müşteri path’lerinin `try_files` ile index’e düşmesi beklenir (DEPLOY.md `/var/www/html`). Doğrulandı: `/admin/login` 200 HTML.

---

## 7. E-ticaret / İş Kuralları (taksit modeli)

| Alan | Durum |
|------|--------|
| Ürün/stok/varyant/sepet/kupon/online ödeme | **Yok (bilinçli)** |
| Kredi limiti kontrolü satışta | Var (`sales.js`) |
| Faiz oranları hard-coded | 1–5 taksit (%0/%5/%10) — FE+BE |
| Satış atomikliği | Transaction yok — BUG-006 |
| Ödeme idempotency | Yok; çift tıklama FE’ye bağlı |
| Webhook | N/A |
| Sipariş e-postası | Satış/ödeme maili var |
| Yetkisiz satış görüntüleme | Müşteri `/me/*` JWT id; admin tümü — IDOR müşteri tarafında düşük |

---

## 8. Auth / Authorization

| Konu | Durum |
|------|--------|
| Kayıt / giriş / e-posta doğrulama | Var |
| Şifre sıfırlama | Yok |
| Admin JWT 24h / müşteri 30d | Kodda |
| Token yenileme | Yok |
| Logout server-side revoke | Yok (istemci siler) |
| ProtectedRoute | Token varlığı; müşteri için `customer` objesi (token zorunlu değil — zayıf) |
| Backend yetki | Admin/müşteri middleware var |
| Rate limit / brute-force | Yok |
| CSRF | Bearer → düşük; cookie’ye geçilirse gerekir |
| Cookie flags | JWT cookie kullanılmıyor |

---

## 9. API Endpoint Özeti

Mount: `/api/customers`, `/api/sales`, `/api/email`, `/api/admin`, `/api/health`.

Öne çıkan public uçlar: register, login, verify-email, complete-registration, resend-verification, sales/approve/:token, subscribe/unsubscribe, health.

Admin uçları: CRUD müşteri/satış, yedek, bulk email, pending verification.

**CORS:** whitelist (markaworld + localhost). **Helmet yok.** SQL genelde parametreli (injection düşük). Mass assignment: müşteri update `status` body’den.

Frontend: axios timeout 10s; bulk 5dk; 401/403 session clear.

---

## 10. Güvenlik (OWASP özeti)

Kritik/yüksek bulgular SEC-001…007. XSS: `dangerouslySetInnerHTML` yok. SQLi: güçlü kanıt yok. Clickjacking: header yok. Upload: genel dosya upload endpoint’i görülmedi. `.env` gitignore’da. Bundle’da API secret görülmedi (yalnızca public API URL).

---

## 11–14. SEO / Perf / A11y / Responsive

* **SEO:** CSR; soft sitemap; robots zayıf; LocalBusiness schema yok.  
* **Perf:** 321 kB gzip ana JS; lazy yok; web-vitals ölçüm gönderilmiyor.  
* **A11y:** iframe title, aria-label eksikleri; touch min-height theme’de 44px (iyi).  
* **Responsive:** Theme breakpoint’leri var; admin mobil menü zayıf (UX-002). Manuel 320–414 px tarama bu oturumda tam yapılmadı → Eksik Bilgi.

---

## 15. UX / Hata durumları

CustomerProfile loading/empty iyi; birçok admin sayfası `alert()`. Offline/maintenance yok. Çift tıklama koruması sınırlı. Oturum dolunca `?session=expired` yönlendirmesi var.

---

## 16. Veri gizliliği / yasal (teknik)

| Madde | Durum |
|-------|--------|
| KVKK / Gizlilik / Koşullar sayfaları | Var |
| Kayıt anı açık rıza checkbox | Yok (UX-001) |
| Doğrulama sonrası sözleşmeler | Var |
| Mesafeli satış / iade / ön bilgilendirme | Yok |
| Çerez tercih / analytics consent | Analytics yok; çerez banner yok |
| Hesap silme self-service | Müşteri self-delete yok (admin delete var) |
| Log’da PII | SEC-003 |

*Bu bölüm hukuki görüş değildir.*

---

## 17. Test kapsamı

| Akış | Test |
|------|------|
| Kayıt, giriş, satış, ödeme, admin | **Yok** |
| E2E | **Yok** |
| App.test.js | **Kırık** |

Öneri sırası: auth API integration → satış+limit → ProtectedRoute redirect → kayıt/KVKK UI.

---

## 18. Dependency / yapılandırma

* CRA 5 eski; eject yok.  
* `date-fns` + `dayjs` çift bağımlılık.  
* `vercel.json` legacy; asıl deploy VPS+PM2+nginx.  
* GitHub Actions: test/lint kapısı yok; SSH password secret.  
* Root `package.json` bağımlılıkları bu makinede unmet (asıl runtime `server/`).

---

## Eksik Bilgi

* Production `.env` gerçek değerleri / şifre rotasyon durumu (erişilmedi; okunmamalı)  
* nginx full config (try_files, cache, TLS detayı)  
* SMTP teslim oranı / spam skorları  
* Manuel tarayıcı a11y (axe) ve Lighthouse skorları  
* Gerçek gecikme faizi iş ihtiyacı (özellik mi dead code mı)  
* `Server-credentials.md` içeriği (bilinçli okunmadı)  
* DB yedeklerinin şifreli saklanıp saklanmadığı  

---

## Önerilen Düzeltme Yol Haritası

### Faz 1 — Kritik güvenlik ve veri bütünlüğü
* ID: SEC-001, SEC-002, SEC-003, SEC-004, SEC-010, CONFIG-002  
* Özet: Credential temizliği/rotate, bcrypt+rate limit, log scrub, path sanitize  
* Risk: Admin login kırılabilir — bakım penceresi  
* Efor: ~3–5 gün  
* Test: login brute, backup path, register log yok  

### Faz 2 — Sipariş/satış ve kullanıcı akışları
* ID: BUG-001, BUG-002, BUG-003, BUG-004, BUG-005, BUG-006, UX-001, UX-004  
* Özet: Redirect fix, faiz şeması, satış transaction, limit kuralı, KVKK, şifre reset  
* Efor: ~5–8 gün  

### Faz 3 — Build / kod kararlılığı
* ID: CODE-001, CODE-002, CODE-003, CONFIG-001, SEC-007 (hedefli)  
* Özet: ESLint temizliği, ölü api/, CI lint/test, bağımlılık patch  
* Efor: ~3–5 gün  

### Faz 4 — SEO ve performans
* ID: SEO-001…004, PERF-001, PERF-002, UX-003  
* Özet: robots/sitemap, meta/OG, lazy routes, 404 sayfası  
* Efor: ~3–6 gün (prerender ayrı)  

### Faz 5 — Erişilebilirlik ve UX
* ID: A11Y-001…003, UX-002  
* Efor: ~2–3 gün  

### Faz 6 — Test altyapısı
* ID: TEST-001  
* Efor: ~3–5 gün  

---

## Uygulama Öncesi Önerilen Sıra

1. SEC-001 credential rotate + repo temizliği  
2. SEC-002 + rate limit  
3. SEC-003 / SEC-010 log scrub  
4. BUG-001 ProtectedRoute  
5. SEC-004 backup sanitize  
6. BUG-005 DROP TABLE kaldırma  
7. BUG-002 faiz şema kararı  
8. BUG-003/006 satış transaction + onay tekilleştirme  
9. UX-001 KVKK checkbox  
10. SEO-003/002 robots + sitemap  
11. SEC-006 security headers  
12. TEST-001 smoke testler + CI  
13. PERF-001 lazy load  
14. SEO meta / a11y / UX mobil menü  

**Bu aşamada hiçbir düzeltme uygulanmamıştır.**

---

## Değişiklik Kontrolü

* **İnceleme öncesi Git durumu:**  
  - Modified (önceden mevcut): `Server-credentials.md`, `client/src/pages/BulkEmail.js`, `client/src/services/api.js`, `server/routes/admin.js`, `server/services/emailService.js`, `server/services/verificationService.js`  
  - Untracked (önceden mevcut): `.github/`, `scripts/fix-dns-and-deploy.sh`, `scripts/setup-github-deploy-secrets.py`, `tmp-mail-preview.html`  
* **İnceleme sonrası Git durumu (kaynak):** Aynı önceden mevcut değişikliklere dokunulmadı.  
* **Yerel yan etki (gitignore):** Denetim komutları için `client/node_modules` kuruldu ve `client/build` üretildi — her ikisi de `.gitignore` altında; commit edilmedi.  
* **Cursor tarafından değiştirilen kaynak dosya sayısı:** 0  
* **Oluşturulan tek rapor dosyası:** `MARKAWORLD_TECHNICAL_AUDIT.md`  
* **Kaynak kodda değişiklik yapıldı mı:** Hayır  
* **Paket/lock bilerek güncellendi mi:** Hayır (`npm ci` lock’a sadık)  
* **Gizli değerler rapora yazıldı mı:** Hayır  

---

*Rapor sonu.*
