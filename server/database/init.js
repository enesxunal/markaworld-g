const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Veritabanı tablolarını oluştur
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Kullanıcılar tablosu (admin paneli için)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Müşteriler tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          tc_no TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          password TEXT,
          birth_date DATE,
          address TEXT,
          credit_limit DECIMAL(10,2) DEFAULT 5000.00,
          current_debt DECIMAL(10,2) DEFAULT 0.00,
          status TEXT DEFAULT 'pending',
          email_verified INTEGER DEFAULT 0,
          verification_token TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Eksik sütunları ekle (varsa hata vermez)
      db.run(`ALTER TABLE customers ADD COLUMN email_verified INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE customers ADD COLUMN verification_token TEXT`, () => {});
      db.run(`ALTER TABLE customers ADD COLUMN password TEXT`, () => {});
      db.run(`ALTER TABLE customers ADD COLUMN kvkk_approved INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE customers ADD COLUMN contract_approved INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE customers ADD COLUMN electronic_approved INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE customers ADD COLUMN agreement_date DATETIME`, () => {});

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
          status TEXT DEFAULT 'pending_approval',
          approval_token TEXT,
          approved_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
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
          paid_date DATETIME,
          status TEXT DEFAULT 'unpaid',
          late_days INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sale_id) REFERENCES sales (id)
        )
      `);

      // Mail şablonları tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS email_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          subject TEXT NOT NULL,
          html_content TEXT NOT NULL,
          variables TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Mail geçmişi tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          template_name TEXT,
          subject TEXT,
          status TEXT,
          error_message TEXT,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `);

      // Sistem ayarları tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          description TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Müşteri sözleşme onayları tablosu
      db.run(`
        CREATE TABLE IF NOT EXISTS customer_agreements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          kvkk_approved INTEGER DEFAULT 0,
          contract_approved INTEGER DEFAULT 0,
          electronic_approved INTEGER DEFAULT 0,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Veritabanı tabloları başarıyla oluşturuldu');
          resolve();
        }
      });
    });
  });
};

// Varsayılan verileri ekle
const insertDefaultData = () => {
  return new Promise((resolve, reject) => {
    // Varsayılan faiz oranları
    const defaultSettings = [
      { key: 'interest_rate_3', value: '5', description: '3 taksit faiz oranı (%)' },
      { key: 'interest_rate_5', value: '10', description: '5 taksit faiz oranı (%)' },
      { key: 'limit_increase_rate', value: '20', description: 'Düzenli ödeme limit artış oranı (%)' },
      { key: 'limit_decrease_rate', value: '5', description: 'Gecikme limit azalış oranı (%)' },
      { key: 'reminder_days_before', value: '3', description: 'Ödeme hatırlatma gün sayısı' }
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)');
    
    defaultSettings.forEach(setting => {
      stmt.run(setting.key, setting.value, setting.description);
    });
    
    stmt.finalize((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Varsayılan ayarlar eklendi');
        resolve();
      }
    });
  });
};

// Varsayılan mail şablonları
const insertDefaultEmailTemplates = () => {
  return new Promise((resolve, reject) => {
    const templates = [
      {
        name: 'customer_registration',
        subject: 'Hesap Onayı - {{COMPANY_NAME}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #000000; margin: 0;">{{COMPANY_NAME}}</h1>
                <p style="color: #666666; margin: 10px 0 0 0;">Hoş Geldiniz!</p>
              </div>
              
              <h2 style="color: #000000;">Sayın {{CUSTOMER_NAME}},</h2>
              
              <p style="color: #333333; line-height: 1.6;">
                {{COMPANY_NAME}} ailesine hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{VERIFICATION_LINK}}" 
                   style="background-color: #000000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500; display: inline-block;">
                  HESABI ONAYLA
                </a>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #000000; margin-top: 0;">Hesap Onayından Sonra:</h3>
                <ul style="color: #333333; line-height: 1.6;">
                  <li>Taksitli alışveriş yapabilirsiniz</li>
                  <li>5.000₺ başlangıç kredi limitiniz aktif olur</li>
                  <li>Ödeme takip paneline erişim sağlarsınız</li>
                  <li>Email bildirimleri alırsınız</li>
                </ul>
              </div>
              
              <p style="color: #666666; font-size: 14px; margin-top: 30px;">
                Bu linki tıklayamıyorsanız, aşağıdaki adresi tarayıcınıza kopyalayın:<br>
                <span style="word-break: break-all;">{{VERIFICATION_LINK}}</span>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #666666; font-size: 12px; text-align: center; margin: 0;">
                {{COMPANY_NAME}} - Müşteri Hizmetleri<br>
                Bu mail otomatik olarak gönderilmiştir.
              </p>
            </div>
          </div>
        `,
        variables: 'CUSTOMER_NAME,VERIFICATION_LINK,COMPANY_NAME'
      },
      {
        name: 'sale_approval',
        subject: 'Taksitli Satış Onayı - {{COMPANY_NAME}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Sayın {{CUSTOMER_NAME}},</h2>
            <p>{{TOTAL_AMOUNT}}₺ tutarındaki alışverişiniz için {{INSTALLMENT_COUNT}} taksitli ödeme planı hazırlanmıştır.</p>
            <h3>Ödeme Detayları:</h3>
            <ul>
              <li>Toplam Tutar: {{TOTAL_AMOUNT}}₺</li>
              <li>Faizli Toplam: {{TOTAL_WITH_INTEREST}}₺</li>
              <li>Taksit Sayısı: {{INSTALLMENT_COUNT}}</li>
              <li>Aylık Ödeme: {{INSTALLMENT_AMOUNT}}₺</li>
              <li>İlk Ödeme Tarihi: {{FIRST_PAYMENT_DATE}}</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{APPROVAL_LINK}}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">ONAYLA</a>
            </div>
            <p><small>Bu onayı verdikten sonra taksit sistemi devreye girecektir.</small></p>
            <hr>
            <p><small>{{COMPANY_NAME}} - Müşteri Hizmetleri</small></p>
          </div>
        `,
        variables: 'CUSTOMER_NAME,TOTAL_AMOUNT,INSTALLMENT_COUNT,TOTAL_WITH_INTEREST,INSTALLMENT_AMOUNT,FIRST_PAYMENT_DATE,APPROVAL_LINK,COMPANY_NAME'
      },
      {
        name: 'payment_reminder',
        subject: 'Ödeme Hatırlatması - {{COMPANY_NAME}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Sayın {{CUSTOMER_NAME}},</h2>
            <p>{{DUE_DATE}} tarihinde {{AMOUNT}}₺ tutarında ödemeniz bulunmaktadır.</p>
            <p>Lütfen ödemenizi zamanında yaparak kredi limitinizin artmasını sağlayın.</p>
            <hr>
            <p><small>{{COMPANY_NAME}} - Müşteri Hizmetleri</small></p>
          </div>
        `,
        variables: 'CUSTOMER_NAME,DUE_DATE,AMOUNT,COMPANY_NAME'
      },
      {
        name: 'payment_overdue',
        subject: 'Geciken Ödeme Uyarısı - {{COMPANY_NAME}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Sayın {{CUSTOMER_NAME}},</h2>
            <p style="color: #d32f2f;">{{DUE_DATE}} tarihindeki {{AMOUNT}}₺ tutarındaki ödemeniz gecikmiştir.</p>
            <p>Gecikme nedeniyle kredi limitiniz düşürülmüştür. Ödemenizi en kısa sürede yapmanızı rica ederiz.</p>
            <p><strong>Mevcut Kredi Limitiniz: {{CURRENT_LIMIT}}₺</strong></p>
            <hr>
            <p><small>{{COMPANY_NAME}} - Müşteri Hizmetleri</small></p>
          </div>
        `,
        variables: 'CUSTOMER_NAME,DUE_DATE,AMOUNT,CURRENT_LIMIT,COMPANY_NAME'
      },
      {
        name: 'customer_activation',
        subject: 'Hesabınız Aktifleştirildi - {{COMPANY_NAME}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #000000; margin: 0;">{{COMPANY_NAME}}</h1>
                <div style="font-size: 48px; margin: 20px 0;">🎉</div>
              </div>
              
              <h2 style="color: #4CAF50; text-align: center;">Hesabınız Başarıyla Aktifleştirildi!</h2>
              
              <p style="color: #333333; line-height: 1.6;">
                <strong>Sayın {{CUSTOMER_NAME}},</strong>
              </p>
              
              <p style="color: #333333; line-height: 1.6;">
                Tebrikler! Tüm sözleşmeleri onayladınız ve hesabınız başarıyla aktifleştirildi. 
                Artık {{COMPANY_NAME}}'da taksitli alışveriş yapabilir ve müşteri panelinize erişebilirsiniz.
              </p>
              
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                <h3 style="color: #2e7d32; margin-top: 0;">Hesap Bilgileriniz:</h3>
                <ul style="color: #333333; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Kredi Limitiniz:</strong> {{CREDIT_LIMIT}}₺</li>
                  <li><strong>Hesap Durumu:</strong> Aktif</li>
                  <li><strong>Email:</strong> {{CUSTOMER_EMAIL}}</li>
                  <li><strong>Taksit Seçenekleri:</strong> 3 ve 5 taksit</li>
                </ul>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #000000; margin-top: 0;">Artık Neler Yapabilirsiniz:</h3>
                <ul style="color: #333333; line-height: 1.6;">
                  <li>✅ Taksitli alışveriş yapabilirsiniz</li>
                  <li>✅ Ödeme planlarınızı takip edebilirsiniz</li>
                  <li>✅ Düzenli ödemelerle limitinizi artırabilirsiniz</li>
                  <li>✅ Email bildirimleri alabilirsiniz</li>
                  <li>✅ Müşteri panelinize erişebilirsiniz</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{FRONTEND_URL}}/customer-login" 
                   style="background-color: #000000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500; display: inline-block;">
                  GİRİŞ YAP
                </a>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>Önemli:</strong> Giriş bilgileriniz email adresiniz ve kayıt sırasında belirlediğiniz şifredir.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #666666; font-size: 12px; text-align: center; margin: 0;">
                {{COMPANY_NAME}} - Müşteri Hizmetleri<br>
                Bu mail otomatik olarak gönderilmiştir.<br>
                Sorularınız için: info@markaworld.com.tr
              </p>
            </div>
          </div>
        `,
        variables: 'CUSTOMER_NAME,CUSTOMER_EMAIL,CREDIT_LIMIT,COMPANY_NAME,FRONTEND_URL'
      }
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO email_templates (name, subject, html_content, variables) VALUES (?, ?, ?, ?)');
    
    templates.forEach(template => {
      stmt.run(template.name, template.subject, template.html_content, template.variables);
    });
    
    stmt.finalize((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Varsayılan mail şablonları eklendi');
        resolve();
      }
    });
  });
};

