// ============================================================================
// Delivery Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// KELUAR / TERIMA / REKAP / BATAL — inter-unit goods movement, the real
// inventory-value logistics (not to be confused with the separate,
// evidence-only apps-script/delivery/ Apps Script project, which reads
// none of this and exists purely to add photo/accountability evidence
// around the same physical events). Moved verbatim from the live Code.gs.
// ============================================================================

/**
 * ID Kirim yang sudah pernah dikonfirmasi terima.
 *
 * PERBAIKAN v2.1 — dua hal:
 *  1. Pembacaan dibatasi BATAS_BACA baris terakhir, bukan seluruh sheet.
 *  2. Hasilnya di-cache 5 menit. Fungsi ini dipanggil sampai 5 kali dalam
 *     satu permintaan; tanpa cache, sheet dibaca ulang 5 kali.
 * Cache dibuang otomatis setiap ada konfirmasi baru (_buangCacheTerima).
 */
function _petaTerima() {
  var c = CacheService.getScriptCache();
  var simpan = c.get('PETA_TERIMA');
  if (simpan) {
    var dari = {};
    simpan.split('\n').forEach(function (id) { if (id) dari[id] = true; });
    return dari;
  }

  var hasil = {};
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TERIMA');
  if (!sh) return hasil;
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return hasil;

  var mulai = Math.max(2, lastRow - BATAS_BACA + 1);
  var jumlah = lastRow - mulai + 1;
  sh.getRange(mulai, 3, jumlah, 1).getValues().forEach(function (r) {
    var id = String(r[0] || '').trim();
    if (id) hasil[id] = true;
  });

  try {
    var teks = Object.keys(hasil).join('\n');
    if (teks.length < 90000) c.put('PETA_TERIMA', teks, 300);
  } catch (e) { /* cache gagal tidak boleh menggagalkan pekerjaan */ }

  return hasil;
}

function _buangCacheTerima() {
  try { CacheService.getScriptCache().remove('PETA_TERIMA'); } catch (e) {}
}

/**
 * Baca sheet KELUAR, DIBATASI ke baris terbaru.
 * Dulu membaca seluruh sheet — inilah penyebab utama aplikasi melambat.
 */
function _semuaKeluar() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('KELUAR');
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var mulai = Math.max(2, lastRow - BATAS_BACA + 1);
  var jumlah = lastRow - mulai + 1;
  return sh.getRange(mulai, 1, jumlah, KOL_KELUAR).getValues();
}

function _daftarKirimHariIni() {
  var data = _semuaKeluar();
  if (!data.length) return [];
  var hari = _tglString(new Date());
  var sudah = _petaTerima();
  var seen = {}, out = [];
  data.forEach(function (r) {
    if (_tglString(r[1]) !== hari) return;
    var id = String(r[11] || '').trim();
    if (!id || seen[id]) return;
    seen[id] = true;
    var u = String(r[12] || 'TSS');
    out.push({
      id: id,
      unit: u,
      tujuan: String(r[2] || ''),
      rit: r[3],
      penyiap: String(r[4] || ''),
      sudah: !!sudah[id],
      label: (u === 'CK' ? '[Dapur] ' : '[Toko] ') + r[2] +
             ' — rit ' + r[3] + ' (' + r[4] + ')' +
             (sudah[id] ? '  ✓ sudah dikonfirmasi' : '')
    });
  });
  return out;
}

function _kodeTujuan(tujuan) {
  var t = String(tujuan || '').trim();
  if (KODE_TUJUAN[t]) return KODE_TUJUAN[t];

  var kata = t.replace(/[^A-Za-z0-9]/g, ' ').split(/\s+/).filter(String);
  var huruf = '', angka = '';
  kata.forEach(function (k) {
    var h = k.replace(/[^A-Za-z]/g, '');
    if (h) huruf += h.charAt(0);
    angka += k.replace(/[^0-9]/g, '');
  });
  return ((huruf + angka).toUpperCase().slice(0, 8)) || 'LAIN';
}

