# Execution Backlog — Draft for Review

**Tanggal disusun:** 31 Juli 2026
**Status:** DRAFT — belum direview, belum final.
**Ini BUKAN roadmap.** Roadmap tetap [`roadmap/v6-2026-07-30.md`](../../roadmap/v6-2026-07-30.md) — tidak diubah untuk menyusun dokumen ini.

**Diturunkan dari:** [Active Backlog draft 31 Jul](active-backlog-2026-07-31-draft.md), tanpa menambah atau menghapus task. Reorganisasi dari pengelompokan per Departemen (Finance & Operations / Enterprise OS / Customer Funnel / Automation) menjadi pengelompokan per **Outcome** — hasil bisnis yang ingin dicapai, bukan siapa/tools apa yang mengerjakan. Semua 20 item tetap ada, prioritas tidak berubah.

Tidak ada roadmap atau adendum yang diubah untuk menyusun dokumen ini.

---

## Cara baca tabel

- **Type:** Decision (butuh keputusan, bukan eksekusi) · Implementation (perubahan aplikasi/kode) · Operation (kerja manual/prosedural berulang atau sekali jalan) · Automation (workflow/notifikasi otomatis)
- **Blocked By:** ID item lain di dokumen ini. "—" berarti bisa mulai sekarang.
- **Success Criteria:** kondisi yang menandakan item ini selesai, diambil dari bahasa sumber asli — bukan target baru.

---

## Outcome 1 — Kas Toko Aman, Tercatat, dan Terverifikasi (8 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 1.1 | Hitung uang fisik di brankas — catat angka titik nol | Critical | Operation | CEO | — | Nominal fisik brankas tercatat dan dicocokkan terhadap dua tafsir kolom `Kas Tunai` (~Rp9,2 jt vs ~Rp1,1 jt) |
| 1.2 | Cek ketersediaan ATM setor tunai BRI dekat toko + putuskan siapa menanggung risiko uang hilang di perjalanan | Critical | Decision | CEO | — | Ada/tidaknya ATM dekat toko dikonfirmasi; keputusan tanggung jawab kehilangan uang tertulis |
| 1.3 | Sampaikan aturan kas ke Ayu (8 poin runbook) sebelum berlaku | Critical | Operation | CEO | 1.1, 1.2 | Ayu menerima dan mengonfirmasi paham 8 poin aturan sebelum berlaku 31 Jul |
| 1.4 | Selesaikan selisih Rp5,8 jt antara dua tafsir kolom `Kas Tunai` | High | Operation | CEO | 1.1 | Kolom `Kas Tunai` punya satu tafsir tunggal yang disepakati; selisih Rp5,8 jt terjelaskan atau dikoreksi |
| 1.5 | Aplikasikan rantai `Saldo Brankas Awal` kontinu antar hari di aplikasi | Critical | Implementation | CEO | 1.1 | Saldo brankas hari ini otomatis mengambil saldo akhir hari sebelumnya, tanpa input manual |
| 1.6 | Tambah kolom `Status Setoran` (MENUNGGU VERIFIKASI / COCOK / SELISIH / GAGAL SETOR) | High | Implementation | CEO | — | Setiap baris setoran menampilkan salah satu dari empat status tersebut |
| 1.7 | Cek Apps Script → Executions untuk error rekonsiliasi 29–30 Jul | High | Operation | CEO | — | Log Executions 29–30 Jul diperiksa; penyebab error rekonsiliasi teridentifikasi |
| 1.8 | Notifikasi WA otomatis untuk tutup shift & `GAGAL SETOR` | High | Automation | CEO / Claude | 1.6 | WA otomatis terkirim ke Aditya + Ibu saat status setoran berubah atau `GAGAL SETOR` terjadi |

