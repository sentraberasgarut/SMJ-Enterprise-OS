# Spesifikasi — Tutup Shift v2

**Tanggal:** 30 Juli 2026
**Alasan revisi:** struktur v1 tidak mencerminkan keadaan lapangan — uang carry-over di dompet toko terbaca sebagai selisih, dan saldo brankas tidak punya rantai antar hari.

> **Batasan:** kode Apps Script tidak bisa saya baca (container-bound, tidak muncul di Drive API). Semua analisis di bawah berbasis **aritmetika dari 3 baris data** di sheet `Tutup Shift`. Kesimpulan yang belum pasti saya tandai sebagai belum pasti.

---

## 🔴 Temuan yang harus dipastikan dulu — selisih Rp 5,8 juta antara dua tafsir

Saya tidak bisa memastikan arti kolom `Kas Tunai`. Ada dua tafsir yang **sama-sama cocok dengan ketiga baris data**, tapi hasilnya berbeda Rp 5,8 juta. Ini harus dipastikan sebelum apa pun diperbaiki.

### Data yang ada

| Tgl | Kasir | Kas Awal | Penjualan Tunai | Pengeluaran Tunai | Setor ke Ibu | Kas Kasir | Kas Tunai | Seharusnya | Selisih |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 27/07 | Aditya | 269.500 | 13.725.190 | 0 | 10.000.000 | 296.500 | 5.800.000 | 3.994.690 | +2.101.810 |
| 28/07 | Ayu | 296.500 | 3.904.000 | 1.635.500 | 0 | 260.000 | 2.300.000 | 2.565.000 | −5.000 |
| 29/07 | Ayu | 260.000 | 10.833.000 | 9.782.500 | 0 | 210.500 | 1.100.000 | 1.310.500 | 0 |

Yang bisa dipastikan: **`Kas Awal` hanya mengambil `Kas Kasir` hari sebelumnya**, bukan total uang. 296.500 → 296.500 dan 260.000 → 260.000, keduanya cocok persis.

### Tafsir 1 — `Kas Tunai` = **saldo** brankas (stok)

Kalau ini benar, uang di brankas tiap malam adalah 5,8 jt → 2,3 jt → 1,1 jt. Total uang yang ada:

- 27/07 tutup: 296.500 + 5.800.000 = **6.096.500**
- 28/07 seharusnya: 6.096.500 + 3.904.000 − 1.635.500 = **8.365.000**
- 28/07 nyata: 260.000 + 2.300.000 = **2.560.000**
- **Kurang Rp 5.805.000** — dan `Setor ke Ibu` hari itu tercatat 0

Aplikasi melaporkan selisih hanya −Rp5.000 karena `Kas Awal` me-reset ke 296.500 setiap hari, sehingga saldo brankas hari sebelumnya **hilang dari perhitungan tanpa jejak**.

→ Kalau tafsir ini benar, **ada Rp 5,8 juta yang perlu dijelaskan**, dan formulanya menyembunyikannya.

### Tafsir 2 — `Kas Tunai` = **jumlah yang dipindahkan** ke brankas hari itu (arus)

Kalau ini benar, setiap angka adalah setoran ke brankas hari itu, bukan saldo. Maka:

- Semua tiga baris konsisten tanpa uang hilang
- Saldo brankas kumulatif = 5.800.000 + 2.300.000 + 1.100.000 = **Rp 9.200.000**
- Tidak ada masalah selain penamaan kolom yang membingungkan

### ✅ Satu langkah yang menyelesaikannya

**Hitung uang fisik di brankas sekarang.**

| Hasil hitungan | Artinya |
| --- | --- |
| Sekitar **Rp 9,2 juta** | Tafsir 2 benar. Tidak ada uang hilang. Cukup ganti nama kolom jadi `Masuk Brankas` dan tambah kolom `Saldo Brankas` |
| Sekitar **Rp 1,1 juta** | Tafsir 1 benar. **Rp 5,8 juta perlu dijelaskan** — kemungkinan besar setoran ke Ibu yang tidak tercatat pada 28 Jul |
| Angka lain | Perlu telusur mundur dari foto bukti tutup shift 27–29 Jul |

