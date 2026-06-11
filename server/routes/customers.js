const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');
const verificationService = require('../services/verificationService');
const jwt = require('jsonwebtoken');
const { authenticateAdmin, authenticateCustomer } = require('../middleware/auth');
const { hoursFromNow } = require('../utils/datetime');
const router = express.Router();

const sanitizeCustomer = (row) => {
  if (!row) return null;
  const { password, verification_token, ...safe } = row;
  return safe;
};

const findByVerificationToken = (token) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM customers
       WHERE verification_token = ?
       AND (verification_token_expires_at IS NULL OR verification_token_expires_at > datetime('now'))`,
      [token],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });

// Tüm müşterileri listele (admin)
router.get('/', authenticateAdmin, (req, res) => {
  const { search, status } = req.query;
  let query = 'SELECT * FROM customers';
  let params = [];

  if (search || status) {
    query += ' WHERE ';
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR tc_no LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    query += conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Müşteriler getirilemedi' });
    }
    res.json(customers.map(sanitizeCustomer));
  });
});

// E-posta doğrulama linkini yeniden gönder (kayıt sonrası)
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Geçerli email adresi girin')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const result = await verificationService.resendVerificationByEmail(email);

    if (!result.found) {
      return res.json({
        success: true,
        message: 'Kayıtlı e-posta adresinize doğrulama bağlantısı gönderildi.'
      });
    }

    res.json({
      success: true,
      message: 'Doğrulama e-postası tekrar gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.'
    });
  } catch (error) {
    console.error('Doğrulama maili yeniden gönderme hatası:', error.message);
    res.status(500).json({
      success: false,
      error: 'E-posta gönderilemedi. Sunucu mail ayarları kontrol edilmeli. Lütfen bir süre sonra tekrar deneyin.'
    });
  }
});

// Müşteri paneli — kendi hesabı (JWT gerekli)
router.get('/me', authenticateCustomer, (req, res) => {
  const customerId = req.customerId;

  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Müşteri getirilemedi' });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    const salesQuery = `
      SELECT s.*,
        (SELECT COUNT(*) FROM installments WHERE sale_id = s.id AND status = 'paid') as paid_installments,
        (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) as total_installments,
        (SELECT SUM(amount) FROM installments WHERE sale_id = s.id AND status = 'unpaid') as remaining_debt
      FROM sales s
      WHERE s.customer_id = ? AND s.status = 'approved'
      ORDER BY s.created_at DESC
    `;

    db.all(salesQuery, [customerId], (err2, sales) => {
      if (err2) {
        return res.status(500).json({ error: 'Satış geçmişi getirilemedi' });
      }

      const totalRemainingDebt = sales.reduce(
        (total, sale) => total + (parseFloat(sale.remaining_debt) || 0),
        0
      );

      res.json({
        ...sanitizeCustomer(customer),
        current_debt: totalRemainingDebt,
        sales
      });
    });
  });
});

router.get('/me/sales', authenticateCustomer, (req, res) => {
  const customerId = req.customerId;
  const query = `
    SELECT s.*,
      (SELECT COUNT(*) FROM installments WHERE sale_id = s.id AND status = 'paid') as paid_installments,
      (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) as total_installments
    FROM sales s
    WHERE s.customer_id = ? AND s.status = 'approved'
    ORDER BY s.created_at DESC
  `;

  db.all(query, [customerId], (err, sales) => {
    if (err) {
      return res.status(500).json({ error: 'Satışlar getirilemedi' });
    }
    res.json(sales);
  });
});

router.get('/me/installments', authenticateCustomer, (req, res) => {
  const customerId = req.customerId;
  const query = `
    SELECT i.*, s.id as sale_id, s.total_amount as sale_total,
      CASE
        WHEN i.status = 'paid' THEN 'paid'
        WHEN i.status = 'unpaid' AND date(i.due_date) < date('now') THEN 'overdue'
        ELSE 'unpaid'
      END as display_status
    FROM installments i
    JOIN sales s ON i.sale_id = s.id
    WHERE s.customer_id = ? AND s.status = 'approved'
    ORDER BY i.due_date ASC
  `;

  db.all(query, [customerId], (err, installments) => {
    if (err) {
      return res.status(500).json({ error: 'Taksitler getirilemedi' });
    }
    res.json(installments);
  });
});

// Müşteri detayı getir (admin)
router.get('/:id', authenticateAdmin, (req, res) => {
  const customerId = req.params.id;

  // Önce müşteri bilgilerini al
  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Müşteri getirilemedi' });
    }
    
    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    // Müşterinin satış geçmişini ve taksit bilgilerini getir
    const salesQuery = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM installments WHERE sale_id = s.id AND status = 'paid') as paid_installments,
        (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) as total_installments,
        (SELECT SUM(amount) FROM installments WHERE sale_id = s.id AND status = 'unpaid') as remaining_debt
      FROM sales s 
      WHERE s.customer_id = ? AND s.status = 'approved'
      ORDER BY s.created_at DESC
    `;

    db.all(salesQuery, [customerId], (err, sales) => {
      if (err) {
        return res.status(500).json({ error: 'Satış geçmişi getirilemedi' });
      }

      // Toplam kalan borcu hesapla
      const totalRemainingDebt = sales.reduce((total, sale) => total + (sale.remaining_debt || 0), 0);

      res.json({
        ...sanitizeCustomer(customer),
        current_debt: totalRemainingDebt,
        sales
      });
    });
  });
});

