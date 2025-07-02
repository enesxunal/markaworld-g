const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
  console.log('Veritabanına bağlandı');
});

db.run("UPDATE installments SET status = 'unpaid' WHERE status = 'pending'", function(err) {
  if (err) {
    console.error('Güncelleme hatası:', err);
    process.exit(1);
  }
  console.log(`Güncellenen taksit sayısı: ${this.changes}`);
  process.exit(0);
}); 