function _buatIdKirim(now, tujuan, rit, unit, dataSemua) {
  var dasar = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd') +
              '-' + (unit || 'TSS') + '-' + _kodeTujuan(tujuan) + '-R' + rit;

  var pakai = {};
  (dataSemua || []).forEach(function (r) {
    var id = String(r[11] || '').trim();
    if (id) pakai[id] = String(r[2] || '').trim();
  });

  if (!pakai[dasar] || pakai[dasar] === String(tujuan).trim()) return dasar;

  var abjad = 'BCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (var i = 0; i < abjad.length; i++) {
    var alt = dasar + '-' + abjad.charAt(i);
    if (!pakai[alt] || pakai[alt] === String(tujuan).trim()) return alt;
  }
  throw new Error('Terlalu banyak tujuan berbeda memakai kode yang sama hari ini. ' +
                  'Tambahkan kode khusus untuk "' + tujuan + '" di KODE_TUJUAN.');
}

/**
 * Cari satu kiriman berdasarkan ID.
 * v2.1: dipindai dari BELAKANG — kiriman yang dicari hampir selalu yang terbaru.
 */
function _cariKiriman(idKirim) {
  var id = String(idKirim || '').trim();
  var hasil = { ada: false, id: id, tujuan: '', unit: 'TSS', rit: '',
                penyiap: '', tanggal: '', baris: [] };
  if (!id) return hasil;

  var data = _semuaKeluar();
  for (var i = data.length - 1; i >= 0; i--) {
    var r = data[i];
    if (String(r[11] || '').trim() !== id) continue;
    if (!hasil.ada) {
      hasil.ada = true;
      hasil.tujuan = String(r[2] || '');
      hasil.unit = String(r[12] || 'TSS');
      hasil.rit = r[3];
      hasil.penyiap = String(r[4] || '');
      hasil.tanggal = _tglString(r[1]);
    }
    hasil.baris.unshift({ nama: String(r[5]), qty: Number(r[6]) || 0,
                          satuan: String(r[7] || '') });
  }
  return hasil;
}

function simpanKeluar(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'keluar');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var baris = (payload.baris || []).filter(function (b) { return Number(b.qty) > 0; });
    if (!baris.length) throw new Error('Belum ada barang yang diisi qty-nya.');
    if (!payload.tujuan) throw new Error('Tujuan belum dipilih.');
    if (TUJUAN.indexOf(payload.tujuan) < 0) {
      throw new Error('Tujuan "' + payload.tujuan + '" tidak dikenal.');
    }

    var penyiap = payload.penyiap || o.nama;
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('KELUAR');
    var now = new Date();
    var unit = (payload.unit === 'CK') ? 'CK' : 'TSS';
    var semua = _semuaKeluar();
    var idKirim = _buatIdKirim(now, payload.tujuan, payload.rit, unit, semua);

    if (!payload.paksa) {
      var ambang = now.getTime() - AMBANG_KEMBAR * 60 * 1000;
      var cocok = 0;
      semua.forEach(function (r) {
        if (String(r[11] || '').trim() !== idKirim) return;
        var w = (r[0] instanceof Date) ? r[0].getTime() : 0;
        if (w < ambang) return;
        for (var i = 0; i < baris.length; i++) {
          if (String(r[5]).trim() === String(baris[i].nama).trim() &&
              Number(r[6]) === Number(baris[i].qty)) { cocok++; return; }
        }
      });
      if (cocok >= baris.length) {
        throw new Error('KEMBAR: Kiriman dengan isi yang sama persis baru saja ' +
          'tersimpan (' + idKirim + '). Kalau ini memang kiriman berbeda, ' +
          'tekan tombol di bawah untuk menyimpan tetap.');
      }
    }

    var rows = baris.map(function (b) {
      var qty = Number(b.qty), harga = Number(b.harga) || 0;
      return [now, _tglString(now), payload.tujuan, payload.rit, penyiap,
              b.nama, qty, b.satuan, harga, qty * harga, payload.catatan || '',
              idKirim, unit];
    });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, KOL_KELUAR).setValues(rows);

    var total = rows.reduce(function (s, r) { return s + r[9]; }, 0);
    _catatAkses(o, 'BARANG KELUAR', idKirim + ' · ' + rows.length + ' barang');
    return {
      ok: true, idKirim: idKirim, jumlahBarang: rows.length, total: total,
      totalRp: _rp(total),
      teksWA: _teksSuratJalan(payload, baris, idKirim, total, penyiap)
    };
  } finally { lock.releaseLock(); }
}

