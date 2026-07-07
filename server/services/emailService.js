const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { db } = require('../database/init');

function envTrim(key) {
  const value = process.env[key];
  return value == null ? '' : String(value).trim();
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'https://markaworld.com.tr').replace(/\/$/, '');
}

function getFromAddress() {
  return envTrim('EMAIL_FROM') || envTrim('EMAIL_USER') || envTrim('GMAIL_USER') || 'info@markaworld.com.tr';
}

let cachedSmtpTransporter = null;

function resetEmailTransporter() {
  cachedSmtpTransporter = null;
}

function hasGmailOAuth() {
  return Boolean(
    envTrim('GMAIL_CLIENT_ID') &&
    envTrim('GMAIL_CLIENT_SECRET') &&
    envTrim('GMAIL_REFRESH_TOKEN') &&
    envTrim('GMAIL_USER')
  );
}

function isPlaceholderSecret(value) {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes('buraya') ||
    v.includes('your-') ||
    v.includes('degistirin') ||
    v.includes('ornek') ||
    v === 'changeme'
  );
}

function hasSmtpConfig() {
  return Boolean(
    envTrim('EMAIL_HOST') &&
    envTrim('EMAIL_USER') &&
    envTrim('EMAIL_PASS') &&
    !isPlaceholderSecret(envTrim('EMAIL_PASS'))
  );
}

function getEmailDriver() {
  const driver = envTrim('EMAIL_DRIVER').toLowerCase();
  if (driver === 'smtp' || driver === 'gmail') return driver;
  // auto: SMTP daha stabil (Gmail OAuth test modunda 7 günde düşebilir)
  if (hasSmtpConfig()) return 'smtp';
  if (hasGmailOAuth()) return 'gmail';
  return null;
}

function getGmailRedirectUri() {
  return envTrim('GMAIL_REDIRECT_URI') || 'urn:ietf:wg:oauth:2.0:oob';
}

async function createGmailTransporter() {
  const { google } = require('googleapis');
  const oAuth2Client = new google.auth.OAuth2(
    envTrim('GMAIL_CLIENT_ID'),
    envTrim('GMAIL_CLIENT_SECRET'),
    getGmailRedirectUri()
  );
  oAuth2Client.setCredentials({ refresh_token: envTrim('GMAIL_REFRESH_TOKEN') });

  const accessToken = await oAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: envTrim('GMAIL_USER'),
      clientId: envTrim('GMAIL_CLIENT_ID'),
      clientSecret: envTrim('GMAIL_CLIENT_SECRET'),
      refreshToken: envTrim('GMAIL_REFRESH_TOKEN'),
      accessToken: accessToken.token
    }
  });
}

async function createSmtpTransporter() {
  const transporter = nodemailer.createTransport({
    host: envTrim('EMAIL_HOST'),
    port: parseInt(envTrim('EMAIL_PORT') || '465', 10),
    secure: envTrim('EMAIL_SECURE') === 'true',
    auth: {
      user: envTrim('EMAIL_USER'),
      pass: envTrim('EMAIL_PASS')
    }
  });
  await transporter.verify();
  console.log('✅ E-posta: SMTP hazır (%s)', envTrim('EMAIL_HOST'));
  return transporter;
}

async function createTransporter({ prefer } = {}) {
  const driver = prefer || getEmailDriver();
  const tryOrder =
    driver === 'smtp'
      ? ['smtp', 'gmail']
      : driver === 'gmail'
        ? ['gmail', 'smtp']
        : [];

  let lastError;
  for (const mode of tryOrder) {
    try {
      if (mode === 'smtp' && hasSmtpConfig()) {
        return await createSmtpTransporter();
      }
      if (mode === 'gmail' && hasGmailOAuth()) {
        const transporter = await createGmailTransporter();
        console.log('✅ E-posta: Gmail OAuth hazır (%s)', envTrim('GMAIL_USER'));
        return transporter;
      }
    } catch (err) {
      lastError = err;
      console.error(`❌ ${mode.toUpperCase()} hatası:`, err.message);
    }
  }

  if (lastError) throw lastError;
  throw new Error(
    'E-posta yapılandırması eksik. server/.env içinde EMAIL_HOST/USER/PASS veya GMAIL_* tanımlayın.'
  );
}

