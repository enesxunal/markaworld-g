const nodemailer = require('nodemailer');
const { db } = require('../database/init');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Mail şablonunu getir ve değişkenleri değiştir
  async getTemplate(templateName, variables = {}) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM email_templates WHERE name = ?', [templateName], (err, template) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!template) {
          reject(new Error(`Mail şablonu bulunamadı: ${templateName}`));
          return;
        }

        let subject = template.subject;
        let htmlContent = template.html_content;

        // Değişkenleri değiştir
        Object.keys(variables).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, variables[key]);
          htmlContent = htmlContent.replace(regex, variables[key]);
        });

        resolve({
          subject,
          html: htmlContent
        });
      });
    });
  }

  // Mail gönder
  async sendEmail(to, templateName, variables = {}) {
    try {
      const template = await this.getTemplate(templateName, variables);
      
      const mailOptions = {
        from: `"${process.env.COMPANY_NAME || 'Marka World'}" <${process.env.SMTP_USER}>`,
        to: to,
        subject: template.subject,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // Mail geçmişine kaydet
      this.logEmail(variables.CUSTOMER_ID, templateName, template.subject, 'sent');
      
      return result;
    } catch (error) {
      // Hata durumunda da kaydet
      this.logEmail(variables.CUSTOMER_ID, templateName, '', 'failed', error.message);
      throw error;
    }
  }

  // Mail geçmişini kaydet
  logEmail(customerId, templateName, subject, status, errorMessage = null) {
    db.run(
      'INSERT INTO email_logs (customer_id, template_name, subject, status, error_message) VALUES (?, ?, ?, ?, ?)',
      [customerId, templateName, subject, status, errorMessage]
    );
  }

  // Müşteri kayıt onay maili gönder
  async sendCustomerRegistrationEmail(customer, verificationToken) {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const variables = {
      CUSTOMER_ID: customer.id,
      CUSTOMER_NAME: customer.name,
      VERIFICATION_LINK: verificationLink,
      COMPANY_NAME: process.env.COMPANY_NAME || 'Marka World'
    };

    return this.sendEmail(customer.email, 'customer_registration', variables);
  }

  // Satış onay maili gönder
  async sendSaleApprovalEmail(customer, sale) {
    const approvalLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approve/${sale.approval_token}`;
    
    const variables = {
      CUSTOMER_ID: customer.id,
      CUSTOMER_NAME: customer.name,
      TOTAL_AMOUNT: sale.total_amount,
      INSTALLMENT_COUNT: sale.installment_count,
      TOTAL_WITH_INTEREST: sale.total_with_interest,
      INSTALLMENT_AMOUNT: sale.installment_amount,
      FIRST_PAYMENT_DATE: new Date(sale.first_payment_date).toLocaleDateString('tr-TR'),
      APPROVAL_LINK: approvalLink,
      COMPANY_NAME: process.env.COMPANY_NAME || 'Marka World'
    };

    return this.sendEmail(customer.email, 'sale_approval', variables);
  }

  // Ödeme hatırlatma maili gönder
  async sendPaymentReminderEmail(customer, installment) {
    const variables = {
      CUSTOMER_ID: customer.id,
      CUSTOMER_NAME: customer.name,
      DUE_DATE: new Date(installment.due_date).toLocaleDateString('tr-TR'),
      AMOUNT: installment.amount,
      COMPANY_NAME: process.env.COMPANY_NAME || 'Marka World'
    };

    return this.sendEmail(customer.email, 'payment_reminder', variables);
  }

  // Gecikme uyarı maili gönder
  async sendOverduePaymentEmail(customer, installment) {
    const variables = {
      CUSTOMER_ID: customer.id,
      CUSTOMER_NAME: customer.name,
      DUE_DATE: new Date(installment.due_date).toLocaleDateString('tr-TR'),
      AMOUNT: installment.amount,
      CURRENT_LIMIT: customer.credit_limit,
      COMPANY_NAME: process.env.COMPANY_NAME || 'Marka World'
    };

    return this.sendEmail(customer.email, 'payment_overdue', variables);
  }
}

module.exports = new EmailService(); 