/**
 * BARU v2.1 — Batalkan kiriman yang salah input.
 *
 * Sebelumnya tidak ada cara membatalkan apa pun. Sekali tersimpan, permanen —
 * jadi data salah menumpuk dan orang berhenti mempercayai aplikasinya.
 *
 * Yang dilakukan: seluruh baris KELUAR milik satu ID Kirim dipindahkan ke
 * sheet BATAL (lengkap dengan isinya), lalu dihapus dari KELUAR. Baris TERIMA
 * yang menempel ikut dihapus. Semua tercatat siapa & alasannya.
 *
 * Hanya OWNER, dan hanya untuk kiriman hari ini atau kemarin — kiriman lama
 * sudah masuk rekap dan laporan, membatalkannya akan membuat angka lama berubah.
 */
function batalkanKiriman(pin, idKirim, alasan) {
  var o = _siapa(pin);
  if (o.peran !== 'OWNER') {
    throw new Error('Hanya pemilik yang boleh membatalkan kiriman. ' +
                    'Minta Aditya atau Sri Nurul yang melakukannya.');
  }
  if (!String(alasan || '').trim()) {
    throw new Error('Alasan pembatalan wajib diisi. Ini jadi catatan permanen ' +
                    'supaya nanti bisa ditelusuri kenapa dibatalkan.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var k = _cariKiriman(idKirim);
    if (!k.ada) throw new Error('ID kiriman "' + idKirim + '" tidak ditemukan.');

    // Batas waktu: hari ini atau kemarin saja.
    var kmr = new Date(); kmr.setDate(kmr.getDate() - 1);
    var bolehTgl = [_tglString(new Date()), _tglString(kmr)];
    if (bolehTgl.indexOf(k.tanggal) < 0) {
      throw new Error('Kiriman tanggal ' + k.tanggal + ' sudah masuk rekap dan ' +
        'laporan. Membatalkannya akan mengubah angka yang sudah dilaporkan. ' +
        'Perbaiki manual di sheet, atau catat koreksinya sebagai kiriman baru.');
    }

    var shK = ss.getSheetByName('KELUAR');
    var lastRow = shK.getLastRow();
    var isi = [];
    var hapus = [];
    if (lastRow >= 2) {
      var data = shK.getRange(2, 1, lastRow - 1, KOL_KELUAR).getValues();
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][11] || '').trim() !== String(idKirim).trim()) continue;
        hapus.push(i + 2);
        isi.push(data[i].join(' | '));
      }
    }
    if (!hapus.length) throw new Error('Tidak ada baris yang cocok untuk dibatalkan.');

    // Catat dulu ke BATAL, baru hapus. Kalau pencatatan gagal, data tidak hilang.
    var shB = _sheet(ss, 'BATAL');
    shB.appendRow([new Date(), _tglString(new Date()), o.nama, 'KIRIMAN',
                   idKirim, hapus.length, alasan,
                   isi.join('\n').slice(0, 45000)]);

    var terimaDihapus = _hapusTerima(idKirim);
    for (var j = hapus.length - 1; j >= 0; j--) shK.deleteRow(hapus[j]);

    _buangCacheTerima();
    _catatAkses(o, 'BATALKAN KIRIMAN',
      idKirim + ' · ' + hapus.length + ' baris' +
      (terimaDihapus ? ' · ' + terimaDihapus + ' baris terima ikut dihapus' : '') +
      ' · alasan: ' + alasan);

    return { ok: true, idKirim: idKirim, barisDihapus: hapus.length,
             terimaDihapus: terimaDihapus, tujuan: k.tujuan };
  } finally { lock.releaseLock(); }
}

function ambilRincianKirim(pin, idKirim) {
  var o = _siapa(pin);
  _boleh(o, 'terima');
  var k = _cariKiriman(idKirim);
  if (!k.ada) throw new Error('ID kiriman "' + idKirim + '" tidak ditemukan di sheet KELUAR.');
  var sudah = _petaTerima();
  return {
    id: k.id, tujuan: k.tujuan, unit: k.unit, rit: k.rit,
    penyiap: k.penyiap, tanggal: k.tanggal,
    sudah: !!sudah[k.id],
    baris: k.baris
  };
}

