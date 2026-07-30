# ADR-0001 — GitHub jadi source of truth, Notion jadi mirror read-only

| | |
| --- | --- |
| **Status** | Diterima |
| **Tanggal** | 30 Juli 2026 |
| **Diputuskan oleh** | CEO (Aditya) |
| **Membalik** | Keputusan 22 Jul 2026 — *"Notion adalah repository permanen (GitHub ditinggalkan)"* |

---

## Konteks

Pada 22 Jul 2026 diputuskan Notion menjadi repositori permanen dan GitHub ditinggalkan. Keputusan itu tercatat di halaman utama SMJ Enterprise OS dan di Archive.

Setelah itu tiga hal berubah:

1. **Otomatisasi jadi kebutuhan nyata, bukan rencana.** Aplikasi Buku Toko & Central Kitchen sudah produktif sejak 27 Jul dengan 8 pengguna. Sinkronisasi metrik, rekonsiliasi, dan notifikasi perlu jalan terjadwal tanpa seseorang membuka laptop.
2. **Notion tidak bisa jadi runtime.** Notion tidak punya penjadwal, tidak punya versioning yang bisa di-review, dan tidak bisa menyimpan serta menjalankan kode.
3. **Repo Notion terbukti bisa menyimpan kontradiksi tanpa terdeteksi.** CEO Memo 24 Jul ("SBGA fokus tunggal") bertentangan dengan SOP TSS 27 Jul ("marketing ditunda") dan baru ketahuan saat audit manual 28 Jul. Tidak ada mekanisme yang memaksa kontradiksi terlihat sebelum dipakai mengambil keputusan.

Sekaligus terungkap bahwa export GitHub 22 Jul **tidak pernah diperbarui setelah dibuat** — sebuah `.zip` dan hasil export folder yang sudah ketinggalan 6 hari saat ditemukan pada 30 Jul. Snapshot manual tanpa automation memang selalu berakhir seperti ini.

## Keputusan

**GitHub (`sentraberasgarut/SMJ-Enterprise-OS`) menjadi satu-satunya source of truth.**

- Semua pengetahuan, keputusan, roadmap, SOP, dan kode automation hidup di repo sebagai Markdown dan kode.
- **Notion menjadi mirror read-only.** Fungsinya satu: dashboard yang bisa dibaca CEO dari HP.
- Sinkronisasi **satu arah**: `repo → Notion`. Halaman Notion yang jadi target mirror akan ditimpa.
- Runtime automation: **GitHub Actions**, dengan `NOTION_TOKEN` sebagai repository secret.

## Konsekuensi yang diterima

**Yang didapat:**

- Automation tidak lagi bergantung pada laptop CEO.
- Setiap perubahan punya commit, penulis, waktu, dan diff yang bisa di-review.
- Kontradiksi bisa dideteksi otomatis lewat CI, bukan lewat audit manual.
- Kode Apps Script punya riwayat versi.

**Yang hilang — ini biaya nyata, bukan detail:**

- **CEO tidak bisa lagi mengedit repo dari Notion mobile.** Edit di halaman mirror akan hilang pada sync berikutnya. Ini konsekuensi paling mengganggu sehari-hari.
- Menulis Markdown + commit lebih tinggi hambatannya daripada mengetik di Notion.
- Setup awal butuh langkah manual yang tidak bisa didelegasikan ke AI (pembuatan token, sharing halaman).

**Yang belum diputuskan:**

Database operasional Notion (Lead Database, Content Pipeline, KPI Dashboard, Consultation Log) **belum masuk lingkup ADR ini**. Database itu menerima input harian dari HP, dan menjadikannya read-only akan mematikan alur kerja yang sedang dipakai. Perlu ADR terpisah setelah funnel system dirancang.

## Alternatif yang ditolak

| Alternatif | Alasan ditolak |
| --- | --- |
| Notion tetap authoritative, GitHub hanya backup | Tidak menyelesaikan masalah "jangan bergantung laptop" untuk knowledge repo, dan tidak memaksa deteksi kontradiksi |
| Sync dua arah dengan zona tulis di Notion | Konflik merge tidak punya penyelesai yang jelas kalau kedua sisi berubah. Ditunda sampai ada kebutuhan yang terbukti, bukan diantisipasi |
| Repo baru dari nol | Membuang riwayat commit dan URL yang mungkin sudah dibagikan |

## Cara membalik keputusan ini

Tulis ADR-000N baru yang menyebut ADR-0001 secara eksplisit dan mencatat apa yang berubah dari situasi di atas. **Jangan** ubah dokumen lain untuk diam-diam menyatakan hal yang berlawanan — itu tepat pola yang menghasilkan kontradiksi 24 vs 27 Jul.
