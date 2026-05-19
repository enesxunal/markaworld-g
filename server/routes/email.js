const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const emailService = require('../services/emailService');
const { authenticateAdmin } = require('../middleware/auth');

// Test mail gönder (admin)
router.post('/test', authenticateAdmin, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email gerekli' });
  }

  try {
    console.log('📧 Test mail gönderiliyor:', email);
    
    // Test maili gönder
    await emailService.sendMail(
      email,
      'Test Email — Marka World',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000000; margin: 0;">Marka World</h1>
              <p style="color: #666666; margin: 10px 0 0 0;">Test Email</p>
            </div>
            
            <p style="color: #333333; line-height: 1.6;">
              Bu bir test emailidir. Email sistemi çalışıyor.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <ul style="color: #333333; line-height: 1.6;">
                <li>Email: ${email}</li>
                <li>Tarih: ${new Date().toLocaleString('tr-TR')}</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #666666; font-size: 12px; text-align: center; margin: 0;">
              Marka World - Müşteri Hizmetleri<br>
              Bu mail otomatik olarak gönderilmiştir.
            </p>
          </div>
        </div>
      `
    );

    res.json({
      message: 'Test mail gönderildi'
    });
  } catch (error) {
    console.error('❌ Test mail hatası:', error);
    res.status(500).json({ 
      message: 'Mail gönderilemedi',
      error: error.message 
    });
  }
});

// Kampanya listesinden çık
router.post('/unsubscribe', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, message: 'E-posta gerekli' });
  }

  db.run(
    'UPDATE customers SET marketing_unsubscribed = 1, updated_at = CURRENT_TIMESTAMP WHERE lower(email) = ?',
    [email],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'İşlem başarısız' });
      }
      const customerUpdates = this.changes;
      db.run(
        `UPDATE newsletter_subscribers SET status = 'inactive', unsubscribed_at = CURRENT_TIMESTAMP WHERE lower(email) = ?`,
        [email],
        function () {
          res.json({
            success: true,
            message: 'Kampanya e-postalarından çıkarıldınız',
            updated: customerUpdates + this.changes
          });
        }
      );
    }
  );
});

// Mail listesine kayıt
router.post('/subscribe', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email gerekli' });
  }

  db.run(
    'CREATE TABLE IF NOT EXISTS emails (email TEXT PRIMARY KEY)',
    (err) => {
      if (err) {
        console.error('Tablo oluşturma hatası:', err);
        return res.status(500).json({ message: 'Sistem hatası' });
      }

      db.run(
        'INSERT OR REPLACE INTO emails (email) VALUES (?)',
        [email],
        (err) => {
          if (err) {
            console.error('Kayıt hatası:', err);
            return res.status(500).json({ message: 'Kayıt başarısız' });
          }
          res.json({ message: 'Kaydedildi' });
        }
      );
    }
  );
});

// Mail listesini getir (admin)
router.get('/list', authenticateAdmin, (req, res) => {
  db.all('SELECT email FROM emails', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Liste alınamadı' });
    }
    res.json(rows);
  });
});

// Mail şablonlarını kontrol et (admin)
router.get('/templates', authenticateAdmin, async (req, res) => {
  try {
    const templates = await new Promise((resolve, reject) => {
      db.all('SELECT name, subject FROM email_templates', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      templates: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('❌ Şablon kontrol hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Şablonlar kontrol edilemedi'
    });
  }
});

// customer_registration şablonunu ekle (admin)
router.post('/add-customer-registration-template', authenticateAdmin, async (req, res) => {
  try {
    const template = {
      name: 'customer_registration',
      subject: "Marka World'e Hoşgeldiniz!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
          <h2 style="color: #222;">Merhaba {{CUSTOMER_NAME}},</h2>
          <p>Marka World'e hoşgeldiniz!</p>
          <p>Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayınız:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{VERIFICATION_URL}}" style="background: #111; color: #fff; padding: 14px 32px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">E-posta Adresimi Doğrula</a>
          </div>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; color: #444;">Eğer butona tıklayamazsanız, aşağıdaki bağlantıyı kopyalayıp tarayıcınızda açabilirsiniz:</p>
            <p style="word-break: break-all; color: #007bff; margin: 8px 0 0 0;">{{VERIFICATION_URL}}</p>
          </div>
          <p style="color: #666; margin-top: 32px;">Saygılarımızla,<br>Marka Dünyası</p>
        </div>
      `
    };

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO email_templates (name, subject, html) VALUES (?, ?, ?)',
        [template.name, template.subject, template.html],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      success: true,
      message: 'customer_registration şablonu eklendi (güncellendi)'
    });
  } catch (error) {
    console.error('❌ Şablon ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Şablon eklenemedi'
    });
  }
});