Foto `Foto Kas Tunai` sudah tersimpan di Drive untuk ketiga hari itu — kalau perlu telusur mundur, sumbernya ada.

> Saya sengaja **tidak** menyimpulkan mana yang benar. Menuduh ada uang hilang berdasarkan tafsir kolom adalah kesalahan yang mahal, dan menganggap semuanya aman tanpa dicek juga sama mahalnya.

---

## Selisih 27 Jul — status: **terjelaskan, bukan kehilangan**

CEO mengonfirmasi selisih +Rp2.101.810 **disadari dan disengaja**: ada uang hasil penjualan hari sebelumnya yang berada di dompet toko sebelum sistem mulai dipakai.

**Jadi ini bukan masalah disiplin — ini cacat desain.** Tindakan yang benar terbaca sebagai selisih, karena saldo awal hari pertama hanya menghitung uang laci dan mengabaikan uang yang sudah ada di dompet/brankas.

Akibat yang lebih penting daripada angkanya sendiri: **kalau tindakan sah menghasilkan status `PERLU DICEK`, orang akan berhenti mempercayai status itu.** Begitu `PERLU DICEK` dianggap normal, selisih yang benar-benar bermasalah tidak akan ada yang lihat.

Perbaikan: saldo brankas jadi rantai kontinu (bagian berikut) + satu kali pencatatan saldo awal.

---

## Perubahan v1 → v2

### 1. Saldo brankas jadi rantai kontinu

Semua uang harus punya asal dan tujuan yang tersambung antar hari.

```
Saldo Brankas Awal   = Saldo Brankas Akhir hari sebelumnya   ← BARU, ini yang hilang di v1
Kas Kasir Awal       = Kas Kasir Akhir hari sebelumnya       ← sudah benar di v1

Total Kas Awal       = Kas Kasir Awal + Saldo Brankas Awal

Seharusnya Tersisa   = Total Kas Awal
                     + Penjualan Tunai
                     − Pengeluaran Tunai
                     − Setor BRI
                     − Prive Owner

Nyata                = Kas Kasir Akhir + Saldo Brankas Akhir
Selisih              = Nyata − Seharusnya Tersisa
```

Dengan ini, uang carry-over **tidak lagi muncul sebagai selisih** — dia terbawa sebagai saldo awal, sebagaimana mestinya.

### 2. Kolom baru

| Kolom | Isi | Catatan |
| --- | --- | --- |
| `Saldo Brankas Awal` | Otomatis dari hari sebelumnya | Kunci perbaikan utama |
| `Saldo Brankas Akhir` | Diisi kasir, hasil hitung fisik | Wajib ada foto |
| `Status Setoran` | `TIDAK PERLU` · `MENUNGGU VERIFIKASI` · `COCOK` · `SELISIH` · `GAGAL SETOR` | Untuk runbook kustodi |
| `Alasan Gagal Setor` | Mesin penuh / uang ditolak / offline / lewat jam aman | Hanya bila `GAGAL SETOR` |
| `Diverifikasi Oleh` | Aditya atau Ibu | Bukan kasir yang sama |
| `Tgl Verifikasi` | Otomatis saat ditandai | Batas 24 jam |
| `Jenjang Setoran` | Otomatis: A / B / C | Dari `Saldo Brankas Akhir` |
| `Hari Menginap` | Otomatis | Peringatan pada hari ke-3 |

### 3. `Setor ke Ibu` → dinonaktifkan, jangan dihapus

Kolom `Setor ke Ibu` berhenti dipakai 30 Jul. **Jangan dihapus** — data historisnya dibutuhkan untuk menelusuri Rp5,8 jt di atas. Cukup sembunyikan dari form input, biarkan di sheet.

### 4. Validasi sebelum simpan

Tutup shift **ditolak** kalau:

