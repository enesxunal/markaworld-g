const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Mail bağlantısını test et
router.get('/test', async (req, res) => {
  try {
    // Test maili gönder
    const testResult = await emailService.transporter.sendMail({
      from: '"Marka World Test" <info@markaworld.com.tr>',
      to: 'info@markaworld.com.tr',
      subject: 'API Mail Test - Marka World',
      html: `
        <h2>API Mail Test Başarılı!</h2>
        <p>Bu mail, Marka World müşteri ödeme takip sistemi API'sinden gönderilmiştir.</p>
        <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
        <p><strong>Test Endpoint:</strong> /api/email/test</p>
        <hr>
        <p><em>Bu otomatik bir test mailidir.</em></p>
      `
    });

    res.json({
      success: true,
      message: 'Test maili başarıyla gönderildi',
      messageId: testResult.messageId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mail test hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Mail gönderimi başarısız',
      error: error.message
    });
  }
});

// Mail bağlantısını doğrula
router.get('/verify', async (req, res) => {
  try {
    await emailService.transporter.verify();
    res.json({
      success: true,
      message: 'Mail sunucusu bağlantısı başarılı',
      config: {
        host: 'fr-astral.guzelhosting.com',
        port: 465,
        secure: true,
        user: 'info@markaworld.com.tr'
      }
    });
  } catch (error) {
    console.error('Mail bağlantı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Mail sunucusu bağlantısı başarısız',
      error: error.message
    });
  }
});

module.exports = router; 