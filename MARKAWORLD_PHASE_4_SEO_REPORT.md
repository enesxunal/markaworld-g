# MARKAWORLD Phase 4 — SEO Audit & Optimizasyon Raporu

**Tarih:** 5 Ağustos 2026  
**HEAD (başlangıç):** `0a7afc4` — Unify UI with black-white and cream accent design system.  
**Kapsam:** Teknik SEO, yerel SEO, sayfa içi SEO, indeksleme (CRA SPA)  
**Commit / push / deploy:** Yapılmadı (kullanıcı onayı bekleniyor)

---

## Yönetici Özeti

### Mevcut SEO durumu (audit öncesi)
- Tek bir `index.html` title/description tüm SPA route’larına ilk HTML olarak gidiyordu.
- Canonical, `robots` meta, sitemap, JSON-LD yoktu.
- `robots.txt` boş `Disallow` ile her şeyi açıyordu; Sitemap satırı yoktu.
- `/sitemap.xml` production’da SPA HTML (soft-404) dönüyordu.
- Bilinmeyen URL’ler React’te anasayfaya yönleniyor + nginx 200 → soft-404 riski.
- `www` ve non-www aynı anda **200** (canonical çakışması).
- Repo’da `favicon.ico` / `favicon.svg` yok; manifest yanlış boyutlar iddia ediyordu.
- OG image yoktu; keywords meta vardı (zayıf sinyal).

### Kritik sorunlar
1. Sitemap soft-404 (HTML) — crawl keşfi kırık  
2. Soft-404: bilinmeyen path → anasayfa / 200  
3. www ↔ non-www çift 200 (nginx redirect yok)  
4. Private route’larda anasayfa metadata sızıntısı  
5. Favicon/manifest asset tutarsızlığı  

### Düzeltilenler (lokal, deploy edilmedi)
- `SeoHead` + `siteConfig` ile route bazlı title/description/canonical/robots/OG  
- Anasayfa WebSite + Store JSON-LD (`@graph`)  
- Statik `sitemap.xml` + güncellenmiş `robots.txt`  
- Public legal sayfalara benzersiz SEO  
- Admin/müşteri/login/register/verify/unsubscribe → `noindex, nofollow`  
- React `NotFound` sayfası (`noindex`) — soft-404 anasayfa redirect kaldırıldı  
- Manifest / index.html temizliği; PublicLayout logo `logo.png`  
- SEO otomatik testleri (10 test, geçti)  
- `CI=false npm run build` başarılı  

### Manuel kalanlar
- Search Console / sitemap gönderimi / URL Inspection  
- Google Business Profile doğrulama (bilinmiyor)  
- nginx: non-www → www, gerçek HTTP 404 (opsiyonel)  
- 1200×630 OG görseli onayı ve üretimi  
- Dedicated favicon seti (16/32/180/192/512)  
- PageSpeed / Rich Results manuel ölçüm  

### Deploy kararı
**Deploy için hazır (frontend static).** Nginx redirect değişikliği bu pakette yok; sitemap artık build ile gerçek XML olarak kopyalanacak. Onay sonrası commit → push → deploy önerilir.

---

## URL Envanteri

| Route | Public/Private | Index | Title (yeni) | Canonical | Sitemap |
|-------|----------------|-------|--------------|-----------|---------|
| `/` | Public | index, follow | Marka World \| Tokat’ta Taksitli Marka Alışverişi | `https://www.markaworld.com.tr/` | Evet |
| `/privacy-policy` | Public | index, follow | Gizlilik Politikası \| Marka World | `.../privacy-policy` | Evet |
| `/terms` | Public | index, follow | Kullanım Koşulları \| Marka World | `.../terms` | Evet |
| `/kvkk` | Public | index, follow | KVKK Aydınlatma Metni \| Marka World | `.../kvkk` | Evet |
| `/admin/login` | Auth UI | noindex, nofollow | Yönetici Girişi \| Marka World | yok | Hayır |
| `/admin/*` | Private | noindex, nofollow | Yönetici Paneli \| Marka World | yok | Hayır |
| `/customer-login` | Auth UI | noindex, nofollow | Müşteri Girişi \| Marka World | yok | Hayır |
| `/customer/*` | Private | noindex, nofollow | Müşteri Paneli \| Marka World | yok | Hayır |
| `/register`, `/customer-register` | Auth | noindex, nofollow | Müşteri Kaydı \| Marka World | yok | Hayır |
| `/verify-email/:token` vb. | Token | noindex, nofollow | Doğrulama \| Marka World | yok | Hayır |
| `/unsubscribe` | Utility | noindex, nofollow | Abonelikten Çık \| Marka World | yok | Hayır |
| `*` (404) | Public hata | noindex, follow | Sayfa Bulunamadı \| Marka World | yok | Hayır |

