#!/usr/bin/env node
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const {
  resolveSafeBackupPath,
  isInvalidBackupNameError,
  BACKUP_FILENAME_RE
} = require('../utils/backupPath');
const { selectAllOrEmpty, isMissingTableError } = require('../utils/backupFetch');

describe('SEC-004 backup path traversal', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mw-backup-'));
  const backupDir = path.join(tmpRoot, 'backups');
  fs.mkdirSync(backupDir);

  const validName = 'backup_2026-08-04T12-00-00-000Z.xml.gz';
  fs.writeFileSync(path.join(backupDir, validName), 'test');

  it('accepts normal backup filename', () => {
    const resolved = resolveSafeBackupPath(validName, backupDir);
    assert.equal(resolved, path.resolve(backupDir, validName));
  });

  it('rejects path traversal with ../', () => {
    assert.throws(
      () => resolveSafeBackupPath('../../etc/passwd', backupDir),
      isInvalidBackupNameError
    );
  });

  it('rejects windows-style traversal', () => {
    assert.throws(
      () => resolveSafeBackupPath('..\\..\\file', backupDir),
      isInvalidBackupNameError
    );
  });

  it('rejects absolute paths', () => {
    assert.throws(
      () => resolveSafeBackupPath('/etc/passwd', backupDir),
      isInvalidBackupNameError
    );
  });

  it('rejects URL-encoded traversal basename', () => {
    assert.throws(
      () => resolveSafeBackupPath('..%2F..%2Fpasswd', backupDir),
      isInvalidBackupNameError
    );
  });

  it('rejects invalid extension', () => {
    assert.throws(
      () => resolveSafeBackupPath('backup_2026-08-04T12-00-00-000Z.xml', backupDir),
      isInvalidBackupNameError
    );
  });

  it('rejects names that basename would change', () => {
    assert.throws(
      () => resolveSafeBackupPath(`subdir/${validName}`, backupDir),
      isInvalidBackupNameError
    );
  });

  it('regex matches generator format', () => {
    assert.equal(BACKUP_FILENAME_RE.test(validName), true);
    assert.equal(BACKUP_FILENAME_RE.test('evil.txt'), false);
  });

  it('rejects symlink that escapes backup root', () => {
    const outside = path.join(tmpRoot, 'secret.txt');
    fs.writeFileSync(outside, 'secret');
    const linkName = 'backup_2026-08-04T12-00-00-001Z.xml.gz';
    const linkPath = path.join(backupDir, linkName);
    try {
      fs.symlinkSync(outside, linkPath);
    } catch (err) {
      // Windows / restricted env
      if (err.code === 'EPERM' || err.code === 'EACCES') return;
      throw err;
    }
    assert.throws(() => resolveSafeBackupPath(linkName, backupDir), isInvalidBackupNameError);
  });
});

describe('backup fetch missing table resilience', () => {
  it('detects missing table errors', () => {
    const err = new Error('SQLITE_ERROR: no such table: late_payment_fees');
    err.code = 'SQLITE_ERROR';
    assert.equal(isMissingTableError(err), true);
  });

  it('returns empty array when optional late_payment_fees missing', async () => {
    const dbPath = path.join(os.tmpdir(), `mw-bf-${Date.now()}.sqlite`);
    const db = new sqlite3.Database(dbPath);

    const fees = await selectAllOrEmpty(db, 'late_payment_fees');
    assert.deepEqual(fees, []);

    await new Promise((resolve) => db.close(resolve));
    fs.unlinkSync(dbPath);
  });

  it('rejects when required table is missing', async () => {
    const dbPath = path.join(os.tmpdir(), `mw-bf-req-${Date.now()}.sqlite`);
    const db = new sqlite3.Database(dbPath);

    await assert.rejects(() => selectAllOrEmpty(db, 'customers'));

    await new Promise((resolve) => db.close(resolve));
    fs.unlinkSync(dbPath);
  });

  it('rejects non-whitelisted table names', async () => {
    const dbPath = path.join(os.tmpdir(), `mw-bf2-${Date.now()}.sqlite`);
    const db = new sqlite3.Database(dbPath);
    await assert.rejects(() => selectAllOrEmpty(db, 'users'));
    await new Promise((resolve) => db.close(resolve));
    fs.unlinkSync(dbPath);
  });
});
