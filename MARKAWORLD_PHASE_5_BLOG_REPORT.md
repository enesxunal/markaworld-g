# MARKAWORLD Phase 5 — Blog ve İçerik SEO Raporu

**Tarih:** 5 Ağustos 2026  
**Site:** https://www.markaworld.com.tr  
**Kapsam:** Blog altyapısı + ilk 8 yayın + SEO + sitemap  
**Commit / push / deploy:** Yapılmadı (bu turda yasak)

---

## Mimari karar

### İnceleme özeti
| Soru | Sonuç |
|------|--------|
| Blog altyapısı var mıydı? | **Hayır** — route, CMS, blog tablosu yok |
| Backend CMS / içerik API? | **Yok** |
| SQLite blog tablosu? | **Yok** (users, customers, sales, installments, email_*, newsletter, settings) |
| Mevcut SEO yardımcısı? | `SeoHead` + `siteConfig` (Phase 4) hazır |
| Sitemap / robots? | Statik `client/public/sitemap.xml` + `robots.txt` |

### Tercih edilen mimari (uygulandı)
**Statik veri tabanlı blog** — yeni DB, admin CMS, auth veya production şema değişikliği yok.

**Neden düşük risk?**
- Satış/finans/JWT/backup/mail koduna dokunulmaz
- İçerik deploy ile birlikte versiyonlanır; yanlışlıkla production DB’ye yazılmaz
- Markdown/CMS dependency eklenmez; React blok render yeterli

### Dosya yapısı
```
client/src/content/blogPosts.js          # indeks + yardımcılar
client/src/content/blogCategories.js
client/src/content/blogDraftCalendar.js  # 20 taslak başlık
client/src/content/blog/*.js             # 8 yayın içeriği
client/src/pages/Blog.js
client/src/pages/BlogDetail.js
client/src/components/blog/BlogLayout.js
client/src/components/blog/BlogCard.js
client/src/components/blog/BlogContent.js
```

---

## Yeni route’lar

| Route | Davranış | robots |
|-------|----------|--------|
| `/blog` | Liste + kategori filtreleri | index, follow |
| `/blog/:slug` | Yayınlanmış yazı detayı | index, follow |
| `/blog/:bilinmeyen` | Anlamlı 404, bloga/anasayfaya dönüş | noindex, follow |

Mevcut public/admin/customer route’ları değiştirilmedi; yalnızca iki public route eklendi.

---

## Yayınlanan ilk 8 yazı

| # | Slug | Kategori | FAQ |
|---|------|----------|-----|
| 1 | `tokatta-taksitli-alisveris-nasil-yapilir` | Taksit ve Bütçe | Evet (3) |
| 2 | `tokatta-giyim-magazasi-secerken-nelere-dikkat-edilmeli` | Tokat Alışveriş Rehberi | Hayır |
| 3 | `tokatta-kadin-giyim-sezonluk-rehber` | Kadın Giyim | Hayır |
| 4 | `tokatta-erkek-giyim-beden-kalip-secimi` | Erkek Giyim | Hayır |
| 5 | `tokatta-cocuk-giyim-alirken-nelere-dikkat-edilmeli` | Çocuk Giyim | Hayır |
| 6 | `taksitli-alisveriste-butce-plani` | Taksit ve Bütçe | Evet (2) |
| 7 | `musteri-panelinden-odeme-takibi` | Taksit ve Bütçe | Hayır |
| 8 | `marka-world-tokat-magaza-rehberi` | Tokat Alışveriş Rehberi | Hayır |

**Yazar:** Marka World İçerik Ekibi  
**İnceleme:** Marka World Mağaza Ekibi tarafından kontrol edilmiştir  
**Yayın tarihi:** 2026-08-05  
**updatedAt / dateModified:** yok (ilk yayın; sahte güncelleme yok)  
**heroImage:** yok (stok/hotlink yok; tipografik hero)

---

## İçerik kalite kontrolü

