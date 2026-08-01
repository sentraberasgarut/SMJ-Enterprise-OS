# Archive

Artefak historis. **Tidak authoritative.** Jangan dipakai sebagai sumber.

---

## Export Notion 22 Jul 2026 — SELESAI DIHAPUS

Diverifikasi 1 Agustus 2026: `SMJ-Enterprise-OS.zip` dan folder `SMJ-Enterprise-OS/` sudah tidak ada lagi di root repo. Catatan di bawah ini disimpan sebagai riwayat, bukan tindakan yang masih menunggu.

<details>
<summary>Catatan asli (sudah selesai)</summary>

Dua artefak dari percobaan migrasi pertama masih berada di root repo:

| Artefak | Keterangan |
| --- | --- |
| `SMJ-Enterprise-OS.zip` | 652 KB. Snapshot export Notion, dibuat 22 Jul 07:39, tidak pernah diperbarui |
| `SMJ-Enterprise-OS/` | Hasil unzip export yang sama — folder `00 Executive` s/d `17 Archive` |

**Kenapa masih ada:** tool GitHub yang dipakai agen AI hanya bisa membuat dan mengubah file, tidak bisa menghapus. Penghapusan harus dilakukan manual.

**Kenapa harus dihapus, bukan dibiarkan:** isinya sudah ketinggalan 6 hari saat ditemukan (30 Jul) dan sekarang bertentangan dengan konten aktif di `docs/`, `roadmap/`, dan `adr/`. Dua sumber yang saling bertentangan di satu repo adalah persis masalah yang migrasi ini dimaksudkan untuk menyelesaikan.

**Cara menghapus:**

Lewat web GitHub — buka file → ikon tong sampah → Commit changes. Berhasil untuk `.zip`, tapi folder harus dihapus per file.

Lewat git dari komputer mana pun:

```bash
git clone https://github.com/sentraberasgarut/SMJ-Enterprise-OS.git
cd SMJ-Enterprise-OS
git rm -r "SMJ-Enterprise-OS" "SMJ-Enterprise-OS.zip"
git commit -m "Hapus export Notion 22 Jul yang sudah usang (lihat ADR-0001)"
git push
```

Riwayatnya tetap ada di git kalau suatu saat perlu dilihat lagi — menghapus file tidak menghapus commit-nya.

</details>