## Outcome 2 — Struktur Keuangan Grup Jelas: Modal, CK, Margin B2B (3 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 2.1 | Reset pembukuan TSS 31 Juli (opname barang, opname uang, neraca awal) + tetapkan porsi modal Aditya vs Ibu | High | Decision | CEO + Ibu | 1.1 | Form reset TSS terisi lengkap; porsi modal Aditya vs Ibu tertulis |
| 2.2 | Putuskan dasar harga transfer CK → Sederhana Jaya | High | Decision | Ibu + Teh Nurul | — | Satu dari tiga dasar harga (HPP bahan / HPP+tenaga kerja / harga pasar) dipilih |
| 2.3 | Selesaikan konflik ekspansi B2B (pilih Opsi A/B/C) + tinjau harga ke Papoy sebelum akun B2B baru | High | Decision | CEO | — | CEO memilih salah satu dari Opsi A/B/C; harga ke Papoy ditinjau ulang |

## Outcome 3 — Integritas Data Operasional Akurat (1 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 3.1 | Perbaiki bug ID kiriman (Rp455.000 salah tercatat hilang) | Medium | Implementation | CEO | — | Rp455.000 tidak lagi tercatat salah sebagai hilang; bentrok ID format lama tidak lagi terjadi |

## Outcome 4 — Penawaran Ritel SBGA Bisa Ditutup (2 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 4.1 | Putuskan sisa angka penawaran ritel SBGA (ukuran, harga jual per ukuran, cara bayar, minimum order) | Critical | Decision | CEO | — | Empat angka tersisa punya nilai pasti dan tertulis |
| 4.2 | Putuskan apakah harga SBGA boleh berbeda dari harga TSS | Critical | Decision | CEO | Bersamaan dengan 4.1 | Ada jawaban tertulis ya/tidak untuk pertanyaan ini |

## Outcome 5 — Lead Berkualitas Difilter dan Direspons dengan SLA (2 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 5.1 | Terapkan gerbang kualifikasi lead (skor tanda komitmen) ke Lead Database | High | Implementation | CEO | — | Setiap sinyal minat baru diberi skor dan diklasifikasikan PENONTON/HANGAT/PANAS sebelum masuk Lead Database |
| 5.2 | Tetapkan batas wewenang Ayu membalas + latih Ayu (gerbang kualifikasi + tangga follow-up) | High | Decision | CEO + Ayu | 4.1, 5.1 | Ayu tahu angka apa yang boleh disebut; pelatihan gerbang kualifikasi & tangga follow-up selesai |

## Outcome 6 — Pasar Walk-in Tercatat sebagai Aset (1 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 6.1 | Capture nama + WA pelanggan walk-in di kasir | Medium | Operation | CEO / kasir | — | Nama dan nomor WA pelanggan walk-in tercatat untuk transaksi baru |

## Outcome 7 — Respons Pelanggan Terotomasi Bertahap (2 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 7.1 | Aktifkan WhatsApp Business Tingkat 0 (salam, jam kerja, 10 balasan cepat) | High | Automation | CEO | — | Pesan salam, jam kerja, dan 10 balasan cepat aktif di WhatsApp Business |
| 7.2 | Workflow n8n Tingkat 1 — notifikasi lead belum dibalas > 15 menit | Medium | Automation | Claude | 7.1 | Notifikasi WA ke CEO terkirim otomatis saat lead belum dibalas > 15 menit |

## Outcome 8 — Automasi Internal Teruji Sebelum Dipakai (1 item)

| ID | Item | Prioritas | Type | Owner | Blocked By | Success Criteria |
|---|---|---|---|---|---|---|
| 8.1 | Dry-run script sync Notion sebelum dipakai (belum pernah dieksekusi) | Medium | Operation | CEO / Claude | — | Script dijalankan sekali dalam mode dry-run tanpa error sebelum dipakai produksi |

---

**Total item: 20 — sama dengan Active Backlog draft. Tidak ada item ditambah atau dihapus.**

---

*Draft ini belum direview CEO. Tidak menggantikan atau mengubah roadmap, adendum, Active Backlog draft, atau dokumen lain manapun.*
