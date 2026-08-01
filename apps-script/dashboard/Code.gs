// ============================================================================
// SMJ Enterprise OS — Dashboard (Presentation Layer)
// Dashboard Foundation · 1 Agustus 2026
// ============================================================================
//
// Proyek TERPISAH dari Buku Toko dan dari Delivery Evidence — hanya
// membaca, tidak pernah menulis ke Sheet siapa pun. Tiga sumber baca,
// semuanya read-only:
//   1. ORANG (Buku Toko)            — autentikasi & peran.
//   2. dashboard-dataset.json (Drive) — kartu finansial. Dihasilkan di
//      luar Apps Script oleh pipeline (Connector -> Reporting Service ->
//      Dataset Builder). Tidak ada satu perhitungan finansial pun di sini.
//   3. TUTUP_SHIFT (Buku Toko) + GOODS_DEPARTED/GOODS_RECEIVED (Delivery
//      Evidence) — status Shift dan Delivery. Dibaca dan dihitung
//      kehadiran/kecocokannya (Array.filter-setara), bukan dihitung
//      sebagai angka bisnis — beda kategori dari margin/laba yang memang
//      dilarang dihitung ulang di sini.
//
// CAKUPAN: CEO, Owner (baris OWNER kedua di ORANG — lihat catatan di
// _resolveOrang), dan Kasir. Dua Business Unit: Toko Sembako, Central
// Kitchen (Central Kitchen belum terhubung ke pipeline mana pun — dashboard
// ini menampilkan itu apa adanya, tidak berpura-pura punya datanya).
//
// Ditambahkan di atas Dashboard Foundation, tanpa mengubah tiga sumber baca
// di atas — hanya menambah SHIFT_EVENTS (Delivery Evidence, Shift Started)
// sebagai sumber baca keempat:
//   - Cash status — read-only, Kas Kasir/Kas Tunai/Selisih dari TUTUP_SHIFT
//     apa adanya. TIDAK ADA perhitungan kas di sini — itu tetap sepenuhnya
//     wewenang Buku Toko.
//   - Evidence Timeline & Operational History satu hari berjalan (§6
//     Operational Accountability Architecture), menggabungkan Pengiriman +
//     Shift Dimulai (Delivery Evidence) + Shift Ditutup (Buku Toko).
//   - Responsibility Window per kejadian (§3) dan Responsibility Timeline
//     — status SAAT INI per jendela, dihitung dari riwayat yang sama.
//   - Incident Trigger: perlu perhatian DIHITUNG dari ambang yang sudah
//     ada di produksi (TUTUP_SHIFT.Status, batas jendela Pengiriman 06:30)
//     ditambah satu deteksi baru — Responsibility Conflict: lebih dari
//     satu Shift Started hari ini. Bukan ambang baru yang dikarang, murni
//     menghitung dari bukti yang sudah tercatat.
//   - Correction Flow (pembatalan) hidup di proyek Delivery; di sini
//     pembatalan hanya ditampilkan apa adanya di riwayat, tidak dibuat.
//
// TIDAK ADA di sini: Incident Management penuh (pelaporan, eskalasi),
// grafik historis multi-hari, analytics, reporting baru. Riwayat yang ada
// di sini hanya untuk SATU hari berjalan.
// ============================================================================

// ====================== KONFIGURASI ======================

var NAMA_APP = 'SMJ Enterprise OS — Dashboard';
var VERSI    = '5.0.0 (Operational Foundation)';

var ID_BUKU_TOKO = '1yFF83m2Cd3v8WYU-6jDZTSGB-2TPEAIkJkBmH1iM_D8';

var FOLDER_INDUK          = 'SMJ ENTERPRISE OS';
var FOLDER_DATASET        = 'Dashboard Data';
var NAMA_FILE_DATASET     = 'dashboard-dataset.json';
var FOLDER_EVIDENCE       = 'Delivery Evidence';
var NAMA_SPREADSHEET_EVID = 'Delivery Evidence';

