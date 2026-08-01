// ============================================================================
// People Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// Roster management (ORANG). Moved verbatim from the live Code.gs.
// ============================================================================

/**
 * BARU v2.1 — Tambah orang/penerima dari aplikasi.
 * PIN dibuat otomatis 4 angka yang belum dipakai, supaya tidak ada
 * PIN kembar yang bikin dua orang tertukar identitasnya.
 */
function tambahOrang(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'kelola');

  var nama = String((payload && payload.nama) || '').trim();
  var peran = String((payload && payload.peran) || '').trim().toUpperCase();
  var unit = String((payload && payload.unit) || '-').trim();
  var wa = _wa((payload && payload.wa) || '');
  var catatan = String((payload && payload.catatan) || '').trim();

  var peranBoleh = ['KASIR', 'PENYIAP', 'PENGANTAR', 'PENERIMA', 'OWNER'];
  if (!nama) throw new Error('Nama belum diisi.');
  if (peranBoleh.indexOf(peran) < 0) {
    throw new Error('Peran harus salah satu dari: ' + peranBoleh.join(', ') + '.');
  }
  if (peran === 'OWNER' && o.peran !== 'OWNER') {
    throw new Error('Hanya pemilik yang boleh menambahkan pemilik baru.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
    if (!sh) throw new Error('Sheet ORANG tidak ada. Jalankan Setup dulu.');

    var n = sh.getLastRow() - 1;
    var pinDipakai = {};
    if (n > 0) {
      var d = sh.getRange(2, 1, n, 2).getValues();
      for (var i = 0; i < d.length; i++) {
        if (String(d[i][0]).trim().toLowerCase() === nama.toLowerCase()) {
          throw new Error('Nama "' + nama + '" sudah ada di daftar orang.');
        }
        pinDipakai[String(d[i][1]).trim()] = true;
      }
    }

    var pinBaru = '';
    for (var coba = 0; coba < 500; coba++) {
      var kandidat = String(Math.floor(1000 + Math.random() * 9000));
      if (!pinDipakai[kandidat]) { pinBaru = kandidat; break; }
    }
    if (!pinBaru) throw new Error('Gagal membuat PIN unik. Coba lagi.');

    sh.appendRow([nama, pinBaru, peran, unit, 'YA', wa, '', catatan]);
    var baris = sh.getLastRow();
    sh.getRange(baris, 2).setNumberFormat('@').setValue(pinBaru);
    sh.getRange(baris, 6).setNumberFormat('@').setValue(wa);
    sh.getRange(baris, 1, 1, 8).setBackground('#E7F0FA');

    _catatAkses(o, 'TAMBAH ORANG', nama + ' · ' + peran + ' · ' + unit);

    return { ok: true, nama: nama, peran: peran, pin: pinBaru,
             pesan: 'Orang baru ditambahkan. PIN untuk ' + nama + ': ' + pinBaru +
                    '. Sampaikan langsung ke orangnya, jangan lewat grup.' };
  } finally { lock.releaseLock(); }
}

/**
 * BARU v2.1 — Nonaktifkan orang (tidak dihapus, supaya riwayatnya tetap utuh).
 */
function nonaktifkanOrang(pin, nama) {
  var o = _siapa(pin);
  _boleh(o, 'kelola');
  var target = String(nama || '').trim();
  if (!target) throw new Error('Nama belum dipilih.');
  if (target.toLowerCase() === o.nama.toLowerCase()) {
    throw new Error('Tidak bisa menonaktifkan akun sendiri.');
  }

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
  var n = sh.getLastRow() - 1;
  if (n <= 0) throw new Error('Sheet ORANG kosong.');
  var d = sh.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < d.length; i++) {
    if (String(d[i][0]).trim().toLowerCase() !== target.toLowerCase()) continue;
    sh.getRange(i + 2, 5).setValue('TIDAK');
    sh.getRange(i + 2, 1, 1, 8).setBackground('#F2F2F2');
    _catatAkses(o, 'NONAKTIFKAN ORANG', target);
    return { ok: true, nama: target,
             pesan: target + ' dinonaktifkan. Riwayatnya tetap tersimpan.' };
  }
  throw new Error('Nama "' + target + '" tidak ditemukan.');
}

function _nomorOrang(daftarNama) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
  var n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  var lebar = Math.max(sh.getLastColumn(), 6);
  var d = sh.getRange(2, 1, n, lebar).getValues();
  var out = [];
  daftarNama.forEach(function (nm) {
    for (var i = 0; i < d.length; i++) {
      if (String(d[i][0]).trim().toLowerCase() !== nm.toLowerCase()) continue;
      out.push({ nama: String(d[i][0]).trim(), wa: _wa(d[i][5]) });
      return;
    }
    out.push({ nama: nm, wa: '' });
  });
  return out;
}
