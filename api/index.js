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
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Marka World API',
      version: '1.0.0',
      endpoints: [
        '/api/health',
        '/api/test',
        '/api/admin',
        '/api/customers',
        '/api/sales',
        '/api/email'
      ],
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['GET']
    });
  }
} 