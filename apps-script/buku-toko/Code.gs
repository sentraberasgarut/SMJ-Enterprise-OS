// ============================================================================
// Buku Toko Sembako & Central Kitchen — Code.gs
// VERSI 2.1 · 30 Juli 2026
// ============================================================================
//
// CARA PAKAI: timpa SELURUH isi Code.gs dengan file ini, lalu:
//   1. Simpan
//   2. Menu "Buku Toko Sembako & Central Kitchen" > "Setup / perbaiki sistem"
//   3. Deploy > Manage deployments > edit > Deploy (versi baru)
//
// ----------------------------------------------------------------------------
// YANG LANGSUNG TERASA TANPA UBAH TAMPILAN:
//   ✅ Aplikasi jauh lebih cepat & tidak melambat lagi seiring data bertambah
//   ✅ Upload foto tutup shift jadi satu kali kirim (jarang gagal di tengah)
//   ✅ Saldo brankas ikut dihitung — selisih kas tidak lagi salah
//   ✅ Dashboard tidak lagi menyebut laba kotor sebagai "tercapai"
//   ✅ Penyiap & Pengantar bisa lihat riwayat pekerjaannya sendiri
//   ✅ Angka rupiah diformat rapi (Rp387.500) di semua pesan & rekap
//
// YANG SUDAH SIAP TAPI BUTUH TOMBOL DI Index.html:
//   ⏳ Tambah barang dari aplikasi        -> tambahBarang()
//   ⏳ Tambah orang/penerima dari aplikasi -> tambahOrang()
//   ⏳ Batalkan kiriman yang salah input   -> batalkanKiriman()
//   ⏳ Edit harga barang Dapur (MASTER_CK) -> simpanHarga() sudah mendukung
//   ⏳ Catat beban operasional             -> catatBeban()
//   Kirim Index.html kalau mau tombolnya dibuatkan.
//
// ⚠️ FILE INI BELUM PERNAH DIJALANKAN. Tidak ada cara menguji Apps Script dari
//    sisi penyusun. Simpan backup Code.gs lama sebelum menimpa.
// ============================================================================

// ====================== KONFIGURASI ======================

var NAMA_APP    = 'Buku Toko & Central Kitchen';
var NAMA_PENDEK = 'BUKU TOKO';
var VERSI       = '4.0';

var UNIT_NAMA = {
  TSS: 'Toko Sembako Sejahtera', CK: 'Central Kitchen',
  SJ1: 'Sederhana Jaya 1', SJ2: 'Sederhana Jaya 2', SJ3: 'Sederhana Jaya 3',
  SJ4: 'Sederhana Jaya 4', SJ5: 'Sederhana Jaya 5'
};

// Orang & peran awal. HANYA dipakai saat sheet ORANG masih kosong.
// Kolom (WAJIB 8): Nama | PIN | Peran | Unit | Aktif | No WA | Unit Dilihat | Catatan
var ORANG_AWAL = [
  ['Ayu',       '9191', 'KASIR',     'TSS', 'YA', '6289531701574', '',        ''],
  ['Teh Dede',  '1111', 'PENYIAP & PENERIMA',   'SJ1', 'YA', '6285741752182',  '',      '',],
  ['Mas Haris', '1919', 'PENYIAP & PENERIMA',   'SJ1', 'YA', '6285974625595', '',        ''],
  ['Mas War',   '1010', 'PENGANTAR', '-',   'YA', '6285227322833', '',        'Pak Warsino'],
  ['Ayah Iman', '1414', 'PENYIAP',   'SJ1', 'YA', '6282130712285', '',        'Ayah'],
  ['Sanding',   '4444', 'PENERIMA',   'SJ4', 'YA', '628176772921',  '',        ''],
  ['Aditya',    '6060', 'OWNER',     'TSS', 'YA', '6285190022529', 'TSS,CK',  'CEO — lihat dua unit'],
  ['Sri Nurul', '1818', 'OWNER',     'CK',  'YA', '6282130933995', 'CK',      '']
];

var ID_TOTALAN_SJ4 = '1QopVqSV5fxBBv6tbklqnW0u-qXWmyiir_rNXFLk3HLE';
var PENERIMA_PO = ['Aditya', 'Teh Dede', 'Mas War'];
var JAM_PO = 23;

var TUJUAN = ['Sederhana Jaya 1', 'Sederhana Jaya 2', 'Sederhana Jaya 3',
              'Sederhana Jaya 4', 'Sederhana Jaya 5', 'Dapur', 'Papoy', 'Lainnya'];

var KODE_TUJUAN = {
  'Sederhana Jaya 1': 'SJ1',
  'Sederhana Jaya 2': 'SJ2',
  'Sederhana Jaya 3': 'SJ3',
  'Sederhana Jaya 4': 'SJ4',
  'Sederhana Jaya 5': 'SJ5',
  'Dapur':            'DPR',
  'Papoy':            'PPY',
  'Guras':            'GRS',
  'Lainnya':          'LAIN'
};

