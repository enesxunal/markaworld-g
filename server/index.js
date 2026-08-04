const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Veritabanı ve servisler
const { initDatabase, insertDefaultData, insertDefaultEmailTemplates } = require('./database/init');
const cronService = require('./services/cronService');
const { authenticateAdmin } = require('./middleware/auth');
// Rotalar
const customersRouter = require('./routes/customers');
const salesRouter = require('./routes/sales');
const emailRouter = require('./routes/email');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

const debug = process.env.NODE_ENV !== 'production';

// nginx / reverse proxy arkasında doğru client IP (rate limit)
app.set('trust proxy', 1);

app.disable('x-powered-by');

app.use(
  helmet({
    // API yanıtları; HTML CSP nginx/static tarafında ayrıca ele alınmalı
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts:
      process.env.NODE_ENV === 'production'
        ? { maxAge: 15552000, includeSubDomains: true }
        : false
  })
);

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://markaworld.com.tr',
  'https://www.markaworld.com.tr',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json());

// Debug middleware — production kapalı; body'de hassas alan basılmaz
if (debug) {
  const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'authorization',
    'verificationToken',
    'verification_token',
    'tc_no',
    'refresh_token',
    'adminPassword'
  ]);

  function scrub(value) {
    if (!value || typeof value !== 'object') return value;
    const out = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(k) || /password|token|secret|authorization/i.test(k)) {
        out[k] = '[redacted]';
      } else if (v && typeof v === 'object') {
        out[k] = scrub(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length) {
      console.log('Request body (scrubbed):', scrub(req.body));
    }
    next();
  });
}

// API rotaları
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/email', emailRouter);
app.use('/api/admin', adminRouter);

// Sistem durumu
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Müşteri Ödeme Takip Sistemi çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Manuel cron tetikleme (sadece admin)
app.post('/api/admin/run-daily-checks', authenticateAdmin, async (req, res) => {
  try {
    await cronService.runDailyChecksNow();
    res.json({ message: 'Günlük kontroller başarıyla çalıştırıldı' });
  } catch (error) {
    res.status(500).json({ error: 'Günlük kontroller çalıştırılamadı' });
  }
});

// Satış onay sayfası
app.get('/approve/:token', (req, res) => {
  const approvalToken = req.params.token;
  
  // Basit onay sayfası HTML'i
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Satış Onayı - ${process.env.COMPANY_NAME}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            .btn {
                background-color: #4CAF50;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                margin: 20px 10px;
            }
            .btn:hover { background-color: #45a049; }
            .btn-cancel {
                background-color: #f44336;
            }
            .btn-cancel:hover { background-color: #da190b; }
            #result { margin-top: 20px; padding: 15px; border-radius: 5px; }
            .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>${process.env.COMPANY_NAME}</h2>
            <h3>Taksitli Satış Onayı</h3>
            <p>Taksitli satış sözleşmenizi onaylamak için aşağıdaki butona tıklayın.</p>
            
            <button class="btn" onclick="approveSale()">ONAYLA</button>
            <button class="btn btn-cancel" onclick="window.close()">İPTAL</button>
            
            <div id="result"></div>
        </div>

        <script>
            async function approveSale() {
                try {
                    const response = await fetch('/api/sales/approve/${approvalToken}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    const resultDiv = document.getElementById('result');
                    
                    if (response.ok) {
                        resultDiv.innerHTML = '<div class="success">' + data.message + '</div>';
                        setTimeout(() => window.close(), 3000);
                    } else {
                        resultDiv.innerHTML = '<div class="error">' + data.error + '</div>';
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = 
                        '<div class="error">Bağlantı hatası. Lütfen tekrar deneyin.</div>';
                }
            }
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Eski backend doğrulama linki → React sayfasına yönlendir
app.get('/verify-email/:token', (req, res) => {
  const base = (process.env.FRONTEND_URL || 'https://markaworld.com.tr').replace(/\/$/, '');
  res.redirect(`${base}/verify-email/${req.params.token}`);
});

// Statik dosyalar (React build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Hata yakalama middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Sayfa bulunamadı' });
});

// Veritabanını başlat (Vercel için)
async function initializeDatabase() {
  try {
    await initDatabase();
    // await insertDefaultData(); // Otomatik test verisi eklenmesin diye kaldırıldı
    console.log('Veritabanı hazırlandı');
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
    process.exit(1);
  }
}

// Sunucuyu başlat
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
      
      // Cron servisi zaten constructor'da başlatılıyor
      console.log('⏰ Cron servisi başlatıldı');
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
    process.exit(1);
  }
}

// Sunucuyu başlat
startServer();

module.exports = app; 