// ============================================================================
// Migration Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// One-time ID Kirim repair menu commands. Moved verbatim from the live
// Code.gs's OWN version of these functions.
//
// KNOWN CONFLICT, DELIBERATELY NOT RESOLVED: the live project also has a
// second file, Migrasi.gs, which defines its own migrasiIdKirimUjiCoba(),
// migrasiIdKirimJalankan(), and _migrasiIdKirim() — different implementations
// of the same function names. In a single Apps Script project these silently
// collide (last-loaded file wins). This refactor moves ONLY Code.gs's version,
// verbatim, and does not attempt to reconcile it with Migrasi.gs. Resolving
// that conflict is a separate, explicit decision for the CEO to make — not
// something this internal-service reorganization should decide silently.
// ============================================================================

/**
 * Baris KELUAR dengan ID berformat lama (mengandung SEDERH) yang tidak bisa
 * dibedakan antar cabang. Fungsi uji coba hanya MELAPORKAN, tidak mengubah.
 */
function migrasiIdKirimUjiCoba() { return _migrasiIdKirim(false); }
function migrasiIdKirimJalankan() { return _migrasiIdKirim(true); }

function _migrasiIdKirim(jalankan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('KELUAR');
  if (!sh || sh.getLastRow() < 2) {
    ss.toast('Sheet KELUAR kosong.', 'Migrasi ID', 8);
    return { total: 0 };
  }

  var n = sh.getLastRow() - 1;
  var data = sh.getRange(2, 1, n, KOL_KELUAR).getValues();
  var ubah = [];

  for (var i = 0; i < data.length; i++) {
    var idLama = String(data[i][11] || '').trim();
    if (!idLama || idLama.indexOf('SEDERH') < 0) continue;
    var tujuan = String(data[i][2] || '').trim();
    var kode = _kodeTujuan(tujuan);
    if (!kode || kode === 'SEDERH') continue;
    var tgl = _tglString(data[i][1]).replace(/-/g, '');
    var unit = String(data[i][12] || 'TSS');
    var idBaru = tgl + '-' + unit + '-' + kode + '-R' + data[i][3];
    if (idBaru === idLama) continue;
    ubah.push({ baris: i + 2, lama: idLama, baru: idBaru, tujuan: tujuan });
  }

  if (!ubah.length) {
    ss.toast('Tidak ada ID lama yang perlu diperbaiki.', 'Migrasi ID', 8);
    return { total: 0, ubah: [] };
  }

  if (!jalankan) {
    var contoh = ubah.slice(0, 5).map(function (u) {
      return u.lama + ' -> ' + u.baru + ' (' + u.tujuan + ')';
    }).join('\n');
    ss.toast(ubah.length + ' baris akan diubah. Contoh:\n' + contoh +
             '\n\nJalankan "Perbaiki ID Kirim lama (JALANKAN)" kalau sudah benar.',
             'Uji coba migrasi', 20);
    return { total: ubah.length, ubah: ubah };
  }

  // Ubah KELUAR
  ubah.forEach(function (u) { sh.getRange(u.baris, 12).setValue(u.baru); });

  // Ubah TERIMA yang menempel ke ID lama
  var petaId = {};
  ubah.forEach(function (u) { petaId[u.lama] = u.baru; });
  var shT = ss.getSheetByName('TERIMA');
  var ubahT = 0;
  if (shT && shT.getLastRow() > 1) {
    var nT = shT.getLastRow() - 1;
    var idsT = shT.getRange(2, 3, nT, 1).getValues();
    for (var j = 0; j < idsT.length; j++) {
      var v = String(idsT[j][0] || '').trim();
      if (petaId[v]) { shT.getRange(j + 2, 3).setValue(petaId[v]); ubahT++; }
    }
  }

  _buangCacheTerima();
  ss.toast(ubah.length + ' baris KELUAR dan ' + ubahT +
           ' baris TERIMA diperbaiki. Jalankan "Rekap sekarang" untuk ' +
           'memperbarui angka rekap.', 'Migrasi ID selesai', 15);
  return { total: ubah.length, terima: ubahT, ubah: ubah };
}
