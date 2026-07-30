# Patch 01 — Performa & Dashboard

**Tanggal:** 30 Juli 2026
**Cara pakai:** ganti fungsi satu per satu di `Code.gs`. Setiap blok menyebut nama fungsi yang diganti. Uji setelah setiap blok, jangan sekaligus.

> ⚠️ **Semua kode di sini belum saya jalankan.** Tidak ada cara menjalankan Apps Script dari sisi saya. Uji di editor sebelum deploy.

---

## Kenapa aplikasi lambat — akar masalahnya ketemu

Bukan koneksi, bukan HP. Ini di kode:

| Fungsi | Yang dibaca | Dipanggil dari |
| --- | --- | --- |
| `_petaTerima()` | **SELURUH sheet TERIMA** | `_daftarKirimHariIni`, `ambilRincianKirim`, `simpanTerima`, `riwayatHariIni`, `dashboard` |
| `_semuaKeluar()` | **SELURUH sheet KELUAR** | `simpanKeluar` (2×), `_cariKiriman` |
| `_cariKiriman()` | `_semuaKeluar()` lagi | `ambilRincianKirim`, `simpanTerima` |
| `dashboard()` | TUTUP_SHIFT penuh 22 kolom + KELUAR penuh + TERIMA penuh | setiap buka dashboard |

Kedua sheet itu **append-only**. Sekarang ~70 baris setelah 4 hari. Sebulan ~500. Setahun ~6000.

**Satu kali buka layar Konfirmasi Terima hari ini = 2 kali baca seluruh KELUAR + 2 kali baca seluruh TERIMA.** Setiap operasi melambat linear seiring data bertambah. Dalam setahun aplikasi ini tidak akan bisa dipakai.

Ini bukan cacat desain awal — ini konsekuensi wajar dari sheet yang tumbuh. Tapi harus dibetulkan sekarang, bukan nanti.

---

## Patch 1A — Batasi pembacaan sheet

**Tambahkan konstanta ini** di blok KONFIGURASI (dekat `KOL_KELUAR`):

```javascript
// Batas baris yang dibaca dari sheet append-only.
// Semua operasi hanya butuh data beberapa hari terakhir:
//   - ID Kirim dibuat dari tanggal hari ini
//   - Cek kembar hanya melihat 15 menit terakhir
//   - Konfirmasi terima paling lama menyusul besok pagi
// 2000 baris ~ 3 bulan pada volume sekarang. Lebih dari cukup.
var BATAS_BACA = 2000;
```

**GANTI fungsi `_semuaKeluar()`:**

```javascript
/**
 * Baca sheet KELUAR, DIBATASI ke baris terbaru.
 * Dulu membaca seluruh sheet - itu penyebab utama aplikasi melambat.
 */
function _semuaKeluar() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('KELUAR');
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  var n = lastRow - 1;
  if (n <= 0) return [];

  var mulai = Math.max(2, lastRow - BATAS_BACA + 1);
  var jumlah = lastRow - mulai + 1;
  return sh.getRange(mulai, 1, jumlah, KOL_KELUAR).getValues();
}
```

**GANTI fungsi `_petaTerima()`:**

```javascript
/**
 * ID Kirim yang sudah pernah dikonfirmasi terima.
 * Dua perbaikan: pembacaan dibatasi, dan hasilnya di-cache 5 menit.
 * Cache dibuang setiap kali ada konfirmasi baru (_buangCacheTerima).
 */
function _petaTerima() {
  var c = CacheService.getScriptCache();
  var simpan = c.get('PETA_TERIMA');
  if (simpan) {
    var peta = {};
    simpan.split('\n').forEach(function (id) { if (id) peta[id] = true; });
    return peta;
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

  // Cache dibatasi 90 KB (batas Notion... maksud saya batas CacheService 100 KB).
  try {
    var teks = Object.keys(hasil).join('\n');
    if (teks.length < 90000) c.put('PETA_TERIMA', teks, 300);
  } catch (e) { /* cache gagal tidak boleh menggagalkan pekerjaan */ }

  return hasil;
}

/** Buang cache setelah ada konfirmasi terima baru. */
function _buangCacheTerima() {
  try { CacheService.getScriptCache().remove('PETA_TERIMA'); } catch (e) {}
}
```

**Di `simpanTerima()`**, tambahkan **satu baris** tepat setelah baris `sh.getRange(...).setValues(rows);`:

