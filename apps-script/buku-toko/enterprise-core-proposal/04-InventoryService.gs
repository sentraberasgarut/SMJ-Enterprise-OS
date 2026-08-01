// ============================================================================
// Inventory Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// Catalog (MASTER/MASTER_CK) and pricing (HARGA_LOG). Moved verbatim from
// the live Code.gs.
// ============================================================================

/**
 * Baca sheet master jadi daftar barang.
 * v2.1: ditambah hargaTeks (sudah diformat "387.500") supaya tampilan tidak
 * perlu memformat sendiri, dan angka tidak lagi tampil mentah "387500".
 */
function _bacaMaster(nama) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nama);
  if (!sh) return [];
  var n = Math.max(sh.getLastRow() - 1, 0);
  if (!n) return [];
  return sh.getRange(2, 1, n, 6).getValues()
    .filter(function (r) { return r[1]; })
    .map(function (r) {
      var h = Number(r[3]) || 0;
      return { kat: String(r[0] || 'Lain'), nama: String(r[1]), satuan: String(r[2] || ''),
               harga: h, hargaTeks: _angkaTeks(h), hargaRp: _rp(h),
               src: String(r[4] || ''), tag: String(r[5] || '') };
    });
}

/**
 * BARU v2.1 — Tambah barang dari aplikasi, tanpa membuka spreadsheet.
 * Barang baru diberi tag TAMBAHAN supaya tidak terhapus saat
 * "Perbaiki daftar barang" dijalankan.
 */
function tambahBarang(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'kelola');

  var namaSheet = (payload && payload.sheet === 'MASTER_CK') ? 'MASTER_CK' : 'MASTER';
  var nama = String((payload && payload.nama) || '').trim();
  var kat = String((payload && payload.kategori) || '').trim() || 'Tambahan';
  var satuan = String((payload && payload.satuan) || '').trim();
  var harga = Number(String((payload && payload.harga) || '0').replace(/[^0-9]/g, '')) || 0;

  if (!nama) throw new Error('Nama barang belum diisi.');
  if (!satuan) throw new Error('Satuan belum diisi (kg / karung / pcs / dus / ball).');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(namaSheet);
    if (!sh) throw new Error('Sheet ' + namaSheet + ' tidak ada.');

    var n = sh.getLastRow() - 1;
    if (n > 0) {
      var ada = sh.getRange(2, 2, n, 1).getValues();
      for (var i = 0; i < ada.length; i++) {
        if (String(ada[i][0]).trim().toLowerCase() === nama.toLowerCase()) {
          throw new Error('Barang "' + nama + '" sudah ada di daftar. ' +
                          'Kalau mau ubah harganya, pakai menu Ubah Harga.');
        }
      }
    }

    var sumber = harga > 0 ? (namaSheet === 'MASTER_CK' ? 'CK' : 'MANUAL') : 'CEK';
    sh.appendRow([kat, nama, satuan, harga, sumber, 'TAMBAHAN']);
    var barisBaru = sh.getLastRow();
    sh.getRange(barisBaru, 4).setNumberFormat('#,##0');
    sh.getRange(barisBaru, 1, 1, 6).setBackground(harga > 0 ? '#E7F0FA' : '#FFF3CD');

    _catatAkses(o, 'TAMBAH BARANG',
      namaSheet + ' · ' + nama + ' · ' + satuan + ' · ' + _rp(harga));

    return { ok: true, nama: nama, satuan: satuan, harga: harga,
             hargaRp: _rp(harga), sheet: namaSheet,
             pesan: 'Barang "' + nama + '" ditambahkan.' +
                    (harga > 0 ? '' : ' Harganya masih 0 — isi lewat Ubah Harga.') };
  } finally { lock.releaseLock(); }
}

/**
 * Ubah harga barang.
 *
 * PERBAIKAN v2.1: sekarang bisa untuk MASTER (toko) DAN MASTER_CK (dapur).
 * Sebelumnya nama sheet di-hardcode 'MASTER', sehingga harga barang Dapur
 * tidak bisa diubah dari aplikasi sama sekali — padahal 130 item CK memang
 * belum punya harga dan harus diisi.
 *
 * @param {Object} payload  { sheet: 'MASTER'|'MASTER_CK', perubahan: [...], catatan }
 */
