/**
 * Mail gönderim politikası — auth/rate-limit hatalarında tekrar login'i keser.
 * Secret içermez; saf yardımcılar.
 */

function errorMessage(err) {
  return (err && err.message) || String(err || '');
}

function isAuthMailError(err) {
  if (err && (err.code === 'MAIL_AUTH' || err.code === 'EAUTH')) return true;
  return /invalid_grant|EAUTH|authentication|unauthorized|expired|Invalid login/i.test(
    errorMessage(err)
  );
}

function isRateLimitError(err) {
  if (err && err.code === 'MAIL_RATE_LIMIT') return true;
  return /454|Too many login attempts|rate.?limit|try again later|çok fazla giriş/i.test(
    errorMessage(err)
  );
}

/** Auth veya Google rate-limit: fallback / retry yapma */
function shouldStopFallback(err) {
  return isAuthMailError(err) || isRateLimitError(err);
}

/** Toplu gönderimde kalan alıcıları iptal et */
function shouldAbortBulk(err) {
  return shouldStopFallback(err);
}

/**
 * Kullanıcıya güvenli mesaj (secret/token sızdırmaz).
 */
function publicMailErrorMessage(err) {
  if (isRateLimitError(err)) {
    return (
      'Google geçici olarak mail gönderimini kısıtladı (çok fazla giriş denemesi). ' +
      '30–60 dakika bekleyip tekrar deneyin.'
    );
  }
  if (/invalid_grant/i.test(errorMessage(err))) {
    return (
      'Mail servisi yapılandırma hatası: Gmail OAuth token geçersiz veya süresi dolmuş. ' +
      'Yenileme token’ını yenileyin veya SMTP app password kullanın.'
    );
  }
  if (isAuthMailError(err)) {
    return 'Mail servisi yapılandırma hatası: kimlik doğrulama başarısız. SMTP/OAuth ayarlarını kontrol edin.';
  }
  return 'Mail gönderilemedi.';
}

/** Secret sızdırmayan, abort/fallback için kodlu hata */
function wrapMailError(err) {
  const wrapped = new Error(publicMailErrorMessage(err));
  if (isRateLimitError(err)) wrapped.code = 'MAIL_RATE_LIMIT';
  else if (isAuthMailError(err)) wrapped.code = 'MAIL_AUTH';
  else wrapped.code = 'MAIL_SEND_FAILED';
  return wrapped;
}

module.exports = {
  isAuthMailError,
  isRateLimitError,
  shouldStopFallback,
  shouldAbortBulk,
  publicMailErrorMessage,
  wrapMailError
};
