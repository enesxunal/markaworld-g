/** Backup için güvenli tablo okuma (whitelist + eksik tablo toleransı) */

const ALLOWED_BACKUP_TABLES = new Set([
  'customers',
  'sales',
  'installments',
  'late_payment_fees'
]);

/** Production'da henüz olmayabilir; yoksa [] ile yedeklenir */
const OPTIONAL_BACKUP_TABLES = new Set(['late_payment_fees']);

function isMissingTableError(error) {
  if (!error) return false;
  const msg = String(error.message || '');
  return error.code === 'SQLITE_ERROR' && /no such table/i.test(msg);
}

/**
 * Whitelist'teki tablodan SELECT *.
 * Opsiyonel tablo yoksa [] döner; zorunlu tablo yoksa veya başka SQLite hatası varsa reject.
 */
function selectAllOrEmpty(db, tableName) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_BACKUP_TABLES.has(tableName)) {
      return reject(new Error('Invalid backup table'));
    }

    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (!err) return resolve(rows || []);
      if (isMissingTableError(err) && OPTIONAL_BACKUP_TABLES.has(tableName)) {
        return resolve([]);
      }
      return reject(err);
    });
  });
}

module.exports = {
  ALLOWED_BACKUP_TABLES,
  OPTIONAL_BACKUP_TABLES,
  isMissingTableError,
  selectAllOrEmpty
};
