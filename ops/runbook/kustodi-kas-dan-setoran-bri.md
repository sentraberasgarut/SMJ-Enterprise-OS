# Runbook — Kustodi Kas & Setoran BRI

**Berlaku dari:** 31 Juli 2026
**Menggantikan:** alur `SETOR_IBU` (berakhir 30 Jul 2026)
**Pemilik proses:** Aditya (CEO) · **Pelaksana harian:** kasir yang menutup shift
**Rekening tujuan:** BRI — rekening khusus bisnis, akses Aditya + Ibu

---

## Prinsip

Bisnis yang baik bergantung pada sistem, bukan pemiliknya. Runbook ini dibuat supaya **uang tetap aman dan tetap tercatat saat Aditya dan Ibu sama-sama tidak onsite** — tanpa berpura-pura risikonya nol.

Risiko yang diakui secara terbuka:

| Risiko | Kemungkinan | Ditangani oleh |
| --- | --- | --- |
| Uang hilang di perjalanan ke ATM | Nyata | Batas nominal per perjalanan + jam aman + pendamping |
| ATM setor tunai menolak uang | **Sering terjadi** | Prosedur `GAGAL SETOR` — bagian 5 |
| Uang menginap terlalu lama di toko | Nyata | Batas brankas Rp2 jt + eskalasi otomatis hari ke-3 |
| Setoran tidak cocok dengan mutasi BRI | Nyata | Verifikasi dua sisi dalam 24 jam |
| Uang carry-over tidak masuk hitungan | **Sudah terjadi 27 Jul** | Saldo brankas jadi rantai kontinu — lihat Tutup Shift v2 |

---

## 1. Tiga kantong uang — jangan dicampur

| Kantong | Isi | Batas | Boleh disetor? |
| --- | --- | --- | --- |
| **Kas Kasir** (laci) | Uang kembalian | **Maks Rp 300.000** | Tidak. Ini modal kerja, selalu tinggal |
| **Kas Tunai** (brankas) | Hasil penjualan menunggu setor | **Maks Rp 2.000.000** menginap | Ya |
| **Rekening BRI bisnis** | Tujuan semua setoran | — | — |

Kas Kasir tidak pernah ikut disetor. Setiap shift dimulai dari angka yang sama supaya selisih bisa dibaca.

**Rekening pribadi siapa pun — termasuk Ayu — tidak boleh dipakai sebagai perantara.** Bukan karena tidak percaya, tapi karena begitu uang bisnis masuk rekening pribadi, jejaknya tidak bisa diaudit dan yang dirugikan justru pemilik rekening itu kalau nanti ada selisih.

---

## 2. Alur berjenjang menurut nominal

Dihitung dari **uang di brankas setelah tutup shift**, sudah dikurangi Kas Kasir.

### Jenjang A — Rp 0 s/d Rp 2.000.000

Simpan di brankas. **Tidak perlu keluar toko.**

1. Hitung uang, masukkan ke kantong setor
2. Tulis di kantong: tanggal · nominal · nama · tanda tangan
3. Foto: uang tergelar + kantong tertutup → unggah lewat aplikasi
4. Masukkan brankas, kunci

Disetor oleh Aditya atau Ibu pada kunjungan berikutnya.

### Jenjang B — di atas Rp 2.000.000

**Wajib setor hari itu juga** ke ATM setor tunai BRI terdekat, sebelum kasir pulang.

1. Hitung uang, isi tutup shift di aplikasi dulu — sebelum uang keluar toko
2. Masukkan ke kantong setor, tulis dan tanda tangani
3. Berangkat ke ATM. **Lihat batas jam aman di bagian 4**
4. Setor. Simpan slip ATM — jangan dibuang
5. Foto slip ATM → unggah lewat aplikasi
6. Kirim WA ke Aditya + Ibu: nominal · jam · foto slip

### Jenjang C — di atas Rp 5.000.000

Sama seperti Jenjang B, **tapi tidak boleh berangkat sendirian.** Minta Mas War menemani. Kalau Mas War tidak ada dan tidak ada orang lain yang bisa menemani:

- Setor sebagian saja sampai sisa di brankas turun ke bawah Rp 2 jt, **atau**
- Tahan seluruhnya di brankas dan WA ke Aditya + Ibu malam itu

Uang menginap lebih baik daripada satu orang membawa uang besar sendirian setelah gelap.

