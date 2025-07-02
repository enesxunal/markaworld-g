const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/database.sqlite');
const db = new sqlite3.Database(dbPath);

const templates = [
  {
    name: 'welcome',
    subject: "Marka World'e Hoş Geldiniz",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
        <h2 style="color: #222;">Merhaba {{CUSTOMER_NAME}},</h2>
        <p>Marka World'e hoşgeldiniz!</p>
        <p>Hesabınız başarıyla oluşturuldu.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
      </div>
    `
  },
  {
    name: 'password_reset',
    subject: 'Şifre Sıfırlama Talebi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
        <h2 style="color: #222;">Şifre Sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{RESET_LINK}}" style="background: #111; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 500;">Şifremi Sıfırla</a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
      </div>
    `
  },
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
  },
  {
    name: 'payment_reminder',
    subject: 'Ödeme Hatırlatma',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
        <h2 style="color: #222;">Ödeme Hatırlatması</h2>
        <p>Merhaba {{CUSTOMER_NAME}},</p>
        <p>Taksit ödemenizin vadesi yaklaşmaktadır.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Ödeme Detayları:</h3>
          <p><strong>Taksit No:</strong> {{INSTALLMENT_NUMBER}}</p>
          <p><strong>Ödeme Tutarı:</strong> {{PAYMENT_AMOUNT}}</p>
          <p><strong>Vade Tarihi:</strong> {{DUE_DATE}}</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
      </div>
    `
  },
  {
    name: 'payment_late',
    subject: 'Geciken Ödeme Bildirimi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafbfc; border-radius: 8px; border: 1px solid #eee;">
        <h2 style="color: #222;">Geciken Ödeme Bildirimi</h2>
        <p>Merhaba {{CUSTOMER_NAME}},</p>
        <p>Taksit ödemeniz vadesinde ödenmemiştir.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Geciken Ödeme Detayları:</h3>
          <p><strong>Taksit No:</strong> {{INSTALLMENT_NUMBER}}</p>
          <p><strong>Ödeme Tutarı:</strong> {{PAYMENT_AMOUNT}}</p>
          <p><strong>Vade Tarihi:</strong> {{DUE_DATE}}</p>
          <p><strong>Gecikme Günü:</strong> {{LATE_DAYS}}</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Saygılarımızla,<br>Marka Dünyası</p>
      </div>
    `
  }
];

async function addTemplates() {
  console.log('📧 Tüm mail şablonları ekleniyor...');
  
  for (const template of templates) {
    try {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO email_templates (name, subject, html, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))',
          [template.name, template.subject, template.html],
          function(err) {
            if (err) {
              console.error(`❌ ${template.name} şablonu eklenirken hata:`, err);
              reject(err);
            } else {
              console.log(`✅ ${template.name} şablonu eklendi`);
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(`❌ ${template.name} şablonu eklenemedi:`, error);
    }
  }
  
  console.log('🎉 Tüm şablonlar eklendi!');
  db.close();
}

addTemplates(); 