# Adendum 2 — Cakupan B2C, Peran Kanal, dan Koreksi Arah B2B

**Tanggal:** 30 Juli 2026 (malam)
**Status:** Berlaku · mengamandemen [Roadmap v6](../roadmap/v6-2026-07-30.md)
**Berlaku bersama:** [Adendum 1 — Rencana Eksekusi Paralel](rencana-eksekusi-paralel.md)

> **Ini adendum, bukan roadmap baru.** Arah 30 hari v6 tidak berubah: Fokus 1 operasional, Fokus 2 funnel sebagai sistem. Yang ditambahkan di sini adalah keputusan cakupan kanal yang sebelumnya tidak pernah ditetapkan, plus satu koreksi terhadap saran yang diberikan Claude dalam sesi ini sebelum data repo dibaca.

---

## 1. Koreksi terhadap saran Claude — sesi 30 Jul malam

Claude memberikan analisis strategis pada sesi ini **sebelum membaca Roadmap v6 dan data margin per pelanggan**. Empat hal perlu dicatat sebagai salah, agar tidak masuk ke keputusan turunan.

| Yang disarankan Claude | Kenyataan di repo | Sumber |
| --- | --- | --- |
| "Toko fisik walk-in punya plafon; pertumbuhan harus lewat channeling B2B" | Walk-in margin **7,49%**, lebih tinggi dari 4 dari 5 cabang Sederhana Jaya. Walk-in bukan sisa | v6, tabel margin per pelanggan, 29 Jul |
| "Tambah 3–5 akun B2B baru adalah mesin laba" | v6 menempatkan ekspansi B2B di **"Yang TIDAK dikerjakan"** — Papoy, satu-satunya B2B non-keluarga, margin **3,68%**, terburuk. Template harga harus diperbaiki dulu | v6, §Yang TIDAK dikerjakan |
| Margin kotor diasumsikan ±8% | Margin keseluruhan **7,20%**; Panawuan **4,8%** | v6, Baseline 30 Jul |
| "Repo permanen = Notion" | Dibalik hari ini oleh **ADR-0001**: GitHub source of truth, Notion mirror read-only | ADR-0001 |

**Pelajaran proses:** saran strategis diberikan tanpa membaca sumber kebenaran lebih dulu. Aturan yang berlaku mulai sekarang — **baca `roadmap/` + `adr/` sebelum memberi rekomendasi arah, bukan sesudah.**

---

## 2. Keputusan CEO yang tercatat malam ini

### 2.1 Cakupan geografis B2C — DIPUTUSKAN

**Spesifik Garut, umumnya nasional.**

Artinya dua penawaran berbeda, bukan satu:

| | Dalam Garut | Luar Garut (nasional) |
| --- | --- | --- |
| Pengiriman | Kendaraan sendiri | Ekspedisi |
| Ongkir | Ditanggung/flat, jarak dekat | **Dibayar pembeli**, tanpa subsidi |
| Harga | Boleh mendekati harga toko | **Harus premium** — biaya kemasan & penanganan lebih tinggi |
| Ukuran | 5 kg dan 10 kg | 5 kg saja pada awalnya — 10 kg terlalu mahal ongkirnya |
| Minimum order | Rendah | Lebih tinggi, agar ongkir masuk akal per kg |

Ini menutup angka nomor 3 dan sebagian nomor 4 dari **enam angka penawaran ritel** di v6. **Empat angka masih memblokir: ukuran, harga jual per ukuran, cara bayar, minimum order.**

### 2.2 Peran per kanal — DITETAPKAN

Sebelumnya tidak pernah ditulis di repo mana pun. Kanal dipakai tanpa definisi peran, sehingga tidak ada cara menilai kanal mana yang bekerja.

| Kanal | Peran | Yang diukur |
| --- | --- | --- |
| **Threads** | Kanal utama B2C — cerita, kurasi, transparansi harga | Sinyal minat masuk |
| **Instagram** | Bukti sosial & arsip perjalanan TSS. Bukan kanal jualan | — (higiene) |
| **Facebook** | **Akuisisi B2B & walk-in lokal Garut** — grup jual-beli, Marketplace | Percakapan lokal masuk |
| **WhatsApp** | Tempat semua transaksi terjadi | Percakapan mencapai penawaran konkret |
| **Google Business Profile** | Ditemukan pencarian lokal ("grosir beras Garut") | Belum pernah disetel — item baru |

**Perubahan dari asumsi sebelumnya:** Facebook semula diperlakukan sebagai galeri. Demografi pemilik warung, rumah makan, katering, dan pengurus pesantren di Garut ada di Facebook, bukan Threads — itu persis segmen B2B dan walk-in. Menjadikannya galeri membuang kanal yang paling dekat dengan pelanggan paling menguntungkan.

**Google Business Profile belum pernah masuk repo sama sekali.** Gratis, dan menyangkut pencarian lokal untuk toko fisik yang marginnya justru terbaik.

---

## 3. Otomasi respons — batasan teknis & tahapan

### 3.1 Batasan yang sudah diverifikasi

| Kemampuan | Status | Catatan |
| --- | --- | --- |
| Balas **komentar** Threads otomatis | ✅ Bisa | Threads API mendukung reply management |
| Balas **DM** Threads otomatis | ❌ **Tidak bisa** | Threads tidak menyediakan DM API untuk pihak ketiga. DM tetap manual, selamanya sampai Meta mengubahnya |
| Node Threads di n8n | ❌ Belum ada | Sudah tercatat 23 Jul. Perlu HTTP Request node manual |
| Chatbot WhatsApp | ✅ Bisa | Perlu WhatsApp Business API + BSP |
| Notifikasi lead belum dibalas | ✅ Bisa | n8n, kredensial sudah ada |

