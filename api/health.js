module.exports = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Marka World - Müşteri Ödeme Takip Sistemi',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url
  });
}; 