// Müşteri kayıt
router.post('/register', [
  body('name').notEmpty().withMessage('Ad Soyad gerekli'),
  body('tc_no').isLength({ min: 11, max: 11 }).withMessage('TC Kimlik No 11 haneli olmalı'),
  body('phone').notEmpty().withMessage('Telefon gerekli'),
  body('email').isEmail().withMessage('Geçerli email adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('birth_date').optional().isDate().withMessage('Geçerli doğum tarihi girin'),
  body('address').optional()
], async (req, res) => {
  console.log('🔥 Register endpoint çağrıldı!');
  console.log('📝 Request body:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation hatası:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, tc_no, phone, email, password, birth_date, address } = req.body;

  try {
    // Email kontrolü
    console.log('🔍 Email kontrolü yapılıyor:', email);
    const existingCustomer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE email = ?', [email], (err, row) => {
        if (err) {
          console.error('❌ Email kontrolü hatası:', err);
          reject(err);
        }
        else resolve(row);
      });
    });

    if (existingCustomer) {
      console.log('❌ Email zaten kayıtlı:', email);
      return res.status(400).json({
        success: false,
        error: 'Bu email adresi zaten kayıtlı'
      });
    }

    // Şifreyi hashle
    console.log('🔐 Şifre hashleniyor...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Şifre hashlendi');
    
    // Onay tokeni oluştur
    console.log('🎲 Onay tokeni oluşturuluyor...');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = hoursFromNow(24);
    console.log('✅ Onay tokeni oluşturuldu:', {
      token: verificationToken,
      expiresAt: verificationTokenExpiresAt
    });

    // Müşteriyi kaydet
    console.log('💾 Müşteri kaydediliyor:', {
      name,
      tc_no,
      phone,
      email,
      birth_date,
      address,
      verificationToken,
      verificationTokenExpiresAt
    });
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO customers (
          name, tc_no, phone, email, password, birth_date, address, 
          verification_token, verification_token_expires_at, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [name, tc_no, phone, email, hashedPassword, birth_date, address, verificationToken, verificationTokenExpiresAt, 'pending'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    const customerId = result;
    console.log('✅ Müşteri kaydedildi, ID:', customerId);

    let emailSent = false;
    let emailErrorMessage = null;
    try {
      await emailService.sendCustomerRegistrationEmail(
        { id: customerId, name, email },
        verificationToken
      );
      emailSent = true;
    } catch (emailError) {
      console.error('❌ Email gönderme hatası:', emailError.message);
      emailErrorMessage = emailError.message;
    }

    res.status(201).json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Kayıt başarılı! E-posta adresinize gönderilen onay linkine tıklayın.'
        : 'Kayıt oluşturuldu ancak doğrulama e-postası gönderilemedi. "Tekrar gönder" ile yeniden deneyebilirsiniz.',
      emailError: emailErrorMessage,
      customerId
    });

  } catch (error) {
    console.error('💥 Kayıt hatası:', error);
    console.error('💥 Hata detayı:', error.stack);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu' });
  }
});

// E-posta onayı (herkese açık — token ile)
router.get('/verify-email/:token', async (req, res) => {
  const verificationToken = req.params.token;

  try {
    const customer = await findByVerificationToken(verificationToken);

    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş onay linki. Yeni doğrulama e-postası isteyebilirsiniz.'
      });
    }

    if (customer.status === 'active') {
      return res.json({
        success: true,
        alreadyActive: true,
        message: 'Hesabınız zaten aktif. Giriş yapabilirsiniz.',
        customer: sanitizeCustomer(customer)
      });
    }

    if (!customer.email_verified) {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE customers SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [customer.id],
          (err) => (err ? reject(err) : resolve())
        );
      });
      customer.email_verified = 1;
    }

    res.json({
      success: true,
      message: 'E-posta adresiniz onaylandı. Sözleşmeleri onaylayarak hesabınızı tamamlayın.',
      customer: sanitizeCustomer(customer)
    });
  } catch (error) {
    console.error('Email onay hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Onay sırasında bir hata oluştu'
    });
  }
});

