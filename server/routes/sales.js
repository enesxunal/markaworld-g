const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const router = express.Router();
const auth = require('../middleware/auth');

// Tüm satışları listele (admin)
router.get('/', auth.authenticateAdmin, (req, res) => {
  const { customer_id, status } = req.query;
  
  let query = `
    SELECT s.*, c.name as customer_name, c.email as customer_email, c.current_debt, c.credit_limit,
           (SELECT COUNT(*) FROM installments WHERE sale_id = s.id AND status = 'paid') as paid_installments,
           (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) as total_installments
    FROM sales s
    JOIN customers c ON s.customer_id = c.id
  `;
  
  let params = [];
  const conditions = [];

  if (customer_id) {
    conditions.push('s.customer_id = ?');
    params.push(customer_id);
  }

  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY s.created_at DESC';

  db.all(query, params, (err, sales) => {
    if (err) {
      return res.status(500).json({ error: 'Satışlar getirilemedi' });
    }
    res.json(sales);
  });
});

// Gelecek ödemeleri getir
router.get('/future-payments', auth.authenticateAdmin, async (req, res) => {
  console.log('🔍 [BACKEND] /future-payments endpoint çağrıldı');
  console.log('🔍 [BACKEND] Query parametreleri:', req.query);
  console.log('🔍 [BACKEND] Headers:', req.headers);
  
  try {
    const { startDate, endDate, status } = req.query;

    // Tarih kontrolü
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Başlangıç ve bitiş tarihi zorunludur'
      });
    }

    // Tarihleri doğrula
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz tarih formatı'
      });
    }

    // Temel sorgu
    let query = `
      SELECT 
        i.id as installment_id,
        i.amount,
        i.due_date,
        i.status,
        i.installment_number,
        i.paid_date,
        c.id as customer_id,
        c.name as customer_name,
        s.id as sale_id,
        s.total_amount,
        s.total_with_interest,
        CASE
          WHEN i.status = 'unpaid' AND date(i.due_date) < date('now') THEN 'overdue'
          ELSE i.status
        END as calculated_status
      FROM installments i
      JOIN sales s ON i.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      WHERE date(i.due_date) BETWEEN date(?) AND date(?)
      AND s.status = 'approved'
    `;

    const queryParams = [startDate, endDate];

    // Durum filtresi ekle
    if (status && status !== 'all') {
      if (status === 'overdue') {
        query += " AND i.status = 'unpaid' AND date(i.due_date) < date('now')";
      } else {
        query += " AND i.status = ?";
        queryParams.push(status);
      }
    }

    query += " ORDER BY i.due_date ASC";

    console.log('🔍 [LOG] future-payments sorgu:', query);
    console.log('🔍 [LOG] queryParams:', queryParams);

    const payments = await new Promise((resolve, reject) => {
      db.all(query, queryParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log('🔍 [LOG] future-payments dönen taksitler:', payments);

    // Toplamları hesapla
    const totals = payments.reduce((acc, payment) => {
      const amount = parseFloat(payment.amount) || 0;
      if (payment.status === 'paid') {
        acc.paid += amount;
      } else if (payment.calculated_status === 'overdue') {
        acc.overdue += amount;
      } else {
        acc.unpaid += amount;
      }
      return acc;
    }, { paid: 0, unpaid: 0, overdue: 0 });

    res.json({
      success: true,
      payments,
      totals
    });
  } catch (error) {
    console.error('Gelecek ödemeler hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Beklenmeyen bir hata oluştu' 
    });
  }
});

// Yaklaşan taksitleri getir (admin dashboard)
router.get('/installments/upcoming', auth.authenticateAdmin, (req, res) => {
  const { days = 5 } = req.query;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + parseInt(days));
  const endDateStr = endDate.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const query = `
    SELECT i.*, c.name as customer_name, c.phone as customer_phone, s.id as sale_id
    FROM installments i
    JOIN sales s ON i.sale_id = s.id
    JOIN customers c ON s.customer_id = c.id
    WHERE i.due_date BETWEEN ? AND ?
    AND i.status = 'unpaid'
    AND s.status = 'approved'
    ORDER BY i.due_date ASC
  `;

  db.all(query, [todayStr, endDateStr], (err, installments) => {
    if (err) {
      return res.status(500).json({ error: 'Yaklaşan taksitler getirilemedi' });
    }
    res.json(installments);
  });
});

