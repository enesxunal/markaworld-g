const jwt = require('jsonwebtoken');

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Erişim token\'ı bulunamadı'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'marka-world-secret-key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin yetkisi gerekli'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Geçersiz token'
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'marka-world-secret-key');
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