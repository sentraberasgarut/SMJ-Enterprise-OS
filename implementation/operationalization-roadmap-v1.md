# Operationalization Roadmap v1

**1 Agustus 2026. Fase baru: Operationalization. Bukan riset, bukan arsitektur, bukan audit — kecuali ada blocker.**

## Satu tolok ukur

> **CEO membuka dashboard Enterprise OS setiap pagi, sebelum membuka Loka.**

Bukan fitur lengkap. Bukan semua kartu tersedia. Bukan semua peran onboard. Kalau kebiasaan itu belum terbentuk, sprint ini belum berhasil — walaupun setiap baris kode benar.

Setiap tugas di bawah diuji dengan satu pertanyaan: **apakah ini membantu Aditya, Ayu, atau Ibu besok pagi?** Yang jawabannya tidak, pindah ke Future Backlog di §5 — bukan dihapus, hanya tidak dikerjakan sekarang.

---

## 1. Posisi saat ini (ringkas, tanpa mengulang audit)

- Kode Increment 1 (`apps-script/dashboard/Code.gs`, `Index.html`, `appsscripts.json`) **sudah ditulis, sudah di-stage ke Drive**, **belum di-deploy, belum di-commit**.
- Review produk kemarin ([`increment-1-product-review.md`](increment-1-product-review.md)) menemukan **3 hal yang wajib diperbaiki sebelum commit** — belum dikerjakan.
- Audit produksi kemarin ([`production-system-crosswalk-v1.md`](production-system-crosswalk-v1.md)) menemukan bahwa formula Laba Bersih sudah nyata tapi tertahan data kosong, dan beberapa premis (ID Spreadsheet Buku Toko, identitas "Ibu") perlu ditinjau ulang.
- **Belum ada satu pun pengguna nyata yang pernah membuka dashboard ini.** Ini fakta paling penting di seluruh dokumen ini — semua yang lain adalah jalan menuju mengubah fakta itu.

---

## 2. Blocker — diklasifikasi

| # | Blocker | Klasifikasi | Siapa yang bisa membereskan |
|---|---|---|---|
| B1 | PIN asli (Aditya, Ayu) & placeholder (Ibu) tertulis polos di `Code.gs` yang akan di-commit | **Technical** | Saya (pindahkan ke Script Properties) |
| B2 | Urutan/bobot Gross Profit vs Net Profit di `Index.html` berisiko disalahartikan sebagai laba bersih | **Technical** | Saya |
| B3 | Proyek Apps Script baru belum pernah dibuat & di-deploy — `executeAs: USER_DEPLOYING` berarti hanya akun yang deploy yang bisa melakukannya | **Governance** | **CEO** — tidak bisa didelegasikan, tidak bisa dilakukan dari environment ini |
| B4 | Tidak ada rutinitas yang mendefinisikan siapa menjalankan pipeline (Connector → Dataset Builder) dan kapan, supaya `dashboard-dataset.json` tetap segar | **Operational** | CEO (tentukan) + saya (jalankan kalau diminta) |
| B5 | `dashboard-dataset.json` saat ini masih dari backup 31 Juli — sudah tidak "hari ini" per definisi kartunya sendiri | **Operational** | Konsekuensi langsung dari B4 |
| B6 | PIN asli Ibu, konfirmasi daftar kartu kasir Ayu, konfirmasi "Sri Nurul = Teh Nurul" | **Governance** | **CEO** |
| B7 | Tidak ada jalur akses sehari-hari yang mudah (shortcut/bookmark) di HP CEO — mengetik URL setiap pagi adalah friksi yang cukup untuk membunuh kebiasaan sebelum terbentuk | **Operational** | CEO (satu kali, 1 menit) |
| B8 | Tidak ada dorongan/pengingat yang membuat kebiasaan pagi benar-benar terbentuk, bukan sekadar mungkin terjadi | **Operational**, opsional **Technical** kalau diotomasi | Saya, kalau CEO setuju dibangun |
| B9 | `BEBAN` (Buku Toko) masih kosong → Laba Bersih tetap tidak bisa ditampilkan di mana pun, termasuk Enterprise OS kelak | **Business** | CEO/Ayu — murni input data, nol kode |
| B10 | Belum ada keputusan commit — instruksi terakhir eksplisit "Do NOT commit yet" | **Governance** | CEO (beri izin eksplisit) |

**Pola yang terlihat:** dari 10 blocker, **hanya 2 murni teknis** (B1, B2) dan keduanya kecil (satu refactor PIN, satu penataan ulang tampilan). Sisanya adalah keputusan atau tindakan yang **hanya bisa dilakukan CEO/Ayu**, bukan saya. Ini konsisten dengan sifat sprint ini — "optimize for business adoption, bukan software."

