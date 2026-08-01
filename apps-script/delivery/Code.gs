// ============================================================================
// Delivery Evidence — Code.gs
// Operational Foundation · 1 Agustus 2026
// ============================================================================
//
// Proyek TERPISAH dari Buku Toko. TIDAK PERNAH menulis ke spreadsheet Buku
// Toko — hanya membaca sheet ORANG (nama/peran/aktif) secara read-only.
//
// APA YANG ADA DI SINI:
//   - Peran Warehouse: Goods Departed, dengan foto sebagai bukti.
//   - Peran Driver: Goods Received, mencocokkan ke satu Goods Departed
//     yang masih terbuka hari ini — Responsibility Transfer.
//   - ResponsibilityStatus (operational-event-standard-v1.md) DIHITUNG,
//     bukan disimpan sebagai kolom di GOODS_DEPARTED — Transferred kalau
//     ada GOODS_RECEIVED yang mencocokkan, Recorded kalau belum. Tidak
//     menambah kolom ke baris asli (Immutable History, Canonical Data
//     Contract §2).
//   - Correction Flow: pembatalan Goods Departed sebelum dikonfirmasi
//     sampai, dicatat sebagai fakta baru di sheet PEMBATALAN (dibuat
//     sendiri kalau belum ada) — bukan menghapus/menimpa baris asli, pola
//     yang sama dengan sheet BATAL milik Buku Toko.
//   - Peran Shift: Shift Started saja (SHIFT_EVENTS) — Shift Closed sudah
//     ada lengkap di TUTUP_SHIFT milik Buku Toko dan dibaca dari sana oleh
//     Dashboard, tidak diduplikasi di sini.
//   - Evidence Timeline & Operational History hidup di proyek Dashboard
//     (apps-script/dashboard), bukan di sini — proyek ini hanya mencatat
//     dan memilih data mentah untuk dirinya sendiri; Dashboard membaca
//     sheet yang sama secara read-only untuk menyusun riwayat gabungan.
//
// TIDAK PERNAH: mengubah data Buku Toko, mengubah stok, menghitung kas.
// File ini hanya MENCATAT BUKTI.
//
// CARA PAKAI: timpa Code.gs proyek Apps Script "Delivery Evidence" yang
// sudah ada, tempel ulang Index.html, Deploy > Manage deployments > edit
// > Deploy (versi baru).
// ============================================================================

// ====================== KONFIGURASI ======================

var NAMA_APP = 'Delivery Evidence';
var VERSI    = '4.0.0 (Operational Foundation)';

// Spreadsheet Buku Toko — HANYA dibaca (sheet ORANG), tidak pernah ditulis.
var ID_BUKU_TOKO = '1yFF83m2Cd3v8WYU-6jDZTSGB-2TPEAIkJkBmH1iM_D8';

var FOLDER_INDUK      = 'SMJ ENTERPRISE OS';
var FOLDER_EVIDENCE   = 'Delivery Evidence';
var NAMA_SPREADSHEET  = 'Delivery Evidence';
var FOLDER_FOTO       = 'Photos';

var TUJUAN = ['Sederhana Jaya 1', 'Sederhana Jaya 4'];
var KODE_TUJUAN = { 'Sederhana Jaya 1': 'SJ1', 'Sederhana Jaya 4': 'SJ4' };

// ORANG.Peran (Buku Toko) -> kemampuan di aplikasi ini. Satu orang bisa
// punya lebih dari satu kemampuan (mis. PENGANTAR = Mas War bisa juga
// menyiapkan; PENYIAP = siapa pun termasuk Ayah bisa jadi Driver pengganti
// — spec: "When Mas War is off, morning delivery is performed by Ayah",
// dan ORANG Ayah Iman tercatat berperan PENYIAP, bukan PENGANTAR — jadi
// pemetaan berbasis peran, bukan nama, harus mengizinkan ini). Kemampuan
// yang bukan peran asli seseorang tercatat Acting, tidak disamarkan.
// Kemampuan 'Shift' BARU — Shift Accountability. KASIR (Ayu) Primary;
// PENGANTAR dan OWNER Acting, karena skenario nyata sudah dikonfirmasi
// CEO langsung: "When Ayu is off, Mas War operates the store together
// with Aditya" — keduanya harus bisa menandai mulai bertugas atas nama
// mereka sendiri, bukan diam-diam tercatat sebagai Ayu.
var PETA_KEMAMPUAN = {
  'PENYIAP':   [{ app: 'Warehouse', status: 'Primary' }, { app: 'Driver', status: 'Acting' }],
  'PENGANTAR': [{ app: 'Driver', status: 'Primary' }, { app: 'Warehouse', status: 'Acting' }, { app: 'Shift', status: 'Acting' }],
  'OWNER':     [{ app: 'Warehouse', status: 'Acting' }, { app: 'Driver', status: 'Acting' }, { app: 'Shift', status: 'Acting' }],
  'KASIR':     [{ app: 'Shift', status: 'Primary' }]
};

