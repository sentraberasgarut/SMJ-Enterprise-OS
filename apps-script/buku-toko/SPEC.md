# Spesifikasi — Aplikasi Buku Toko & Central Kitchen

**Spreadsheet:** `Buku Toko dan Central Kitchen`
**ID:** `1yFF83m2Cd3v8WYU-6jDZTSGB-2TPEAIkJkBmH1iM_D8`
**Dibuat:** 27 Jul 2026 · **Produktif sejak:** 27 Jul 2026 · **Pengguna aktif:** 8

> **Kode belum ada di repo.** Apps Script yang terikat ke spreadsheet (*container-bound*) tidak dapat diakses lewat Google Drive API, sehingga tidak bisa dibaca oleh agen AI. Dokumen ini adalah **data contract** yang direkonstruksi dari isi sheet — cukup untuk memahami, mengaudit, dan mengubah sistem, tapi bukan pengganti kode.
>
> Untuk memasukkan kode: spreadsheet → Extensions → Apps Script → copy tiap file `.gs` ke folder ini.

---

## Fungsi

Web app berbasis PIN untuk mencatat alur barang antar unit dalam grup Sederhana Jaya, dari penerbitan kiriman sampai tutup shift dengan bukti foto.

**Alur inti:**

```
MASUK (login PIN)
   ↓
BARANG KELUAR ──── penyiap menerbitkan kiriman, dapat ID Kirim
   ↓
KONFIRMASI TERIMA ── penerima mencocokkan qty
   ↓
REKONSILIASI ────── sistem membandingkan keluar vs diterima → COCOK / SELISIH / BELUM DIKONFIRMASI
   ↓
TUTUP SHIFT ─────── hitung kas, hitung selisih, unggah 3–4 foto ke Drive
```

---

## Unit & entitas

| Kode | Arti |
| --- | --- |
| `TSS` | Toko Sembako Sejahtera — unit sembako |
| `CK` | Central Kitchen — unit lauk siap kirim |
| `SJ1`…`SJ5` | Cabang Rumah Makan Sederhana Jaya (tujuan) |
| `PPY` | Papoy — pelanggan non-Sederhana Jaya |
| `SEDERH` | ⚠️ Format lama, tujuan generik. Sudah digantikan `SJ1`–`SJ5`. Masih meninggalkan baris orphan |

## Format ID Kirim

```
YYYYMMDD - <UNIT ASAL> - <TUJUAN> - R<rit>

contoh: 20260730-CK-SJ4-R2   (30 Jul, dari Central Kitchen, ke Sederhana Jaya 4, rit ke-2)
```

⚠️ Format lama `YYYYMMDD-SEDERH-R<n>` dan `YYYYMMDD-TSS-SEDERH-R<n>` masih muncul di data 27–28 Jul dan menyebabkan bug pencocokan. Lihat temuan #4 di [audit 30 Jul](../../ops/audit/2026-07-30-buku-toko-audit.md).

## Peran

| Peran | Wewenang teramati |
| --- | --- |
| `OWNER` | Semua aksi, lintas unit |
| `KASIR` | Barang keluar, konfirmasi terima, tutup shift |
| `PENYIAP` | Barang keluar (menyiapkan kiriman) |
| `PENGANTAR` | Konfirmasi terima (Mas War, lintas unit TSS+CK) |
| `PENERIMA` | ⚠️ Muncul di log tapi tidak ada di sheet `Pengguna` — kemungkinan diturunkan dari konteks aksi, bukan data master |

---

## Sheet

### `Pengguna`
`Nama` · `PIN` · `Peran` · `Unit` · `Aktif` · `No WA` · `Unit Dilihat` · `Catatan`

Autentikasi lewat PIN 4 digit. `Unit Dilihat` mengatur cakupan akses — **hanya terisi untuk 2 dari 8 pengguna.**

### `Katalog TSS`
`Kategori` · `Nama Barang` · `Satuan` · `Harga` · `Sumber Harga` · `Tag`

32 item, harga lengkap. `Sumber Harga = SJ` artinya harga transfer internal ke Sederhana Jaya. Tag: `BARU`, `TAMBAHAN`. Kategori: Beras, Bahan Dapur, Gula, Minyak, Kerupuk.

### `Katalog CK`
Struktur sama. **130+ item, seluruhnya `Harga = 0` dan `Sumber Harga = CEK`.** Kategori: Ayam & Unggas, Telur, Ikan & Seafood, Ikan Asin, Bumbu & Sayur, Daging, Buah, Minuman, Packaging, Sayuran, Tambahan.

### `Ringkasan`
`Dihitung` (timestamp) · `Ringkasan` (satu sel JSON)

Cache metrik yang dihitung dari export POS Loka harian. **Jangan edit manual.** Field JSON:

