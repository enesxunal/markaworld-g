const nodemailer = require('nodemailer');

// Test transporter
const transporter = nodemailer.createTransport({
  host: 'mail.markaworld.com.tr',
  port: 587,
  secure: false,
  auth: {
    user: 'info',
    pass: 'Enes15..'
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmail() {
  try {
    console.log('🔍 SMTP bağlantısı test ediliyor...');
    
    // Bağlantıyı test et
    await transporter.verify();
    console.log('✅ SMTP bağlantısı başarılı!');
    
    // Test maili gönder
    console.log('📧 Test maili gönderiliyor...');
    const info = await transporter.sendMail({
      from: 'info@markaworld.com.tr',
      to: 'enesunal700@gmail.com',
      subject: 'Test Mail - Marka World',
      text: 'Bu bir test mailidir.',
      html: '<h1>Test Mail</h1><p>Bu bir test mailidir.</p>'
    });
    
    console.log('✅ Test maili gönderildi!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Detay:', error);
  }
}

testEmail(); 