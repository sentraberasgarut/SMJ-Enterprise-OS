# Audit Operasional — Buku Toko & Central Kitchen

**Tanggal audit:** 30 Juli 2026
**Sumber:** Google Sheets `Buku Toko dan Central Kitchen` (`1yFF83m2Cd3v8WYU-6jDZTSGB-2TPEAIkJkBmH1iM_D8`), dibaca langsung, snapshot terakhir 30 Jul 08:21
**Metode:** pembacaan seluruh sheet, pelacakan silang `Kirim` → `Terima` → `Rekonsiliasi` → `Log Aktivitas`

> **Batasan yang perlu diketahui:** kode Apps Script **tidak terbaca**. Script yang terikat ke spreadsheet tidak muncul di Drive API. Semua temuan di bawah berbasis **data yang dihasilkan**, bukan pembacaan kode. Dugaan akar masalah ditandai sebagai dugaan, bukan fakta.

---

## Ringkasan

Aplikasi ini **berhasil**. Dalam 4 hari sejak 27 Jul: 8 pengguna aktif, alur barang keluar → konfirmasi terima → tutup shift jalan lengkap dengan bukti foto, dan 3 tutup shift tercatat dengan selisih terhitung. Ini pencapaian nyata dan Roadmap v5 masih menuliskannya sebagai tugas yang belum dimulai.

Tapi ada **5 blocker** yang membuat integrasi TSS+CK belum bisa disebut selesai, dan satu di antaranya jatuh tempo besok.

| # | Temuan | Tingkat | Dampak |
| --- | --- | --- | --- |
| 1 | Central Kitchen tanpa data biaya sama sekali | 🔴 Blocker | CK tidak terukur secara finansial |
| 2 | Migrasi dompet Kas Ibu → BRI mulai besok, tanpa dokumentasi | 🔴 Blocker | Perubahan alur kas tanpa SOP & pelatihan |
| 3 | Selisih tutup shift 27 Jul Rp2.101.810 belum dijelaskan | 🔴 Blocker | 3 hari terbuka, tidak masuk roadmap |
| 4 | Bug ID kiriman → 2 baris salah tandai "BELUM DIKONFIRMASI" | 🟠 Bug | Rp455.000 dilaporkan hilang padahal diterima |
| 5 | Rekonsiliasi berhenti di 29 Jul | 🟠 Bug | 30 Jul + CK 29 Jul tidak terekonsiliasi |
| 6 | Akses per-unit belum diatur untuk 6 dari 8 pengguna | 🟡 Kontrol | Penyiap SJ1 bisa menerbitkan kiriman CK |
| 7 | Log Perubahan Harga kosong padahal review harga menunggu | 🟡 Kontrol | Perubahan harga tidak akan terlacak |
| 8 | Katalog CK ada duplikat & kategori "Tambahan" jadi tempat buangan | 🟡 Higiene | Risiko salah pilih & double-count |

---

## 🔴 1 — Central Kitchen berjalan tanpa satu pun angka biaya

Sheet `Katalog CK` berisi **130+ item** dengan `Harga = 0` dan `Sumber Harga = CEK`. Sheet `Target` mencatat `CK = 0` dengan catatan *"Diisi setelah data Central Kitchen masuk"*.

Akibatnya, setiap kiriman CK tercatat bernilai Rp0. Contoh nyata dari kiriman 30 Jul (`20260730-CK-SJ4-R2`, dikonfirmasi diterima Mas War 08:21):

| Barang | Qty | Nilai tercatat |
| --- | --- | --- |
| Bola-bola Ayam | 250 pcs | Rp 0 |
| Ayam bagi 8 | 100 pcs | Rp 0 |
| Ayam Sarundeng bagi 8 | 100 pcs | Rp 0 |
| Gepuk | 75 pcs | Rp 0 |
| Perkedel Ayam | 75 pcs | Rp 0 |
| Babat Tamusu | 53 pcs | Rp 0 |
| Daging Kepala rebus | 53 pcs | Rp 0 |
| Ayam Keraton | 50 pcs | Rp 0 |
| *(+6 item lain)* | | Rp 0 |

**Kenapa ini blocker, bukan pekerjaan belakangan:** TSS punya masalah margin yang sudah terdiagnosis — beras 5,17%, minyak 4,18%, keseluruhan 7,20% dengan laba bersih Juli minus. Diagnosis itu mungkin karena datanya ada. CK tidak punya diagnosis apa pun, dan volumenya besar. CK bisa sedang mensubsidi atau menggerus Sederhana Jaya dan tidak akan ada yang tahu.

