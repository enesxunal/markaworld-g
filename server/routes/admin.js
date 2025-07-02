const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateAdmin } = require('../middleware/auth');
const { db } = require('../database/init');
const backupService = require('../services/backupService');
const emailService = require('../services/emailService');
const path = require('path');

// Admin giriş bilgileri (gerçek uygulamada veritabanında olmalı)
const ADMIN_CREDENTIALS = {
  username: 'markaworld',
  password: 'Marka60..' // Gerçek uygulamada hash'lenmiş olmalı
};

// Admin giriş
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kullanıcı adı ve şifre kontrolü
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        username: username,
        role: 'admin',
        loginTime: new Date()
      },
      process.env.JWT_SECRET || 'marka-world-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token: token,
      admin: {
        username: username,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin giriş hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Admin çıkış
router.post('/logout', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Çıkış başarılı'
  });
});

// Admin profil
router.get('/profile', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: {
      username: req.admin.username,
      role: req.admin.role,
      loginTime: req.admin.loginTime
    }
  });
});

// Yedek listesini getir
router.get('/backups', authenticateAdmin, async (req, res) => {
  console.log('🔍 [BACKEND] /backups GET endpoint çağrıldı');
  try {
    const result = await backupService.getBackups();
    console.log('🔍 [BACKEND] getBackups sonucu:', result);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('🔍 [BACKEND] /backups GET hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manuel yedek al
router.post('/backups', authenticateAdmin, async (req, res) => {
  console.log('🔍 [BACKEND] /backups POST endpoint çağrıldı');
  try {
    const result = await backupService.createBackup();
    console.log('🔍 [BACKEND] createBackup sonucu:', result);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('🔍 [BACKEND] /backups POST hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Yedeği geri yükle
router.post('/backups/restore/:filename', authenticateAdmin, async (req, res) => {
  const { filename } = req.params;
  const result = await backupService.restoreBackup(filename);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// Yedeği sil
router.delete('/backups/:filename', authenticateAdmin, async (req, res) => {
  const { filename } = req.params;
  const result = await backupService.deleteBackup(filename);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// Yedeği indir
router.get('/backups/download/:filename', authenticateAdmin, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '..', 'backups', filename);
  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(500).json({ success: false, error: 'Dosya indirme hatası' });
    }
  });
});

// Tüm müşterileri getir
router.get('/customers/emails', authenticateAdmin, (req, res) => {
  const query = `
    SELECT DISTINCT email 
    FROM customers 
    WHERE email IS NOT NULL 
    AND email_verified = 1 
    AND unsubscribed = 0
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Müşteri email listesi hatası:', err);
      res.status(500).json({
        success: false,
        error: 'Müşteri listesi alınamadı'
      });
      return;
    }

    res.json({
      success: true,
      emails: rows.map(row => row.email)
    });
  });
});

// Toplu mail gönder
router.post('/send-bulk-email', authenticateAdmin, async (req, res) => {
  try {
    const { recipients, subject, messageContent } = req.body;

    // Validasyon
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli alıcı listesi gerekli'
      });
    }

    if (!subject || !messageContent) {
      return res.status(400).json({
        success: false,
        error: 'Konu ve mesaj içeriği gerekli'
      });
    }

    // Mailleri gönder
    const result = await emailService.sendBulkEmail(recipients, subject, messageContent);

    res.json({
      success: true,
      message: `${result.totalSent} mail başarıyla gönderildi, ${result.totalFailed} mail başarısız`,
      ...result
    });

  } catch (error) {
    console.error('Toplu mail gönderme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Mail gönderimi sırasında bir hata oluştu'
    });
  }
});

module.exports = router; 