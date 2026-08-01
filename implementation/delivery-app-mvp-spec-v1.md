# Delivery App — MVP Spec v1

**1 Agustus 2026. Perencanaan implementasi. Tidak ada kode di dokumen ini.**

Aplikasi operasional pertama Enterprise OS yang benar-benar dipakai di lapangan — dipakai sebelum toko buka, menggantikan komunikasi verbal dan asumsi dengan bukti. Menerapkan [`operational-accountability-architecture-v1.md`](../architecture/operational-accountability-architecture-v1.md) dan [`workforce-assignment-architecture-v1.md`](../architecture/workforce-assignment-architecture-v1.md) — bukan mengulang isinya.

---

## 1. Business Problem

Setiap pagi sekitar jam 05:00, barang keluar dari toko menuju Warung Sederhana Jaya 1 atau 4, sebelum Ayu mulai kerja jam 06:30. Siapa yang menyiapkan dan siapa yang mengantar berpindah-pindah orang tergantung siapa yang bertugas hari itu (Teh Dede, Mas War, atau Aditya untuk penyiapan; Mas War atau — kalau dia libur — Ayah untuk pengantaran).

**Masalahnya bukan bahwa barang sering hilang.** Masalahnya adalah: kalau suatu pagi ada yang tidak sampai, salah kirim, atau terlambat, **tidak ada apa pun yang secara independen membuktikan siapa melakukan apa dan jam berapa** — di luar `KELUAR`/`TERIMA` (Buku Toko) yang mencatat barang & nilai, tapi tidak pernah dirancang untuk membuktikan *momen serah terima tanggung jawab* itu sendiri, dan tidak membawa bukti foto. Karena kejadiannya sebelum Ayu masuk kerja, dia secara struktural tidak mungkin jadi saksi — tapi tanpa bukti eksplisit, dialah yang paling gampang ditanya duluan begitu toko buka dan sesuatu terlihat janggal. Itu bertentangan langsung dengan prinsip inti Operational Accountability Architecture §3: *apa pun yang terjadi sebelum jam kerja seseorang tidak boleh otomatis jadi tanggung jawabnya.*

Enterprise OS memperbaikinya bukan dengan mengawasi orang, tapi dengan memastikan **bukti sudah ada sebelum dibutuhkan** — persis prinsip dari Operational Accountability Architecture §1: Fact → Evidence → Responsibility, tidak pernah dari ingatan atau tuduhan.

---

## 2. Operational Flow — menit demi menit

Berdasarkan pola nyata yang sudah teramati di produksi ([`production-system-crosswalk-v1.md`](production-system-crosswalk-v1.md) §1 — `LOG_AKSES` Teh Dede tanggal 1 Agustus: `BARANG KELUAR` tercatat 05:21, 05:32, 05:46) — bukan waktu yang direka-reka.

| Waktu | Kejadian | Siapa | Tercatat di aplikasi ini? |
|---|---|---|---|
| ~04:50 | Barang mulai disiapkan secara fisik (dikemas, ditata) | Peran Warehouse (Teh Dede/Mas War/Aditya, tergantung Assignment hari itu) | Tidak — pekerjaan fisik, bukan tugas aplikasi |
| ~05:00–05:10 | Peran Warehouse membuka aplikasi, pilih tujuan, foto barang siap kirim, kirim | Peran Warehouse | **Ya — `GoodsDeparted` tercatat** |
| ~05:05–05:25 | Barang dimuat & diantar secara fisik | Peran Driver (Mas War, atau Ayah kalau Mas War Off Duty) | Tidak — perjalanan fisik |
| ~05:25–05:50 | Peran Driver tiba di tujuan, buka aplikasi, konfirmasi sampai, kirim | Peran Driver | **Ya — `GoodsReceived` + `ResponsibilityTransferred` tercatat** |
| 06:30 | Ayu mulai shift (`ShiftOpened`, di luar cakupan aplikasi ini) | Peran Cashier | Timeline sudah menunjukkan pengiriman pagi ini selesai/pending, tanpa Ayu perlu bertanya ke siapa pun |

