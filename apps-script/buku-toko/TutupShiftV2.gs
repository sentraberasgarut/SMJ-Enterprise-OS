/**
 * ============================================================================
 * TUTUP SHIFT V2 - Buku Toko & Central Kitchen
 * ============================================================================
 *
 * Modul MANDIRI. Tidak menimpa fungsi yang sudah ada.
 * Semua akses kolom lewat NAMA HEADER, bukan indeks - jadi aman walaupun
 * urutan kolom di sheet berbeda dari yang diasumsikan.
 *
 * Dasar: apps-script/buku-toko/SPEC-tutup-shift-v2.md
 *
 * ⚠️ BELUM DIUJI. Ditulis tanpa akses untuk menjalankan Apps Script.
 *    Jalankan `ujiTutupShiftV2()` di editor sebelum dipakai produksi.
 *
 * URUTAN PEMASANGAN:
 *   1. Paste file ini sebagai file baru di project Apps Script
 *   2. Jalankan sekali: migrasiTambahKolomV2()
 *   3. Jalankan sekali: setSaldoBrankasAwalManual(<hasil hitung fisik>)
 *   4. Jalankan: ujiTutupShiftV2() - pastikan semua lolos
 *   5. Baru sambungkan ke form tutup shift (lihat bagian INTEGRASI di bawah)
 */

// ============================================================================
// KONFIGURASI - ubah di sini kalau kebijakan berubah
// ============================================================================

var CFG = {
  // Nama sheet
  SHEET_TUTUP_SHIFT: 'Tutup Shift',
  SHEET_PENGGUNA: 'Pengguna',
  SHEET_DOMPET: 'Dompet',

  // Batas kebijakan kas (Runbook Kustodi Kas, berlaku 31 Jul 2026)
  BATAS_KAS_KASIR: 300000,      // float laci, kelebihannya wajib masuk brankas
  BATAS_BRANKAS_MENGINAP: 2000000,  // di atas ini wajib setor hari itu
  BATAS_PENDAMPING: 5000000,     // di atas ini tidak boleh berangkat sendirian
  MAKS_HARI_MENGINAP: 3,         // hari ke-3 naik jadi wajib setor
  JAM_AMAN_TERAKHIR: 18.5,       // 18:30 - lewat ini jangan berangkat
  AMBANG_PERLU_PENJELASAN: 100000, // selisih di atas ini wajib ada catatan

  // Kolom baru yang ditambahkan v2
  KOLOM_BARU: [
    'Saldo Brankas Awal',
    'Saldo Brankas Akhir',
    'Jenjang Setoran',
    'Status Setoran',
    'Tanggal Setor Fisik',
    'Referensi Mutasi',
    'Alasan Gagal Setor',
    'Hari Menginap',
    'Diverifikasi Oleh',
    'Tgl Verifikasi'
  ],

  STATUS_SETORAN: {
    TIDAK_PERLU: 'TIDAK PERLU',
    MENUNGGU: 'MENUNGGU VERIFIKASI',
    COCOK: 'COCOK',
    SELISIH: 'SELISIH',
    GAGAL: 'GAGAL SETOR'
  }
};

// ============================================================================
// HELPER - akses sheet & kolom by nama
// ============================================================================

function _sheet(nama) {
  var sh = SpreadsheetApp.getActive().getSheetByName(nama);
  if (!sh) throw new Error('Sheet "' + nama + '" tidak ditemukan');
  return sh;
}

/** Peta nama header -> indeks kolom (1-based). Case-insensitive, trim. */
function _peta(sh) {
  var lastCol = sh.getLastColumn();
  if (lastCol < 1) return {};
  var head = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var peta = {};
  for (var i = 0; i < head.length; i++) {
    var k = String(head[i]).trim().toLowerCase();
    if (k) peta[k] = i + 1;
  }
  return peta;
}