function simpanHarga(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'harga');

  var namaSheet = (payload && payload.sheet === 'MASTER_CK') ? 'MASTER_CK' : 'MASTER';

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var master = ss.getSheetByName(namaSheet);
    if (!master) throw new Error('Sheet ' + namaSheet + ' tidak ada.');
    var hlog = ss.getSheetByName('HARGA_LOG');
    var n = master.getLastRow() - 1;
    if (n <= 0) throw new Error('Sheet ' + namaSheet + ' kosong.');

    var data = master.getRange(2, 1, n, 6).getValues();
    var now = new Date();
    var rows = [], ringkas = [];

    (payload.perubahan || []).forEach(function (p) {
      var baru = Number(String(p.hargaBaru).replace(/[^0-9]/g, ''));
      if (!(baru > 0)) return;
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][1]).trim() !== String(p.nama).trim()) continue;
        var lama = Number(data[i][3]) || 0;
        if (lama === baru) return;
        master.getRange(i + 2, 4).setValue(baru);
        // Barang CK yang tadinya bertanda CEK jadi CK begitu harganya terisi.
        if (namaSheet === 'MASTER_CK' && baru > 0) {
          master.getRange(i + 2, 5).setValue('CK');
          master.getRange(i + 2, 1, 1, 6).setBackground(null);
        }
        var pct = lama ? (baru - lama) / lama : 0;
        rows.push([now, _tglString(now), data[i][1], lama, baru, baru - lama,
                   pct, o.nama, (namaSheet === 'MASTER_CK' ? '[Dapur] ' : '') +
                   (payload.catatan || '')]);
        ringkas.push({ nama: data[i][1], lama: lama, baru: baru, pct: pct * 100,
                       lamaRp: _rp(lama), baruRp: _rp(baru) });
        return;
      }
    });

    if (!rows.length) throw new Error('Tidak ada harga yang berubah.');

    var mulai = hlog.getLastRow() + 1;
    hlog.getRange(mulai, 1, rows.length, 9).setValues(rows);
    for (var k = 0; k < rows.length; k++) {
      if (Math.abs(rows[k][6]) > 0.15) {
        hlog.getRange(mulai + k, 1, 1, 9).setBackground('#FBEAE6');
      }
    }
    _catatAkses(o, 'UBAH HARGA', namaSheet + ' · ' + rows.length + ' barang');
    _kabarHarga(ringkas, o.nama, payload.catatan, namaSheet);
    return { ok: true, berubah: rows.length, ringkas: ringkas, sheet: namaSheet };
  } finally { lock.releaseLock(); }
}

function _kabarHarga(ringkas, oleh, catatan, namaSheet) {
  var t = ['*Perubahan Harga — ' + _tglString(new Date()) + '*',
           'Daftar: ' + (namaSheet === 'MASTER_CK' ? 'Barang Dapur' : 'Barang Toko'),
           'Diubah oleh: ' + oleh, ''];
  ringkas.forEach(function (r) {
    t.push('• ' + r.nama + ': ' + _rp(r.lama) + ' -> ' + _rp(r.baru) +
           ' (' + (r.pct >= 0 ? '+' : '') + r.pct.toFixed(1) + '%)');
  });
  if (catatan) t.push('', 'Catatan: ' + catatan);
  var ekstrem = ringkas.filter(function (r) { return Math.abs(r.pct) > 15; });
  if (ekstrem.length) {
    t.push('', 'PERIKSA: ' + ekstrem.length +
              ' perubahan lebih dari 15% — pastikan bukan salah ketik.');
  }
  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: (ekstrem.length ? '[PERIKSA] ' : '') + 'Perubahan harga oleh ' + oleh,
      body: t.join('\n')
    });
  } catch (e) { /* email gagal tidak membatalkan perubahan harga */ }
}

