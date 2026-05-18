/**
 * SQLite datetime('now') ile karşılaştırılabilir format: YYYY-MM-DD HH:MM:SS
 */
function toSqliteDatetime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function hoursFromNow(hours) {
  return toSqliteDatetime(new Date(Date.now() + hours * 60 * 60 * 1000));
}

module.exports = { toSqliteDatetime, hoursFromNow };
