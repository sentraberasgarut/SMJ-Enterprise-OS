# Delivery App — Production Build Plan v1

**1 Agustus 2026. Implementasi, bukan riset. Menerapkan [`delivery-app-mvp-spec-v1.md`](delivery-app-mvp-spec-v1.md).**

## Strategi (satu paragraf, tidak diulang di tiap increment)

Proyek Apps Script **baru, terpisah**, sama seperti pola Dashboard Increment 1 — tidak pernah menulis ke spreadsheet Buku Toko. PIN **dibaca langsung** dari sheet `ORANG` Buku Toko (`1yFF83m2Cd3v8WYU-6jDZTSGB-2TPEAIkJkBmH1iM_D8`, sudah diketahui — `production-system-crosswalk-v1.md` §6#4) secara read-only — **tidak diduplikasi ke kode**, memperbaiki langsung kesalahan yang ditemukan di review Dashboard Increment 1. Modul Workforce Assignment penuh (Roles/Assignments/Duty Status sebagai data tersendiri) **belum dibangun** — untuk build ini, "Assignment hari ini" cukup diturunkan dari `ORANG.Peran` (PENYIAP→Warehouse, PENGANTAR→Driver) plus satu penanda Acting kalau yang submit bukan pemegang peran biasa. Ini pilihan sengaja: membangun modul Workforce penuh dulu akan menunda increment pertama yang benar-benar terpakai.

Setiap increment di bawah bisa dikirim sendiri-sendiri — kalau proyek berhenti setelah Increment 3, sudah ada nilai nyata (bukti keberangkatan tercatat), bukan setengah jadi yang tidak berguna.

---

## Increment 0 — Fondasi Data (tanpa kode)

| | |
|---|---|
| **Objective** | Rumah data yang terisolasi penuh dari Buku Toko |
| **Files to create** | Google Spreadsheet baru "Delivery Evidence" — sheet `GOODS_DEPARTED` (EventID, Timestamp, BusinessUnit, Role, RoleStatus, Operator, Destination, PhotoURL, Notes) dan `GOODS_RECEIVED` (EventID, Timestamp, BusinessUnit, Role, RoleStatus, Operator, Destination, MatchedDepartureEventID, PhotoURL, Notes, ResponsibilityTransferredAt). Folder Drive baru "Delivery Evidence/Photos" |
| **Files to modify** | Tidak ada |
| **Deployment required?** | Tidak |
| **Rollback possible?** | Ya — hapus spreadsheet/folder, tidak ada yang bergantung padanya |
| **Risk level** | Nihil |
| **Expected implementation time** | ~15 menit |
| **Acceptance test** | Kedua sheet ada dengan header benar; folder bisa diakses |
| **Business value** | Tidak langsung — tapi semua increment berikutnya butuh ini ada lebih dulu, risiko nol |

---

## Increment 1 — Kerangka Deploy Kosong

| | |
|---|---|
| **Objective** | Buktikan proyek Apps Script baru bisa dibuat dan di-deploy sebagai web app yang bisa dibuka — **sebelum** ada logika apa pun. Dashboard Increment 1 tidak pernah sampai tahap ini diverifikasi; increment ini sengaja memisahkannya supaya blocker deployment ketahuan lebih awal, bukan di akhir |
| **Files to create** | `apps-script/delivery/Code.gs` (hanya `doGet()`, halaman placeholder), `apps-script/delivery/Index.html` ("Delivery Evidence — Segera"), `apps-script/delivery/appsscripts.json` (manifest sama persis dengan `apps-script/dashboard/appsscripts.json`) |
| **Files to modify** | Tidak ada |
| **Deployment required?** | **Ya** — CEO membuat proyek baru di script.google.com, deploy sebagai Web App (`executeAs: Me`, `access: Anyone`) — langkah manual yang sama seperti Dashboard |
| **Rollback possible?** | Ya — undeploy, tidak menyentuh apa pun lain |
| **Risk level** | Nihil ke Buku Toko; rendah secara implementasi |
| **Expected implementation time** | ~20 menit (saya) + ~5 menit CEO |
| **Acceptance test** | URL terbuka di HP, menampilkan halaman placeholder. **Ini satu-satunya test yang belum pernah lolos di sprint Dashboard sebelumnya** |
| **Business value** | Nihil secara fungsi, tapi menghilangkan risiko deployment dari semua increment sesudahnya |

---

## Increment 2 — Identitas & Resolusi Peran

| | |
|---|---|
| **Objective** | Login PIN yang otomatis menjadi peran (Warehouse/Driver) dengan membaca `ORANG` Buku Toko langsung — bukan menyalin PIN ke proyek baru |
| **Files to create** | Tidak ada |
| **Files to modify** | `Code.gs` (resolusi PIN→peran via `SpreadsheetApp.openById()` read-only ke `ORANG`; kasus dua-peran Mas War → satu langkah tambahan pilih "Menyiapkan/Mengantar" hanya kalau ambigu), `Index.html` (gerbang PIN, pola yang sama dari Dashboard) |
| **Files to modify (lanjutan)** | — |
| **Deployment required?** | Ya, redeploy |
| **Rollback possible?** | Ya — redeploy versi sebelumnya |
| **Risk level** | Rendah — hanya akses baca ke Buku Toko, tidak ada jalur tulis sama sekali |
| **Expected implementation time** | ~45 menit |
| **Acceptance test** | PIN asli Teh Dede & Mas War berhasil login dan langsung terarah ke peran yang benar; PIN tidak dikenal ditolak |
| **Business value** | Memperbaiki langsung temuan keamanan paling serius dari review Dashboard (PIN tertulis di git) — kali ini PIN tidak pernah masuk source sama sekali |

---

## Increment 3 — Layar Persiapan (`GoodsDeparted`)

| | |
|---|---|
| **Objective** | Peran Warehouse bisa mencatat keberangkatan nyata dengan foto |
| **Files to modify** | `Code.gs` (`catatKeberangkatan(pin, tujuan, fotoDataUrl)` → tulis ke `GOODS_DEPARTED`, simpan foto ke folder Drive), `Index.html` (layar Persiapan: 2 tombol tujuan + kamera + kirim) |
| **Deployment required?** | Ya |
| **Rollback possible?** | Ya |
| **Risk level** | Rendah — tulisan pertama, tapi hanya ke sheet baru yang terisolasi |
| **Expected implementation time** | ~1 jam |
| **Acceptance test** | Satu keberangkatan pagi nyata tercatat dengan foto, muncul sebagai baris di `GOODS_DEPARTED` |
| **Business value** | Bukti pertama yang pernah ada untuk momen ini — bahkan sebelum Increment 4 ada, satu baris ini sudah punya nilai (bukti waktu+peran+foto) kalau ada sengketa |

---

## Increment 4 — Layar Kedatangan (`GoodsReceived`) + Pencocokan

| | |
|---|---|
| **Objective** | Peran Driver konfirmasi sampai; sistem mencocokkan otomatis ke keberangkatan yang masih terbuka untuk tujuan+hari itu; menghitung `ResponsibilityTransferredAt` |
| **Files to modify** | `Code.gs` (`catatKedatangan(pin, adaMasalah, fotoDataUrl)` + logika pencocokan berbasis tujuan+tanggal+peran, tanpa perlu memilih ID manual — sesuai spec §5), `Index.html` (layar Kedatangan: tujuan otomatis terisi + tombol konfirmasi + foto opsional) |
| **Deployment required?** | Ya |
| **Rollback possible?** | Ya |
| **Risk level** | Rendah-menengah — logika pencocokan pertama, tapi lingkupnya sempit (hanya 2 tujuan, biasanya 1 keberangkatan terbuka per tujuan per hari) |
| **Expected implementation time** | ~1,5 jam |
| **Acceptance test** | Satu pasangan Berangkat→Sampai nyata tercocokkan, dengan waktu transfer tanggung jawab tercatat |
| **Business value** | Ini increment di mana misi seluruh sprint ini pertama kali benar-benar terjadi — rantai bukti lengkap dari berangkat sampai tanggung jawab berpindah |

---

## Increment 5 — Timeline Hari Ini (baca saja)

| | |
|---|---|
| **Objective** | Layar sederhana menampilkan kejadian hari ini secara kronologis, termasuk keberangkatan yang belum dikonfirmasi (`Pending Evidence`), jujur bukan disembunyikan |
| **Files to modify** | `Code.gs` (`ambilTimelineHariIni()`), `Index.html` (layar Timeline) |
| **Deployment required?** | Ya |
| **Rollback possible?** | Ya |
| **Risk level** | Nihil — baca saja |
| **Expected implementation time** | ~45 menit |
| **Acceptance test** | CEO/Ayu bisa buka layar ini dan langsung tahu status pengiriman pagi tanpa bertanya ke siapa pun |
| **Business value** | Ini secara harfiah yang melindungi Ayu — kriteria Definition of Done #3 di spec |

---

## Increment 6 — Skenario Kegagalan (Batal & Koreksi)

| | |
|---|---|
| **Objective** | Tambahkan jalur "Batalkan" (sebelum sampai) dan "Koreksi tujuan" dari spec §9 |
| **Files to modify** | `Code.gs` (dua fungsi kecil), `Index.html` (tambahan kecil di layar yang sudah ada, bukan layar baru) |
| **Deployment required?** | Ya |
| **Rollback possible?** | Ya |
| **Risk level** | Rendah |
| **Expected implementation time** | ~45 menit |
| **Acceptance test** | Satu entri uji yang sengaja dibatalkan tampil sebagai "dibatalkan," bukan hilang diam-diam |
| **Business value** | Mencegah aplikasi jadi tidak terpakai begitu kesalahan nyata pertama terjadi — bukan hiasan |

---

## Increment 7 — Uji Produksi Nyata

| | |
|---|---|
| **Objective** | Pemakaian nyata pertama, diukur, tanpa pelatihan — bukan kode |
| **Files** | Tidak ada |
| **Deployment required?** | Tidak — sudah live sejak Increment 1 |
| **Rollback possible?** | N/A |
| **Risk level** | Nihil ke sistem; risiko operasional (kebingungan staf) sudah diminimalkan oleh increment sebelumnya |
| **Expected implementation time** | Satu pagi nyata |
| **Acceptance test** | Persis Definition of Done di spec: di bawah 20 detik, tanpa pelatihan, Ayu konfirmasi bisa lihat status tanpa bertanya |
| **Business value** | Ini kriteria sukses sesungguhnya sprint ini — semua increment sebelumnya adalah persiapan menuju momen ini |

---

## Yang sengaja tidak masuk build ini

GPS, mode offline, modul Workforce Assignment penuh (Roles/Assignments sebagai data tersendiri), integrasi Timeline ke dalam proyek Dashboard utama — semuanya `Future Backlog`, konsisten dengan pengecualian eksplisit di Definition of Done spec. Tidak satu pun dari ini menghalangi Increment 0–7 di atas terpakai besok pagi.

## Urutan untuk developer berikutnya

0 → 1 → 2 → 3 → 4 → 5 → 6 → 7, berurutan, tidak melompat. Increment 1 (deploy kosong) **sebelum** logika apa pun ditulis — ini satu-satunya perubahan urutan dibanding cara Dashboard Increment 1 dikerjakan, dan alasannya eksplisit: mem-verifikasi deployment sendiri sebelum menaruh nilai di baliknya.