**Audit öncesi:** Legal/auth sayfalarında route-özel title/description/canonical/robots yoktu; hepsi anasayfa `index.html` meta’sını paylaşıyordu. Home’da yalnızca `document.title` + description overwrite vardı.

**İç link:** Anasayfa footer → privacy / terms / kvkk; müşteri giriş/kayıt linkleri mevcut. Hash section’lar (`#contact` vb.) sitemap’e eklenmedi.

---

## Teknik SEO

### robots.txt
**Önce:** `Allow` yok, Sitemap yok, boş Disallow.  
**Sonra:** `Allow: /`, private path Disallow (crawl budget), `Sitemap: https://www.markaworld.com.tr/sitemap.xml`.  
Not: Disallow indeks kaldırma değildir; asıl koruma auth + noindex.

### sitemap.xml
Yalnız 4 public URL; HTTPS + www; `lastmod`/`priority`/`changefreq` yok (uydurma tarih yok).  
Deploy sonrası `/sitemap.xml` gerçek XML olmalı (şu an production hâlâ HTML soft-404).

### Canonical
Self-referencing www origin. Query/trailing slash için ayrı canonical varyasyonu yok (SPA tek path).

### Redirects (ölçüm — değiştirilmedi)
| Kontrol | Sonuç |
|---------|--------|
| `http://www` → https | 301 → `https://www.markaworld.com.tr/` |
| `https://markaworld.com.tr` | **200** (www’ye yönlendirme yok) |
| `https://www` | 200 |
| `/index.html` | 200 (aynı SPA HTML) |
| Trailing slash legal | 200 (SPA) |
| Bilinmeyen URL | nginx 200 + (önce) anasayfa redirect |

**Öneri (manuel nginx):** `markaworld.com.tr` → `www.markaworld.com.tr` 301; mümkünse gerçek 404 status için özel location (SPA `try_files` ile çelişebilir — ayrı plan).

### 404
- **Önce:** `Navigate to="/"` → soft-404  
- **Sonra:** `NotFound` component, H1, anasayfa CTA, `noindex, follow`  
- **HTTP status:** Hâlâ nginx 200 (SPA fallback). Gerçek 404 status ayrı deploy önerisi.

### SPA sınırlamaları
CRA CSR: ilk HTML anasayfa meta taşır; JS sonrası route meta güncellenir. Google genelde render eder; Bing/diğerleri daha zayıf olabilir. Az public route için mevcut çözüm yeterli. SSR/prerender bu turda yapılmadı (ağır altyapı).

---

## On-page SEO

### Anasayfa
- **Tek H1:** “Tarzını Bugün Seç, Ödemeni Planına Yay” (title ile çelişmiyor; eyebrow’da Tokat + taksitli alışveriş)
- **H2/H3:** section heading sırası korunuyor
- **Semantic:** `header` (AppBar), `nav` (Toolbar), `main`, `section`, `footer`
- **Logo:** `RouterLink` + anlamlı `alt` (onClick navigate kaldırıldı)
- **İçerik kavramları:** Tokat, taksitli alışveriş, marka ürünleri, fiziksel mağaza, müşteri paneli/ödeme takibi, WhatsApp — doğal metinde mevcut
- **Product schema:** Kadın/erkek/çocuk kartlarına eklenmedi (doğru)

### Legal
Hukuki metin değiştirilmedi. H1 korundu; alt başlıklar `h2`; SeoHead + `main` eklendi.

