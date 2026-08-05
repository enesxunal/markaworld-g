const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  isAuthMailError,
  isRateLimitError,
  shouldStopFallback,
  shouldAbortBulk,
  publicMailErrorMessage,
  wrapMailError
} = require('../utils/emailSendPolicy');

describe('email send policy — no retry loops on auth', () => {
  it('flags invalid_grant as auth error', () => {
    assert.equal(isAuthMailError(new Error('invalid_grant')), true);
    assert.equal(shouldStopFallback(new Error('invalid_grant')), true);
  });

  it('flags SMTP EAUTH as auth error', () => {
    assert.equal(isAuthMailError(new Error('Error: Invalid login: 535-5.7.8')), true);
    assert.equal(shouldAbortBulk(new Error('EAUTH')), true);
  });

  it('flags Too many login attempts as rate limit', () => {
    const err = new Error('454 4.7.0 Too many login attempts');
    assert.equal(isRateLimitError(err), true);
    assert.equal(shouldStopFallback(err), true);
    assert.equal(shouldAbortBulk(err), true);
  });

  it('does not treat generic network error as auth', () => {
    const err = new Error('connect ETIMEDOUT');
    assert.equal(isAuthMailError(err), false);
    assert.equal(isRateLimitError(err), false);
    assert.equal(shouldStopFallback(err), false);
  });

  it('wrapMailError strips technical secrets and sets abort code', () => {
    const wrapped = wrapMailError(new Error('invalid_grant: Token has been expired or revoked'));
    assert.equal(wrapped.code, 'MAIL_AUTH');
    assert.match(wrapped.message, /yapılandırma hatası/i);
    assert.doesNotMatch(wrapped.message, /refresh_token|client_secret|Bearer/i);
    assert.equal(shouldAbortBulk(wrapped), true);
  });

  it('public message for rate limit has no credentials', () => {
    const msg = publicMailErrorMessage(new Error('454 4.7.0 Too many login attempts, please try again later'));
    assert.match(msg, /kısıtladı/i);
    assert.doesNotMatch(msg, /password|secret|token=/i);
  });

  it('fallback at most once conceptually: auth stops fallback', () => {
    // Policy: auth → stop; network → may continue (caller decides)
    assert.equal(shouldStopFallback(new Error('invalid_grant')), true);
    assert.equal(shouldStopFallback(new Error('ECONNRESET')), false);
  });
});
