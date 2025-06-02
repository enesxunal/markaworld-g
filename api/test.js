module.exports = (req, res) => {
  res.status(200).json({
    message: 'Vercel API Test Başarılı',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });
}; 