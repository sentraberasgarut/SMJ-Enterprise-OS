// ============================================================================
// Reporting Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// Loka summary (CACHE_LOKA), owner dashboard (TSS), Central Kitchen
// dashboard, and operating-expense recording (BEBAN — the one input the
// Gross/Net Profit distinction depends on). Moved verbatim from the live
// Code.gs, including the exact comment that documents the Gross/Net
// mislabeling incident this repository's own governance rules (CLAUDE.md)
// were written in response to.
// ============================================================================

function _folderLokaJson() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_LOKA_JSON_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var induk = DriveApp.getFoldersByName(FOLDER_LOKA_INDUK);
  while (induk.hasNext()) {
    var sub = induk.next().getFoldersByName(FOLDER_LOKA_JSON);
    if (sub.hasNext()) {
      var f = sub.next();
      props.setProperty('FOLDER_LOKA_JSON_ID', f.getId());
      return f;
    }
  }
  return null;
}

function _ringkasLoka() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CACHE_LOKA');
  if (!sh || sh.getLastRow() < 2) {
    return { ada: false, perluHitung: true, alasan: 'Ringkasan belum pernah dihitung.' };
  }
  var teks = String(sh.getRange(2, 2).getValue() || '');
  if (!teks) return { ada: false, perluHitung: true, alasan: 'Ringkasan masih kosong.' };
  try {
    var o = JSON.parse(teks);
    o.dihitung = String(sh.getRange(2, 1).getValue() || '');
    return o;
  } catch (e) {
    return { ada: false, perluHitung: true,
             alasan: 'Ringkasan tersimpan rusak (kemungkinan terlalu panjang). ' +
                     'Jalankan "Hitung ulang data Loka" dari menu.' };
  }
}

function hitungRingkasLoka() {
  var folder = _folderLokaJson();
  if (!folder) return _simpanRingkas({ ada: false,
    alasan: 'Folder JSON hasil konversi belum ditemukan di Drive.' });

  var it = folder.getFiles(), baru = null;
  while (it.hasNext()) {
    var f = it.next();
    if (!/^loka-\d{4}-\d{2}-\d{2}\.json$/.test(f.getName())) continue;
    if (!baru || f.getName() > baru.getName()) baru = f;
  }
  if (!baru) return _simpanRingkas({ ada: false,
    alasan: 'Belum ada file loka-YYYY-MM-DD.json di folder itu.' });

  var isi;
  try {
    isi = JSON.parse(baru.getBlob().getDataAsString());
  } catch (e) {
    return _simpanRingkas({ ada: false, alasan: 'File hasil konversi tidak terbaca.' });
  }
  return _simpanRingkas(_olahLoka(isi.data || isi, baru.getName()));
}

function _simpanRingkas(hasil) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = _sheet(ss, 'CACHE_LOKA');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Dihitung', 'Ringkasan (jangan diedit manual)']);
    _headerStyle(sh, 2);
    sh.setColumnWidth(2, 420);
  }
  var waktu = Utilities.formatDate(new Date(), Session.getScriptTimeZone(),
                                   'yyyy-MM-dd HH:mm');

  // v2.1: kalau ringkasan terlalu panjang, buang bagian paling besar dulu
  // (grafik & piutang) daripada memotong JSON di tengah — potongan di tengah
  // membuat JSON.parse gagal dan dashboard mati tanpa penjelasan.
  var teks = JSON.stringify(hasil);
  if (teks.length > 48000) {
    var ringan = JSON.parse(teks);
    if (ringan.grafik && ringan.grafik.length > 14) {
      ringan.grafik = ringan.grafik.slice(-14);
    }
    if (ringan.piutang && ringan.piutang.length > 20) {
      ringan.piutang = ringan.piutang.slice(0, 20);
      ringan.piutangDipotong = true;
    }
    teks = JSON.stringify(ringan);
  }
  if (teks.length > 48000) teks = JSON.stringify({ ada: false,
    alasan: 'Ringkasan terlalu besar untuk disimpan di satu sel.' });

  sh.getRange(2, 1).setValue(waktu);
  sh.getRange(2, 2).setValue(teks);
  hasil.dihitung = waktu;
  return hasil;
}