### Eskalasi otomatis — hari ke-3

Kalau uang Jenjang A sudah **3 hari kalender** di brankas dan belum ada Aditya atau Ibu yang datang, statusnya naik jadi Jenjang B: kasir wajib setor sendiri hari itu.

Alasannya: batas Rp2 jt melindungi dari nominal besar, tapi tidak melindungi dari waktu. Uang kecil yang menginap seminggu tetap risiko.

---

## 3. Batas teknis ATM setor tunai — baca sebelum berangkat

Mesin setor tunai punya batasan fisik yang sering bikin gagal:

| Batasan | Konsekuensi praktis |
| --- | --- |
| Jumlah lembar per transaksi terbatas | Nominal besar harus dipecah beberapa transaksi |
| Hanya menerima pecahan besar (biasanya Rp50rb & Rp100rb) | **Pecahan kecil dan koin harus disetor lewat teller**, bukan ATM |
| Uang lecek, terlipat, basah, berselotip, dicoret → ditolak | Sortir dulu di toko, jangan di depan mesin |
| Mesin bisa penuh atau offline | Selalu siapkan rencana kedua |

> ⚠️ **Batas persisnya berbeda per mesin dan bisa berubah.** Angka pasti harus dikonfirmasi ke BRI atau dicoba sekali — jangan pakai asumsi. Setelah diketahui, tulis di bagian ini.

**Sortir di toko sebelum berangkat:** pisahkan pecahan besar yang layak mesin dari pecahan kecil/lecek. Yang tidak layak mesin masuk brankas dan disetor lewat teller oleh Aditya atau Ibu.

---

## 4. Jam aman

| Waktu tutup shift | Tindakan |
| --- | --- |
| Sebelum 17.00 | Boleh setor hari itu |
| 17.00 – 18.30 | Boleh setor **hanya jika** ATM searah jalan pulang dan masih terang |
| Setelah 18.30 | **Jangan setor.** Simpan brankas, setor besok pagi sebelum toko buka |

Aturan ini mengalahkan Jenjang B dan C. **Nominal besar tidak pernah menjadi alasan untuk berangkat setelah gelap.** Kalau uang harus menginap karena aturan ini, itu keputusan yang benar — bukan pelanggaran.

---

## 5. Kalau ATM menolak uang — `GAGAL SETOR`

Ini bagian yang paling sering bikin sistem bocor. Tanpa prosedur, uang berakhir di tas seseorang tanpa jejak.

**Yang wajib dilakukan:**

1. **Kembalikan seluruh uang ke kantong setor.** Jangan dipisah, jangan dipakai apa pun
2. Foto kantong + layar ATM kalau ada pesan error
3. **Kembali ke toko. Masukkan ke brankas.** Jangan dibawa pulang ke rumah
4. Catat di aplikasi dengan status **`GAGAL SETOR`** + alasan (mesin penuh / uang ditolak / offline)
5. WA ke Aditya + Ibu malam itu juga

**Uang yang gagal disetor tidak boleh menginap di rumah siapa pun.** Kalau toko sudah tidak bisa diakses, hubungi Aditya atau Ibu untuk instruksi — dan itu dicatat sebagai pengecualian di aplikasi.

---

## 6. Verifikasi dua sisi — dalam 24 jam

Setoran belum dianggap selesai sampai dicek dari sisi rekening.

| Langkah | Pelaku | Batas waktu |
| --- | --- | --- |
| Input nominal setor + foto slip di aplikasi | Kasir | Hari itu |
| Status otomatis `MENUNGGU VERIFIKASI` | Sistem | — |
| Cek mutasi BRI, cocokkan nominal & tanggal | Aditya **atau** Ibu | **24 jam** |
| Tandai `COCOK` atau `SELISIH` | Aditya **atau** Ibu | 24 jam |

**Kenapa dua sisi:** satu orang yang menghitung, mencatat, dan memverifikasi sendiri bukan kontrol — itu cuma pencatatan. Pemisahan ini melindungi kasir sama besar dengan melindungi bisnis: kalau nominal cocok dan tercatat, tidak ada yang bisa dituduh belakangan.

