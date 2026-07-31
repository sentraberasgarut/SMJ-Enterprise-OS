# Session Log — 30–31 Juli 2026

Rekaman keputusan, temuan, dan koreksi dari sesi kerja malam 30 Jul hingga dini hari 31 Jul 2026. Ini bukan dokumen strategi — ini catatan faktual apa yang terjadi dan diputuskan.

---

## Keputusan CEO yang Tercatat

### Strategi pertumbuhan TSS
**Keputusan:** B2B dan B2C dijalankan paralel, bukan berurutan.

- **B2B:** ekspansi ke akun baru — tapi diblokir sampai margin lantai ditetapkan dan harga Papoy ditinjau. Lihat [`ops/pricing/margin-lantai-dan-template-harga-b2b.md`](pricing/margin-lantai-dan-template-harga-b2b.md).
- **B2C:** Threads sebagai kanal utama. Cakupan: spesifik Garut (kirim sendiri, ongkir flat/free), nasional (ekspedisi, ongkir dibayar pembeli, harga harus premium).
- **Marketplace:** ditolak. Fee platform 20–30% tidak viable untuk margin dasar 4–7%.

### Peran per kanal (ditetapkan, belum pernah tertulis sebelumnya)

| Kanal | Peran | Target |
|---|---|---|
| Threads | Kanal utama B2C — cerita, kurasi, transparansi | B2C nasional/regional |
| Instagram | Bukti sosial & arsip perjalanan TSS. Bukan kanal jualan | Semua yang mau verifikasi |
| **Facebook** | **Akuisisi B2B & walk-in lokal Garut** — grup jual-beli, Marketplace | Warung, RM, katering, pesantren |
| WhatsApp | Tempat semua transaksi terjadi | Semua |
| **Google Business Profile** | **Item baru — belum pernah disetel.** Muncul di pencarian lokal | B2B & walk-in |

**Facebook sebagai kanal B2B lokal** adalah pergeseran dari asumsi awal (galeri). Demografi pemilik warung, rumah makan, dan pesantren di Garut ada di Facebook, bukan Threads.

**Google Business Profile belum pernah ada di repo mana pun.** Gratis, relevan untuk walk-in (margin 7,49%), dan ditemukan lewat pencarian "grosir beras Garut". Item yang menunggu dikerjakan.

### Otomasi respons — diputuskan bertahap

| Tingkat | Isi | Status |
|---|---|---|
| 0 | WA Business app: salam, jam kerja, 10 balasan cepat | **Harus dikerjakan segera** |
| 1 | n8n: notifikasi lead belum dibalas >15 mnt | Dikerjakan Claude |
| 2 | Auto-reply komentar Threads via API | Fase 2C, setelah penawaran ada |
| 3 | Chatbot AI WA via BSP | Belum layak |

Tingkat 3 belum layak bukan karena biaya — tapi karena lead hilang bukan karena lambat dibalas, melainkan karena tidak ada penawaran yang bisa disetujui. Chatbot di atas penawaran yang belum ada = lebih banyak lead hilang, lebih cepat.

**Batasan teknis yang terverifikasi dan tidak berubah:**
- DM Threads: tidak ada API pihak ketiga. Permanen manual sampai Meta berubah.
- Node Threads di n8n: belum ada. Butuh HTTP Request node manual.
- WA Business service conversation: gratis sejak mid-2024 kalau respons dalam 24 jam.

### Reset pembukuan TSS — 31 Juli 2026
Cut-off: 31 Juli 2026. Semua mulai dari nilai barang dan uang yang dipegang. Modal Ibu masuk sebagai modal awal, bukan hutang (lihat ADR-0002).

**Porsi modal Aditya vs Ibu belum ditetapkan tertulis.** Ini harus keluar dari proses reset — angkanya baru bisa dihitung setelah opname selesai. Selama porsi tidak tertulis, pembagian hasil tidak punya dasar. Ini blocker untuk semua diskusi distribusi laba ke depan.

---

## Temuan Data — Snapshot 30 Jul 2026 20:40 (27 hari)

Sumber: Google Sheet "Buku Toko dan Central Kitchen", sheet CACHE\_LOKA + MASTER.

| Metrik | Nilai | Catatan |
|---|---|---|
| Margin keseluruhan | 7,21% | — |
| Omzet bulan berjalan | Rp 206.336.203 | — |
| Laba kotor bulan berjalan | Rp 14.873.116 | Bukan laba bersih |
| Proyeksi laba kotor bulan | Rp 16.525.684 | — |
| Konsentrasi Sederhana Jaya | **76,95%** | Turun dari 80,53% — jangan dibaca sebagai kemajuan sampai bertahan 3 bulan |
| Nilai stok | Rp 109.405.977 | — |
| Stok mati (Banyuresmi) | Rp 7.400.000 / 500 unit | Turun dari Rp 10,98 jt |
| Piutang | Rp 562.500 — Papoy saja | Pelanggan margin terburuk = satu-satunya yang masih punya piutang |

