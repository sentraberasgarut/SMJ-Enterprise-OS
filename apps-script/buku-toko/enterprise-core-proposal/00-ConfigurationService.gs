// ============================================================================
// Configuration Service — Enterprise Core (proposal, not deployed)
// ============================================================================
// Every top-level constant from the live Code.gs, moved verbatim, unchanged.
// Apps Script shares one global scope across all files in a project — every
// other service file reads these exactly as they do today.
// ============================================================================

var NAMA_APP    = 'Buku Toko Sembako & Central Kitchen';
var NAMA_PENDEK = 'BUKU TOKO';
var VERSI       = '2.1';

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

var BATAS_SELISIH = 30000;

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

// Dipakai oleh Communication Service (PO malam)
var BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Dipakai oleh Reporting Service (dashboard Central Kitchen)
var ID_BUKU_SJ4 = '1B4tl4sLl-uRPT_m3S3MYFlEfaOkEYBgrR0lAgaU4UxA';
