# Marka World Backend API

Giyim mağazası için müşteri ödeme takip sistemi - Backend API

## 🚀 Özellikler

- **Müşteri Yönetimi**: Kayıt, giriş, profil yönetimi
- **Satış Takibi**: Taksitli satış yönetimi
- **Ödeme Sistemi**: Taksit ödemeleri ve takibi  
- **Email Bildirimleri**: Otomatik hatırlatmalar
- **Admin Paneli**: Tam yönetim kontrolü
- **Cron Jobs**: Otomatik günlük kontroller

## 🛠 Teknolojiler

- **Node.js** - Runtime
- **Express.js** - Web framework
- **SQLite** - Veritabanı
- **Nodemailer** - Email servisi
- **JWT** - Authentication
- **CORS** - Cross-origin support

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Çevre değişkenlerini ayarla
cp server/env.example server/.env

# Veritabanını başlat ve sunucuyu çalıştır
npm start
```

## 🔧 Environment Variables

```env
COMPANY_NAME=Marka World
EMAIL_HOST=your-smtp-host
EMAIL_USER=your-email
EMAIL_PASS=your-password
JWT_SECRET=your-secret-key
PORT=5000
```

## 📍 API Endpoints

### Admin
- `POST /api/admin/login` - Admin giriş

### Müşteriler  
- `GET /api/customers` - Müşteri listesi
- `POST /api/customers/register` - Müşteri kayıt
- `POST /api/customers/login` - Müşteri giriş

### Satışlar
- `GET /api/sales` - Satış listesi
- `POST /api/sales` - Yeni satış
- `POST /api/sales/approve/:token` - Satış onayı

### Email
- `POST /api/email/send` - Email gönder
- `GET /api/email/test` - Email test

### Sistem
- `GET /api/health` - Sistem durumu

## 🏢 Şirket Bilgileri

**Marka World**  
Karşıyaka Mah. Vali Ayhan Çevik Bulvarı 46/A  
Merkez/TOKAT  
Email: info@markaworld.com.tr

## 📄 License

MIT License 