function _hapusTerima(idKirim) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TERIMA');
  if (!sh) return 0;
  var n = sh.getLastRow() - 1;
  if (n <= 0) return 0;
  var ids = sh.getRange(2, 3, n, 1).getValues();
  var hapus = [];
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim() === String(idKirim).trim()) hapus.push(i + 2);
  }
  for (var j = hapus.length - 1; j >= 0; j--) sh.deleteRow(hapus[j]);
  _buangCacheTerima();
  return hapus.length;
}

function simpanTerima(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'terima');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (!payload.idKirim) throw new Error('Pengiriman belum dipilih.');

    var k = _cariKiriman(payload.idKirim);
    if (!k.ada) {
      throw new Error('ID kiriman "' + payload.idKirim + '" tidak ada di sheet KELUAR. ' +
                      'Muat ulang halaman lalu pilih ulang kirimannya.');
    }

    var sudah = _petaTerima();
    var ditimpa = 0;
    if (sudah[k.id]) {
      if (!payload.timpa) {
        throw new Error('SUDAH: Kiriman ' + k.id + ' (' + k.tujuan + ') sudah pernah ' +
          'dikonfirmasi terima. Kalau catatan sebelumnya keliru dan mau diperbaiki, ' +
          'tekan tombol di bawah — catatan lama akan diganti, bukan ditambah.');
      }
      ditimpa = _hapusTerima(k.id);
    }

    var baris = (payload.baris || []);
    if (!baris.length) throw new Error('Belum ada barang yang dikonfirmasi.');
    var kosong = [];
    baris.forEach(function (b) {
      var v = (b.qty === null || b.qty === undefined) ? '' : String(b.qty).trim();
      if (v === '') kosong.push(b.nama);
      else if (isNaN(Number(v))) kosong.push(b.nama);
    });
    if (kosong.length) {
      throw new Error('Qty belum diisi untuk: ' + kosong.join(', ') + '. ' +
        'Kalau barangnya tidak datang sama sekali, tulis 0 — jangan dikosongkan, ' +
        'supaya selisihnya tercatat.');
    }

    var penerima = payload.penerima || o.nama;
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TERIMA');
    var now = new Date();
    var rows = baris.map(function (b) {
      return [now, _tglString(now), k.id, penerima,
              b.nama, Number(b.qty), b.satuan, payload.catatan || '',
              k.tujuan, k.unit];
    });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, KOL_TERIMA).setValues(rows);
    _buangCacheTerima();

    var kirim = {};
    k.baris.forEach(function (b) { kirim[b.nama] = (kirim[b.nama] || 0) + b.qty; });
    var selisih = [];
    var terimaPer = {};
    rows.forEach(function (r) { terimaPer[r[4]] = (terimaPer[r[4]] || 0) + Number(r[5]); });
    Object.keys(kirim).forEach(function (nm) {
      var d = (terimaPer[nm] || 0) - kirim[nm];
      if (d !== 0) selisih.push({ nama: nm, kirim: kirim[nm],
                                  terima: terimaPer[nm] || 0, beda: d });
    });

    _catatAkses(o, 'KONFIRMASI TERIMA',
      k.id + ' · ' + rows.length + ' barang' +
      (ditimpa ? ' · menimpa ' + ditimpa + ' baris lama' : '') +
      (selisih.length ? ' · ' + selisih.length + ' selisih' : ' · cocok semua'));

    return { ok: true, jumlahBarang: rows.length, ditimpa: ditimpa,
             tujuan: k.tujuan, selisih: selisih };
  } finally { lock.releaseLock(); }
}

/**
 * Riwayat kiriman hari ini.
 *
 * PERBAIKAN v2.1: bisa dibuka semua peran (lihat _menuPeran), TAPI isinya
 * disaring — yang bukan OWNER hanya melihat kiriman yang DIA sendiri siapkan.
 * Tujuannya supaya Teh Dede bisa memeriksa 14 barang yang baru dia input,
 * tanpa membuka data orang lain.
 */
