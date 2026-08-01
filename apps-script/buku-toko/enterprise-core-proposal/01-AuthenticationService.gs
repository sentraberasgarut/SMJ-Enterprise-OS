// ============================================================================
// Authentication Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// Every function here is moved verbatim from the live Code.gs — identical
// logic, only relocated. Reads/writes ORANG and LOG_AKSES exactly as before.
// ============================================================================

function _siapa(pin) {
  pin = String(pin || '').trim();
  if (!pin) throw new Error('PIN belum diisi.');

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
  if (!sh) throw new Error('Sheet ORANG belum ada. Jalankan Setup dulu.');
  var n = sh.getLastRow() - 1;
  if (n <= 0) throw new Error('Sheet ORANG masih kosong.');

  var lebar = Math.max(sh.getLastColumn(), 8);
  var data = sh.getRange(2, 1, n, lebar).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() !== pin) continue;
    if (String(data[i][4]).trim().toUpperCase() !== 'YA') {
      throw new Error('Akun ini sedang dinonaktifkan. Hubungi pemilik.');
    }
    var u = String(data[i][3]).trim();
    return {
      nama: String(data[i][0]).trim(),
      peran: String(data[i][2]).trim().toUpperCase(),
      unit: u,
      unitNama: UNIT_NAMA[u.toUpperCase()] || u,
      wa: String(data[i][5] || '').trim(),
      unitDilihat: String(data[i][6] || '').trim()
    };
  }
  throw new Error('PIN tidak dikenal.');
}

function _unitBoleh(o) {
  if (o.peran !== 'OWNER') return [];
  var s = (o.unitDilihat || o.unit || '').toUpperCase();
  return s.split(',').map(function (x) { return x.trim(); })
          .filter(function (x) { return x === 'TSS' || x === 'CK'; });
}

/**
 * Layar apa saja yang boleh dibuka tiap peran.
 *
 * PERBAIKAN v2.1: 'riwayat' dibuka untuk PENYIAP, PENGANTAR, dan PENERIMA.
 * Sebelumnya Teh Dede bisa menginput 14 barang tapi tidak punya layar
 * untuk memeriksa apa yang baru dia masukkan — tidak ada cara memverifikasi
 * pekerjaan sendiri. Isinya tetap dibatasi ke pekerjaan orang itu saja
 * (lihat riwayatHariIni), jadi ini bukan pelonggaran akses data.
 */
function _menuPeran(peran) {
  var M = {
    KASIR:     ['keluar', 'terima', 'shift', 'riwayat'],
    PENYIAP:   ['keluar', 'terima', 'riwayat'],
    PENGANTAR: ['terima', 'riwayat'],
    PENERIMA:  ['terima', 'riwayat'],
    OWNER:     ['keluar', 'terima', 'shift', 'riwayat', 'harga', 'kelola']
  };
  return M[String(peran || '').toUpperCase()] || [];
}

function _boleh(orang, layar) {
  if (layar === 'dashboard' || layar === 'dashTSS') {
    if (_unitBoleh(orang).indexOf('TSS') >= 0) return;
    throw new Error('Maaf, ' + orang.nama + ' tidak punya akses ke dashboard Toko.');
  }
  if (layar === 'dashCK') {
    if (_unitBoleh(orang).indexOf('CK') >= 0) return;
    throw new Error('Maaf, ' + orang.nama + ' tidak punya akses ke Central Kitchen.');
  }
  if (_menuPeran(orang.peran).indexOf(layar) < 0) {
    throw new Error('Maaf, ' + orang.nama + ' tidak punya akses ke bagian ini. ' +
                    'Peran Anda: ' + orang.peran + '.');
  }
}

function _samarkanPin(p) {
  p = String(p || '');
  if (p.length <= 2) return '**';
  var bintang = '';
  for (var i = 1; i < p.length; i++) bintang += '*';
  return p.charAt(0) + bintang;
}

function _cekKunciPin() {
  var c = CacheService.getScriptCache();
  if (c.get('KUNCI_PIN')) {
    throw new Error('Terlalu banyak PIN salah berturut-turut. ' +
                    'Tunggu ' + LAMA_KUNCI + ' menit, lalu coba lagi.');
  }
}

function _catatPinSalah(pin) {
  var c = CacheService.getScriptCache();
  var n = Number(c.get('GAGAL_PIN') || 0) + 1;
  c.put('GAGAL_PIN', String(n), 600);
  if (n >= MAKS_GAGAL) {
    c.put('KUNCI_PIN', '1', LAMA_KUNCI * 60);
    c.remove('GAGAL_PIN');
  }
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG_AKSES');
    if (sh) {
      sh.appendRow([new Date(), _tglString(new Date()), '(tidak dikenal)', '-',
                    'PIN SALAH', 'percobaan ke-' + n + ' · ' + _samarkanPin(pin) +
                    (n >= MAKS_GAGAL ? ' · LOGIN DIKUNCI ' + LAMA_KUNCI + ' MENIT' : '')]);
    }
  } catch (e) { /* log gagal tidak boleh membocorkan error ke pengguna */ }
}

function masuk(pin) {
  _cekKunciPin();
  var o;
  try {
    o = _siapa(pin);
  } catch (e) {
    if (String(e.message).indexOf('PIN tidak dikenal') >= 0) _catatPinSalah(pin);
    throw e;
  }
  CacheService.getScriptCache().remove('GAGAL_PIN');

  _catatAkses(o, 'MASUK');
  var unit = _unitBoleh(o);
  var menu = unit.map(function (u) { return 'dash' + u; })
                 .concat(_menuPeran(o.peran));
  return {
    nama: o.nama, peran: o.peran, unit: o.unit,
    unitNama: o.unitNama, unitDilihat: unit,
    menu: menu, sapaan: _sapaan(), versi: VERSI
  };
}

function _sapaan() {
  var j = Number(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'H'));
  if (j < 11) return 'Selamat pagi';
  if (j < 15) return 'Selamat siang';
  if (j < 18) return 'Selamat sore';
  return 'Selamat malam';
}
