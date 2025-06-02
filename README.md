# 🏪 Marka World - Müşteri Ödeme Takip Sistemi

Giyim mağazası için geliştirilmiş profesyonel müşteri ödeme takip sistemi. Taksitli satış, otomatik bildirimler ve tam mağaza yönetimi.

## ✅ Vercel Deployment Güncellemesi (2025-06-02)

**405 Hataları Düzeltildi:**
- API Serverless Functions oluşturuldu
- CORS ayarları düzeltildi  
- Admin ve müşteri paneli çalışır durumda
- Email sistemi aktif

**Vercel URL:** [https://markaworld.vercel.app](https://markaworld.vercel.app)

**Admin Giriş:**
- Kullanıcı: `markaworld`
- Şifre: `Marka60..`

---

## 🚀 Özellikler

### 👨‍💼 Admin Paneli
- **Müşteri Yönetimi** - Detaylı müşteri profilleri ve kredi takibi
- **Satış Yönetimi** - Taksitli satış oluşturma ve takip
- **Ödeme Takibi** - Otomatik taksit hatırlatmaları
- **Raporlama** - Detaylı satış ve ödeme raporları
- **Email Sistemi** - Otomatik bildirimler ve hatırlatmalar

### 👥 Müşteri Paneli
- **Hesap Oluşturma** - Email onaylı kayıt sistemi
- **Profil Yönetimi** - Kişisel bilgi güncelleme
- **Alışveriş Geçmişi** - Tüm satış kayıtları
- **Taksit Takibi** - Ödeme durumu ve tarihleri
- **Bildirimler** - Email ve SMS hatırlatmaları

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** - Sunucu teknolojisi
- **Express.js** - Web framework
- **SQLite** - Veritabanı
- **JWT** - Authentication
- **Nodemailer** - Email servisi
- **Bcrypt** - Şifre hashleme

### Frontend  
- **React** - UI framework
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router** - Routing

### Deployment
- **Vercel** - Serverless deployment
- **Git** - Version control

## 📦 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn

### 1. Projeyi İndirin
```bash
git clone [repository-url]
cd marka-world
```

### 2. Bağımlılıkları Yükleyin
```bash
npm run install-all
```

### 3. Ortam Değişkenlerini Ayarlayın
`server/.env` dosyası oluşturun:
```env
# Şirket Bilgileri
COMPANY_NAME=Marka World
COMPANY_ADDRESS=Karşıyaka Mah. Vali Ayhan Çevik Bulvarı 46/A, Merkez/TOKAT
COMPANY_TAX_NO=0012587682

# Email Ayarları
EMAIL_HOST=fr-astral.guzelhosting.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@markaworld.com.tr
EMAIL_PASS=w0;d;JiZ8a,v
EMAIL_FROM=Marka World <info@markaworld.com.tr>

# JWT Secret
JWT_SECRET=marka-world-secret-key

# Port
PORT=5000
```

### 4. Sistemi Başlatın
```bash
npm start
```

## 🔧 Kullanım

### Admin Paneli
1. `http://localhost:3000/admin-login` adresine gidin
2. Giriş bilgileri:
   - **Kullanıcı Adı:** markaworld
   - **Şifre:** Marka60..

### Müşteri Paneli
1. `http://localhost:3000/customer-login` adresine gidin
2. Yeni hesap oluşturun veya mevcut hesabınızla giriş yapın

## 📊 Veritabanı Yapısı

### Tablolar
- **customers** - Müşteri bilgileri
- **sales** - Satış kayıtları
- **installments** - Taksit bilgileri
- **customer_agreements** - Sözleşme onayları
- **email_templates** - Email şablonları
- **settings** - Sistem ayarları

## 🚀 Deployment

### Vercel (Önerilen)
1. Vercel hesabı oluşturun
2. Projeyi GitHub'a yükleyin
3. Vercel'de import edin
4. Ortam değişkenlerini ayarlayın

### Manuel Deployment
```bash
# Build oluşturun
npm run build

# Production modunda başlatın
NODE_ENV=production npm start
```

## 🔒 Güvenlik

- JWT token tabanlı authentication
- Password hashing (bcrypt)
- CORS koruması
- Input validation
- SQL injection koruması

## 📧 Email Konfigürasyonu

Sistem şu email sağlayıcıları ile test edilmiştir:
- **Guzel Hosting** (fr-astral.guzelhosting.com)
- Gmail SMTP
- Outlook SMTP

## 🐛 Sorun Giderme

### Port Hatası
```bash
# Port 5000 kullanımda ise
lsof -ti:5000 | xargs kill -9
```

### Email Gönderim Hatası
- SMTP ayarlarını kontrol edin
- Firewall ayarlarını kontrol edin
- Email sağlayıcı limitlerini kontrol edin

### Veritabanı Hatası
```bash
# Veritabanını sıfırla
rm server/database.sqlite
npm start
```

## 📝 API Endpoints

### Müşteri API'leri
- `POST /api/customers/register` - Müşteri kayıt
- `POST /api/customers/login` - Müşteri giriş
- `GET /api/customers/verify-email/:token` - Email onay

### Admin API'leri
- `POST /api/admin/login` - Admin giriş
- `GET /api/admin/profile` - Admin profil

### Satış API'leri
- `POST /api/sales` - Yeni satış
- `POST /api/sales/approve/:token` - Satış onay

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Email:** info@markaworld.com.tr
- **Şirket:** 3 KARE YAZILIM VE TASARIM AJANSI LİMİTED ŞİRKETİ

## 🔄 Versiyon Geçmişi

### v1.0.0 (2024-06-02)
- ✅ Müşteri kayıt ve giriş sistemi
- ✅ Email onay sistemi
- ✅ 3 aşamalı sözleşme onayı
- ✅ Taksitli satış sistemi
- ✅ Admin paneli
- ✅ Otomatik email bildirimleri
- ✅ Cron job sistemi

---

**Marka World** - Modern müşteri ödeme takip sistemi 🚀 