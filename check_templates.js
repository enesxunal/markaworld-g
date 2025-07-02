const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database/database.sqlite');

console.log('📧 Mail şablonları kontrol ediliyor...\n');

db.all('SELECT name, subject FROM email_templates', (err, rows) => {
  if (err) {
    console.error('❌ Hata:', err);
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('❌ Hiç mail şablonu bulunamadı!');
  } else {
    console.log('✅ Mevcut mail şablonları:');
    rows.forEach(row => {
      console.log(`- ${row.name}: ${row.subject}`);
    });
  }
  
  // customer_registration şablonunu özel olarak kontrol et
  db.get('SELECT * FROM email_templates WHERE name = "customer_registration"', (err, row) => {
    if (err) {
      console.error('❌ customer_registration kontrol hatası:', err);
    } else if (!row) {
      console.log('\n❌ customer_registration şablonu bulunamadı!');
      console.log('Bu yüzden yeni müşteri kaydı mailleri gitmiyor.');
    } else {
      console.log('\n✅ customer_registration şablonu mevcut');
    }
    process.exit(0);
  });
}); 