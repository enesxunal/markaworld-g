const crypto = require('crypto');
const { db } = require('../database/init');
const emailService = require('./emailService');
const { hoursFromNow } = require('../utils/datetime');

const getCustomerByEmail = (email) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM customers WHERE lower(email) = lower(?) AND status != 'active'`,
      [email.trim()],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });

const getCustomerById = (id) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM customers WHERE id = ? AND status != 'active'`,
      [id],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });

const listPendingVerification = () =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, email, status, email_verified, created_at
       FROM customers
       WHERE status != 'active'
         AND IFNULL(email_verified, 0) = 0
         AND email IS NOT NULL
         AND trim(email) != ''
       ORDER BY created_at ASC`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });

async function sendVerificationEmailToCustomer(customer) {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = hoursFromNow(24);

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE customers
       SET verification_token = ?, verification_token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [verificationToken, expiresAt, customer.id],
      (err) => (err ? reject(err) : resolve())
    );
  });

  await emailService.sendCustomerRegistrationEmail(
    { id: customer.id, name: customer.name, email: customer.email },
    verificationToken
  );

  return { email: customer.email, verificationToken };
}

async function resendVerificationByEmail(email) {
  const customer = await getCustomerByEmail(email);
  if (!customer) {
    return { found: false, sent: false };
  }
  await sendVerificationEmailToCustomer(customer);
  return { found: true, sent: true, email: customer.email };
}

async function resendVerificationById(customerId) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    return { found: false, sent: false };
  }
  await sendVerificationEmailToCustomer(customer);
  return { found: true, sent: true, email: customer.email };
}

async function resendAllPendingVerifications({ delayMs = 400 } = {}) {
  const customers = await listPendingVerification();
  const results = { total: customers.length, sent: 0, failed: 0, errors: [] };

  for (const customer of customers) {
    try {
      await sendVerificationEmailToCustomer(customer);
      results.sent += 1;
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push({ email: customer.email, error: err.message });
    }
  }

  return results;
}

module.exports = {
  listPendingVerification,
  resendVerificationByEmail,
  resendVerificationById,
  resendAllPendingVerifications,
  sendVerificationEmailToCustomer
};
