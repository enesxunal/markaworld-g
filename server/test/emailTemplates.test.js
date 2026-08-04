const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

describe('BUG-005 email_templates idempotent init', () => {
  it('keeps custom template after second CREATE + INSERT OR IGNORE', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mw-tpl-'));
    const dbPath = path.join(dir, 'test.sqlite');

    function open() {
      return new sqlite3.Database(dbPath);
    }

    function run(db, sql, params = []) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    function get(db, sql, params = []) {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    function all(db, sql, params = []) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }

    async function initializeOnce(db) {
      await run(
        db,
        `CREATE TABLE IF NOT EXISTS email_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          subject TEXT NOT NULL,
          html TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );
      await run(
        db,
        `INSERT OR IGNORE INTO email_templates (name, subject, html) VALUES (?, ?, ?)`,
        ['welcome', 'Default Subject', '<p>default</p>']
      );
    }

    const db1 = open();
    await initializeOnce(db1);
    await run(
      db1,
      `INSERT INTO email_templates (name, subject, html) VALUES (?, ?, ?)`,
      ['custom_campaign', 'Özel Kampanya', '<p>kullanıcı şablonu</p>']
    );
    await run(
      db1,
      `UPDATE email_templates SET subject = ?, html = ? WHERE name = ?`,
      ['Özelleştirilmiş Welcome', '<p>özel</p>', 'welcome']
    );
    db1.close();

    const db2 = open();
    await initializeOnce(db2);
    await initializeOnce(db2);

    const custom = await get(db2, `SELECT * FROM email_templates WHERE name = ?`, [
      'custom_campaign'
    ]);
    assert.ok(custom);
    assert.equal(custom.subject, 'Özel Kampanya');

    const welcome = await get(db2, `SELECT * FROM email_templates WHERE name = ?`, ['welcome']);
    assert.equal(welcome.subject, 'Özelleştirilmiş Welcome');
    assert.equal(welcome.html, '<p>özel</p>');

    const rows = await all(db2, `SELECT name FROM email_templates ORDER BY name`);
    assert.deepEqual(
      rows.map((r) => r.name),
      ['custom_campaign', 'welcome']
    );

    db2.close();
  });
});
