const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const router = express.Router();

// Tüm satışları listele
router.get('/', (req, res) => {
  const { customer_id, status } = req.query;
  
  let query = `
    SELECT s.*, c.name as customer_name, c.email as customer_email,
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

// Satış detayı ve taksitlerini getir
router.get('/:id', (req, res) => {
  const saleId = req.params.id;

  // Satış bilgisini getir
  const saleQuery = `
    SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM sales s
    JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ?
  `;

  db.get(saleQuery, [saleId], (err, sale) => {
    if (err) {
      return res.status(500).json({ error: 'Satış getirilemedi' });
    }

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    // Taksitleri getir
    const installmentsQuery = `
      SELECT * FROM installments 
      WHERE sale_id = ? 
      ORDER BY installment_number
    `;

    db.all(installmentsQuery, [saleId], (err, installments) => {
      if (err) {
        return res.status(500).json({ error: 'Taksitler getirilemedi' });
      }

      res.json({
        ...sale,
        installments
      });
    });
  });
});

// Yeni taksitli satış oluştur
router.post('/', [
  body('customer_id').isInt({ min: 1 }).withMessage('Geçerli müşteri seçin'),
  body('total_amount').isFloat({ min: 0.01 }).withMessage('Tutar pozitif olmalı'),
  body('installment_count').isIn([3, 5]).withMessage('Taksit sayısı 3 veya 5 olmalı')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
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
      return res.status(404).json({ error: 'Aktif müşteri bulunamadı' });
    }

    // Kredi limitini kontrol et
    if (customer.current_debt + total_amount > customer.credit_limit) {
      return res.status(400).json({ 
        error: 'Kredi limiti yetersiz',
        current_debt: customer.current_debt,
        credit_limit: customer.credit_limit,
        requested_amount: total_amount
      });
    }

    // Faiz oranını al
    const interestRate = await new Promise((resolve, reject) => {
      db.get('SELECT value FROM settings WHERE key = ?', [`interest_rate_${installment_count}`], (err, setting) => {
        if (err) reject(err);
        else resolve(setting ? parseFloat(setting.value) : (installment_count === 3 ? 5 : 10));
      });
    });

    // Hesaplamalar
    const totalWithInterest = total_amount * (1 + interestRate / 100);
    const installmentAmount = totalWithInterest / installment_count;
    const firstPaymentDate = new Date();
    firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

    // Onay token'ı oluştur
    const approvalToken = crypto.randomBytes(32).toString('hex');

    // Satışı kaydet
    const saleId = await new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sales (customer_id, total_amount, installment_count, interest_rate, 
                          total_with_interest, installment_amount, first_payment_date, approval_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(query, [
        customer_id, total_amount, installment_count, interestRate,
        totalWithInterest, installmentAmount, firstPaymentDate.toISOString().split('T')[0], approvalToken
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
          'INSERT INTO installments (sale_id, installment_number, amount, due_date) VALUES (?, ?, ?, ?)',
          [saleId, i, installmentAmount, dueDate.toISOString().split('T')[0]],
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

    // Onay maili gönder
    if (customer.email) {
      try {
        const sale = {
          id: saleId,
          total_amount,
          installment_count,
          total_with_interest: totalWithInterest,
          installment_amount: installmentAmount,
          first_payment_date: firstPaymentDate,
          approval_token: approvalToken
        };

        await emailService.sendSaleApprovalEmail(customer, sale);
      } catch (emailError) {
        console.error('Onay maili gönderilemedi:', emailError);
      }
    }

    res.status(201).json({
      id: saleId,
      message: 'Taksitli satış başarıyla oluşturuldu',
      approval_token: approvalToken,
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
router.post('/:id/installments/:installment_id/pay', (req, res) => {
  const { id: saleId, installment_id } = req.params;
  const { payment_date } = req.body;

  // Taksiti kontrol et
  db.get(
    'SELECT i.*, s.customer_id FROM installments i JOIN sales s ON i.sale_id = s.id WHERE i.id = ? AND s.id = ?',
    [installment_id, saleId],
    (err, installment) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }

      if (!installment) {
        return res.status(404).json({ error: 'Taksit bulunamadı' });
      }

      if (installment.status === 'paid') {
        return res.status(400).json({ error: 'Bu taksit zaten ödenmiş' });
      }

      const paidDate = payment_date || new Date().toISOString();

      // Taksiti ödendi olarak işaretle
      db.run(
        'UPDATE installments SET status = "paid", paid_date = ? WHERE id = ?',
        [paidDate, installment_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Ödeme kaydedilemedi' });
          }

          // Müşteri borcunu azalt
          db.run(
            'UPDATE customers SET current_debt = current_debt - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [installment.amount, installment.customer_id],
            (err) => {
              if (err) {
                console.error('Müşteri borcu güncellenemedi:', err);
              }
            }
          );

          // Zamanında ödeme yapıldıysa limit artırımı kontrol et
          const dueDate = new Date(installment.due_date);
          const paymentDate = new Date(paidDate);
          
          if (paymentDate <= dueDate) {
            // Müşterinin tüm taksitlerini kontrol et - düzenli ödeme yapıyor mu?
            checkForLimitIncrease(installment.customer_id);
          }

          res.json({ 
            message: 'Ödeme başarıyla kaydedildi',
            installment_id,
            amount: installment.amount,
            paid_date: paidDate
          });
        }
      );
    }
  );
});

// Düzenli ödeme kontrolü ve limit artırımı
function checkForLimitIncrease(customerId) {
  // Son 3 ödemenin zamanında yapılıp yapılmadığını kontrol et
  const query = `
    SELECT COUNT(*) as on_time_count
    FROM installments i
    JOIN sales s ON i.sale_id = s.id
    WHERE s.customer_id = ? 
    AND i.status = 'paid'
    AND i.paid_date <= i.due_date
    ORDER BY i.paid_date DESC
    LIMIT 3
  `;

  db.get(query, [customerId], (err, result) => {
    if (err) {
      console.error('Limit artırım kontrolü hatası:', err);
      return;
    }

    // Son 3 ödeme zamanında yapıldıysa limit artır
    if (result.on_time_count >= 3) {
      db.get('SELECT value FROM settings WHERE key = ?', ['limit_increase_rate'], (err, setting) => {
        if (err) return;

        const increaseRate = setting ? parseFloat(setting.value) : 20;

        db.get('SELECT credit_limit FROM customers WHERE id = ?', [customerId], (err, customer) => {
          if (err) return;

          const newLimit = customer.credit_limit * (1 + increaseRate / 100);

          db.run(
            'UPDATE customers SET credit_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newLimit, customerId],
            (err) => {
              if (!err) {
                console.log(`Müşteri ${customerId} düzenli ödeme bonusu: ${customer.credit_limit} -> ${newLimit}`);
              }
            }
          );
        });
      });
    }
  });
}

// Satışı iptal et
router.delete('/:id', (req, res) => {
  const saleId = req.params.id;

  db.get('SELECT * FROM sales WHERE id = ?', [saleId], (err, sale) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    if (sale.status === 'approved') {
      return res.status(400).json({ error: 'Onaylanmış satış iptal edilemez' });
    }

    // Satışı iptal et
    db.run('UPDATE sales SET status = "cancelled" WHERE id = ?', [saleId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Satış iptal edilemedi' });
      }

      // Müşteri borcunu düzelt
      db.run(
        'UPDATE customers SET current_debt = current_debt - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [sale.total_with_interest, sale.customer_id],
        (err) => {
          if (err) {
            console.error('Müşteri borcu güncellenemedi:', err);
          }
        }
      );

      res.json({ message: 'Satış başarıyla iptal edildi' });
    });
  });
});

module.exports = router; 