var MASTER_ITEM = [
  ['Beras', 'Super', 'karung', 387500, 'SJ', ''],
  ['Beras', 'Sarinah', 'karung', 375000, 'SJ', ''],
  ['Beras', 'Panawuan', 'karung', 387500, 'SJ', ''],
  ['Beras', 'Sarinah Super', 'karung', 380000, 'SJ', ''],
  ['Beras', 'Singaparna', 'karung', 362500, 'SJ', ''],
  ['Beras', 'Buleud', 'karung', 355000, 'SJ', ''],
  ['Beras', 'Beras Euceu', 'karung', 380000, 'SJ', ''],
  ['Beras', 'Merah', 'kg', 15500, 'SJ', ''],
  ['Beras', 'Merah (karung)', 'karung', 380000, 'SJ', ''],
  ['Bahan Dapur', 'Micin Sobaso', 'kg', 35000, 'SJ', ''],
  ['Bahan Dapur', 'Telur', 'kg', 26000, 'SJ', ''],
  ['Bahan Dapur', 'Cabe Garing', 'kg', 77000, 'SJ', ''],
  ['Bahan Dapur', 'Cengek Garing', 'kg', 66000, 'SJ', ''],
  ['Bahan Dapur', 'Cengek Garing (ball)', 'ball', 340000, 'SJ', ''],
  ['Bahan Dapur', 'Muncang (ball)', 'ball', 235000, 'SJ', ''],
  ['Bahan Dapur', 'Muncang', 'kg', 47000, 'SJ', ''],
  ['Bahan Dapur', 'Bawang Putih (ball)', 'ball', 190000, 'SJ', ''],
  ['Bahan Dapur', 'Bawang Putih', 'kg', 38000, 'SJ', ''],
  ['Bahan Dapur', 'Terigu Gatot Kaca 1Kg', 'dus', 85000, 'SJ', ''],
  ['Bahan Dapur', 'Terigu Tulip', 'dus', 90000, 'SJ', ''],
  ['Bahan Dapur', 'Garam Fortuna', 'ball', 65000, 'SJ', ''],
  ['Bahan Dapur', 'Garam Kereta', 'ball', 65000, 'SJ', ''],
  ['Bahan Dapur', 'Garam Bison', 'ball', 63000, 'SJ', ''],
  ['Bahan Dapur', 'Royko Renceng', 'renceng', 5000, 'SJ', 'BARU'],
  ['Gula', 'Gula Putih', 'kg', 18000, 'SJ', ''],
  ['Gula', 'Gula Merah (ball)', 'ball', 105000, 'SJ', ''],
  ['Gula', 'Gula Merah', 'kg', 21000, 'SJ', ''],
  ['Minyak', 'Minyak Kita 2L (karton)', 'krtn', 232000, 'SJ', ''],
  ['Minyak', 'Minyak Sri 1L (karton)', 'krtn', 232000, 'SJ', ''],
  ['Minyak', 'Minyak Rose Brand 2L (karton)', 'krtn', 247000, 'SJ', ''],
  ['Kerupuk', 'Kerupuk Fina', 'dus', 100000, 'SJ', '']
];

