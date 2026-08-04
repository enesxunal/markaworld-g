const fs = require('fs');
const path = require('path');

/** createBackup() ile üretilen isim: backup_<ISO-with-dashes>.xml.gz */
const BACKUP_FILENAME_RE = /^backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.xml\.gz$/;

/**
 * Kullanıcıdan gelen filename'i backup klasörü içinde güvenli mutlak yola çevirir.
 * Geçersiz isimde code=INVALID_BACKUP_NAME fırlatır (yol sızdırılmaz).
 */
function resolveSafeBackupPath(filename, backupDir) {
  const err = new Error('Invalid backup filename');
  err.code = 'INVALID_BACKUP_NAME';

  if (typeof filename !== 'string' || !filename) {
    throw err;
  }

  if (
    filename.includes('\0') ||
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    throw err;
  }

  const base = path.basename(filename);
  if (base !== filename) {
    throw err;
  }

  if (!BACKUP_FILENAME_RE.test(base)) {
    throw err;
  }

  const root = path.resolve(backupDir);
  const resolved = path.resolve(root, base);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;

  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw err;
  }

  if (fs.existsSync(resolved)) {
    let realFile;
    let realRoot;
    try {
      realFile = fs.realpathSync(resolved);
      realRoot = fs.realpathSync(root);
    } catch {
      throw err;
    }
    const realRootWithSep = realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep;
    if (realFile !== realRoot && !realFile.startsWith(realRootWithSep)) {
      throw err;
    }
  }

  return resolved;
}

function isInvalidBackupNameError(error) {
  return error && error.code === 'INVALID_BACKUP_NAME';
}

module.exports = {
  BACKUP_FILENAME_RE,
  resolveSafeBackupPath,
  isInvalidBackupNameError
};