| Field | Arti |
| --- | --- |
| `nHari` | Jumlah hari data dalam periode |
| `margin` | Margin kotor keseluruhan (%) |
| `gmroi` | Gross Margin Return on Inventory |
| `putaran`, `dio`, `dso`, `siklusKas` | Perputaran stok, days inventory outstanding, days sales outstanding, siklus kas (hari) |
| `kategori[]` | Per kategori: `nama`, `omzet`, `laba`, `margin` |
| `stokMati[]`, `nilaiStokMati` | Barang tanpa pergerakan (`hari: 999`) dan nilainya |
| `stokMenipis[]` | Barang menuju habis |
| `piutang[]`, `piutangTotal` | Piutang per tanggal & pelanggan |
| `pelanggan[]` | Omzet & laba per pelanggan |
| `grafik[]` | Omzet & laba harian |
| `konsentrasiSJ` | % omzet dari Sederhana Jaya |
| `hariIni`, `bulanIni` | `{omzet, laba, trx}` |
| `proyeksiOmzetBulan`, `proyeksiLabaBulan` | Ekstrapolasi bulan penuh |
| `file`, `tglData` | Export Loka sumber, mis. `loka-2026-07-29.json` |

### `Log Aktivitas`
`Waktu` · `Tanggal` · `Nama` · `Peran` · `Aksi` · `Keterangan`

Aksi: `MASUK`, `BARANG KELUAR`, `KONFIRMASI TERIMA`, `TUTUP SHIFT`. Append-only.

### `Kirim`
`Waktu Input` · `Tanggal` · `Tujuan` · `Rit ke-` · `Penyiap` · `Barang` · `Qty` · `Satuan` · `Harga` · `Nilai` · `Catatan` · `ID Kirim` · `Unit Asal`

Satu baris per item per kiriman. `Nilai = Qty × Harga` — selalu 0 untuk item CK. Catatan `late input` dipakai untuk entri terlambat.

### `Terima`
`Waktu Input` · `Tanggal` · `ID Kirim` · `Penerima` · `Barang` · `Qty Diterima` · `Satuan` · `Catatan` · `Tujuan` · `Unit Asal`

⚠️ `ID Kirim` di sheet ini bisa tidak cocok dengan `Kirim` saat satu nama barang muncul di lebih dari satu kiriman pending.

### `Rekonsiliasi`
`Tanggal` · `Tujuan` · `Barang` · `Qty Keluar` · `Qty Diterima` · `Selisih` · `Nilai Keluar` · `Status` · `ID Kirim` · `Unit`

Status: `COCOK` · `BELUM DIKONFIRMASI` · *(selisih ≠ 0 belum teramati)*. **Baris terakhir 29 Jul** — tertinggal dari data.

### `Log Perubahan Harga`
`Waktu` · `Tanggal` · `Barang` · `Harga Lama` · `Harga Baru` · `Selisih` · `% Ubah` · `Diubah Oleh` · `Catatan`

**Kosong.** Harus berfungsi sebelum review harga Panawuan.

### `Dompet`
`Kode` · `Nama Dompet` · `Jenis` (`SISA` / `KELUAR`) · `Berlaku Dari` · `Berlaku Sampai` · `Urutan`

Dompet berversi tanggal. ⚠️ `SETOR_IBU` berakhir 30 Jul 2026, `KAS_BRI` mulai 31 Jul 2026.

### `Tutup Shift`
`Waktu Input` · `Tanggal` · `Kasir` · `Penjualan Tunai` · `Pengeluaran Tunai` · `Kas Kasir` · `Kas Tunai` · `Setor ke Ibu` · `Setor BRI` · `Prive Owner` · `Kas Awal` · `Seharusnya Tersisa` · `Selisih` · `Status` · `Cek Loka` · `Cek Struk` · `Cek Backup` · `Catatan` · `Foto Struk` · `Foto Kas Kasir` · `Foto Kas Tunai` · `Foto Lain`

Status: `WAJAR` · `PERLU DICEK`. Kolom foto berisi URL Drive; file diunggah ke `Buku Toko - Bukti Tutup Shift/YYYY-MM/YYYY-MM-DD_<Nama>_<jenis>.jpg`.

Kolom `Kas Awal` mengambil `Kas Kasir` shift sebelumnya — rantai ini terverifikasi utuh 27→28→29 Jul (296.500 → 260.000 → 210.500).

### `Target`
`Unit` · `Target Laba / Bulan` · `Catatan`

TSS `20.000.000` · CK `0`.

---

## Integrasi eksternal

| Sistem | Hubungan |
| --- | --- |
| **POS Loka** | Export `loka-YYYY-MM-DD.json` harian ke folder Drive `1bnusuRTOpvzGXvLv8RQwJ-akJIyFz6M7`; jadi input sheet `Ringkasan`. Backup `.realm` ke folder terpisah |
| **Google Drive** | Penyimpanan bukti foto tutup shift |
| **WhatsApp** | `No WA` tersimpan per pengguna — pemakaiannya untuk notifikasi belum terverifikasi |

## Yang belum terverifikasi

Hal-hal ini **tidak bisa** dipastikan tanpa membaca kode atau melihat panel Apps Script:

- Apakah rekonsiliasi jalan lewat trigger terjadwal atau dipicu event
- Apakah `No WA` dipakai untuk mengirim notifikasi
- Cara `Unit Dilihat` diterapkan saat nilainya kosong (buka semua, atau tutup semua)
- Validasi apa yang berjalan sebelum tutup shift disimpan
- Apakah `Kas Awal` dibaca otomatis atau diisi manual
