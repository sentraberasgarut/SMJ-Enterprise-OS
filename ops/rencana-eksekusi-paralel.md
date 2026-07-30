# Adendum 1 Roadmap v6 — Rencana Eksekusi Paralel

**Tanggal:** 30 Juli 2026 (sore)
**Melengkapi:** [Roadmap v6](../roadmap/v6-2026-07-30.md) — tidak menggantikan
**Dasar:** jawaban CEO atas 4 pertanyaan pemblokir

---

## Bagian A — Tiga koreksi terhadap Roadmap v6

Roadmap v6 disusun pagi ini sebelum jawaban CEO masuk. Tiga hal di dalamnya salah dan diperbaiki di sini. Isi v6 yang lain tetap berlaku.

### Koreksi 1 — Central Kitchen bukan wewenang CEO

| v6 (pagi) | Sebenarnya |
| --- | --- |
| "Putuskan dasar harga transfer CK" sebagai keputusan CEO, pemblokir Fase 1B | **Harga dan operasional CK adalah wewenang Ibu dan Teh Nurul.** Scope CEO hanya pencatatan |

Saya menaruh keputusan itu pada orang yang salah, lalu menjadikannya pemblokir. Akibatnya seluruh Fase 1B terlihat macet padahal bagian CEO-nya kecil dan bisa langsung dikerjakan.

**Pembagian yang benar:**

| Bagian | Pemilik |
| --- | --- |
| Harga, resep, biaya, keputusan operasional dapur | **Ibu + Teh Nurul** |
| Struktur pencatatan, katalog, hak akses, notifikasi | **CEO** |
| Rekomendasi — boleh ditolak | [Dokumen untuk Ibu & Teh Nurul](recommendations/central-kitchen-untuk-ibu-dan-teh-nurul.md) |

Juga: CK riil hanya menyuplai **SJ1 dan SJ4**, bukan seluruh cabang. Angka volume di v6 tetap benar, tapi lingkupnya lebih kecil dari yang tersirat.

### Koreksi 2 — Metrik funnel salah sasaran

| v6 (pagi) | Sebenarnya |
| --- | --- |
| Metrik utama: "0 lead lewat 24 jam" | Lead **sudah** dibalas, tetap 0 closing. Metrik ini sudah tercapai — turun jadi higiene |
| Bottleneck: ritme harian | Bottleneck pindah ke **penawaran dan kualifikasi** |

Analisis lengkap: [Funnel System v1](funnel/funnel-system-v1.md). Ringkasnya — funnel ini **tidak punya penawaran yang bisa ditutup.** SBGA memasarkan beras yang belum punya kemasan ritel, harga per 5/10 kg, cakupan kirim, ongkir, cara bayar, maupun minimum order. Percakapan terbaik pun berakhir di jalan buntu.

Lead tidak hilang karena diabaikan. Mereka hilang karena tidak ada yang bisa disetujui.

### Koreksi 3 — Selisih 27 Jul: terjelaskan, bukan kehilangan

CEO mengonfirmasi selisih +Rp2.101.810 disadari dan disengaja — uang penjualan hari sebelumnya yang ada di dompet toko sebelum sistem mulai dipakai.

**Status di audit 30 Jul diubah:** dari `🔴 Blocker — belum dijelaskan` menjadi `✅ Terjelaskan — cacat desain, bukan cacat disiplin`.

Tapi ada temuan **baru** yang menggantikannya dan lebih besar: rantai saldo brankas antar hari tidak tersambung, dan ada **dua tafsir kolom `Kas Tunai` yang berbeda Rp5,8 juta.** Saya tidak bisa memastikan mana yang benar tanpa hitung fisik. Rinciannya di [SPEC Tutup Shift v2](../apps-script/buku-toko/SPEC-tutup-shift-v2.md).

**Satu langkah menyelesaikannya: hitung uang fisik di brankas sekarang.** Kalau sekitar Rp9,2 jt — tidak ada masalah, cuma penamaan kolom. Kalau sekitar Rp1,1 jt — ada Rp5,8 jt yang perlu dijelaskan.

Status temuan #2 (migrasi dompet BRI) juga berubah jadi `✅ Terjawab` — Ibu belanja stok dari rekening BRI yang sama, karena itu rekening khusus bisnis dengan akses Aditya + Ibu. Tidak ada celah dana.

---

## Bagian B — Apakah paralel layak? Ya, dengan satu syarat