**Perlu keputusan CEO:** harga transfer CK → Sederhana Jaya memakai dasar apa — HPP bahan, HPP + tenaga kerja, atau harga pasar? Ini keputusan struktural, bukan pengisian data. Sampai dijawab, mengisi 130 angka akan menghasilkan angka yang salah secara konsisten.

---

## 🔴 2 — Migrasi dompet mulai besok (31 Jul), tidak terdokumentasi

Sheet `Dompet`:

| Kode | Nama | Jenis | Berlaku Dari | Berlaku Sampai |
| --- | --- | --- | --- | --- |
| `KAS_KASIR` | Kas Kasir | SISA | 2026-01-01 | — |
| `KAS_TUNAI` | Kas Tunai (brankas) | SISA | 2026-01-01 | — |
| `SETOR_IBU` | Setor ke Ibu | KELUAR | 2026-01-01 | **2026-07-30** |
| `KAS_BRI` | Setor ke Rekening BRI | KELUAR | **2026-07-31** | — |
| `PRIVE` | Prive Owner | KELUAR | 2026-01-01 | — |

**Besok, setoran berhenti ke Ibu dan mulai ke rekening BRI.** Ini perubahan bagus — Risk Register Roadmap v5 mencatat *"Pembelian stok lewat Ibu di luar sistem"* sebagai risiko terbuka sejak 21 Jul, dan ini mitigasinya.

Masalahnya:

- Notion dan memori AI masih menggambarkan **3 dompet** (Kasir Toko, Dompet Owner, Kas Ibu). Aplikasi punya **5 kode**. Dokumentasi salah.
- Tidak ada SOP untuk alur baru: siapa yang setor, kapan, bukti apa, siapa yang cocokkan dengan mutasi BRI.
- Tidak ada catatan bahwa Ayu sudah diberi tahu. Dia yang menutup shift 28 dan 29 Jul.
- Pembelian stok lewat Ibu memakai uang yang sebelumnya disetor ke Ibu. Kalau setoran pindah ke BRI, **dari mana Ibu membeli stok besok?** Ini pertanyaan operasional yang belum terjawab.

**Aksi hari ini:** jawab pertanyaan terakhir itu sebelum besok pagi, dan beri tahu Ayu.

---

## 🔴 3 — Selisih tutup shift 27 Jul Rp2.101.810 masih terbuka

Sheet `Tutup Shift`:

| Tanggal | Kasir | Penjualan Tunai | Seharusnya Tersisa | Selisih | Status |
| --- | --- | --- | --- | --- | --- |
| 27/07 | Aditya | 13.725.190 | 3.994.690 | **+2.101.810** | **PERLU DICEK** |
| 28/07 | Ayu | 3.904.000 | 2.565.000 | −5.000 | WAJAR |
| 29/07 | Ayu | 10.833.000 | 1.310.500 | 0 | WAJAR |

Dua shift Ayu bersih. Yang bermasalah adalah shift owner sendiri, hari pertama sistem dipakai. Selisihnya **positif** — kas lebih banyak dari seharusnya, yang biasanya berarti ada penerimaan tidak tercatat atau setoran Rp10 jt hari itu dihitung berbeda.

Roadmap v5 Fase 0 item #9 meminta penjelasan anomali **07/07 (−Rp7,2 jt)** dan **15/07 (−Rp2,1 jt)**. Anomali 27/07 ini **baru** dan belum masuk daftar mana pun. Kalau shift pertama di sistem baru dibiarkan tidak terjelaskan, presedennya buruk untuk seluruh disiplin yang sedang dibangun.

---

## 🟠 4 — Bug ID kiriman: Rp455.000 salah dilaporkan hilang

Sheet `Rekonsiliasi` menandai dua baris `BELUM DIKONFIRMASI`:

| Tanggal | Tujuan | Barang | Qty Keluar | Diterima | Nilai |
| --- | --- | --- | --- | --- | --- |
| 28/07 | Sederhana Jaya 4 | Micin Sobaso | 10 kg | *(kosong)* | Rp 350.000 |
| 28/07 | Sederhana Jaya 1 | Micin Sobaso | 3 kg | *(kosong)* | Rp 105.000 |

**Barangnya sebenarnya diterima.** Sheet `Terima` punya barisnya, tapi dengan `ID Kirim = 20260728-TSS-SEDERH-R1` — sementara sheet `Kirim` mencatatnya sebagai `20260728-TSS-SJ4-R1` dan `20260728-TSS-SJ1-R1`. ID tidak cocok, jadi rekonsiliasi tidak menemukan pasangannya.

