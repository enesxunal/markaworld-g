const cron = require('node-cron');
const { db } = require('../database/init');
const emailService = require('./emailService');
const backupService = require('./backupService');

class CronService {
  constructor() {
    this.initCronJobs();
  }

  initCronJobs() {
    // Her gün saat 12:00'da çalış
    cron.schedule('0 12 * * *', () => {
      console.log('Günlük kontroller başlatılıyor...');
      this.dailyChecks();
    });

    // Her gün saat 00:00'da çalışacak işlemler
    const dailyTasks = cron.schedule('0 0 * * *', async () => {
      console.log('Günlük görevler başlatılıyor...');

      try {
        // Otomatik yedek al
        const backup = await backupService.createBackup();
        if (backup.success) {
          console.log(`Yedekleme başarılı: ${backup.filename}`);
        } else {
          console.error('Yedekleme hatası:', backup.error);
        }

        // Gecikmiş ödemeleri kontrol et
        await this.checkOverduePayments();
      } catch (error) {
        console.error('Günlük görev hatası:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Istanbul"
    });

    console.log('Cron servisi başlatıldı - Günlük kontroller saat 12:00\'da çalışacak');
  }

  async dailyChecks() {
    try {
      await this.checkUpcomingPayments();
      await this.checkOverduePayments();
      await this.updateLateDays();
      await this.calculateLateFees();
      console.log('Günlük kontroller tamamlandı');
    } catch (error) {
      console.error('Günlük kontroller sırasında hata:', error);
    }
  }

  // Yaklaşan ödemeleri kontrol et ve hatırlatma gönder
  async checkUpcomingPayments() {
    return new Promise((resolve, reject) => {
      // Ayarlardan hatırlatma gün sayısını al
      db.get('SELECT value FROM settings WHERE key = ?', ['reminder_days_before'], (err, setting) => {
        if (err) {
          reject(err);
          return;
        }

        const reminderDays = setting ? parseInt(setting.value) : 3;
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + reminderDays);
        const reminderDateStr = reminderDate.toISOString().split('T')[0];

        // Yaklaşan ödemeleri bul
        const query = `
          SELECT i.*, c.name, c.email, c.id as customer_id
          FROM installments i
          JOIN sales s ON i.sale_id = s.id
          JOIN customers c ON s.customer_id = c.id
          WHERE i.due_date = ? 
          AND i.status = 'unpaid'
          AND s.status = 'approved'
          AND c.email IS NOT NULL
        `;

        db.all(query, [reminderDateStr], async (err, installments) => {
          if (err) {
            reject(err);
            return;
          }

          console.log(`${installments.length} yaklaşan ödeme bulundu`);

          for (const installment of installments) {
            try {
              const customer = {
                id: installment.customer_id,
                name: installment.name,
                email: installment.email
              };

              await emailService.sendPaymentReminderEmail(customer, installment);
              console.log(`Hatırlatma maili gönderildi: ${customer.name}`);
            } catch (error) {
              console.error(`Mail gönderme hatası (${installment.name}):`, error);
            }
          }

          resolve();
        });
      });
    });
  }

  // Geciken ödemeleri kontrol et
  async checkOverduePayments() {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];

      // Geciken ödemeleri bul
      const query = `
        SELECT i.*, c.name, c.email, c.id as customer_id, c.credit_limit
        FROM installments i
        JOIN sales s ON i.sale_id = s.id
        JOIN customers c ON s.customer_id = c.id
        WHERE i.due_date < ? 
        AND i.status = 'unpaid'
        AND s.status = 'approved'
        AND c.email IS NOT NULL
      `;

      db.all(query, [today], async (err, overdueInstallments) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`${overdueInstallments.length} geciken ödeme bulundu`);

        for (const installment of overdueInstallments) {
          try {
            // Gecikme durumunu güncelle
            await this.updateInstallmentStatus(installment.id, 'overdue');

            // Müşteri limitini düşür
            await this.decreaseCreditLimit(installment.customer_id);

            // Gecikme uyarı maili gönder
            const customer = {
              id: installment.customer_id,
              name: installment.name,
              email: installment.email,
              credit_limit: installment.credit_limit
            };

            await emailService.sendOverduePaymentEmail(customer, installment);
            console.log(`Gecikme uyarı maili gönderildi: ${customer.name}`);
          } catch (error) {
            console.error(`Gecikme işlemi hatası (${installment.name}):`, error);
          }
        }

        resolve();
      });
    });
  }

  // Gecikme günlerini güncelle
  async updateLateDays() {
    return new Promise((resolve, reject) => {
      const today = new Date();

      const query = `
        SELECT id, due_date
        FROM installments
        WHERE status IN ('unpaid', 'overdue')
        AND due_date < ?
      `;

      db.all(query, [today.toISOString().split('T')[0]], (err, installments) => {
        if (err) {
          reject(err);
          return;
        }

        installments.forEach(installment => {
          const dueDate = new Date(installment.due_date);
          const lateDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

          db.run(
            'UPDATE installments SET late_days = ? WHERE id = ?',
            [lateDays, installment.id]
          );
        });

        console.log(`${installments.length} taksit için gecikme günleri güncellendi`);
        resolve();
      });
    });
  }

  // Taksit durumunu güncelle
  updateInstallmentStatus(installmentId, status) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE installments SET status = ? WHERE id = ?',
        [status, installmentId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Kredi limitini düşür
  decreaseCreditLimit(customerId) {
    return new Promise((resolve, reject) => {
      // Ayarlardan azalış oranını al
      db.get('SELECT value FROM settings WHERE key = ?', ['limit_decrease_rate'], (err, setting) => {
        if (err) {
          reject(err);
          return;
        }

        const decreaseRate = setting ? parseFloat(setting.value) : 5;

        // Müşterinin mevcut limitini al ve azalt
        db.get('SELECT credit_limit FROM customers WHERE id = ?', [customerId], (err, customer) => {
          if (err) {
            reject(err);
            return;
          }

          // Yeni limit hesapla
          let newLimit = customer.credit_limit * (1 - decreaseRate / 100);
          
          // Limiti güncelle
          db.run('UPDATE customers SET credit_limit = ? WHERE id = ?', [newLimit, customerId], (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      });
    });
  }

  // Gecikme faizi hesapla
  async calculateLateFees() {
    return new Promise((resolve, reject) => {
      // Güncel gecikme faizi oranını al
      db.get(`
        SELECT annual_rate, daily_rate 
        FROM late_payment_interest 
        WHERE effective_from <= date('now') 
        ORDER BY effective_from DESC LIMIT 1
      `, [], (err, interestRate) => {
        if (err) {
          reject(err);
          return;
        }

        if (!interestRate) {
          console.log('Gecikme faizi oranı bulunamadı');
          resolve();
          return;
        }

        // Geciken ödemeleri bul
        const query = `
          SELECT i.*, s.customer_id
          FROM installments i
          JOIN sales s ON i.sale_id = s.id
          WHERE i.status = 'overdue'
          AND i.late_days > 0
          AND i.late_fee_amount = 0
        `;

        db.all(query, [], async (err, installments) => {
          if (err) {
            reject(err);
            return;
          }

          console.log(`${installments.length} geciken ödeme için faiz hesaplanacak`);

          for (const installment of installments) {
            try {
              // Gecikme faizini hesapla
              const lateFeeAmount = this.calculateLateFeeAmount(
                installment.amount,
                interestRate.daily_rate,
                installment.late_days
              );

              // Gecikme faizini kaydet
              await this.saveLatePaymentFee(installment.id, lateFeeAmount, installment.late_days);

              // Taksit kaydını güncelle
              await this.updateInstallmentWithLateFee(installment.id, lateFeeAmount);

              console.log(`Gecikme faizi hesaplandı: Taksit #${installment.id}, Tutar: ${lateFeeAmount}`);
            } catch (error) {
              console.error(`Gecikme faizi hesaplama hatası (Taksit #${installment.id}):`, error);
            }
          }

          resolve();
        });
      });
    });
  }

  // Gecikme faizi tutarını hesapla
  calculateLateFeeAmount(installmentAmount, dailyRate, lateDays) {
    const lateFee = installmentAmount * (dailyRate / 100) * lateDays;
    return Math.round(lateFee * 100) / 100; // 2 decimal places
  }

  // Gecikme faizini kaydet
  saveLatePaymentFee(installmentId, amount, lateDays) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO late_payment_fees (
          installment_id, late_days, interest_amount
        ) VALUES (?, ?, ?)
      `, [installmentId, lateDays, amount], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Taksit kaydını gecikme faizi ile güncelle
  updateInstallmentWithLateFee(installmentId, lateFeeAmount) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE installments 
        SET late_fee_amount = ?
        WHERE id = ?
      `, [lateFeeAmount, installmentId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Manuel olarak günlük kontrolleri çalıştır (test için)
  async runDailyChecksNow() {
    console.log('Manuel günlük kontroller başlatılıyor...');
    await this.dailyChecks();
  }
}

// Tek bir instance oluştur ve export et
const cronService = new CronService();
module.exports = cronService; 