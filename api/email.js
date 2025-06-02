module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { to, subject, message, type } = req.body;

    // Mock email sending
    return res.status(200).json({
      success: true,
      message: 'Email başarıyla gönderildi',
      email: {
        to: to || 'test@example.com',
        subject: subject || 'Test Email',
        sent_at: new Date().toISOString(),
        status: 'delivered'
      }
    });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      status: 'Email servisi aktif',
      templates: [
        'payment_reminder',
        'welcome_email',
        'confirmation_email'
      ]
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}; 