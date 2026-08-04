const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const helmet = require('helmet');

describe('SEC-006 security headers', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        hsts: false
      })
    );
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK' });
    });

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('sets baseline headers and hides X-Powered-By', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('x-frame-options') || res.headers.get('content-security-policy'));
    assert.ok(res.headers.get('referrer-policy'));
  });
});
