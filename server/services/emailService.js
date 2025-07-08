const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

const FRONTEND_URL = 'https://markaworld.com.tr';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

async function sendMail(to, subject, html) {
  const accessToken = await oAuth2Client.getAccessToken();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
}

async function sendCustomerRegistrationEmail(customer, verificationToken) {
  const verificationLink = `${FRONTEND_URL}/verify-email/${verificationToken}`;
  const subject = 'Marka World Hesabınızı Aktifleştirin';
  const html = `<h2>Merhaba ${customer.name},</h2><p>Marka World'e hoşgeldiniz!</p><p>Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayınız:</p><a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0;">E-posta Adresimi Doğrula</a><p>Eğer butona tıklayamazsanız, aşağıdaki bağlantıyı kopyalayıp tarayıcınızda açabilirsiniz:</p><p><a href="${verificationLink}">${verificationLink}</a></p><br><p>Saygılarımızla,<br>Marka World</p>`;
  await sendMail(customer.email, subject, html);
}

module.exports = { sendMail, sendCustomerRegistrationEmail, FRONTEND_URL };