// Müşteri giriş
router.post('/login', [
  body('email').isEmail().withMessage('Geçerli email adresi girin'),
  body('password').notEmpty().withMessage('Şifre gerekli')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Müşteriyi email ile bul
    const customer = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM customers WHERE email = ? AND status = "active" AND email_verified = 1',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!customer) {
      return res.status(401).json({ 
        success: false,
        error: 'Email adresi bulunamadı veya hesap aktif değil. Lütfen email onayınızı kontrol edin.' 
      });
    }

    // Şifre doğrulama
    if (!customer.password) {
      return res.status(401).json({ 
        success: false,
        error: 'Bu hesap eski sistemde oluşturulmuş. Lütfen şifre sıfırlama yapın veya yeni hesap oluşturun.' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Şifre hatalı. Lütfen tekrar deneyin.' 
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(503).json({ success: false, error: 'Sunucu yapılandırması eksik' });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        tc_no: customer.tc_no,
        phone: customer.phone,
        email: customer.email,
        birth_date: customer.birth_date,
        address: customer.address,
        credit_limit: customer.credit_limit,
        current_debt: customer.current_debt,
        status: customer.status
      }
    });

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
  }
});

// Müşteri güncelle (admin)
router.put('/:id', authenticateAdmin, [
  body('name').notEmpty().withMessage('Ad Soyad gerekli'),
  body('tc_no').isLength({ min: 11, max: 11 }).withMessage('TC Kimlik No 11 haneli olmalı'),
  body('phone').notEmpty().withMessage('Telefon gerekli'),
  body('email').optional().isEmail().withMessage('Geçerli email adresi girin'),
  body('birth_date').optional().isDate().withMessage('Geçerli doğum tarihi girin'),
  body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Kredi limiti pozitif olmalı')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const customerId = req.params.id;
  const { name, tc_no, phone, email, birth_date, address, credit_limit, status } = req.body;

  // TC No benzersizlik kontrolü (kendisi hariç)
  db.get('SELECT id FROM customers WHERE tc_no = ? AND id != ?', [tc_no, customerId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }

    if (existing) {
      return res.status(400).json({ error: 'Bu TC Kimlik No ile kayıtlı başka müşteri var' });
    }

    const query = `
      UPDATE customers 
      SET name = ?, tc_no = ?, phone = ?, email = ?, birth_date = ?, 
          address = ?, credit_limit = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      name,
      tc_no,
      phone,
      email || null,
      birth_date || null,
      address || null,
      credit_limit,
      status || 'active',
      customerId
    ];

    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Müşteri güncellenemedi' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Müşteri bulunamadı' });
      }

      res.json({ message: 'Müşteri başarıyla güncellendi' });
    });
  });
});

// Müşteri sil (admin)
router.delete('/:id', authenticateAdmin, (req, res) => {
  const customerId = req.params.id;

  // Önce müşterinin aktif satışları var mı kontrol et
  db.get(
    'SELECT COUNT(*) as count FROM sales WHERE customer_id = ? AND status != "cancelled"',
    [customerId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }

      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Bu müşterinin aktif satışları var, silinemez. Önce müşteriyi pasif yapın.' 
        });
      }

      db.run('DELETE FROM customers WHERE id = ?', [customerId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Müşteri silinemedi' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }

        res.json({ message: 'Müşteri başarıyla silindi' });
      });
    }
  );
});

// Müşteri kredi limitini güncelle (admin)
router.post('/:id/increase-limit', authenticateAdmin, [
  body('new_limit').isFloat({ min: 0 }).withMessage('Yeni limit pozitif olmalı')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const customerId = req.params.id;
  const { new_limit } = req.body;

  // Müşterinin mevcut limitini al
  db.get('SELECT credit_limit FROM customers WHERE id = ?', [customerId], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Müşteri bulunamadı' });
    }

    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    db.run(
      'UPDATE customers SET credit_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [new_limit, customerId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Limit güncellenemedi' });
        }

        res.json({
          message: 'Kredi limiti başarıyla güncellendi',
          old_limit: customer.credit_limit,
          new_limit: new_limit
        });
      }
    );
  });
});

// Müşterinin satışlarını getir
router.get('/:id/sales', authenticateAdmin, (req, res) => {
  const customerId = req.params.id;

  const query = `
    SELECT s.*, 
      (SELECT COUNT(*) FROM installments WHERE sale_id = s.id AND status = 'paid') as paid_installments,
      (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) as total_installments
    FROM sales s 
    WHERE s.customer_id = ? 
    ORDER BY s.created_at DESC
  `;

  db.all(query, [customerId], (err, sales) => {
    if (err) {
      return res.status(500).json({ error: 'Satışlar getirilemedi' });
    }
    res.json(sales);
  });
});

// Müşterinin taksitlerini getir
router.get('/:id/installments', authenticateAdmin, (req, res) => {
  const customerId = req.params.id;

  const query = `
    SELECT i.*, s.total_amount as sale_total
    FROM installments i
    JOIN sales s ON i.sale_id = s.id
    WHERE s.customer_id = ?
    ORDER BY i.due_date ASC
  `;

  db.all(query, [customerId], (err, installments) => {
    if (err) {
      return res.status(500).json({ error: 'Taksitler getirilemedi' });
    }
    res.json(installments);
  });
});

// Admin - Yeni müşteri ekle (direkt aktif)
router.post('/', authenticateAdmin, [
  body('name').notEmpty().withMessage('Ad Soyad gerekli'),
  body('tc_no').isLength({ min: 11, max: 11 }).withMessage('TC Kimlik No 11 haneli olmalı'),
  body('phone').notEmpty().withMessage('Telefon gerekli'),
  body('email').optional().isEmail().withMessage('Geçerli email adresi girin'),
  body('birth_date').optional().isDate().withMessage('Geçerli doğum tarihi girin'),
  body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Kredi limiti pozitif olmalı')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, tc_no, phone, email, birth_date, address, credit_limit } = req.body;

  // TC No benzersizlik kontrolü
  db.get('SELECT id FROM customers WHERE tc_no = ?', [tc_no], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }

    if (existing) {
      return res.status(400).json({ error: 'Bu TC Kimlik No ile kayıtlı müşteri zaten var' });
    }

    const query = `
      INSERT INTO customers (name, tc_no, phone, email, birth_date, address, credit_limit, status, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      name,
      tc_no,
      phone,
      email || null,
      birth_date || null,
      address || null,
      credit_limit || 5000,
      'active', // Admin tarafından eklenen müşteriler direkt aktif
      email ? 1 : 0 // Email varsa onaylanmış sayılır
    ];

    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Müşteri eklenemedi' });
      }

      res.status(201).json({
        id: this.lastID,
        message: 'Müşteri başarıyla eklendi'
      });
    });
  });
});