// Test müşterisi ekle
const testPassword = bcrypt.hashSync('123456', 10);

db.run(`
  INSERT OR IGNORE INTO customers (id, name, tc_no, phone, email, address, credit_limit, status, email_verified, password)
  VALUES (1, 'Test Müşteri', '12345678901', '05551234567', 'test@example.com', 'Test Adres', 5000, 'active', 1, ?)
`, [testPassword]);

// Eğer test kullanıcısı zaten varsa şifresini güncelle
db.run(`
  UPDATE customers SET password = ?, email_verified = 1 WHERE id = 1 AND password IS NULL
`, [testPassword]);

// İkinci test kullanıcısı ekle
const test2Password = bcrypt.hashSync('123456', 10);

db.run(`
  INSERT OR IGNORE INTO customers (id, name, tc_no, phone, email, address, credit_limit, status, email_verified, password)
  VALUES (2, 'Test Müşteri 2', '98765432109', '05559876543', 'test2@example.com', 'Test Adres 2', 7500, 'active', 1, ?)
`, [test2Password]);

// Üçüncü test kullanıcısı ekle - basit şifre
const test3Password = bcrypt.hashSync('test123', 10);

db.run(`
  INSERT OR IGNORE INTO customers (id, name, tc_no, phone, email, address, credit_limit, status, email_verified, password)
  VALUES (3, 'Ahmet Yılmaz', '11122233344', '05551112233', 'ahmet@test.com', 'İstanbul Test Mahallesi', 10000, 'active', 1, ?)
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
`);

console.log('✅ Veritabanı başarıyla başlatıldı!');

module.exports = {
  db,
  initDatabase,
  insertDefaultData,
  insertDefaultEmailTemplates
};