function hitungLokaDariApp(pin) {
  var o = _siapa(pin);
  if (_unitBoleh(o).indexOf('TSS') < 0) throw new Error('Tidak punya akses.');
  var h = hitungRingkasLoka();
  return { ok: !!h.ada, alasan: h.alasan || '', tglData: h.tglData || '' };
}

function hitungLokaMenu() {
  var h = hitungRingkasLoka();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    h.ada ? ('Ringkasan diperbarui. Data Loka ' + h.tglData)
          : ('Gagal: ' + h.alasan), 'Hitung Data Loka', 10);
}

function _num(x) { var v = Number(x); return isNaN(v) ? 0 : v; }

function _tglDariMs(ms) {
  var n = Number(ms);
  if (!n) return '';
  return Utilities.formatDate(new Date(n), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function _olahLoka(D, namaFile) {
  var inv = (D.Invoice || []).filter(function (i) { return i.status !== 'CANCELLED'; });
  var bulan = _tglString(new Date()).slice(0, 7);
  var hari = _tglString(new Date());

  var hariIni = { omzet: 0, laba: 0, trx: 0 };
  var bulanIni = { omzet: 0, laba: 0, trx: 0 };
  var perHari = {};
  var perPelanggan = {};

  inv.forEach(function (i) {
    var t = _tglDariMs(i.date);
    if (!t) return;
    var om = _num(i.grandTotal), lb = _num(i.profit);
    if (!perHari[t]) perHari[t] = { omzet: 0, laba: 0, trx: 0 };
    perHari[t].omzet += om; perHari[t].laba += lb; perHari[t].trx++;
    if (t === hari) { hariIni.omzet += om; hariIni.laba += lb; hariIni.trx++; }
    if (t.slice(0, 7) === bulan) {
      bulanIni.omzet += om; bulanIni.laba += lb; bulanIni.trx++;
      var nm = (i.customer && i.customer.name) || i.customerName || '(eceran)';
      if (!perPelanggan[nm]) perPelanggan[nm] = { omzet: 0, laba: 0 };
      perPelanggan[nm].omzet += om; perPelanggan[nm].laba += lb;
    }
  });

  var nHari = Object.keys(perHari).filter(function (t) {
    return t.slice(0, 7) === bulan;
  }).length || 1;

  var terjual = {};
  inv.forEach(function (i) {
    if (_tglDariMs(i.date).slice(0, 7) !== bulan) return;
    (i.items || []).forEach(function (it) {
      var q = _num(it.quantity) * (_num(it.unitMultiplier) || 1);
      terjual[it.name] = (terjual[it.name] || 0) + q;
    });
  });
  var stok = (D.Product || []).map(function (p) {
    var s = _num(p.stock);
    var jual = terjual[p.name] || 0;
    var perHariRata = jual / nHari;
    return { nama: p.name, stok: s, hpp: _num(p.capitalPrice),
             nilai: s * _num(p.capitalPrice),
             hari: perHariRata > 0 ? Math.floor(s / perHariRata) : 999 };
  });
  var menipis = stok.filter(function (x) { return x.hari <= 5 && x.stok >= 0; })
                    .sort(function (a, b) { return a.hari - b.hari; }).slice(0, 8);

  var piutang = (D.Invoice || []).filter(function (i) { return i.status === 'PENDING'; })
    .map(function (i) {
      return { tgl: _tglDariMs(i.date),
               nama: (i.customer && i.customer.name) || i.customerName || '-',
               nilai: _num(i.grandTotal) };
    });

  var hariUrut = Object.keys(perHari).sort().slice(-30);

  var nilaiStok = stok.reduce(function (s, x) { return s + x.nilai; }, 0);
  var hppBulan = bulanIni.omzet - bulanIni.laba;
  var margin = bulanIni.omzet ? (bulanIni.laba / bulanIni.omzet) : 0;

  var labaSetahun = (bulanIni.laba / nHari) * 365;
  var hppSetahun = (hppBulan / nHari) * 365;
  var gmroi = nilaiStok ? labaSetahun / nilaiStok : 0;
  var putaran = nilaiStok ? hppSetahun / nilaiStok : 0;
  var dio = hppBulan ? nilaiStok / (hppBulan / nHari) : 0;
  var piutangNilai = piutang.reduce(function (s, x) { return s + x.nilai; }, 0);
  var dso = bulanIni.omzet ? piutangNilai / (bulanIni.omzet / nHari) : 0;

  var mati = stok.filter(function (x) {
    return x.nilai >= 100000 && !(terjual[x.nama] > 0);
  }).sort(function (a, b) { return b.nilai - a.nilai; }).slice(0, 6);
  var nilaiMati = mati.reduce(function (s, x) { return s + x.nilai; }, 0);

  var kat = {};
  inv.forEach(function (i) {
    if (_tglDariMs(i.date).slice(0, 7) !== bulan) return;
    (i.items || []).forEach(function (it) {
      var k = (it.category && it.category.text) || 'Lain';
      var tot = _num(it.total);
      var mod = _num(it.capitalPrice) * _num(it.quantity);
      if (!kat[k]) kat[k] = { omzet: 0, laba: 0 };
      kat[k].omzet += tot; kat[k].laba += (tot - mod);
    });
  });
  var kategori = Object.keys(kat).map(function (k) {
    return { nama: k, omzet: kat[k].omzet, laba: kat[k].laba,
             margin: kat[k].omzet ? kat[k].laba / kat[k].omzet * 100 : 0 };
  }).sort(function (a, b) { return b.omzet - a.omzet; });

  var totPel = 0, pelArr = Object.keys(perPelanggan).map(function (k) {
    totPel += perPelanggan[k].omzet;
    return { nama: k, omzet: perPelanggan[k].omzet, laba: perPelanggan[k].laba,
             margin: perPelanggan[k].omzet
               ? perPelanggan[k].laba / perPelanggan[k].omzet * 100 : 0 };
  }).sort(function (a, b) { return b.omzet - a.omzet; });

  // v2.1: 'Dapur' TIDAK lagi dihitung sebagai Sederhana Jaya. Dapur adalah
  // pelanggan terpisah dengan margin sendiri (10,7%), dan menggabungkannya
  // membuat angka konsentrasi terlihat lebih buruk dari kenyataannya.
  var sjOmzet = 0;
  pelArr.forEach(function (p) {
    if (String(p.nama).toLowerCase().indexOf('sederhana') === 0) sjOmzet += p.omzet;
  });

  return {
    ada: true, nHari: nHari, margin: margin * 100, gmroi: gmroi, putaran: putaran,
    dio: dio, dso: dso, siklusKas: dio + dso,
    stokMati: mati, nilaiStokMati: nilaiMati, kategori: kategori,
    konsentrasiSJ: totPel ? (sjOmzet / totPel * 100) : 0,
    proyeksiLabaBulan: (bulanIni.laba / nHari) * 30,
    proyeksiOmzetBulan: (bulanIni.omzet / nHari) * 30,
    file: namaFile,
    tglData: namaFile.replace('loka-', '').replace('.json', ''),
    hariIni: hariIni, bulanIni: bulanIni, nilaiStok: nilaiStok,
    stokMenipis: menipis, piutang: piutang,
    piutangTotal: piutangNilai,
    grafik: hariUrut.map(function (t) {
      return { tgl: t, omzet: perHari[t].omzet, laba: perHari[t].laba };
    }),
    pelanggan: pelArr.slice(0, 8)
  };
}

function _targetUnit(unit) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TARGET');
  if (!sh) return 0;
  var n = sh.getLastRow() - 1;
  if (n <= 0) return 0;
  var d = sh.getRange(2, 1, n, 2).getValues();
  for (var i = 0; i < d.length; i++) {
    if (String(d[i][0]).trim().toUpperCase() === String(unit).trim().toUpperCase()) {
      return _num(d[i][1]);
    }
  }
  return 0;
}

/**
 * BARU v2.1 — Total beban operasional bulan ini dari sheet BEBAN.
 * Mengembalikan 0 kalau belum ada — dan 0 berarti "BELUM TERCATAT",
 * bukan "tidak ada beban". Bedanya penting: yang pertama artinya laba
 * bersih tidak bisa dihitung; yang kedua artinya laba bersih = laba kotor.
 */
function _bebanBulan(bulan) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BEBAN');
  if (!sh) return 0;
  var n = sh.getLastRow() - 1;
  if (n <= 0) return 0;
  var total = 0;
  sh.getRange(2, 1, n, 4).getValues().forEach(function (r) {
    if (_tglString(r[0]).slice(0, 7) !== bulan) return;
    total += _num(r[3]);
  });
  return total;
}

