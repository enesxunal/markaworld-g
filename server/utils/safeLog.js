/**
 * Operasyonel loglarda kişisel/hassas veriyi maskelemek için yardımcılar.
 * Gerçek secret / token / şifre asla loglanmamalı.
 */

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[redacted]';
  const at = email.indexOf('@');
  if (at < 1) return '[redacted]';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function maskPhone(phone) {
  if (phone == null) return '[redacted]';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

function maskTcNo() {
  return '***********';
}

/** Geliştirme ortamında debug; production'da no-op. */
function debugLog(...args) {
  if (!isProduction()) {
    console.log(...args);
  }
}

module.exports = {
  isProduction,
  maskEmail,
  maskPhone,
  maskTcNo,
  debugLog
};
