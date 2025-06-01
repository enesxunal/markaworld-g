module.exports = (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Müşteri Ödeme Takip Sistemi çalışıyor',
    timestamp: new Date().toISOString()
  });
}; 