# 🏪 Müşteri Ödeme Takip Sistemi - Marka World

Giyim mağazaları için geliştirilmiş, taksitli satış ve müşteri ödeme takip sistemi. Modern siyah-beyaz tasarım ile müşteri ve admin panelleri.

## 🎯 Özellikler

### ✅ Müşteri Paneli
- **Müşteri Kayıt Sistemi**: Kendi kendine kayıt olma
- **Email Onay Sistemi**: Hesap aktivasyonu için email onayı
- **Güvenli Giriş**: TC Kimlik No + Telefon ile giriş
- **Kişisel Profil**: Müşteri bilgileri ve kredi limiti görüntüleme
- **Taksit Takibi**: Ödenen (✅), bekleyen (⚠️) ve geciken (❌) taksitler
- **Ödeme Bilgileri**: Şirket IBAN ve ödeme talimatları
- **Alışveriş Geçmişi**: Tüm satış kayıtları

### ✅ Admin Paneli
- **Müşteri Yönetimi**: CRUD işlemleri, arama ve filtreleme
- **Taksitli Satış Sistemi**: 3 taksit (%5 faiz) veya 5 taksit (%10 faiz)
- **Email Onay Sistemi**: Otomatik müşteri onayı
- **Ödeme Takibi**: Manuel ödeme kaydı ve durum güncellemeleri
- **Dashboard**: İstatistikler ve özet bilgiler

### ✅ Otomatik Email Sistemi
- **Kayıt Onay Emaili**: Hesap aktivasyonu için
- **Günlük Kontroller**: Saat 12:00'da otomatik çalışma
- **Ödeme Hatırlatmaları**: 3 gün önceden uyarı
- **Gecikme Bildirimleri**: Vade geçen ödemeler için uyarı
- **HTML Email Şablonları**: Profesyonel görünüm

### ✅ Modern Tasarım
- **Siyah-Beyaz Tema**: Şık ve profesyonel görünüm
- **Responsive Design**: Mobil ve masaüstü uyumlu
- **Material-UI**: Modern bileşenler
- **Logo Entegrasyonu**: Marka kimliği
- **Step-by-Step Kayıt**: Kullanıcı dostu kayıt süreci

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v14 veya üzeri)
- NPM
- Gmail hesabı (email için)

### 1. Bağımlılıkları Yükleyin
```bash
# Ana proje
npm install

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Email Ayarlarını Yapın
`server/.env` dosyasını oluşturun:
```env
SMTP_USER=sizin-email@gmail.com
SMTP_PASS=sizin-uygulama-şifreniz
COMPANY_NAME=MARKA WORLD GİYİM LTD. ŞTİ.
FRONTEND_URL=http://localhost:3000
```

**Gmail Uygulama Şifresi Alma:**
1. Gmail hesabınızda 2 faktörlü doğrulama açın
2. Google hesap ayarları → Güvenlik → Uygulama şifreleri
3. Yeni uygulama şifresi oluşturun

### 3. Sunucuları Başlatın

**Tek Komutla (Önerilen):**
```bash
npm start
```

**Veya Ayrı Ayrı:**
```bash
# Backend (Terminal 1)
cd server
node index.js