// Barang Central Kitchen. HARGA MASIH 0 — wewenang Ibu & Teh Nurul.
var MASTER_CK = [
  ['Ayam & Unggas', 'Ati Ampela', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Pepes Ayam Kampung', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ayam Keraton', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ayam Baladoeun', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ayam Fillet', 'kg', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ayam bagi 8', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ayam 2ons', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ayam potongan sop', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ayam kampung', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Bebek', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Ceker Ayam', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Kepala Ayam', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Suwir Ayam', 'kg', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Bola-bola Ayam', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Rollade Ayam', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Usus Ayam', 'kg', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Tahu Bakso', 'pcs', 0, 'CEK', ''],
  ['Ayam & Unggas', 'Perkedel Ayam', 'pcs', 0, 'CEK', ''],
  ['Telur', 'Telur Puyuh mentah', 'kg', 0, 'CEK', ''],
  ['Telur', 'Telur Puyuh rebus', 'pcs', 0, 'CEK', ''],
  ['Telur', 'Telur Ayam mentah', 'pcs', 0, 'CEK', ''],
  ['Telur', 'Telur Ayam rebus', 'pcs', 0, 'CEK', ''],
  ['Telur', 'Telur Asin', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Ikan Mas mentah', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Ikan Mas goreng', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Ikan Nila mentah', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Ikan Nila goreng', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Ikan Kembung mentah', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Pindang Kereut', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Balakutak', 'kg', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Cumi Sotong', 'kg', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Kepala Kakap', 'kg', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Udang', 'kg', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Cumi Sotong Bersih', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Kakap bersih', 'pcs', 0, 'CEK', ''],
  ['Ikan & Seafood', 'Udang Bersih', 'kg', 0, 'CEK', ''],
  ['Ikan & Seafood', 'KERANG IJO', 'kg', 0, 'CEK', ''],
  ['Ikan Asin', 'Cumi', 'kg', 0, 'CEK', ''],
  ['Ikan Asin', 'Peda Buntung S', 'pcs', 0, 'CEK', ''],
  ['Ikan Asin', 'Peda Buntung Jumbo', 'pcs', 0, 'CEK', ''],
  ['Ikan Asin', 'Peda Merah', 'pcs', 0, 'CEK', ''],
  ['Ikan Asin', 'Sepat', 'pcs', 0, 'CEK', ''],
  ['Ikan Asin', 'Teri Pepes', 'kg', 0, 'CEK', ''],
  ['Ikan Asin', 'Teri Tumis', 'kg', 0, 'CEK', ''],
  ['Ikan Asin', 'Tulang Asin', 'pcs', 0, 'CEK', ''],
  ['Ikan Asin', 'Impun', 'kg', 0, 'CEK', ''],
  ['Ikan Asin', 'Asin gabus', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Salam', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Gudeg', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Daun Jeruk', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Daun Pisang', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bawang Daun', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Seledri', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Tomat merah', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Tomat hijau', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Jahe', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Cikur', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Laja', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Laja parud', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Koneng parud', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Sereh', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Asem', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Muncang mentah', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Muncang goreng', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Muncang giling', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Katuncar utuh', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Cabe garing mentah', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Cabe giling', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Cabe merah segar', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Cengek garing sambel', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bawang putih', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bawang putih giling', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bawang merah', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bawang merah giling', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bawang bombay', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Keriting merah', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Keriting ijo', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Rawit putih', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Rawit merah', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Rawit ijo', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bendot ijo', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Bendot merah', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Kara 65ml', 'pcs', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Kara 1 L', 'pcs', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Santan Cipati', 'kg', 0, 'CEK', ''],
  ['Bumbu & Sayur', 'Cabe ijo besar', 'kg', 0, 'CEK', ''],
  ['Daging', 'Babat Tamusu', 'pcs', 0, 'CEK', ''],
  ['Daging', 'Dorokdok', 'kg', 0, 'CEK', ''],
  ['Daging', 'Daging Kepala rebus', 'pcs', 0, 'CEK', ''],
  ['Daging', 'Gepuk', 'pcs', 0, 'CEK', ''],
  ['Daging', 'Gule', 'kg', 0, 'CEK', ''],
  ['Daging', 'Iga mentah', 'kg', 0, 'CEK', ''],
  ['Daging', 'Iga rebus', 'pcs', 0, 'CEK', ''],
  ['Buah', 'Mangga Kweni', 'kg', 0, 'CEK', ''],
  ['Buah', 'Mangga biasa', 'kg', 0, 'CEK', ''],
  ['Buah', 'Melon', 'kg', 0, 'CEK', ''],
  ['Buah', 'Buah naga', 'kg', 0, 'CEK', ''],
  ['Buah', 'Stroberi', 'kg', 0, 'CEK', ''],
  ['Buah', 'Sirsak', 'kg', 0, 'CEK', ''],
  ['Buah', 'Alpukat', 'kg', 0, 'CEK', ''],
  ['Buah', 'Jeruk', 'kg', 0, 'CEK', ''],
  ['Buah', 'Lemon', 'kg', 0, 'CEK', ''],
  ['Buah', 'Mangga Kweni Packed', 'pcs', 0, 'CEK', ''],
  ['Buah', 'Mangga biasa Packed', 'pcs', 0, 'CEK', ''],
  ['Buah', 'Melon Packed', 'pcs', 0, 'CEK', ''],
  ['Buah', 'Buah naga Packed', 'pcs', 0, 'CEK', ''],
  ['Buah', 'Stroberi Packed', 'pcs', 0, 'CEK', ''],
  ['Buah', 'Sirsak Packed', 'pcs', 0, 'CEK', ''],
  ['Minuman', 'Kapal api', 'pcs', 0, 'CEK', ''],
  ['Minuman', 'Good day', 'pcs', 0, 'CEK', ''],
  ['Minuman', 'Indocafe', 'pcs', 0, 'CEK', ''],
  ['Minuman', 'Luwak', 'pcs', 0, 'CEK', ''],
  ['Minuman', 'ABC', 'pcs', 0, 'CEK', ''],
  ['Minuman', 'Daun pandan', 'lembar', 0, 'CEK', ''],
  ['Minuman', 'Teh biasa', 'gram', 0, 'CEK', ''],
  ['Minuman', 'Teh biang', 'gram', 0, 'CEK', ''],
  ['Minuman', 'Gula pasir', 'gram', 0, 'CEK', ''],
  ['Minuman', 'Gula cair', 'gram', 0, 'CEK', ''],
  ['Minuman', 'Marjan stroberi', 'gram', 0, 'CEK', ''],
  ['Minuman', 'Marjan melon', 'gram', 0, 'CEK', ''],
  ['Minuman', 'Es Batu', 'pcs', 0, 'CEK', ''],
  ['Packaging', 'Sedotan Juice', 'pcs', 0, 'CEK', ''],
  ['Packaging', 'Cup ukuran 16', 'pcs', 0, 'CEK', ''],
  ['Packaging', 'Cup ukuran 14', 'pcs', 0, 'CEK', ''],
  ['Packaging', 'Cup ukuran 12', 'pcs', 0, 'CEK', ''],
  ['Packaging', 'Cup Kopi', 'pcs', 0, 'CEK', '']
];

var WA_OWNER  = '6285190022529';
var JAM_REKAP = 21;

var DOMPET_AWAL = [
  ['KAS_KASIR', 'Kas Kasir',              'SISA',   '2026-01-01', '',           1],
  ['KAS_TUNAI', 'Kas Tunai (brankas)',    'SISA',   '2026-01-01', '',           2],
  ['SETOR_IBU', 'Setor ke Ibu',           'KELUAR', '2026-01-01', '2026-07-30', 3],
  ['KAS_BRI',   'Setor ke Rekening BRI',  'KELUAR', '2026-07-31', '',           4],
  ['PRIVE',     'Prive Owner',            'KELUAR', '2026-01-01', '',           5]
];

var BATAS_SELISIH = 50000;

var MAKS_GAGAL = 8;
var LAMA_KUNCI = 5;
var AMBANG_KEMBAR = 15;

var FOLDER_BUKTI = 'Buku Toko - Bukti Tutup Shift';
var FOLDER_LOKA_INDUK = 'Loka Kasir';
var FOLDER_LOKA_JSON  = 'JSON';

var TARGET_LABA = { TSS: 20000000, CK: 0 };

var KOL_KELUAR = 13;
var KOL_TERIMA = 10;
var KOL_REKAP  = 10;

// BARU v2.1 — TUTUP_SHIFT bertambah 4 kolom di ujung kanan.
// Kolom lama 1..22 TIDAK dipindah, jadi data lama tetap terbaca benar.
//   23 Saldo Brankas Awal · 24 Tanggal Setor Fisik
//   25 Referensi Mutasi    · 26 Status Setoran
var KOL_SHIFT = 26;

