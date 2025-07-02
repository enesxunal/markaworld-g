const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
  console.log('✅ SQLite veritabanına bağlandı:', dbPath);
});

// Satışları kontrol et
const checkSales = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 SATIŞLAR:');
    db.all('SELECT id, customer_id, total_amount, status, created_at FROM sales ORDER BY id DESC', (err, sales) => {
      if (err) {
        console.error('❌ Satışlar getirilemedi:', err);
        reject(err);
        return;
      }
      
      if (sales.length === 0) {
        console.log('❌ Hiç satış yok!');
      } else {
        sales.forEach(sale => {
          console.log(`📦 Satış ID: ${sale.id}, Müşteri: ${sale.customer_id}, Tutar: ${sale.total_amount}, Durum: ${sale.status}, Tarih: ${sale.created_at}`);
        });
      }
      resolve(sales);
    });
  });
};

// Taksitleri kontrol et
const checkInstallments = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 TAKSİTLER:');
    db.all(`
      SELECT i.id, i.sale_id, i.amount, i.due_date, i.status, i.installment_number, s.status as sale_status
      FROM installments i
      JOIN sales s ON i.sale_id = s.id
      ORDER BY i.sale_id, i.installment_number
    `, (err, installments) => {
      if (err) {
        console.error('❌ Taksitler getirilemedi:', err);
        reject(err);
        return;
      }
      
      if (installments.length === 0) {
        console.log('❌ Hiç taksit yok!');
      } else {
        installments.forEach(installment => {
          console.log(`💰 Taksit ID: ${installment.id}, Satış: ${installment.sale_id}, Tutar: ${installment.amount}, Vade: ${installment.due_date}, Durum: ${installment.status}, Satış Durumu: ${installment.sale_status}`);
        });
      }
      resolve(installments);
    });
  });
};

// Future-payments sorgusunu test et
const testFuturePayments = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 FUTURE-PAYMENTS SORGUSU TEST:');
    
    const startDate = '2025-06-27';
    const endDate = '2025-08-31';
    
    const query = `
      SELECT 
        i.id as installment_id,
        i.amount,
        i.due_date,
        i.status,
        i.installment_number,
        c.id as customer_id,
        c.name as customer_name,
        s.id as sale_id,
        s.status as sale_status,
        CASE
          WHEN i.status = 'unpaid' AND date(i.due_date) < date('now') THEN 'overdue'
          ELSE i.status
        END as calculated_status
      FROM installments i
      JOIN sales s ON i.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      WHERE date(i.due_date) BETWEEN date(?) AND date(?)
      AND s.status = 'approved'
      ORDER BY i.due_date ASC
    `;
    
    db.all(query, [startDate, endDate], (err, results) => {
      if (err) {
        console.error('❌ Future-payments sorgu hatası:', err);
        reject(err);
        return;
      }
      
      console.log(`📊 Sorgu sonucu: ${results.length} taksit bulundu`);
      
      if (results.length === 0) {
        console.log('❌ Hiç taksit bulunamadı!');
        console.log('🔍 Muhtemel nedenler:');
        console.log('   - Satışlar "approved" değil');
        console.log('   - Taksitlerin vade tarihi aralıkta değil');
        console.log('   - Taksitlerin status\'u yanlış');
      } else {
        results.forEach(result => {
          console.log(`✅ Taksit ID: ${result.installment_id}, Müşteri: ${result.customer_name}, Tutar: ${result.amount}, Vade: ${result.due_date}, Durum: ${result.status}, Satış Durumu: ${result.sale_status}`);
        });
      }
      resolve(results);
    });
  });
};

// Ana fonksiyon
const main = async () => {
  try {
    await checkSales();
    await checkInstallments();
    await testFuturePayments();
    
    console.log('\n✅ Debug tamamlandı');
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug hatası:', error);
    process.exit(1);
  }
};

main(); 