var MAKS_GAGAL = 8;
var LAMA_KUNCI = 5;

// ====================== IDENTITAS & IZIN ======================

function _cariOrangBukuToko(pin) {
  pin = String(pin || '').trim();
  if (!pin) throw new Error('PIN belum diisi.');

  var sh = SpreadsheetApp.openById(ID_BUKU_TOKO).getSheetByName('ORANG');
  if (!sh) throw new Error('Sheet ORANG tidak ditemukan di Buku Toko.');

  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (String(r[1]).trim() === pin) {
      if (String(r[4]).trim().toUpperCase() !== 'YA') {
        throw new Error('PIN dikenal tapi akun tidak aktif.');
      }
      var peran = String(r[2]).trim().toUpperCase();
      var kemampuan = PETA_KEMAMPUAN[peran];
      if (!kemampuan) {
        throw new Error('Peran "' + r[2] + '" belum bisa memakai aplikasi ini.');
      }
      return { nama: String(r[0]), peranAsli: r[2], kemampuan: kemampuan };
    }
  }
  throw new Error('PIN tidak dikenal.');
}

/** Ambil satu kemampuan tertentu ('Warehouse'/'Driver') milik orang ini,
 *  atau lempar error kalau perannya tidak punya kemampuan itu. */
function _kemampuan(orang, app) {
  for (var i = 0; i < orang.kemampuan.length; i++) {
    if (orang.kemampuan[i].app === app) return orang.kemampuan[i];
  }
  throw new Error('Peran Anda tidak bisa melakukan aksi ini.');
}

function _cekKunciPin() {
  var c = CacheService.getScriptCache();
  if (c.get('KUNCI_PIN_DELIVERY')) {
    throw new Error('Terlalu banyak PIN salah berturut-turut. ' +
                    'Tunggu ' + LAMA_KUNCI + ' menit, lalu coba lagi.');
  }
}

function _catatPinSalah() {
  var c = CacheService.getScriptCache();
  var n = Number(c.get('GAGAL_PIN_DELIVERY') || 0) + 1;
  c.put('GAGAL_PIN_DELIVERY', String(n), 600);
  if (n >= MAKS_GAGAL) {
    c.put('KUNCI_PIN_DELIVERY', '1', LAMA_KUNCI * 60);
    c.remove('GAGAL_PIN_DELIVERY');
  }
}

function _masukTerverifikasi(pin) {
  _cekKunciPin();
  var orang;
  try {
    orang = _cariOrangBukuToko(pin);
  } catch (e) {
    _catatPinSalah();
    throw e;
  }
  CacheService.getScriptCache().remove('GAGAL_PIN_DELIVERY');
  return orang;
}

// ====================== WEB APP ======================

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle(NAMA_APP)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ====================== DRIVE & SPREADSHEET EVIDENCE ======================
// Pola pencarian-dengan-cache sama persis dengan _folderLokaJson() (Buku
// Toko) / _folderDataset() (Dashboard) — dipakai ulang, bukan diciptakan
// baru. _spreadsheetEvidence() diekstrak dari Increment 2 supaya dipakai
// bersama oleh GOODS_DEPARTED dan GOODS_RECEIVED — perilaku Increment 2
// tidak berubah, hanya kode berbaginya yang dirapikan.

function _folderEvidence() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_EVIDENCE_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var induk = DriveApp.getFoldersByName(FOLDER_INDUK);
  while (induk.hasNext()) {
    var sub = induk.next().getFoldersByName(FOLDER_EVIDENCE);
    if (sub.hasNext()) {
      var f = sub.next();
      props.setProperty('FOLDER_EVIDENCE_ID', f.getId());
      return f;
    }
  }
  throw new Error('Folder "' + FOLDER_EVIDENCE + '" belum ada di Drive. Jalankan Increment 0 dulu.');
}

function _folderFoto() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_FOTO_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var sub = _folderEvidence().getFoldersByName(FOLDER_FOTO);
  if (!sub.hasNext()) throw new Error('Folder "' + FOLDER_FOTO + '" belum ada. Jalankan Increment 0 dulu.');
  var f = sub.next();
  props.setProperty('FOLDER_FOTO_ID', f.getId());
  return f;
}

