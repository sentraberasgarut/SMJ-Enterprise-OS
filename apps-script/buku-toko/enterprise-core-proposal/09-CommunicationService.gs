// ============================================================================
// Communication Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// Nightly PO pull from the Sederhana Jaya 4 Totalan sheet, and the WhatsApp
// number normalizer every outbound message depends on. Moved verbatim from
// the live Code.gs. BULAN_ID (moved here from its original inline position
// right before kirimPOMalam) is also declared here since nothing outside
// this file's own functions references it.
// ============================================================================

var BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function kirimPOMalam() {
  var bsk = new Date();
  bsk.setDate(bsk.getDate() + 1);
  var hasil = _bacaPO(bsk);
  _kabarPO(hasil);
  return hasil;
}

function kirimPOSekarang() {
  var h = kirimPOMalam();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    h.ada ? (h.baris.length + ' barang ditemukan. Cek email Anda.')
          : ('Belum ada PO. ' + h.alasan),
    'PO ' + h.tanggalTeks, 10);
}

function _bacaPO(tgl) {
  var namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var tglTeks = namaHari[tgl.getDay()] + ', ' + tgl.getDate() + ' ' +
                BULAN_ID[tgl.getMonth()] + ' ' + tgl.getFullYear();
  var namaTab = BULAN_ID[tgl.getMonth()];
  var kosong = { ada: false, baris: [], total: 0,
                 tanggalTeks: tglTeks, tab: namaTab, alasan: '' };

  var ss;
  try {
    ss = SpreadsheetApp.openById(ID_TOTALAN_SJ4);
  } catch (e) {
    kosong.alasan = 'Sheet Totalan tidak bisa dibuka. Pastikan masih dibagikan ke akun ini.';
    return kosong;
  }

  var sh = ss.getSheetByName(namaTab);
  if (!sh) {
    kosong.alasan = 'Tab bulan "' + namaTab + '" belum ada di sheet Totalan.';
    return kosong;
  }

  var n = sh.getLastRow();
  if (n < 2) { kosong.alasan = 'Tab ' + namaTab + ' masih kosong.'; return kosong; }
  var data = sh.getRange(1, 1, n, 6).getValues();

  var hari = tgl.getDate();
  var bulanTeks = BULAN_ID[tgl.getMonth()].toLowerCase();
  var mulai = -1;
  for (var i = 0; i < data.length; i++) {
    var a = data[i][0];
    if (!a) continue;
    var cocok = false;
    if (Object.prototype.toString.call(a) === '[object Date]') {
      cocok = (a.getDate() === hari && a.getMonth() === tgl.getMonth() &&
               a.getFullYear() === tgl.getFullYear());
    } else {
      var s = String(a).toLowerCase();
      if (s.indexOf(bulanTeks) >= 0) {
        var m = s.match(/(\d{1,2})/);
        cocok = (m && Number(m[1]) === hari);
      }
    }
    if (cocok) { mulai = i; break; }
  }

  if (mulai < 0) {
    kosong.alasan = 'Blok tanggal ' + tglTeks + ' belum ada di sheet. ' +
                    'Kemungkinan SJ 4 belum mengisi PO malam ini.';
    return kosong;
  }

  var baris = [], total = 0;
  for (var j = mulai; j < data.length; j++) {
    var nb = String(data[j][1] || '').trim();
    var atas = nb.toUpperCase();
    if (!nb) continue;
    if (atas === 'TOTAL') break;
    if (j > mulai && data[j][0] && String(data[j][0]) !== String(data[mulai][0]) &&
        atas === 'TOKO SEMBAKO') break;
    if (atas === 'TOKO SEMBAKO' || atas === 'NAMA BARANG' ||
        atas === 'PURCHASE ORDER' || atas === 'GRAND TOTAL') continue;

    var qty = Number(data[j][2]);
    if (!qty || isNaN(qty) || qty <= 0) continue;
    var harga = Number(data[j][4]) || 0;
    var nilai = Number(data[j][5]);
    if (!nilai || isNaN(nilai)) nilai = qty * harga;
    baris.push({ nama: nb, qty: qty, satuan: String(data[j][3] || '').trim(),
                 harga: harga, nilai: nilai });
    total += nilai;
  }

  if (!baris.length) {
    kosong.alasan = 'Blok ' + tglTeks + ' ditemukan, tapi belum ada barang yang diisi qty-nya.';
    return kosong;
  }

  return { ada: true, baris: baris, total: total,
           tanggalTeks: tglTeks, tab: namaTab, alasan: '' };
}