### 🔴 Koreksi: Minyak lebih tipis dari Beras

Roadmap v5 dan v6 menyebut beras sebagai kategori margin paling tipis. **Data 30 Jul membuktikan sebaliknya.**

| Kategori | Omzet | Margin |
|---|---|---|
| Bahan Dapur | Rp 44,3 jt | 12,43% |
| Gula | Rp 13,5 jt | 11,90% |
| Kerupuk | Rp 6,2 jt | 8,00% |
| Beras | Rp 127,7 jt | 5,18% |
| **Minyak** | **Rp 14,4 jt** | **4,18%** ← paling tipis |

Implikasi: harga minyak volatil dan sebagian diatur pemerintah (Minyak Kita). Tanpa margin lantai untuk kategori Minyak, satu kenaikan kulakan yang tidak segera diteruskan bisa membuat kategori ini rugi tanpa ada yang mendeteksi.

---

## Deliverable Sesi Ini

File diserahkan via chat. Belum diunggah ke Drive atau repo karena bukan file teks.

| File | Isi | Status |
|---|---|---|
| `FORM_RESET_TSS_31JULI2026.xlsx` | 8 sheet: opname barang, opname uang, piutang/hutang, neraca awal otomatis, biaya/BEP, aturan sistem, log keputusan | Siap diisi 31 Jul |
| `KALKULATOR_MARGIN_LANTAI_TSS.xlsx` | 4 sheet: fakta margin aktual, input margin lantai, kalkulator harga B2B, review Papoy per-SKU | Menunggu input CEO |
| `INSTRUKSI_CLAUDE_v2_31JUL2026.md` | Instruksi baru untuk Settings → Profile dan Project Instructions | Belum ditempel |

---

## Koreksi Sesi Ini (Claude salah, CEO benar)

Dicatat agar tidak terulang.

| Klaim Claude | Kenyataan | Penyebab |
|---|---|---|
| "Walk-in punya plafon, B2B lebih baik" | Walk-in margin 7,49% — lebih tinggi dari 4 dari 5 cabang SJ | Saran diberikan sebelum baca Roadmap v6 |
| "Tambah 3–5 akun B2B = mesin laba" | v6 menempatkan B2B di *Yang TIDAK dikerjakan* — Papoy 3,68% | Sama — tidak baca repo dulu |
| Margin diasumsikan 8% | Keseluruhan 7,21%, Minyak 4,18%, Panawuan 4,8% | Pakai angka dari memori, bukan data |
| Dana Ibu = hutang TSS | Dana Ibu = modal awal (keputusan pemilik) | Asumsi akuntansi konservatif tanpa konfirmasi |
| "Repo permanen = Notion" | GitHub source of truth sejak ADR-0001 | Memory lama |
| Angka "8× UMK terverifikasi" | Rp 16,5 jt adalah proyeksi laba KOTOR. Laba bersih Juli = −Rp 1,4 jt | Tidak membedakan kotor vs bersih |

**Akar masalah yang sama di semua kasus:** saran diberikan sebelum membaca sumber kebenaran. CLAUDE.md v2 memasukkan ini sebagai aturan wajib.

---

## Analisis Pasar — Threads & Marketplace (riset 30 Jul)

Disimpan di sini sebagai referensi, bukan di `ops/` karena bukan keputusan operasional.

**Threads:**
- 450 juta+ MAU. API gratis. Algoritmanya ramah akun kecil — banyak UMKM F&B menemukan jangkauan organik lebih baik dari Instagram.
- Kelemahan: jangkauan nasional untuk produk yang ekonominya hanya masuk akal dalam radius terbatas. Harus dijawab dengan dua struktur penawaran (Garut vs nasional), bukan satu.
- Instagram tetap lebih kuat untuk konversi instan dan etalase visual. Untuk beras — produk kepercayaan, bukan produk visual — Threads lebih tepat.

**Marketplace:**
- Fee 20–30% dari harga jual jika termasuk komisi + ongkir + iklan + afiliasi.
- Beras: berat tinggi, nilai per kilo rendah, margin tipis, tidak ada diferensiasi visual. Kombinasi terburuk untuk marketplace.
- Dengan margin 4–7%, setiap transaksi marketplace rugi sebelum biaya kemasan dihitung.
- Kesimpulan: marketplace tidak dibuka. Kanal langsung (Threads → WA) adalah satu-satunya jalur yang ekonominya positif.
