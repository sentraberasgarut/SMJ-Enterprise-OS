// ============================================================================
// Shift Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// TUTUP_SHIFT — the authoritative shift-closing record (cash counted,
// photo evidence, variance status). Moved verbatim from the live Code.gs.
// This is the single source of truth Dashboard/Delivery already read from,
// read-only, from their own separate Apps Script projects — nothing about
// that relationship changes here.
// ============================================================================

/**
 * Data untuk layar Tutup Shift.
 *
 * PERBAIKAN PENTING v2.1 — bug saldo awal.
 * Versi lama: kasAwal hanya mengambil `Kas Kasir` hari sebelumnya (kolom 6),
 * sementara `sisa` saat menghitung selisih menjumlahkan SEMUA dompet SISA
 * yaitu Kas Kasir + Kas Tunai (brankas). Asimetris — saldo brankas hilang
 * dari sisi kiri persamaan tapi muncul di sisi kanan. Akibatnya setiap
 * pergerakan uang brankas terbaca sebagai selisih kas.
 * Sekarang kedua sisi menghitung hal yang sama.
 *
 * CATATAN: setelah perbaikan ini, tutup shift PERTAMA kemungkinan
 * menampilkan selisih besar — itu akumulasi ketimpangan yang sebelumnya
 * tersembunyi, bukan kesalahan baru. Isi catatannya, lalu hari-hari
 * berikutnya akan bersih.
 */
function dataShift(pin) {
  var o = _siapa(pin);
  _boleh(o, 'shift');
  var hari = _tglString(new Date());
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ts = ss.getSheetByName('TUTUP_SHIFT');

  var sudahHariIni = null, kasKasirAwal = 0, brankasAwal = 0, tglAwal = '';
  var lebar = Math.max(ts.getLastColumn(), 22);
  var n = ts.getLastRow() - 1;
  if (n > 0) {
    var mulai = Math.max(2, ts.getLastRow() - 400 + 1);   // cukup ~1 tahun
    var jml = ts.getLastRow() - mulai + 1;
    var data = ts.getRange(mulai, 1, jml, lebar).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      var t = _tglString(data[i][1]);
      if (t === hari && !sudahHariIni) {
        sudahHariIni = { kasir: data[i][2],
                         selisih: Number(data[i][12]) || 0,
                         selisihRp: _rp(Number(data[i][12]) || 0),
                         jam: Utilities.formatDate(new Date(data[i][0]),
                              Session.getScriptTimeZone(), 'HH:mm') };
      }
      if (t < hari && !tglAwal) {
        kasKasirAwal = Number(data[i][5]) || 0;   // Kas Kasir
        brankasAwal  = Number(data[i][6]) || 0;   // Kas Tunai (brankas)  <-- BARU
        tglAwal = t;
      }
    }
  }

  return {
    tanggal: hari, kasir: o.nama, dompet: _dompetBerlaku(hari),
    kasKasirAwal: kasKasirAwal, kasKasirAwalRp: _rp(kasKasirAwal),
    brankasAwal: brankasAwal, brankasAwalRp: _rp(brankasAwal),
    kasAwal: kasKasirAwal + brankasAwal,               // total, dipakai hitungan
    kasAwalRp: _rp(kasKasirAwal + brankasAwal),
    tglKasAwal: tglAwal,
    sudahHariIni: sudahHariIni,
    batasSelisih: BATAS_SELISIH, batasSelisihRp: _rp(BATAS_SELISIH),
    batasBrankas: BATAS_BRANKAS_MENGINAP,
    batasBrankasRp: _rp(BATAS_BRANKAS_MENGINAP),
    batasPendamping: BATAS_PENDAMPING,
    batasPendampingRp: _rp(BATAS_PENDAMPING)
  };
}

function simpanFotoShift(pin, tanggal, label, dataUrl) {
  var o = _siapa(pin);
  _boleh(o, 'shift');
  var m = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Foto ' + label + ' tidak terbaca. Coba ambil ulang.');

  var nama = tanggal + '_' + o.nama.replace(/[^A-Za-z0-9]/g, '') + '_' + label + '.jpg';
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nama);
  var file = _folderBukti(tanggal).createFile(blob);
  return { label: label, url: file.getUrl() };
}

/**
 * BARU v2.1 — Simpan beberapa foto dalam SATU panggilan.
 *
 * Sebelumnya setiap foto dikirim terpisah: 4 foto = 4 round-trip, masing-masing
 * mengirim base64 besar. Di koneksi lambat inilah yang paling sering gagal di
 * tengah jalan, dan kalau gagal di foto ke-3, tiga foto pertama sudah terunggah
 * tapi kasir harus mengulang semuanya.
 * Sekarang: satu panggilan, dan foto yang gagal dilaporkan per foto — yang
 * berhasil tidak perlu diulang.
 */
function simpanFotoShiftBanyak(pin, tanggal, fotoObj) {
  var o = _siapa(pin);
  _boleh(o, 'shift');

  var folder = _folderBukti(tanggal);
  var url = {}, gagal = [];

  Object.keys(fotoObj || {}).forEach(function (label) {
    var dataUrl = fotoObj[label];
    if (!dataUrl) return;
    try {
      var m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
      if (!m) throw new Error('format foto tidak terbaca');
      var nama = tanggal + '_' + o.nama.replace(/[^A-Za-z0-9]/g, '') +
                 '_' + label + '.jpg';
      var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nama);
      url[label] = folder.createFile(blob).getUrl();
    } catch (e) {
      gagal.push({ label: label, alasan: e.message });
    }
  });

  return { url: url, gagal: gagal,
           pesan: gagal.length
             ? (gagal.length + ' foto gagal, sisanya sudah tersimpan. ' +
                'Ulangi hanya yang gagal.')
             : 'Semua foto tersimpan.' };
}