// Satış detayı ve taksitlerini getir (admin)
router.get('/:id', auth.authenticateAdmin, (req, res) => {
  const saleId = req.params.id;

  // Satış bilgisini getir
  const saleQuery = `
    SELECT 
      s.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      (SELECT COUNT(*) FROM installments WHERE sale_id = s.id AND status = 'paid') as paid_installments,
      (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) as total_installments
    FROM sales s
    JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ?
  `;

  db.get(saleQuery, [saleId], (err, sale) => {
    if (err) {
      console.error('Satış getirme hatası:', err);
      return res.status(500).json({ error: 'Satış getirilemedi' });
    }

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    // Taksitleri getir
    const installmentsQuery = `
      SELECT i.*
      FROM installments i
      WHERE i.sale_id = ?
      ORDER BY i.installment_number
    `;

    db.all(installmentsQuery, [saleId], (err, installments) => {
      if (err) {
        console.error('Taksit getirme hatası:', err);
        return res.status(500).json({ error: 'Taksitler getirilemedi' });
      }

      // Her bir taksit için gecikme durumunu hesapla
      const today = new Date();
      const processedInstallments = installments.map(installment => {
        const dueDate = new Date(installment.due_date);
        const diffTime = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        
        return {
          ...installment,
          late_days: installment.status === 'unpaid' && diffTime > 0 ? diffTime : 0
        };
      });

      res.json({
        ...sale,
        installments: processedInstallments
      });
    });
  });
});