/** BARU v2.1 — berapa item MASTER_CK yang sudah punya harga. */
function _statusHargaCK() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('MASTER_CK');
  if (!sh) return { terisi: 0, total: 0 };
  var n = sh.getLastRow() - 1;
  if (n <= 0) return { terisi: 0, total: 0 };
  var d = sh.getRange(2, 4, n, 1).getValues();
  var terisi = 0;
  d.forEach(function (r) { if (Number(r[0]) > 0) terisi++; });
  return { terisi: terisi, total: n };
}

function perbaikiMasterCKMenu() {
  var h = perbaikiMasterCK();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    h.total + ' barang Dapur siap. ' + h.adaHarga + ' sudah punya harga, ' +
    (h.total - h.adaHarga) + ' masih perlu diisi (baris kuning). ' +
    (h.tambahan ? h.tambahan + ' barang tambahan Anda dipertahankan.' : ''),
    'MASTER_CK', 10);
}

function perbaikiMasterMenu() {
  var h = perbaikiMaster();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    h.total + ' barang rapi. ' + h.hargaDipakai + ' harga Anda dipertahankan. ' +
    (h.tambahan ? h.tambahan + ' barang tambahan Anda dipertahankan.' : ''),
    'MASTER diperbaiki', 8);
}

function _perbaikiMasterUmum(namaSheet, bawaan, sumberDefault) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = _sheet(ss, namaSheet);

  var lama = {}, urutTambahan = [], adaDiBawaan = {};
  bawaan.forEach(function (m) { adaDiBawaan[String(m[1]).trim()] = true; });

  var n = sh.getLastRow() - 1;
  if (n > 0) {
    sh.getRange(2, 1, n, 6).getValues().forEach(function (r) {
      var nama = String(r[1] || '').trim();
      if (!nama) return;
      lama[nama] = r;
      if (!adaDiBawaan[nama]) urutTambahan.push(nama);
    });
  }

  var dipakai = 0;
  var rows = bawaan.map(function (m) {
    var r = lama[String(m[1]).trim()];
    var h = r ? (Number(r[3]) || 0) : 0;
    if (h > 0 && h !== m[3]) dipakai++;
    var harga = h > 0 ? h : m[3];
    var sumber = (sumberDefault === 'CK') ? (harga > 0 ? 'CK' : 'CEK') : m[4];
    return [m[0], m[1], m[2], harga, sumber, m[5]];
  });

  urutTambahan.forEach(function (nama) {
    var r = lama[nama];
    rows.push([r[0] || 'Tambahan', r[1], r[2] || '', Number(r[3]) || 0,
               r[4] || 'MANUAL', r[5] || 'TAMBAHAN']);
  });

  sh.clear();
  sh.getRange(1, 1, 1, 6).setValues(
    [['Kategori', 'Nama Barang', 'Satuan', 'Harga', 'Sumber Harga', 'Tag']]);
  sh.getRange(2, 1, rows.length, 6).setValues(rows);
  _headerStyle(sh, 6);
  sh.getRange(2, 4, rows.length, 1).setNumberFormat('#,##0');
  sh.autoResizeColumns(1, 6);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][5] === 'TAMBAHAN') sh.getRange(i + 2, 1, 1, 6).setBackground('#E7F0FA');
    else if (rows[i][5] === 'BARU') sh.getRange(i + 2, 1, 1, 6).setBackground('#FDF0D5');
    if (!Number(rows[i][3])) sh.getRange(i + 2, 1, 1, 6).setBackground('#FFF3CD');
  }

  return { total: rows.length, hargaDipakai: dipakai,
           tambahan: urutTambahan.length,
           adaHarga: rows.filter(function (r) { return Number(r[3]) > 0; }).length };
}

function perbaikiMaster()   { return _perbaikiMasterUmum('MASTER', MASTER_ITEM, 'SJ'); }
function perbaikiMasterCK() { return _perbaikiMasterUmum('MASTER_CK', MASTER_CK, 'CK'); }
