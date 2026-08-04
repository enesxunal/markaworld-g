const jwt = require('jsonwebtoken');
const db = require('../database/init');
const { debugLog } = require('../utils/safeLog');

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  try {
    debugLog('[AUTH] Admin auth', { method: req.method, path: req.path });

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Erişim token\'ı bulunamadı'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET tanımlı değil (.env)');
      return res.status(503).json({ success: false, error: 'Sunucu yapılandırması eksik' });
    }
    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded || !decoded.username || decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için admin yetkisi gerekli'
      });
    }

    req.admin = {
      username: decoded.username,
      role: decoded.role,
      loginTime: decoded.loginTime
    };
    next();
  } catch (error) {
    console.error('[AUTH] JWT doğrulama başarısız:', error.name);
    res.status(401).json({
      success: false,
      error: 'Geçersiz veya süresi dolmuş token'
    });
  }
};

// Müşteri authentication middleware
const authenticateCustomer = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Erişim token\'ı bulunamadı'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(503).json({ success: false, error: 'Sunucu yapılandırması eksik' });
    }
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded?.id || decoded.role !== 'customer') {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için müşteri oturumu gerekli'
      });
    }
    req.customer = decoded;
    req.customerId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Geçersiz token'
    });
  }
};

module.exports = {
  authenticateAdmin,
  authenticateCustomer
};
