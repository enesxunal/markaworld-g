#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

function trimEnv(key) {
  const v = process.env[key];
  return v ? String(v).trim() : '';
}

async function main() {
  console.log('=== Mail teşhis ===\n');
  console.log('EMAIL_DRIVER:', trimEnv('EMAIL_DRIVER') || '(auto)');
  console.log('Gmail user:', trimEnv('GMAIL_USER') || '(yok)');
  console.log('Gmail token:', trimEnv('GMAIL_REFRESH_TOKEN') ? `var (${trimEnv('GMAIL_REFRESH_TOKEN').length} karakter)` : '(yok)');
  console.log('SMTP host:', trimEnv('EMAIL_HOST') || '(yok)');
  console.log('SMTP user:', trimEnv('EMAIL_USER') || '(yok)');

  const hasGmail = Boolean(
    trimEnv('GMAIL_CLIENT_ID') &&
    trimEnv('GMAIL_CLIENT_SECRET') &&
    trimEnv('GMAIL_REFRESH_TOKEN') &&
    trimEnv('GMAIL_USER')
  );
  const hasSmtp = Boolean(trimEnv('EMAIL_HOST') && trimEnv('EMAIL_USER') && trimEnv('EMAIL_PASS'));

  if (hasGmail) {
    try {
      const { google } = require('googleapis');
      const client = new google.auth.OAuth2(
        trimEnv('GMAIL_CLIENT_ID'),
        trimEnv('GMAIL_CLIENT_SECRET'),
        trimEnv('GMAIL_REDIRECT_URI') || 'urn:ietf:wg:oauth:2.0:oob'
      );
      client.setCredentials({ refresh_token: trimEnv('GMAIL_REFRESH_TOKEN') });
      const token = await client.getAccessToken();
      console.log('\nGmail OAuth: OK');
      if (token.token) console.log('Access token alındı.');
    } catch (err) {
      console.log('\nGmail OAuth: HATA —', err.message);
      if (/invalid_grant/i.test(err.message)) {
        console.log('\nÇözüm A (geçici): node get_gmail_token.js');
        console.log('Çözüm B (kalıcı): bash scripts/set-smtp-env.sh mail.markaworld.com.tr 587 info@markaworld.com.tr SIFRE');
        console.log('\nNot: Google OAuth "Test" modundaysa token ~7 günde bir düşer.');
        console.log('Kalıcı çözüm: hosting SMTP şifresi kullanın (set-smtp-env.sh).');
      }
    }
  }

  if (hasSmtp) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: trimEnv('EMAIL_HOST'),
      port: parseInt(trimEnv('EMAIL_PORT') || '587', 10),
      secure: trimEnv('EMAIL_SECURE') === 'true',
      auth: {
        user: trimEnv('EMAIL_USER'),
        pass: trimEnv('EMAIL_PASS')
      }
    });
    try {
      await transporter.verify();
      console.log('\nSMTP: OK');
    } catch (err) {
      console.log('\nSMTP: HATA —', err.message);
    }
  }

  if (!hasGmail && !hasSmtp) {
    console.log('\nHiç mail ayarı yok.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