function _kol(peta, nama) {
  var c = peta[String(nama).trim().toLowerCase()];
  if (!c) throw new Error('Kolom "' + nama + '" tidak ada. Jalankan migrasiTambahKolomV2() dulu.');
  return c;
}

/** Ada kolomnya atau tidak, tanpa melempar error. */
function _adaKol(peta, nama) {
  return !!peta[String(nama).trim().toLowerCase()];
}

/** Angka dari sel yang bisa berupa number atau string "1.234.567". */
function _angka(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  var s = String(v).replace(/[^0-9,\-]/g, '').replace(/,/g, '.');
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function _tz() {
  return SpreadsheetApp.getActive().getSpreadsheetTimeZone() || 'Asia/Jakarta';
}

function _tglStr(d) {
  return Utilities.formatDate(d instanceof Date ? d : new Date(d), _tz(), 'yyyy-MM-dd');
}

// ============================================================================
// 1. MIGRASI - tambah kolom baru, aman dijalankan berulang
// ============================================================================

/**
 * Tambahkan kolom v2 yang belum ada di sheet Tutup Shift.
 * Aman dijalankan berapa kali pun - kolom yang sudah ada dilewati.
 * TIDAK menghapus atau memindahkan kolom apa pun, termasuk 'Setor ke Ibu'
 * yang sengaja dipertahankan untuk menelusuri data historis.
 */
function migrasiTambahKolomV2() {
  var sh = _sheet(CFG.SHEET_TUTUP_SHIFT);
  var peta = _peta(sh);
  var ditambah = [];

  CFG.KOLOM_BARU.forEach(function (nama) {
    if (_adaKol(peta, nama)) return;
    var col = sh.getLastColumn() + 1;
    sh.getRange(1, col).setValue(nama).setFontWeight('bold');
    ditambah.push(nama);
    peta[nama.toLowerCase()] = col;
  });

  var msg = ditambah.length
    ? 'Kolom ditambahkan: ' + ditambah.join(', ')
    : 'Semua kolom v2 sudah ada, tidak ada perubahan.';
  Logger.log(msg);
  return msg;
}

/**
 * Set titik nol saldo brankas SEKALI SAJA, dari hasil hitung uang fisik.
 * Wajib dijalankan sebelum rantai saldo bisa dipercaya.
 *
 * @param {number} saldoFisik hasil hitung uang di brankas hari ini
 */
function setSaldoBrankasAwalManual(saldoFisik) {
  if (typeof saldoFisik !== 'number' || saldoFisik < 0) {
    throw new Error('saldoFisik harus angka >= 0. Contoh: setSaldoBrankasAwalManual(9200000)');
  }
  var props = PropertiesService.getDocumentProperties();
  props.setProperty('SALDO_BRANKAS_TITIK_NOL', String(saldoFisik));
  props.setProperty('SALDO_BRANKAS_TITIK_NOL_TGL', _tglStr(new Date()));
  var msg = 'Titik nol brankas diset: Rp' + saldoFisik.toLocaleString('id-ID')
    + ' pada ' + _tglStr(new Date());
  Logger.log(msg);
  return msg;
}

// ============================================================================
// 2. RANTAI SALDO BRANKAS - inti perbaikan v2
// ============================================================================

/**
 * Ambil Saldo Brankas Akhir dari baris tutup shift TERAKHIR.
 * Kalau belum ada riwayat, pakai titik nol yang diset manual.
 * Inilah yang hilang di v1 - Kas Awal hanya membawa Kas Kasir, sehingga
 * saldo brankas lenyap dari perhitungan tiap hari tanpa jejak.
 */
function ambilSaldoBrankasAwal() {
  var sh = _sheet(CFG.SHEET_TUTUP_SHIFT);
  var peta = _peta(sh);
  var lastRow = sh.getLastRow();

  if (lastRow >= 2 && _adaKol(peta, 'Saldo Brankas Akhir')) {
    var col = _kol(peta, 'Saldo Brankas Akhir');
    // Cari baris terakhir yang saldo akhirnya terisi
    for (var r = lastRow; r >= 2; r--) {
      var v = sh.getRange(r, col).getValue();
      if (v !== '' && v !== null) return _angka(v);
    }
  }

  var nol = PropertiesService.getDocumentProperties().getProperty('SALDO_BRANKAS_TITIK_NOL');
  if (nol === null) {
    throw new Error(
      'Titik nol brankas belum diset. Hitung uang fisik di brankas, '
      + 'lalu jalankan: setSaldoBrankasAwalManual(<angkanya>)'
    );
  }
  return _angka(nol);
}

/** Kas Kasir akhir dari baris terakhir, atau 0 kalau belum ada. */
function ambilKasKasirAwal() {
  var sh = _sheet(CFG.SHEET_TUTUP_SHIFT);
  var peta = _peta(sh);
  var lastRow = sh.getLastRow();
  if (lastRow < 2 || !_adaKol(peta, 'Kas Kasir')) return 0;
  var col = _kol(peta, 'Kas Kasir');
  for (var r = lastRow; r >= 2; r--) {
    var v = sh.getRange(r, col).getValue();
    if (v !== '' && v !== null) return _angka(v);
  }
  return 0;
}

// ============================================================================
// 3. PERHITUNGAN - fungsi murni, bisa diuji tanpa sheet
// ============================================================================

/**
 * Hitung tutup shift. Fungsi MURNI - tidak menyentuh sheet, mudah diuji.
 *
 * @param {Object} in
 *   kasKasirAwal, saldoBrankasAwal, penjualanTunai, pengeluaranTunai,
 *   setorBri, priveOwner, kasKasirAkhir, saldoBrankasAkhir
 * @return {Object} { totalKasAwal, seharusnya, nyata, selisih, statusSelisih }
 */
function hitungTutupShift(inp) {
  var totalKasAwal = _angka(inp.kasKasirAwal) + _angka(inp.saldoBrankasAwal);

  var seharusnya = totalKasAwal
    + _angka(inp.penjualanTunai)
    - _angka(inp.pengeluaranTunai)
    - _angka(inp.setorBri)
    - _angka(inp.priveOwner);

  var nyata = _angka(inp.kasKasirAkhir) + _angka(inp.saldoBrankasAkhir);
  var selisih = nyata - seharusnya;

  return {
    totalKasAwal: totalKasAwal,
    seharusnya: seharusnya,
    nyata: nyata,
    selisih: selisih,
    statusSelisih: Math.abs(selisih) > CFG.AMBANG_PERLU_PENJELASAN ? 'PERLU DICEK' : 'WAJAR'
  };
}

/**
 * Tentukan jenjang setoran dari saldo brankas akhir.
 * A = simpan brankas · B = wajib setor hari itu · C = wajib setor + pendamping
 */
function tentukanJenjangSetoran(saldoBrankasAkhir, hariMenginap) {
  var s = _angka(saldoBrankasAkhir);
  var hari = _angka(hariMenginap);

  if (s <= 0) return { jenjang: '-', wajibSetor: false, pendamping: false, alasan: 'brankas kosong' };

  if (s > CFG.BATAS_PENDAMPING) {
    return { jenjang: 'C', wajibSetor: true, pendamping: true,
      alasan: 'di atas Rp' + CFG.BATAS_PENDAMPING.toLocaleString('id-ID') + ' - jangan berangkat sendirian' };
  }
  if (s > CFG.BATAS_BRANKAS_MENGINAP) {
    return { jenjang: 'B', wajibSetor: true, pendamping: false,
      alasan: 'di atas Rp' + CFG.BATAS_BRANKAS_MENGINAP.toLocaleString('id-ID') + ' - setor hari ini' };
  }
  if (hari >= CFG.MAKS_HARI_MENGINAP) {
    return { jenjang: 'B', wajibSetor: true, pendamping: false,
      alasan: 'sudah ' + hari + ' hari menginap - eskalasi otomatis' };
  }
  return { jenjang: 'A', wajibSetor: false, pendamping: false, alasan: 'boleh simpan brankas' };
}

/** Jam sekarang lewat batas aman untuk berangkat ke ATM? */
function lewatJamAman(waktu) {
  var d = waktu instanceof Date ? waktu : new Date();
  var jam = d.getHours() + d.getMinutes() / 60;
  return jam > CFG.JAM_AMAN_TERAKHIR;
}

// ============================================================================
// 4. VALIDASI - dipanggil SEBELUM simpan
// ============================================================================

/**
 * Kembalikan array pesan error. Kosong = boleh disimpan.
 * Pesan sengaja ditulis untuk dibaca kasir, bukan programmer.
 */
function validasiTutupShift(inp, hasil) {
  var e = [];

  if (_angka(inp.kasKasirAkhir) > CFG.BATAS_KAS_KASIR) {
    e.push('Kas Kasir Rp' + _angka(inp.kasKasirAkhir).toLocaleString('id-ID')
      + ' melebihi batas Rp' + CFG.BATAS_KAS_KASIR.toLocaleString('id-ID')
      + '. Kelebihannya masukkan ke brankas dulu.');
  }

  var jenjang = tentukanJenjangSetoran(inp.saldoBrankasAkhir, inp.hariMenginap);
  if (jenjang.wajibSetor && !inp.statusSetoran) {
    e.push('Saldo brankas Rp' + _angka(inp.saldoBrankasAkhir).toLocaleString('id-ID')
      + ' masuk Jenjang ' + jenjang.jenjang + ' (' + jenjang.alasan
      + '). Pilih dulu: sudah setor, atau gagal setor beserta alasannya.');
  }

  if (inp.statusSetoran === CFG.STATUS_SETORAN.GAGAL && !inp.alasanGagalSetor) {
    e.push('Status GAGAL SETOR wajib diisi alasannya: mesin penuh / uang ditolak / offline / lewat jam aman.');
  }

  if (inp.statusSetoran === CFG.STATUS_SETORAN.MENUNGGU && !inp.tanggalSetorFisik) {
    e.push('Isi Tanggal Setor Fisik - tanggal uang benar-benar masuk ATM/rekening, '
      + 'bukan tanggal tutup shift. Tanpa ini rekonsiliasi BRI tidak bisa dicocokkan.');
  }

  if ([CFG.STATUS_SETORAN.COCOK, CFG.STATUS_SETORAN.SELISIH].indexOf(inp.statusSetoran) >= 0) {
    e.push('Status COCOK/SELISIH hanya boleh diisi Aditya atau Ibu saat verifikasi mutasi, '
      + 'bukan oleh kasir saat tutup shift.');
  }

  if (_angka(inp.saldoBrankasAkhir) > 0 && !inp.fotoKasTunai) {
    e.push('Foto uang di brankas wajib diunggah kalau saldo brankas tidak nol.');
  }

  if (hasil && Math.abs(hasil.selisih) > CFG.AMBANG_PERLU_PENJELASAN && !inp.catatan) {
    e.push('Selisih Rp' + hasil.selisih.toLocaleString('id-ID')
      + ' melebihi Rp' + CFG.AMBANG_PERLU_PENJELASAN.toLocaleString('id-ID')
      + '. Tulis penjelasannya sekarang, jangan nanti.');
  }

  return e;
}

// ============================================================================
// 5. NOTIFIKASI WA - kerangka, butuh gateway
// ============================================================================

/**
 * ⚠️ BELUM BERFUNGSI. Apps Script tidak bisa mengirim WhatsApp sendiri.
 * Butuh salah satu:
 *   (a) n8n webhook  <- disarankan, n8n sudah tersambung dan cloud-based
 *   (b) WhatsApp Business API resmi (Meta)
 *   (c) layanan gateway pihak ketiga
 *
 * Isi WA_WEBHOOK_URL di Script Properties untuk mengaktifkan.
 * Selama kosong, notifikasi hanya masuk Logger - tidak error, tidak spam.
 */
function kirimNotifWA(nomorList, pesan) {
  var url = PropertiesService.getScriptProperties().getProperty('WA_WEBHOOK_URL');
  if (!url) {
    Logger.log('[WA belum aktif] ke ' + nomorList.join(',') + ': ' + pesan);
    return false;
  }
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ to: nomorList, message: pesan }),
      muteHttpExceptions: true
    });
    return true;
  } catch (err) {
    Logger.log('[WA gagal] ' + err.message);
    return false;
  }
}

