const jwt = require('jsonwebtoken');
const db = require('../database/init');

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  try {
    console.log('🔍 [AUTH] Admin authentication başladı');
    console.log('🔍 [AUTH] Request path:', req.path);
    console.log('🔍 [AUTH] Request method:', req.method);
    console.log('🔍 [AUTH] All headers:', req.headers);
    console.log('🔍 [AUTH] Authorization header:', req.header('Authorization'));

    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔍 [AUTH] Extracted token:', token ? 'Token mevcut' : 'Token bulunamadı');
    
    if (!token) {
      console.log('🔍 [AUTH] HATA: Token bulunamadı');
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
    console.log('🔍 [AUTH] Token çözümlendi:', {
      username: decoded.username,
      role: decoded.role,
      loginTime: decoded.loginTime
    });
    
    if (!decoded || !decoded.username || decoded.role !== 'admin') {
      console.log('🔍 [AUTH] HATA: Admin yetkisi yok', {
        decoded: decoded,
        hasUsername: !!decoded?.username,
        role: decoded?.role
      });
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için admin yetkisi gerekli'
      });
    }

    // Admin bilgilerini token'dan al
    req.admin = {
      username: decoded.username,
      role: decoded.role,
      loginTime: decoded.loginTime
    };
    console.log('🔍 [AUTH] Başarılı admin authentication:', req.admin);
    next();

  } catch (error) {
    console.error('🔍 [AUTH] JWT Hata:', error);
    res.status(401).json({
      success: false,
      error: 'Geçersiz veya süresi dolmuş token'
    });
  }
};

// Müşteri authentication middleware (mevcut)
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
    req.customer = decoded;
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