### 3.2 Tahapan — jangan loncat

| Tingkat | Isi | Biaya | Kapan |
| --- | --- | --- | --- |
| **0** | WhatsApp Business (app biasa): pesan salam, pesan di luar jam kerja, 10 balasan cepat | Rp 0 | Segera |
| **1** | Notifikasi n8n: lead belum dibalas > 15 menit → WA ke CEO | Rp 0 | Setelah Tingkat 0 |
| **2** | Auto-reply komentar Threads via API, pola voice tervalidasi | Rp 0 | Fase 2C |
| **3** | Chatbot AI WhatsApp via BSP | ±Rp 425 rb/bln | **Belum layak** |

**Tingkat 3 belum layak, dan alasannya bukan biaya.** v6 sudah mendiagnosis: *lead tidak hilang karena diabaikan — mereka hilang karena tidak ada yang bisa disetujui.* Chatbot di atas penawaran yang belum ada akan menghasilkan lebih banyak lead hilang, lebih cepat, dengan nada yang lebih meyakinkan. **Empat angka penawaran harus diputuskan sebelum otomasi respons apa pun di atas Tingkat 1.**

---

## 4. Ekonomi kanal langsung — kenapa marketplace tetap ditolak

Perhitungan ini melengkapi keputusan v6 dan menjawab pertanyaan CEO apakah marketplace bisa jadi jalur pertumbuhan.

Riset biaya marketplace Indonesia 2026: komisi platform + biaya pemrosesan pesanan + kontribusi gratis ongkir + iklan + afiliasi dapat mencapai **lebih dari 30% harga jual**. Beras adalah kombinasi terburuk: berat tinggi, nilai per kilo rendah, margin tipis, tanpa diferensiasi visual.

| | Marketplace | Threads/WA langsung |
| --- | --- | --- |
| Fee platform | 20–30% | **0%** |
| Ongkir | Disubsidi/dipaksa gratis | Dibayar pembeli |
| Risiko retur COD | Ditanggung penjual | Tidak ada |

**Kesimpulan: marketplace tidak dibuka.** Kanal langsung (Threads → WA) menghapus fee platform, dan itu satu-satunya alasan ekonominya bisa positif pada produk dengan margin dasar 4,8–7,2%.

⚠️ Angka laba per transaksi **belum bisa dihitung** sampai harga ritel diputuskan. Jangan pakai perkiraan mana pun sebagai dasar keputusan.

---

## 5. 🔴 KONFLIK — menunggu keputusan CEO

Pada sesi ini CEO menyetujui **"fokus membangun akun B2B baru"** berdasarkan analisis Claude yang belum memakai data margin repo.

**v6 menyatakan sebaliknya:** ekspansi B2B ke restoran lain masuk daftar *Yang TIDAK dikerjakan*, sampai harga ke Papoy ditinjau dan margin lantai per pelanggan ditetapkan.

Dua-duanya tidak bisa berlaku bersamaan. Ini persis pola kontradiksi 24 vs 27 Jul yang sudah tercatat di repo, dan tidak akan diselesaikan diam-diam.

| Opsi | Konsekuensi |
| --- | --- |
| **A. Ikuti v6** — tinjau harga Papoy & tetapkan margin lantai dulu, baru cari B2B baru | Ekspansi mundur ±2 minggu. Setiap akun baru masuk dengan harga yang benar |
| **B. Ikuti keputusan sesi ini** — cari B2B baru sekarang | Risiko mengulang pola Papoy 3,68%. Omzet naik, laba bisa turun |
| **C. Alihkan ke walk-in** — margin 7,49%, sudah jadi prioritas di Fase 2B v6 | Tidak ada konflik. Tapi bukan yang CEO minta |

**Rekomendasi Claude: Opsi A.** Bukan karena B2B salah — B2B tetap benar sebagai arah. Tapi menambah pelanggan dengan template harga yang belum diperbaiki adalah menambah masalah dengan lebih rapi. Dua minggu untuk menetapkan margin lantai jauh lebih murah daripada tiga kontrak B2B di harga Papoy.

**Status: TERBUKA. Tidak ada pekerjaan ekspansi B2B dimulai sampai CEO memilih.**

---

## 6. Yang tidak berubah

- Fokus 1 (operasional TSS + CK) tetap prioritas waktu
- Freeze konten tetap berlaku sampai gerbang Fase 2A lolos
- Metrik utama tetap: 3 percakapan mencapai penawaran konkret dalam 30 hari
- Tiga pemblokir v6 tetap terbuka: dana belanja stok Ibu, dasar harga transfer CK, enam angka penawaran ritel
- Tidak ada brand baru diaktifkan

---

## 7. Item baru yang masuk backlog

| # | Item | Fase | Pemilik |
| --- | --- | --- | --- |
| 1 | Setel Google Business Profile TSS | 2B | CEO, ±30 mnt |
| 2 | WhatsApp Business Tingkat 0 (salam + 10 balasan cepat) | 2A | CEO, ±30 mnt |
| 3 | Workflow notifikasi lead n8n | 2A | Claude |
| 4 | Gabung 3 grup jual-beli Facebook Garut | 2B | CEO |
| 5 | Auto-reply komentar Threads via HTTP node | 2C | Claude, setelah penawaran ada |