/**
 * BARU v2.1 — Catat beban operasional (gaji, sewa, listrik, transport, susut).
 * Tanpa ini, laba bersih tidak bisa dihitung dan dashboard hanya bisa
 * menampilkan laba KOTOR.
 */
function catatBeban(pin, payload) {
  var o = _siapa(pin);
  if (o.peran !== 'OWNER') throw new Error('Hanya pemilik yang boleh mencatat beban.');

  var jenis = String((payload && payload.jenis) || '').trim();
  var ket = String((payload && payload.keterangan) || '').trim();
  var nilai = Number(String((payload && payload.nilai) || '0').replace(/[^0-9]/g, '')) || 0;
  var tgl = String((payload && payload.tanggal) || '').trim() || _tglString(new Date());

  if (!jenis) throw new Error('Jenis beban belum dipilih (Gaji/Sewa/Listrik/Transport/Susut/Lain).');
  if (!(nilai > 0)) throw new Error('Nilai beban harus lebih dari 0.');

  var sh = _sheet(SpreadsheetApp.getActiveSpreadsheet(), 'BEBAN');
  sh.appendRow([tgl, jenis, ket, nilai, o.nama]);
  sh.getRange(sh.getLastRow(), 4).setNumberFormat('#,##0');
  _catatAkses(o, 'CATAT BEBAN', jenis + ' · ' + _rp(nilai) + ' · ' + ket);

  return { ok: true, jenis: jenis, nilai: nilai, nilaiRp: _rp(nilai), tanggal: tgl };
}