```javascript
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, KOL_TERIMA).setValues(rows);
    _buangCacheTerima();          // <-- TAMBAHKAN BARIS INI
```

**Di `_hapusTerima()`**, tambahkan sebelum `return hapus.length;`:

```javascript
  _buangCacheTerima();            // <-- TAMBAHKAN BARIS INI
  return hapus.length;
```

**GANTI fungsi `_cariKiriman()`** — supaya berhenti begitu ketemu, tidak memindai sisanya:

```javascript
function _cariKiriman(idKirim) {
  var id = String(idKirim || '').trim();
  var hasil = { ada: false, id: id, tujuan: '', unit: 'TSS', rit: '',
                penyiap: '', tanggal: '', baris: [] };
  if (!id) return hasil;

  var data = _semuaKeluar();
  // Dipindai dari belakang - kiriman yang dicari hampir selalu yang terbaru.
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
```

**Di `simpanKeluar()`**, `_semuaKeluar()` dipanggil sekali lalu dipakai dua kali — itu sudah benar, tidak perlu diubah. Yang berubah cuma isinya jadi terbatas.

**Perkiraan dampak:** operasi yang sekarang membaca 70 baris akan tetap cepat, tapi yang penting: **tidak akan melambat lagi seiring data bertambah.** Plus `_petaTerima` yang tadinya dipanggil 5× per request sekarang cuma sekali baca sheet per 5 menit.

---

## Patch 1B — Upload foto dalam satu panggilan

`simpanFotoShift` dipanggil **terpisah untuk setiap foto**. Empat foto = empat round-trip, masing-masing mengirim base64 dan menulis ke Drive. Di koneksi lambat inilah yang paling sering gagal di tengah jalan.

**TAMBAHKAN fungsi baru** (jangan hapus yang lama — Index.html masih memakainya):

```javascript
/**
 * Simpan beberapa foto sekaligus dalam satu panggilan.
 * Foto yang gagal tidak membatalkan yang lain - hasilnya dilaporkan per foto,
 * jadi kasir tahu mana yang perlu diulang tanpa mengulang semuanya.
 *
 * @param {Object} fotoObj  { struk: dataUrl, kaskasir: dataUrl, ... }
 * @return {Object} { url: {label:url}, gagal: [{label, alasan}] }
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

  return { url: url, gagal: gagal };
}
```

> Ini butuh perubahan kecil di `Index.html` supaya keempat foto dikirim sekali. Saya **belum membaca `Index.html`**, jadi saya tidak menulis perubahannya — kirim file itu kalau mau saya sekalian betulkan.

---

## Patch 1C — Dashboard menyesatkan: laba kotor dilabeli laba bersih

Ini yang paling penting dari seluruh patch.

Di `dashboard()`:

```javascript
var labaBulan = loka.ada ? loka.bulanIni.laba : 0;
...
target: { nilai: target, tercapai: labaBulan, ... }
```

`loka.bulanIni.laba` berasal dari `_olahLoka` yang menjumlahkan `i.profit` per invoice — itu **laba kotor** (harga jual − HPP). Tidak mengurangi gaji, sewa, listrik, transport, susut.

Sementara sheet `TARGET` bernama **"Target Laba / Bulan"** Rp20.000.000, dan Anda memahaminya sebagai laba **bersih**.

**Akibatnya:** Juli 2026 laba kotor Rp14,5 juta → dashboard menampilkan "tercapai 73% dari target". Kenyataannya laba **bersih** Juli **MINUS Rp1,4 juta**. Dashboard memberi tahu Anda hampir mencapai target padahal sedang rugi.

**Ini bukan angka yang salah hitung — ini angka benar yang salah label.** Dan itu lebih berbahaya, karena terlihat kredibel.

**GANTI blok `target:` di dalam `dashboard()`:**

```javascript
    target: (function () {
      var m = loka.ada ? (loka.margin / 100) : 0;
      var omzetProyeksi = loka.ada ? loka.proyeksiOmzetBulan : 0;
      var labaKotorProyeksi = loka.ada ? loka.proyeksiLabaBulan : 0;
      return {
        nilai: target,
        // DIUBAH: dinamai jujur sebagai laba KOTOR, bukan "tercapai"
        labaKotorBulan: labaBulan,
        labaKotorProyeksi: labaKotorProyeksi,
        // Beban operasional belum tercatat di mana pun. Selama nol,
        // laba bersih TIDAK BISA dihitung - jangan ditampilkan sebagai angka.
        bebanTercatat: _bebanBulan(bulan),
        labaBersihBisaDihitung: _bebanBulan(bulan) > 0,
        sisaHari: sisaHari,
        omzetPerlu: m > 0 ? target / m : 0,
        omzetTambah: m > 0 ? Math.max(target / m - omzetProyeksi, 0) : 0,
        marginPerlu: omzetProyeksi > 0 ? (target / omzetProyeksi * 100) : 0,
        marginSekarang: loka.ada ? loka.margin : 0
      };
    })(),
```