// BARU v2.1 — Batas baris yang dibaca dari sheet append-only.
// Ini perbaikan penyebab utama aplikasi melambat: dulu setiap operasi
// membaca SELURUH sheet KELUAR dan TERIMA. Sheet itu hanya bertambah,
// jadi setiap bulan aplikasi makin lambat secara linear.
// Semua operasi cuma butuh data beberapa hari terakhir:
//   - ID Kirim dibuat dari tanggal hari ini
//   - Cek kembar hanya melihat 15 menit terakhir
//   - Konfirmasi terima paling lama menyusul besok pagi
// 2000 baris kira-kira 3 bulan pada volume sekarang.
var BATAS_BACA = 2000;

// BARU v2.1 — batas kebijakan kas (Runbook Kustodi Kas, berlaku 31 Jul 2026)
var BATAS_BRANKAS_MENGINAP = 2000000;   // di atas ini wajib setor hari itu
var BATAS_PENDAMPING       = 5000000;   // di atas ini jangan berangkat sendirian

// ====================== IDENTITAS & IZIN ======================

function _siapa(pin) {
  pin = String(pin || '').trim();
  if (!pin) throw new Error('PIN belum diisi.');

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
  if (!sh) throw new Error('Sheet ORANG belum ada. Jalankan Setup dulu.');
  var n = sh.getLastRow() - 1;
  if (n <= 0) throw new Error('Sheet ORANG masih kosong.');

  var lebar = Math.max(sh.getLastColumn(), 8);
  var data = sh.getRange(2, 1, n, lebar).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() !== pin) continue;
    if (String(data[i][4]).trim().toUpperCase() !== 'YA') {
      throw new Error('Akun ini sedang dinonaktifkan. Hubungi pemilik.');
    }
    var u = String(data[i][3]).trim();
    return {
      nama: String(data[i][0]).trim(),
      peran: String(data[i][2]).trim().toUpperCase(),
      unit: u,
      unitNama: UNIT_NAMA[u.toUpperCase()] || u,
      wa: String(data[i][5] || '').trim(),
      unitDilihat: String(data[i][6] || '').trim()
    };
  }
  throw new Error('PIN tidak dikenal.');
}

function _unitBoleh(o) {
  if (o.peran !== 'OWNER') return [];
  var s = (o.unitDilihat || o.unit || '').toUpperCase();
  return s.split(',').map(function (x) { return x.trim(); })
          .filter(function (x) { return x === 'TSS' || x === 'CK'; });
}

/**
 * Layar apa saja yang boleh dibuka tiap peran.
 *
 * PERBAIKAN v2.1: 'riwayat' dibuka untuk PENYIAP, PENGANTAR, dan PENERIMA.
 * Sebelumnya Teh Dede bisa menginput 14 barang tapi tidak punya layar
 * untuk memeriksa apa yang baru dia masukkan — tidak ada cara memverifikasi
 * pekerjaan sendiri. Isinya tetap dibatasi ke pekerjaan orang itu saja
 * (lihat riwayatHariIni), jadi ini bukan pelonggaran akses data.
 */
function _menuPeran(peran) {
  var M = {
    KASIR:     ['keluar', 'terima', 'shift', 'riwayat'],
    PENYIAP:   ['keluar', 'terima', 'riwayat'],
    PENGANTAR: ['terima', 'riwayat'],
    PENERIMA:  ['terima', 'riwayat'],
    OWNER:     ['keluar', 'terima', 'shift', 'riwayat', 'harga', 'kelola']
  };
  return M[String(peran || '').toUpperCase()] || [];
}

function _boleh(orang, layar) {
  if (layar === 'dashboard' || layar === 'dashTSS') {
    if (_unitBoleh(orang).indexOf('TSS') >= 0) return;
    throw new Error('Maaf, ' + orang.nama + ' tidak punya akses ke dashboard Toko.');
  }
  if (layar === 'dashCK') {
    if (_unitBoleh(orang).indexOf('CK') >= 0) return;
    throw new Error('Maaf, ' + orang.nama + ' tidak punya akses ke Central Kitchen.');
  }
  if (_menuPeran(orang.peran).indexOf(layar) < 0) {
    throw new Error('Maaf, ' + orang.nama + ' tidak punya akses ke bagian ini. ' +
                    'Peran Anda: ' + orang.peran + '.');
  }
}

function _samarkanPin(p) {
  p = String(p || '');
  if (p.length <= 2) return '**';
  var bintang = '';
  for (var i = 1; i < p.length; i++) bintang += '*';
  return p.charAt(0) + bintang;
}

function _cekKunciPin() {
  var c = CacheService.getScriptCache();
  if (c.get('KUNCI_PIN')) {
    throw new Error('Terlalu banyak PIN salah berturut-turut. ' +
                    'Tunggu ' + LAMA_KUNCI + ' menit, lalu coba lagi.');
  }
}

function _catatPinSalah(pin) {
  var c = CacheService.getScriptCache();
  var n = Number(c.get('GAGAL_PIN') || 0) + 1;
  c.put('GAGAL_PIN', String(n), 600);
  if (n >= MAKS_GAGAL) {
    c.put('KUNCI_PIN', '1', LAMA_KUNCI * 60);
    c.remove('GAGAL_PIN');
  }
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG_AKSES');
    if (sh) {
      sh.appendRow([new Date(), _tglString(new Date()), '(tidak dikenal)', '-',
                    'PIN SALAH', 'percobaan ke-' + n + ' · ' + _samarkanPin(pin) +
                    (n >= MAKS_GAGAL ? ' · LOGIN DIKUNCI ' + LAMA_KUNCI + ' MENIT' : '')]);
    }
  } catch (e) { /* log gagal tidak boleh membocorkan error ke pengguna */ }
}