var UNIT_BISNIS = [
  { id: 'tss', nama: 'Toko Sembako' },
  { id: 'central-kitchen', nama: 'Central Kitchen' }
];

var KARTU_FINANSIAL_PENUH  = ['todays-revenue', 'transaction-count', 'gross-profit', 'net-profit'];
var KARTU_FINANSIAL_KASIR  = ['todays-revenue', 'transaction-count'];

var MAKS_GAGAL = 8;
var LAMA_KUNCI = 5;

// ====================== IDENTITAS & IZIN ======================

/**
 * Baca ORANG dari Buku Toko, read-only. Menentukan tier akses:
 *   - OWNER di unit TSS  -> 'ceo'    (Aditya)
 *   - OWNER di unit lain -> 'owner'  (baris OWNER kedua di ORANG hari ini
 *     adalah Sri Nurul, unit CK — ditampilkan dengan nama aslinya, bukan
 *     "Ibu": identitas "Ibu" belum punya baris sendiri di ORANG, jadi
 *     dashboard ini memberi tier Owner ke baris OWNER yang ada, apa
 *     adanya, tanpa mengklaim identitas yang tidak bisa dipastikan)
 *   - KASIR               -> 'cashier' (Ayu)
 *   - peran lain           -> ditolak, belum didukung
 */
function _resolveOrang(pin) {
  pin = String(pin || '').trim();
  if (!pin) throw new Error('PIN belum diisi.');

  var sh = SpreadsheetApp.openById(ID_BUKU_TOKO).getSheetByName('ORANG');
  if (!sh) throw new Error('Sheet ORANG tidak ditemukan di Buku Toko.');

  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (String(r[1]).trim() !== pin) continue;
    if (String(r[4]).trim().toUpperCase() !== 'YA') {
      throw new Error('PIN dikenal tapi akun tidak aktif.');
    }
    var peran = String(r[2]).trim().toUpperCase();
    var unit = String(r[3]).trim().toUpperCase();
    var tier;
    if (peran === 'OWNER' && unit === 'TSS') tier = 'ceo';
    else if (peran === 'OWNER') tier = 'owner';
    else if (peran === 'KASIR') tier = 'cashier';
    else throw new Error('Peran "' + r[2] + '" belum didukung dashboard ini.');
    return { nama: String(r[0]), tier: tier };
  }
  throw new Error('PIN tidak dikenal.');
}

function _cekKunciPin() {
  var c = CacheService.getScriptCache();
  if (c.get('KUNCI_PIN_DASH')) {
    throw new Error('Terlalu banyak PIN salah berturut-turut. ' +
                    'Tunggu ' + LAMA_KUNCI + ' menit, lalu coba lagi.');
  }
}

function _catatPinSalah() {
  var c = CacheService.getScriptCache();
  var n = Number(c.get('GAGAL_PIN_DASH') || 0) + 1;
  c.put('GAGAL_PIN_DASH', String(n), 600);
  if (n >= MAKS_GAGAL) {
    c.put('KUNCI_PIN_DASH', '1', LAMA_KUNCI * 60);
    c.remove('GAGAL_PIN_DASH');
  }
}

// ====================== AKSES PER TIER ======================

function _unitUntukTier(tier) {
  return tier === 'cashier' ? ['tss'] : ['tss', 'central-kitchen'];
}

function _kartuFinansialUntukTier(tier) {
  return tier === 'cashier' ? KARTU_FINANSIAL_KASIR : KARTU_FINANSIAL_PENUH;
}

function _operasiUntukTier(tier) {
  // Kas: CEO/Owner saja — sama alasan dengan kartu finansial, dan sejalan
  // dengan Business Rules Catalog FIN-010 (Cash: Human Approval Required,
  // selalu). Ayu tetap melihat kasnya sendiri lewat Tutup Shift di Buku
  // Toko, tidak lewat dashboard ini.
  return tier === 'cashier' ? ['shift'] : ['delivery', 'shift', 'cash'];
}