**TAMBAHKAN fungsi pendukung:**

```javascript
/**
 * Total beban operasional bulan ini dari sheet BEBAN.
 * Mengembalikan 0 kalau sheet belum ada - dan 0 berarti
 * "belum tercatat", BUKAN "tidak ada beban".
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
```

**TAMBAHKAN peringatan di array `tindak`** (sisipkan sebelum `var target = _targetUnit(o.unit);`):

```javascript
  if (_bebanBulan(bulan) === 0) {
    tindak.push({ jenis: 'bad', teks:
      'Beban operasional bulan ini belum tercatat sama sekali. ' +
      'Angka laba di dashboard ini LABA KOTOR, bukan laba bersih. ' +
      'Juli 2026: laba kotor Rp14,5 jt tapi laba bersih MINUS Rp1,4 jt.' });
  }
```

Dan di `Index.html`, label yang sekarang berbunyi "Tercapai" harus diubah jadi **"Laba kotor"**. Itu satu kata yang mencegah keputusan harga diambil di atas angka yang salah.

---

## Konfirmasi: bug `kasAwal` — ini menutup pertanyaan Rp5,8 juta

Di `dataShift()`:

```javascript
if (t < hari && !tglAwal) {
  kasAwal = Number(data[i][5]) || 0;   // index 5 = Kas Kasir SAJA
  tglAwal = t;
}
```

Di `simpanTutupShift()`:

```javascript
var seharusnya = kasAwal + jual - keluar - keluarDompet;
var selisih = sisa - seharusnya;   // sisa = KAS_KASIR + KAS_TUNAI
```

**`sisa` menghitung brankas. `kasAwal` tidak.** Asimetris.

Artinya `Kas Tunai` memang **saldo** brankas, dan **Rp5.805.000 itu nyata serta belum terjelaskan** — bukan ambiguitas tafsir seperti dugaan saya sebelumnya.

Perbaikannya menyentuh integritas keuangan, jadi **tidak saya tulis di patch ini.** Urutannya wajib: hitung uang fisik di brankas dulu → tetapkan titik nol → baru sambungkan rantai saldo. Menyambungkan rantai di atas titik nol yang salah hanya melipatgandakan angka yang salah. Itu Patch 02.

---

## Yang perlu Anda putuskan sebelum Patch 02

**Apakah `Kas Tunai` yang diisi Ayu selama ini = saldo brankas (semua uang di brankas), atau = uang yang dipindahkan ke brankas hari itu?**

Jawaban ini menentukan apakah Rp5,8 juta perlu ditelusuri atau tidak, dan tidak ada di kode — hanya Ayu dan Anda yang tahu apa yang sebenarnya diketik.

---

## Berikutnya (Patch 02 dan seterusnya)

Diurutkan menurut yang paling menghambat, bukan yang paling mudah:

| # | Isi | Alasan urutan |
| --- | --- | --- |
| 02 | Rantai saldo brankas + `Tanggal Setor Fisik` + `Status Setoran` | Menyentuh uang. Butuh hitung fisik dulu |
| 03 | Tambah penerima & tambah barang dari aplikasi (tanpa buka sheet) | Permintaan Anda. Sekarang harus edit sheet manual |
| 04 | Edit harga untuk MASTER_CK juga (sekarang cuma MASTER) + format angka | `simpanHarga` hardcode `getSheetByName('MASTER')` |
| 05 | Batalkan / perbaiki input yang salah, dengan jejak audit | Tidak ada sama sekali sekarang |
| 06 | Buka `riwayat` untuk PENYIAP & PENGANTAR | Teh Dede input 14 barang tanpa bisa memverifikasi |
| 07 | Sheet BEBAN + laba bersih yang benar | Prasyarat dashboard jujur |
| 08 | Konversi realm → JSON di GitHub Actions | Terpisah, lihat catatan di bawah |
