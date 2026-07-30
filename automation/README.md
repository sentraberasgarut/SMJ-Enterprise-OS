# Automation

Semua yang berjalan di GitHub Actions — **bukan** di laptop.

| File | Fungsi | Dipicu oleh |
| --- | --- | --- |
| `sync-notion/sync.mjs` | Mirror Markdown repo → halaman Notion | push ke `main`, harian 06:00 WIB, manual |
| `sync-notion/manifest.json` | Peta file → pageId Notion | — |
| `validate.mjs` | Cek link mati, manifest, roadmap ganda, ADR bertentangan | setiap push & PR |

---

## ⚠️ Status: belum pernah dijalankan

Script di folder ini **ditulis tanpa bisa diuji** — sandbox Linux tidak tersedia saat pembuatannya (30 Jul 2026). Verifikasi manual sudah dilakukan, tapi itu bukan pengganti eksekusi.

**Urutan aman sebelum sync sungguhan:**

1. Buka tab **Actions** → *Validate repo* → pastikan lulus. Ini menjalankan `validate.mjs` dan konversi dry-run tanpa token — aman sepenuhnya.
2. Buat halaman mirror di Notion, share ke integration `SMJ Repo Sync`, isi `pageId` di `manifest.json`, set `enabled: true`.
3. **Actions** → *Sync ke Notion* → *Run workflow* → centang **dry_run**. Periksa jumlah blok yang dilaporkan wajar.
4. Baru jalankan tanpa dry-run.

Selama `NOTION_TOKEN` belum diset, workflow sync otomatis turun ke mode dry-run dan memberi warning — tidak akan gagal dan tidak akan merusak apa pun.

---

## Sifat destruktif yang perlu dipahami

`sync.mjs` **menghapus semua blok anak** di halaman Notion target lalu menulis ulang dari Markdown. Konsekuensinya:

- Apa pun yang diketik manual di halaman mirror **akan hilang** pada sync berikutnya
- Komentar Notion yang menempel pada blok yang dihapus akan ikut hilang
- Halaman mirror **tidak boleh** dipakai sebagai tempat kerja

Jangan pernah mengarahkan `pageId` ke halaman yang masih diedit manusia. Buat halaman mirror baru yang khusus.

## Batasan converter Markdown → Notion

| Hal | Perilaku |
| --- | --- |
| Heading `####` dan lebih dalam | Jadi `heading_3` + tebal (Notion hanya punya h1–h3) |
| Tabel | Jadi tabel Notion asli; baris pemisah `\|---\|` diabaikan |
| Nested list | Diratakan ke satu tingkat |
| Link relatif (`../file.md`) | Jadi teks biasa — Notion menolak URL relatif |
| Blockquote beberapa baris | Digabung jadi satu blok quote |
| HTML mentah | Diperlakukan sebagai teks |
| Teks > 1900 karakter per potongan | Dipecah otomatis (batas API 2000) |

## Rate limit

Notion membatasi ~3 request/detik. Script memberi jeda 120 ms saat menghapus blok dan 150 ms saat menulis, serta menghormati header `Retry-After` pada respons 429.

Halaman panjang berarti banyak request penghapusan. Dokumen ~200 blok memakan sekitar 30 detik.