Total interaksi manusia dengan aplikasi: **dua momen singkat**, satu di gudang, satu di tujuan. Tidak ada langkah aplikasi di antaranya.

---

## 3. Evidence Flow

```
Preparation
   │  (peran Warehouse membuka aplikasi)
   ▼
Photo
   │  (satu foto barang siap kirim — satu-satunya bukti visual sebelum
   │   ada siapa pun yang menyaksikan selain pengirim sendiri)
   ▼
Confirmation
   │  (submit → GoodsDeparted tercatat: waktu, peran, unit bisnis, tujuan, foto)
   ▼
Delivery
   │  (perjalanan fisik — tidak direkam aplikasi)
   ▼
Arrival
   │  (peran Driver membuka aplikasi di tujuan, konfirmasi sampai)
   ▼
Responsibility Transfer
      (submit → GoodsReceived tercatat, dicocokkan otomatis ke GoodsDeparted
       yang sesuai → ResponsibilityTransferred. Sejak titik ini, tanggung
       jawab ada di penerima/toko tujuan, bukan lagi di pengirim.)
```

Ini menerapkan langsung pola dua-pihak yang sudah terbukti jalan di produksi (`KELUAR`→`TERIMA`→`REKAP`, Operational Accountability Architecture §5) — bukan pola baru. Bedanya, dan inilah yang bikin ini "bukti bermutu legal" bukan sekadar catatan gudang: **foto melekat pada momen keberangkatan**, sesuatu yang tidak ada sama sekali di `KELUAR` hari ini.

**Aplikasi ini sengaja tidak mencatat barang & kuantitas per item.** `KELUAR`/`TERIMA` di Buku Toko sudah melakukan itu, sudah jalan, sudah dipakai tiap hari — tidak rusak, tidak perlu diganti. Aplikasi ini menjawab pertanyaan yang berbeda dan belum terjawab: *siapa, kapan, ke mana, bukti apa, dan kapan tanggung jawab berpindah* — bukan *barang apa saja*. Menggabungkan keduanya akan membuat aplikasi ini lebih besar dari yang dibutuhkan, dan menciptakan dua pencatatan barang yang bisa saling tidak sinkron (persis "No Duplicate Meaning" yang sudah jadi aturan di Canonical Data Contract §2).

---

## 4. Operational Roles

Tidak memakai nama. Peran, sesuai [`workforce-assignment-architecture-v1.md`](../architecture/workforce-assignment-architecture-v1.md) §2/§3:

| Peran | Fungsi di aplikasi ini | Assignment hari ini berasal dari |
|---|---|---|
| **Warehouse** | Membuka layar Persiapan, mencatat `GoodsDeparted` | Workforce Assignment — bisa Teh Dede, Mas War, atau Aditya, tergantung siapa yang Assigned/Acting hari itu |
| **Driver** | Membuka layar Kedatangan, mencatat `GoodsReceived` | Workforce Assignment — Mas War (Primary) atau Ayah (Backup, kalau Mas War Off Duty) |

**Catatan penting dari produksi:** `[Current Production Evidence]` menu akses peran `PENGANTAR` (Driver) di Buku Toko hari ini **hanya** berisi `terima` + `riwayat` (`_menuPeran`, Code.gs:334-343) — tidak ada `keluar`. Ini kebetulan cocok persis dengan pembagian peran di aplikasi ini: Driver secara alami hanya perlu layar Kedatangan, bukan layar Persiapan. Desain aplikasi ini tidak menciptakan pembagian baru — ia mengikuti batas yang sudah berlaku di produksi.

