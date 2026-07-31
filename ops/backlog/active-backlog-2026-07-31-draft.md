# Active Backlog — Draft for Review

**Tanggal disusun:** 31 Juli 2026
**Status:** DRAFT — belum direview, belum final, belum menggantikan dokumen manapun.
**Ini BUKAN roadmap.** Roadmap tetap [`roadmap/v6-2026-07-30.md`](../../roadmap/v6-2026-07-30.md). Dokumen ini adalah daftar kerja aktif, disaring dari lima sumber di bawah, berisi hanya pekerjaan yang belum selesai.

**Sumber:**
- [Roadmap v6](../../roadmap/v6-2026-07-30.md)
- [Adendum 1 — Rencana Eksekusi Paralel](../rencana-eksekusi-paralel.md)
- [Adendum 2 — Cakupan B2C & Koreksi Arah](../adendum-2-kanal-b2c-dan-koreksi-arah.md)
- [Session Log 30–31 Jul](../session-log-30-31-jul-2026.md)
- [Funnel System v1](../funnel/funnel-system-v1.md)

Tidak ada dokumen yang diubah untuk menyusun backlog ini.

---

## Cara baca tabel

- **Prioritas:** Critical (menghalangi segalanya, jatuh tempo) · High (menghalangi jalur berikutnya) · Medium (penting, tidak menghalangi) · Low (boleh menyusul)
- **Dependency:** item lain di backlog ini yang harus selesai dulu. "—" berarti bisa mulai sekarang.
- **Owner:** siapa yang mengeksekusi, bukan siapa yang menyetujui.

---

## A. Finance & Operations (7)

| # | Item | Prioritas | Dependency | Owner |
|---|---|---|---|---|
| F1 | Hitung uang fisik di brankas — catat angka titik nol | Critical | — | CEO |
| F2 | Cek ketersediaan ATM setor tunai BRI dekat toko + putuskan siapa menanggung risiko uang hilang di perjalanan | Critical | — | CEO |
| F3 | Sampaikan aturan kas ke Ayu (8 poin runbook) sebelum berlaku | Critical | F1, F2 | CEO |
| F4 | Selesaikan selisih Rp5,8 jt antara dua tafsir kolom `Kas Tunai` | High | F1 | CEO |
| F5 | Reset pembukuan TSS 31 Juli (opname barang, opname uang, neraca awal) + tetapkan porsi modal Aditya vs Ibu | High | F1 | CEO + Ibu |
| F6 | Putuskan dasar harga transfer CK → Sederhana Jaya | High | — | Ibu + Teh Nurul |
| F7 | Selesaikan konflik ekspansi B2B (pilih Opsi A/B/C) + tinjau harga ke Papoy (3,68%) sebelum akun B2B baru | High | — | CEO |

## B. Enterprise OS (4)

| # | Item | Prioritas | Dependency | Owner |
|---|---|---|---|---|
| E1 | Aplikasikan rantai `Saldo Brankas Awal` kontinu antar hari di aplikasi | Critical | F1 | CEO |
| E2 | Tambah kolom `Status Setoran` (MENUNGGU VERIFIKASI / COCOK / SELISIH / GAGAL SETOR) | High | — | CEO |
| E3 | Cek Apps Script → Executions untuk error rekonsiliasi 29–30 Jul | High | — | CEO |
| E4 | Perbaiki bug ID kiriman (Rp455.000 salah tercatat hilang) | Medium | — | CEO |

## C. Customer Funnel (5)

| # | Item | Prioritas | Dependency | Owner |
|---|---|---|---|---|
| C1 | Putuskan sisa angka penawaran ritel SBGA (ukuran, harga jual per ukuran, cara bayar, minimum order — cakupan kirim & ongkir sudah diputuskan) | Critical | — | CEO |
| C2 | Putuskan apakah harga SBGA boleh berbeda dari harga TSS | Critical | Bersamaan dengan C1 | CEO |
| C3 | Terapkan gerbang kualifikasi lead (skor tanda komitmen) ke Lead Database | High | — | CEO |
| C4 | Tetapkan batas wewenang Ayu membalas + latih Ayu (gerbang kualifikasi + tangga follow-up) | High | C1, C3 | CEO + Ayu |
| C5 | Capture nama + WA pelanggan walk-in di kasir | Medium | — | CEO / kasir |

## D. Automation (4)

| # | Item | Prioritas | Dependency | Owner |
|---|---|---|---|---|
| A1 | Aktifkan WhatsApp Business Tingkat 0 (salam, jam kerja, 10 balasan cepat) | High | — | CEO |
| A2 | Notifikasi WA otomatis untuk tutup shift & `GAGAL SETOR` | High | E2 | CEO / Claude |
| A3 | Workflow n8n Tingkat 1 — notifikasi lead belum dibalas > 15 menit | Medium | A1 | Claude |
| A4 | Dry-run script sync Notion sebelum dipakai (belum pernah dieksekusi) | Medium | — | CEO / Claude |

**Total item aktif: 20**

---

## Dikeluarkan dari backlog karena sudah selesai (referensi, bukan bagian backlog)

| Item | Sumber status selesai |
|---|---|
| Dana Ibu beli stok setelah setoran pindah BRI | Adendum 1 — terjawab, rekening BRI bisnis akses Aditya+Ibu |
| Penjelasan selisih tutup shift 27 Jul +Rp2.101.810 | Adendum 1 — terjelaskan (uang penjualan hari sebelumnya, bukan kehilangan) |
| Metrik "0 lead lewat 24 jam" | Adendum 1 & Funnel v1 — tercapai, turun status jadi higiene dipertahankan, bukan dikejar |
| Kode Apps Script masuk repo | File ada di `apps-script/buku-toko/` |
| Cakupan geografis B2C (Garut vs nasional) | Adendum 2 §2.1 — diputuskan |
| Peran per kanal (Threads/IG/FB/WA/GBP) | Session Log & Adendum 2 — ditetapkan |

---

## Item yang sengaja tidak dimasukkan (di luar 20, untuk transparansi)

Prioritas lebih rendah menurut dokumen sumber, dipangkas untuk menjaga batas 20 item:

- Bersihkan duplikat katalog CK (tandai 19 item AKTIF, betulkan Gudeg dobel, rapikan kelompok "Tambahan")
- Isi harga bahan 5 item CK terbanyak
- Selesaikan stok mati Rp7,4 jt (`Banyuresmi` & `Bagian`)
- Ukur beli-ulang walk-in
- Setel Google Business Profile TSS
- Gabung 3 grup jual-beli Facebook Garut
- Isi `Unit Dilihat` untuk 6 pengguna kosong + aturan akses lintas unit
- Ambil `Peran` dari sheet `Pengguna`, bukan konteks aksi
- Tambah catatan barang kembali/tidak terpakai untuk CK
- Publish 1 post/minggu dari draft (gated di belakang C1–C4)
- Auto-reply komentar Threads via HTTP node (Tingkat 2, gated Fase 2C)

---

*Draft ini belum direview CEO. Tidak menggantikan atau mengubah roadmap, adendum, atau dokumen lain manapun.*