/** Nomor WA pemilik (peran OWNER dan aktif) dari sheet Pengguna. */
function nomorPemilik() {
  var sh = _sheet(CFG.SHEET_PENGGUNA);
  var peta = _peta(sh);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  var kNama = _kol(peta, 'Nama');
  var kPeran = _kol(peta, 'Peran');
  var kWa = _kol(peta, 'No WA');
  var kAktif = _adaKol(peta, 'Aktif') ? _kol(peta, 'Aktif') : null;

  var data = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
  var out = [];
  data.forEach(function (row) {
    var peran = String(row[kPeran - 1]).trim().toUpperCase();
    var wa = String(row[kWa - 1]).trim();
    var aktif = kAktif ? String(row[kAktif - 1]).trim().toUpperCase() : 'YA';
    if (peran === 'OWNER' && wa && aktif === 'YA') out.push(wa);
  });
  return out;
}

function notifTutupShift(kasir, hasil, jenjang) {
  var pesan = 'TUTUP SHIFT - ' + kasir + '\n'
    + 'Penjualan tunai: Rp' + _angka(hasil.penjualanTunai || 0).toLocaleString('id-ID') + '\n'
    + 'Saldo brankas: Rp' + _angka(hasil.saldoBrankasAkhir || 0).toLocaleString('id-ID') + '\n'
    + 'Jenjang setoran: ' + jenjang.jenjang + ' (' + jenjang.alasan + ')\n'
    + 'Selisih: Rp' + _angka(hasil.selisih).toLocaleString('id-ID') + ' - ' + hasil.statusSelisih;
  return kirimNotifWA(nomorPemilik(), pesan);
}

