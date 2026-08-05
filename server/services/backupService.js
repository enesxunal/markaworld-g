const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const { promisify } = require('util');
const zlib = require('zlib');
const { db } = require('../database/init');
const { resolveSafeBackupPath, isInvalidBackupNameError } = require('../utils/backupPath');
const { selectAllOrEmpty } = require('../utils/backupFetch');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 30; // 30 gün yedek tutma

// Klasör yoksa oluştur
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Veritabanından veri çekme (eksik opsiyonel tablolar yedeklemeyi çökertmez)
async function fetchDataForBackup() {
  const [customers, sales, installments, late_payment_fees] = await Promise.all([
    selectAllOrEmpty(db, 'customers'),
    selectAllOrEmpty(db, 'sales'),
    selectAllOrEmpty(db, 'installments'),
    selectAllOrEmpty(db, 'late_payment_fees')
  ]);

  return { customers, sales, installments, late_payment_fees };
}

// XML oluştur ve sıkıştır
async function createBackup() {
  console.log('🔍 [BACKUP] createBackup çağrıldı');
  try {
    console.log('🔍 [BACKUP] Veri çekiliyor...');
    const data = await fetchDataForBackup();
    console.log('🔍 [BACKUP] Veri çekildi:', {
      customers: data.customers.length,
      sales: data.sales.length,
      installments: data.installments.length,
      fees: data.late_payment_fees.length
    });
    
    console.log('🔍 [BACKUP] XML Builder oluşturuluyor...');
    const builder = new xml2js.Builder();
    console.log('🔍 [BACKUP] XML oluşturuluyor...');
    const xml = builder.buildObject(data);
    console.log('🔍 [BACKUP] XML oluşturuldu, boyut:', xml.length);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.xml.gz`;
    const filepath = path.join(BACKUP_DIR, filename);
    console.log('🔍 [BACKUP] Dosya yolu:', filepath);
    console.log('🔍 [BACKUP] BACKUP_DIR var mı:', fs.existsSync(BACKUP_DIR));

    // XML'i sıkıştır ve kaydet
    console.log('🔍 [BACKUP] XML sıkıştırılıyor...');
    const compressed = await promisify(zlib.gzip)(xml);
    console.log('🔍 [BACKUP] XML sıkıştırıldı, boyut:', compressed.length);
    
    console.log('🔍 [BACKUP] Dosya kaydediliyor...');
    await promisify(fs.writeFile)(filepath, compressed);
    console.log('🔍 [BACKUP] Dosya kaydedildi');

    // Eski yedekleri kontrol et ve gerekirse sil
    console.log('🔍 [BACKUP] Eski yedekler kontrol ediliyor...');
    const files = await promisify(fs.readdir)(BACKUP_DIR);
    const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.xml.gz'))
      .sort((a, b) => b.localeCompare(a)); // En yeni en üstte

    console.log('🔍 [BACKUP] Mevcut yedek sayısı:', backupFiles.length);

    // 30 günden eski yedekleri sil
    if (backupFiles.length > MAX_BACKUPS) {
      console.log('🔍 [BACKUP] Eski yedekler siliniyor...');
      for (const file of backupFiles.slice(MAX_BACKUPS)) {
        await promisify(fs.unlink)(path.join(BACKUP_DIR, file));
        console.log('🔍 [BACKUP] Silinen dosya:', file);
      }
    }

    console.log('🔍 [BACKUP] Yedekleme tamamlandı:', filename);
    return { success: true, filename };
  } catch (error) {
    console.error('🔍 [BACKUP] createBackup hatası:', error);
    console.error('🔍 [BACKUP] Hata stack:', error.stack);
    console.error('🔍 [BACKUP] Hata detayı:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    });
    return { success: false, error: error.message };
  }
}

// Yedek listesini getir
async function getBackups() {
  console.log('🔍 [BACKUP] getBackups çağrıldı');
  try {
    console.log('🔍 [BACKUP] BACKUP_DIR:', BACKUP_DIR);
    const files = await promisify(fs.readdir)(BACKUP_DIR);
    console.log('🔍 [BACKUP] Tüm dosyalar:', files);
    
    const candidates = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.xml.gz'))
      .sort((a, b) => b.localeCompare(a));

    const backups = [];
    for (const file of candidates) {
      try {
        const stats = await promisify(fs.stat)(path.join(BACKUP_DIR, file));
        backups.push({
          filename: file,
          date: file.split('_')[1].split('.')[0].replace(/-/g, ':'),
          size: (stats.size / 1024).toFixed(2) + ' KB'
        });
      } catch (fileErr) {
        console.warn('🔍 [BACKUP] Bozuk/okunamayan yedek atlandı:', file, fileErr.message);
      }
    }
    console.log('🔍 [BACKUP] Filtrelenmiş yedekler:', backups.length);
    return { success: true, backups };
  } catch (error) {
    console.error('🔍 [BACKUP] getBackups hatası:', error);
    return { success: false, error: error.message };
  }
}

// Yedeği geri yükle
async function restoreBackup(filename) {
  try {
    const filepath = resolveSafeBackupPath(filename, BACKUP_DIR);
    const compressed = await promisify(fs.readFile)(filepath);
    const xml = await promisify(zlib.gunzip)(compressed);
    const parser = new xml2js.Parser({ explicitArray: false });
    const data = await parser.parseStringPromise(xml);

    // Veritabanını temizle ve yeni verileri ekle
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Tabloları temizle
        db.run('DELETE FROM late_payment_fees');
        db.run('DELETE FROM installments');
        db.run('DELETE FROM sales');
        db.run('DELETE FROM customers');

        // Müşterileri ekle
        const customerStmt = db.prepare('INSERT INTO customers (id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)');
        data.customers.forEach(c => {
          customerStmt.run([c.id, c.name, c.email, c.phone, c.created_at]);
        });
        customerStmt.finalize();

        // Satışları ekle
        const saleStmt = db.prepare('INSERT INTO sales (id, customer_id, total_amount, total_with_interest, installment_count, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
        data.sales.forEach(s => {
          saleStmt.run([s.id, s.customer_id, s.total_amount, s.total_with_interest, s.installment_count, s.status, s.created_at]);
        });
        saleStmt.finalize();

        // Taksitleri ekle
        const installmentStmt = db.prepare('INSERT INTO installments (id, sale_id, amount, due_date, status, installment_number) VALUES (?, ?, ?, ?, ?, ?)');
        data.installments.forEach(i => {
          installmentStmt.run([i.id, i.sale_id, i.amount, i.due_date, i.status, i.installment_number]);
        });
        installmentStmt.finalize();

        // Gecikme faizlerini ekle
        const feeStmt = db.prepare('INSERT INTO late_payment_fees (id, installment_id, interest_amount, paid_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)');
        data.late_payment_fees.forEach(f => {
          feeStmt.run([f.id, f.installment_id, f.interest_amount, f.paid_amount, f.status, f.created_at]);
        });
        feeStmt.finalize();

        db.run('COMMIT', err => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    return { success: true };
  } catch (error) {
    if (isInvalidBackupNameError(error)) {
      return { success: false, error: 'Geçersiz yedek dosya adı', statusCode: 400 };
    }
    console.error('Geri yükleme hatası:', error.message);
    return { success: false, error: 'Yedek geri yüklenemedi' };
  }
}

// Yedeği sil
async function deleteBackup(filename) {
  try {
    const filepath = resolveSafeBackupPath(filename, BACKUP_DIR);
    await promisify(fs.unlink)(filepath);
    return { success: true };
  } catch (error) {
    if (isInvalidBackupNameError(error)) {
      return { success: false, error: 'Geçersiz yedek dosya adı', statusCode: 400 };
    }
    console.error('Yedek silme hatası:', error.message);
    return { success: false, error: 'Yedek silinemedi' };
  }
}

module.exports = {
  BACKUP_DIR,
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  resolveSafeBackupPath: (filename) => resolveSafeBackupPath(filename, BACKUP_DIR)
}; 