**Kasus Mas War sebagai Warehouse ATAU Driver:** brief operasional menyebut Mas War sebagai kemungkinan penyiap *dan* pengantar. Ini persis pola "satu orang, lebih dari satu peran mungkin di hari yang sama" dari Workforce Assignment Architecture §5 — bukan kasus khusus yang perlu ditangani terpisah. Kalau Assignment hari itu menempatkan Mas War di kedua peran, aplikasi cukup menanyakan satu kali di awal sesi ("Hari ini saya: Menyiapkan / Mengantar") — satu tambahan tap, hanya saat benar-benar ambigu, tidak untuk Teh Dede yang cuma punya satu peran hari itu.

---

## 5. Screens

Tiga layar total. Setiap layar dan setiap tap dijustifikasi terhadap target 20 detik.

### Layar 1 — Masuk (reuse, bukan desain baru)
Pola gerbang PIN yang sudah ada dan terbukti (Buku Toko, Increment 1 Dashboard) — satu input, satu tap. Setelah PIN valid, aplikasi membaca Assignment hari ini dari Workforce Assignment (§4 di atas) dan langsung membuka layar yang sesuai perannya — **tidak ada menu untuk dipilih**, kecuali kasus dua-peran di atas.

### Layar 2 — Persiapan (Peran Warehouse)
Satu layar. Isinya:
1. Dua tombol besar tujuan: **Sederhana Jaya 1** / **Sederhana Jaya 4** (satu tap)
2. Satu tombol kamera: ambil satu foto barang siap kirim (satu tap untuk buka kamera, satu untuk ambil — bawaan sistem, bukan UI kustom)
3. Tombol **Kirim** (satu tap)

**Total: 3 tap.** Tidak ada input teks wajib. Catatan (opsional) tersedia tapi tersembunyi di balik satu tap tambahan, tidak menghalangi jalur utama.

### Layar 3 — Kedatangan (Peran Driver)
Satu layar, dibuka setelah tiba di tujuan. Isinya:
1. Tujuan **sudah otomatis terisi** — aplikasi tahu tujuan mana yang masih punya `GoodsDeparted` terbuka hari ini untuk peran Driver yang login, jadi tidak perlu dipilih ulang kalau hanya ada satu pengiriman aktif
2. Tombol **Konfirmasi Sampai** (satu tap)
3. Foto **hanya muncul kalau ada masalah** — tombol "Ada yang tidak sesuai?" opsional, baru memunculkan kamera kalau ditekan

**Total: 1 tap** pada kondisi normal (tidak ada masalah).

**Layar keberhasilan** setelah kedua submit di atas bukan layar terpisah yang perlu ditutup — cukup satu tanda centang sekilas (auto-hilang), supaya tidak menambah satu tap lagi hanya untuk menutup konfirmasi.

**Kenapa tidak ada layar ke-4:** setiap layar tambahan yang dipertimbangkan (memilih dari daftar ID Kirim, mengisi catatan wajib, konfirmasi dua langkah) ditolak karena tidak menjawab satu pun dari enam pertanyaan inti (§ Goal) — hanya menambah waktu tanpa menambah bukti.

---

## 6. Required Inputs

Hanya yang benar-benar tidak bisa diotomatisasi:

| Input | Wajib? | Kenapa manusia harus mengisi ini |
|---|---|---|
| Tujuan (SJ1/SJ4) | Ya | Sistem tidak bisa tahu ke mana barang ini akan pergi tanpa diberi tahu |
| Foto (Persiapan) | Ya | Satu-satunya bukti visual sebelum ada pihak kedua yang menyaksikan |
| Konfirmasi sampai (Kedatangan) | Ya | Tidak ada cara mengetahui barang benar-benar diterima tanpa pengakuan aktif dari penerima |
| Foto (Kedatangan) | Hanya kalau ada masalah | Menambah beban di kondisi normal tanpa menambah bukti yang berguna |
| Catatan | Tidak, opsional | Kebanyakan pengiriman pagi tidak punya apa pun yang perlu dicatat |

---

## 7. Automatic Fields

Semua ini terisi sendiri, tidak pernah ditanyakan ke pengguna:

