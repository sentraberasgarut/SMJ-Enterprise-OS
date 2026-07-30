# Roadmap

| | |
| --- | --- |
| **Aktif** | [v6 — 30 Jul 2026](v6-2026-07-30.md) |
| **Adendum berlaku** | [Adendum 1 — Rencana Eksekusi Paralel (30 Jul, sore)](../ops/rencana-eksekusi-paralel.md) · [Adendum 2 — Kanal B2C & Koreksi Arah (30 Jul, malam)](../ops/adendum-2-kanal-b2c-dan-koreksi-arah.md) |
| **Sebelumnya** | v5 (28 Jul 2026) — tetap di Notion, tidak diduplikasi ke repo karena aturan *freeze dokumen* |

> ⚠️ **Baca v6 bersama kedua adendum.** Adendum 1 memperbaiki pemilik keputusan Central Kitchen, metrik utama funnel, dan status selisih tutup shift 27 Jul. Adendum 2 menetapkan cakupan B2C dan peran per kanal, serta **membuka kembali satu konflik arah B2B yang menunggu keputusan CEO**. Kalau bertentangan dengan v6, **adendum yang berlaku.**

> 🔴 **Dua adendum terpakai dari tiga.** Satu adendum lagi dan badan v6 dianggap tidak akurat — siapkan v7.

**Hanya boleh ada satu roadmap aktif di folder ini.** CI (`automation/validate.mjs`) akan gagal kalau ada lebih dari satu file `.md` selain README. Versi lama dipindahkan ke `roadmap/archive/`.

## Cara mengganti roadmap

1. Buat file baru `vN-YYYY-MM-DD.md`
2. Pindahkan yang lama ke `roadmap/archive/`
3. Bagian pertama roadmap baru **wajib** menjelaskan apa yang berubah dan mengapa versi lama tidak lagi berlaku
4. Serap adendum yang masih berlaku ke dalam badan roadmap baru, lalu tandai adendumnya selesai
5. Update tabel di atas

Aturan nomor 3 ada karena v4 → v5 pernah menghasilkan dua dokumen yang berlaku bersamaan dan saling bertentangan. Aturan nomor 4 mencegah adendum menumpuk sampai tidak ada yang tahu mana yang berlaku.

## Kapan pakai adendum, kapan versi baru

| Situasi | Tindakan |
| --- | --- |
| Koreksi fakta atau pemilik keputusan, arah tetap | Adendum |
| Arah 30 hari berubah | Roadmap versi baru |
| Sudah ada 3 adendum | Roadmap versi baru — tandanya badannya sudah tidak akurat |
