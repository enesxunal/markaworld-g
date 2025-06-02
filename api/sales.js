module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      sales: [
        {
          id: 1,
          customer_name: 'Test Müşteri',
          total_amount: 1500.00,
          payment_method: 'credit_card',
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]
    });
  }

  if (req.method === 'POST') {
    const { customer_id, amount, payment_method } = req.body;

    return res.status(200).json({
      success: true,
      message: 'Satış kaydı oluşturuldu',
      sale: {
        id: Date.now(),
        customer_id: customer_id || 1,
        amount: amount || 0,
        payment_method: payment_method || 'credit_card',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}; 