/**
 * Semua yang ditampilkan di dashboard owner.
 *
 * PERBAIKAN PENTING v2.1 — dashboard sebelumnya menyesatkan.
 * `target.tercapai` memakai laba KOTOR dari Loka, lalu dibandingkan dengan
 * TARGET Rp20 juta yang dipahami sebagai laba BERSIH.
 * Juli 2026: laba kotor Rp14,5 jt -> dashboard menampilkan "tercapai 73%".
 * Kenyataannya laba bersih Juli MINUS Rp1,4 jt.
 * Itu bukan angka salah hitung — angka benar yang salah label, dan itu
 * lebih berbahaya karena terlihat kredibel.
 * Sekarang: laba kotor dinamai jujur, dan laba bersih HANYA ditampilkan
 * kalau beban operasional benar-benar sudah tercatat.
 */
function dashboard(pin) {
  var o = _siapa(pin);
  _boleh(o, 'dashboard');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hari = _tglString(new Date());
  var bulan = hari.slice(0, 7);
  var loka = _ringkasLoka();

  var ts = ss.getSheetByName('TUTUP_SHIFT');
  var shiftAkhir = null;
  var dompetBulan = { kasKasir: 0, kasTunai: 0, ibu: 0, bri: 0, prive: 0 };
  var shiftBelum = true;
  var lebarTs = Math.max(ts.getLastColumn(), 22);
  var n = ts.getLastRow() - 1;
  if (n > 0) {
    var d = ts.getRange(2, 1, n, lebarTs).getValues();
    var akhirBulanIni = null;
    d.forEach(function (r) {
      var t = _tglString(r[1]);
      if (t.slice(0, 7) === bulan) {
        dompetBulan.ibu += _num(r[7]);
        dompetBulan.bri += _num(r[8]);
        dompetBulan.prive += _num(r[9]);
        akhirBulanIni = r;
      }
      if (t === hari) shiftBelum = false;
    });
    var akhir = akhirBulanIni || d[d.length - 1];
    dompetBulan.kasKasir = _num(akhir[5]);
    dompetBulan.kasTunai = _num(akhir[6]);
    shiftAkhir = { tgl: _tglString(akhir[1]), kasir: akhir[2],
                   selisih: _num(akhir[12]), selisihRp: _rp(_num(akhir[12])),
                   status: akhir[13] };
  }

  var keluar = _bacaHari(ss.getSheetByName('KELUAR'), KOL_KELUAR, hari);
  var sudah = _petaTerima();
  var idSet = {}, belumKonf = 0, nilaiKeluar = 0;
  keluar.forEach(function (r) {
    nilaiKeluar += _num(r[9]);
    var id = String(r[11] || '').trim();
    if (id && !idSet[id]) { idSet[id] = true; if (!sudah[id]) belumKonf++; }
  });

  var beban = _bebanBulan(bulan);
  var labaKotorBulan = loka.ada ? loka.bulanIni.laba : 0;

  var tindak = [];

  // Peringatan paling penting ditaruh paling atas.
  if (beban === 0) {
    tindak.push({ jenis: 'bad', teks:
      'Beban operasional bulan ini BELUM TERCATAT. Angka laba di dashboard ini ' +
      'adalah LABA KOTOR, bukan laba bersih. Contoh Juli 2026: laba kotor ' +
      'Rp14,5 jt tapi laba bersih MINUS Rp1,4 jt. Catat gaji, sewa, listrik, ' +
      'transport, dan susut supaya angkanya bisa dipercaya.' });
  }
  if (belumKonf) tindak.push({ jenis: 'warn', teks: belumKonf +
      ' pengiriman hari ini belum dikonfirmasi terima' });
  if (shiftAkhir && shiftAkhir.status !== 'WAJAR') tindak.push({ jenis: 'bad',
      teks: 'Selisih kas ' + shiftAkhir.tgl + ' sebesar ' + _rp(shiftAkhir.selisih) +
            ' (' + shiftAkhir.kasir + ')' });
  if (shiftBelum) tindak.push({ jenis: 'warn',
      teks: 'Tutup shift hari ini belum diisi' });
  if (dompetBulan.kasTunai > BATAS_BRANKAS_MENGINAP) tindak.push({ jenis: 'warn',
      teks: 'Brankas berisi ' + _rp(dompetBulan.kasTunai) + ' — di atas batas ' +
            _rp(BATAS_BRANKAS_MENGINAP) + ', seharusnya sudah disetor' });
  if (loka.ada && loka.stokMenipis.length) tindak.push({ jenis: 'warn',
      teks: loka.stokMenipis.length + ' barang akan habis dalam 5 hari' });
  if (loka.ada && loka.nilaiStokMati > 0) tindak.push({ jenis: 'warn',
      teks: 'Stok mati ' + _rp(loka.nilaiStokMati) + ' — modal terjebak di ' +
            loka.stokMati.length + ' barang yang tidak bergerak' });
  if (loka.ada && loka.piutangTotal > 0) tindak.push({ jenis: 'warn',
      teks: 'Piutang belum lunas ' + _rp(loka.piutangTotal) +
            ' dari ' + loka.piutang.length + ' nota' });
  if (loka.ada && loka.tglData !== hari) tindak.push({ jenis: 'info',
      teks: 'Data Loka terakhir ' + loka.tglData + ', belum ada data hari ini' });
  if (!loka.ada) tindak.push({ jenis: 'bad', teks: 'Data Loka belum masuk: ' + loka.alasan });

  var target = _targetUnit(o.unit);
  var hariIniTgl = Number(hari.slice(8, 10));
  var totalHari = new Date(Number(hari.slice(0, 4)), Number(hari.slice(5, 7)), 0).getDate();
  var sisaHari = Math.max(totalHari - hariIniTgl + 1, 1);

  var m = loka.ada ? (loka.margin / 100) : 0;
  var omzetProyeksi = loka.ada ? loka.proyeksiOmzetBulan : 0;
  var labaKotorProyeksi = loka.ada ? loka.proyeksiLabaBulan : 0;

  return {
    orang: o, tanggal: hari, loka: loka,
    hariIni: loka.ada ? loka.hariIni : null,
    keluarHariIni: { nilai: nilaiKeluar, nilaiRp: _rp(nilaiKeluar),
                     kiriman: Object.keys(idSet).length,
                     belumKonfirmasi: belumKonf },
    shiftAkhir: shiftAkhir, shiftBelumHariIni: shiftBelum,
    dompet: dompetBulan,
    uangDiTangan: dompetBulan.kasKasir + dompetBulan.kasTunai,
    uangDiTanganRp: _rp(dompetBulan.kasKasir + dompetBulan.kasTunai),
    beban: {
      tercatat: beban, tercatatRp: _rp(beban),
      sudahDicatat: beban > 0
    },
    target: {
      nilai: target, nilaiRp: _rp(target),
      // Dinamai jujur: ini laba KOTOR
      labaKotorBulan: labaKotorBulan, labaKotorBulanRp: _rp(labaKotorBulan),
      labaKotorProyeksi: labaKotorProyeksi,
      labaKotorProyeksiRp: _rp(labaKotorProyeksi),
      // Laba bersih hanya kalau bebannya benar-benar ada
      labaBersihBisaDihitung: beban > 0,
      labaBersihBulan: beban > 0 ? (labaKotorBulan - beban) : null,
      labaBersihBulanRp: beban > 0 ? _rp(labaKotorBulan - beban) : 'belum bisa dihitung',
      sisaHari: sisaHari,
      omzetPerlu: m > 0 ? target / m : 0,
      omzetTambah: m > 0 ? Math.max(target / m - omzetProyeksi, 0) : 0,
      marginPerlu: omzetProyeksi > 0 ? (target / omzetProyeksi * 100) : 0,
      marginSekarang: loka.ada ? loka.margin : 0
    },
    tindak: tindak
  };
}