function masuk(pin) {
  _cekKunciPin();
  var o;
  try {
    o = _siapa(pin);
  } catch (e) {
    if (String(e.message).indexOf('PIN tidak dikenal') >= 0) _catatPinSalah(pin);
    throw e;
  }
  CacheService.getScriptCache().remove('GAGAL_PIN');

  _catatAkses(o, 'MASUK');
  var unit = _unitBoleh(o);
  var menu = unit.map(function (u) { return 'dash' + u; })
                 .concat(_menuPeran(o.peran));
  return {
    nama: o.nama, peran: o.peran, unit: o.unit,
    unitNama: o.unitNama, unitDilihat: unit,
    menu: menu, sapaan: _sapaan(), versi: VERSI
  };
}

function _sapaan() {
  var j = Number(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'H'));
  if (j < 11) return 'Selamat pagi';
  if (j < 15) return 'Selamat siang';
  if (j < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function _catatAkses(orang, aksi, ket) {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG_AKSES');
    if (sh) sh.appendRow([new Date(), _tglString(new Date()),
                          orang.nama, orang.peran, aksi, ket || '']);
  } catch (e) { /* jangan sampai log menggagalkan pekerjaan utama */ }
}

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

function _sheet(ss, nama) {
  var sh = ss.getSheetByName(nama);
  if (!sh) sh = ss.insertSheet(nama);
  return sh;
}

function _headerStyle(sh, nCol) {
  sh.getRange(1, 1, 1, nCol).setFontWeight('bold')
    .setBackground('#4F6042').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
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

/**
 * Baca sheet master jadi daftar barang.
 * v2.1: ditambah hargaTeks (sudah diformat "387.500") supaya tampilan tidak
 * perlu memformat sendiri, dan angka tidak lagi tampil mentah "387500".
 */
function _bacaMaster(nama) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nama);
  if (!sh) return [];
  var n = Math.max(sh.getLastRow() - 1, 0);
  if (!n) return [];
  return sh.getRange(2, 1, n, 6).getValues()
    .filter(function (r) { return r[1]; })
    .map(function (r) {
      var h = Number(r[3]) || 0;
      return { kat: String(r[0] || 'Lain'), nama: String(r[1]), satuan: String(r[2] || ''),
               harga: h, hargaTeks: _angkaTeks(h), hargaRp: _rp(h),
               src: String(r[4] || ''), tag: String(r[5] || '') };
    });
}

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

// ====================== ID KIRIM ======================

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

// ====================== BARANG KELUAR ======================

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

// ====================== KONFIRMASI TERIMA ======================

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

// ====================== RIWAYAT HARI INI ======================

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

// ====================== UBAH HARGA ======================

/**
 * Ubah harga barang.
 *
 * PERBAIKAN v2.1: sekarang bisa untuk MASTER (toko) DAN MASTER_CK (dapur).
 * Sebelumnya nama sheet di-hardcode 'MASTER', sehingga harga barang Dapur
 * tidak bisa diubah dari aplikasi sama sekali — padahal 130 item CK memang
 * belum punya harga dan harus diisi.
 *
 * @param {Object} payload  { sheet: 'MASTER'|'MASTER_CK', perubahan: [...], catatan }
 */
function simpanHarga(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'harga');

  var namaSheet = (payload && payload.sheet === 'MASTER_CK') ? 'MASTER_CK' : 'MASTER';

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var master = ss.getSheetByName(namaSheet);
    if (!master) throw new Error('Sheet ' + namaSheet + ' tidak ada.');
    var hlog = ss.getSheetByName('HARGA_LOG');
    var n = master.getLastRow() - 1;
    if (n <= 0) throw new Error('Sheet ' + namaSheet + ' kosong.');

    var data = master.getRange(2, 1, n, 6).getValues();
    var now = new Date();
    var rows = [], ringkas = [];

    (payload.perubahan || []).forEach(function (p) {
      var baru = Number(String(p.hargaBaru).replace(/[^0-9]/g, ''));
      if (!(baru > 0)) return;
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][1]).trim() !== String(p.nama).trim()) continue;
        var lama = Number(data[i][3]) || 0;
        if (lama === baru) return;
        master.getRange(i + 2, 4).setValue(baru);
        // Barang CK yang tadinya bertanda CEK jadi CK begitu harganya terisi.
        if (namaSheet === 'MASTER_CK' && baru > 0) {
          master.getRange(i + 2, 5).setValue('CK');
          master.getRange(i + 2, 1, 1, 6).setBackground(null);
        }
        var pct = lama ? (baru - lama) / lama : 0;
        rows.push([now, _tglString(now), data[i][1], lama, baru, baru - lama,
                   pct, o.nama, (namaSheet === 'MASTER_CK' ? '[Dapur] ' : '') +
                   (payload.catatan || '')]);
        ringkas.push({ nama: data[i][1], lama: lama, baru: baru, pct: pct * 100,
                       lamaRp: _rp(lama), baruRp: _rp(baru) });
        return;
      }
    });

    if (!rows.length) throw new Error('Tidak ada harga yang berubah.');

    var mulai = hlog.getLastRow() + 1;
    hlog.getRange(mulai, 1, rows.length, 9).setValues(rows);
    for (var k = 0; k < rows.length; k++) {
      if (Math.abs(rows[k][6]) > 0.15) {
        hlog.getRange(mulai + k, 1, 1, 9).setBackground('#FBEAE6');
      }
    }
    _catatAkses(o, 'UBAH HARGA', namaSheet + ' · ' + rows.length + ' barang');
    _kabarHarga(ringkas, o.nama, payload.catatan, namaSheet);
    return { ok: true, berubah: rows.length, ringkas: ringkas, sheet: namaSheet };
  } finally { lock.releaseLock(); }
}