CEO ingin operasional dan funnel jalan bersamaan. Risiko yang saya sebutkan pagi ini: bottleneck satu orang.

**Paralel layak — tapi hanya kalau beban harian CEO turun, bukan naik.** Itu berarti tiga hal:

1. **Delegasi nyata, bukan formalitas.** CK sepenuhnya ke Ibu & Teh Nurul. Prosedur kas ke Ayu. Sentuhan 1 dan 3 funnel ke Ayu setelah dilatih.
2. **Aturan ditegakkan sistem, bukan ingatan.** Notifikasi WA otomatis menggantikan CEO yang harus ingat memeriksa.
3. **Beban satu kali diselesaikan lebih dulu, berurutan.** Yang berulang boleh paralel; yang sekali kerja tidak boleh ditumpuk.

### Anggaran waktu CEO

| | Sekali kerja | Berulang |
| --- | --- | --- |
| Kas & tutup shift | ~5 jam | 5 mnt/hari (bisa dibagi dengan Ibu) |
| Central Kitchen | ~1,5 jam | 30 mnt/bulan |
| Funnel | ~2,5 jam | 10 mnt/hari + ~1 jam/bulan |
| **Total** | **~9 jam** | **~15 mnt/hari + ~1,5 jam/bulan** |

Sembilan jam sekali kerja, tersebar 2 minggu. Setelah itu **~15 menit/hari.** Itu yang membuat paralel masuk akal — bukan optimisme.

Kalau 9 jam itu tidak tersedia dalam 2 minggu, **jangan paksa paralel.** Kerjakan kas dulu sampai selesai, funnel menyusul. Setengah-setengah di dua front adalah kegagalan yang sudah tercatat di repo ini.

---

## Bagian C — Urutan kerja dengan ketergantungan

Urutan ini bukan preferensi. Setiap langkah membuka langkah berikutnya.

### 🔴 Hari ini & besok (31 Jul) — jalur kritis

| # | Aksi | Waktu | Membuka |
| --- | --- | --- | --- |
| 1 | **Hitung uang fisik di brankas.** Catat angkanya | 20 mnt | Semua urusan kas. Tanpa titik nol yang benar, tidak ada angka yang bisa dipercaya |
| 2 | **Putuskan: siapa menanggung kalau uang hilang di perjalanan** padahal prosedur diikuti | 15 mnt | Aturan kas. Tanpa ini Ayu akan menghindari setor, diam-diam |
| 3 | **Sampaikan 8 poin ke Ayu** — [bagian 9 runbook](runbook/kustodi-kas-dan-setoran-bri.md) | 30 mnt | Setoran BRI mulai besok |
| 4 | **Cek: ada ATM setor tunai BRI dekat toko?** Kalau tidak ada, seluruh Jenjang B harus dirancang ulang | 15 mnt | Kelayakan runbook |

> Nomor 4 bisa membatalkan desain. Kalau ATM setor tunai terdekat jauh atau tidak ada, alur berjenjang tidak bisa jalan dan harus diganti — misalnya semua uang menginap di brankas dengan batas hari yang lebih ketat. **Cek ini sebelum menyampaikan aturan ke Ayu.**

### 🟠 Minggu 1 (31 Jul – 6 Agt)

| # | Aksi | Waktu | Pemilik |
| --- | --- | --- | --- |
| 5 | **Putuskan 6 angka penawaran ritel SBGA** — ukuran, harga, cakupan kirim, ongkir, cara bayar, minimum order | 90 mnt | CEO |
| 6 | Aplikasi: rantai `Saldo Brankas Awal` dari hari sebelumnya | 90 mnt | CEO |
| 7 | Aplikasi: kolom `Status Setoran` + `GAGAL SETOR` | 60 mnt | CEO |
| 8 | **Serahkan dokumen CK ke Ibu & Teh Nurul.** Minta dibaca, jangan minta jawaban langsung | 20 mnt | CEO |

Nomor 5 adalah pemblokir tunggal seluruh funnel. Setelah itu selesai, **funnel bisa jalan tanpa menambah konten apa pun** — post 25 Jul masih menghasilkan komentar.

### 🟡 Minggu 2 (7–13 Agt)

