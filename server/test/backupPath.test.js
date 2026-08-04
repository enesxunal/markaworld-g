const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  resolveSafeBackupPath,
  isInvalidBackupNameError,
  BACKUP_FILENAME_RE
} = require('../utils/backupPath');

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
});
