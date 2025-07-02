const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
  console.log('✅ SQLite veritabanına bağlandı:', dbPath);
});

// Veritabanı bağlantısını test et
const testConnection = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1', (err) => {
      if (err) {
        console.error('❌ Veritabanı bağlantı testi başarısız:', err);
        reject(err);
      } else {
        console.log('✅ Veritabanı bağlantı testi başarılı');
        resolve();
      }
    });
  });
};

// Veritabanı tablolarını oluştur
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    console.log('✅ Veritabanı başarıyla başlatıldı!');

    // Tabloları oluştur
    db.serialize(() => {
      // Kullanıcılar tablosu (admin paneli için)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Müşteriler tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          tc_no TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          birth_date TEXT,
          address TEXT,
          credit_limit DECIMAL(10,2) DEFAULT 2500,
          current_debt DECIMAL(10,2) DEFAULT 0,
          verification_token TEXT,
          verification_token_expires_at DATETIME,
          email_verified INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          kvkk_approved INTEGER DEFAULT 0,
          contract_approved INTEGER DEFAULT 0,
          electronic_approved INTEGER DEFAULT 0
        )
      `);

      // Satışlar tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          installment_count INTEGER NOT NULL,
          interest_rate DECIMAL(5,2) NOT NULL,
          total_with_interest DECIMAL(10,2) NOT NULL,
          installment_amount DECIMAL(10,2) NOT NULL,
          first_payment_date DATE NOT NULL,
          status TEXT DEFAULT 'pending',
          approval_token TEXT,
          approved_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
      `);

      // Taksitler tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS installments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          installment_number INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          due_date DATE NOT NULL,
          paid_date DATE,
          status TEXT DEFAULT 'unpaid',
          late_days INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sale_id) REFERENCES sales(id)
        )
      `);

      // Email logs tablosu
      db.run(`DROP TABLE IF EXISTS email_logs`);
      db.run(`CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_address TEXT NOT NULL,
        template_name TEXT NOT NULL,
        success INTEGER DEFAULT 0,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Email templates tablosu
      db.run(`DROP TABLE IF EXISTS email_templates`);
      db.run(`CREATE TABLE IF NOT EXISTS email_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        subject TEXT NOT NULL,
        html TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Newsletter abonelikleri tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'active',
          subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          unsubscribed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Gecikme faizi tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS late_payment_interest (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          annual_rate DECIMAL(5,2) NOT NULL,
          daily_rate DECIMAL(10,8) NOT NULL,
          effective_from DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Settings tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Settings tablosu oluşturma hatası:', err);
          reject(err);
          return;
        }
        
        // Tüm tablolar oluşturulduktan sonra varsayılan verileri ekle
        insertDefaultData()
          .then(() => {
            // Test müşterisi ekle
            const testPassword = bcrypt.hashSync('123456', 10);

            db.run(`
              INSERT OR IGNORE INTO customers (id, name, tc_no, phone, email, address, credit_limit, status, email_verified, password)
              VALUES (1, 'Test Musteri', '12345678901', '05551234567', 'test@example.com', 'Test Adres', 5000, 'active', 1, ?)
            `, [testPassword]);

            // Eğer test kullanıcısı zaten varsa şifresini güncelle
            db.run(`
              UPDATE customers SET password = ?, email_verified = 1 WHERE id = 1 AND password IS NULL
            `, [testPassword]);

            // İkinci test kullanıcısı ekle
            const test2Password = bcrypt.hashSync('123456', 10);

            db.run(`
              INSERT OR IGNORE INTO customers (id, name, tc_no, phone, email, address, credit_limit, status, email_verified, password)
              VALUES (2, 'Test Musteri 2', '98765432109', '05559876543', 'test2@example.com', 'Test Adres 2', 7500, 'active', 1, ?)
            `, [test2Password]);

            // Üçüncü test kullanıcısı ekle - basit şifre
            const test3Password = bcrypt.hashSync('test123', 10);

            db.run(`
              INSERT OR IGNORE INTO customers (id, name, tc_no, phone, email, address, credit_limit, status, email_verified, password)
              VALUES (3, 'Ahmet Yilmaz', '11122233344', '05551112233', 'ahmet@test.com', 'Istanbul Test Mahallesi', 10000, 'active', 1, ?)
            `, [test3Password]);

            // Test satışı ekle
            db.run(`
              INSERT OR IGNORE INTO sales (id, customer_id, total_amount, installment_count, interest_rate, total_with_interest, installment_amount, first_payment_date, status, approval_token)
              VALUES (1, 1, 1000, 3, 5, 1050, 350, date('now', '+30 days'), 'approved', 'test-token-123')
            `);

            // Test taksitleri ekle
            db.run(`
              INSERT OR IGNORE INTO installments (id, sale_id, installment_number, amount, due_date, status)
              VALUES 
              (1, 1, 1, 350, date('now', '+30 days'), 'pending'),
              (2, 1, 2, 350, date('now', '+60 days'), 'pending'),
              (3, 1, 3, 350, date('now', '+90 days'), 'pending')
            `, (err) => {
              if (err) {
                console.error('Test verisi ekleme hatası:', err);
                reject(err);
              } else {
                console.log('Veritabanı tabloları ve test verileri başarıyla oluşturuldu');
                resolve();
              }
            });
          })
          .catch(err => {
            console.error('Varsayılan veri ekleme hatası:', err);
            reject(err);
          });
      });
    });
  });
};

// Varsayılan verileri ekle
const insertDefaultData = () => {
  return new Promise((resolve, reject) => {
    // Email şablonlarını ekle
    const emailTemplates = [
      {
        name: 'welcome',
        subject: 'Marka World\'e Hoş Geldiniz',
        html: `
          <h1>Marka World'e Hoş Geldiniz!</h1>
          <p>Sayın {name},</p>
          <p>Marka World'e kayıt olduğunuz için teşekkür ederiz. Hesabınızı aktifleştirmek için aşağıdaki linke tıklayın:</p>
          <p><a href="{verificationLink}">Hesabımı Aktifleştir</a></p>
          <p>Saygılarımızla,<br>Marka World Ekibi</p>
        `
      },
      {
        name: 'password_reset',
        subject: 'Şifre Sıfırlama Talebi',
        html: `
          <h1>Şifre Sıfırlama</h1>
          <p>Sayın {name},</p>
          <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
          <p><a href="{resetLink}">Şifremi Sıfırla</a></p>
          <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
          <p>Saygılarımızla,<br>Marka World Ekibi</p>
        `
      },
      {
        name: 'sale_approved',
        subject: 'Satış Onaylandı',
        html: `
          <h1>Satış Onaylandı</h1>
          <p>Sayın {name},</p>
          <p>Satış talebiniz onaylanmıştır. Detaylar aşağıdaki gibidir:</p>
          <ul>
            <li>Toplam Tutar: {totalAmount} TL</li>
            <li>Taksit Sayısı: {installmentCount}</li>
            <li>Taksit Tutarı: {installmentAmount} TL</li>
            <li>İlk Ödeme Tarihi: {firstPaymentDate}</li>
          </ul>
          <p>Saygılarımızla,<br>Marka World Ekibi</p>
        `
      },
      {
        name: 'payment_reminder',
        subject: 'Ödeme Hatırlatma',
        html: `
          <h1>Ödeme Hatırlatma</h1>
          <p>Sayın {name},</p>
          <p>{dueDate} tarihli {amount} TL tutarındaki ödemeniz yaklaşmaktadır.</p>
          <p>Saygılarımızla,<br>Marka World Ekibi</p>
        `
      },
      {
        name: 'payment_late',
        subject: 'Geciken Ödeme Bildirimi',
        html: `
          <h1>Geciken Ödeme Bildirimi</h1>
          <p>Sayın {name},</p>
          <p>{dueDate} tarihli {amount} TL tutarındaki ödemeniz {lateDays} gün gecikmiştir.</p>
          <p>Lütfen en kısa sürede ödemenizi yapınız.</p>
          <p>Saygılarımızla,<br>Marka World Ekibi</p>
        `
      }
    ];

    // Email şablonlarını ekle
    emailTemplates.forEach(template => {
      db.run(`
        INSERT OR REPLACE INTO email_templates (name, subject, html)
        VALUES (?, ?, ?)
      `, [template.name, template.subject, template.html], (err) => {
        if (err) {
          console.error('Email şablonu ekleme hatası:', err);
          reject(err);
          return;
        }
      });
    });

    // Varsayılan ayarları ekle
    const settings = [
      {
        key: 'company_name',
        value: 'Marka World',
        description: 'Şirket adı'
      },
      {
        key: 'company_email',
        value: 'info@markaworld.com.tr',
        description: 'Şirket email adresi'
      },
      {
        key: 'company_phone',
        value: '0850 123 4567',
        description: 'Şirket telefon numarası'
      },
      {
        key: 'company_address',
        value: 'İstanbul, Türkiye',
        description: 'Şirket adresi'
      },
      {
        key: 'default_credit_limit',
        value: '2500',
        description: 'Varsayılan kredi limiti'
      },
      {
        key: 'min_installment_count',
        value: '2',
        description: 'Minimum taksit sayısı'
      },
      {
        key: 'max_installment_count',
        value: '12',
        description: 'Maksimum taksit sayısı'
      },
      {
        key: 'default_interest_rate',
        value: '2.5',
        description: 'Varsayılan faiz oranı'
      }
    ];

    // Ayarları ekle
    settings.forEach(setting => {
      db.run(`
        INSERT OR REPLACE INTO settings (key, value, description)
        VALUES (?, ?, ?)
      `, [setting.key, setting.value, setting.description], (err) => {
        if (err) {
          console.error('Ayar ekleme hatası:', err);
          reject(err);
          return;
        }
      });
    });

    // Varsayılan gecikme faizi oranını ekle
    db.run(`
      INSERT OR REPLACE INTO late_payment_interest (annual_rate, daily_rate, effective_from)
      VALUES (?, ?, date('now'))
    `, [24.0, 24.0/365], (err) => {
      if (err) {
        console.error('Gecikme faizi ekleme hatası:', err);
        reject(err);
        return;
      }
      console.log('Varsayilan mail sablonlari eklendi');
      console.log('Varsayilan ayarlar eklendi');
      resolve();
    });
  });
};

module.exports = {
  testConnection,
  initDatabase,
  insertDefaultData,
  db
}; 