function isAuthMailError(err) {
  const msg = (err && err.message) || '';
  return /invalid_grant|EAUTH|authentication|unauthorized|expired/i.test(msg);
}

async function sendMail(to, subject, html) {
  let lastError;
  const drivers = [];
  const primary = getEmailDriver();
  if (primary === 'smtp') drivers.push('smtp', 'gmail');
  else if (primary === 'gmail') drivers.push('gmail', 'smtp');
  else drivers.push('gmail', 'smtp');

  for (const driver of drivers) {
    try {
      const transporter = await createTransporter({ prefer: driver });
      return await transporter.sendMail({
        from: getFromAddress(),
        to,
        subject,
        html
      });
    } catch (err) {
      lastError = err;
      console.error(`❌ Mail gönderme hatası (${driver}):`, err.message);
      resetEmailTransporter();
      if (!isAuthMailError(err)) break;
    }
  }

  const hint = /invalid_grant/i.test((lastError && lastError.message) || '')
    ? ' Gmail token süresi dolmuş. Sunucuda: node get_gmail_token.js veya bash scripts/set-smtp-env.sh ile hosting mail kurun.'
    : '';
  throw new Error(`${(lastError && lastError.message) || 'Mail gönderilemedi'}.${hint}`);
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

function unsubscribeFooterHtml(recipientEmail) {
  const unsubUrl = `${getFrontendUrl()}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
  return `<div style="padding:16px 24px;border-top:1px solid #eee;background:#fafafa;font-size:12px;color:#666;text-align:center">
Marka World kampanya — <a href="${unsubUrl}" style="color:#666">listeden çıkın</a>
</div>`;
}

function wrapCampaignHtml(htmlContent, recipientEmail) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden">
<div style="background:#000;padding:24px;text-align:center"><p style="margin:0;color:#fff;font-size:20px;font-weight:bold">MARKA WORLD</p></div>
<div style="padding:28px 24px;color:#111;line-height:1.6">${htmlContent}</div>
${unsubscribeFooterHtml(recipientEmail)}
</div>`;
}

function buildBulkHtml(messageContent, recipientEmail, options = {}) {
  const useFullHtml = Boolean(options.useFullHtml);
  const useWrapper = options.useWrapper !== false;
  const appendUnsubscribe = options.appendUnsubscribe !== false;
  let html = messageContent;

  if (useFullHtml) {
    if (appendUnsubscribe && !/unsubscribe/i.test(html)) {
      html += unsubscribeFooterHtml(recipientEmail);
    }
    return html;
  }

  if (useWrapper) {
    return wrapCampaignHtml(html, recipientEmail);
  }

  if (appendUnsubscribe && !/unsubscribe/i.test(html)) {
    html += unsubscribeFooterHtml(recipientEmail);
  }
  return html;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendBulkEmail(recipients, subject, messageContent, options = {}) {
  let totalSent = 0;
  let totalFailed = 0;
  const errors = [];
  const unique = [...new Set(recipients.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];

  for (const email of unique) {
    try {
      const html = buildBulkHtml(messageContent, email, options);
      await sendMail(email, subject, html);
      totalSent += 1;
      await sleep(350);
    } catch (err) {
      totalFailed += 1;
      errors.push({ email, error: err.message });
    }
  }

  return { totalSent, totalFailed, errors, totalRecipients: unique.length };
}

module.exports = {
  sendMail,
  resetEmailTransporter,
  sendEmail,
  sendCustomerRegistrationEmail,
  sendSaleConfirmationEmail,
  sendInstallmentPaymentEmail,
  sendPaymentReminderEmail,
  sendOverduePaymentEmail,
  sendBulkEmail,
  buildBulkHtml,
  sendTemplatedEmail,
  createTransporter,
  getFrontendUrl,
  FRONTEND_URL: getFrontendUrl()
};