# Frontend (Terminal 2)
cd client
npm start
```

## 🌐 Erişim Adresleri

- **Müşteri Paneli**: http://localhost:3000 (Ana sayfa)
- **Admin Paneli**: http://localhost:3000/admin
- **Backend API**: http://localhost:5000

## 📱 Kullanım Kılavuzu

### Müşteri Kayıt ve Giriş Süreci

#### Yeni Müşteri Kaydı
1. Ana sayfada (http://localhost:3000) "Yeni Hesap Oluştur" butonuna tıklayın
2. **Adım 1 - Kişisel Bilgiler**:
   - Ad Soyad (zorunlu)
   - TC Kimlik No (zorunlu, 11 hane)
   - Telefon (zorunlu)
   - Doğum Tarihi (isteğe bağlı)
3. **Adım 2 - İletişim Bilgileri**:
   - Email Adresi (zorunlu, onay için)
   - Adres (isteğe bağlı)
4. "Hesap Oluştur" butonuna tıklayın
5. Email adresinize gelen onay linkine tıklayın
6. Hesabınız aktifleştirilir (5.000₺ kredi limiti)

#### Müşteri Girişi
1. Ana sayfada TC Kimlik No ve telefon numaranızı girin
2. Giriş yaptıktan sonra kişisel panel açılır

#### Müşteri Paneli Özellikleri
- **Kişisel Bilgiler**: Ad, TC, telefon, email, adres, kredi limiti
- **Ödeme Bilgileri**: Şirket IBAN, banka bilgileri, ödeme talimatları
- **Taksit Tablosu**: 
  - ✅ Yeşil: Ödenen taksitler
  - ⚠️ Sarı: Bekleyen taksitler  
  - ❌ Kırmızı: Geciken taksitler
- **Alışveriş Geçmişi**: Tüm satış kayıtları

### Admin Paneli Kullanımı

#### Erişim
- Müşteri panelinde sağ üstteki "Admin Panel" butonuna tıklayın
- Veya direkt http://localhost:3000/admin adresine gidin

#### Admin Özellikleri
1. **Dashboard**: Genel istatistikler ve özet
2. **Müşteriler**: Müşteri listesi, ekleme, düzenleme
3. **Satışlar**: Satış listesi ve detayları
4. **Yeni Satış**: Taksitli satış oluşturma

### Taksitli Satış Süreci
1. Admin panelinde "Yeni Satış" seçin
2. Müşteri seçin (aktif müşteri listesinden)
3. Satış tutarını girin
4. Taksit sayısını seçin (3 veya 5)
5. Sistem otomatik hesaplama yapar
6. Müşteriye onay maili gönderilir
7. Müşteri onayladıktan sonra taksitler aktif olur

## 🔧 Sistem Ayarları

### Faiz Oranları
- **3 Taksit**: %5 faiz
- **5 Taksit**: %10 faiz

### Kredi Limiti Kuralları
- **Varsayılan Limit**: 5.000₺
- **Düzenli Ödeme Bonusu**: +%20 artış
- **Gecikme Cezası**: -%5 azalış

### Email Zamanlaması
- **Kayıt Onayı**: Anında gönderilir
- **Hatırlatma**: Vade tarihinden 3 gün önce
- **Gecikme Uyarısı**: Vade tarihinden 1 gün sonra
- **Günlük Kontrol**: Her gün saat 12:00

### Ödeme Bilgileri
- **Şirket**: MARKA WORLD GİYİM LTD. ŞTİ.
- **IBAN**: TR12 3456 7890 1234 5678 9012 34
- **Banka**: Türkiye İş Bankası - Merkez Şubesi

## 📊 Veritabanı

Sistem SQLite veritabanı kullanır:
- **Dosya**: `server/database/database.sqlite`
- **Otomatik Tablo Oluşturma**: İlk çalıştırmada
- **Email Onay Sistemi**: verification_token ve email_verified alanları

### Müşteri Durumları
- **pending**: Email onayı bekliyor
- **active**: Onaylanmış ve aktif
- **inactive**: Pasif müşteri

## 🛠️ Teknik Detaylar

### Backend
- **Framework**: Node.js + Express
- **Veritabanı**: SQLite3
- **Email**: Nodemailer (Gmail SMTP)
- **Cron**: node-cron (günlük işlemler)
- **Validation**: express-validator
- **Security**: crypto (token generation)

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Tema**: Custom siyah-beyaz tema
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Material Icons
- **Date Picker**: @mui/x-date-pickers
- **Date Library**: Day.js

### Tasarım Özellikleri
- **Renk Paleti**: Siyah (#000000) ve beyaz (#ffffff)
- **Typography**: Roboto font ailesi
- **Bileşenler**: Rounded corners, subtle shadows
- **Responsive**: Mobile-first yaklaşım
- **Stepper**: Step-by-step kayıt süreci

## 📁 Proje Yapısı

```
├── server/                 # Backend API
│   ├── database/          # Veritabanı işlemleri
│   ├── routes/            # API rotaları
│   ├── services/          # Servisler (email, cron)
│   └── index.js           # Ana sunucu dosyası
├── client/                # Frontend React uygulaması
│   ├── public/
│   │   └── logo.png       # Şirket logosu
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   │   ├── CustomerLogin.js      # Müşteri giriş
│   │   │   ├── CustomerRegister.js   # Müşteri kayıt
│   │   │   └── CustomerProfile.js    # Müşteri profil
│   │   ├── services/      # API servisleri
│   │   └── theme.js       # Material-UI tema
├── logo.png               # Ana logo dosyası
└── package.json           # Ana proje dosyası
```

## 🔒 Güvenlik

- **Müşteri Kimlik Doğrulama**: TC + Telefon kombinasyonu
- **Email Onay Sistemi**: Hesap aktivasyonu için zorunlu
- **Token Tabanlı Onay**: Güvenli verification token'ları
- **Input Validation**: Tüm form girişleri doğrulanır
- **SQL Injection Koruması**: Parametreli sorgular
- **CORS Ayarları**: Güvenli API erişimi

## 🐛 Sorun Giderme

### Sunucu Başlamıyor
```bash
# Port kontrolü
netstat -an | findstr :5000
netstat -an | findstr :3000
```

### Email Gönderilmiyor
- `.env` dosyasındaki email ayarlarını kontrol edin
- Gmail uygulama şifresini doğru girdiğinizden emin olun
- 2 faktörlü doğrulamanın açık olduğunu kontrol edin

### Müşteri Kayıt Olamıyor
- Email adresinin geçerli olduğundan emin olun
- TC Kimlik No'nun 11 haneli olduğunu kontrol edin
- Aynı TC veya email ile daha önce kayıt olunmadığından emin olun

### Email Onayı Gelmiyor
- Spam klasörünü kontrol edin
- Email servis ayarlarını kontrol edin
- Backend loglarında hata mesajlarını kontrol edin

### Logo Görünmüyor
- `logo.png` dosyasının `client/public/` klasöründe olduğundan emin olun
- Tarayıcı cache'ini temizleyin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. **Konsol Logları**: Browser Developer Tools → Console
2. **Network İstekleri**: Developer Tools → Network
3. **Backend Logları**: Terminal çıktılarını kontrol edin

## 🔄 Gelecek Özellikler

- [ ] SMS bildirimleri
- [ ] Şifre sıfırlama sistemi
- [ ] Sosyal medya ile giriş
- [ ] Stok yönetimi entegrasyonu
- [ ] Detaylı raporlama sistemi
- [ ] Mobil uygulama
- [ ] Çoklu mağaza desteği
- [ ] QR kod ile ödeme takibi

---

**Geliştirici**: AI Assistant  
**Versiyon**: 2.1.0  
**Lisans**: MIT  
**Son Güncelleme**: 2024 