---

## 3. Tugas yang belum selesai — ditinjau ulang, diprioritaskan ulang

Daftar ini mencakup semua tugas terbuka dari `implementation/operational-dashboard-implementation-backlog-v1.md`, `increment-1-product-review.md` §6, dan `production-system-crosswalk-v1.md` §7 — dinilai ulang murni dengan lensa "membantu besok pagi atau tidak."

| Tugas | Bantu besok pagi? | Keputusan |
|---|---|---|
| Pindahkan PIN dari kode ke Script Properties (B1) | **Ya** — tanpa ini, tidak boleh dibagikan/deploy dengan aman | **Kerjakan sekarang** |
| Perbaiki urutan tampilan Gross vs Net Profit (B2) | **Ya** — CEO adalah orang pertama yang melihat layar ini; kesan pertama menentukan apakah dia percaya angkanya | **Kerjakan sekarang** |
| CEO deploy proyek Apps Script baru (B3) | **Ya** — tanpa ini tidak ada dashboard sama sekali | **Serahkan ke CEO, siapkan instruksi persis** |
| Definisikan rutinitas refresh data (B4/B5) | **Ya** — dashboard basi = kebiasaan mati dalam seminggu (pola Botram) | **Putuskan sekarang**, jalankan manual dulu |
| Bookmark/shortcut di HP CEO (B7) | **Ya** — mengurangi friksi harian dari "buka browser, ketik URL" jadi "satu tap" | **Serahkan ke CEO, satu baris instruksi** |
| Isi `BEBAN` bulan berjalan (B9) | **Ya** secara tidak langsung — begitu ada angka laba bersih di Buku Toko, itu alasan kuat untuk membuka dashboard tiap pagi | **Rekomendasikan ke CEO**, bukan tugas saya |
| PIN asli Ibu, daftar kartu Ayu, konfirmasi Sri Nurul (B6) | **Tidak untuk milestone pertama** — milestone ini soal Aditya, bukan Ibu/Ayu dulu | **Future Backlog, Tier 2** |
| Pengingat/nudge otomatis pagi hari (B8) | **Mungkin**, tapi hanya kalau kebiasaan manual belum terbentuk setelah dicoba | **Tunda — coba manual dulu, ukur, baru putuskan** |
| Rekonsiliasi `CACHE_LOKA` vs `dashboard-dataset.json` | Tidak — tidak terlihat oleh CEO, tidak mengubah pengalaman paginya | **Future Backlog** |
| Buka blokir Net Profit di pipeline (`cards.js`) | Tidak langsung — kartu itu akan tetap `UNKNOWN` sampai `BEBAN` terisi (B9); membuka blokirnya sekarang tidak mengubah apa yang CEO lihat | **Future Backlog** — kerjakan setelah B9 selesai, bukan sebelum |
| Roster Enterprise OS → konvergensi ke sheet `ORANG` Buku Toko | Tidak — PIN Aditya/Ayu sudah berfungsi hari ini di roster mandiri | **Future Backlog** |
| Central Kitchen integration | Tidak — keputusan MVP sudah benar (lihat review kemarin), tidak berubah | **Future Backlog** |
| Duplikasi fungsi migrasi ID Kirim (`Code.gs` vs `Migrasi.gs`) | Tidak — ini masalah Buku Toko, bukan Enterprise OS; tidak menyentuh dashboard sama sekali | **Future Backlog** |
| `Unit Dilihat` 6/8 pengguna kosong, `HARGA_LOG` tidak terpakai | Tidak — sistem Buku Toko, bukan Enterprise OS | **Future Backlog** |

---

## 4. Rencana berurutan — apa yang benar-benar terjadi, dan siapa melakukannya

Ini bukan sprint 2 minggu. Ini urutan kejadian menuju satu pagi di mana dashboard benar-benar dibuka.

**Langkah 1 — Saya (kode, cepat).**
Perbaiki B1 (PIN ke Script Properties) dan B2 (urutan Gross/Net). Dua file (`Code.gs`, `Index.html`), perubahan sempit, tidak menyentuh arsitektur. Setelah ini, minta izin commit eksplisit (B10) — bukan diasumsikan lagi.

