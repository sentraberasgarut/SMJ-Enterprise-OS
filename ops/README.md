# Ops

Dokumen operasional — audit, prosedur, rekomendasi, rencana eksekusi.

## Aktif

| Dokumen | Isi | Status |
| --- | --- | --- |
| [Rencana Eksekusi Paralel](rencana-eksekusi-paralel.md) | Adendum 1 Roadmap v6. Tiga koreksi + urutan kerja dengan ketergantungan + anggaran waktu CEO | 🟢 Berlaku |
| [Runbook Kustodi Kas & Setoran BRI](runbook/kustodi-kas-dan-setoran-bri.md) | Alur kas berjenjang saat CEO & Ibu tidak onsite | 🟡 Berlaku 31 Jul — menunggu 2 keputusan CEO |
| [Funnel System v1](funnel/funnel-system-v1.md) | Gerbang kualifikasi + tangga follow-up + 6 angka penawaran | 🟡 Terblokir oleh keputusan harga ritel |
| [Rekomendasi Central Kitchen](recommendations/central-kitchen-untuk-ibu-dan-teh-nurul.md) | Usulan untuk Ibu & Teh Nurul, bahasa non-teknis, siap cetak | 🟡 Menunggu diserahkan |
| [Audit Buku Toko & CK (30 Jul)](audit/2026-07-30-buku-toko-audit.md) | 8 temuan dari data aplikasi | 🟢 Sebagian status berubah — lihat Adendum 1 Bagian A |

## Status temuan audit 30 Jul — diperbarui sore hari

Audit ditulis pagi sebelum jawaban CEO masuk. Tiga status berubah:

| Temuan | Status pagi | Status sekarang |
| --- | --- | --- |
| #1 CK tanpa data biaya | 🔴 Blocker, keputusan CEO | 🟡 **Didelegasikan** ke Ibu & Teh Nurul. Scope CEO = pencatatan saja |
| #2 Migrasi dompet BRI tanpa jawaban dana | 🔴 Blocker | ✅ **Terjawab.** BRI adalah rekening khusus bisnis, akses Aditya + Ibu. Ibu belanja dari rekening yang sama. Tidak ada celah dana |
| #3 Selisih 27 Jul Rp2.101.810 | 🔴 Blocker, belum dijelaskan | ✅ **Terjelaskan** — carry-over dompet yang disadari. Cacat desain, bukan cacat disiplin |

**Menggantikannya, satu temuan baru yang lebih besar:** rantai saldo brankas antar hari tidak tersambung, dan ada dua tafsir kolom `Kas Tunai` yang berbeda **Rp5,8 juta**. Belum bisa dipastikan tanpa hitung fisik. Lihat [SPEC Tutup Shift v2](../apps-script/buku-toko/SPEC-tutup-shift-v2.md).

Temuan #4 sampai #8 tidak berubah.