// Müşteriyi manuel aktifleştir (admin)
router.post('/activate/:id', authenticateAdmin, (req, res) => {
  const customerId = req.params.id;
  
  db.run(
    'UPDATE customers SET status = "active", email_verified = 1, verification_token = NULL WHERE id = ?',
    [customerId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Aktivasyon hatası' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Müşteri bulunamadı' });
      }
      
      res.json({ message: 'Müşteri başarıyla aktifleştirildi' });
    }
  );
});

// Sözleşme onayı ve kayıt tamamlama (token ile)
router.post('/complete-registration/:token', async (req, res) => {
  const { token } = req.params;
  const { kvkk, contract, electronic } = req.body;

  if (!kvkk || !contract || !electronic) {
    return res.status(400).json({
      success: false,
      error: 'Tüm sözleşmeleri onaylamanız gerekmektedir'
    });
  }

  try {
    const customer = await findByVerificationToken(token);

    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş onay linki'
      });
    }

    if (!customer.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Önce e-posta adresinizi doğrulamanız gerekiyor'
      });
    }

    if (customer.status === 'active') {
      return res.json({
        success: true,
        message: 'Hesabınız zaten aktif'
      });
    }

    // Sözleşme onaylarını kaydet ve hesabı aktifleştir
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE customers SET 
          kvkk_approved = ?, 
          contract_approved = ?, 
          electronic_approved = ?,
          status = 'active',
          verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        [kvkk ? 1 : 0, contract ? 1 : 0, electronic ? 1 : 0, customer.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      success: true,
      message: 'Hesabınız başarıyla aktifleştirildi'
    });

  } catch (error) {
    console.error('Sözleşme onay hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sözleşme onayı sırasında bir hata oluştu'
    });
  }
});

module.exports = router; 