| Kondisi | Alasan |
| --- | --- |
| `Kas Kasir Akhir` > Rp 300.000 | Melebihi batas float — kelebihannya harus masuk brankas |
| `Saldo Brankas Akhir` > Rp 2.000.000 tanpa `Status Setoran` diisi | Jenjang B/C wajib punya keputusan setor |
| `Status Setoran` = `COCOK`/`SELISIH` diisi oleh kasir sendiri | Verifikasi harus dua sisi |
| Foto `Kas Tunai` kosong padahal saldo brankas > 0 | Tanpa foto tidak ada bukti hitung |
| Selisih > Rp 100.000 tanpa `Catatan` | Selisih besar wajib punya penjelasan saat itu, bukan nanti |

Ambang Rp100.000 dipilih supaya selisih pembulatan kecil (−Rp5.000 seperti 28 Jul) tidak memaksa penjelasan, tapi selisih yang bermakna tidak bisa lewat diam-diam.

### 5. Ambil `Penjualan Tunai` otomatis dari backup Loka

CEO mengonfirmasi data saldo toko bisa diambil dari backup JSON Loka harian.

**Sumber:** folder Drive `1bnusuRTOpvzGXvLv8RQwJ-akJIyFz6M7`, file `loka-YYYY-MM-DD.json` (~800–900 KB/hari, sudah jalan sejak minimal 27 Jul)

**Perilaku yang disarankan:**

1. Saat form tutup shift dibuka, baca `loka-<tanggal-hari-ini>.json`
2. Isi `Penjualan Tunai` sebagai **angka pembanding**, bukan angka final
3. Tampilkan berdampingan dengan angka hitungan kasir
4. Kalau beda > Rp 100.000 → minta kasir konfirmasi mana yang dipakai + alasan

**Kenapa pembanding, bukan pengganti:** kalau angka Loka langsung dipakai, kasir berhenti menghitung dan selisih tidak akan pernah terdeteksi — justru menghilangkan gunanya tutup shift. Dua angka independen yang dibandingkan adalah kontrolnya; satu angka otomatis bukan kontrol.

⚠️ **Hati-hati baris footer ringkasan** di export Loka — pernah menyebabkan double-count. Jangan jumlahkan seluruh baris tanpa menyaring baris total.

### 6. Notifikasi WA otomatis

Kolom `No WA` sudah ada di sheet `Pengguna` tapi pemakaiannya belum terverifikasi. Yang perlu jalan:

| Pemicu | Tujuan | Isi |
| --- | --- | --- |
| Tutup shift disimpan | Aditya + Ibu | Kasir · penjualan · saldo brankas · jenjang · selisih |
| `Status Setoran` = `GAGAL SETOR` | Aditya + Ibu | **Segera** — nominal + alasan + lokasi uang sekarang |
| Selisih > Rp 100.000 | Aditya | Nominal + catatan kasir |
| Uang menginap hari ke-3 | Aditya + Ibu | Nominal + sudah berapa hari |
| Setoran belum diverifikasi > 24 jam | Aditya + Ibu | Daftar yang menunggu |

Dua notifikasi terakhir adalah yang membuat sistem ini jalan tanpa CEO onsite. Tanpa itu, aturan 3 hari dan verifikasi 24 jam hanya ada di dokumen.

---

## Urutan pengerjaan

| Prioritas | Perubahan | Kenapa urutan ini |
| --- | --- | --- |
| **1** | Hitung fisik brankas → pastikan tafsir mana yang benar | Semua angka lain bergantung pada ini |
| **2** | Catat saldo brankas awal satu kali | Titik nol yang bisa dipercaya |
| **3** | Rantai `Saldo Brankas Awal` ← hari sebelumnya | Perbaikan terpenting, paling murah |
| **4** | `Status Setoran` + `GAGAL SETOR` | Runbook kustodi butuh ini mulai 31 Jul |
| **5** | Notifikasi WA: tutup shift + `GAGAL SETOR` | Yang membuat sistem jalan tanpa CEO onsite |
| **6** | Validasi sebelum simpan | Mencegah data buruk masuk |
| **7** | Pembanding otomatis dari Loka JSON | Peningkatan kualitas, bukan penambal lubang |
| **8** | Notifikasi hari ke-3 + verifikasi lewat 24 jam | Penegak aturan waktu |

Item 1–4 harus selesai sebelum atau bersamaan dengan runbook kustodi mulai berlaku 31 Jul. Item 5–8 bisa menyusul dalam 1–2 minggu.