function _kabarHarga(ringkas, oleh, catatan, namaSheet) {
  var t = ['*Perubahan Harga — ' + _tglString(new Date()) + '*',
           'Daftar: ' + (namaSheet === 'MASTER_CK' ? 'Barang Dapur' : 'Barang Toko'),
           'Diubah oleh: ' + oleh, ''];
  ringkas.forEach(function (r) {
    t.push('• ' + r.nama + ': ' + _rp(r.lama) + ' -> ' + _rp(r.baru) +
           ' (' + (r.pct >= 0 ? '+' : '') + r.pct.toFixed(1) + '%)');
  });
  if (catatan) t.push('', 'Catatan: ' + catatan);
  var ekstrem = ringkas.filter(function (r) { return Math.abs(r.pct) > 15; });
  if (ekstrem.length) {
    t.push('', 'PERIKSA: ' + ekstrem.length +
              ' perubahan lebih dari 15% — pastikan bukan salah ketik.');
  }
  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: (ekstrem.length ? '[PERIKSA] ' : '') + 'Perubahan harga oleh ' + oleh,
      body: t.join('\n')
    });
  } catch (e) { /* email gagal tidak membatalkan perubahan harga */ }
}

// ====================== KELOLA: TAMBAH BARANG & ORANG ======================

/**
 * BARU v2.1 — Tambah barang dari aplikasi, tanpa membuka spreadsheet.
 * Barang baru diberi tag TAMBAHAN supaya tidak terhapus saat
 * "Perbaiki daftar barang" dijalankan.
 */
function tambahBarang(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'kelola');

  var namaSheet = (payload && payload.sheet === 'MASTER_CK') ? 'MASTER_CK' : 'MASTER';
  var nama = String((payload && payload.nama) || '').trim();
  var kat = String((payload && payload.kategori) || '').trim() || 'Tambahan';
  var satuan = String((payload && payload.satuan) || '').trim();
  var harga = Number(String((payload && payload.harga) || '0').replace(/[^0-9]/g, '')) || 0;

  if (!nama) throw new Error('Nama barang belum diisi.');
  if (!satuan) throw new Error('Satuan belum diisi (kg / karung / pcs / dus / ball).');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(namaSheet);
    if (!sh) throw new Error('Sheet ' + namaSheet + ' tidak ada.');

    var n = sh.getLastRow() - 1;
    if (n > 0) {
      var ada = sh.getRange(2, 2, n, 1).getValues();
      for (var i = 0; i < ada.length; i++) {
        if (String(ada[i][0]).trim().toLowerCase() === nama.toLowerCase()) {
          throw new Error('Barang "' + nama + '" sudah ada di daftar. ' +
                          'Kalau mau ubah harganya, pakai menu Ubah Harga.');
        }
      }
    }

    var sumber = harga > 0 ? (namaSheet === 'MASTER_CK' ? 'CK' : 'MANUAL') : 'CEK';
    sh.appendRow([kat, nama, satuan, harga, sumber, 'TAMBAHAN']);
    var barisBaru = sh.getLastRow();
    sh.getRange(barisBaru, 4).setNumberFormat('#,##0');
    sh.getRange(barisBaru, 1, 1, 6).setBackground(harga > 0 ? '#E7F0FA' : '#FFF3CD');

    _catatAkses(o, 'TAMBAH BARANG',
      namaSheet + ' · ' + nama + ' · ' + satuan + ' · ' + _rp(harga));

    return { ok: true, nama: nama, satuan: satuan, harga: harga,
             hargaRp: _rp(harga), sheet: namaSheet,
             pesan: 'Barang "' + nama + '" ditambahkan.' +
                    (harga > 0 ? '' : ' Harganya masih 0 — isi lewat Ubah Harga.') };
  } finally { lock.releaseLock(); }
}

/**
 * BARU v2.1 — Tambah orang/penerima dari aplikasi.
 * PIN dibuat otomatis 4 angka yang belum dipakai, supaya tidak ada
 * PIN kembar yang bikin dua orang tertukar identitasnya.
 */
