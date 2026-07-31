# Pola Kegagalan — Dokumentasi untuk Referensi Ke Depan

**Dibuat:** 31 Juli 2026
**Sumber:** Observasi dari sesi kerja 20 Jul – 31 Jul 2026
**Tujuan:** Kalau pola ini terulang, repo ini yang pertama mendeteksinya

---

## Pola 1: Botram

**Definisi:** Sistem selesai dibangun, playbook selesai ditulis, data tercatat dengan baik — lalu tidak ada yang terjadi karena follow-up tidak dilakukan pada waktunya.

**Contoh dari sesi ini:** Content Pipeline SBGA di Notion berisi draft konten yang tidak pernah di-approve karena tidak ada tanggal review yang ditetapkan. Formulir dan kalkulator diserahkan — kalau tidak ada deadline reset yang nyata, akan bernasib sama.

**Cara deteksi:** Cari dokumen yang statusnya "draft" atau "menunggu" lebih dari 7 hari tanpa ada commit berikutnya.

**Pencegahan:** Setiap deliverable harus punya satu dari dua hal: tanggal review yang ditetapkan, atau kriteria keluar yang jelas. Kalau tidak ada salah satunya, jangan dibuat.

---

## Pola 2: Documentation-Heavy, Outcome-Light

**Definisi:** Energi dihabiskan membangun *tentang* bisnis — brand guideline, playbook, knowledge base, framework — daripada membangun bisnis itu sendiri.

**Manifestasi dalam repo ini:** Roadmap v5 mencatat Buku Toko sebagai "tugas Fase 0 yang belum dikerjakan" padahal aplikasinya sudah produktif dengan 8 pengguna aktif. Repo ketinggalan dari lapangan, bukan sebaliknya.

**Rasio yang benar (belum ditetapkan, ini usulan):** Satu jam membangun sistem untuk setiap tiga jam eksekusi yang menghasilkan transaksi atau pelanggan nyata.

**Cara deteksi:** Hitung commit ke repo dalam seminggu. Kalau lebih banyak dari jumlah percakapan pelanggan yang terjadi minggu itu, repositionya terbalik.

---

## Pola 3: Done Karena Dokumen Ditulis

**Definisi:** Status pekerjaan berubah menjadi "selesai" karena file-nya sudah ada, bukan karena hasilnya sudah diverifikasi ke sumber nyata.

**Contoh historis:** CEO Memo pernah mengklaim nol konten dipublish padahal SBGA sudah live di Threads. Dokumen ditulis, status berubah, kenyataan tidak diperiksa.

**Cara deteksi:** Sebelum mengubah status jadi "done", tanyakan: dari mana kamu tahu ini benar? Kalau jawabannya "karena saya baru menulisnya" — belum selesai.

**Aturan repo:** Status hanya berubah setelah verifikasi ke sumber nyata. Ini aturan governance yang sudah ada sejak 24 Jul 2026 dan tetap berlaku.

---

## Pola 4: Saran Tanpa Baca Repo Dulu

**Definisi:** Rekomendasi strategis diberikan berdasarkan memori atau analisis umum, tanpa membaca roadmap aktif dan ADR yang berlaku.

**Contoh dari sesi ini (Claude, 30 Jul):** Empat rekomendasi diberikan yang semuanya bertentangan dengan data repo:
1. "Walk-in punya plafon, B2B lebih baik" → walk-in margin 7,49%, lebih baik dari 4/5 cabang SJ
2. "Tambah 3–5 akun B2B = mesin laba" → v6 menempatkan B2B di *Yang TIDAK dikerjakan*
3. Margin diasumsikan 8% → aktual 7,21%, Minyak 4,18%
4. "Repo permanen = Notion" → dibalik ADR-0001

**Biaya:** CEO sempat menyetujui ekspansi B2B berdasarkan rekomendasi yang salah sebelum dikoreksi.

**Pencegahan:** CLAUDE.md v2 sekarang mewajibkan baca `roadmap/` dan `adr/` sebelum memberi rekomendasi arah. Ini bukan saran — ini aturan operasional.

---

## Pola 5: Gross vs Net Profit Dicampur

**Definisi:** Angka laba kotor dipakai sebagai dasar keputusan tanpa menyebut bahwa laba bersih berbeda signifikan.

**Contoh dari sesi ini:** "8× UMK Garut" disebut sebagai pencapaian tanpa klarifikasi bahwa itu adalah proyeksi laba kotor. Laba bersih Juli 2026 = −Rp 1,4 juta.

**Konsekuensi:** Keputusan pricing, expansion, dan withdrawal diambil berdasarkan angka yang kelihatan bagus tapi belum dikurangi biaya operasional.

**Aturan:** Setiap kali angka laba disebut, wajib disebutkan: (1) laba kotor atau bersih, (2) sumber, (3) periode.