- **Timestamp** — waktu submit, bukan waktu klaim
- **Business Unit** — Toko Sembako Sejahtera (satu-satunya unit yang aktif hari ini, per `production-system-crosswalk-v1.md`)
- **Assigned Role** — dari Workforce Assignment, dibaca saat login
- **Assignment status** (Primary / Acting) — dari Workforce Assignment §4; kalau Ayah mengantar karena Mas War Off Duty, ini tercatat otomatis sebagai "Driver — Acting," bukan diam-diam terlihat seperti Mas War
- **ID korelasi Persiapan↔Kedatangan** — dibuat otomatis mengikuti pola `ID Kirim` yang sudah terbukti di produksi (`YYYYMMDD-UNIT-TUJUAN-Rn`), **tidak pernah dilihat atau diketik pengguna** — ini murni mekanisme pencocokan di belakang layar

**GPS — `[Future Recommendation]` saja, bukan bagian MVP ini.** Alasan menunda, bukan menolak selamanya: menambah GPS berarti menambah satu izin lokasi yang bisa ditolak/gagal di HP lama, yang justru bisa memblokir submit tepat pada momen paling kritis (05:00, sinyal lemah). Foto + waktu submit + peran sudah cukup untuk membuktikan tanggung jawab tanpa itu. GPS layak dipertimbangkan lagi setelah aplikasi ini terbukti dipakai konsisten tanpa masalah — bukan sebelum itu.

---

## 8. Dashboard Integration

Setelah submit, yang muncul di Operational Timeline ([`operational-accountability-architecture-v1.md`](../architecture/operational-accountability-architecture-v1.md) §6) — persis mengikuti bentuk yang sudah dirancang di sana, bukan bentuk baru:

```
05:32   GoodsDeparted   Warehouse: Teh Dede        → Sederhana Jaya 1   📷
05:58   GoodsReceived   Driver: Mas War             Sederhana Jaya 1   ✓ Responsibility Transferred

05:46   GoodsDeparted   Warehouse: Teh Dede        → Sederhana Jaya 4   📷
06:10   GoodsReceived   Driver: Ayah (Acting)       Sederhana Jaya 4   ✓ Responsibility Transferred
```

Kalau `GoodsReceived` belum muncul dalam waktu wajar setelah `GoodsDeparted`, entrinya tetap tampil, jujur, sebagai **Pending Evidence** (Operational Accountability Architecture §7) — bukan hilang, bukan disembunyikan:

```
05:46   GoodsDeparted   Warehouse: Teh Dede        → Sederhana Jaya 4   📷
        ⏳ Belum ada konfirmasi sampai
```

Inilah mekanisme perlindungan bagi Ayu secara nyata, bukan cuma di atas kertas: begitu dia buka shift jam 06:30, dia (atau siapa pun) bisa langsung melihat status pengiriman pagi itu tanpa bertanya ke siapa pun — dan kalau sesuatu memang belum tuntas, itu sudah terlihat tercatat *sebelum* dia mulai kerja, bukan ditemukan nanti dan otomatis jadi tanda tanya ke arahnya.

---

## 9. Failure Scenarios