// Yeni taksitli satış oluştur (admin)
router.post('/', auth.authenticateAdmin, [
  body('customer_id').isInt({ min: 1 }).withMessage('Geçerli müşteri seçin'),
  body('total_amount').isFloat({ min: 0.01 }).withMessage('Tutar pozitif olmalı'),
  body('installment_count').isIn([1, 2, 3, 4, 5]).withMessage('Taksit sayısı 1-5 arasında olmalı')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ 
      error: 'Geçersiz veri',
      details: errors.array()
    });
  }

  const { customer_id, total_amount, installment_count } = req.body;

  try {
    // Müşteriyi kontrol et
    const customer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE id = ? AND status = "active"', [customer_id], (err, customer) => {
        if (err) reject(err);
        else resolve(customer);
      });
    });

    if (!customer) {
      console.log('Customer not found for ID:', customer_id);
      return res.status(404).json({ error: 'Aktif müşteri bulunamadı' });
    }

    console.log('Customer found:', {
      id: customer.id,
      name: customer.name,
      credit_limit: customer.credit_limit,
      current_debt: customer.current_debt,
      credit_limit_type: typeof customer.credit_limit,
      current_debt_type: typeof customer.current_debt
    });

    // Veri tiplerini düzelt ve kredi limitini kontrol et
    const currentDebt = parseFloat(customer.current_debt || 0);
    const creditLimit = parseFloat(customer.credit_limit || 0);
    const requestedAmount = parseFloat(total_amount);
    
    console.log('Credit limit check:', {
      customer_id,
      customer_name: customer.name,
      currentDebt,
      creditLimit,
      requestedAmount,
      availableLimit: creditLimit - currentDebt,
      hasEnoughLimit: requestedAmount <= (creditLimit - currentDebt)
    });

    if (requestedAmount > (creditLimit - currentDebt)) {
      const availableLimit = creditLimit - currentDebt;
      console.log('Insufficient credit limit:', {
        requested: requestedAmount,
        available: availableLimit
      });
      return res.status(400).json({ 
        error: `Kredi limiti yetersiz! Kullanılabilir limit: ${availableLimit.toLocaleString('tr-TR')}₺` 
      });
    }

    // Faiz oranını belirle
    const interestRates = {
      1: 0,  // Faizsiz
      2: 5,  // %5 faiz
      3: 5,  // %5 faiz
      4: 10, // %10 faiz
      5: 10  // %10 faiz
    };
    const interestRate = interestRates[installment_count] || 0;

    // Hesaplamalar
    const totalWithInterest = total_amount * (1 + interestRate / 100);
    const installmentAmount = totalWithInterest / installment_count;
    const firstPaymentDate = new Date();
    firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

    // Satışı kaydet - direkt onaylı olarak
    const saleId = await new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sales (customer_id, total_amount, installment_count, interest_rate, 
                          total_with_interest, installment_amount, first_payment_date, status, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
      `;

      db.run(query, [
        customer_id, total_amount, installment_count, interestRate,
        totalWithInterest, installmentAmount, firstPaymentDate.toISOString().split('T')[0]
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Taksitleri oluştur
    for (let i = 1; i <= installment_count; i++) {
      const dueDate = new Date(firstPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO installments (sale_id, installment_number, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
          [saleId, i, installmentAmount, dueDate.toISOString().split('T')[0], 'unpaid'],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Müşteri borcunu güncelle
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE customers SET current_debt = current_debt + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [totalWithInterest, customer_id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Bilgilendirme maili gönder
    if (customer.email) {
      try {
        console.log('📧 Satış onay maili gönderiliyor:', {
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email
          },
          sale: {
            id: saleId,
            total_amount,
            total_with_interest: totalWithInterest
          }
        });

        // Taksitleri getir
        const installments = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM installments WHERE sale_id = ? ORDER BY installment_number', [saleId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        await emailService.sendSaleConfirmationEmail(
          { id: saleId, total_amount, total_with_interest: totalWithInterest },
          customer,
          installments
        );

        console.log('✅ Satış onay maili gönderildi');
      } catch (mailError) {
        console.error('❌ Satış onay maili gönderilemedi:', mailError);
      }
    }

    res.status(201).json({
      id: saleId,
      message: 'Taksitli satış başarıyla oluşturuldu',
      total_with_interest: totalWithInterest,
      installment_amount: installmentAmount,
      first_payment_date: firstPaymentDate
    });

  } catch (error) {
    console.error('Satış oluşturma hatası:', error);
    res.status(500).json({ error: 'Satış oluşturulamadı' });
  }
});

// Satışı onayla
router.post('/approve/:token', (req, res) => {
  const approvalToken = req.params.token;

  db.get('SELECT * FROM sales WHERE approval_token = ? AND status = "pending_approval"', [approvalToken], (err, sale) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }

    if (!sale) {
      return res.status(404).json({ error: 'Geçersiz onay kodu veya satış zaten onaylanmış' });
    }

    db.run(
      'UPDATE sales SET status = "approved", approved_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sale.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Onay işlemi başarısız' });
        }

        res.json({ 
          message: 'Satış başarıyla onaylandı. Taksit sistemi devreye girdi.',
          sale_id: sale.id
        });
      }
    );
  });
});

// Taksit ödemesi kaydet
router.post('/:saleId/installments/:installmentId/pay', auth.authenticateAdmin, async (req, res) => {
  const { saleId, installmentId } = req.params;
  const { payment_date } = req.body;

  console.log('Ödeme isteği:', { saleId, installmentId, payment_date });

  // Ödeme tarihi kontrolü
  if (!payment_date) {
    return res.status(400).json({ error: 'Ödeme tarihi zorunludur' });
  }

  try {
    // Önce satışı kontrol et
    const sale = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.*, c.id as customer_id, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `, [saleId], (err, row) => {
        if (err) {
          console.error('Satış sorgulama hatası:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    // Taksiti kontrol et
    const installment = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM installments WHERE id = ? AND sale_id = ?', [installmentId, saleId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!installment) {
      return res.status(404).json({ error: 'Taksit bulunamadı' });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({ error: 'Bu taksit zaten ödenmiş' });
    }

    // Taksiti ödenmiş olarak işaretle
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE installments SET status = ?, paid_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['paid', payment_date, installmentId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Müşterinin borcunu güncelle
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE customers SET current_debt = current_debt - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [installment.amount, sale.customer_id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Limit artışı kontrolü
    console.log('🔄 Limit artışı kontrolü başlatılıyor...');
    await checkForLimitIncrease(sale.customer_id);

    // Taksit ödeme onay maili gönder
    try {
      const remainingAmount = await new Promise((resolve, reject) => {
        db.get('SELECT SUM(amount) as total FROM installments WHERE sale_id = ? AND status = "unpaid"', [saleId], (err, row) => {
          if (err) reject(err);
          else resolve(row.total || 0);
        });
      });
      await emailService.sendInstallmentPaymentEmail(
        sale,
        { id: sale.customer_id, name: sale.customer_name, email: sale.customer_email },
        { installment_number: installment.installment_number, amount: installment.amount, paid_date: payment_date },
        remainingAmount
      );
      console.log('✅ Taksit ödeme onay maili gönderildi');
    } catch (mailErr) {
      console.error('❌ Taksit ödeme onay maili gönderilemedi:', mailErr);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Ödeme kaydetme hatası:', error);
    res.status(500).json({ error: 'Ödeme kaydedilirken bir hata oluştu' });
  }
});

// Düzenli ödeme kontrolü ve limit artırımı
async function checkForLimitIncrease(customerId) {
  try {
    console.log('🔍 Limit artırım kontrolü başlıyor - Müşteri ID:', customerId);
    
    // Müşterinin mevcut limitini al
    const customer = await new Promise((resolve, reject) => {
      db.get('SELECT credit_limit FROM customers WHERE id = ?', [customerId], (err, row) => {
        if (err) {
          console.error('❌ Müşteri limiti alınamadı:', err);
          reject(err);
        } else {
          console.log('✅ Mevcut müşteri limiti:', row);
          resolve(row);
        }
      });
    });

    if (customer) {
      // Maksimum limiti ayarlardan al
      const maxLimitSetting = await new Promise((resolve, reject) => {
        db.get('SELECT value FROM settings WHERE key = ?', ['max_credit_limit'], (err, row) => {
          if (err) {
            console.error('❌ Maksimum limit ayarı alınamadı:', err);
            reject(err);
          } else {
            console.log('✅ Maksimum limit ayarı:', row);
            resolve(row);
          }
        });
      });

      const maxLimit = (maxLimitSetting && !isNaN(parseFloat(maxLimitSetting.value))) ? parseFloat(maxLimitSetting.value) : 10000;
      const currentLimit = parseFloat(customer.credit_limit);
      
      // Eğer mevcut limit maksimum limitten küçükse artır
      if (currentLimit < maxLimit) {
        // %10 artış hesapla
        let newLimit = Math.round(currentLimit * 1.10);
        
        // Yeni limit maksimum limiti geçmesin
        newLimit = Math.min(newLimit, maxLimit);
        
        console.log('💰 Yeni limit hesaplandı:', {
          customer_id: customerId,
          old_limit: currentLimit,
          increase_rate: 10,
          new_limit: newLimit,
          max_limit: maxLimit
        });
        
        // Yeni limiti kaydet
        await new Promise((resolve, reject) => {
          const updateQuery = 'UPDATE customers SET credit_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          const params = [newLimit, customerId];
          
          console.log('📝 Limit güncelleme sorgusu çalıştırılıyor...');
          
          db.run(updateQuery, params, function(err) {
            if (err) {
              console.error('❌ Limit güncelleme hatası:', err);
              reject(err);
            } else {
              console.log('✅ Limit güncellendi. Etkilenen satır:', this.changes);
              resolve();
            }
          });
        });

        console.log(`✨ Müşteri ${customerId} limit artışı tamamlandı: ${currentLimit} -> ${newLimit}`);
      } else {
        console.log('ℹ️ Limit zaten maksimum değerde:', currentLimit);
      }
    } else {
      console.warn('⚠️ Müşteri bulunamadı:', customerId);
    }
  } catch (error) {
    console.error('❌ Limit artırım kontrolü hatası:', error);
  }
}

// Satış silme
router.delete('/:id', auth.authenticateAdmin, async (req, res) => {
  const saleId = req.params.id;

  try {
    // Önce satış ve müşteri bilgilerini al
    const sale = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.*, c.credit_limit, c.current_debt,
               (SELECT SUM(amount) FROM installments WHERE sale_id = s.id AND status = 'paid') as total_paid_amount
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `, [saleId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    // Müşterinin borcunu güncelle (sadece ödenmemiş tutarı çıkar)
    const unpaidAmount = sale.total_with_interest - (sale.total_paid_amount || 0);
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE customers SET current_debt = current_debt - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [unpaidAmount, sale.customer_id],
        (err) => {
          if (err) {
            console.error('Müşteri borç güncelleme hatası:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    // Önce taksitleri sil
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM installments WHERE sale_id = ?', [saleId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Sonra satışı sil
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM sales WHERE id = ?', [saleId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true, message: 'Satış başarıyla silindi' });
  } catch (error) {
    console.error('Satış silinirken hata:', error);
    res.status(500).json({ error: 'Satış silinirken bir hata oluştu' });
  }
});

// Gecikme faizi ödemesi yap
router.post('/installments/:id/pay-late-fee', auth.authenticateAdmin, async (req, res) => {
  const installmentId = req.params.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Geçerli bir ödeme tutarı girin' });
  }

  try {
    // Gecikme faizi kaydını kontrol et
    const lateFee = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM late_payment_fees WHERE installment_id = ?', [installmentId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!lateFee) {
      return res.status(404).json({ error: 'Gecikme faizi bulunamadı' });
    }

    // Ödeme tutarını kontrol et
    const remainingAmount = lateFee.interest_amount - lateFee.paid_amount;
    if (amount > remainingAmount) {
      return res.status(400).json({ error: 'Ödeme tutarı kalan tutardan büyük olamaz' });
    }

    // Ödemeyi kaydet
    const newPaidAmount = lateFee.paid_amount + amount;
    const newStatus = newPaidAmount >= lateFee.interest_amount ? 'paid' : 'partially_paid';

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE late_payment_fees SET paid_amount = ?, status = ? WHERE id = ?',
        [newPaidAmount, newStatus, lateFee.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ message: 'Gecikme faizi ödemesi başarıyla kaydedildi' });
  } catch (error) {
    console.error('Gecikme faizi ödeme hatası:', error);
    res.status(500).json({ error: 'Gecikme faizi ödemesi kaydedilemedi' });
  }
});

router.post('/:id/approve', auth.authenticateAdmin, async (req, res) => {
  const saleId = req.params.id;

  try {
    // Satışı getir
    const sale = await new Promise((resolve, reject) => {
      db.get(`
        SELECT s.*, c.name as customer_name, c.email as customer_email
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `, [saleId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    // Taksitleri getir
    const installments = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM installments WHERE sale_id = ? ORDER BY installment_number`, [saleId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Satışı onayla
    await new Promise((resolve, reject) => {
      db.run(`UPDATE sales SET status = 'approved', approved_at = datetime('now') WHERE id = ?`, [saleId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    // Onay mailini gönder
    const customer = {
      id: sale.customer_id,
      name: sale.customer_name,
      email: sale.customer_email
    };

    // Satış onaylandıktan sonra bilgilendirme maili gönder
    try {
      console.log('📧 Satış onay maili gönderiliyor:', {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email
        },
        sale: {
          id: sale.id,
          total_amount: sale.total_amount,
          total_with_interest: sale.total_with_interest
        }
      });

      await emailService.sendEmail(
        customer.email,
        'sale_confirmation',
        {
          CUSTOMER_NAME: customer.name,
          SALE_ID: sale.id,
          TOTAL_AMOUNT: sale.total_amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          TOTAL_WITH_INTEREST: sale.total_with_interest.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          INSTALLMENT_COUNT: installments.length,
          INSTALLMENT_TABLE: installments.map(inst => `
            <tr>
              <td style="padding:8px;border:1px solid #ddd;text-align:center">${inst.installment_number}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right">${inst.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>
          `).join(''),
          COMPANY_NAME: '3 Kare Yazılım ve Tasarım Ajansı Limited Şirketi',
          IBAN: 'TR48 0011 1000 0000 0137 1441 61',
          WHATSAPP: '0536 832 46 60'
        }
      );
      console.log('✅ Satış bilgilendirme maili gönderildi');
    } catch (error) {
      console.error('❌ Bilgilendirme maili gönderilemedi:', error);
    }

    res.json({ success: true, message: 'Satış onaylandı ve mail gönderildi' });
  } catch (error) {
    console.error('Satış onaylama hatası:', error);
    res.status(500).json({ error: 'Satış onaylanırken bir hata oluştu' });
  }
});

module.exports = router; 