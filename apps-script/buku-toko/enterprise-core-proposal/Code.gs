// ============================================================================
// Buku Toko Sembako & Central Kitchen — Code.gs (Enterprise Core orchestrator)
// PROPOSAL — internal-service refactor, not deployed. See README.md.
// ============================================================================
// This file is what remains after every internal service (00 through 11)
// is pulled out into its own file. It is the web app entry point, the
// spreadsheet-menu builder, the one-time/idempotent sheet provisioning
// routine, and the two small aggregator functions the client app calls on
// load. Everything else it calls (perbaikiMaster, _bacaMaster,
// _isiUlangTujuanTerima, _daftarKirimHariIni, etc.) lives in the service
// files — this works because every .gs file in one Apps Script project
// shares a single global namespace at runtime. Moved verbatim from the
// live Code.gs.
// ============================================================================

// ====================== SETUP ======================

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- ORANG ---
  var orang = _sheet(ss, 'ORANG');
  if (orang.getLastRow() <= 1) {
    orang.clear();
    orang.getRange(1, 1, 1, 8).setValues(
      [['Nama','PIN','Peran','Unit','Aktif','No WA','Unit Dilihat','Catatan']]);
    orang.getRange(2, 1, ORANG_AWAL.length, 8).setValues(ORANG_AWAL);
    orang.getRange(2, 2, ORANG_AWAL.length, 1).setNumberFormat('@');
    orang.getRange(2, 6, ORANG_AWAL.length, 1).setNumberFormat('@');
    orang.getRange(2, 1, ORANG_AWAL.length, 8).setBackground('#FFF3CD');
  } else if (orang.getLastColumn() < 7) {
    orang.insertColumnBefore(6);
    orang.getRange(1, 6).setValue('No WA');
    var nn = orang.getLastRow() - 1;
    var nm = orang.getRange(2, 1, nn, 1).getValues();
    var wa = { 'Ayu':'6289531701574', 'Mas Haris':'6285974625595',
               'Mas War':'6285227322833', 'Aditya':'6285190022529',
               'Sri Nurul':'6282130933995' };
    orang.getRange(2, 6, nn, 1).setNumberFormat('@');
    for (var w = 0; w < nn; w++) {
      var nmw = String(nm[w][0]).trim();
      if (wa[nmw]) orang.getRange(w + 2, 6).setValue(wa[nmw]);
    }
  }
  if (orang.getLastColumn() === 7 &&
      String(orang.getRange(1, 7).getValue()).toLowerCase().indexOf('unit') < 0) {
    orang.insertColumnBefore(7);
    orang.getRange(1, 7).setValue('Unit Dilihat');
    var nu = orang.getLastRow() - 1;
    var nmu = orang.getRange(2, 1, nu, 1).getValues();
    for (var u = 0; u < nu; u++) {
      var s = String(nmu[u][0]).trim().toLowerCase();
      if (s === 'aditya') orang.getRange(u + 2, 7).setValue('TSS,CK');
      if (s === 'sri nurul') orang.getRange(u + 2, 7).setValue('CK');
    }
  }
  _headerStyle(orang, 8);
  orang.autoResizeColumns(1, 8);

  // --- LOG_AKSES ---
  var log = _sheet(ss, 'LOG_AKSES');
  if (log.getLastRow() === 0) {
    log.appendRow(['Waktu', 'Tanggal', 'Nama', 'Peran', 'Aksi', 'Keterangan']);
    _headerStyle(log, 6);
  }

  // --- DOMPET ---
  var dom = _sheet(ss, 'DOMPET');
  if (dom.getLastRow() <= 1) {
    dom.clear();
    dom.getRange(1, 1, 1, 6).setValues(
      [['Kode', 'Nama Dompet', 'Jenis', 'Berlaku Dari', 'Berlaku Sampai', 'Urutan']]);
    dom.getRange(2, 1, DOMPET_AWAL.length, 6).setValues(DOMPET_AWAL);
  }
  _headerStyle(dom, 6);
  dom.autoResizeColumns(1, 6);

  // --- TUTUP_SHIFT (v2.1: 26 kolom) ---
  var ts = _sheet(ss, 'TUTUP_SHIFT');
  if (ts.getLastRow() === 0) {
    ts.appendRow(['Waktu Input', 'Tanggal', 'Kasir',
                  'Penjualan Tunai', 'Pengeluaran Tunai',
                  'Kas Kasir', 'Kas Tunai', 'Setor ke Ibu', 'Setor BRI', 'Prive Owner',
                  'Kas Awal', 'Seharusnya Tersisa', 'Selisih', 'Status',
                  'Cek Loka', 'Cek Struk', 'Cek Backup', 'Catatan',
                  'Foto Struk', 'Foto Kas Kasir', 'Foto Kas Tunai', 'Foto Lain',
                  'Saldo Brankas Awal', 'Tanggal Setor Fisik',
                  'Referensi Mutasi', 'Status Setoran']);
    _headerStyle(ts, KOL_SHIFT);
    ts.getRange('D:M').setNumberFormat('#,##0');
    ts.getRange('W:W').setNumberFormat('#,##0');
  } else if (ts.getLastColumn() < KOL_SHIFT) {
    // Tambah kolom baru di ujung kanan. Kolom lama tidak dipindah sama sekali,
    // jadi tidak ada risiko data lama jadi salah kolom.
    ts.getRange(1, 23, 1, 4).setValues(
      [['Saldo Brankas Awal', 'Tanggal Setor Fisik',
        'Referensi Mutasi', 'Status Setoran']]);
    _headerStyle(ts, KOL_SHIFT);
    ts.getRange('W:W').setNumberFormat('#,##0');
  }

  // --- BEBAN (BARU v2.1) ---
  var beban = _sheet(ss, 'BEBAN');
  if (beban.getLastRow() === 0) {
    beban.appendRow(['Tanggal', 'Jenis', 'Keterangan', 'Nilai', 'Dicatat Oleh']);
    _headerStyle(beban, 5);
    beban.getRange('D:D').setNumberFormat('#,##0');
    beban.getRange(2, 1, 1, 5).setValues([[
      '', 'CONTOH', 'Hapus baris ini. Jenis: Gaji / Sewa / Listrik / ' +
      'Transport / Susut / Lain', 0, '']]);
    beban.getRange(2, 1, 1, 5).setBackground('#FFF3CD');
  }

  var tg = _sheet(ss, 'TARGET');
  if (tg.getLastRow() <= 1) {
    tg.clear();
    tg.getRange(1, 1, 1, 3).setValues([['Unit', 'Target Laba / Bulan', 'Catatan']]);
    tg.getRange(2, 1, 2, 3).setValues([
      ['TSS', TARGET_LABA.TSS, 'Ubah di sini kalau target berubah'],
      ['CK',  TARGET_LABA.CK,  'Diisi setelah data Central Kitchen masuk']]);
    tg.getRange('B:B').setNumberFormat('#,##0');
  }
  _headerStyle(tg, 3);

  perbaikiMaster();
  perbaikiMasterCK();

  var hlog = _sheet(ss, 'HARGA_LOG');
  if (hlog.getLastRow() === 0) {
    hlog.appendRow(['Waktu', 'Tanggal', 'Barang', 'Harga Lama', 'Harga Baru',
                    'Selisih', '% Ubah', 'Diubah Oleh', 'Catatan']);
    _headerStyle(hlog, 9);
    hlog.getRange('D:F').setNumberFormat('#,##0');
    hlog.getRange('G:G').setNumberFormat('0.0%');
  }

  // --- KELUAR ---
  var keluar = _sheet(ss, 'KELUAR');
  if (keluar.getLastRow() === 0) {
    keluar.appendRow(['Waktu Input', 'Tanggal', 'Tujuan', 'Rit ke-', 'Penyiap',
                      'Barang', 'Qty', 'Satuan', 'Harga', 'Nilai', 'Catatan', 'ID Kirim',
                      'Unit Asal']);
    _headerStyle(keluar, KOL_KELUAR);
  } else if (keluar.getLastColumn() < KOL_KELUAR) {
    keluar.getRange(1, 13).setValue('Unit Asal');
    var nk = keluar.getLastRow() - 1;
    if (nk > 0) {
      var isi = [];
      for (var q = 0; q < nk; q++) isi.push(['TSS']);
      keluar.getRange(2, 13, nk, 1).setValues(isi);
    }
    _headerStyle(keluar, KOL_KELUAR);
  }

  // --- TERIMA ---
  var terima = _sheet(ss, 'TERIMA');
  if (terima.getLastRow() === 0) {
    terima.appendRow(['Waktu Input', 'Tanggal', 'ID Kirim', 'Penerima',
                      'Barang', 'Qty Diterima', 'Satuan', 'Catatan',
                      'Tujuan', 'Unit Asal']);
    _headerStyle(terima, KOL_TERIMA);
  } else if (terima.getLastColumn() < KOL_TERIMA) {
    terima.getRange(1, 9).setValue('Tujuan');
    terima.getRange(1, 10).setValue('Unit Asal');
    _isiUlangTujuanTerima(terima);
    _headerStyle(terima, KOL_TERIMA);
  }

  // --- REKAP ---
  var rekap = _sheet(ss, 'REKAP');
  if (rekap.getLastRow() === 0) {
    rekap.appendRow(['Tanggal', 'Tujuan', 'Barang', 'Qty Keluar', 'Qty Diterima',
                     'Selisih', 'Nilai Keluar', 'Status', 'ID Kirim', 'Unit']);
    _headerStyle(rekap, KOL_REKAP);
  } else if (rekap.getLastColumn() < KOL_REKAP) {
    rekap.getRange(1, 9).setValue('ID Kirim');
    rekap.getRange(1, 10).setValue('Unit');
    _headerStyle(rekap, KOL_REKAP);
  }

  // --- BATAL (BARU v2.1) — jejak audit pembatalan ---
  var batal = _sheet(ss, 'BATAL');
  if (batal.getLastRow() === 0) {
    batal.appendRow(['Waktu', 'Tanggal', 'Dibatalkan Oleh', 'Jenis',
                     'ID Kirim', 'Jumlah Baris', 'Alasan', 'Isi Lengkap']);
    _headerStyle(batal, 8);
  }

  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'rekapHarian' || f === 'kirimPOMalam' ||
        f === 'hitungRingkasLoka' || f === 'cekHarianKas') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('rekapHarian').timeBased().atHour(JAM_REKAP).everyDays(1).create();
  ScriptApp.newTrigger('kirimPOMalam').timeBased().atHour(JAM_PO).everyDays(1).create();
  ScriptApp.newTrigger('hitungRingkasLoka').timeBased().atHour(20).everyDays(1).create();
  ScriptApp.newTrigger('cekHarianKas').timeBased().atHour(7).everyDays(1).create();

  ss.toast('Setup v' + VERSI + ' selesai. Sheet BEBAN & BATAL dibuat, ' +
           'TUTUP_SHIFT ditambah 4 kolom. Kalau ini pemasangan baru, buka sheet ' +
           'ORANG dan GANTI SEMUA PIN sebelum link dibagikan.', NAMA_APP, 12);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(NAMA_APP)
    .addItem('Setup / perbaiki sistem', 'setup')
    .addItem('Perbaiki daftar barang (MASTER)', 'perbaikiMasterMenu')
    .addItem('Perbaiki daftar barang Dapur (MASTER_CK)', 'perbaikiMasterCKMenu')
    .addItem('Rekap sekarang', 'rekapSekarang')
    .addItem('Kirim PO besok sekarang', 'kirimPOSekarang')
    .addItem('Hitung ulang data Loka', 'hitungLokaMenu')
    .addSeparator()
    .addItem('Cek kas sekarang (uang menginap dll)', 'cekHarianKas')
    .addItem('Set saldo brankas awal (hitung fisik dulu)', 'setBrankasMenu')
    .addSeparator()
    .addItem('Cek ID Kirim bermasalah (uji coba)', 'migrasiIdKirimUjiCoba')
    .addItem('Perbaiki ID Kirim lama (JALANKAN)', 'migrasiIdKirimJalankan')
    .addToUi();
}

// ====================== WEB APP ======================

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle(NAMA_APP)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function ambilKonfigurasi(pin) {
  var o = _siapa(pin);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var orangSh = ss.getSheetByName('ORANG');
  var no = Math.max(orangSh.getLastRow() - 1, 0);
  var penyiap = no ? orangSh.getRange(2, 1, no, 5).getValues()
      .filter(function (r) { return String(r[4]).toUpperCase() === 'YA'; })
      .map(function (r) { return String(r[0]).trim(); }) : [];

  return {
    orang: o,
    penyiap: penyiap,
    tujuan: TUJUAN,
    items: _bacaMaster('MASTER'),
    itemsCK: _bacaMaster('MASTER_CK'),
    kirimHariIni: _daftarKirimHariIni()
  };
}

function segarkanKiriman(pin) {
  var o = _siapa(pin);
  _boleh(o, 'terima');
  return _daftarKirimHariIni();
}
