# ADR-0002 — Dana Ibu di TSS adalah Modal Awal, bukan Hutang

**Status:** Diterima
**Tanggal:** 30 Juli 2026
**Diputuskan oleh:** Aditya (CEO) dan Ibu, bersepakat
**Membatalkan:** asumsi kerja Claude dalam Formulir Reset TSS v1 dan Adendum 2, yang memperlakukan dana Ibu sebagai kewajiban TSS

---

## Konteks

Sejak awal, dana operasional TSS bercampur antara dana CEO dan dana Ibu. Pencatatan tidak pernah memisahkan keduanya, sehingga pada saat reset pembukuan 31 Juli 2026 muncul pertanyaan: dana Ibu itu **hutang TSS ke Ibu**, atau **modal Ibu di TSS**?

Claude secara default memperlakukannya sebagai hutang. Alasannya konservatif — memperlakukan dana pihak lain sebagai kewajiban mencegah ekuitas terlihat lebih besar daripada kenyataan. Tapi itu asumsi akuntansi, bukan fakta tentang kesepakatan yang ada.

**Kesepakatan sebenarnya berbeda, dan CEO mengoreksinya secara eksplisit.**

## Keputusan

**Seluruh dana Ibu yang ada di TSS per 31 Juli 2026 dicatat sebagai MODAL AWAL.**

- Ibu adalah **pemilik modal bersama**, bukan kreditur
- Tidak ada kewajiban pengembalian dan tidak ada jadwal cicilan
- Setoran dana baru dari Ibu ke depan dicatat sebagai **tambahan modal**, bukan pinjaman
- Neraca awal TSS: Aset − Hutang ke pihak luar = Ekuitas milik Aditya + Ibu

## Konsekuensi

**Yang jadi lebih baik.** Ekuitas awal TSS lebih besar. Tidak ada beban kewajiban yang membayangi arus kas. Struktur ini jujur terhadap kenyataan: Ibu bukan pemberi pinjaman, dia salah satu pendiri bisnis ini — memory repo mencatatnya sebagai *founding catalyst* lewat relasi supplier yang dia bangun bertahun-tahun.

**Yang jadi tanggungan baru — dan ini bukan detail.** Modal bersama tanpa porsi tertulis adalah sumber konflik yang paling umum di bisnis keluarga. Selama porsinya tidak ditetapkan, setiap pembagian hasil ke depan bergantung pada ingatan dan niat baik, bukan pada angka.

**Yang belum ditetapkan dan harus ditetapkan:**

1. **Porsi modal Aditya vs Ibu** — dalam persentase atau nominal, tertulis, ditandatangani
2. **Dasar pembagian hasil** — mengikuti porsi modal, atau ada pengaturan lain
3. **Apa yang terjadi kalau salah satu ingin menarik modal** — mekanisme dan penilaiannya
4. **Apakah gaji owner Aditya dihitung sebelum atau sesudah pembagian hasil**

Nomor 1 harus keluar dari proses reset 31 Juli, karena setelah opname selesai angkanya baru bisa diketahui. Nomor 2–4 boleh menyusul, tapi jangan lebih dari satu bulan.

⚠️ Ini bukan nasihat hukum. Kalau porsi modal dituangkan dalam dokumen yang mengikat, atau menyangkut struktur CV Sederhana Maju Jaya secara formal, perlu dicek ke notaris atau yang paham hukum perseroan.

## Cara membalik

Tulis ADR baru yang menyebut ADR-0002 secara eksplisit. Jangan ubah dokumen lain untuk diam-diam menyatakan hal berlawanan.

## Dampak ke artefak yang sudah ada

| Artefak | Perubahan |
| --- | --- |
| `FORM_RESET_TSS_31JULI2026.xlsx` | Diperbarui — dana Ibu masuk Sheet 02 sebagai modal uang, bukan Sheet 03 sebagai hutang. Aturan sistem no. 4 diganti, aturan baru soal porsi modal ditambahkan |
| [Adendum 2](../ops/adendum-2-kanal-b2c-dan-koreksi-arah.md) | Tidak terpengaruh — tidak menyinggung struktur modal |
| Notion Decision Memory | Dicatat sebagai entri terpisah |
