const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');
const router = express.Router();

// Tüm müşterileri listele
router.get('/', (req, res) => {
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
    res.json(customers);
  });
});

// Müşteri detayı getir
router.get('/:id', (req, res) => {
  const customerId = req.params.id;

  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Müşteri getirilemedi' });
    }
    
    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    // Müşterinin satış geçmişini de getir
    const salesQuery = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM installments WHERE sale_id = s.id AND status = 'paid') as paid_installments,
        (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) as total_installments
      FROM sales s 
      WHERE s.customer_id = ? 
      ORDER BY s.created_at DESC
    `;

    db.all(salesQuery, [customerId], (err, sales) => {
      if (err) {
        return res.status(500).json({ error: 'Satış geçmişi getirilemedi' });
      }

      res.json({
        ...customer,
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
    console.log('🔍 TC No ve email kontrolü yapılıyor...');
    // TC No benzersizlik kontrolü
    const existingCustomer = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM customers WHERE tc_no = ? OR email = ?', [tc_no, email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingCustomer) {
      console.log('❌ Müşteri zaten var:', existingCustomer);
      return res.status(400).json({ 
        error: 'Bu TC Kimlik No veya email adresi ile kayıtlı müşteri zaten var' 
      });
    }

    console.log('🔐 Şifre hash\'leniyor...');
    // Şifreyi hash'le
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verification token oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');

    console.log('💾 Müşteri veritabanına kaydediliyor...');
    // Müşteriyi kaydet (pending durumunda)
    const customerId = await new Promise((resolve, reject) => {
      const query = `
        INSERT INTO customers (name, tc_no, phone, email, password, birth_date, address, credit_limit, status, email_verified, verification_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        name,
        tc_no,
        phone,
        email,
        hashedPassword,
        birth_date || null,
        address || null,
        5000, // Varsayılan kredi limiti
        'pending', // Onay bekliyor
        0, // Email onaylanmamış
        verificationToken
      ];

      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    console.log('✅ Müşteri kaydedildi, ID:', customerId);

    console.log('📧 Onay emaili gönderiliyor...');
    // Onay emaili gönder
    try {
      await emailService.sendCustomerRegistrationEmail(
        { id: customerId, name, email },
        verificationToken
      );
      console.log('✅ Email başarıyla gönderildi');
    } catch (emailError) {
      console.error('❌ Email gönderme hatası:', emailError);
      // Email hatası olsa bile kayıt tamamlanmış sayılır
    }

    console.log('🎉 Kayıt işlemi tamamlandı!');
    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı! Email adresinize gönderilen onay linkine tıklayarak hesabınızı aktifleştirin.',
      customerId
    });

  } catch (error) {
    console.error('💥 Kayıt hatası:', error);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu' });
  }
});

// Email onay
router.get('/verify-email/:token', async (req, res) => {
  const verificationToken = req.params.token;

  try {
    // Token ile müşteriyi bul
    const customer = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM customers WHERE verification_token = ? AND email_verified = 0',
        [verificationToken],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!customer) {
      return res.status(400).json({ 
        success: false,
        error: 'Geçersiz veya süresi dolmuş onay linki' 
      });
    }

    // Email'i onaylandı olarak işaretle (ama henüz aktifleştirme)
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE customers SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [customer.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Müşteri bilgilerini döndür (şifre hariç)
    const { password, verification_token, ...customerData } = customer;
    
    res.json({
      success: true,
      message: 'Email başarıyla onaylandı',
      customer: customerData
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

    res.json({
      success: true,
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

// Müşteri güncelle
router.put('/:id', [
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

// Müşteri sil
router.delete('/:id', (req, res) => {
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

// Müşteri kredi limitini artır (düzenli ödeme bonusu)
router.post('/:id/increase-limit', (req, res) => {
  const customerId = req.params.id;

  // Ayarlardan artış oranını al
  db.get('SELECT value FROM settings WHERE key = ?', ['limit_increase_rate'], (err, setting) => {
    if (err) {
      return res.status(500).json({ error: 'Ayarlar getirilemedi' });
    }

    const increaseRate = setting ? parseFloat(setting.value) : 20;

    // Müşterinin mevcut limitini al
    db.get('SELECT credit_limit FROM customers WHERE id = ?', [customerId], (err, customer) => {
      if (err) {
        return res.status(500).json({ error: 'Müşteri bulunamadı' });
      }

      if (!customer) {
        return res.status(404).json({ error: 'Müşteri bulunamadı' });
      }

      const newLimit = customer.credit_limit * (1 + increaseRate / 100);

      db.run(
        'UPDATE customers SET credit_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newLimit, customerId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Limit güncellenemedi' });
          }

          res.json({
            message: 'Kredi limiti başarıyla artırıldı',
            old_limit: customer.credit_limit,
            new_limit: newLimit,
            increase_rate: increaseRate
          });
        }
      );
    });
  });
});

// Müşterinin satışlarını getir
router.get('/:id/sales', (req, res) => {
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
router.get('/:id/installments', (req, res) => {
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
router.post('/', [
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

// Test için müşteriyi aktifleştir
router.post('/activate/:id', (req, res) => {
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

// Sözleşme onayı ve kayıt tamamlama
router.post('/complete-registration/:token', async (req, res) => {
  const verificationToken = req.params.token;
  const { kvkk, contract, electronic } = req.body;

  try {
    // Tüm sözleşmelerin onaylandığını kontrol et
    if (!kvkk || !contract || !electronic) {
      return res.status(400).json({
        success: false,
        error: 'Tüm sözleşmeleri onaylamanız gerekmektedir'
      });
    }

    // Token ile müşteriyi bul
    const customer = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM customers WHERE verification_token = ? AND email_verified = 1',
        [verificationToken],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz token veya email henüz onaylanmamış'
      });
    }

    // Müşteriyi aktifleştir ve sözleşme onaylarını kaydet
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE customers SET 
         status = 'active', 
         verification_token = NULL, 
         kvkk_approved = 1,
         contract_approved = 1,
         electronic_approved = 1,
         agreement_date = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [customer.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Sözleşme onay kaydını log'la
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO customer_agreements 
         (customer_id, kvkk_approved, contract_approved, electronic_approved, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [customer.id, 1, 1, 1, req.ip || 'unknown', req.get('User-Agent') || 'unknown'],
        function(err) {
          if (err) {
            console.error('Sözleşme log hatası:', err);
            // Log hatası olsa bile devam et
          }
          resolve();
        }
      );
    });

    // Onay emaili gönder
    try {
      await emailService.sendCustomerActivationEmail({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        credit_limit: customer.credit_limit
      });
    } catch (emailError) {
      console.error('Aktivasyon emaili gönderme hatası:', emailError);
      // Email hatası olsa bile devam et
    }

    res.json({
      success: true,
      message: 'Hesabınız başarıyla aktifleştirildi',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        credit_limit: customer.credit_limit,
        status: 'active'
      }
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