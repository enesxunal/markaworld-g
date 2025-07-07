const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Veritabanı bağlantısı
const dbPath = path.join(__dirname, '../database/database.sqlite');
const db = new sqlite3.Database(dbPath);

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Google OAuth2 ile Gmail API üzerinden mail gönderimi
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: oAuth2Client.getAccessToken()
      }
    });
    console.log('Gmail OAuth2 ile mail gönderimi yapılandırıldı.');
  }

  async sendMail(options) {
    try {
      let info = await this.transporter.sendMail(options);
      console.log('Mail gönderildi:', info.messageId);
      return info;
    } catch (err) {
      console.error('Mail gönderme hatası:', err);
      throw err;
    }
  }

  getTemplate(templateName) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM email_templates WHERE name = ?`;
      db.get(query, [templateName], (err, template) => {
        if (err) {
          console.error('❌ Mail şablonu yükleme hatası:', err);
          reject(err);
        } else if (!template) {
          console.error('❌ Mail şablonu bulunamadı:', templateName);
          reject(new Error(`Mail şablonu bulunamadı: ${templateName}`));
        } else {
          console.log('✅ Mail şablonu yüklendi:', template);
          resolve(template);
        }
      });
    });
  }

  async logEmail(to, templateName, success, error = null) {
    try {
      const query = `INSERT INTO email_logs (to_address, template_name, success, error, created_at) 
                     VALUES (?, ?, ?, ?, datetime('now'))`;
      await new Promise((resolve, reject) => {
        db.run(query, [to, templateName, success ? 1 : 0, error], function(err) {
          if (err) {
            console.error('❌ Email log kaydı hatası:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (err) {
      console.error('❌ Email log kaydı hatası:', err);
    }
  }

  async sendEmail(to, templateName, variables) {
    try {
      console.log('📧 Mail gönderme başladı:', {
        to,
        templateName,
        variables
      });

      // Mail şablonunu yükle
      console.log('📧 Mail şablonu yükleniyor:', templateName, variables);
      const template = await this.getTemplate(templateName);

      if (!template || !template.subject || !template.html) {
        throw new Error('Mail şablonu eksik veya hatalı');
      }

      // Şablondaki değişkenleri değiştir
      let subject = template.subject;
      let html = template.html;

      // Değişkenleri yerleştir
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, variables[key]);
        html = html.replace(regex, variables[key]);
      });

      // Maili gönder
      const mailOptions = {
        from: 'info@markaworld.com.tr',
        to,
        subject,
        html
      };

      await this.sendMail(mailOptions);
      await this.logEmail(to, templateName, true);
      console.log('✅ Email başarıyla gönderildi:', to);
    } catch (error) {
      console.error('❌ Mail gönderme hatası:', error);
      await this.logEmail(to, templateName, false, error.message);
      throw error;
    }
  }

  async sendCustomerRegistrationEmail(customer, verificationToken) {
    console.log('📧 Müşteri kayıt onay maili gönderiliyor:', {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      verificationToken
    });

    const variables = {
      CUSTOMER_ID: customer.id,
      CUSTOMER_NAME: customer.name,
      VERIFICATION_URL: `https://markaworld.com.tr/api/customers/verify-email/${verificationToken}`,
      COMPANY_NAME: 'Marka World'
    };

    await this.sendEmail(customer.email, 'customer_registration', variables);
  }

  async sendSaleConfirmationEmail(sale, customer, installments) {
    console.log('📧 Satış onay maili gönderiliyor:', {
      sale: {
        id: sale.id,
        total_amount: sale.total_amount,
        total_with_interest: sale.total_with_interest
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      }
    });

    // Taksit tablosunu oluştur
    let installmentTable = '';
    installments.forEach(inst => {
      installmentTable += `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${inst.installment_number}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${inst.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
        </tr>
      `;
    });

    // Ayarları getir
    const settings = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM settings WHERE key IN (?, ?, ?)', ['company_name', 'company_iban', 'company_whatsapp'], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const settingsMap = {};
          rows.forEach(row => {
            settingsMap[row.key] = row.value;
          });
          resolve(settingsMap);
        }
      });
    });

    const variables = {
      CUSTOMER_NAME: customer.name,
      TOTAL_AMOUNT: sale.total_amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      INSTALLMENT_COUNT: installments.length,
      FIRST_INSTALLMENT_DATE: new Date(installments[0].due_date).toLocaleDateString('tr-TR'),
      CUSTOMER_PORTAL_LINK: 'http://localhost:3000/customer/login',
      COMPANY_NAME: settings.company_name || 'Marka World'
    };

    await this.sendEmail(customer.email, 'sale_confirmation', variables);
  }

  async sendInstallmentPaymentEmail(sale, customer, installment, remainingAmount) {
    console.log('📧 Taksit ödeme maili gönderiliyor:', {
      sale: {
        id: sale.id,
        total_amount: sale.total_amount
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      installment: {
        number: installment.installment_number,
        amount: installment.amount,
        paid_date: installment.paid_date
      }
    });

    const variables = {
      CUSTOMER_NAME: customer.name,
      INSTALLMENT_NUMBER: installment.installment_number,
      PAYMENT_AMOUNT: installment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      PAYMENT_DATE: new Date(installment.paid_date).toLocaleDateString('tr-TR'),
      REMAINING_AMOUNT: remainingAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    };

    await this.sendEmail(customer.email, 'installment_payment', variables);
  }

  async sendSaleInfoEmail(customer, sale, installments) {
    const template = await this.getTemplate('sale_confirmation');
    if (!template) {
      console.error('Satış onay mail şablonu bulunamadı');
      return;
    }

    const installmentRows = installments.map(inst => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${inst.installment_number}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(inst.due_date)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${this.formatCurrency(inst.amount)}</td>
      </tr>
    `).join('');

    const variables = {
      CUSTOMER_NAME: customer.name,
      SALE_ID: sale.id,
      TOTAL_AMOUNT: this.formatCurrency(sale.total_amount),
      TOTAL_WITH_INTEREST: this.formatCurrency(sale.total_with_interest),
      INSTALLMENT_COUNT: sale.installment_count,
      INSTALLMENT_TABLE: installmentRows,
      COMPANY_NAME: 'Marka World',
      IBAN: 'TR48 0011 1000 0000 0137 1441 61',
      WHATSAPP: '0536 832 46 60'
    };

    await this.sendEmail(customer.email, 'sale_confirmation', variables);
  }

  async sendBulkEmail(recipients, subject, messageContent) {
    console.log('📧 Toplu mail gönderiliyor:', {
      recipientCount: recipients.length,
      subject,
      messageContent: messageContent.substring(0, 100) + '...'
    });

    let totalSent = 0;
    let totalFailed = 0;
    const failedEmails = [];

    for (const email of recipients) {
      try {
        const variables = {
          SUBJECT: subject,
          TITLE: subject,
          CONTENT: messageContent,
          BUTTON_TEXT: '',
          BUTTON_LINK: ''
        };

        await this.sendEmail(email, 'bulk_email', variables);
        totalSent++;
        console.log(`✅ Mail gönderildi: ${email}`);
      } catch (error) {
        console.error(`❌ Mail gönderilemedi: ${email}`, error);
        totalFailed++;
        failedEmails.push(email);
      }
    }

    return {
      totalSent,
      totalFailed,
      failedEmails
    };
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('tr-TR');
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY' 
    }).format(amount);
  }
}

// Satış onay maili şablonundan satış numarasını kaldırmak için script
if (require.main === module && process.argv[2] === 'remove-sale-id-from-mail') {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, '../database/database.sqlite');
  const db = new sqlite3.Database(dbPath);
  db.get("SELECT html FROM email_templates WHERE name = 'sale_confirmation'", (err, row) => {
    if (err) {
      console.error('Şablon okunamadı:', err);
      process.exit(1);
    }
    if (!row) {
      console.error('sale_confirmation şablonu bulunamadı!');
      process.exit(1);
    }
    // Satış numarasını içeren satırı sil
    let html = row.html.replace(/<[^>]*>.*\{\{SALE_ID\}\}.*<\/[^>]*>\s*/g, '');
    html = html.replace(/Satış Numarası:.*\{\{SALE_ID\}\}.*<br\/?>(\s*)?/g, '');
    db.run("UPDATE email_templates SET html = ? WHERE name = 'sale_confirmation'", [html], (err2) => {
      if (err2) {
        console.error('Şablon güncellenemedi:', err2);
        process.exit(1);
      }
      console.log('Satış onay mailinden satış numarası kaldırıldı!');
      process.exit(0);
    });
  });
}

module.exports = new EmailService();

// Test maili göndermek için script
if (require.main === module && process.argv[2] === 'test-mail' && process.argv[3]) {
  (async () => {
    try {
      const email = process.argv[3];
      const emailService = require('./emailService');
      const result = await emailService.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'Test Email',
        html: '<h2>Marka World Test Mail</h2><p>Bu bir test mailidir.</p>'
      });
      console.log('✅ Test maili gönderildi:', result);
    } catch (err) {
      console.error('❌ Test maili gönderilemedi:', err);
    }
  })();
}