function _tabRekapSJ4(ss) {
  var props = PropertiesService.getScriptProperties();
  var simpan = props.getProperty('TAB_REKAP_SJ4');
  if (simpan) {
    var s = ss.getSheetByName(simpan);
    if (s) return s;
  }
  var tabs = ss.getSheets();
  for (var i = 0; i < tabs.length; i++) {
    var sh = tabs[i];
    var n = Math.min(sh.getLastRow(), 8);
    var k = Math.min(sh.getLastColumn(), 25);
    if (n < 3 || k < 4) continue;
    var atas = sh.getRange(1, 1, n, k).getValues();
    for (var r = 0; r < atas.length; r++) {
      for (var c = 0; c < atas[r].length; c++) {
        if (String(atas[r][c]).toLowerCase().indexOf('central kitchen') >= 0) {
          props.setProperty('TAB_REKAP_SJ4', sh.getName());
          return sh;
        }
      }
    }
  }
  return null;
}

function _ringkasCK() {
  var ss;
  try {
    ss = SpreadsheetApp.openById(ID_BUKU_SJ4);
  } catch (e) {
    return { ada: false, alasan: 'Buku biaya SJ 4 tidak bisa dibuka. ' +
             'Pastikan masih dibagikan ke akun ini.' };
  }

  var sh = _tabRekapSJ4(ss);
  if (!sh) return { ada: false,
    alasan: 'Tab rekap harian (yang punya kolom "Barang dari Central Kitchen") tidak ketemu.' };

  var nR = sh.getLastRow(), nK = Math.min(sh.getLastColumn(), 30);
  if (nR < 4) return { ada: false, alasan: 'Tab rekap masih kosong.' };
  var data = sh.getRange(1, 1, nR, nK).getValues();

  var kCK = -1, kOmzet = -1, barisHeader = -1;
  for (var r = 0; r < Math.min(data.length, 8); r++) {
    for (var c = 0; c < data[r].length; c++) {
      var v = String(data[r][c]).toLowerCase();
      if (kCK < 0 && v.indexOf('central kitchen') >= 0) { kCK = c; barisHeader = r; }
      if (kOmzet < 0 && (v.indexOf('omzet') >= 0 || v.indexOf('omset') >= 0)) kOmzet = c;
    }
  }
  if (kCK < 0) return { ada: false, alasan: 'Kolom Central Kitchen tidak ketemu.' };

  var harian = [], totalCK = 0, totalOmzet = 0, hariIsi = 0;
  for (var i = barisHeader + 1; i < data.length; i++) {
    var tg = Number(data[i][0]);
    if (!tg || tg < 1 || tg > 31) continue;
    var ck = _num(data[i][kCK]);
    var om = kOmzet >= 0 ? _num(data[i][kOmzet]) : 0;
    if (ck === 0 && om === 0) continue;
    harian.push({ tgl: tg, ck: ck, ckRp: _rp(ck), omzetSJ4: om });
    totalCK += ck;
    totalOmzet += om;
    if (ck > 0) hariIsi++;
  }

  if (!harian.length) return { ada: false, alasan: 'Belum ada baris harian yang terisi.' };

  var rata = hariIsi ? totalCK / hariIsi : 0;
  var urut = harian.slice().sort(function (a, b) { return b.ck - a.ck; });

  // v2.1: hitung juga berapa item CK yang sudah punya harga.
  var ckHarga = _statusHargaCK();

  return {
    ada: true, tab: sh.getName(), harian: harian, hariIsi: hariIsi,
    totalCK: totalCK, totalCKRp: _rp(totalCK),
    rataCK: rata, rataCKRp: _rp(rata),
    proyeksiBulan: rata * 30, proyeksiBulanRp: _rp(rata * 30),
    totalOmzetSJ4: totalOmzet, totalOmzetSJ4Rp: _rp(totalOmzet),
    kontribusi: totalOmzet ? (totalCK / totalOmzet * 100) : 0,
    tertinggi: urut[0], terendah: urut[urut.length - 1],
    hariKosong: harian.filter(function (h) { return h.ck === 0; }).length,
    hargaTerisi: ckHarga.terisi, hargaTotal: ckHarga.total
  };
}