---

## Structured Data

### WebSite
- name: Marka World  
- url: `https://www.markaworld.com.tr/`  
- SearchAction: **yok** (site içi arama yok)

### Store
Doğrulanan: name, url, logo/image (`/logo.png`), telephone, email, PostalAddress (Karşıyaka…, Tokat, 60000, TR), geo (Maps embed koordinatları), sameAs (Instagram + Google place link), currenciesAccepted: TRY.

**Bilinçli eklenmeyen:** aggregateRating, review, priceRange, openingHours, Product/Offer.

Ayrı Organization node yok; Store publisher olarak WebSite’a bağlı.

---

## Yerel SEO

| Alan | Değer | Tutarlılık |
|------|-------|------------|
| Name | Marka World | OK |
| Address | Karşıyaka, Vali Ayhan Çevik Cd. 46/A, 60000 Tokat Merkez/Tokat | Footer + iletişim + schema |
| Phone | (0356) 502 78 99 / +903565027899 | OK |
| Email | info@markaworld.com.tr | OK |
| WhatsApp | wa.me/905368324660 | OK |
| Instagram | instagram.com/markaworldtokat | sameAs |
| Maps | Embed + g.co/kgs/mLGTxNA | OK |
| Çalışma saatleri | Sayfada yok | Schema’ya eklenmedi |

- Google Business Profile durumu: **bilinmiyor**  
- Search Console: **bilinmiyor**  
- Bing Webmaster: **bilinmiyor**

---

## Sosyal Paylaşım

| Tag | Durum |
|-----|-------|
| og:type / site_name / locale / title / description / url | Eklendi / yönetiliyor |
| og:image (+ width/height/alt) | **Yok** — 1200×630 asset repo’da yok; uydurulmadı |
| twitter:card | `summary` (image yokken) |
| twitter:title / description | Eklendi |

**Gereksinim (onay sonrası):** 1200×630 JPEG/WebP, okunabilir logo, az metin, public path örn. `/og-share.jpg`.

---

## Performans

| Konu | Durum |
|------|--------|
| LCP | Ölçülmedi; hero koyu arka plan + tipografi ağırlıklı |
| CLS | Ölçülmedi; logo için width/height attribute eklendi |
| INP | Ölçülmedi |
| Maps iframe | Zaten `loading="lazy"` + title |
| Font | MUI default; ek preload yok |
| Bundle | ~327 kB JS gzip (+2.8 kB SEO ile) |
| Lighthouse | **ölçülmedi** |

Düşük risk: logo boyut attribute, semantic link; ağır animasyon/third-party eklenmedi.

---

## Testler

| Test | Sonuç |
|------|--------|
| `CI=false npm run build` | Geçti (önceden var olan unused-var uyarıları) |
| `npm test -- SeoHead` | 10/10 geçti |
| ProtectedRoute + App smoke | Geçti |
| ESLint SeoHead / siteConfig / NotFound | Temiz |
| `git diff --check` | Temiz |
| Secret pattern (SEO dosyaları) | Temiz |
| Build `sitemap.xml` / `robots.txt` | Kopyalandı, XML parse OK |
| JSON-LD parse (test) | WebSite + Store OK |