function riwayatHariIni(pin) {
  var o = _siapa(pin);
  _boleh(o, 'riwayat');
  var hari = _tglString(new Date());

  var semua = _semuaKeluar().filter(function (r) {
    return _tglString(r[1]) === hari;
  });
  var sudah = _petaTerima();

  var punyaSendiri = (o.peran !== 'OWNER');

  var kirim = {}, urut = [];
  semua.forEach(function (r) {
    var id = String(r[11] || '').trim();
    if (!id) return;
    if (punyaSendiri && String(r[4] || '').trim() !== o.nama) return;
    if (!kirim[id]) {
      kirim[id] = { id: id, unit: String(r[12] || 'TSS'),
                    tujuan: r[2], rit: r[3], penyiap: r[4],
                    jam: Utilities.formatDate(new Date(r[0]),
                         Session.getScriptTimeZone(), 'HH:mm'),
                    jumlah: 0, nilai: 0, terkonfirmasi: !!sudah[id],
                    barang: [] };
      urut.push(id);
    }
    kirim[id].jumlah++;
    kirim[id].nilai += Number(r[9]) || 0;
    kirim[id].barang.push({ nama: String(r[5]), qty: Number(r[6]) || 0,
                            satuan: String(r[7] || '') });
  });

  var daftar = urut.map(function (id) {
    var k = kirim[id];
    k.nilaiRp = _rp(k.nilai);
    return k;
  });
  var total = daftar.reduce(function (s, k) { return s + k.nilai; }, 0);
  return {
    tanggal: hari,
    hanyaMilikSendiri: punyaSendiri,
    kirim: daftar,
    totalNilai: total,
    totalNilaiRp: _rp(total),
    belumKonfirmasi: daftar.filter(function (k) { return !k.terkonfirmasi; }).length
  };
}

function _isiUlangTujuanTerima(shT) {
  var n = shT.getLastRow() - 1;
  if (n <= 0) return;
  var peta = {};
  var shK = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('KELUAR');
  if (shK) {
    var nk = shK.getLastRow() - 1;
    if (nk > 0) {
      shK.getRange(2, 1, nk, KOL_KELUAR).getValues().forEach(function (r) {
        var id = String(r[11] || '').trim();
        if (id && !peta[id]) peta[id] = [String(r[2] || ''), String(r[12] || 'TSS')];
      });
    }
  }
  var ids = shT.getRange(2, 3, n, 1).getValues();
  var isi = ids.map(function (r) {
    var p = peta[String(r[0] || '').trim()];
    return p ? p : ['(tidak ketemu)', ''];
  });
  shT.getRange(2, 9, n, 2).setValues(isi);
}

function rekapHarian() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hari = _tglString(new Date());
  var keluar = _bacaHari(ss.getSheetByName('KELUAR'), KOL_KELUAR, hari);

  var idHari = {};
  keluar.forEach(function (r) {
    var id = String(r[11] || '').trim();
    if (id) idHari[id] = true;
  });

  var terima = [];
  var shT = ss.getSheetByName('TERIMA');
  if (shT && shT.getLastRow() > 1) {
    var lebarT = Math.max(shT.getLastColumn(), KOL_TERIMA);
    var mulaiT = Math.max(2, shT.getLastRow() - BATAS_BACA + 1);
    var jmlT = shT.getLastRow() - mulaiT + 1;
    terima = shT.getRange(mulaiT, 1, jmlT, lebarT).getValues()
      .filter(function (r) { return idHari[String(r[2] || '').trim()]; });
  }

  var K = {}, urut = [];
  keluar.forEach(function (r) {
    var id = String(r[11] || '').trim();
    var key = id + '|' + String(r[5]).trim();
    if (!K[key]) {
      K[key] = { id: id, tujuan: r[2], unit: String(r[12] || 'TSS'),
                 barang: r[5], qty: 0, nilai: 0 };
      urut.push(key);
    }
    K[key].qty += Number(r[6]) || 0;
    K[key].nilai += Number(r[9]) || 0;
  });

  var T = {};
  terima.forEach(function (r) {
    var key = String(r[2] || '').trim() + '|' + String(r[4]).trim();
    T[key] = (T[key] || 0) + (Number(r[5]) || 0);
  });

  var rows = urut.map(function (key) {
    var k = K[key];
    var diterima = T[key];
    var ada = (diterima !== undefined);
    var selisih = ada ? (k.qty - diterima) : k.qty;
    return [hari, k.tujuan, k.barang, k.qty, ada ? diterima : '', selisih, k.nilai,
            !ada ? 'BELUM DIKONFIRMASI' : (selisih === 0 ? 'COCOK' : 'SELISIH'),
            k.id, k.unit];
  });

  _tulisRekap(hari, rows);
  _kirimAlarm(hari, rows, rows.filter(function (r) { return r[7] !== 'COCOK'; }));
}