/**
 * Simpan tutup shift.
 * v2.1: memakai saldo awal yang benar (kas kasir + brankas), mencatat
 * Saldo Brankas Awal, dan menambah Tanggal Setor Fisik + Referensi Mutasi.
 *
 * Kenapa Tanggal Setor Fisik perlu: setoran Rp10 juta ke Ibu terjadi 28 Jul
 * tapi tercatat di baris 27 Jul. Mutasi BRI punya tanggal sendiri yang tidak
 * bisa diubah — kalau aplikasi mencatat setoran di tanggal tutup shift
 * sementara uangnya masuk rekening besok, setiap rekonsiliasi mingguan akan
 * menemukan selisih yang bukan selisih.
 */
function simpanTutupShift(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'shift');

  if (!payload.cekLoka || !payload.cekStruk || !payload.cekBackup) {
    throw new Error('Tiga langkah prosedur harus dicentang semua dulu.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var hari = _tglString(new Date());
    var d = payload.dompet || {};
    var jual = Number(payload.penjualanTunai) || 0;
    var keluar = Number(payload.pengeluaranTunai) || 0;

    // Saldo awal diambil ulang dari server, bukan dipercaya dari HP.
    var awal = dataShift(pin);
    var kasAwal = awal.kasAwal;               // kas kasir + brankas
    var brankasAwal = awal.brankasAwal;

    var sisa = 0, keluarDompet = 0;
    _dompetBerlaku(hari).forEach(function (dm) {
      var v = Number(d[dm.kode]) || 0;
      if (dm.jenis === 'SISA') sisa += v; else keluarDompet += v;
    });

    var seharusnya = kasAwal + jual - keluar - keluarDompet;
    var selisih = sisa - seharusnya;
    var status = Math.abs(selisih) <= BATAS_SELISIH ? 'WAJAR' : 'PERLU DICEK';

    var brankasAkhir = Number(d.KAS_TUNAI) || 0;
    var jenjang = _jenjangSetoran(brankasAkhir);

    // Selisih besar wajib ada penjelasan saat itu, bukan nanti.
    if (Math.abs(selisih) > BATAS_SELISIH && !String(payload.catatan || '').trim()) {
      throw new Error('Selisih ' + _rp(selisih) + ' melebihi batas ' +
        _rp(BATAS_SELISIH) + '. Tulis penjelasannya sekarang di kolom Catatan — ' +
        'selagi uangnya masih di tangan dan masih ingat kejadiannya.');
    }

    var f = payload.foto || {};
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TUTUP_SHIFT').appendRow([
      new Date(), hari, o.nama, jual, keluar,
      Number(d.KAS_KASIR) || 0, brankasAkhir,
      Number(d.SETOR_IBU) || 0, Number(d.KAS_BRI) || 0, Number(d.PRIVE) || 0,
      kasAwal, seharusnya, selisih, status,
      'YA', 'YA', 'YA', payload.catatan || '',
      f.struk || '', f.kaskasir || '', f.kastunai || '', f.lain || '',
      brankasAwal,
      String(payload.tanggalSetorFisik || '').trim(),
      String(payload.referensiMutasi || '').trim(),
      String(payload.statusSetoran || (jenjang.wajibSetor ? 'MENUNGGU VERIFIKASI'
                                                          : 'TIDAK PERLU'))
    ]);

    _catatAkses(o, 'TUTUP SHIFT', 'selisih ' + _rp(selisih) + ' · ' + status +
      ' · brankas ' + _rp(brankasAkhir) + ' · jenjang ' + jenjang.jenjang);
    if (status !== 'WAJAR') {
      _kabarShift(o.nama, hari, jual, sisa, seharusnya, selisih, payload.catatan);
    }

    return { ok: true, sisa: sisa, sisaRp: _rp(sisa),
             seharusnya: seharusnya, seharusnyaRp: _rp(seharusnya),
             selisih: selisih, selisihRp: _rp(selisih), status: status,
             brankasAkhir: brankasAkhir, brankasAkhirRp: _rp(brankasAkhir),
             jenjang: jenjang };
  } finally { lock.releaseLock(); }
}

function _kabarShift(kasir, hari, jual, sisa, seharusnya, selisih, catatan) {
  var t = ['*Selisih Kas Tutup Shift — ' + hari + '*',
           'Kasir: ' + kasir, '',
           'Penjualan tunai   : ' + _rp(jual),
           'Seharusnya tersisa: ' + _rp(seharusnya),
           'Dihitung fisik    : ' + _rp(sisa),
           'Selisih           : ' + _rp(selisih), ''];
  if (catatan) t.push('Catatan kasir: ' + catatan, '');
  t.push('Foto bukti sudah tersimpan di Drive.',
         'Tanyakan hari ini juga, selagi uangnya masih di tangan.');
  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: '[PERLU DICEK] Selisih kas ' + hari + ' — ' + kasir,
      body: t.join('\n') + '\n\nKirim ke WhatsApp:\nhttps://wa.me/' + WA_OWNER +
            '?text=' + encodeURIComponent(t.join('\n'))
    });
  } catch (e) { /* email gagal tidak membatalkan penyimpanan */ }
}
