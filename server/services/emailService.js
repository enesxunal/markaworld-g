const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { db } = require('../database/init');

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'https://markaworld.com.tr').replace(/\/$/, '');
}

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_USER || 'info@markaworld.com.tr';
}

let cachedTransporter = null;

function hasGmailOAuth() {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.GMAIL_USER
  );
}

function hasSmtpConfig() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

async function createTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (hasSmtpConfig()) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: process.env.EMAIL_SECURE !== 'false',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    try {
      await cachedTransporter.verify();
      console.log('✅ E-posta: SMTP hazır (%s)', process.env.EMAIL_HOST);
    } catch (err) {
      console.warn('⚠️ SMTP verify uyarısı (sunucu yine de başlar):', err.message);
    }
    return cachedTransporter;
  }

  if (hasGmailOAuth()) {
    const { google } = require('googleapis');
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: (await oAuth2Client.getAccessToken()).token
      }
    });
    console.log('✅ E-posta: Gmail OAuth hazır');
    return cachedTransporter;
  }

  throw new Error(
    'E-posta yapılandırması eksik. server/.env içinde EMAIL_HOST, EMAIL_USER, EMAIL_PASS veya GMAIL_* tanımlayın.'
  );
}

async function sendMail(to, subject, html) {
  const transporter = await createTransporter();
  return transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html
  });
}

function replacePlaceholders(template, vars) {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    const safe = value == null ? '' : String(value);
    result = result.split(`{{${key}}}`).join(safe);
    result = result.split(`{${key}}`).join(safe);
  });
  return result;
}

async function getTemplate(name) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT subject, html FROM email_templates WHERE name = ?',
      [name],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

async function sendTemplatedEmail(to, templateName, vars) {
  const template = await getTemplate(templateName);
  if (!template) {
    throw new Error(`E-posta şablonu bulunamadı: ${templateName}`);
  }
  const subject = replacePlaceholders(template.subject, vars);
  const html = replacePlaceholders(template.html, vars);
  return sendMail(to, subject, html);
}

async function sendCustomerRegistrationEmail(customer, verificationToken) {
  const verificationLink = `${getFrontendUrl()}/verify-email/${verificationToken}`;
  const subject = 'Marka World — E-posta adresinizi doğrulayın';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Merhaba ${customer.name},</h2>
      <p>Marka World hesabınızı oluşturduğunuz için teşekkürler.</p>
      <p>Hesabınızı aktifleştirmek için önce e-posta adresinizi doğrulayın, ardından sözleşmeleri onaylayın.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${verificationLink}"
           style="background: #111; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          E-posta Adresimi Doğrula
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:</p>
      <p style="word-break: break-all; color: #0066cc; font-size: 14px;">${verificationLink}</p>
      <p style="color: #999; font-size: 12px;">Bu bağlantı 24 saat geçerlidir.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #666; font-size: 12px;">Marka World — Müşteri Hizmetleri</p>
    </div>
  `;

  await sendMail(customer.email, subject, html);
  return { success: true, verificationLink };
}

async function sendEmail(to, templateName, vars) {
  return sendTemplatedEmail(to, templateName, vars);
}

async function sendSaleConfirmationEmail(sale, customer, installments) {
  const installmentRows = (installments || [])
    .map(
      (inst) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${inst.installment_number}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(inst.amount).toLocaleString('tr-TR')} ₺</td>
        </tr>`
    )
    .join('');

  try {
    await sendTemplatedEmail(customer.email, 'sale_confirmation', {
      CUSTOMER_NAME: customer.name,
      SALE_ID: sale.id,
      TOTAL_AMOUNT: Number(sale.total_amount).toLocaleString('tr-TR'),
      TOTAL_WITH_INTEREST: Number(sale.total_with_interest).toLocaleString('tr-TR'),
      INSTALLMENT_COUNT: installments.length,
      INSTALLMENT_TABLE: installmentRows,
      CUSTOMER_PORTAL_LINK: `${getFrontendUrl()}/customer-login`
    });
  } catch {
    await sendMail(
      customer.email,
      'Satışınız onaylandı — Marka World',
      `<p>Sayın ${customer.name},</p><p>Satış #${sale.id} onaylandı. Toplam: ${sale.total_with_interest} ₺</p>`
    );
  }
}

async function sendInstallmentPaymentEmail(sale, customer, payment, remainingAmount) {
  await sendMail(
    customer.email,
    'Taksit ödemeniz alındı — Marka World',
    `<p>Sayın ${customer.name},</p>
     <p>${payment.installment_number}. taksit ödemeniz (${payment.amount} ₺) alınmıştır.</p>
     <p>Kalan borç: ${remainingAmount} ₺</p>`
  );
}

async function sendPaymentReminderEmail(customer, installment) {
  try {
    await sendTemplatedEmail(customer.email, 'payment_reminder', {
      name: customer.name,
      CUSTOMER_NAME: customer.name,
      dueDate: installment.due_date,
      amount: installment.amount
    });
  } catch {
    await sendMail(
      customer.email,
      'Ödeme hatırlatması — Marka World',
      `<p>Sayın ${customer.name}, ${installment.due_date} tarihli ${installment.amount} ₺ taksitiniz yaklaşıyor.</p>`
    );
  }
}

async function sendOverduePaymentEmail(customer, installment) {
  try {
    await sendTemplatedEmail(customer.email, 'payment_late', {
      name: customer.name,
      CUSTOMER_NAME: customer.name,
      dueDate: installment.due_date,
      amount: installment.amount,
      lateDays: installment.late_days || 1
    });
  } catch {
    await sendMail(
      customer.email,
      'Geciken ödeme — Marka World',
      `<p>Sayın ${customer.name}, ${installment.due_date} tarihli ödemeniz gecikmiştir.</p>`
    );
  }
}

async function sendBulkEmail(recipients, subject, messageContent) {
  let totalSent = 0;
  let totalFailed = 0;
  const errors = [];

  for (const email of recipients) {
    try {
      await sendMail(email, subject, messageContent);
      totalSent += 1;
    } catch (err) {
      totalFailed += 1;
      errors.push({ email, error: err.message });
    }
  }

  return { totalSent, totalFailed, errors };
}

module.exports = {
  sendMail,
  sendEmail,
  sendCustomerRegistrationEmail,
  sendSaleConfirmationEmail,
  sendInstallmentPaymentEmail,
  sendPaymentReminderEmail,
  sendOverduePaymentEmail,
  sendBulkEmail,
  sendTemplatedEmail,
  createTransporter,
  getFrontendUrl,
  FRONTEND_URL: getFrontendUrl()
};