### Manuel test listesi (deploy sonrası)
1. [Google Rich Results Test](https://search.google.com/test/rich-results) — anasayfa  
2. [Schema Markup Validator](https://validator.schema.org/)  
3. Search Console → URL Inspection + sitemap gönderimi  
4. PageSpeed Insights — mobil/desktop  
5. Facebook Sharing Debugger (OG image eklenince)  
6. `curl -sI https://www.markaworld.com.tr/sitemap.xml` → `application/xml` veya `text/xml`  
7. `curl -s https://www.markaworld.com.tr/robots.txt` → Sitemap satırı  

---

## Değiştirilen Dosyalar

| Dosya | Amaç | Değişiklik | Risk |
|-------|------|------------|------|
| `client/src/seo/siteConfig.js` | SEO sabitleri + JSON-LD | Yeni | Düşük |
| `client/src/components/SeoHead.js` | Head yönetimi | Yeni | Düşük |
| `client/src/components/SeoHead.test.js` | SEO testleri | Yeni | Yok |
| `client/src/pages/NotFound.js` | 404 UI + noindex | Yeni | Düşük |
| `client/src/App.js` | NotFound route | Soft-404 kaldırıldı | Düşük-orta (UX değişir) |
| `client/src/pages/Home.js` | SeoHead, main/nav, logo link | SEO/semantic | Düşük |
| `client/src/pages/PrivacyPolicy.js` | SEO + h2 | Hukuk metni aynı | Düşük |
| `client/src/pages/Terms.js` | SEO + h2 | Hukuk metni aynı | Düşük |
| `client/src/pages/KVKK.js` | SEO + h2 | Hukuk metni aynı | Düşük |
| `client/src/pages/Unsubscribe.js` | noindex | — | Düşük |
| `client/src/pages/AdminLogin.js` | noindex | — | Düşük |
| `client/src/pages/CustomerLogin.js` | noindex | — | Düşük |
| `client/src/pages/CustomerRegister.js` | noindex | — | Düşük |
| `client/src/pages/EmailVerification.js` | noindex | — | Düşük |
| `client/src/components/Layout.js` | Panel noindex | — | Düşük |
| `client/src/components/PublicLayout.js` | logo.png + link | 404 logo düzeltmesi | Düşük |
| `client/public/index.html` | Varsayılan anasayfa meta | keywords kaldırıldı | Düşük |
| `client/public/robots.txt` | Crawl kuralları | — | Düşük |
| `client/public/sitemap.xml` | Public URL listesi | Yeni | Düşük |
| `client/public/manifest.json` | Doğru icon boyutu | — | Düşük |
| `.gitignore` | CRA `client/public/**` istisnası | Gatsby `public` kuralı yeni sitemap’i gizliyordu | Düşük |
| `MARKAWORLD_PHASE_4_SEO_REPORT.md` | Bu rapor | Yeni | Yok |

**Dokunulmayan:** admin iş mantığı, borç/limit/ödeme, auth/JWT, DB, backup, mail, `.env`, nginx, framework migration.

---

## Manuel Sonraki Adımlar

1. **Commit + push + deploy** (onayınızla)  
2. Search Console property doğrula (HTML tag / DNS — değer uydurma)  
3. Sitemap gönder: `https://www.markaworld.com.tr/sitemap.xml`  
4. Anasayfa + legal URL Inspection  
5. Google Business Profile NAP = site NAP  
6. OG 1200×630 görsel onayı  
7. Favicon seti (kare PNG/ICO)  
8. nginx: non-www → www 301  
9. PageSpeed ölçümü  
10. (Opsiyonel) prerender yalnızca `/` için — ayrı değerlendirme  

---

## Deploy Öncesi Kontrol

- [x] www canonical kodda tercih ediliyor  
- [x] HTTPS origin  
- [x] Public URL listesi doğru  
- [x] Private noindex  
- [x] Build’de sitemap XML  
- [x] Build’de robots Sitemap satırı  
- [x] JSON-LD testten geçerli  
- [x] `/logo.png` production 200 (mevcut)  
- [ ] Production’da sitemap 200 XML (**deploy sonrası**)  
- [ ] Console hatası yok (**deploy / smoke sonrası**)  
- [ ] www redirect (**nginx manuel**)  
- [ ] OG image (**asset onayı**)  

---

## Audit Notları (kök neden özeti)

1. **Tek `index.html` meta** → tüm route’lar aynı snippet riski → `SeoHead`  
2. **Sitemap yok + SPA fallback** → Google HTML alıyordu → statik `sitemap.xml`  
3. **Catch-all → `/`** → soft-404 → `NotFound` + noindex  
4. **Favicon repo’da yok** → production eski dosyalarla “şans eseri” 200; yeni clean deploy favicon’u kaybedebilir → logo.png fallback + rapor  
5. **www/non-www çift 200** → kodla çözülmez; nginx gerekir  

---

*Bu turda keyword stuffing, gizli metin, sahte yorum/puan/ürün veya doorway page üretilmedi.*
