module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { username, password } = req.body;

    // Admin credentials check
    if (username === 'markaworld' && password === 'Marka60..') {
      return res.status(200).json({
        success: true,
        message: 'Admin giriş başarılı',
        token: 'mock-jwt-token-' + Date.now(),
        admin: {
          username: 'markaworld',
          role: 'admin'
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}; 