| # | Aksi | Waktu | Pemilik |
| --- | --- | --- | --- |
| 9 | Aplikasi: notifikasi WA — tutup shift, `GAGAL SETOR` | 90 mnt | CEO |
| 10 | Katalog CK: tandai 19 item AKTIF, betulkan Gudeg dobel | 45 mnt | CEO |
| 11 | Aplikasi: catatan barang kembali / tidak terpakai untuk CK | 45 mnt | CEO |
| 12 | **Latih Ayu**: prosedur kas + gerbang kualifikasi + sentuhan 1 & 3 | 90 mnt | CEO + Ayu |
| 13 | Tetapkan batas wewenang Ayu — angka apa yang boleh dia sebut | 30 mnt | CEO |

Nomor 12 dan 13 yang benar-benar menurunkan beban harian. Sebelum itu semuanya masih di CEO.

### 🟢 Minggu 3–4 (14–27 Agt)

| # | Aksi | Pemilik |
| --- | --- | --- |
| 14 | Notifikasi hari ke-3 menginap + setoran belum diverifikasi > 24 jam | CEO |
| 15 | Pembanding otomatis `Penjualan Tunai` dari `loka-YYYY-MM-DD.json` | CEO |
| 16 | Validasi sebelum simpan tutup shift | CEO |
| 17 | Selesaikan stok mati Rp10,9 jt — `Banyuresmi` & `Bagian` | CEO |
| 18 | Tinjau harga ke Papoy (3,68%) sebelum ekspansi B2B | CEO |
| 19 | Isi harga bahan 5 item CK terbanyak | **Ibu + Teh Nurul, kalau setuju** |

---

## Bagian D — Bagaimana tiap risiko diturunkan

| Risiko | Yang menurunkannya | Sisa risiko yang diterima |
| --- | --- | --- |
| Bottleneck satu orang | Ayu ambil sentuhan 1 & 3 + prosedur kas · Ibu ikut verifikasi setoran · CK didelegasikan penuh | Beban sekali kerja ~9 jam tetap di CEO. Tidak bisa didelegasikan |
| Uang hilang di perjalanan | Batas Rp2 jt · jam aman 18.30 · pendamping di atas Rp5 jt · kebijakan tanggung jawab jelas | Tetap ada. Diturunkan, tidak dihilangkan |
| Uang menginap terlalu lama | Eskalasi otomatis hari ke-3 + notifikasi WA | Bergantung notifikasi benar-benar dipasang |
| ATM menolak uang | Prosedur `GAGAL SETOR` — kembali ke brankas, bukan ke rumah | Bergantung Ayu mengikuti saat panik |
| Setoran tidak cocok mutasi | Verifikasi dua sisi 24 jam oleh Aditya **atau** Ibu | Kalau keduanya sibuk, menumpuk |
| Selisih kas tidak terbaca | Rantai saldo brankas + ambang penjelasan Rp100 rb | Rp5,8 jt yang belum jelas harus diselesaikan dulu |
| CK tidak terukur | Didelegasikan ke pemilik yang benar + mulai dari 5 item, bukan 130 | Ibu & Teh Nurul boleh menolak. Kalau ditolak, CK tetap tidak terukur — dan itu keputusan mereka |
| Lead hilang di jalan buntu | 6 angka penawaran + gerbang kualifikasi + tangga 3 sentuhan | Volume masih terlalu kecil (n=2) untuk belajar apa pun |
| Mengejar lead yang bukan pembeli | Gerbang kualifikasi: penonton tidak masuk Lead Database | Bisa terlalu ketat dan menolak pembeli asli. Pantau |
| Script sync Notion belum diuji | Wajib dry-run dulu, fallback otomatis tanpa token | Belum pernah dieksekusi sama sekali |

---

## Bagian E — Kalau hanya ada waktu untuk satu hal per hari

Urutan ini yang saya sarankan, dan alasannya bukan besarnya dampak — tapi apa yang rusak kalau ditunda.

1. **Cek ATM setor tunai** — bisa membatalkan seluruh desain kas. Cek dulu sebelum bangun apa pun di atasnya
2. **Hitung brankas** — semua angka kas bergantung pada titik nol yang benar
3. **Sampaikan aturan ke Ayu** — setoran mulai besok; aturan yang tidak disampaikan bukan aturan
4. **Putuskan 6 angka penawaran** — setiap hari tanpa ini, komentar yang masuk berakhir di jalan buntu yang sama
5. **Rantai saldo brankas di aplikasi** — perbaikan termurah dengan dampak terbesar
6. **Serahkan dokumen CK** — begitu diserahkan, jalan sendiri tanpa CEO
7. Sisanya menyusul

Empat nomor pertama totalnya **kurang dari 3 jam** dan menutup semua yang benar-benar memblokir. Sisanya boleh berjalan pelan.