- Türkçe, mağaza deneyimi tonu; sabit kelime hedefi yok
- Giriş / H2 / özet şablonları yazıdan yazıya farklı
- Keyword stuffing, sahte istatistik, sahte yorum, sahte fiyat/kampanya/stok yok
- Kesin limit / faizsiz / anında onay vaadi yok
- Çalışma saati yazılmadı (doğrulanmamış)
- Finansal notlar uygun yerlerde mevcut
- Yazı 7 (panel): yalnızca kodda doğrulanan özellikler anlatıldı — taksit tarihleri, kalan borç/limit özeti, ödeme durumu etiketleri, satış özeti, güvenli giriş

**Panel doğrulaması (`CustomerProfile.js`):**
- Kredi limiti, mevcut borç, kullanılabilir tutar, sonraki taksit
- Taksitler: numara, tutar, vade, durum (ödendi/bekliyor/gecikmiş)
- Satışlar: tarih, tutar, ödenen/toplam taksit
- WhatsApp dekont gönderimi

---

## SEO metadata

Her yayın:
- Benzersiz `title` (`… | Marka World`)
- Benzersiz meta description
- Self canonical: `https://www.markaworld.com.tr/blog/{slug}`
- og:title / og:description / og:url / og:type=article
- twitter:card=summary (özel OG görseli yok)
- robots: `index, follow`
- Tek H1

Liste `/blog`: title `Blog | Marka World Tokat`, canonical `/blog`.

---

## Structured data

Detay sayfalarında `@graph`:
1. **BlogPosting** — headline, description, datePublished, author (Organization), publisher+logo, mainEntityOfPage, inLanguage  
   - `image` yok (gerçek asset yok)  
   - `dateModified` yok (güncelleme yok)  
   - Review/rating yok
2. **BreadcrumbList** — Anasayfa → Blog → Yazı
3. **FAQPage** — yalnız görünür SSS olan yazılarda (1 ve 6)

Liste sayfasında hafif `Blog` schema.

---

## Sitemap

`client/public/sitemap.xml` güncellendi (build’e kopyalanıyor).

**Eklenen:** `/blog` + 8 yayın URL’si  
**Korunan:** `/`, legal sayfalar  
**Eklenmeyen:** taslaklar, admin/customer/login, hash, `?kategori=` filtreleri

Toplam public URL: **13**

`robots.txt`: Allow + private Disallow + Sitemap satırı (Phase 4 beklentisiyle hizalandı).

---

## İç bağlantılar

- Her yazıda 2–4 `relatedPosts` → ilgili kartlar
- Uygun yazılarda: anasayfa iletişim, müşteri girişi, WhatsApp
- Anasayfa navbar + mobil menü + footer → **Blog**
- `PublicLayout` navbar + mobil menü + footer → **Blog**

---

## Değiştirilen / eklenen dosyalar

**Yeni**
- `client/src/content/**` (kategoriler, takvim, 8 yazı, indeks)
- `client/src/pages/Blog.js`, `BlogDetail.js`, `Blog.test.js`
- `client/src/components/blog/*`
- `MARKAWORLD_PHASE_5_BLOG_REPORT.md`

**Güncellenen**
- `client/src/App.js` (route’lar)
- `client/src/seo/siteConfig.js` (blog SEO + `buildBlogPostingJsonLd`)
- `client/src/components/PublicLayout.js`
- `client/src/pages/Home.js` (nav/footer Blog)
- `client/public/sitemap.xml`
- `client/public/robots.txt`
- `client/src/components/SeoHead.test.js`

**Dokunulmayan:** admin satış/finans, JWT, backup, mail, production DB, ödeme hesapları

---

## Test sonuçları

| Kontrol | Sonuç |
|---------|--------|
| `CI=false npm run build` | **Geçti** |
| `npm test -- --watchAll=false` | **36/36 geçti** (4 suite) |
| ESLint (değişen dosyalar) | **Temiz** |
| `git diff --check` | **Temiz** |
| 8 slug render + tek H1 | Test ile doğrulandı |
| Bilinmeyen slug noindex | Test ile doğrulandı |
| BlogPosting + Breadcrumb JSON-LD | Test ile doğrulandı |
| FAQPage = görünür SSS | Test ile doğrulandı |
| Sitemap 8 yazı + private yok | Test ile doğrulandı |
| Boş kategori (`alisveris-rehberi`) | Boş durum UI test edildi |

