const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// .env dosyasından client_id ve client_secret'i al
require('dotenv').config({ path: path.join(__dirname, '.env') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';
const GMAIL_USER = process.env.GMAIL_USER || 'info@markaworld.com.tr';
const ENV_PATH = path.join(__dirname, '.env');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('HATA: .env içinde GMAIL_CLIENT_ID ve GMAIL_CLIENT_SECRET tanımlı olmalı.');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://mail.google.com/'];

function updateEnvRefreshToken(refreshToken) {
  let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const lines = envContent.split('\n').filter(
    (line) => !line.startsWith('GMAIL_REFRESH_TOKEN=') && !line.startsWith('GMAIL_USER=')
  );
  lines.push(`GMAIL_REFRESH_TOKEN=${refreshToken}`);
  lines.push(`GMAIL_USER=${GMAIL_USER}`);
  fs.writeFileSync(ENV_PATH, `${lines.filter(Boolean).join('\n')}\n`);
}

function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  console.log('\n=== Gmail token alma ===');
  console.log('1) Aşağıdaki linki tarayıcıda açın');
  console.log('2) info@markaworld.com.tr ile giriş yapın');
  console.log('3) Google\'ın verdiği KISA kodu (4/ ile başlar) aşağıya yapıştırın');
  console.log('   NOT: O kısa kod .env\'e yazılmaz — script uzun Refresh Token üretir\n');
  console.log(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('\nGoogle\'dan aldığınız KISA kodu buraya yapıştırın: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code.trim(), (err, token) => {
      if (err) {
        console.error('Hata oluştu:', err.message || err);
        process.exit(1);
      }
      if (!token.refresh_token) {
        console.error('Refresh token gelmedi. Tekrar deneyin; linkte farklı Google hesabı seçin.');
        process.exit(1);
      }

      updateEnvRefreshToken(token.refresh_token);
      console.log('\n✅ Refresh Token alındı ve .env güncellendi.');
      console.log(`   GMAIL_USER=${GMAIL_USER}`);
      console.log(`   Token uzunluğu: ${token.refresh_token.length} karakter (1// ile başlar)`);
      console.log('\nŞimdi çalıştırın:');
      console.log('  pm2 restart markaworld-backend --update-env');
      console.log('  node scripts/test-smtp.js muslimeaykur@gmail.com');
    });
  });
}

getAccessToken(); 