function _teksPO(h) {
  var t = ['*PO SEDERHANA JAYA 4*', h.tanggalTeks, ''];
  h.baris.forEach(function (b) {
    t.push('• ' + b.nama + ' — ' + b.qty + ' ' + b.satuan);
  });
  t.push('', 'Total ' + h.baris.length + ' barang · ' + _rp(h.total));
  t.push('', 'Mohon disiapkan sebelum jam 05.30.');
  t.push('Setelah barang keluar, catat di aplikasi Buku Toko.');
  return t.join('\n');
}

function _kabarPO(h) {
  var email = Session.getEffectiveUser().getEmail();

  if (!h.ada) {
    MailApp.sendEmail({
      to: email,
      subject: '[PO KOSONG] Sederhana Jaya 4 — ' + h.tanggalTeks,
      body: 'Belum ada PO untuk ' + h.tanggalTeks + '.\n\n' + h.alasan +
            '\n\nKalau memang SJ 4 tidak memesan besok, abaikan pesan ini.\n' +
            'Kalau seharusnya ada, cek sheet Totalan Toko Sembako tab ' + h.tab + '.'
    });
    return;
  }

  var teks = _teksPO(h);
  var pesan = encodeURIComponent(teks);
  var orang = _nomorOrang(PENERIMA_PO);

  var tombol = orang.map(function (x) {
    if (!x.wa) {
      return '<div style="margin:8px 0;padding:12px 16px;background:#F2F2F2;' +
             'border-radius:8px;color:#888;font-size:14px">' +
             x.nama + ' — nomor WA belum diisi di sheet ORANG</div>';
    }
    return '<a href="https://wa.me/' + x.wa + '?text=' + pesan + '" ' +
           'style="display:block;margin:8px 0;padding:14px 16px;background:#25D366;' +
           'color:#fff;text-decoration:none;border-radius:8px;font-weight:700;' +
           'font-size:15px;text-align:center">Kirim ke ' + x.nama + '</a>';
  }).join('');

  var daftar = h.baris.map(function (b) {
    return '<tr><td style="padding:7px 4px;border-bottom:1px solid #eee">' + b.nama +
           '</td><td style="padding:7px 4px;border-bottom:1px solid #eee;' +
           'text-align:right;white-space:nowrap"><b>' + b.qty + '</b> ' + b.satuan +
           '</td><td style="padding:7px 4px;border-bottom:1px solid #eee;' +
           'text-align:right;white-space:nowrap">' + _rp(b.nilai) + '</td></tr>';
  }).join('');

  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial;max-width:520px;' +
    'margin:0 auto;color:#2C2C2C">' +
    '<div style="background:#4F6042;color:#F7F3E9;padding:18px 20px;border-radius:12px 12px 0 0">' +
      '<div style="font-size:11px;letter-spacing:1.5px;opacity:.75">PURCHASE ORDER</div>' +
      '<div style="font-size:19px;font-weight:700;margin-top:3px">Sederhana Jaya 4</div>' +
      '<div style="font-size:13px;opacity:.85;margin-top:2px">' + h.tanggalTeks + '</div>' +
    '</div>' +
    '<div style="background:#fff;border:1px solid #EDE6D5;border-top:none;' +
    'border-radius:0 0 12px 12px;padding:18px 20px">' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px">' + daftar + '</table>' +
      '<div style="margin-top:14px;padding-top:12px;border-top:2px solid #4F6042;' +
      'display:flex;justify-content:space-between;font-weight:700;font-size:15px">' +
        '<span>' + h.baris.length + ' barang</span><span>' + _rp(h.total) + '</span></div>' +
      '<div style="margin-top:22px;font-size:12px;color:#7A7568;letter-spacing:.5px;' +
      'text-transform:uppercase;font-weight:700">Kirim pesan ini</div>' +
      tombol +
      '<div style="margin-top:16px;font-size:12px;color:#7A7568;line-height:1.6">' +
      'Tombol di atas membuka WhatsApp dengan pesan sudah terisi — Anda tinggal ' +
      'menekan kirim. Aplikasi tidak bisa mengirim sendiri tanpa layanan berbayar.' +
      '</div></div></div>';

  MailApp.sendEmail({
    to: email,
    subject: 'PO Sederhana Jaya 4 — ' + h.tanggalTeks + ' (' + h.baris.length + ' barang)',
    body: teks + '\n\n(Buka email ini di HP untuk tombol kirim WhatsApp)',
    htmlBody: html
  });
}

function _wa(no) {
  var s = String(no || '').replace(/[^0-9]/g, '');
  if (!s) return '';
  if (s.indexOf('0') === 0) s = '62' + s.slice(1);
  if (s.indexOf('62') !== 0) s = '62' + s;
  return s.length >= 11 ? s : '';
}
