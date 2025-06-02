const express = require('express');
const cors = require('cors');
const salesRouter = require('../server/routes/sales');
const { initDatabase, insertDefaultData, insertDefaultEmailTemplates } = require('../server/database/init');

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

// Sales rotası
app.use('/', salesRouter);

// Veritabanını başlat
let dbInitialized = false;
async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await initDatabase();
      await insertDefaultData();
      await insertDefaultEmailTemplates();
      dbInitialized = true;
      console.log('Sales API - Veritabanı hazırlandı');
    } catch (error) {
      console.error('Sales API - Veritabanı başlatma hatası:', error);
    }
  }
}

// Vercel serverless fonksiyonu
module.exports = async (req, res) => {
  await initializeDatabase();
  return app(req, res);
}; 