// ====================== WEB APP ======================

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle(NAMA_APP)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ====================== DATASET FINANSIAL (Drive) ======================

function _folderDataset() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_DATASET_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var induk = DriveApp.getFoldersByName(FOLDER_INDUK);
  while (induk.hasNext()) {
    var sub = induk.next().getFoldersByName(FOLDER_DATASET);
    if (sub.hasNext()) {
      var f = sub.next();
      props.setProperty('FOLDER_DATASET_ID', f.getId());
      return f;
    }
  }
  return null;
}

function _bacaDatasetDashboard() {
  var folder = _folderDataset();
  if (!folder) return { ada: false, alasan: 'Folder "' + FOLDER_DATASET + '" belum ditemukan di Drive.' };
  var it = folder.getFilesByName(NAMA_FILE_DATASET);
  if (!it.hasNext()) return { ada: false, alasan: 'File "' + NAMA_FILE_DATASET + '" belum ada di folder "' + FOLDER_DATASET + '".' };
  var file = it.next();
  var teks;
  try { teks = file.getBlob().getDataAsString('UTF-8'); }
  catch (e) { return { ada: false, alasan: 'File dataset tidak bisa dibaca: ' + e.message }; }
  var data;
  try { data = JSON.parse(teks); }
  catch (e) { return { ada: false, alasan: 'File dataset ada tapi bukan JSON yang valid.' }; }
  return { ada: true, data: data };
}

function _pilihKartu(dataset, idList) {
  var semua = dataset.dashboardCards || [];
  var hasil = [];
  for (var i = 0; i < idList.length; i++) {
    for (var j = 0; j < semua.length; j++) {
      if (semua[j].id === idList[i]) { hasil.push(semua[j]); break; }
    }
  }
  return hasil;
}

function _catatanUnit(dataset, unitId) {
  var daftar = (dataset && dataset.businessUnits) || [];
  for (var i = 0; i < daftar.length; i++) {
    if (daftar[i].id === unitId) return daftar[i];
  }
  return null;
}

// ====================== STATUS OPERASIONAL (Buku Toko + Delivery Evidence) ======================
// Membaca kehadiran/kecocokan baris yang sudah ada — bukan menghitung
// angka bisnis (margin, laba, dll). Sama seperti _keberangkatanTerbukaHariIni()
// di apps-script/delivery/Code.gs, dibaca ulang di sini karena dua proyek
// Apps Script terpisah tidak bisa saling memanggil fungsi.

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
  return null;
}

function _spreadsheetEvidence() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_EVIDENCE_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var folder = _folderEvidence();
  if (!folder) throw new Error('Folder "' + FOLDER_EVIDENCE + '" belum ditemukan.');
  var it = folder.getFilesByName(NAMA_SPREADSHEET_EVID);
  if (!it.hasNext()) throw new Error('Spreadsheet "' + NAMA_SPREADSHEET_EVID + '" belum ditemukan.');
  var file = it.next();
  props.setProperty('SPREADSHEET_EVIDENCE_ID', file.getId());
  return SpreadsheetApp.openById(file.getId());
}

