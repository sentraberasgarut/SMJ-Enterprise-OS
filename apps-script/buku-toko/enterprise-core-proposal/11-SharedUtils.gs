// ============================================================================
// Shared Utils — Enterprise Core (proposal, not deployed)
// ============================================================================
// Small formatting/sheet helpers used across every other service file.
// Moved verbatim from the live Code.gs.
// ============================================================================

function _sheet(ss, nama) {
  var sh = ss.getSheetByName(nama);
  if (!sh) sh = ss.insertSheet(nama);
  return sh;
}

function _headerStyle(sh, nCol) {
  sh.getRange(1, 1, 1, nCol).setFontWeight('bold')
    .setBackground('#4F6042').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
}

function _tglString(d) {
  if (!(d instanceof Date)) {
    if (d === '' || d === null || d === undefined) return '';
    d = new Date(d);
    if (isNaN(d.getTime())) return '';
  }
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** Angka dengan titik ribuan, tanpa "Rp". Contoh: 387.500 */
function _angkaTeks(n) {
  return Number(n || 0).toLocaleString('id-ID');
}

/** Angka dengan Rp dan titik ribuan. Contoh: Rp387.500 */
function _rp(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
