const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { maskEmail, maskPhone, maskTcNo } = require('../utils/safeLog');

describe('SEC-003/010 safe log helpers', () => {
  it('masks email', () => {
    assert.equal(maskEmail('ab@example.com'), 'ab***@example.com');
    assert.equal(maskEmail('a@example.com'), 'a***@example.com');
  });

  it('masks phone to last 4', () => {
    assert.equal(maskPhone('05551234567'), '***4567');
  });

  it('never reveals tc', () => {
    assert.equal(maskTcNo('12345678901'), '***********');
  });
});
