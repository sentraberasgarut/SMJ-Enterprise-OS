// ============================================================================
// Operational Event Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// LOG_AKSES is already, today, an event log — every MASUK/BARANG KELUAR/
// KONFIRMASI TERIMA/TUTUP SHIFT action appends a row here. This service
// boundary names that fact explicitly; the two functions below are moved
// verbatim, unchanged, from the live Code.gs.
// ============================================================================

function _catatAkses(orang, aksi, ket) {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG_AKSES');
    if (sh) sh.appendRow([new Date(), _tglString(new Date()),
                          orang.nama, orang.peran, aksi, ket || '']);
  } catch (e) { /* jangan sampai log menggagalkan pekerjaan utama */ }
}

function _bacaHari(sh, nCol, hari) {
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var lebar = Math.max(sh.getLastColumn(), nCol);
  var mulai = Math.max(2, lastRow - BATAS_BACA + 1);
  var jumlah = lastRow - mulai + 1;
  return sh.getRange(mulai, 1, jumlah, lebar).getValues()
    .filter(function (r) { return _tglString(r[1]) === hari; });
}
