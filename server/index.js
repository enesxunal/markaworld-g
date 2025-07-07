require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Veritabanı ve servisler
const { initDatabase, insertDefaultData, insertDefaultEmailTemplates } = require('./database/init');
const cronService = require('./services/cronService');

// Rotalar
const customersRouter = require('./routes/customers');
const salesRouter = require('./routes/sales');
const emailRouter = require('./routes/email');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug modunu aç
const debug = true;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Debug middleware - tüm istekleri logla
if (debug) {
  app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.path}`);
    console.log('📦 Request body:', req.body);
    
    // Response'u yakala
    const oldSend = res.send;
    res.send = function(data) {
      console.log('📬 Response:', data);
      oldSend.apply(res, arguments);
    };
    
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

// Manuel cron tetikleme (test için)
app.post('/api/admin/run-daily-checks', async (req, res) => {
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

// Email onay rotası
app.get('/verify-email/:token', (req, res) => {
  res.redirect(`http://localhost:3000/contract-approve/${req.params.token}`);
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