function tambahOrang(pin, payload) {
  var o = _siapa(pin);
  _boleh(o, 'kelola');

  var nama = String((payload && payload.nama) || '').trim();
  var peran = String((payload && payload.peran) || '').trim().toUpperCase();
  var unit = String((payload && payload.unit) || '-').trim();
  var wa = _wa((payload && payload.wa) || '');
  var catatan = String((payload && payload.catatan) || '').trim();

  var peranBoleh = ['KASIR', 'PENYIAP', 'PENGANTAR', 'PENERIMA', 'OWNER'];
  if (!nama) throw new Error('Nama belum diisi.');
  if (peranBoleh.indexOf(peran) < 0) {
    throw new Error('Peran harus salah satu dari: ' + peranBoleh.join(', ') + '.');
  }
  if (peran === 'OWNER' && o.peran !== 'OWNER') {
    throw new Error('Hanya pemilik yang boleh menambahkan pemilik baru.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
    if (!sh) throw new Error('Sheet ORANG tidak ada. Jalankan Setup dulu.');

    var n = sh.getLastRow() - 1;
    var pinDipakai = {};
    if (n > 0) {
      var d = sh.getRange(2, 1, n, 2).getValues();
      for (var i = 0; i < d.length; i++) {
        if (String(d[i][0]).trim().toLowerCase() === nama.toLowerCase()) {
          throw new Error('Nama "' + nama + '" sudah ada di daftar orang.');
        }
        pinDipakai[String(d[i][1]).trim()] = true;
      }
    }

    var pinBaru = '';
    for (var coba = 0; coba < 500; coba++) {
      var kandidat = String(Math.floor(1000 + Math.random() * 9000));
      if (!pinDipakai[kandidat]) { pinBaru = kandidat; break; }
    }
    if (!pinBaru) throw new Error('Gagal membuat PIN unik. Coba lagi.');

    sh.appendRow([nama, pinBaru, peran, unit, 'YA', wa, '', catatan]);
    var baris = sh.getLastRow();
    sh.getRange(baris, 2).setNumberFormat('@').setValue(pinBaru);
    sh.getRange(baris, 6).setNumberFormat('@').setValue(wa);
    sh.getRange(baris, 1, 1, 8).setBackground('#E7F0FA');

    _catatAkses(o, 'TAMBAH ORANG', nama + ' · ' + peran + ' · ' + unit);

    return { ok: true, nama: nama, peran: peran, pin: pinBaru,
             pesan: 'Orang baru ditambahkan. PIN untuk ' + nama + ': ' + pinBaru +
                    '. Sampaikan langsung ke orangnya, jangan lewat grup.' };
  } finally { lock.releaseLock(); }
}

/**
 * BARU v2.1 — Nonaktifkan orang (tidak dihapus, supaya riwayatnya tetap utuh).
 */
function nonaktifkanOrang(pin, nama) {
  var o = _siapa(pin);
  _boleh(o, 'kelola');
  var target = String(nama || '').trim();
  if (!target) throw new Error('Nama belum dipilih.');
  if (target.toLowerCase() === o.nama.toLowerCase()) {
    throw new Error('Tidak bisa menonaktifkan akun sendiri.');
  }

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
  var n = sh.getLastRow() - 1;
  if (n <= 0) throw new Error('Sheet ORANG kosong.');
  var d = sh.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < d.length; i++) {
    if (String(d[i][0]).trim().toLowerCase() !== target.toLowerCase()) continue;
    sh.getRange(i + 2, 5).setValue('TIDAK');
    sh.getRange(i + 2, 1, 1, 8).setBackground('#F2F2F2');
    _catatAkses(o, 'NONAKTIFKAN ORANG', target);
    return { ok: true, nama: target,
             pesan: target + ' dinonaktifkan. Riwayatnya tetap tersimpan.' };
  }
  throw new Error('Nama "' + target + '" tidak ditemukan.');
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

// ====================== PO MALAM SEDERHANA JAYA 4 ======================

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

// ====================== DASHBOARD OWNER ======================

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

// ====================== CENTRAL KITCHEN ======================

var ID_BUKU_SJ4 = '1B4tl4sLl-uRPT_m3S3MYFlEfaOkEYBgrR0lAgaU4UxA';

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

/** BARU v2.1 — berapa item MASTER_CK yang sudah punya harga. */
function _statusHargaCK() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('MASTER_CK');
  if (!sh) return { terisi: 0, total: 0 };
  var n = sh.getLastRow() - 1;
  if (n <= 0) return { terisi: 0, total: 0 };
  var d = sh.getRange(2, 4, n, 1).getValues();
  var terisi = 0;
  d.forEach(function (r) { if (Number(r[0]) > 0) terisi++; });
  return { terisi: terisi, total: n };
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

// ====================== TUTUP SHIFT ======================

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

// ====================== MASTER ======================

function perbaikiMasterCKMenu() {
  var h = perbaikiMasterCK();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    h.total + ' barang Dapur siap. ' + h.adaHarga + ' sudah punya harga, ' +
    (h.total - h.adaHarga) + ' masih perlu diisi (baris kuning). ' +
    (h.tambahan ? h.tambahan + ' barang tambahan Anda dipertahankan.' : ''),
    'MASTER_CK', 10);
}

function perbaikiMasterMenu() {
  var h = perbaikiMaster();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    h.total + ' barang rapi. ' + h.hargaDipakai + ' harga Anda dipertahankan. ' +
    (h.tambahan ? h.tambahan + ' barang tambahan Anda dipertahankan.' : ''),
    'MASTER diperbaiki', 8);
}

function _perbaikiMasterUmum(namaSheet, bawaan, sumberDefault) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = _sheet(ss, namaSheet);

  var lama = {}, urutTambahan = [], adaDiBawaan = {};
  bawaan.forEach(function (m) { adaDiBawaan[String(m[1]).trim()] = true; });

  var n = sh.getLastRow() - 1;
  if (n > 0) {
    sh.getRange(2, 1, n, 6).getValues().forEach(function (r) {
      var nama = String(r[1] || '').trim();
      if (!nama) return;
      lama[nama] = r;
      if (!adaDiBawaan[nama]) urutTambahan.push(nama);
    });
  }

  var dipakai = 0;
  var rows = bawaan.map(function (m) {
    var r = lama[String(m[1]).trim()];
    var h = r ? (Number(r[3]) || 0) : 0;
    if (h > 0 && h !== m[3]) dipakai++;
    var harga = h > 0 ? h : m[3];
    var sumber = (sumberDefault === 'CK') ? (harga > 0 ? 'CK' : 'CEK') : m[4];
    return [m[0], m[1], m[2], harga, sumber, m[5]];
  });

  urutTambahan.forEach(function (nama) {
    var r = lama[nama];
    rows.push([r[0] || 'Tambahan', r[1], r[2] || '', Number(r[3]) || 0,
               r[4] || 'MANUAL', r[5] || 'TAMBAHAN']);
  });

  sh.clear();
  sh.getRange(1, 1, 1, 6).setValues(
    [['Kategori', 'Nama Barang', 'Satuan', 'Harga', 'Sumber Harga', 'Tag']]);
  sh.getRange(2, 1, rows.length, 6).setValues(rows);
  _headerStyle(sh, 6);
  sh.getRange(2, 4, rows.length, 1).setNumberFormat('#,##0');
  sh.autoResizeColumns(1, 6);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][5] === 'TAMBAHAN') sh.getRange(i + 2, 1, 1, 6).setBackground('#E7F0FA');
    else if (rows[i][5] === 'BARU') sh.getRange(i + 2, 1, 1, 6).setBackground('#FDF0D5');
    if (!Number(rows[i][3])) sh.getRange(i + 2, 1, 1, 6).setBackground('#FFF3CD');
  }

  return { total: rows.length, hargaDipakai: dipakai,
           tambahan: urutTambahan.length,
           adaHarga: rows.filter(function (r) { return Number(r[3]) > 0; }).length };
}

