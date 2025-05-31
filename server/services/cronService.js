const cron = require('node-cron');
const { db } = require('../database/init');
const emailService = require('./emailService');

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

    console.log('Cron servisi başlatıldı - Günlük kontroller saat 12:00\'da çalışacak');
  }

  async dailyChecks() {
    try {
      await this.checkUpcomingPayments();
      await this.checkOverduePayments();
      await this.updateLateDays();
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

          const newLimit = customer.credit_limit * (1 - decreaseRate / 100);

          db.run(
            'UPDATE customers SET credit_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newLimit, customerId],
            (err) => {
              if (err) reject(err);
              else {
                console.log(`Müşteri ${customerId} limit düşürüldü: ${customer.credit_limit} -> ${newLimit}`);
                resolve();
              }
            }
          );
        });
      });
    });
  }

  // Manuel olarak günlük kontrolleri çalıştır (test için)
  async runDailyChecksNow() {
    console.log('Manuel günlük kontroller başlatılıyor...');
    await this.dailyChecks();
  }
}

module.exports = new CronService(); 