function _tulisRekap(hari, rows) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('REKAP');
  var lebar = Math.max(sh.getLastColumn(), KOL_REKAP);
  var n = sh.getLastRow() - 1;

  var simpan = [];
  if (n > 0) {
    simpan = sh.getRange(2, 1, n, lebar).getValues()
      .filter(function (r) { return _tglString(r[0]) !== hari; });
  }
  var gabung = simpan.concat(rows.map(function (r) {
    while (r.length < lebar) r.push('');
    return r;
  }));

  if (n > 0) sh.getRange(2, 1, n, lebar).clearContent();
  if (gabung.length) {
    sh.getRange(2, 1, gabung.length, lebar).setValues(gabung);
  }
}

function _kirimAlarm(hari, rows, bermasalah) {
  var total = rows.reduce(function (s, r) { return s + (Number(r[6]) || 0); }, 0);
  var pesan = ['*Rekap Barang Keluar — ' + hari + '*',
               'Total baris: ' + rows.length + '  |  Nilai: ' + _rp(total), ''];
  if (!rows.length) {
    pesan.push('TIDAK ADA satu pun barang keluar tercatat hari ini.');
    pesan.push('Kalau toko buka, berarti ada yang tidak mengisi.');
  } else if (!bermasalah.length) {
    pesan.push('Semua pengiriman sudah dikonfirmasi terima dan cocok.');
  } else {
    pesan.push(bermasalah.length + ' baris perlu dicek:');
    bermasalah.forEach(function (r) {
      pesan.push('• ' + r[1] + ' — ' + r[2] + ': keluar ' + r[3] +
                 (r[4] === '' ? ', BELUM dikonfirmasi terima'
                              : ', diterima ' + r[4] + ' (selisih ' + r[5] + ')'));
    });
    pesan.push('', 'Tanyakan hari ini juga, selagi orangnya masih ingat.');
  }
  var teks = pesan.join('\n');
  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: (bermasalah.length || !rows.length ? '[PERLU DICEK] ' : '[OK] ') +
               'Rekap Barang Keluar ' + hari,
      body: teks + '\n\nKirim ke WhatsApp:\nhttps://wa.me/' + WA_OWNER +
            '?text=' + encodeURIComponent(teks)
    });
  } catch (e) { /* email gagal tidak boleh membatalkan penulisan REKAP */ }
}

function rekapSekarang() {
  rekapHarian();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Rekap selesai. Baris untuk hari ini ditimpa, bukan ditambah. ' +
    'Cek sheet REKAP dan email Anda.', 'Selesai', 8);
}

function _teksSuratJalan(payload, baris, idKirim, total, penyiap) {
  var t = ['*SURAT JALAN — ' + (payload.unit === 'CK' ? 'Central Kitchen'
                                                      : 'Toko Sembako Sejahtera') + '*',
           'ID: ' + idKirim,
           'Tujuan: ' + payload.tujuan + '  (rit ke-' + payload.rit + ')',
           'Disiapkan: ' + penyiap, ''];
  baris.forEach(function (b) {
    t.push('• ' + b.nama + ' — ' + b.qty + ' ' + b.satuan);
  });
  t.push('', 'Total nilai: ' + _rp(total));
  if (payload.catatan) t.push('Catatan: ' + payload.catatan);
  t.push('', 'Mohon konfirmasi terima setelah barang dicek.');
  return t.join('\n');
}
