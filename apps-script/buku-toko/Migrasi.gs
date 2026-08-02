function migrasiIdKirimUjiCoba() { _migrasiId(false); }
function migrasiIdKirimJalankan() {
  var ui = SpreadsheetApp.getUi();
  var jawab = ui.alert(
    'Perbaiki ID Kirim lama',
    'Sudah membuat SALINAN spreadsheet ini sebagai backup?\n\n' +
    'Kalau belum: tekan Tidak, lalu File > Buat salinan.\n' +
    'Migrasi ini mengubah kolom ID Kirim di sheet KELUAR dan TERIMA.',
    ui.ButtonSet.YES_NO);
  if (jawab !== ui.Button.YES) {
    ui.alert('Dibatalkan. Buat backup dulu, lalu ulangi.');
    return;
  }
  _migrasiId(true);
}

function _migrasiId(jalankan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shK = ss.getSheetByName('KELUAR');
  var shT = ss.getSheetByName('TERIMA');
  if (!shK) { SpreadsheetApp.getUi().alert('Sheet KELUAR tidak ada.'); return; }

  var nK = shK.getLastRow() - 1;
  if (nK <= 0) { SpreadsheetApp.getUi().alert('Sheet KELUAR masih kosong.'); return; }

  var data = shK.getRange(2, 1, nK, KOL_KELUAR).getValues();

  // ---------- 1. Susun ID baru untuk tiap baris KELUAR ----------
  // Kunci pengelompokan: tanggal + unit + TUJUAN ASLI + rit.
  // Tujuan diambil dari kolom C baris itu sendiri, jadi SJ1 dan SJ4
  // terpisah dengan benar walaupun ID lamanya sama persis.
  var grup = {};        // kunci -> { idBaru, idLama:{}, tujuan, baris:[] }
  var idBaruDipakai = {};

  data.forEach(function (r, i) {
    var idLama = String(r[11] || '').trim();
    if (!idLama) return;
    var tgl = _tglString(r[1]);
    var tujuan = String(r[2] || '').trim();
    var rit = String(r[3] || '1').trim();
    var unit = String(r[12] || 'TSS').trim() || 'TSS';
    var kunci = tgl + '§' + unit + '§' + tujuan + '§' + rit;

    if (!grup[kunci]) {
      var dasar = tgl.replace(/-/g, '') + '-' + unit + '-' + _kodeTujuan(tujuan) + '-R' + rit;
      var id = dasar, abjad = 'BCDEFGHIJKLMNOPQRSTUVWXYZ', k = 0;
      while (idBaruDipakai[id] && idBaruDipakai[id] !== kunci) {
        id = dasar + '-' + abjad.charAt(k++);
        if (k > abjad.length) throw new Error('Kode tujuan bentrok terlalu banyak.');
      }
      idBaruDipakai[id] = kunci;
      grup[kunci] = { idBaru: id, idLama: {}, tujuan: tujuan, tgl: tgl,
                      unit: unit, rit: rit, barisIdx: [], barang: {} };
    }
    grup[kunci].idLama[idLama] = true;
    grup[kunci].barisIdx.push(i);
    grup[kunci].barang[String(r[5]).trim()] = true;
  });

  // ---------- 2. Baris KELUAR mana yang benar-benar berubah ----------
  var ubahKeluar = [], tetap = 0;
  Object.keys(grup).forEach(function (kunci) {
    var g = grup[kunci];
    g.barisIdx.forEach(function (i) {
      var idLama = String(data[i][11] || '').trim();
      if (idLama === g.idBaru) { tetap++; return; }
      ubahKeluar.push({ baris: i + 2, dari: idLama, ke: g.idBaru,
                        tujuan: g.tujuan, barang: String(data[i][5]) });
    });
  });

  // ---------- 3. Petakan baris TERIMA ke ID baru ----------
  // ID lama ambigu, jadi pencocokan pakai kombinasi ID lama + nama barang.
  // Kalau satu nama barang cocok ke lebih dari satu grup, TIDAK ditebak —
  // ditandai supaya Anda yang memutuskan.
  var ubahTerima = [], raguTerima = [], yatimTerima = [];
  var dataT = [];
  if (shT) {
    var nT = shT.getLastRow() - 1;
    if (nT > 0) {
      dataT = shT.getRange(2, 1, nT, Math.max(shT.getLastColumn(), 8)).getValues();
    }
  }

  dataT.forEach(function (r, i) {
    var idLama = String(r[2] || '').trim();
    var barang = String(r[4] || '').trim();
    if (!idLama) return;

    var calon = [];
    Object.keys(grup).forEach(function (kunci) {
      var g = grup[kunci];
      if (g.idLama[idLama] && g.barang[barang]) calon.push(g);
    });

    if (calon.length === 1) {
      if (calon[0].idBaru !== idLama) {
        ubahTerima.push({ baris: i + 2, dari: idLama, ke: calon[0].idBaru,
                          barang: barang, tujuan: calon[0].tujuan });
      }
    } else if (calon.length > 1) {
      raguTerima.push({ baris: i + 2, id: idLama, barang: barang,
                        pilihan: calon.map(function (g) {
                          return g.tujuan + ' -> ' + g.idBaru; }).join('  ATAU  ') });
    } else {
      yatimTerima.push({ baris: i + 2, id: idLama, barang: barang });
    }
  });

  // ---------- 4. Jalankan atau cuma lapor ----------
  if (jalankan) {
    ubahKeluar.forEach(function (u) { shK.getRange(u.baris, 12).setValue(u.ke); });
    ubahTerima.forEach(function (u) { shT.getRange(u.baris, 3).setValue(u.ke); });

    // isi ulang kolom Tujuan & Unit Asal di TERIMA kalau kolomnya sudah ada
    if (shT && shT.getLastColumn() >= KOL_TERIMA && shT.getLastRow() > 1) {
      _isiUlangTujuanTerima(shT);
    }
  }

  _laporMigrasi(jalankan, {
    totalBarisKeluar: nK,
    tetap: tetap,
    ubahKeluar: ubahKeluar,
    ubahTerima: ubahTerima,
    ragu: raguTerima,
    yatim: yatimTerima,
    grup: grup
  });
}