function _spreadsheetEvidence() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_EVIDENCE_ID');
  var ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) {} }
  if (!ss) {
    var it = _folderEvidence().getFilesByName(NAMA_SPREADSHEET);
    if (!it.hasNext()) throw new Error('Spreadsheet "' + NAMA_SPREADSHEET + '" belum dibuat. Jalankan Increment 0 dulu.');
    var file = it.next();
    props.setProperty('SPREADSHEET_EVIDENCE_ID', file.getId());
    ss = SpreadsheetApp.openById(file.getId());
  }
  return ss;
}

function _sheetGoodsDeparted() {
  var sh = _spreadsheetEvidence().getSheetByName('GOODS_DEPARTED');
  if (!sh) throw new Error('Sheet "GOODS_DEPARTED" tidak ditemukan. Cek header sesuai Increment 0.');
  return sh;
}

function _sheetGoodsReceived() {
  var sh = _spreadsheetEvidence().getSheetByName('GOODS_RECEIVED');
  if (!sh) throw new Error('Sheet "GOODS_RECEIVED" tidak ditemukan. Cek header sesuai Increment 0.');
  return sh;
}

/** Sheet pembatalan — dibuat sendiri kalau belum ada, sama seperti pola
 *  _sheet()/setup() di Buku Toko (create-if-missing). Mencatat pembatalan
 *  sebagai fakta baru (Correction Flow), tidak pernah menghapus/menimpa
 *  baris GOODS_DEPARTED aslinya — Immutable History, Canonical Data
 *  Contract §2. Mirip persis sheet BATAL milik Buku Toko untuk KELUAR. */
function _sheetPembatalan() {
  var ss = _spreadsheetEvidence();
  var sh = ss.getSheetByName('PEMBATALAN');
  if (!sh) {
    sh = ss.insertSheet('PEMBATALAN');
    sh.appendRow(['EventID', 'WaktuBatal', 'Operator', 'Alasan']);
  }
  return sh;
}

function _idDibatalkan() {
  var data = _sheetPembatalan().getDataRange().getValues();
  var set = {};
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0] || '').trim();
    if (id) set[id] = true;
  }
  return set;
}

/** Shift Accountability — Shift Started. Shift CLOSED sengaja TIDAK
 *  dibangun di sini: itu sudah ada, lengkap dan nyata, di TUTUP_SHIFT
 *  milik Buku Toko (kas, foto, Status WAJAR/PERLU DICEK) — membangun
 *  versi kedua di sini akan menciptakan dua catatan untuk momen yang sama
 *  (No Duplicate Meaning, Canonical Data Contract §2). Dashboard membaca
 *  TUTUP_SHIFT langsung untuk penutupan; sheet ini hanya mengisi satu-
 *  satunya bagian yang belum ada di mana pun: PEMBUKAAN tanggung jawab
 *  shift, dengan bukti siapa dan kapan — termasuk saat itu bukan Ayu
 *  (Protection for Ayu, Protection for Mas War, Protection for Owner). */
function _sheetShiftEvents() {
  var ss = _spreadsheetEvidence();
  var sh = ss.getSheetByName('SHIFT_EVENTS');
  if (!sh) {
    sh = ss.insertSheet('SHIFT_EVENTS');
    sh.appendRow(['EventID', 'Timestamp', 'BusinessUnit', 'Role', 'RoleStatus', 'Operator', 'Notes']);
  }
  return sh;
}

function _shiftMulaiHariIni() {
  var hari = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var data = _sheetShiftEvents().getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (Utilities.formatDate(new Date(r[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd') !== hari) continue;
    hasil.push({ eventId: r[0], waktu: new Date(r[1]).toISOString(), operator: r[5], statusPeran: r[4] });
  }
  return hasil;
}

// ====================== PENCOCOKAN KEBERANGKATAN <-> KEDATANGAN ======================
// Kolom GOODS_DEPARTED: EventID(0) Timestamp(1) BusinessUnit(2) Role(3)
//   RoleStatus(4) Operator(5) Destination(6) PhotoURL(7) Notes(8)
// Kolom GOODS_RECEIVED: EventID(0) Timestamp(1) BusinessUnit(2) Role(3)
//   RoleStatus(4) Operator(5) Destination(6) MatchedDepartureEventID(7)
//   PhotoURL(8) Notes(9) ResponsibilityTransferredAt(10)

/** ID keberangkatan hari ini yang SUDAH punya pasangan GOODS_RECEIVED —
 *  ini yang membuat sebuah GoodsDeparted "Transferred", dihitung, bukan
 *  ditulis ulang ke barisnya sendiri. */
function _idSudahCocok() {
  var data = _sheetGoodsReceived().getDataRange().getValues();
  var set = {};
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][7] || '').trim();
    if (id) set[id] = true;
  }
  return set;
}

