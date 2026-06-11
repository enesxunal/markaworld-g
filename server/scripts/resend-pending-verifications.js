#!/usr/bin/env node
/**
 * Bekleyen müşterilere doğrulama maili gönder
 * Kullanım: node scripts/resend-pending-verifications.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initDatabase } = require('../database/init');
const verificationService = require('../services/verificationService');

async function main() {
  await initDatabase();
  const pending = await verificationService.listPendingVerification();
  console.log(`Bekleyen müşteri: ${pending.length}`);
  if (pending.length === 0) {
    process.exit(0);
  }

  const results = await verificationService.resendAllPendingVerifications({ delayMs: 500 });
  console.log(`Gönderildi: ${results.sent}, Başarısız: ${results.failed}`);
  if (results.errors.length) {
    console.log('Hatalar:', results.errors.slice(0, 5));
  }
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('HATA:', err.message);
  process.exit(1);
});