function _laporMigrasi(jalankan, h) {
  var judul = jalankan ? 'HASIL MIGRASI ID KIRIM' : 'UJI COBA MIGRASI ID KIRIM (belum diubah)';
  var t = ['*' + judul + '*',
           _tglString(new Date()), '',
           'Baris KELUAR diperiksa : ' + h.totalBarisKeluar,
           'ID sudah benar         : ' + h.tetap,
           'ID KELUAR ' + (jalankan ? 'diubah' : 'akan diubah') + '        : ' + h.ubahKeluar.length,
           'ID TERIMA ' + (jalankan ? 'diubah' : 'akan diubah') + '        : ' + h.ubahTerima.length,
           'PERLU KEPUTUSAN ANDA   : ' + h.ragu.length,
           'Baris TERIMA yatim     : ' + h.yatim.length, ''];

  t.push('--- KIRIMAN SETELAH DIPERBAIKI ---');
  Object.keys(h.grup).sort().forEach(function (k) {
    var g = h.grup[k];
    t.push('  ' + g.tgl + ' · ' + g.tujuan + ' rit ' + g.rit + ' [' + g.unit + ']');
    t.push('      ' + Object.keys(g.idLama).join(', ') + '  ->  ' + g.idBaru);
  });

  if (h.ubahKeluar.length) {
    t.push('', '--- RINCIAN PERUBAHAN KELUAR ---');
    h.ubahKeluar.slice(0, 60).forEach(function (u) {
      t.push('  baris ' + u.baris + ' · ' + u.tujuan + ' · ' + u.barang +
             ': ' + u.dari + ' -> ' + u.ke);
    });
    if (h.ubahKeluar.length > 60) t.push('  ... dan ' + (h.ubahKeluar.length - 60) + ' baris lagi');
  }

  if (h.ubahTerima.length) {
    t.push('', '--- RINCIAN PERUBAHAN TERIMA ---');
    h.ubahTerima.slice(0, 60).forEach(function (u) {
      t.push('  baris ' + u.baris + ' · ' + u.tujuan + ' · ' + u.barang +
             ': ' + u.dari + ' -> ' + u.ke);
    });
  }

  if (h.ragu.length) {
    t.push('', '--- PERLU KEPUTUSAN ANDA (tidak saya tebak) ---');
    t.push('Barang ini ada di lebih dari satu kiriman dengan ID lama yang sama,');
    t.push('jadi tidak bisa dipastikan milik cabang mana. Perbaiki manual di sheet TERIMA:');
    h.ragu.forEach(function (u) {
      t.push('  baris ' + u.baris + ' · ' + u.barang + ' (' + u.id + ')');
      t.push('      pilih: ' + u.pilihan);
    });
  }

  if (h.yatim.length) {
    t.push('', '--- BARIS TERIMA TANPA PASANGAN DI KELUAR ---');
    h.yatim.forEach(function (u) {
      t.push('  baris ' + u.baris + ' · ' + u.barang + ' (' + u.id + ')');
    });
    t.push('  Kemungkinan data KELUAR-nya sudah dihapus. Tidak saya sentuh.');
  }

  t.push('', jalankan
    ? 'SELESAI. Langkah terakhir: jalankan menu "Rekap sekarang" supaya sheet REKAP ikut segar.'
    : 'Ini baru uji coba — belum ada yang diubah. Kalau laporan ini sudah masuk akal, ' +
      'buat backup lalu jalankan menu "Perbaiki ID Kirim lama (JALANKAN)".');

  var teks = t.join('\n');

  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: '[' + (jalankan ? 'MIGRASI' : 'UJI COBA') + '] ID Kirim — ' +
               _tglString(new Date()),
      body: teks
    });
  } catch (e) { /* email gagal tidak membatalkan migrasi */ }

  var ringkas = jalankan
    ? (h.ubahKeluar.length + ' baris KELUAR & ' + h.ubahTerima.length +
       ' baris TERIMA diperbaiki.' +
       (h.ragu.length ? ' ' + h.ragu.length + ' baris perlu keputusan Anda — cek email.' : '') +
       ' Jangan lupa jalankan "Rekap sekarang".')
    : (h.ubahKeluar.length + ' baris KELUAR & ' + h.ubahTerima.length +
       ' baris TERIMA AKAN diubah.' +
       (h.ragu.length ? ' ' + h.ragu.length + ' baris perlu keputusan Anda.' : '') +
       ' Rincian lengkap dikirim ke email Anda. Belum ada yang berubah.');

  SpreadsheetApp.getActiveSpreadsheet().toast(ringkas,
    jalankan ? 'Migrasi selesai' : 'Uji coba selesai', 20);
  Logger.log(teks);
}