**Dugaan akar masalah** (belum bisa dipastikan tanpa membaca kode): **Micin Sobaso adalah satu-satunya barang yang muncul di dua kiriman berbeda yang menunggu konfirmasi pada waktu yang sama** — SJ4-R1 dan SJ1-R1, keduanya 28 Jul. Semua item lain dalam konfirmasi yang sama mendapat ID yang benar. Pola ini mengarah ke pencarian per-item yang gagal saat satu nama barang cocok dengan lebih dari satu kiriman pending, lalu jatuh ke ID lama berformat `SEDERH`.

Format `SEDERH` sendiri adalah sisa skema penamaan lama — `Log Aktivitas` 27 Jul memakai `20260727-SEDERH-R1` dan `20260727-TSS-SEDERH-R1`, lalu dari 28 Jul berubah jadi per-cabang (`TSS-SJ1`, `TSS-SJ2`, `CK-SJ4`, `TSS-PPY`). Migrasi format terjadi di tengah jalan.

**Uji untuk memastikan:** kirim satu barang yang sama ke dua tujuan berbeda pada hari yang sama, jangan konfirmasi keduanya, lalu konfirmasi satu. Kalau ID pada baris `Terima` tidak sama dengan ID pada baris `Kirim`, dugaan ini benar.

---

## 🟠 5 — Rekonsiliasi berhenti di 29 Jul

Baris terakhir sheet `Rekonsiliasi` bertanggal **2026-07-29**. Yang hilang:

- **Seluruh 30 Jul** — padahal tiga konfirmasi terima tercatat di `Log Aktivitas` (06:32 `TSS-SJ1-R1` 13 barang, 07:22 `TSS-SJ4-R1` 4 barang, 08:21 `CK-SJ4-R2` 14 barang)
- **CK 29 Jul** (`20260729-CK-SJ4-R1`, 10 item dikonfirmasi Sanding) — ada di `Terima`, tidak ada di `Rekonsiliasi`

CK 28 Jul **ada** di rekonsiliasi, jadi CK tidak sengaja dikecualikan. Ini kemungkinan jeda trigger harian, atau proses yang berhenti di tengah.

**Belum bisa dipastikan tanpa melihat trigger.** Cek: Apps Script → Triggers → apakah rekonsiliasi berjalan terjadwal atau dipicu event, dan lihat Executions untuk error 29–30 Jul.

---

## 🟡 6 — Akses per-unit belum diatur

Sheet `Pengguna` punya kolom `Unit Dilihat`, tapi hanya terisi untuk 2 dari 8 pengguna:

| Nama | Peran | Unit | Unit Dilihat |
| --- | --- | --- | --- |
| Aditya | OWNER | TSS | `TSS,CK` |
| Sri Nurul | OWNER | CK | `CK` |
| Ayu | KASIR | TSS | *(kosong)* |
| Teh Dede | PENYIAP | SJ1 | *(kosong)* |
| Mas Haris | PENYIAP | SJ1 | *(kosong)* |
| Ayah Iman | PENYIAP | SJ1 | *(kosong)* |
| Sanding | PENYIAP | SJ4 | *(kosong)* |
| Mas War | PENGANTAR | `-` | *(kosong)* |

Konsekuensi nyata: **30 Jul 05:47, Teh Dede (PENYIAP unit SJ1) menerbitkan kiriman `20260730-CK-SJ4-R2` berisi 14 item Central Kitchen.** Boleh jadi ini memang dikehendaki — Teh Dede mungkin membantu di CK pagi itu. Tapi tidak ada aturan yang menentukan boleh atau tidak, jadi tidak ada cara membedakan bantuan sah dari kesalahan input.

Catatan kecil: peran Sanding tercatat tidak konsisten di `Log Aktivitas` — `PENERIMA` pada 27/07 20:11, `PENYIAP` pada 20:20. Sheet `Pengguna` menyebut `PENYIAP`. Peran sepertinya ditulis dari konteks aksi, bukan dari data master. Ini melemahkan nilai audit trail.

---

## 🟡 7 — Log Perubahan Harga kosong

Sheet `Log Perubahan Harga` ada lengkap dengan kolom (`Harga Lama`, `Harga Baru`, `Selisih`, `% Ubah`, `Diubah Oleh`) dan **nol baris**.