function dashboardCK(pin) {
  var o = _siapa(pin);
  _boleh(o, 'dashCK');
  var ck = _ringkasCK();
  var target = _targetUnit('CK');
  var h = _statusHargaCK();

  var tindak = [];
  if (!ck.ada) {
    tindak.push({ jenis: 'bad', teks: 'Data CK belum terbaca: ' + ck.alasan });
  } else {
    if (ck.hariKosong > 0) tindak.push({ jenis: 'warn',
      teks: ck.hariKosong + ' hari tercatat Rp0 — cek apakah memang tidak ada kiriman' });
    tindak.push({ jenis: 'info',
      teks: 'Penjualan CK ke Sederhana Jaya 1 belum masuk — angka ini baru dari SJ 4' });
  }

  if (h.terisi === 0) {
    tindak.push({ jenis: 'bad', teks:
      'Belum ada satu pun dari ' + h.total + ' barang Dapur yang punya harga. ' +
      'Selama harganya nol, nilai kerja dapur tidak bisa ditunjukkan dan laba CK ' +
      'tidak bisa dihitung. Mulai dari 5 barang paling banyak dikirim, ' +
      'cukup harga bahannya dulu.' });
  } else if (h.terisi < h.total) {
    tindak.push({ jenis: 'warn', teks:
      h.terisi + ' dari ' + h.total + ' barang Dapur sudah punya harga. ' +
      'Sisanya ' + (h.total - h.terisi) + ' masih 0.' });
  }

  return { orang: o, tanggal: _tglString(new Date()),
           ck: ck, target: target, targetRp: _rp(target),
           harga: h, tindak: tindak };
}
