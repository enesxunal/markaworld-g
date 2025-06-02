const express = require('express');
const cors = require('cors');

// Veritabanı ve servisler
const { initDatabase, insertDefaultData, insertDefaultEmailTemplates } = require('../server/database/init');

// Rotalar
const customersRouter = require('../server/routes/customers');
const salesRouter = require('../server/routes/sales');
const adminRouter = require('../server/routes/admin');
const emailRouter = require('../server/routes/email');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://markaworld.vercel.app', 'https://marka-world.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API rotaları
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/email', emailRouter);

// Sistem durumu
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Müşteri Ödeme Takip Sistemi çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Onay sayfası route'u
app.get('/approve/*', async (req, res) => {
  await initializeDatabase();
  return app(req, res);
});

// Email doğrulama route'u
app.get('/verify-email/*', async (req, res) => {
  await initializeDatabase();
  return app(req, res);
});

// Veritabanını başlat
let dbInitialized = false;
async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await initDatabase();
      await insertDefaultData();
      await insertDefaultEmailTemplates();
      dbInitialized = true;
      console.log('Veritabanı hazırlandı');
    } catch (error) {
      console.error('Veritabanı başlatma hatası:', error);
    }
  }
}

// Vercel serverless fonksiyonu
module.exports = async (req, res) => {
  await initializeDatabase();
  return app(req, res);
}; 