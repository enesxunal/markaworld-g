const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// .env dosyasından client_id ve client_secret'i al
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://mail.google.com/'];

function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  console.log('\nAşağıdaki linki kopyalayıp tarayıcıda açın:');
  console.log(authUrl);
  console.log('\nGoogle hesabınızla giriş yapıp çıkan kodu buraya yapıştırın.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Kodu buraya yapıştırın: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        return console.error('Hata oluştu:', err);
      }
      console.log('\nRefresh Token:');
      console.log(token.refresh_token);
      console.log('\nBunu .env dosyanıza GMAIL_REFRESH_TOKEN olarak ekleyin!');
    });
  });
}

getAccessToken(); 