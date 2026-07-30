# SMJ Enterprise OS

Repositori operasional **CV Sederhana Maju Jaya (SMJ)** dan unit bisnisnya.

> **Status arsitektur (30 Jul 2026):** Repo ini adalah **source of truth**. Notion adalah **mirror read-only** untuk dashboard CEO di HP. Lihat [ADR-0001](adr/0001-github-authoritative-notion-mirror.md).
>
> Ini membalik keputusan sebelumnya ("Notion repositori permanen, GitHub ditinggalkan", 22 Jul 2026). Alasan: semua otomatisasi harus jalan tanpa bergantung laptop CEO.

---

## Hierarki bisnis

```
CV Sederhana Maju Jaya (holding)
├── Toko Sembako Sejahtera (TSS)     — mesin pendapatan, ~80% omzet dari Sederhana Jaya
├── Central Kitchen (CK)             — pemasok lauk ke Sederhana Jaya, BELUM TERUKUR
├── Sentra Beras Garut Asli (SBGA)   — brand online beras, aktif sejak 23 Jul 2026
├── Sentra Telur Keluarga            — belum dimulai
├── Sentra Gula Merah Garut          — belum dimulai (inventarisasi supplier)
└── Sentra Gula Rafinasi             — belum dimulai (blokir verifikasi legal)
```

---

## Peta repo

| Path | Isi |
| --- | --- |
| `adr/` | Architecture Decision Record — keputusan struktural yang tidak boleh dibalik tanpa ADR baru |
| `roadmap/` | Roadmap aktif + arsip versi lama |
| `ops/audit/` | Audit operasional bertanggal dengan temuan terverifikasi |
| `ops/runbook/` | Prosedur berulang yang harus bisa dijalankan orang lain |
| `apps-script/` | Kode + spesifikasi aplikasi Google Apps Script |
| `automation/` | Script yang dijalankan GitHub Actions |
| `.github/workflows/` | Definisi automation (runtime, bukan laptop) |
| `data/snapshots/` | Snapshot metrik harian (append-only, jangan diedit) |
| `archive/` | Artefak historis yang tidak lagi authoritative |

---

## Aturan main (governance)

Aturan ini diwarisi dari repo Notion dan tetap berlaku:

1. **Verifikasi sebelum klaim selesai.** Status berubah jadi "done" hanya setelah dicek ke sumber nyata, bukan setelah dokumennya ditulis. Aturan ini lahir setelah audit menemukan CEO Memo mengklaim nol konten padahal SBGA sudah live.
2. **Tidak ada self-approval konten.** Draft customer-facing menunggu approval CEO.
3. **Keputusan besar wajib jadi ADR.** Kalau sebuah keputusan membalik keputusan lama, ADR baru harus menyebut ADR yang dibalik.
4. **Freeze dokumen baru** (berlaku sejak 24 Jul 2026). Repo sudah kelebihan dokumentasi. Tambah dokumen hanya kalau menggantikan yang lama.
5. **Angka harus punya sumber.** Setiap metrik menyebut asalnya (POS Loka, sheet Buku Toko, database Notion) dan tanggalnya.

---

## ⚠️ Langkah manual yang HARUS dilakukan CEO

Otomatisasi belum hidup sampai tiga hal ini beres. Tidak ada yang bisa saya kerjakan dari sisi saya.

### 1. Notion integration token (wajib — sync mati tanpa ini)

GitHub Actions tidak bisa memakai koneksi Notion milik agen AI. Butuh token sendiri.

1. Buka <https://www.notion.so/profile/integrations> → **New integration**
2. Nama: `SMJ Repo Sync` · Type: **Internal** · Workspace: workspace SMJ
3. Capabilities: **Read content** + **Update content** (Insert content tidak perlu)
4. Copy **Internal Integration Secret** (`ntn_...`)
5. Di setiap halaman Notion yang jadi target mirror: **⋯ → Connections → SMJ Repo Sync**
   (token hanya bisa menyentuh halaman yang di-share ke integration — ini fitur keamanan, bukan bug)
6. Simpan di GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `NOTION_TOKEN`
   - Value: token dari langkah 4

### 2. Hapus export lama 22 Jul (saya tidak punya izin hapus file)

Tool GitHub yang saya pakai hanya bisa membuat dan mengubah file, **tidak bisa menghapus**. Dua artefak ini harus dihapus manual:

- `SMJ-Enterprise-OS.zip` (652 KB, snapshot mati)
- folder `SMJ-Enterprise-OS/` (export Notion 22 Jul, sudah 6 hari ketinggalan saat ditemukan)

Cara tercepat lewat web: buka file → ikon tong sampah → Commit. Untuk folder, gunakan `git rm -r` dari komputer mana pun, atau biarkan sampai ada akses shell. Lihat [archive/README.md](archive/README.md).

### 3. Export kode Apps Script (saya tidak bisa membacanya)

Script yang terikat ke Spreadsheet (*container-bound*) tidak muncul di Google Drive API, jadi saya **tidak bisa membaca kodenya**. Yang bisa saya lakukan hanya membaca datanya.

Untuk memasukkan kode ke repo: buka spreadsheet **Buku Toko dan Central Kitchen** → Extensions → Apps Script → copy isi setiap file `.gs` → simpan ke `apps-script/buku-toko/`.

Spesifikasi data contract-nya sudah saya dokumentasikan tanpa kode di [apps-script/buku-toko/SPEC.md](apps-script/buku-toko/SPEC.md).

---

## Kondisi terkini (30 Jul 2026)

**Yang jalan lebih baik dari yang dicatat repo:**

Aplikasi Buku Toko & Central Kitchen **sudah produktif** sejak 27 Jul — 8 pengguna login pakai PIN, alur barang keluar → konfirmasi terima → tutup shift jalan dengan bukti foto di Drive. Roadmap v5 masih menuliskannya sebagai tugas Fase 0 yang belum dikerjakan. Repo ketinggalan dari lapangan, bukan sebaliknya.

**Yang lebih buruk dari yang dicatat repo:**

Central Kitchen berjalan **tanpa satu pun angka biaya**. 130+ item katalog CK berharga Rp0 dengan penanda `CEK`. Setiap kiriman CK ke Sederhana Jaya tercatat bernilai Rp0. Target laba CK = 0. Artinya CK beroperasi di luar pengukuran keuangan sepenuhnya.

Rincian lengkap: [ops/audit/2026-07-30-buku-toko-audit.md](ops/audit/2026-07-30-buku-toko-audit.md)

---

## Sumber data

| Sistem | Peran | Catatan |
| --- | --- | --- |
| **POS Loka** | Sumber utama transaksi TSS | Export harian `loka-YYYY-MM-DD.json` ke Drive. Menggantikan Kasir Pintar — dokumentasi lama masih menyebut Kasir Pintar, itu usang |
| **Buku Toko dan Central Kitchen** (Google Sheets) | Alur operasional TSS+CK | `1yFF83m2Cd3v8WYU-6jDZTSGB-2TPEAIkJkBmH1iM_D8` |
| **Google Drive** | Bukti foto tutup shift, backup stok | Folder `Buku Toko - Bukti Tutup Shift` |
| **Notion** | Mirror read-only, dashboard CEO di HP | Tidak lagi authoritative |
| **Threads / Instagram / WhatsApp** | Kanal pelanggan SBGA | `@kuratorberasterpercaya` |