function notifGagalSetor(kasir, nominal, alasan) {
  var pesan = '🔴 GAGAL SETOR - ' + kasir + '\n'
    + 'Nominal: Rp' + _angka(nominal).toLocaleString('id-ID') + '\n'
    + 'Alasan: ' + alasan + '\n'
    + 'Uang dikembalikan ke BRANKAS TOKO, tidak dibawa pulang.\n'
    + 'Perlu dicek malam ini.';
  return kirimNotifWA(nomorPemilik(), pesan);
}

// ============================================================================
// 6. TRIGGER HARIAN - uang menginap & verifikasi tertunda
// ============================================================================

/**
 * Jalankan sebagai time-driven trigger, sekali sehari pagi (mis. 07:00).
 * Menegakkan dua aturan yang kalau tidak diotomasi hanya ada di dokumen:
 *   - uang menginap hari ke-3 wajib disetor
 *   - setoran belum diverifikasi lewat 24 jam
 */
function cekHarianKas() {
  var sh = _sheet(CFG.SHEET_TUTUP_SHIFT);
  var peta = _peta(sh);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return 'Belum ada data tutup shift.';

  var pesan = [];
  var hariIni = new Date();

  // --- uang menginap di brankas
  if (_adaKol(peta, 'Saldo Brankas Akhir') && _adaKol(peta, 'Tanggal')) {
    var kSaldo = _kol(peta, 'Saldo Brankas Akhir');
    var kTgl = _kol(peta, 'Tanggal');
    var saldo = 0;
    var tglSaldo = null;
    for (var r = lastRow; r >= 2; r--) {
      var v = sh.getRange(r, kSaldo).getValue();
      if (v !== '' && v !== null) {
        saldo = _angka(v);
        tglSaldo = sh.getRange(r, kTgl).getValue();
        break;
      }
    }
    if (saldo > 0 && tglSaldo) {
      var hari = Math.floor((hariIni - new Date(tglSaldo)) / 86400000);
      if (hari >= CFG.MAKS_HARI_MENGINAP) {
        pesan.push('⚠️ Rp' + saldo.toLocaleString('id-ID') + ' sudah ' + hari
          + ' hari di brankas (batas ' + CFG.MAKS_HARI_MENGINAP + ' hari). Wajib disetor hari ini.');
      }
    }
  }

  // --- setoran belum diverifikasi
  if (_adaKol(peta, 'Status Setoran')) {
    var kStatus = _kol(peta, 'Status Setoran');
    var kTgl2 = _kol(peta, 'Tanggal');
    var menunggu = 0;
    var data = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
    data.forEach(function (row) {
      if (String(row[kStatus - 1]).trim() !== CFG.STATUS_SETORAN.MENUNGGU) return;
      var t = row[kTgl2 - 1];
      if (!t) return;
      if ((hariIni - new Date(t)) / 3600000 > 24) menunggu++;
    });
    if (menunggu > 0) {
      pesan.push('⚠️ ' + menunggu + ' setoran belum diverifikasi lewat 24 jam. '
        + 'Cek mutasi BRI dan tandai COCOK atau SELISIH.');
    }
  }

  if (!pesan.length) return 'Semua bersih - tidak ada yang perlu diingatkan.';
  kirimNotifWA(nomorPemilik(), 'CEK HARIAN KAS\n\n' + pesan.join('\n\n'));
  Logger.log(pesan.join('\n'));
  return pesan.join('\n');
}

