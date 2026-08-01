// ============================================================================
// Cash Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// Wallet definitions (DOMPET), custody thresholds, daily cash monitoring.
// Moved verbatim from the live Code.gs.
// ============================================================================

function _dompetBerlaku(tgl) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DOMPET');
  var n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 6).getValues()
    .filter(function (r) {
      if (!r[0]) return false;
      var dari = _tglTeks(r[3]);
      var sampai = _tglTeks(r[4]);
      if (dari && tgl < dari) return false;
      if (sampai && tgl > sampai) return false;
      return true;
    })
    .sort(function (a, b) { return (Number(a[5]) || 0) - (Number(b[5]) || 0); })
    .map(function (r) {
      return { kode: String(r[0]).trim(), nama: String(r[1]).trim(),
               jenis: String(r[2]).trim().toUpperCase() };
    });
}

function _tglTeks(v) {
  if (!v) return '';
  if (v instanceof Date) return _tglString(v);
  return String(v).trim();
}

function _folderBukti(tgl) {
  var props = PropertiesService.getScriptProperties();
  var idAkar = props.getProperty('FOLDER_BUKTI_ID');
  var akar;
  try {
    akar = idAkar ? DriveApp.getFolderById(idAkar) : null;
  } catch (e) { akar = null; }
  if (!akar) {
    var cari = DriveApp.getFoldersByName(FOLDER_BUKTI);
    akar = cari.hasNext() ? cari.next() : DriveApp.createFolder(FOLDER_BUKTI);
    props.setProperty('FOLDER_BUKTI_ID', akar.getId());
  }
  var bulan = String(tgl).slice(0, 7);
  var sub = akar.getFoldersByName(bulan);
  return sub.hasNext() ? sub.next() : akar.createFolder(bulan);
}

/**
 * BARU v2.1 — Jenjang setoran dari saldo brankas.
 * A = boleh simpan brankas · B = wajib setor hari itu · C = wajib + pendamping
 */
function _jenjangSetoran(brankasAkhir) {
  var s = Number(brankasAkhir) || 0;
  if (s <= 0) {
    return { jenjang: '-', wajibSetor: false, pendamping: false,
             pesan: 'Brankas kosong, tidak ada yang perlu disetor.' };
  }
  if (s > BATAS_PENDAMPING) {
    return { jenjang: 'C', wajibSetor: true, pendamping: true,
             pesan: 'Brankas ' + _rp(s) + ' — di atas ' + _rp(BATAS_PENDAMPING) +
                    '. WAJIB setor hari ini dan JANGAN berangkat sendirian, ' +
                    'minta Mas War menemani. Kalau tidak ada yang menemani, ' +
                    'setor sebagian saja sampai sisa di bawah ' +
                    _rp(BATAS_BRANKAS_MENGINAP) + '.' };
  }
  if (s > BATAS_BRANKAS_MENGINAP) {
    return { jenjang: 'B', wajibSetor: true, pendamping: false,
             pesan: 'Brankas ' + _rp(s) + ' — di atas ' +
                    _rp(BATAS_BRANKAS_MENGINAP) + '. WAJIB setor ke ATM setor ' +
                    'tunai hari ini, kecuali sudah lewat jam 18.30. ' +
                    'Lewat jam itu: simpan brankas, setor besok pagi.' };
  }
  return { jenjang: 'A', wajibSetor: false, pendamping: false,
           pesan: 'Brankas ' + _rp(s) + ' — masih di bawah ' +
                  _rp(BATAS_BRANKAS_MENGINAP) + '. Boleh simpan di brankas.' };
}

/**
 * BARU v2.1 — Cek kas harian: uang menginap terlalu lama & setoran
 * belum diverifikasi. Dijalankan otomatis setiap pagi jam 7.
 * Ini yang membuat aturan kas berjalan tanpa CEO harus ingat memeriksa.
 */