**Kalau `SELISIH`:** jangan langsung menyimpulkan. Urutan pemeriksaan — (1) beda tanggal buku ATM vs tanggal setor, (2) uang ditolak sebagian tapi slip tercetak sebagian, (3) salah hitung di toko, (4) baru kemungkinan lain. Tiga penyebab pertama jauh lebih sering daripada yang keempat.

---

## 7. Rekonsiliasi mingguan

Setiap Minggu malam, cocokkan tiga angka:

1. Total `Setor BRI` dari aplikasi (7 hari)
2. Total kredit masuk di mutasi rekening BRI (7 hari)
3. Saldo brankas fisik saat ini vs yang tercatat di aplikasi

Ketiganya harus bisa dijelaskan. Kalau tidak — **berhenti dan selesaikan sebelum minggu berikutnya.** Selisih yang dibiarkan menumpuk akan mustahil diurai setelah 3 minggu.

---

## 8. 🔴 Keputusan yang harus diambil sebelum aturan ini diberlakukan

**Siapa yang menanggung kalau uang hilang di perjalanan padahal prosedur dijalankan benar?**

Saya sarankan: **bisnis yang menanggung**, selama prosedur diikuti (kantong tertutup, dalam jam aman, foto lengkap, nominal sesuai jenjang).

Alasannya bukan kebaikan hati — ini soal apakah aturannya akan jalan. Kalau kasir menanggung risiko kehilangan, dia akan **menghindari setor** dan diam-diam menyimpan uang di toko atau di rumah, dan sistem ini mati dalam dua minggu tanpa Anda tahu. Risiko yang dipindahkan ke orang yang tidak bisa menanggungnya tidak hilang — dia cuma jadi tidak terlihat.

Sebaliknya, kalau prosedur **tidak** diikuti (berangkat setelah gelap, uang dibawa pulang, tidak ada foto), konsekuensinya perlu jelas sejak awal.

> ⚠️ **Saya bukan ahli hukum.** Tanggung jawab karyawan atas kehilangan uang perusahaan punya sisi hukum ketenagakerjaan di Indonesia yang saya tidak bisa nilai. Kalau hal ini dituangkan jadi aturan tertulis yang mengikat, sebaiknya dicek dulu ke orang yang paham. Rekomendasi saya di atas berbasis logika kontrol internal, bukan pertimbangan hukum.

**Sampaikan keputusannya ke Ayu secara eksplisit sebelum 31 Jul.** Aturan yang tidak disampaikan bukan aturan.

---

## 9. Yang harus disampaikan ke Ayu hari ini

Ringkas, tanpa istilah teknis:

1. Mulai 31 Juli, uang tutup shift **tidak lagi disetor ke Ibu** — masuk rekening BRI bisnis
2. Kalau uang di brankas **di bawah Rp 2 juta** → simpan brankas, tidak perlu ke mana-mana
3. Kalau **di atas Rp 2 juta** → setor ke ATM setor tunai hari itu, kecuali sudah lewat jam 18.30
4. **Lewat 18.30 jangan pernah berangkat.** Simpan brankas, setor besok pagi
5. **Di atas Rp 5 juta jangan sendirian** — minta Mas War menemani, atau tahan di brankas
6. Kalau **ATM menolak uang** → bawa kembali ke brankas toko, jangan dibawa pulang, lapor WA malam itu
7. **Selalu foto**: uang tergelar, kantong, dan slip ATM
8. Isi tutup shift di aplikasi **sebelum** uang keluar toko

Dan yang paling penting untuk dia dengar: **kalau ragu, tahan uangnya di brankas dan lapor.** Menahan uang di brankas bukan kesalahan. Yang jadi masalah cuma kalau uang berpindah tanpa dicatat.

---

## Perubahan yang dibutuhkan di aplikasi

Runbook ini belum bisa jalan penuh dengan struktur `Tutup Shift` yang sekarang. Yang perlu ditambah ada di [SPEC-tutup-shift-v2.md](../../apps-script/buku-toko/SPEC-tutup-shift-v2.md):

- Kolom `Setor BRI` sudah ada — perlu status `MENUNGGU VERIFIKASI` / `COCOK` / `SELISIH` / `GAGAL SETOR`
- Saldo brankas harus jadi **rantai kontinu** antar hari, bukan angka lepas
- Notifikasi WA otomatis ke Aditya + Ibu saat ada setoran atau `GAGAL SETOR`
- Peringatan otomatis saat uang Jenjang A sudah 3 hari di brankas
