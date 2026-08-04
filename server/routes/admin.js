const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { authenticateAdmin } = require('../middleware/auth');
const { db } = require('../database/init');
const backupService = require('../services/backupService');
const emailService = require('../services/emailService');
const verificationService = require('../services/verificationService');
const { isInvalidBackupNameError } = require('../utils/backupPath');

/** Timing dengesi — geçerli bcrypt formatında dummy (gerçek şifre değil). */
const DUMMY_PASSWORD_HASH =
  '$2b$10$9Q8UiWeXOXmPBzj7uBigLub3lZqsLoMX8R.UtdxlsmdLmWMqXDC0K';

// bcrypt hash formatı doğrulama ($2a$/$2b$/$2y$)
function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

function getAdminAuthConfig() {
  return {
    username: (process.env.ADMIN_USERNAME || '').trim(),
    passwordHash: (process.env.ADMIN_PASSWORD_HASH || '').trim()
  };
}

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { ip: false },
  message: {
    success: false,
    error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.'
  },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const username = String(req.body?.username || '')
      .trim()
      .toLowerCase()
      .slice(0, 64);
    return `${ip}|${username}`;
  }
});

// Admin giriş
router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const password = (req.body.password || '').trim();
    const admin = getAdminAuthConfig();

    if (!admin.username || !isBcryptHash(admin.passwordHash)) {
      console.error('ADMIN_USERNAME veya ADMIN_PASSWORD_HASH eksik/geçersiz (.env)');
      return res.status(503).json({
        success: false,
        error: 'Sunucu yapılandırması eksik'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ success: false, error: 'Sunucu yapılandırması eksik' });
    }

    const usernameOk = username.length > 0 && username === admin.username;
    const hashToCompare = usernameOk ? admin.passwordHash : DUMMY_PASSWORD_HASH;
    let passwordOk = false;
    try {
      passwordOk = await bcrypt.compare(password || ' ', hashToCompare);
    } catch {
      passwordOk = false;
    }

    if (!usernameOk || !passwordOk) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    const token = jwt.sign(
      {
        username: admin.username,
        role: 'admin',
        loginTime: new Date()
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token: token,
      admin: {
        username: admin.username,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin giriş hatası:', error.message);
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
  try {
    const result = await backupService.getBackups();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('/backups GET hatası:', error.message);
    res.status(500).json({ success: false, error: 'Yedek listesi alınamadı' });
  }
});

// Manuel yedek al
router.post('/backups', authenticateAdmin, async (req, res) => {
  try {
    const result = await backupService.createBackup();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('/backups POST hatası:', error.message);
    res.status(500).json({ success: false, error: 'Yedek oluşturulamadı' });
  }
});

// Yedeği geri yükle
router.post('/backups/restore/:filename', authenticateAdmin, async (req, res) => {
  const result = await backupService.restoreBackup(req.params.filename);
  if (result.success) {
    return res.json(result);
  }
  const status = result.statusCode || 500;
  return res.status(status).json({ success: false, error: result.error || 'İşlem başarısız' });
});

// Yedeği sil
router.delete('/backups/:filename', authenticateAdmin, async (req, res) => {
  const result = await backupService.deleteBackup(req.params.filename);
  if (result.success) {
    return res.json(result);
  }
  const status = result.statusCode || 500;
  return res.status(status).json({ success: false, error: result.error || 'İşlem başarısız' });
});

// Yedeği indir
router.get('/backups/download/:filename', authenticateAdmin, (req, res) => {
  let filePath;
  try {
    filePath = backupService.resolveSafeBackupPath(req.params.filename);
  } catch (error) {
    if (isInvalidBackupNameError(error)) {
      return res.status(400).json({ success: false, error: 'Geçersiz yedek dosya adı' });
    }
    return res.status(400).json({ success: false, error: 'Geçersiz istek' });
  }

  res.download(filePath, path.basename(filePath), (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, error: 'Dosya bulunamadı' });
    }
  });
});

// Tüm müşterileri getir
router.get('/customers/emails', authenticateAdmin, (req, res) => {
  const query = `
    SELECT DISTINCT email, name, status, email_verified
    FROM customers
    WHERE email IS NOT NULL
      AND trim(email) != ''
      AND status = 'active'
      AND email_verified = 1
      AND IFNULL(marketing_unsubscribed, 0) = 0
    ORDER BY name COLLATE NOCASE
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Müşteri email listesi hatası:', err);
      res.status(500).json({
        success: false,
        error: 'Müşteri listesi alınamadı: ' + err.message
      });
      return;
    }

    res.json({
      success: true,
      count: rows.length,
      emails: rows.map((row) => row.email),
      recipients: rows.map((row) => ({
        email: row.email,
        name: row.name
      }))
    });
  });
});

// Bekleyen doğrulama mailleri — liste
router.get('/customers/pending-verification', authenticateAdmin, async (req, res) => {
  try {
    const list = await verificationService.listPendingVerification();
    res.json({ success: true, count: list.length, customers: list });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Liste alınamadı' });
  }
});

// Tek müşteriye doğrulama maili
router.post('/customers/:id/resend-verification', authenticateAdmin, async (req, res) => {
  try {
    const result = await verificationService.resendVerificationById(req.params.id);
    if (!result.found) {
      return res.status(404).json({ success: false, error: 'Bekleyen müşteri bulunamadı veya zaten aktif' });
    }
    res.json({ success: true, message: `Doğrulama maili gönderildi: ${result.email}` });
  } catch (error) {
    console.error('Admin doğrulama maili hatası:', error.message);
    res.status(500).json({ success: false, error: `Mail gönderilemedi: ${error.message}` });
  }
});

// Tüm bekleyenlere doğrulama maili
router.post('/customers/resend-verification-bulk', authenticateAdmin, async (req, res) => {
  try {
    const results = await verificationService.resendAllPendingVerifications({ delayMs: 800 });
    const msg =
      results.failed === 0
        ? `${results.sent} doğrulama maili gönderildi`
        : `${results.sent} gönderildi, ${results.failed} başarısız`;

    res.json({
      success: results.sent > 0 || results.total === 0,
      message: msg,
      ...results
    });
  } catch (error) {
    console.error('Toplu doğrulama maili hatası:', error.message);
    res.status(500).json({ success: false, error: `Mail gönderilemedi: ${error.message}` });
  }
});

// Toplu mail gönder
router.post('/send-bulk-email', authenticateAdmin, async (req, res) => {
  try {
    const {
      recipients,
      subject,
      messageContent,
      useFullHtml = false,
      useWrapper = true,
      appendUnsubscribe = true
    } = req.body;

    // Validasyon
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli alıcı listesi gerekli'
      });
    }

    if (!subject || !messageContent || !String(messageContent).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Konu ve mesaj içeriği gerekli'
      });
    }

    const result = await emailService.sendBulkEmail(recipients, subject, messageContent, {
      useFullHtml: Boolean(useFullHtml),
      useWrapper: useFullHtml ? false : Boolean(useWrapper),
      appendUnsubscribe: Boolean(appendUnsubscribe)
    });

    res.json({
      success: true,
      message:
        result.totalFailed === 0
          ? `${result.totalSent} kampanya maili gönderildi`
          : `${result.totalSent} gönderildi, ${result.totalFailed} başarısız`,
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