/** Pasang trigger harian. Jalankan sekali. */
function pasangTriggerHarian() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'cekHarianKas') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('cekHarianKas').timeBased().atHour(7).everyDays(1).create();
  return 'Trigger cekHarianKas dipasang, jalan setiap hari sekitar jam 07:00.';
}

// ============================================================================
// 7. UJI - jalankan sebelum dipakai produksi
// ============================================================================

function ujiTutupShiftV2() {
  var gagal = [];
  function cek(nama, aktual, harap) {
    if (aktual !== harap) gagal.push(nama + ': dapat ' + aktual + ', harusnya ' + harap);
  }

  // Kasus nyata 29 Jul 2026 - rantai saldo BENAR (brankas dibawa)
  var h1 = hitungTutupShift({
    kasKasirAwal: 260000, saldoBrankasAwal: 2300000,
    penjualanTunai: 10833000, pengeluaranTunai: 9782500,
    setorBri: 0, priveOwner: 0,
    kasKasirAkhir: 210500, saldoBrankasAkhir: 1100000
  });
  cek('29Jul totalKasAwal', h1.totalKasAwal, 2560000);
  cek('29Jul seharusnya', h1.seharusnya, 3610500);
  cek('29Jul nyata', h1.nyata, 1310500);
  cek('29Jul selisih', h1.selisih, -2300000);

  // Jenjang
  cek('jenjang A', tentukanJenjangSetoran(1500000, 0).jenjang, 'A');
  cek('jenjang B', tentukanJenjangSetoran(3000000, 0).jenjang, 'B');
  cek('jenjang C', tentukanJenjangSetoran(6000000, 0).jenjang, 'C');
  cek('jenjang eskalasi H3', tentukanJenjangSetoran(1500000, 3).jenjang, 'B');
  cek('jenjang kosong', tentukanJenjangSetoran(0, 0).jenjang, '-');

  // Jam aman
  cek('jam 17:00 aman', lewatJamAman(new Date(2026, 6, 30, 17, 0)), false);
  cek('jam 19:00 lewat', lewatJamAman(new Date(2026, 6, 30, 19, 0)), true);

  // Validasi
  var e1 = validasiTutupShift({ kasKasirAkhir: 500000, saldoBrankasAkhir: 0 }, null);
  if (!e1.some(function (m) { return m.indexOf('Kas Kasir') >= 0; })) {
    gagal.push('validasi: kas kasir melebihi batas tidak terdeteksi');
  }
  var e2 = validasiTutupShift({ kasKasirAkhir: 200000, saldoBrankasAkhir: 3000000, fotoKasTunai: 'x' }, null);
  if (!e2.some(function (m) { return m.indexOf('Jenjang B') >= 0; })) {
    gagal.push('validasi: jenjang B tanpa status setoran tidak terdeteksi');
  }
  var e3 = validasiTutupShift({
    kasKasirAkhir: 200000, saldoBrankasAkhir: 1000000,
    fotoKasTunai: 'x', statusSetoran: CFG.STATUS_SETORAN.COCOK
  }, null);
  if (!e3.some(function (m) { return m.indexOf('bukan oleh kasir') >= 0; })) {
    gagal.push('validasi: kasir menandai COCOK sendiri tidak dicegah');
  }

  // Angka dari string
  cek('_angka string', _angka('1.234.567'), 1234567);
  cek('_angka kosong', _angka(''), 0);
  cek('_angka minus', _angka(-5000), -5000);

  var hasil = gagal.length
    ? 'GAGAL (' + gagal.length + '):\n' + gagal.join('\n')
    : 'LULUS - semua uji berhasil.';
  Logger.log(hasil);
  return hasil;
}

