const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const express = require('express');
const http = require('http');

/**
 * Admin login davranışını izole Express app ile test eder.
 * Gerçek production DB / secret kullanılmaz.
 */
describe('SEC-002 admin auth', () => {
  let server;
  let baseUrl;
  let passwordHash;
  const username = 'testadmin';
  const password = 'TestPass-Phase1!';

  before(async () => {
    passwordHash = await bcrypt.hash(password, 10);
    process.env.ADMIN_USERNAME = username;
    process.env.ADMIN_PASSWORD_HASH = passwordHash;
    process.env.JWT_SECRET = 'phase1-test-jwt-secret-not-for-prod';
    delete process.env.ADMIN_PASSWORD;

    // Modül cache temizle — env ile yüklensin
    delete require.cache[require.resolve('../routes/admin')];
    delete require.cache[require.resolve('../middleware/auth')];

    const adminRouter = require('../routes/admin');
    const app = express();
    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    app.use(express.json());
    app.use('/api/admin', adminRouter);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  async function login(body) {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  }

  it('rejects wrong password with generic message', async () => {
    const { status, data } = await login({ username, password: 'wrong-password' });
    assert.equal(status, 401);
    assert.equal(data.success, false);
    assert.match(data.error, /hatalı/i);
    assert.equal(data.token, undefined);
  });

  it('rejects missing credentials config (invalid hash)', async () => {
    const prev = process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD_HASH = 'not-a-hash';
    delete require.cache[require.resolve('../routes/admin')];
    // Aynı sunucudaki router env'i runtime okuyor — getAdminAuthConfig her istekte okur
    const { status, data } = await login({ username, password });
    process.env.ADMIN_PASSWORD_HASH = prev;
    assert.equal(status, 503);
    assert.equal(data.success, false);
    assert.doesNotMatch(JSON.stringify(data), /password|hash|secret/i);
  });

  it('accepts correct hash and returns JWT', async () => {
    process.env.ADMIN_PASSWORD_HASH = passwordHash;
    const { status, data } = await login({ username, password });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(typeof data.token, 'string');
    assert.ok(data.token.length > 20);
    assert.equal(data.admin.role, 'admin');
  });

  it('rate limits repeated failures with 429', async () => {
    // Ayrı kullanıcı adı ile pencereyi izole et
    const u = `ratelimit-${Date.now()}`;
    let lastStatus = 0;
    for (let i = 0; i < 6; i += 1) {
      const { status } = await login({ username: u, password: 'nope' });
      lastStatus = status;
    }
    assert.equal(lastStatus, 429);
  });
});
