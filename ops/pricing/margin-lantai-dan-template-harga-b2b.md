# Margin Lantai & Template Harga B2B

**Tanggal:** 30 Juli 2026 (malam)
**Status:** Menunggu keputusan CEO
**Asal:** Keputusan CEO memilih **Opsi A** dari [Adendum 2](../adendum-2-kanal-b2c-dan-koreksi-arah.md) — tinjau harga Papoy & tetapkan margin lantai sebelum ekspansi B2B
**Sumber data:** `Buku Toko dan Central Kitchen`, sheet `CACHE_LOKA` + `MASTER`, snapshot 30 Jul 2026 20:40, 27 hari data

---

## 🔴 Temuan baru — Minyak marginnya lebih buruk daripada Beras

Belum pernah muncul di repo mana pun. Roadmap v5 dan v6 keduanya menyebut **beras** sebagai kategori dengan margin paling tipis. Data 30 Jul membantahnya.

| Kategori | Omzet | Margin |
| --- | --- | --- |
| Air | Rp 72.000 | 42,12% |
| Makanan | Rp 105.000 | 28,57% |
| Bahan Dapur | Rp 44.298.103 | 12,43% |
| Gula | Rp 13.546.000 | 11,90% |
| Kerupuk | Rp 6.200.000 | 8,00% |
| **Beras** | **Rp 127.727.600** | **5,18%** 🔴 |
| **Minyak** | **Rp 14.411.000** | **4,18%** 🔴🔴 |

**Minyak: omzet Rp14,4 juta menghasilkan laba kotor Rp601.770.** Itu 4,18% — lebih tipis daripada beras, dan sepertiga dari Bahan Dapur.

Kenapa ini penting dan bukan sekadar detail: harga minyak goreng bergerak cepat dan sebagian diatur pemerintah (Minyak Kita). Margin 4,18% berarti **satu kali kenaikan harga kulakan yang tidak segera diteruskan ke harga jual bisa membuat kategori ini rugi tanpa terdeteksi**, karena tidak ada margin lantai yang memicu peringatan.

⚠️ Volume Air dan Makanan terlalu kecil (Rp72rb dan Rp105rb) untuk disimpulkan apa pun. Jangan dijadikan dasar keputusan.

---

## Angka acuan lain per 30 Jul 20:40

| Metrik | Nilai | Perubahan dari v6 (data 29 Jul) |
| --- | --- | --- |
| Margin keseluruhan | 7,21% | tetap |
| Omzet bulan berjalan | Rp 206.336.203 | naik dari Rp202,0 jt |
| Laba kotor bulan berjalan | Rp 14.873.116 | naik dari Rp14,55 jt |
| Proyeksi laba kotor bulan | Rp 16.525.684 | turun tipis dari Rp16,79 jt |
| **Konsentrasi Sederhana Jaya** | **76,95%** | **turun dari 80,53%** |
| Nilai stok | Rp 109.405.977 | — |
| Stok mati | Rp 7.400.000 (Banyuresmi, 500 unit) | turun dari Rp10,98 jt |
| Piutang | Rp 562.500 (Papoy) | turun dari Rp3,45 jt |

**Konsentrasi turun ke 76,95%.** Arahnya benar, tapi masih jauh di atas ambang bahaya (>25% sudah merah). Turunnya kemungkinan besar karena komposisi bulan berjalan, bukan karena diversifikasi berhasil — jangan dibaca sebagai kemajuan sampai bertahan 3 bulan.

**Piutang tersisa hanya Papoy Rp562.500.** Ini memperkuat argumen tinjau harga: pelanggan dengan margin terburuk juga satu-satunya yang punya piutang berjalan.

---

## Batasan data — dibaca sebelum memakai angka apa pun

**Data harga per-SKU untuk Papoy TIDAK tersedia** di export Buku Toko. Yang ada hanya margin agregat per pelanggan. Sheet `MASTER` memuat daftar harga, tapi kolom `Sumber Harga` seluruhnya bertanda `SJ` — itu daftar harga ke Sederhana Jaya, bukan ke Papoy.

Artinya: **tidak mungkin menghitung harga baru Papoy tanpa input manual CEO** dari nota atau riwayat transaksi. Kalkulator sudah disiapkan; angkanya harus diisi tangan.