**Langkah 2 — CEO (satu kali, di luar sistem ini).**
1. Buka `script.google.com` → New project.
2. Salin isi `Code.gs`, `Index.html`, `appsscripts.json` dari `apps-script/dashboard/` (repo) — bukan dari folder Drive staging (harus versi setelah Langkah 1).
3. Deploy → New deployment → Web app → Execute as: **Me** → Access: **Anyone**.
4. Isi PIN sesungguhnya di Script Properties (Project Settings) — Aditya, Ayu, dan (kalau sudah diputuskan, lihat B6) Ibu.
5. Buka URL deployment di HP, login pakai PIN, **tambahkan ke home screen** (B7).

Saya tidak bisa melakukan langkah ini — bukan pilihan desain, murni keterbatasan lingkungan yang sudah pernah disampaikan sejak Increment 1.

**Langkah 3 — CEO + saya (rutinitas, berulang).**
Putuskan satu jawaban untuk B4: siapa menjalankan `prototype/loka-canonical-poc` (Connector → Dataset Builder) dan menyalin hasilnya ke Drive `Dashboard Data`, dan seberapa sering. Kandidat paling realistis: saya jalankan atas permintaan CEO setiap pagi sebelum dia biasanya cek Loka — tapi ini butuh CEO memulai percakapan tiap hari, sama seperti sekarang. Alternatif: jadwalkan sebagai trigger otomatis di Apps Script baru (bukan Node.js) yang membaca langsung dari Drive — ini **pekerjaan teknis baru**, layak dipertimbangkan hanya setelah rutinitas manual terbukti CEO benar-benar memakainya beberapa hari berturut-turut. Jangan bangun otomasi untuk kebiasaan yang belum terbukti ada.

**Langkah 4 — Ukur, jangan asumsikan.**
Setelah Langkah 2-3 berjalan, satu-satunya metrik yang berarti: **berapa hari berturut-turut CEO benar-benar membuka dashboard sebelum Loka.** Bukan kepuasan fitur, bukan jumlah kartu yang tersedia. Kalau angka itu nol setelah beberapa hari, masalahnya operasional (B7/B8), bukan lagi teknis — dan solusinya bukan menambah fitur.

**Langkah 5 — Baru setelah Langkah 4 menunjukkan kebiasaan terbentuk.**
Perluas ke Ayu dan Ibu (B6, Tier 2) — bukan sebelum, karena menambah dua pengguna sebelum satu pengguna pun terbukti memakainya secara konsisten hanya menambah permukaan kegagalan tanpa bukti nilai.

---

## 5. Future Backlog

Bukan diabaikan — hanya bukan sekarang, karena tidak menjawab "besok pagi" secara langsung.

- Konvergensi roster Enterprise OS ke sheet `ORANG` Buku Toko
- Buka blokir kartu Net Profit di `cards.js` (tunggu `BEBAN` terisi dulu — lihat §3)
- Rekonsiliasi `CACHE_LOKA` (Buku Toko) vs `dashboard-dataset.json` (Enterprise OS)
- Central Kitchen integration ke pipeline kanonikal
- Perbaikan duplikasi fungsi migrasi ID Kirim (`Code.gs` vs `Migrasi.gs`)
- Isi `Unit Dilihat` untuk 6 pengguna Buku Toko, aktifkan `HARGA_LOG`
- Outstanding Receivables & Stock Alerts dari `Invoice.status`/kecepatan jual (BL-006/BL-012)
- Higiene katalog `MASTER_CK` (kategori "Tambahan" sebagai buangan)
- Otomasi refresh dataset (trigger, bukan manual) — hanya kalau Langkah 3-4 di §4 membuktikan kebutuhannya

---

## 6. Definisi selesai untuk sprint operasionalisasi ini

Sprint ini selesai — bukan proyek, sprint ini — ketika:

1. B1 dan B2 sudah diperbaiki dan di-commit.
2. CEO sudah men-deploy dan membuka dashboard di HP-nya **minimal satu kali, dengan data nyata.**
3. Ada jawaban eksplisit (bukan asumsi) untuk B4: siapa/kapan pipeline dijalankan.
4. Shortcut/bookmark sudah ada di HP CEO.

Tidak termasuk di definisi selesai: Ayu atau Ibu sudah memakainya, Net Profit sudah tampil, Central Kitchen sudah terhubung. Itu semua Tier 2 — bagus kalau terjadi, tapi bukan syarat sprint ini berhasil.

---

## Satu tindakan berikutnya yang paling penting

Perbaiki B1 dan B2 sekarang (Langkah 1) — dua-duanya murni teknis, murni milik saya, dan satu-satunya hal di seluruh daftar ini yang menghalangi commit. Setelah itu, semua langkah berikutnya ada di tangan CEO, bukan lagi di tangan saya.