**Manuel / sonraki tur:** gerçek tarayıcıda 375px / 1440px görsel kontrol, console error ve asset 404 (lokal serve ile). Otomatik layout MUI breakpoint’leriyle uyumlu yazıldı.

---

## Bundle etkisi

| Metrik | Değer |
|--------|--------|
| `main.*.js` gzip | **344.26 kB** (**+17.72 kB**) |
| Yeni ağır dependency | **Yok** (markdown/CMS paketi eklenmedi) |

Artış çoğunlukla 8 yazının statik metin içeriğinden kaynaklanır; kabul edilebilir.

---

## Kalan 20 içerik takvimi (taslak — yayınlanmadı)

Kaynak: `client/src/content/blogDraftCalendar.js`

1. Tokat’ta Elden Taksitle Alışveriş Hakkında Bilmeniz Gerekenler  
2. Tokat Merkez’de Mağazadan Taksitli Alışveriş Rehberi  
3. Tokat’ta Aile Boyu Alışveriş İçin Pratik Rehber  
4. Tokat’ta Mağazadan Alışverişin Online Alışverişe Göre Avantajları  
5. Çocuklar İçin Mevsimlik Giyim Listesi  
6. Kadınlar İçin Günlük Kombin Oluşturmanın 7 Pratik Yolu  
7. Erkekler İçin Az Parçayla Kullanışlı Gardırop Oluşturma  
8. Çocuk Kıyafetlerinde Beden Seçimi Nasıl Yapılır?  
9. Mevsim Geçişlerinde Aile Gardırobu Nasıl Hazırlanır?  
10. Alışveriş Öncesi Aylık Ödeme Planı Hazırlama Rehberi  
11. Taksit Sayısı Seçerken Nelere Dikkat Edilmeli?  
12. Büyük Alışverişleri Planlarken Yapılan 6 Yaygın Hata  
13. Taksitli Alışveriş Hakkında Sık Sorulan Sorular  
14. Mağazadan Alışverişte Satış Danışmanına Sorulması Gereken Sorular  
15. Kıyafet Alırken Kumaş Kalitesi Nasıl Anlaşılır?  
16. Ürün Bakım Etiketleri Nasıl Okunur?  
17. Uzun Ömürlü Kıyafet Kullanımı İçin Bakım Önerileri  
18. Mağazada Doğru Beden Denemesi İçin Kontrol Listesi  
19. Alışveriş Sonrası Ödeme Tarihlerini Düzenli Takip Etme Yöntemleri  
20. Aile Alışverişini Tek Seferde Planlamanın Pratik Yolları  

Bu başlıklar için public route / sitemap girişi **yok**.

---

## Gerçek fotoğraf ihtiyacı

Sonraki aşamada her yazıya özgün, lisanslı mağaza fotoğrafı önerilir:

| Yazı teması | Önerilen görsel |
|-------------|-----------------|
| Taksit / bütçe / panel | Mağaza danışmanlık alanı veya panel ekranı (kişisel veri maskeli) |
| Kadın / erkek / çocuk | Gerçek reyon / ürün (stok iddiası olmadan) |
| Mağaza rehberi | Dış cephe + iç mekan + konum bağlamı |
| OG share | 1200×630 ortak Marka World görseli |

Şimdilik tipografik hero + kategori etiketi kullanıldı.

---

## Deploy kararı

**Lokal olarak deploy’a hazır (yalnız frontend static).**

Önerilen sıra (onayınızla):
1. Commit  
2. Push  
3. Frontend deploy  
4. Canlıda `/blog`, 8 slug, `/sitemap.xml` XML kontrolü  
5. Search Console’a sitemap yenileme / URL Inspection  

**Bu turda yapılmadı:** commit, push, deploy, production DB değişikliği, 28 içeriğin tamamını yayınlama.