function _statusPengiriman() {
  try {
    var ss = _spreadsheetEvidence();
    var shD = ss.getSheetByName('GOODS_DEPARTED');
    var shR = ss.getSheetByName('GOODS_RECEIVED');
    if (!shD || !shR) return { ada: false, alasan: 'Sheet bukti pengiriman tidak ditemukan.' };

    var hari = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var dataR = shR.getDataRange().getValues();
    var cocok = {};
    for (var i = 1; i < dataR.length; i++) {
      var id = String(dataR[i][7] || '').trim();
      if (id) cocok[id] = true;
    }

    var dataD = shD.getDataRange().getValues();
    var total = 0, selesai = 0;
    for (var j = 1; j < dataD.length; j++) {
      var r = dataD[j];
      var tgl = Utilities.formatDate(new Date(r[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (tgl !== hari) continue;
      total++;
      if (cocok[String(r[0]).trim()]) selesai++;
    }
    return { ada: true, total: total, selesai: selesai, menunggu: total - selesai };
  } catch (e) {
    return { ada: false, alasan: 'Data pengiriman belum bisa dibaca: ' + e.message };
  }
}

function _statusShift() {
  try {
    var sh = SpreadsheetApp.openById(ID_BUKU_TOKO).getSheetByName('TUTUP_SHIFT');
    if (!sh) return { ada: false, alasan: 'Sheet TUTUP_SHIFT tidak ditemukan.' };
    var n = sh.getLastRow() - 1;
    if (n <= 0) return { ada: true, ditutup: false };

    var hari = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var data = sh.getRange(2, 1, n, 14).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      var tgl = Utilities.formatDate(new Date(data[i][1]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (tgl === hari) {
        return { ada: true, ditutup: true, status: data[i][13], kasir: data[i][2] };
      }
    }
    return { ada: true, ditutup: false };
  } catch (e) {
    return { ada: false, alasan: 'Data shift belum bisa dibaca: ' + e.message };
  }
}

/** Cash status — read-only, dari kolom yang sudah dihitung Buku Toko
 *  sendiri di TUTUP_SHIFT (Kas Kasir, Kas Tunai, Selisih). Tidak ada
 *  perhitungan kas apa pun di sini — DO NOT TOUCH cash calculations,
 *  itu tetap wewenang Buku Toko sepenuhnya. */
function _statusKas() {
  try {
    var sh = SpreadsheetApp.openById(ID_BUKU_TOKO).getSheetByName('TUTUP_SHIFT');
    if (!sh) return { ada: false, alasan: 'Sheet TUTUP_SHIFT tidak ditemukan.' };
    var n = sh.getLastRow() - 1;
    if (n <= 0) return { ada: false, alasan: 'Belum ada shift tercatat.' };

    var hari = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var data = sh.getRange(2, 1, n, 14).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      var tgl = Utilities.formatDate(new Date(data[i][1]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (tgl === hari) {
        return { ada: true, kasKasir: data[i][5], kasTunai: data[i][6], selisih: data[i][12] };
      }
    }
    // Belum ada shift ditutup hari ini — tampilkan saldo dari penutupan
    // terakhir yang ada, dengan tanggalnya, bukan angka hari ini yang
    // belum benar-benar ada.
    var terakhir = data[data.length - 1];
    return {
      ada: true, belumHariIni: true,
      tanggalTerakhir: Utilities.formatDate(new Date(terakhir[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      kasKasir: terakhir[5], kasTunai: terakhir[6], selisih: terakhir[12]
    };
  } catch (e) {
    return { ada: false, alasan: 'Data kas belum bisa dibaca: ' + e.message };
  }
}

function _bacaOperasi(daftarOps) {
  var hasil = {};
  if (daftarOps.indexOf('delivery') >= 0) hasil.pengiriman = _statusPengiriman();
  if (daftarOps.indexOf('shift') >= 0) hasil.shift = _statusShift();
  if (daftarOps.indexOf('cash') >= 0) hasil.kas = _statusKas();
  return hasil;
}

// ====================== FUNGSI UTAMA UNTUK CLIENT ======================

/**
 * Satu pintu masuk data, dipanggil ulang setiap kali PIN masuk ATAU
 * Business Unit diganti — PIN divalidasi ulang setiap kali, tidak ada
 * sesi yang dipercaya begitu saja di client.
 */
function ambilDashboard(pin, unitId) {
  _cekKunciPin();
  var orang;
  try {
    orang = _resolveOrang(pin);
  } catch (e) {
    _catatPinSalah();
    throw e;
  }
  CacheService.getScriptCache().remove('GAGAL_PIN_DASH');

  var unitTersedia = _unitUntukTier(orang.tier);
  if (unitTersedia.indexOf(unitId) < 0) unitId = unitTersedia[0];

  var hasilDataset = _bacaDatasetDashboard();

  var respons = {
    ok: true, nama: orang.nama, tier: orang.tier,
    unitAktif: unitId, unitTersedia: unitTersedia,
    unitNama: UNIT_BISNIS,
    lastRefresh: hasilDataset.ada ? (hasilDataset.data.lastRefresh || null) : null
  };

  if (unitId === 'central-kitchen') {
    var infoUnit = hasilDataset.ada ? _catatanUnit(hasilDataset.data, 'central-kitchen') : null;
    respons.dataTersedia = false;
    respons.alasanDataKosong = (infoUnit && infoUnit.note) ||
      'Central Kitchen belum terhubung ke pipeline data Enterprise OS.';
    respons.kartu = [];
    respons.operasi = {};
    return respons;
  }

  if (!hasilDataset.ada) {
    respons.dataTersedia = false;
    respons.alasanDataKosong = hasilDataset.alasan;
    respons.kartu = [];
    respons.operasi = {};
    return respons;
  }

  respons.dataTersedia = true;
  respons.kartu = _pilihKartu(hasilDataset.data, _kartuFinansialUntukTier(orang.tier));
  respons.operasi = _bacaOperasi(_operasiUntukTier(orang.tier));
  respons.bolehRiwayat = (orang.tier === 'ceo' || orang.tier === 'owner');
  return respons;
}

// ====================== RESPONSIBILITY WINDOW ======================
// operational-accountability-architecture-v1.md §3 — tiga jendela yang
// sudah ditentukan CEO langsung, dipakai apa adanya, bukan diciptakan
// ulang. Apa pun di luar ketiganya (termasuk sebelum 05:00) ditandai jujur
// sebagai "Di luar jam operasional" — ini yang menjawab Outside Operating
// Hours Accountability tanpa perlu mekanisme terpisah.

var JENDELA_TANGGUNG_JAWAB = [
  { mulai: '05:00', selesai: '06:30', nama: 'Pengiriman' },
  { mulai: '06:30', selesai: '17:30', nama: 'Operasional Toko' },
  { mulai: '17:30', selesai: '23:59', nama: 'Penutupan' }
];

function _jendelaTanggungJawab(waktu) {
  var jm = Utilities.formatDate(waktu, Session.getScriptTimeZone(), 'HH:mm');
  for (var i = 0; i < JENDELA_TANGGUNG_JAWAB.length; i++) {
    var j = JENDELA_TANGGUNG_JAWAB[i];
    if (jm >= j.mulai && jm < j.selesai) return j.nama;
  }
  return 'Di luar jam operasional';
}

// ====================== EVIDENCE TIMELINE / OPERATIONAL HISTORY ======================
// Menggabungkan bukti yang sudah tercatat di tempat lain (Delivery Evidence
// + TUTUP_SHIFT), untuk SATU hari berjalan, urut waktu. Tidak menulis apa
// pun. Incident Trigger di sini murni menandai (perhatian: true/false)
// berdasarkan fakta yang sudah ada — TUTUP_SHIFT.Status yang sudah dihitung
// Buku Toko sendiri, dan keberangkatan yang masih terbuka setelah jendela
// Pengiriman berakhir (06:30) — bukan ambang baru yang dikarang di sini.

function _riwayatPengiriman(hari) {
  var hasil = [];
  var ss;
  try { ss = _spreadsheetEvidence(); }
  catch (e) {
    hasil.push({ waktu: new Date().toISOString(), jenis: 'Pengiriman', ringkasan: 'Belum tersedia', jendela: '', status: 'Belum tersedia', perhatian: false });
    return hasil;
  }
  var shD = ss.getSheetByName('GOODS_DEPARTED');
  var shR = ss.getSheetByName('GOODS_RECEIVED');
  var shB = ss.getSheetByName('PEMBATALAN');
  if (!shD || !shR) return hasil;

  var dataR = shR.getDataRange().getValues();
  var cocokPer = {};
  for (var i = 1; i < dataR.length; i++) {
    var idCocok = String(dataR[i][7] || '').trim();
    if (idCocok) cocokPer[idCocok] = true;
  }
  var batalPer = {};
  if (shB) {
    var dataB = shB.getDataRange().getValues();
    for (var b = 1; b < dataB.length; b++) {
      var idBatal = String(dataB[b][0] || '').trim();
      if (idBatal) batalPer[idBatal] = true;
    }
  }

  var dataD = shD.getDataRange().getValues();
  for (var j = 1; j < dataD.length; j++) {
    var r = dataD[j];
    var waktu = new Date(r[1]);
    if (Utilities.formatDate(waktu, Session.getScriptTimeZone(), 'yyyy-MM-dd') !== hari) continue;
    var id = String(r[0]).trim();
    var jendela = _jendelaTanggungJawab(waktu);
    var status, perhatian;
    if (batalPer[id]) { status = 'Dibatalkan'; perhatian = false; }
    else if (cocokPer[id]) { status = 'Tanggung jawab berpindah'; perhatian = false; }
    else { status = 'Menunggu konfirmasi'; perhatian = jendela !== 'Pengiriman'; }
    hasil.push({
      waktu: waktu.toISOString(), jenis: 'Barang Berangkat',
      ringkasan: r[5] + ' → ' + r[6], jendela: jendela, status: status, perhatian: perhatian
    });
  }

  for (var k = 1; k < dataR.length; k++) {
    var rr = dataR[k];
    var waktuR = new Date(rr[1]);
    if (Utilities.formatDate(waktuR, Session.getScriptTimeZone(), 'yyyy-MM-dd') !== hari) continue;
    hasil.push({
      waktu: waktuR.toISOString(), jenis: 'Barang Sampai',
      ringkasan: rr[5] + ' — ' + rr[6], jendela: _jendelaTanggungJawab(waktuR),
      status: 'Tanggung jawab berpindah', perhatian: false
    });
  }
  return hasil;
}

/** Shift Closed — dibaca apa adanya dari TUTUP_SHIFT (Buku Toko). Ini
 *  SATU-SATUNYA sumber untuk penutupan shift; Enterprise OS tidak
 *  membuat catatan penutupan kedua (No Duplicate Meaning). */
function _riwayatShiftTutup(hari) {
  var hasil = [];
  try {
    var sh = SpreadsheetApp.openById(ID_BUKU_TOKO).getSheetByName('TUTUP_SHIFT');
    if (!sh) return hasil;
    var n = sh.getLastRow() - 1;
    if (n <= 0) return hasil;
    var data = sh.getRange(2, 1, n, 14).getValues();
    for (var i = 0; i < data.length; i++) {
      var waktu = new Date(data[i][0]);
      if (Utilities.formatDate(new Date(data[i][1]), Session.getScriptTimeZone(), 'yyyy-MM-dd') !== hari) continue;
      var status = data[i][13];
      hasil.push({
        waktu: waktu.toISOString(), jenis: 'Shift Ditutup',
        ringkasan: String(data[i][2]), jendela: _jendelaTanggungJawab(waktu),
        status: status, perhatian: String(status).toUpperCase() !== 'WAJAR'
      });
    }
  } catch (e) {
    hasil.push({ waktu: new Date().toISOString(), jenis: 'Shift', ringkasan: 'Belum tersedia', jendela: '', status: 'Belum tersedia', perhatian: false });
  }
  return hasil;
}

/** Shift Started — dibaca dari SHIFT_EVENTS (Delivery Evidence), satu-
 *  satunya tempat kejadian ini pernah tercatat (Buku Toko tidak punya
 *  ini). Incident Trigger "Responsibility Conflict": kalau ada LEBIH DARI
 *  SATU Shift Started hari ini, semuanya ditandai perhatian — bukan
 *  karena salah satunya salah, tapi karena siapa yang sebenarnya
 *  bertugas jadi tidak jelas tanpa dicek manusia. */
function _riwayatShiftMulai(hari) {
  var hasil = [];
  try {
    var ss = _spreadsheetEvidence();
    var sh = ss.getSheetByName('SHIFT_EVENTS');
    if (!sh) return hasil;
    var data = sh.getDataRange().getValues();
    var milikHariIni = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      var waktu = new Date(r[1]);
      if (Utilities.formatDate(waktu, Session.getScriptTimeZone(), 'yyyy-MM-dd') !== hari) continue;
      milikHariIni.push({ waktu: waktu, operator: r[5], statusPeran: r[4] });
    }
    var konflik = milikHariIni.length > 1;
    milikHariIni.forEach(function (m) {
      hasil.push({
        waktu: m.waktu.toISOString(), jenis: 'Shift Dimulai',
        ringkasan: m.operator + (m.statusPeran === 'Acting' ? ' (mengisi hari ini)' : ''),
        jendela: _jendelaTanggungJawab(m.waktu),
        status: konflik ? 'Lebih dari satu — periksa' : 'Tercatat',
        perhatian: konflik
      });
    });
  } catch (e) {
    // Belum tersedia — tidak menambah entri palsu, cukup diam; kartu
    // Operasi lain sudah menjelaskan kalau Delivery Evidence belum siap.
  }
  return hasil;
}

function _riwayatHariIni() {
  var hari = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var gabungan = _riwayatPengiriman(hari)
    .concat(_riwayatShiftMulai(hari))
    .concat(_riwayatShiftTutup(hari));
  gabungan.sort(function (a, b) { return new Date(a.waktu) - new Date(b.waktu); });
  return gabungan;
}

/** Responsibility Timeline — bukan riwayat, tapi status SAAT INI: siapa
 *  yang tercatat bertanggung jawab untuk tiap jendela, per bukti yang
 *  sudah ada hari ini. Dihitung dari entri paling akhir yang relevan di
 *  tiap jendela, bukan sumber baru. */
function _tanggungJawabSaatIni(riwayat) {
  var hasil = {};
  JENDELA_TANGGUNG_JAWAB.forEach(function (j) { hasil[j.nama] = null; });

  riwayat.forEach(function (r) {
    if (!hasil.hasOwnProperty(r.jendela)) return;
    if (r.jenis === 'Barang Berangkat' || r.jenis === 'Barang Sampai') {
      hasil['Pengiriman'] = { siapa: r.ringkasan.split(/→|—/)[0].trim(), waktu: r.waktu, status: r.status };
    } else if (r.jenis === 'Shift Dimulai') {
      hasil['Operasional Toko'] = { siapa: r.ringkasan, waktu: r.waktu, status: 'Sedang bertugas' };
    } else if (r.jenis === 'Shift Ditutup') {
      hasil['Penutupan'] = { siapa: r.ringkasan, waktu: r.waktu, status: r.status };
    }
  });
  return hasil;
}

/** Evidence Timeline / Operational History — CEO dan Owner saja. Kasir
 *  tidak diberi ini: yang tercatat di sini mencakup jam sebelum shiftnya
 *  mulai, dan bukan urusannya untuk ditinjau (Operational Accountability
 *  Architecture §3 — melindungi, bukan membebani). */
function ambilRiwayat(pin) {
  _cekKunciPin();
  var orang;
  try {
    orang = _resolveOrang(pin);
  } catch (e) {
    _catatPinSalah();
    throw e;
  }
  CacheService.getScriptCache().remove('GAGAL_PIN_DASH');

  if (orang.tier !== 'ceo' && orang.tier !== 'owner') {
    throw new Error('Riwayat hari ini belum tersedia untuk peran ini.');
  }

  var riwayat = _riwayatHariIni();
  return {
    ok: true, nama: orang.nama, riwayat: riwayat,
    tanggungJawabSaatIni: _tanggungJawabSaatIni(riwayat)
  };
}