| Skenario | Perilaku aplikasi |
|---|---|
| **Tidak ada foto (Persiapan)** | Tombol Kirim tetap nonaktif sampai foto diambil — foto adalah satu-satunya bukti visual momen itu, tidak bisa dilewati diam-diam |
| **Salah tujuan** | Bisa dikoreksi selama belum ada `GoodsReceived` yang cocok — perubahan tercatat sebagai fakta baru (Immutable History), bukan menimpa yang lama |
| **Pengiriman dibatalkan** | Tombol "Batalkan" eksplisit di layar Persiapan sebelum submit final — kalau sudah terkirim, dibatalkan lewat aksi terpisah yang tercatat sebagai fakta baru, bukan dihapus |
| **Assignment salah** (orang yang bukan Assignment hari ini mencoba submit) | Diizinkan sebagai **Acting**, bukan diblokir — memblokir orang yang benar-benar sedang menutupi tugas orang lain (§4 Workforce Assignment) hanya akan mendorong mereka memakai akun orang lain, yang justru merusak buktinya. Statusnya tercatat apa adanya (Acting), tidak disamarkan |
| **Kedatangan telat dikonfirmasi** (submit jam 09:00 untuk pengiriman jam 05:30) | Timestamp yang tercatat adalah waktu submit sesungguhnya, bukan diedit mundur — keterlambatan itu sendiri adalah informasi (naik jadi `Warning` di Timeline, Operational Accountability Architecture §7), bukan disembunyikan supaya terlihat rapi |
| **Tidak ada sinyal internet di lokasi** | `[Future Recommendation]`, di luar cakupan MVP ini — dicatat sebagai keterbatasan yang perlu jawaban sebelum Fase 2, bukan diam-diam diasumsikan selalu ada sinyal |

---

## 10. Definition of Done

Aplikasi ini boleh dianggap jujur siap produksi hanya kalau **semua** berikut benar — bukan sebagian:

1. Teh Dede *atau* Mas War menyelesaikan satu siklus penuh (Persiapan atau Kedatangan) **di bawah 20 detik, tanpa pelatihan** — diukur pada pengiriman nyata, bukan uji coba terjadwal.
2. Satu pengiriman pagi nyata tercatat lengkap: `GoodsDeparted` dengan foto → `GoodsReceived` → `ResponsibilityTransferred` — semuanya muncul benar di Operational Timeline.
3. Ayu bisa melihat status pengiriman pagi tanpa bertanya ke siapa pun, saat dia membuka shift.
4. Skenario Acting (Ayah menggantikan Mas War) sudah teruji sekali dengan data nyata, bukan cuma dirancang di atas kertas.
5. Tidak ada satu baris kode pun ditulis untuk mengganti atau menyentuh `KELUAR`/`TERIMA`/`REKAP` yang sudah berjalan di Buku Toko — aplikasi ini berdiri sendiri, sama seperti Dashboard Increment 1.

**Tidak termasuk syarat selesai:** GPS, penanganan offline, mendukung lebih dari dua tujuan, integrasi otomatis ke `KELUAR`/`TERIMA`. Semua itu Fase 2+ ([`operationalization-roadmap-v1.md`](operationalization-roadmap-v1.md) §5, Future Backlog) — bagus kalau nanti ada, tidak menghalangi aplikasi ini dipakai besok pagi.

---

## Frontend — mengikuti Dashboard Design System, tidak mendefinisikan ulang

Tone: Calm, Trustworthy, Fast, Low cognitive load — persis [`dashboard-design-system-v1.md`](../design/dashboard-design-system-v1.md) §2, diterapkan di sini secara harfiah, bukan diinterpretasi ulang:

- **Tidak ada animasi dekoratif.** Transisi hanya untuk status (mengirim → terkirim), tidak ada perayaan.
- **Satu tindakan utama per layar**, bisa dijangkau ibu jari — orang yang membuka aplikasi ini sedang berdiri di gudang atau di jalan, bukan duduk di meja.
- **Foto langsung terlihat setelah diambil**, bukan disembunyikan di belakang tombol "lihat" — kepercayaan datang dari bukti yang terlihat, bukan diklaim.
- **Warna status mengikuti kosakata yang sudah ada** (`ok`/`unavailable`/`blocked`-setara, bukan skema warna baru) — konsisten dengan seluruh Enterprise OS, bukan aplikasi yang terasa asing.
- Kalau Business Identity System ([`workforce-assignment-architecture-v1.md`](../architecture/workforce-assignment-architecture-v1.md), Frontend Addendum) sudah punya arah warna final untuk Toko Sembako, aplikasi ini memakainya — tidak mendefinisikan warna sendiri.

