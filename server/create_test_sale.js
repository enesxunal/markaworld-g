const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
  console.log('✅ SQLite veritabanına bağlandı');
});

// Test satışı oluştur
const createTestSale = () => {
  return new Promise((resolve, reject) => {
    console.log('📦 Test satışı oluşturuluyor...');
    
    const customerId = 1; // Test müşterisi
    const totalAmount = 1000;
    const installmentCount = 3;
    const firstPaymentDate = '2025-07-01';
    
    const installmentAmount = Math.round((totalAmount * 1.1) / installmentCount);
    db.run(`
      INSERT INTO sales (customer_id, total_amount, total_with_interest, installment_count, installment_amount, first_payment_date, interest_rate, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 10, 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [customerId, totalAmount, totalAmount * 1.1, installmentCount, installmentAmount, firstPaymentDate], function(err) {
      if (err) {
        console.error('❌ Satış oluşturma hatası:', err);
        reject(err);
        return;
      }
      
      const saleId = this.lastID;
      console.log(`✅ Satış oluşturuldu, ID: ${saleId}`);
      
      // Taksitleri oluştur
      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date(firstPaymentDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        
        db.run(`
          INSERT INTO installments (sale_id, installment_number, amount, due_date, status)
          VALUES (?, ?, ?, ?, 'unpaid')
        `, [saleId, i, installmentAmount, dueDate.toISOString().split('T')[0]], (err) => {
          if (err) {
            console.error(`❌ Taksit ${i} oluşturma hatası:`, err);
          } else {
            console.log(`✅ Taksit ${i} oluşturuldu: ${dueDate.toISOString().split('T')[0]}, Tutar: ${installmentAmount}`);
          }
        });
      }
      
      resolve(saleId);
    });
  });
};

// Sonucu kontrol et
const checkResult = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 SONUÇ KONTROLÜ:');
    
    db.all(`
      SELECT s.id, s.status, s.total_amount, COUNT(i.id) as installment_count
      FROM sales s
      LEFT JOIN installments i ON s.id = i.sale_id
      GROUP BY s.id
      ORDER BY s.id DESC
    `, (err, results) => {
      if (err) {
        console.error('❌ Kontrol hatası:', err);
        reject(err);
        return;
      }
      
      results.forEach(result => {
        console.log(`📦 Satış ID: ${result.id}, Durum: ${result.status}, Tutar: ${result.total_amount}, Taksit Sayısı: ${result.installment_count}`);
      });
      
      resolve();
    });
  });
};

// Ana fonksiyon
const main = async () => {
  try {
    await createTestSale();
    setTimeout(async () => {
      await checkResult();
      console.log('\n✅ Test tamamlandı!');
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('❌ Test hatası:', error);
    process.exit(1);
  }
};

main(); 