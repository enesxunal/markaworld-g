const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateAdmin } = require('../middleware/auth');

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

// ... existing code ...

module.exports = router; 