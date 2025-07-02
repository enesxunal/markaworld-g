const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
  console.log('✅ SQLite veritabanına bağlandı:', dbPath);
});

// Müşteri kayıtlarını sıfırla
const resetCustomers = () => {
  return new Promise((resolve, reject) => {
    console.log('🗑️ Müşteri kayıtları sıfırlanıyor...');
    
    db.run('DELETE FROM customers WHERE id > 3', (err) => {
      if (err) {
        console.error('❌ Müşteri kayıtları silinirken hata:', err);
        reject(err);
        return;
      }
      
      console.log('✅ Müşteri kayıtları sıfırlandı (ID > 3 olanlar silindi)');
      
      // ID'leri sıfırla
      db.run('DELETE FROM sqlite_sequence WHERE name = "customers"', (err) => {
        if (err) {
          console.error('❌ ID sıfırlama hatası:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Müşteri ID\'leri sıfırlandı');
        resolve();
      });
    });
  });
};

// Email şablonlarını güncelle
const updateEmailTemplates = () => {
  return new Promise((resolve, reject) => {
    console.log('📧 Email şablonları güncelleniyor...');
    
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
              <a href="{{VERIFICATION_URL}}" style="background: #111; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 500;">E-posta Adresimi Doğrula</a>
            </div>
            <p>Eğer butona tıklayamazsanız, aşağıdaki bağlantıyı kopyalayıp tarayıcınızda açabilirsiniz:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">{{VERIFICATION_URL}}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka World</p>
          </div>
        `
      },
      {
        name: 'welcome',
        subject: "Marka World'e Hoş Geldiniz",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #222;">Merhaba {{CUSTOMER_NAME}},</h2>
            <p>Marka World'e hoşgeldiniz!</p>
            <p>Hesabınız başarıyla oluşturuldu.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka World</p>
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
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka World</p>
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
            <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka World</p>
          </div>
        `
      }
    ];
    let completed = 0;
    templates.forEach(t => {
      db.run(
        'INSERT OR REPLACE INTO email_templates (name, subject, html, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [t.name, t.subject, t.html],
        (err) => {
          if (err) {
            console.error('❌ Email şablonu güncelleme hatası:', err);
            reject(err);
            return;
          }
          completed++;
          if (completed === templates.length) {
            console.log('✅ Tüm email şablonları güncellendi');
            resolve();
          }
        }
      );
    });
  });
};

// Tüm 'pending' taksitleri 'unpaid' yap
const fixPendingInstallments = () => {
  return new Promise((resolve, reject) => {
    db.run("UPDATE installments SET status = 'unpaid' WHERE status = 'pending'", (err) => {
      if (err) {
        console.error('❌ Taksit status güncelleme hatası:', err);
        reject(err);
      } else {
        console.log('✅ Tüm pending taksitler unpaid olarak güncellendi');
        resolve();
      }
    });
  });
};

// Ana işlem
const main = async () => {
  try {
    await resetCustomers();
    await updateEmailTemplates();
    await fixPendingInstallments();
    console.log('✅ Tüm işlemler tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

main(); 