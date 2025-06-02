export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { email, password, name, tc_no, phone } = req.body;

    // Mock registration/login response
    return res.status(200).json({
      success: true,
      message: 'Müşteri işlemi başarılı',
      customer: {
        id: Date.now(),
        name: name || 'Test User',
        email: email || 'test@example.com',
        phone: phone || '5551234567',
        status: 'active'
      }
    });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      customers: [
        {
          id: 1,
          name: 'Test Müşteri',
          email: 'test@example.com',
          phone: '5551234567',
          status: 'active'
        }
      ]
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
} 