#!/usr/bin/env node
/**
 * SMTP test — şifreleri .env'den okur.
 * Kullanım: node scripts/test-smtp.js alici@email.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const emailService = require('../services/emailService');

const to = process.argv[2] || process.env.EMAIL_USER;

if (!to) {
  console.error('Kullanım: node scripts/test-smtp.js alici@email.com');
  process.exit(1);
}

console.log('Gmail OAuth:', process.env.GMAIL_USER || '(yok)');
console.log('GMAIL_REFRESH_TOKEN:', process.env.GMAIL_REFRESH_TOKEN ? '*** tanımlı' : '(YOK)');
console.log('SMTP host:', process.env.EMAIL_HOST || '(yok)');
console.log('SMTP user:', process.env.EMAIL_USER || '(yok)');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '(yok)');

emailService
  .sendMail(to, 'Marka World SMTP Test', '<p>Bu bir test e-postasıdır. SMTP çalışıyor.</p>')
  .then((info) => {
    console.log('OK — mail gönderildi:', info.messageId);
    process.exit(0);
  })
  .catch((err) => {
    console.error('HATA:', err.message);
    process.exit(1);
  });