// ============================================================================
// INTEGRASI - cara menyambungkan ke form tutup shift yang sudah ada
// ============================================================================
//
// Di fungsi yang menangani submit tutup shift (nama aslinya belum saya lihat),
// sisipkan urutan ini SEBELUM baris ditulis ke sheet:
//
//   var kasKasirAwal    = ambilKasKasirAwal();
//   var saldoBrankasAwal = ambilSaldoBrankasAwal();
//
//   var inp = {
//     kasKasirAwal: kasKasirAwal,
//     saldoBrankasAwal: saldoBrankasAwal,
//     penjualanTunai:    form.penjualanTunai,
//     pengeluaranTunai:  form.pengeluaranTunai,
//     setorBri:          form.setorBri,
//     priveOwner:        form.priveOwner,
//     kasKasirAkhir:     form.kasKasirAkhir,
//     saldoBrankasAkhir: form.saldoBrankasAkhir,
//     statusSetoran:     form.statusSetoran,
//     tanggalSetorFisik: form.tanggalSetorFisik,
//     alasanGagalSetor:  form.alasanGagalSetor,
//     fotoKasTunai:      form.fotoKasTunai,
//     catatan:           form.catatan,
//     hariMenginap:      0
//   };
//
//   var hasil   = hitungTutupShift(inp);
//   var jenjang = tentukanJenjangSetoran(inp.saldoBrankasAkhir, inp.hariMenginap);
//   var error   = validasiTutupShift(inp, hasil);
//
//   if (error.length) return { ok: false, pesan: error };   // TOLAK, jangan simpan
//
//   // ... tulis baris ke sheet, termasuk kolom v2 ...
//
//   notifTutupShift(form.namaKasir, hasil, jenjang);
//   if (inp.statusSetoran === CFG.STATUS_SETORAN.GAGAL) {
//     notifGagalSetor(form.namaKasir, inp.saldoBrankasAkhir, inp.alasanGagalSetor);
//   }
//
// CATATAN PENTING soal Tanggal Setor Fisik:
// Kolom ini ADA KARENA MASALAH NYATA. Setoran Rp10.000.000 ke Ibu terjadi
// 28 Jul tapi tercatat di baris 27 Jul. Mutasi BRI punya tanggal sendiri yang
// tidak bisa diubah - kalau aplikasi mencatat setoran di tanggal tutup shift
// sementara uangnya masuk rekening besok, setiap rekonsiliasi mingguan akan
// menemukan selisih yang bukan selisih.