function cekHarianKas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ts = ss.getSheetByName('TUTUP_SHIFT');
  if (!ts || ts.getLastRow() < 2) return 'Belum ada data tutup shift.';

  var lebar = Math.max(ts.getLastColumn(), 22);
  var mulai = Math.max(2, ts.getLastRow() - 60 + 1);
  var jml = ts.getLastRow() - mulai + 1;
  var d = ts.getRange(mulai, 1, jml, lebar).getValues();

  var pesan = [];
  var hariIni = new Date();

  // Uang menginap di brankas
  var akhir = d[d.length - 1];
  var brankas = _num(akhir[6]);
  var tglAkhir = akhir[1];
  if (brankas > 0 && tglAkhir) {
    var hari = Math.floor((hariIni - new Date(tglAkhir)) / 86400000);
    if (brankas > BATAS_BRANKAS_MENGINAP) {
      pesan.push('Brankas berisi ' + _rp(brankas) + ' — di atas batas ' +
        _rp(BATAS_BRANKAS_MENGINAP) + '. Seharusnya sudah disetor.');
    } else if (hari >= 3) {
      pesan.push(_rp(brankas) + ' sudah ' + hari +
        ' hari di brankas (batas 3 hari). Setor hari ini.');
    }
  }

  // Setoran belum diverifikasi lewat 24 jam
  if (lebar >= KOL_SHIFT) {
    var menunggu = 0;
    d.forEach(function (r) {
      if (String(r[25] || '').trim() !== 'MENUNGGU VERIFIKASI') return;
      if (!r[1]) return;
      if ((hariIni - new Date(r[1])) / 3600000 > 24) menunggu++;
    });
    if (menunggu > 0) {
      pesan.push(menunggu + ' setoran belum diverifikasi lewat 24 jam. ' +
        'Cek mutasi BRI, lalu tandai COCOK atau SELISIH di sheet TUTUP_SHIFT ' +
        'kolom Status Setoran.');
    }
  }

  // Tutup shift belum diisi
  var kmr = new Date(); kmr.setDate(kmr.getDate() - 1);
  var adaKemarin = d.some(function (r) {
    return _tglString(r[1]) === _tglString(kmr);
  });
  if (!adaKemarin) {
    pesan.push('Tutup shift tanggal ' + _tglString(kmr) +
      ' TIDAK ADA. Kalau toko buka, berarti ada yang tidak mengisi.');
  }

  if (!pesan.length) return 'Semua bersih — tidak ada yang perlu diingatkan.';

  var teks = ['*Cek Kas Harian — ' + _tglString(hariIni) + '*', ''].concat(
    pesan.map(function (p) { return '• ' + p; })).join('\n');
  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: '[CEK KAS] ' + _tglString(hariIni) + ' — ' + pesan.length + ' hal',
      body: teks + '\n\nKirim ke WhatsApp:\nhttps://wa.me/' + WA_OWNER +
            '?text=' + encodeURIComponent(teks)
    });
  } catch (e) {}
  return teks;
}

/** Set titik nol saldo brankas dari hasil hitung uang fisik. */
function setBrankasMenu() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Set saldo brankas awal',
    'Hitung dulu uang FISIK di brankas sekarang, lalu tulis angkanya ' +
    '(tanpa titik, contoh: 9200000).\n\n' +
    'Angka ini jadi titik nol. Kalau salah, semua perhitungan setelahnya ikut salah.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;

  var nilai = Number(String(r.getResponseText()).replace(/[^0-9]/g, ''));
  if (!(nilai >= 0)) { ui.alert('Angka tidak terbaca. Coba lagi.'); return; }

  var props = PropertiesService.getDocumentProperties();
  props.setProperty('BRANKAS_TITIK_NOL', String(nilai));
  props.setProperty('BRANKAS_TITIK_NOL_TGL', _tglString(new Date()));

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ts = ss.getSheetByName('TUTUP_SHIFT');
  if (ts && ts.getLastRow() >= 2 && ts.getLastColumn() >= KOL_SHIFT) {
    ts.getRange(ts.getLastRow(), 7).setValue(nilai);   // Kas Tunai baris terakhir
  }

  ui.alert('Titik nol brankas diset: ' + _rp(nilai) + ' pada ' +
           _tglString(new Date()) + '.\n\n' +
           'Tutup shift berikutnya akan memakai angka ini sebagai saldo awal brankas.');
}