Sementara itu, keputusan CEO yang menunggu nomor 1 di Roadmap v5 adalah **tinjau harga Panawuan** (margin 4,8% di produk revenue terbesar), dan sudah ada satu item bertanda `MANUAL` di katalog: `Terigu Gatot Kaca 500gr` Rp90.000, serta `Royko Renceng` bertanda `BARU`.

Artinya harga sudah pernah berubah tanpa tercatat, atau flow perubahan harga tidak menulis ke log ini. Kalau review Panawuan dilakukan tanpa ini bekerja, dampaknya tidak akan bisa diukur ke belakang.

---

## 🟡 8 — Higiene katalog CK

- **`Gudeg` dobel** — sekali di `Bumbu & Sayur` (kg, harga 0), sekali di `Tambahan` (kg, harga kosong)
- **Kategori `Tambahan`** dipakai sebagai tempat buangan: `Pepes Ikan`, `Pepes Ayam`, `Pepes Tahu`, `Gudeg` — padahal `Pepes Ayam Kampung` ada di `Ayam & Unggas`
- **`Muncang`** muncul sebagai `mentah`/`goreng`/`giling` di katalog CK dan terpisah lagi di katalog TSS (`Muncang`, `Muncang (ball)`)
- `Bawang putih` dan `Cabe garing` ada di kedua katalog dengan penulisan kapital berbeda

Saat harga CK nanti diisi (temuan #1), duplikat ini akan menghasilkan dua sumber harga untuk barang yang sama.

---

## Konteks keuangan per 29 Jul (sheet `Ringkasan`, 26 hari data)

Angka ini **konsisten** dengan baseline Roadmap v5 — bukan temuan baru, tapi konfirmasi bahwa diagnosisnya masih berlaku:

| Metrik | Nilai |
| --- | --- |
| Omzet bulan ini | Rp 202.013.153 |
| Laba kotor bulan ini | Rp 14.552.295 |
| Margin keseluruhan | 7,20% |
| Konsentrasi Sederhana Jaya | **80,53%** |
| Nilai stok | Rp 103.141.585 |
| **Stok mati** | **Rp 10.975.000** (Banyuresmi 500 · Bagian 275 — keduanya 999 hari) |
| Piutang | Rp 3.452.000 |
| Siklus kas | 14,75 hari |
| GMROI | 1,98 |

**Margin per kategori:** Beras 5,17% (omzet Rp125,0 jt) · Bahan Dapur 12,51% (Rp43,2 jt) · Minyak 4,18% (Rp14,4 jt) · Gula 11,92% (Rp13,0 jt) · Kerupuk 8,00% (Rp6,2 jt)

**Dua hal baru yang layak dicatat:**

1. **Proyeksi laba bulan Rp16.791.110 vs target TSS Rp20.000.000** — kurang Rp3,2 jt (16%). Target tidak akan tercapai bulan ini.
2. **Stok mati Rp10,975 jt = 10,6% dari nilai stok**, dan dua barangnya (`Banyuresmi`, `Bagian`) **tidak ada di katalog TSS**. Modal terjebak di barang yang bahkan tidak lagi masuk daftar harga.

---

## Urutan perbaikan yang disarankan

| Prioritas | Aksi | Kenapa urutan ini |
| --- | --- | --- |
| **Hari ini** | Jawab: besok Ibu beli stok pakai uang dari mana? Beri tahu Ayu soal perubahan BRI | Jatuh tempo besok pagi, tidak bisa ditunda |
| **Hari ini** | Jelaskan selisih 27/07 Rp2,1 jt | Sudah 3 hari; preseden untuk disiplin sistem baru |
| **2–3 hari** | Putuskan dasar harga transfer CK → Sederhana Jaya | Membuka jalan seluruh pengukuran CK. Keputusan dulu, baru isi data |
| **2–3 hari** | Cek Apps Script Executions untuk error rekonsiliasi 29–30 Jul | Murah dicek, dan tanpa rekonsiliasi yang jalan tidak ada angka yang bisa dipercaya |
| **1 minggu** | Perbaiki bug ID kiriman + rapikan sisa format `SEDERH` | Rp455 rb sekarang, tapi akan berulang tiap ada barang sama di dua kiriman |
| **1 minggu** | Isi `Unit Dilihat` semua pengguna, ambil peran dari sheet `Pengguna` | Audit trail baru bernilai kalau perannya konsisten |
| **2 minggu** | Bersihkan duplikat katalog CK, lalu isi harga | Bersihkan dulu, isi kemudian — jangan sebaliknya |
| **2 minggu** | Pastikan flow perubahan harga menulis ke `Log Perubahan Harga` | Harus jalan sebelum review harga Panawuan |
