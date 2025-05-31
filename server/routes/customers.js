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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, tc_no, phone, email, password, birth_date, address } = req.body;

  try {
    // TC No benzersizlik kontrolü
    const existingCustomer = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM customers WHERE tc_no = ? OR email = ?', [tc_no, email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingCustomer) {
      return res.status(400).json({ 
        error: 'Bu TC Kimlik No veya email adresi ile kayıtlı müşteri zaten var' 
      });
    }

    // Şifreyi hash'le
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verification token oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');

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

    // Onay emaili gönder
    try {
      await emailService.sendCustomerRegistrationEmail(
        { id: customerId, name, email },
        verificationToken
      );
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
      // Email hatası olsa bile kayıt tamamlanmış sayılır
    }

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı! Email adresinize gönderilen onay linkine tıklayarak hesabınızı aktifleştirin.',
      customerId
    });

  } catch (error) {
    console.error('Kayıt hatası:', error);
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
        error: 'Geçersiz veya süresi dolmuş onay linki' 
      });
    }

    // Müşteriyi aktifleştir
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE customers SET email_verified = 1, status = ?, verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['active', customer.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Başarı sayfası HTML'i
    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hesap Onaylandı - Marka World</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  max-width: 600px; 
                  margin: 50px auto; 
                  padding: 20px;
                  background-color: #f5f5f5;
              }
              .container {
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  text-align: center;
              }
              .success-icon {
                  font-size: 64px;
                  color: #4CAF50;
                  margin-bottom: 20px;
              }
              .btn {
                  background-color: #000000;
                  color: white;
                  padding: 15px 30px;
                  border: none;
                  border-radius: 8px;
                  font-size: 16px;
                  text-decoration: none;
                  display: inline-block;
                  margin: 20px 10px;
                  cursor: pointer;
              }
              .btn:hover { background-color: #333333; }
              h1 { color: #000000; }
              p { color: #666666; line-height: 1.6; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="success-icon">✅</div>
              <h1>Hesabınız Başarıyla Onaylandı!</h1>
              <p>Sayın <strong>${customer.name}</strong>,</p>
              <p>Email adresiniz doğrulandı ve hesabınız aktifleştirildi. Artık taksitli alışveriş yapabilir ve müşteri panelinize erişebilirsiniz.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #000000; margin-top: 0;">Hesap Bilgileriniz:</h3>
                  <p><strong>Kredi Limitiniz:</strong> 5.000₺</p>
                  <p><strong>Hesap Durumu:</strong> Aktif</p>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer-login" class="btn">
                  GİRİŞ YAP
              </a>
              
              <p style="margin-top: 30px; font-size: 14px;">
                  Giriş bilgileriniz: Email adresiniz ve şifreniz
              </p>
          </div>
      </body>
      </html>
    `;

    res.send(html);

  } catch (error) {
    console.error('Email onay hatası:', error);
    res.status(500).json({ error: 'Onay sırasında bir hata oluştu' });
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

module.exports = router; 