// Eksik mail şablonlarını ekle (admin)
router.post('/add-missing-templates', authenticateAdmin, async (req, res) => {
  try {
    const templates = [
      {
        name: 'customer_registration',
        subject: "Marka World'e Hoşgeldiniz!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #222;">Merhaba {{CUSTOMER_NAME}},</h2>
            <p>Marka World'e hoşgeldiniz!</p>
            <p>Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayınız:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{VERIFICATION_LINK}}" style="background: #111; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 500;">E-posta Adresimi Doğrula</a>
            </div>
            <p>Eğer butona tıklayamazsanız, aşağıdaki bağlantıyı kopyalayıp tarayıcınızda açabilirsiniz:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">{{VERIFICATION_LINK}}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
          </div>
        `
      },
      {
        name: 'installment_payment',
        subject: 'Taksit Ödemeniz Alınmıştır',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #222;">Merhaba {{CUSTOMER_NAME}},</h2>
            <p>Taksit ödemeniz başarıyla alınmıştır.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Ödeme Detayları:</h3>
              <p><strong>Taksit No:</strong> {{INSTALLMENT_NUMBER}}</p>
              <p><strong>Ödeme Tutarı:</strong> {{PAYMENT_AMOUNT}}</p>
              <p><strong>Ödeme Tarihi:</strong> {{PAYMENT_DATE}}</p>
              <p><strong>Kalan Borç:</strong> {{REMAINING_AMOUNT}}</p>
            </div>
            <p>Teşekkür ederiz.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
          </div>
        `
      },
      {
        name: 'sale_confirmation',
        subject: 'Satış Onaylandı',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #222;">Merhaba {{CUSTOMER_NAME}},</h2>
            <p>Satışınız başarıyla onaylanmıştır.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Satış Detayları:</h3>
              <p><strong>Toplam Tutar:</strong> {{TOTAL_AMOUNT}}</p>
              <p><strong>Taksit Sayısı:</strong> {{INSTALLMENT_COUNT}}</p>
              <p><strong>İlk Taksit Tarihi:</strong> {{FIRST_INSTALLMENT_DATE}}</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{CUSTOMER_PORTAL_LINK}}" style="background: #111; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 500;">Müşteri Paneline Git</a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
          </div>
        `
      },
      {
        name: 'bulk_email',
        subject: '{{SUBJECT}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #222;">{{TITLE}}</h2>
            <div style="line-height: 1.6;">
              {{CONTENT}}
            </div>
            {{#if BUTTON_TEXT}}
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{BUTTON_LINK}}" style="background: #111; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 500;">{{BUTTON_TEXT}}</a>
            </div>
            {{/if}}
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
          </div>
        `
      }
    ];

    for (const template of templates) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO email_templates (name, subject, html, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))',
          [template.name, template.subject, template.html],
          function(err) {
            if (err) {
              console.error('❌ Şablon ekleme hatası:', err);
              reject(err);
            } else {
              console.log(`✅ ${template.name} şablonu eklendi`);
              resolve();
            }
          }
        );
      });
    }

    res.json({
      success: true,
      message: 'Tüm eksik mail şablonları başarıyla eklendi',
      templates: templates.map(t => t.name)
    });
  } catch (error) {
    console.error('❌ Şablon ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Şablonlar eklenirken hata oluştu'
    });
  }
});

module.exports = router; 