function perbaikiMaster()   { return _perbaikiMasterUmum('MASTER', MASTER_ITEM, 'SJ'); }
function perbaikiMasterCK() { return _perbaikiMasterUmum('MASTER_CK', MASTER_CK, 'CK'); }

// ====================== REKAP HARIAN ======================

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

// ====================== MIGRASI ID KIRIM ======================

/**
 * Baris KELUAR dengan ID berformat lama (mengandung SEDERH) yang tidak bisa
 * dibedakan antar cabang. Fungsi uji coba hanya MELAPORKAN, tidak mengubah.
 */
function migrasiIdKirimUjiCoba() { return _migrasiIdKirim(false); }
function migrasiIdKirimJalankan() { return _migrasiIdKirim(true); }

function _migrasiIdKirim(jalankan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('KELUAR');
  if (!sh || sh.getLastRow() < 2) {
    ss.toast('Sheet KELUAR kosong.', 'Migrasi ID', 8);
    return { total: 0 };
  }

  var n = sh.getLastRow() - 1;
  var data = sh.getRange(2, 1, n, KOL_KELUAR).getValues();
  var ubah = [];

  for (var i = 0; i < data.length; i++) {
    var idLama = String(data[i][11] || '').trim();
    if (!idLama || idLama.indexOf('SEDERH') < 0) continue;
    var tujuan = String(data[i][2] || '').trim();
    var kode = _kodeTujuan(tujuan);
    if (!kode || kode === 'SEDERH') continue;
    var tgl = _tglString(data[i][1]).replace(/-/g, '');
    var unit = String(data[i][12] || 'TSS');
    var idBaru = tgl + '-' + unit + '-' + kode + '-R' + data[i][3];
    if (idBaru === idLama) continue;
    ubah.push({ baris: i + 2, lama: idLama, baru: idBaru, tujuan: tujuan });
  }

  if (!ubah.length) {
    ss.toast('Tidak ada ID lama yang perlu diperbaiki.', 'Migrasi ID', 8);
    return { total: 0, ubah: [] };
  }

  if (!jalankan) {
    var contoh = ubah.slice(0, 5).map(function (u) {
      return u.lama + ' -> ' + u.baru + ' (' + u.tujuan + ')';
    }).join('\n');
    ss.toast(ubah.length + ' baris akan diubah. Contoh:\n' + contoh +
             '\n\nJalankan "Perbaiki ID Kirim lama (JALANKAN)" kalau sudah benar.',
             'Uji coba migrasi', 20);
    return { total: ubah.length, ubah: ubah };
  }

  // Ubah KELUAR
  ubah.forEach(function (u) { sh.getRange(u.baris, 12).setValue(u.baru); });

  // Ubah TERIMA yang menempel ke ID lama
  var petaId = {};
  ubah.forEach(function (u) { petaId[u.lama] = u.baru; });
  var shT = ss.getSheetByName('TERIMA');
  var ubahT = 0;
  if (shT && shT.getLastRow() > 1) {
    var nT = shT.getLastRow() - 1;
    var idsT = shT.getRange(2, 3, nT, 1).getValues();
    for (var j = 0; j < idsT.length; j++) {
      var v = String(idsT[j][0] || '').trim();
      if (petaId[v]) { shT.getRange(j + 2, 3).setValue(petaId[v]); ubahT++; }
    }
  }

  _buangCacheTerima();
  ss.toast(ubah.length + ' baris KELUAR dan ' + ubahT +
           ' baris TERIMA diperbaiki. Jalankan "Rekap sekarang" untuk ' +
           'memperbarui angka rekap.', 'Migrasi ID selesai', 15);
  return { total: ubah.length, terima: ubahT, ubah: ubah };
}

// ====================== BANTUAN ======================

function _bacaHari(sh, nCol, hari) {
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var lebar = Math.max(sh.getLastColumn(), nCol);
  var mulai = Math.max(2, lastRow - BATAS_BACA + 1);
  var jumlah = lastRow - mulai + 1;
  return sh.getRange(mulai, 1, jumlah, lebar).getValues()
    .filter(function (r) { return _tglString(r[1]) === hari; });
}

function _tglString(d) {
  if (!(d instanceof Date)) {
    if (d === '' || d === null || d === undefined) return '';
    d = new Date(d);
    if (isNaN(d.getTime())) return '';
  }
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** Angka dengan titik ribuan, tanpa "Rp". Contoh: 387.500 */
function _angkaTeks(n) {
  return Number(n || 0).toLocaleString('id-ID');
}

/** Angka dengan Rp dan titik ribuan. Contoh: Rp387.500 */
function _rp(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }

function _wa(no) {
  var s = String(no || '').replace(/[^0-9]/g, '');
  if (!s) return '';
  if (s.indexOf('0') === 0) s = '62' + s.slice(1);
  if (s.indexOf('62') !== 0) s = '62' + s;
  return s.length >= 11 ? s : '';
}

function _nomorOrang(daftarNama) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ORANG');
  var n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  var lebar = Math.max(sh.getLastColumn(), 6);
  var d = sh.getRange(2, 1, n, lebar).getValues();
  var out = [];
  daftarNama.forEach(function (nm) {
    for (var i = 0; i < d.length; i++) {
      if (String(d[i][0]).trim().toLowerCase() !== nm.toLowerCase()) continue;
      out.push({ nama: String(d[i][0]).trim(), wa: _wa(d[i][5]) });
      return;
    }
    out.push({ nama: nm, wa: '' });
  });
  return out;
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