/** Keberangkatan hari ini yang BELUM dikonfirmasi sampai — ResponsibilityStatus
 *  "Recorded". Keberangkatan yang sudah dibatalkan (Correction Flow) tidak
 *  ikut muncul — Driver tidak boleh mengonfirmasi sesuatu yang sudah ditarik. */
function _keberangkatanTerbukaHariIni() {
  var sudahCocok = _idSudahCocok();
  var sudahBatal = _idDibatalkan();
  var hari = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var data = _sheetGoodsDeparted().getDataRange().getValues();
  var terbuka = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var id = String(r[0] || '').trim();
    if (!id || sudahCocok[id] || sudahBatal[id]) continue;
    var tglBaris = Utilities.formatDate(new Date(r[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (tglBaris !== hari) continue;
    terbuka.push({ eventId: id, tujuan: r[6], waktu: new Date(r[1]).toISOString() });
  }
  return terbuka;
}

/** Validasi ulang di titik tulis (bukan cuma di titik baca) — mencegah dua
 *  Driver mengonfirmasi keberangkatan yang sama kalau keduanya membuka
 *  layar hampir bersamaan, dan mencegah konfirmasi atas sesuatu yang baru
 *  saja dibatalkan. */
function _keberangkatanBolehDicocokkan(eventId) {
  var dataD = _sheetGoodsDeparted().getDataRange().getValues();
  var baris = null;
  for (var i = 1; i < dataD.length; i++) {
    if (String(dataD[i][0]).trim() === eventId) { baris = dataD[i]; break; }
  }
  if (!baris) return null;
  if (_idSudahCocok()[eventId]) return null;
  if (_idDibatalkan()[eventId]) return null;
  return { eventId: eventId, tujuan: baris[6] };
}

/** Correction Flow — Goods Departed hanya bisa dibatalkan oleh peran yang
 *  bisa menyiapkannya (Warehouse), dan hanya sebelum ada yang
 *  mengonfirmasi sampai. Tidak menghapus baris asli — menambah fakta baru
 *  di PEMBATALAN, sesuai Immutable History. */
function batalkanKeberangkatan(pin, eventId, alasan) {
  var orang = _masukTerverifikasi(pin);
  _kemampuan(orang, 'Warehouse');

  eventId = String(eventId || '').trim();
  if (!eventId) throw new Error('Keberangkatan yang mau dibatalkan tidak ditemukan.');
  if (_idSudahCocok()[eventId]) {
    throw new Error('Sudah dikonfirmasi sampai — tidak bisa dibatalkan lagi. Catat sebagai insiden kalau memang salah kirim.');
  }
  if (_idDibatalkan()[eventId]) {
    throw new Error('Keberangkatan ini sudah dibatalkan sebelumnya.');
  }

  var dataD = _sheetGoodsDeparted().getDataRange().getValues();
  var ada = false;
  for (var i = 1; i < dataD.length; i++) {
    if (String(dataD[i][0]).trim() === eventId) { ada = true; break; }
  }
  if (!ada) throw new Error('Keberangkatan tidak ditemukan.');

  _sheetPembatalan().appendRow([eventId, new Date(), orang.nama, String(alasan || '').trim()]);
  return { ok: true, eventId: eventId };
}

// ====================== FUNGSI UTAMA UNTUK CLIENT ======================

/** Login. Mengembalikan identitas + SEMUA kemampuan hari ini (bisa lebih
 *  dari satu — client menampilkan pilihan hanya kalau memang lebih dari
 *  satu, satu tap tambahan hanya saat benar-benar ambigu). */
function masuk(pin) {
  var orang = _masukTerverifikasi(pin);
  return { ok: true, nama: orang.nama, kemampuan: orang.kemampuan, tujuan: TUJUAN };
}

/** Goods Departed — TIDAK berubah perilakunya dari Increment 2. */
function catatKeberangkatan(pin, tujuan, fotoBase64, catatan) {
  var orang = _masukTerverifikasi(pin);
  var k = _kemampuan(orang, 'Warehouse');

  tujuan = String(tujuan || '').trim();
  if (TUJUAN.indexOf(tujuan) < 0) throw new Error('Tujuan tidak dikenal.');
  if (!fotoBase64) throw new Error('Foto belum diambil.');

  var waktu = new Date();
  var eventId = _buatEventId('DEP', waktu, tujuan);
  var fotoUrl = _simpanFoto(fotoBase64, eventId);

  _sheetGoodsDeparted().appendRow([
    eventId, waktu, 'Toko Sembako Sejahtera',
    k.app, k.status, orang.nama, tujuan, fotoUrl, String(catatan || '').trim()
  ]);

  return {
    ok: true, eventId: eventId, nama: orang.nama, peran: k.app,
    statusPeran: k.status, tujuan: tujuan, waktu: waktu.toISOString()
  };
}

/** BARU — daftar keberangkatan hari ini yang masih menunggu konfirmasi,
 *  untuk peran Driver. */
function ambilKeberangkatanTerbuka(pin) {
  var orang = _masukTerverifikasi(pin);
  _kemampuan(orang, 'Driver'); // pastikan berhak; lempar error kalau tidak
  return { ok: true, nama: orang.nama, terbuka: _keberangkatanTerbukaHariIni() };
}

/** BARU — Responsibility Accepted. Mencocokkan ke satu Goods Departed yang
 *  masih terbuka; begitu baris ini tersimpan, keberangkatan itu berhenti
 *  muncul di ambilKeberangkatanTerbuka() — Recorded -> Transferred. */
function catatKedatangan(pin, eventIdKeberangkatan, fotoBase64, catatan) {
  var orang = _masukTerverifikasi(pin);
  var k = _kemampuan(orang, 'Driver');

  eventIdKeberangkatan = String(eventIdKeberangkatan || '').trim();
  var berangkat = _keberangkatanBolehDicocokkan(eventIdKeberangkatan);
  if (!berangkat) {
    throw new Error('Keberangkatan ini sudah tidak ada atau sudah dikonfirmasi pihak lain.');
  }

  var waktu = new Date();
  var eventId = _buatEventId('REC', waktu, berangkat.tujuan);
  var fotoUrl = fotoBase64 ? _simpanFoto(fotoBase64, eventId) : '';

  _sheetGoodsReceived().appendRow([
    eventId, waktu, 'Toko Sembako Sejahtera',
    k.app, k.status, orang.nama, berangkat.tujuan, eventIdKeberangkatan,
    fotoUrl, String(catatan || '').trim(), waktu
  ]);

  return {
    ok: true, eventId: eventId, nama: orang.nama, tujuan: berangkat.tujuan,
    waktu: waktu.toISOString()
  };
}

/** BARU — Shift Started. Peran Shift saja (KASIR Primary, PENGANTAR/OWNER
 *  Acting saat menggantikan). Boleh dipanggil lebih dari sekali sehari —
 *  bukti jujur tentang apa yang benar-benar terjadi, bukan formulir yang
 *  memaksa satu jawaban "benar". */
function catatShiftMulai(pin, catatan) {
  var orang = _masukTerverifikasi(pin);
  var k = _kemampuan(orang, 'Shift');

  var waktu = new Date();
  var eventId = 'SHF-' + Utilities.formatDate(waktu, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');

  _sheetShiftEvents().appendRow([
    eventId, waktu, 'Toko Sembako Sejahtera', k.app, k.status, orang.nama, String(catatan || '').trim()
  ]);

  return { ok: true, eventId: eventId, nama: orang.nama, statusPeran: k.status, waktu: waktu.toISOString() };
}

/** BARU — dipakai layar Shift untuk menunjukkan apakah shift hari ini
 *  sudah ditandai mulai, oleh siapa, sebelum menawarkan tombol lagi. */
function ambilStatusShiftMulai(pin) {
  var orang = _masukTerverifikasi(pin);
  _kemampuan(orang, 'Shift');
  return { ok: true, nama: orang.nama, sudahMulai: _shiftMulaiHariIni() };
}

function _buatEventId(prefix, waktu, tujuan) {
  var tgl = Utilities.formatDate(waktu, Session.getScriptTimeZone(), 'yyyyMMdd');
  var jam = Utilities.formatDate(waktu, Session.getScriptTimeZone(), 'HHmmss');
  return prefix + '-' + tgl + '-' + (KODE_TUJUAN[tujuan] || 'LAIN') + '-' + jam;
}

function _simpanFoto(fotoBase64, eventId) {
  var m = String(fotoBase64).match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m) throw new Error('Format foto tidak dikenal.');
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], eventId + '.jpg');
  var file = _folderFoto().createFile(blob);
  return file.getUrl();
}