**HPP per item juga tidak lengkap.** Yang terbaca hanya dari daftar stok menipis: Merah Rp14.500 · Garam Bison Rp1.450 · Garam Kereta Rp1.425 · Minyak Kita 2L Rp37.500 · Minyak Fortune Rp40.835 · Terigu Sip Rp6.880 · Banyuresmi Rp14.800. Sisanya kosong.

---

## Usulan margin lantai — keputusan tetap milik CEO

Ini titik awal untuk didiskusikan, **bukan hasil riset harga pasar**. Tidak ada data harga pesaing di repo.

### Per kategori

| Kategori | Sekarang | Usulan lantai | Alasan |
| --- | --- | --- | --- |
| Beras | 5,18% | 7% | 62% omzet; kenaikan 1,8 poin di sini paling besar dampaknya |
| Minyak | 4,18% | 6% | harga volatil, tanpa lantai bisa rugi tanpa terdeteksi |
| Bahan Dapur | 12,43% | 10% | sudah sehat, lantai hanya penjaga |
| Gula | 11,90% | 10% | sudah sehat |
| Kerupuk | 8,00% | 7% | sudah sehat |

### Per tipe pelanggan

| Tipe | Contoh | Usulan lantai |
| --- | --- | --- |
| Cabang keluarga | SJ1–SJ5 | 7% |
| **B2B luar keluarga** | **Papoy, RM lain** | **9%** |
| Eceran walk-in | — | 8% |
| B2C online (SBGA) | — | 15% |

**Kenapa B2B luar keluarga harus lebih tinggi daripada cabang sendiri** — ini berlawanan dengan naluri, jadi alasannya perlu eksplisit:

Cabang keluarga adalah pendapatan yang tetap berputar di dalam grup. Margin tipis di sana memindahkan laba dari TSS ke rumah makan, tapi uangnya tidak keluar. B2B luar keluarga tidak punya kompensasi itu — kalau harganya salah, uangnya benar-benar hilang. Papoy di 3,68% kemungkinan besar sudah merugi setelah biaya antar dihitung, dan itu belum pernah diukur.

---

## Lima pertanyaan yang harus dijawab sebelum harga Papoy diubah

1. Sudah berapa lama Papoy jadi pelanggan, dan apa alasan harga serendah ini disepakati dulu?
2. Apakah Papoy tahu harga pesaing? Kalau naik 5%, dia pindah atau tetap?
3. Papoy bayar tunai atau tempo? (piutang Rp562.500 per 29 Jul)
4. Apakah TSS mengantar ke Papoy, dan biaya antar sudah masuk hitungan HPP?
5. Kalau Papoy hilang — TSS kehilangan Rp4,7 jt omzet, atau justru berhenti rugi?

Pertanyaan 4 dan 5 yang paling menentukan. Margin 3,68% sebelum biaya antar bisa berarti margin negatif sesudahnya.

---

## Gerbang keluar — kapan ekspansi B2B boleh dimulai

Semua harus terpenuhi, diverifikasi ke sumber nyata:

- [ ] Margin lantai per kategori diputuskan dan tertulis
- [ ] Margin lantai per tipe pelanggan diputuskan dan tertulis
- [ ] Lima pertanyaan Papoy terjawab
- [ ] Harga Papoy ditinjau — dinaikkan, dipertahankan dengan alasan tertulis, atau dilepas
- [ ] Biaya antar per pelanggan diketahui, minimal perkiraan kasar
- [ ] Kalkulator harga terisi untuk minimal 10 SKU yang paling sering dipesan B2B

Kalau gerbang tidak lolos, **jangan mulai mencari pelanggan B2B baru.** Repo ini punya sejarah menandai sesuatu selesai karena dokumennya dibuat.

---

## Alat

**`KALKULATOR_MARGIN_LANTAI_TSS.xlsx`** — 4 sheet, diserahkan ke CEO via chat, belum diunggah ke Drive:

1. `01_FAKTA` — margin per kategori & per pelanggan dari data nyata, read-only
2. `02_MARGIN_LANTAI` — CEO isi angka lantai yang diputuskan
3. `03_KALKULATOR_HARGA` — isi HPP + lantai, keluar harga minimum & status OK / DI BAWAH LANTAI
4. `04_REVIEW_PAPOY` — isi per-SKU, keluar dampak rupiah per bulan

Rumus sudah diuji: HPP Rp358.000 + lantai 7% → harga minimum Rp384.946; harga Rp387.500 → margin 7,61% → OK. Minyak HPP Rp232.000 + lantai 6% → harga Rp240.000 → margin 3,33% → DI BAWAH LANTAI.
