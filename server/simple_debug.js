const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
console.log('Veritabanı yolu:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
  console.log('Veritabanına bağlandı');
});

// Tabloları kontrol et
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Tablo listesi hatası:', err);
    return;
  }
  console.log('Mevcut tablolar:', tables.map(t => t.name));
  
  // Satışları kontrol et
  db.all('SELECT COUNT(*) as count FROM sales', (err, result) => {
    if (err) {
      console.error('Satış sayısı hatası:', err);
      return;
    }
    console.log('Satış sayısı:', result[0].count);
    
    // Taksitleri kontrol et
    db.all('SELECT COUNT(*) as count FROM installments', (err, result) => {
      if (err) {
        console.error('Taksit sayısı hatası:', err);
        return;
      }
      console.log('Taksit sayısı:', result[0].count);
      
      // İlk birkaç satışı göster
      db.all('SELECT * FROM sales LIMIT 3', (err, sales) => {
        if (err) {
          console.error('Satışlar hatası:', err);
          return;
        }
        console.log('İlk satışlar:', sales);
        
        // İlk birkaç taksiti göster
        db.all('SELECT * FROM installments LIMIT 3', (err, installments) => {
          if (err) {
            console.error('Taksitler hatası:', err);
            return;
          }
          console.log('İlk taksitler:', installments);
          process.exit(0);
        });
      });
    });
  });
});

// Email loglarını göster
console.log('\n--- Son 10 Email Logu ---');
db.all('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10', (err, logs) => {
  if (err) {
    console.error('Email logları okunamadı:', err);
    process.exit(1);
  }
  logs.forEach(log => {
    console.log(`Tarih: ${log.created_at}\nAlıcı: ${log.to_address}\nŞablon: ${log.template_name}\nBaşarılı mı: ${log.success}\nHata: ${log.error}\n---`);
  });
  process.exit(0);
}); 