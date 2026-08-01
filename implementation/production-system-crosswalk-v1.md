# Production System Crosswalk v1

**1 Agustus 2026. Read-only. Tujuan: menghilangkan asumsi sebelum commit baseline pertama — bukan migrasi, bukan implementasi.**

## Sumber yang dibaca untuk dokumen ini

- `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\Buku Toko dan Central Kitchen.xlsx` — export spreadsheet produksi, **artifact baru** untuk sprint ini. 14 sheet, dibuka dengan `openpyxl` (formula, conditional formatting, data validation, defined names semua diperiksa).
- `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\Code.gs` (2.880 baris, v2.1 · 30 Juli 2026), `Migrasi.gs` (214 baris), `Index.html`, `appsscripts.json` — dibaca penuh/mendalam pada bagian yang relevan.
- Dokumen audit sebelumnya: [`apps-script/buku-toko/SPEC.md`](../apps-script/buku-toko/SPEC.md), [`PATCH-01-performa-dan-dashboard.md`](../apps-script/buku-toko/PATCH-01-performa-dan-dashboard.md), [`ops/audit/2026-07-30-buku-toko-audit.md`](../ops/audit/2026-07-30-buku-toko-audit.md), [`implementation/appsscript-migration-plan.md`](appsscript-migration-plan.md).
- Silang-referensi ke `knowledge/business-formula-catalog-v1.md`, `knowledge/business-rules-catalog-v1.md`, `architecture/canonical-data-contract-v1.md`, `prototype/loka-canonical-poc/src/reporting/cards.js`, `prototype/loka-canonical-poc/src/dataset/roles.js`, ADR-0002, `dashboard-dataset.json` (output pipeline), dan `implementation/increment-1-product-review.md` (review kemarin).

**Catatan penting di awal:** sebagian besar dari apa yang ditemukan sprint ini **sudah pernah ditemukan** oleh `business-formula-catalog-v1.md` (dibangun dari Code.gs versi sebelumnya). Sprint ini tidak mengklaim menemukan formula-formula itu dari nol — kontribusi barunya adalah **bukti dari spreadsheet produksi yang sesungguhnya** (bukan hanya kode) yang mengonfirmasi, meng-upgrade status, atau membalikkan beberapa asumsi yang sebelumnya "belum bisa dipastikan". Di mana itu terjadi, disebut eksplisit.

---

## 1. Peta setiap worksheet

14 sheet. Tidak ada *named range*, tidak ada *conditional formatting*, tidak ada *data validation* di satu pun sheet — diperiksa langsung lewat `openpyxl` pada seluruh 14 tab. Semua aturan bisnis/validasi ditegakkan di kode Apps Script, bukan di fitur native spreadsheet (lihat §5).

| Sheet (nama tab asli) | Tujuan | Primary key | Kolom penting | Formula sheet-native | Data owner | Business owner |
|---|---|---|---|---|---|---|
| `ORANG` | Master pengguna & PIN | `Nama` (implisit — tidak ada kolom ID) | `PIN`, `Peran`, `Unit`, `Unit Dilihat` | Tidak ada | Sistem (append via `tambahOrang`/`setup`) | CEO |
| `MASTER` | Katalog harga barang Toko Sembako | `Nama Barang` | `Harga`, `Sumber Harga` | Tidak ada | Sistem (`perbaikiMaster`, `tambahBarang`, `simpanHarga`) | CEO |
| `CACHE_LOKA` | Cache metrik harian dari Loka (satu sel JSON) | Tidak ada (1 baris hidup) | `Ringkasan (jangan diedit manual)` | Tidak ada | Sistem — ditulis HANYA oleh `hitungRingkasLoka` (trigger 20:00) | CEO |
| `MASTER_CK` | Katalog harga barang Central Kitchen | `Nama Barang` | `Harga` (**semua 0**), `Sumber Harga` | Tidak ada | Sistem | Ibu & Teh Nurul (wewenang harga, per `CLAUDE.md`) |
| `BEBAN` | Log beban operasional (Gaji/Sewa/Listrik/Transport/Susut/Lain) | Tidak ada | `Jenis`, `Nilai` | Tidak ada | **Manusia — manual, belum pernah dipakai** | CEO |
| `BATAL` | Log pembatalan kiriman | Tidak ada | `ID Kirim`, `Alasan` | Tidak ada | Sistem (`batalkanKiriman`) | CEO |
| `LOG_AKSES` | Audit trail login & aksi | Tidak ada (append-only) | `Nama`, `Aksi` | Tidak ada | Sistem, otomatis | CEO |
| `KELUAR` | Kiriman barang keluar antar unit/cabang | `ID Kirim` (bukan unik per baris — grup per kiriman) | `Barang`, `Qty`, `Nilai`, `ID Kirim`, `Unit Asal` | Tidak ada | Sistem (`simpanKeluar`) | CEO |
| `TERIMA` | Konfirmasi terima barang | `ID Kirim` + `Barang` | `Qty Diterima`, `ID Kirim` | Tidak ada | Sistem (`simpanTerima`) | CEO |
| `REKAP` | Rekonsiliasi Keluar vs Terima | `ID Kirim` + `Barang` | `Selisih`, `Status` | Tidak ada | Sistem (`rekapHarian`, trigger 21:00) | CEO |
| `HARGA_LOG` | Log perubahan harga | Tidak ada | `Harga Lama`, `Harga Baru` | Tidak ada | Sistem (`simpanHarga` — **kosong di data, lihat §6**) | CEO |
| `DOMPET` | Definisi dompet/wallet, berversi tanggal | `Kode` | `Berlaku Dari`, `Berlaku Sampai` | Tidak ada | Manusia (`setup`, sunting manual untuk migrasi 31 Jul) | CEO |
| `TUTUP_SHIFT` | Tutup kas harian per kasir, dengan bukti foto | Tidak ada (1 baris/hari/kasir) | `Selisih`, `Status`, kolom 23-26 (**baru v2.1**: Saldo Brankas Awal, Tanggal Setor Fisik, Referensi Mutasi, Status Setoran) | Tidak ada | Sistem (`simpanTutupShift`) | CEO |
| `TARGET` | Target laba per unit | `Unit` | `Target Laba / Bulan` | Tidak ada | Manusia (edit langsung) | CEO |

**Catatan silang dengan `SPEC.md`:** dokumen `apps-script/buku-toko/SPEC.md` (ditulis sebelum Code.gs terbaca) memakai nama alias berbahasa Indonesia untuk sheet-sheet ini (`Pengguna`, `Katalog TSS`, `Katalog CK`, `Ringkasan`, `Log Aktivitas`, `Kirim`, `Terima`, `Rekonsiliasi`, `Log Perubahan Harga`) — **bukan nama tab sesungguhnya** (`ORANG`, `MASTER`, `MASTER_CK`, `CACHE_LOKA`, `LOG_AKSES`, `KELUAR`, `TERIMA`, `REKAP`, `HARGA_LOG`). Dua sheet sama sekali tidak disebut di `SPEC.md`: **`BATAL`** dan **`BEBAN`** — padahal `BEBAN` ternyata adalah sheet paling penting untuk pertanyaan laba bersih (lihat §6, temuan #1). `SPEC.md` juga masih menyatakan "Kode belum ada di repo" — sudah tidak akurat sejak Code.gs terbaca. Ini bukan salah data, tapi berisiko membuat siapa pun yang hanya membaca `SPEC.md` melewatkan dua sheet ini dan mengira source tetap tidak terbaca.

---

## 2. Peta dependensi Apps Script

90 fungsi di `Code.gs`, ditelusuri langsung dari source (bukan dari dokumen migrasi sebelumnya) untuk memetakan dependensi sheet, Drive, Properties, trigger, API eksternal.

### Sheet dibaca/ditulis, per fungsi (fungsi bantu internal `_xxx` disertakan karena merekalah yang benar-benar menyentuh sheet)

| Fungsi | Sheet |
|---|---|
| `setup` | `ORANG, BEBAN, BATAL, DOMPET, HARGA_LOG, KELUAR, LOG_AKSES, REKAP, TARGET, TERIMA, TUTUP_SHIFT` (buat semua kalau belum ada) |
| `_siapa`, `ambilKonfigurasi` (baca), `tambahOrang`, `nonaktifkanOrang` (tulis) | `ORANG` |
| `_bacaMaster('MASTER'\|'MASTER_CK')` — dipanggil dari `ambilKonfigurasi` | `MASTER`, `MASTER_CK` |
| `simpanHarga`, `tambahBarang` | `MASTER` atau `MASTER_CK` (dinamis, tergantung `payload.sheet`) + `HARGA_LOG` (tulis log) |
| `_statusHargaCK` | `MASTER_CK` |
| `_ringkasLoka` (baca), `hitungRingkasLoka`→`_simpanRingkas` (tulis) | `CACHE_LOKA` |
| `_bebanBulan` | `BEBAN` |
| `batalkanKiriman` | `BATAL` (tulis) + `KELUAR` (tandai batal) |
| `_catatAkses`, `_catatPinSalah` | `LOG_AKSES` |
| `simpanKeluar`, `_semuaKeluar`, `_isiUlangTujuanTerima` | `KELUAR` |
| `simpanTerima`, `_hapusTerima`, `_petaTerima` | `TERIMA` |
| `rekapHarian`→`_tulisRekap` | `KELUAR` + `TERIMA` (baca) → `REKAP` (tulis) |
| `_dompetBerlaku` | `DOMPET` |
| `simpanTutupShift`, `dataShift`, `cekHarianKas`, `setBrankasMenu` | `TUTUP_SHIFT` |
| `_targetUnit` | `TARGET` |
| `dashboard` | `KELUAR`, `TUTUP_SHIFT` (baca) + `_ringkasLoka` (CACHE_LOKA) + `_bebanBulan` (BEBAN) + `_targetUnit` (TARGET) — **agregator utama, satu-satunya fungsi yang membaca 4+ sheet sekaligus** |
| `dashboardCK` | `MASTER_CK` (via `_statusHargaCK`) + `_targetUnit` (TARGET) + spreadsheet **eksternal** (lihat di bawah) |
| `_migrasiIdKirim` (di Code.gs) | `KELUAR`, `TERIMA` |

### Drive, Script Properties, Trigger, Email, API eksternal

| Aspek | Detail |
|---|---|
| **Folder Drive dipakai** | `Loka Kasir` → sub `JSON` (`FOLDER_LOKA_JSON`, dibaca `hitungRingkasLoka`) — file `loka-YYYY-MM-DD.json` terbaru dipilih otomatis. `Buku Toko - Bukti Tutup Shift` (`FOLDER_BUKTI`, dibuat otomatis kalau belum ada) — foto tutup shift, path `YYYY-MM/YYYY-MM-DD_<Nama>_<jenis>.jpg`. |
| **Script Properties dipakai** | `FOLDER_LOKA_JSON_ID`, `FOLDER_BUKTI_ID` (cache ID folder — pola yang sama persis ditiru di [`apps-script/dashboard/Code.gs`](../apps-script/dashboard/Code.gs) untuk `FOLDER_DATASET_ID`), `TAB_REKAP_SJ4` (cache nama tab di spreadsheet CK eksternal). |
| **Document Properties** | 1 pemakaian, di `setBrankasMenu` — beda namespace dari Script Properties, tidak dicek di tempat lain. |
| **Trigger terjadwal** (dipasang oleh `setup()`, sekali jalan manual) | `rekapHarian` @21:00 · `kirimPOMalam` @23:00 · `hitungRingkasLoka` @20:00 · `cekHarianKas` @07:00 |
| **Email (`MailApp`)** | `_kabarHarga`, `_kabarPO`, `_kabarShift`, `_kirimAlarm`, `cekHarianKas` — semua ke alamat Google Workspace pemilik skrip, bukan ke pelanggan. |
| **API eksternal (`UrlFetchApp`)** | **Tidak ada satu pun** di seluruh 2.880 baris. Tidak ada pemanggilan API WhatsApp — `_wa()` hanya menormalkan nomor ke format `62xxx`, dipakai untuk link `wa.me/` yang dibuka manual, bukan pengiriman otomatis. Ini mengonfirmasi ulang temuan `live-connector-feasibility-v1.md` sebelumnya (tidak ada integrasi API eksternal di sistem produksi). |
| **File dihasilkan** | Foto (upload dari client), `CACHE_LOKA` (JSON per hari), email laporan migrasi/PO/alarm. Tidak ada file yang ditulis ke Drive selain foto. |
| **Spreadsheet eksternal tersembunyi** | `dashboardCK()` membuka spreadsheet **LAIN** (`ID_BUKU_SJ4`, "Buku biaya SJ 4") yang **sama sekali tidak ada di export xlsx yang dibaca sprint ini**. Seluruh sisi omzet/kontribusi Central Kitchen yang ditampilkan ke Teh Nurul/Sri Nurul berasal dari spreadsheet yang tidak pernah diaudit di sprint mana pun sejauh ini. **UNKNOWN — genuine blind spot**, bukan sekadar belum dibaca: dokumen ini tidak bisa memverifikasi angka CK apa pun. |

### Duplikasi fungsi — dikonfirmasi ulang, dengan detail baru

`Code.gs` dan `Migrasi.gs` **berdua** mendefinisikan `migrasiIdKirimUjiCoba()` / `migrasiIdKirimJalankan()` — nama fungsi publik yang sama persis. `implementation/appsscript-migration-plan.md` sudah pernah mencatat ini sebagai duplikasi; sprint ini membaca isi keduanya dan menemukan **perilakunya benar-benar berbeda**, bukan sekadar duplikat identik:

- `Code.gs::_migrasiIdKirim` hanya memperbaiki baris yang ID lamanya mengandung literal `'SEDERH'` (format lama).
- `Migrasi.gs::_migrasiId` mengelompokkan ulang SEMUA baris berdasarkan tanggal+unit+tujuan+rit, mendeteksi ambiguitas (satu nama barang cocok ke lebih dari satu kiriman pending), dan menandai kasus itu untuk keputusan manual (`ragu[]`).

**Konsekuensi nyata:** hanya versi `Migrasi.gs` yang bisa menyelesaikan bug spesifik dari audit 30 Juli (Micin Sobaso Rp455.000 salah tercatat "belum dikonfirmasi" — lihat §6). Karena Apps Script menggabungkan semua file `.gs` ke satu namespace global, definisi mana yang benar-benar aktif tergantung urutan file di editor — **UNKNOWN dari sini**, tidak bisa dipastikan tanpa membuka Apps Script Editor langsung.

---

## 3. Data-flow diagram

Diamati langsung dari kode dan data, bukan diasumsikan dari nama sheet:

```
POS Loka (kasir fisik, per hari)
   │
   ├─→ export loka-YYYY-MM-DD.json ──→ Drive folder "Loka Kasir/JSON"
   │        │
   │        ▼ (trigger hitungRingkasLoka, 20:00 harian)
   │     CACHE_LOKA (1 sel JSON: margin, GMROI, DIO, DSO, siklus kas,
   │                 stok mati, stok menipis, piutang, per-kategori,
   │                 per-pelanggan, proyeksi bulan)
   │        │
   └─→ backup .realm ──────────────→ Drive folder terpisah (dipakai
                                      penelitian APK/Realm sebelumnya,
                                      TIDAK dibaca Code.gs sama sekali)

BEBAN (manual, oleh manusia) ──┐
                                ├─→ dashboard() → labaBersihBulan
CACHE_LOKA (laba kotor) ───────┘   (HANYA kalau BEBAN bulan ini > 0)

ORANG (PIN) ──→ _siapa() ──→ semua fungsi ber-pin (gerbang akses)

KELUAR (kirim) ──→ TERIMA (konfirmasi) ──→ REKAP (rekonsiliasi,
                                             trigger rekapHarian 21:00)
                         │
                         └─→ dashboard() → "N pengiriman belum dikonfirmasi"

TUTUP_SHIFT (manual + foto) ──→ dashboard() → uangDiTangan, selisih kas
DOMPET (manual, berversi tanggal) ──→ dashboard() → total per dompet bulan ini
TARGET (manual) ──→ dashboard() → proyeksi vs target

dashboard()/dashboardCK() ──→ Index.html (client, PIN-gated) ──→ 8 pengguna

                        ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
                        TIDAK ADA JALUR OTOMATIS dari sistem ini ke
                        Enterprise OS. Jalur yang ADA (dibangun manual,
                        Increment 1):

Loka backup (.realm, manual copy) ──→ prototype/loka-canonical-poc
   Connector → canonical.json → Reporting Service → Dataset Builder
   → dashboard-dataset.json (manual copy) ──→ Drive "Dashboard Data"
   ──→ apps-script/dashboard (Code.gs baru) ──→ CEO/Ibu/Ayu (rencana)
                        ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
```

**Perbedaan dari diagram contoh di instruksi sprint ini** ("Loka Backup → Import Sheet → Business Processing → Dashboard → Enterprise OS"): tidak ada langkah "Import Sheet" — Loka masuk lewat **export JSON ke Drive**, bukan diimpor ke sheet apa pun. Dan yang paling penting: **Enterprise OS dan Buku Toko adalah dua jalur data yang sepenuhnya terpisah dan tidak saling bicara.** Buku Toko tidak tahu Enterprise OS ada. Enterprise OS membaca `.realm` backup secara independen, lewat pipeline Node.js-nya sendiri — bukan lewat `CACHE_LOKA` atau sheet mana pun di Buku Toko. Dua sistem menghitung margin/GMROI/dll dari sumber Loka yang sama, dengan kode yang sama sekali berbeda, tanpa saling verifikasi.

---

## 4. Perbandingan Spreadsheet vs Enterprise OS

| Kategori | Item | Keterangan |
|---|---|---|
| **Already represented** | Gross Profit, Today's Revenue, Transaction Count, Inventory Value | Ada di `dashboard-dataset.json` DAN di `CACHE_LOKA`, dihitung independen dari `.realm`/JSON Loka yang sama. Nilai berbeda tipis karena sumber (backup `.realm` vs export JSON harian) dan tanggal snapshot berbeda — bukan kontradiksi, tapi dua potret waktu yang berbeda. |
| | Margin per kategori (Beras/Minyak/dll) | `CACHE_LOKA.kategori[]` vs `dashboard-dataset.json` tidak punya card per-kategori langsung, tapi angka yang sama sudah dikutip berulang di `CLAUDE.md`/session log — sumbernya justru `CACHE_LOKA`, bukan pipeline Enterprise OS. |
| **Partially represented** | Expenses | Enterprise OS `expenses` card = `Expense.items[].price` dari Loka (Rp18.517.444, Juli). Buku Toko `BEBAN` sheet = beban operasional sesungguhnya (Gaji/Sewa/Listrik/dll) — **kosong**. Dua konsep berbeda memakai nama yang sama; lihat temuan #1 di §6. |
| | Net Profit | Formula ada dan hidup di produksi (`dashboard()`), sudah dikatalog di `business-formula-catalog-v1.md` (FIN-F-02), tapi pipeline Enterprise OS (`cards.js`) masih memblokirnya. Lihat §6 #2. |
| | Outstanding Receivables | Production menghitungnya trivial dari `Invoice.status==='PENDING'` — entity yang SAMA yang sudah dibaca Enterprise OS untuk `todays-revenue`/`gross-profit`. Card Enterprise OS tetap `unavailable` karena BL-006 mengasumsikan perlu entity `InvoiceDebt` baru. |
| **Missing** | Cash in Hand, Safe Cash | Dikonfirmasi ulang: sumber tunggalnya memang `TUTUP_SHIFT`, seperti caveat card Enterprise OS sudah nyatakan — tidak ada jalur lain. |
| | Goods Out (distribusi antar unit) | Seluruh sistem `KELUAR`→`TERIMA`→`REKAP` — lengkap, berjalan, dengan skema ID dan status rekonsiliasi sendiri. Sama sekali di luar cakupan pipeline kanonikal Enterprise OS (yang hanya membaca Loka). |
| | Cash custody policy (Runbook Kustodi Kas) | `BATAS_BRANKAS_MENGINAP`, `BATAS_PENDAMPING` — tidak disebut di ADR mana pun atau dokumen governance Enterprise OS. |
| | Dompet/BRI migration | Perubahan rute setoran (lihat §6 #6) — tidak ada di ADR-0002 atau dokumen mana pun Enterprise OS. |
| **Duplicated** | Perhitungan margin/GMROI/DIO/DSO/siklus kas | Dihitung dua kali, dua sistem, dua source-of-truth berbeda dari input Loka yang (kurang lebih) sama. Belum pernah direkonsiliasi satu sama lain — `reports/dashboard-reconciliation-audit.md` merekonsiliasi Enterprise OS terhadap Loka, tapi tidak terhadap `CACHE_LOKA` Buku Toko. |
| **Contradictory** | "Tiga dompet" (`CLAUDE.md`, ADR-0002) vs realita | `CLAUDE.md` & ADR-0002 menyebut tiga dompet: Kasir Toko, Dompet Owner, Kas Ibu. Sheet `DOMPET` produksi punya **lima kode** (`KAS_KASIR`, `KAS_TUNAI`, `SETOR_IBU` [berakhir 30 Jul], `KAS_BRI` [mulai 31 Jul], `PRIVE`). Ini bukan salah hitung — dokumennya sudah usang relatif terhadap perubahan yang baru terjadi kemarin. |
| | "Ibu" sebagai identitas pengguna | Roster `apps-script/dashboard/Code.gs` (Increment 1, kemarin) memberi "Ibu" PIN dan akses. Sheet `ORANG` produksi **tidak punya baris untuk "Ibu" sama sekali** — lihat §6 #3. |

---

## 5. Aturan bisnis tersembunyi

Diperiksa langsung: conditional formatting, formula sheet, lookup table, status kolom, validasi, named range — di seluruh 14 sheet.

- **Conditional formatting: nihil.** Tidak satu sheet pun memakainya.
- **Formula sheet-native: nihil.** Tidak ada satu sel `=...` di seluruh workbook. Semua "formula" bisnis (margin, GMROI, DIO, DSO, laba bersih, dst.) dihitung di Apps Script (`_olahLoka`, `dashboard`), lalu hasilnya ditulis sebagai **nilai statis** (JSON di `CACHE_LOKA`, atau kolom biasa). Ini konsisten dengan gaya kode yang sudah diamati sebelumnya — logika bisnis hidup di kode, bukan di spreadsheet.
- **Data validation: nihil.** Tidak ada dropdown/validasi bawaan Sheets di kolom manapun (termasuk `Status`, `Peran`, `Jenis` — yang di kode dibatasi lewat konstanta seperti `TUJUAN[]`, `KODE_TUJUAN{}`, tapi di level spreadsheet siapa pun bisa mengetik apa saja).
- **Named ranges: nihil.**
- **Status kolom sebagai aturan bisnis implisit** (bukan validasi, tapi state machine yang hanya hidup di konvensi):
  - `REKAP.Status`: `COCOK` / `BELUM DIKONFIRMASI` / (`SELISIH` didefinisikan di kode tapi **belum pernah teramati** di data — dikonfirmasi ulang dari audit 30 Jul, masih berlaku di snapshot 1 Agustus).
  - `TUTUP_SHIFT.Status`: `WAJAR` / `PERLU DICEK` — ambang batasnya `BATAS_SELISIH = 30000` (Rp30rb), sebuah *magic number* di kode, tidak didokumentasikan di ADR/knowledge manapun sampai sprint ini.
  - `TUTUP_SHIFT.Status Setoran` (**baru v2.1**): `MENUNGGU VERIFIKASI` — state baru untuk siklus setor-ke-BRI, belum ada dokumentasi SOP-nya di mana pun.
- **Lookup table tersembunyi di kode, bukan di sheet:** `KODE_TUJUAN{}` (nama cabang → kode 3 huruf), `UNIT_NAMA{}`, `DOMPET_AWAL[]`, `MASTER_ITEM[]`/`MASTER_CK[]` (data seed, dipakai ulang oleh `perbaikiMaster()` untuk "menyembuhkan" sheet yang rusak). Kalau sheet dan konstanta kode ini pernah berbeda, kode akan menimpa sheet saat menu perbaikan dijalankan — arah kebenarannya dari kode ke sheet, bukan sebaliknya.
- **Aturan akses yang hanya hidup di kode (`_menuPeran`, `_unitBoleh`, `_boleh`):** `dashboard()`/`dashboardCK()` **hanya bisa dibuka peran `OWNER`** — `KASIR`, `PENYIAP`, `PENGANTAR`, `PENERIMA` semuanya `_unitBoleh() → []`, jadi otomatis ditolak apa pun isi `Unit Dilihat` mereka. Ini aturan akses paling penting yang ditemukan sprint ini — lihat §6 #4.
- **Aturan tanggal-berlaku pada `DOMPET`:** `Berlaku Dari`/`Berlaku Sampai` membuat baris dompet punya masa berlaku (`_dompetBerlaku(tgl)` memfilter berdasarkan ini) — pola versioning yang tidak dipakai di sheet lain manapun di workbook ini.

---

## 6. Pengetahuan produksi yang belum ada di Enterprise OS — TASK PALING PENTING

Diurutkan dari yang paling penting secara operasional ke yang paling tidak. Untuk masing-masing: apa yang produksi tahu, dan kenapa itu penting.

**#1 — Net Profit sudah punya formula nyata di produksi, dan formula itu SAMA PERSIS dengan yang sudah dikatalog di `business-formula-catalog-v1.md` (FIN-F-02/FIN-008) tapi belum sampai ke pipeline.**
`dashboard()` (Code.gs:2011-2012) menghitung `labaBersihBulan = labaKotorBulan - beban`, **hanya ditampilkan kalau `beban > 0`** — komentar kode di baris 1887-1899 bahkan menceritakan langsung insiden yang jadi sumber aturan `CLAUDE.md` soal gross-vs-net ("dashboard sebelumnya menyesatkan... angka benar yang salah label"). Katalog formula sudah menandai ini (Finding, FIN-F-02 §14) sebagai "revisi premis" terhadap `cards.js` yang memblokir Net Profit karena "tidak ada formula yang confirmed." **Bukti baru dari sprint ini:** formula ini terbukti **hidup di produksi** (bukan sekadar ada di source, belum pernah jalan) — tapi `BEBAN` di snapshot ini masih kosong, jadi bahkan di produksi sendiri, laba bersih **tidak sedang ditampilkan hari ini** — bukan karena formulanya dilarang, tapi karena input datanya belum diisi. Ini satu-satunya temuan yang, kalau ditindaklanjuti (isi `BEBAN`), langsung memperbaiki angka paling penting di seluruh bisnis, di dua sistem sekaligus.

**#2 — "Ibu" tidak punya identitas digital di sistem manapun yang bisa diaudit repo ini.**
Sheet `ORANG` cuma punya 2 peran `OWNER`: Aditya (unit TSS, lihat `TSS,CK`) dan **Sri Nurul** (unit CK, lihat `CK`). Tidak ada baris untuk "Ibu". 173 baris `LOG_AKSES` tidak menyebut nama itu sekali pun. `Sri Nurul` kemungkinan besar adalah "Teh Nurul" yang disebut di `CLAUDE.md`/ADR-0002 (cocok: peran OWNER unit CK, sesuai bahasa ADR-0002 "Ibu & Teh Nurul" sebagai otoritas bersama CK) — bukan "Ibu" itu sendiri. Roster `apps-script/dashboard/Code.gs` (kemarin) memberi "Ibu" PIN placeholder — itu bukan sekadar "PIN belum dikonfirmasi", itu **pertama kalinya orang ini punya identitas digital apa pun di seluruh ekosistem sistem CV Sederhana Maju Jaya yang terlihat dari repo ini.** Keputusan itu lebih besar dari yang tercatat di `increment-1-product-review.md` kemarin.

**#3 — Dashboard finansial (`dashboard()`/`dashboardCK()`) di produksi hanya bisa dibuka peran `OWNER` — kasir tidak punya akses sama sekali.**
`_boleh(orang, 'dashboard')` memanggil `_unitBoleh(orang)`, dan `_unitBoleh` mengembalikan `[]` untuk siapa pun yang bukan `OWNER` — sebelum sempat memeriksa `Unit Dilihat`. Ayu (KASIR) **tidak bisa** membuka `dashboard()` hari ini, titik. Ini preseden akses nyata dan sudah berjalan, bukan rancangan di atas kertas — relevan langsung untuk keputusan `KARTU_UNTUK_CASHIER` yang masih menunggu konfirmasi CEO di Increment 1 (`increment-1-product-review.md` §3, §6#4). Enterprise OS Increment 1 memberi Ayu 2 kartu finansial; produksi memberi Ayu nol.

**#4 — Spreadsheet ID Buku Toko tidak lagi UNKNOWN.**
`1yFF83m2Cd3v8WYU-6jDZTSGB-2TPEAIkJkBmH1iM_D8`, tercatat di `apps-script/buku-toko/SPEC.md` baris 4 — dokumen yang sudah ada di repo ini sejak 31 Juli, sebelum Increment 1 dikerjakan. Alasan roster berdiri sendiri di `apps-script/dashboard/Code.gs` ("ID tidak diketahui dari mana pun yang bisa dibaca") **tidak lagi benar** hari ini. Ini tidak mengubah keputusan yang sudah diambil kemarin (dokumen itu tidak diminta diubah di sprint ini), tapi mengubah premis di baliknya — layak ditinjau ulang di sprint implementasi berikutnya, bukan dianggap selesai.

**#5 — Kebijakan kustodi kas dengan ambang angka pasti sudah berlaku sejak kemarin, tidak terdokumentasi di ADR manapun.**
`BATAS_BRANKAS_MENGINAP = Rp2.000.000` (di atas ini wajib disetor hari itu), `BATAS_PENDAMPING = Rp5.000.000` (di atas ini jangan berangkat sendirian) — komentar kode menyebutnya "Runbook Kustodi Kas, berlaku 31 Jul 2026". Tidak ada dokumen bernama "Runbook Kustodi Kas" di repo ini. **UNKNOWN** apakah runbook itu ada di tempat lain (Notion? WA?) atau hanya hidup sebagai komentar kode.

**#6 — Migrasi dompet Ibu → BRI sudah berjalan, bukan lagi rencana.**
Setoran pertama ke BRI tercatat 31 Juli (Rp6.400.000, `Status Setoran: MENUNGGU VERIFIKASI`). Audit 30 Juli menandai ini sebagai blocker 🔴 karena "tidak ada SOP, tidak ada catatan Ayu sudah diberi tahu, dari mana Ibu beli stok besok jika setoran pindah ke BRI." Data menunjukkan mekanismenya (kolom tracking) sudah dibangun (`Code.gs` v2.1), tapi **tidak ada bukti di data bahwa tiga pertanyaan operasional itu sudah terjawab** — hanya bahwa transaksinya sudah terjadi. `ADR-0002` (tiga dompet) belum diperbarui untuk mencerminkan struktur lima-kode yang sekarang berlaku.

**#7 — Outstanding Receivables dan Stock Alerts sudah bisa dihitung dari data yang SUDAH dibaca connector Enterprise OS — tidak perlu entity baru.**
`_olahLoka` (Code.gs:1778-1783) menghitung piutang dari `Invoice.status === 'PENDING'` — entity `Invoice` yang sama yang sudah dipakai `todays-revenue`/`gross-profit`. `stokMenipis` (baris 1775-1776) dihitung murni dari kecepatan jual (`Product.stock` ÷ rata-rata terjual/hari) — tidak perlu field `stockAlert` terpisah seperti diasumsikan BL-012. Katalog formula sudah mencatat ini untuk piutang (FIN-F-11); sprint ini mengonfirmasi pola yang sama berlaku untuk stock alert.

**#8 — "Goods Out" bukan data yang hilang — itu seluruh sistem `KELUAR`→`TERIMA`→`REKAP`, hanya di luar Loka.**
BL-013 benar bahwa Loka tidak memodelkan distribusi antar-cabang — tapi salah kalau dibaca sebagai "datanya tidak ada di mana pun." Sistemnya lengkap: skema ID (`YYYYMMDD-UNIT-TUJUAN-Rn`), status rekonsiliasi (`COCOK`/`BELUM DIKONFIRMASI`), 112 baris kiriman aktif per 1 Agustus. Sumbernya beda (spreadsheet Buku Toko, bukan Loka), bukan tidak ada.

**#9 — `BEBAN` — satu-satunya tempat yang dirancang untuk mencatat beban operasional sungguhan — belum pernah dipakai.**
Hanya berisi satu baris `CONTOH` (placeholder, harus dihapus manual). Ini menjelaskan langsung kenapa `CLAUDE.md` mencatat "laba bersih −Rp1,4 jt" berasal dari **analisis manual**, bukan sistem manapun: tidak ada sistem yang punya datanya. Ini juga sebab langsung kenapa temuan #1 di atas belum bisa ditampilkan hari ini — formulanya siap, inputnya kosong.

**#10 — Status delapan temuan audit 30 Juli, diperbarui dengan data 1 Agustus:**

| # | Temuan 30 Jul | Status 1 Agustus |
|---|---|---|
| 1 | CK tanpa data biaya | **Masih terbuka.** `MASTER_CK` masih 100% `Harga=0`. |
| 2 | Migrasi dompet tidak terdokumentasi | **Sebagian selesai.** Mekanisme tracking sudah ada (v2.1); tiga pertanyaan operasional dari audit tidak terverifikasi terjawab. |
| 3 | Selisih 27 Jul Rp2.101.810 belum dijelaskan | **Masih terbuka**, sekarang 5 hari, status baris tidak berubah (`PERLU DICEK`). |
| 4 | Bug ID kiriman Rp455rb | **Kemungkinan masih terbuka** untuk baris historis 28 Jul (tidak berubah di data); format ID baru (29 Jul dst.) tidak lagi memakai `SEDERH`, jadi kasus baru tampak berhenti muncul. |
| 5 | Rekonsiliasi berhenti 29 Jul | **Selesai.** `REKAP` sekarang mencakup sampai 31 Jul. |
| 6 | `Unit Dilihat` hanya 2/8 terisi | **Tidak berubah.** Masih 2/8 (Aditya, Sri Nurul). |
| 7 | `HARGA_LOG` kosong | **Tidak berubah.** Masih nol baris data. |
| 8 | Higiene katalog CK (duplikat Gudeg, kategori "Tambahan" jadi buangan) | **Sebagian selesai.** Duplikat Gudeg sudah tidak ada. Kategori "Tambahan" masih dipakai sebagai buangan, malah bertambah isinya (kini termasuk "Kaki Sapi"). |

---

## 7. Peluang mengurangi kerja operasional segera

Hanya yang memenuhi syarat: mengurangi kerja manual, mengurangi kesalahan, atau mengurangi input dobel. Tidak ada yang butuh kode baru kecuali disebutkan.

1. **Isi `BEBAN` bulan ini.** Nol baris kode. Begitu terisi, `dashboard()` produksi otomatis menampilkan laba bersih yang sudah lama dihitung tapi tidak pernah tampil. Dampak terbesar-per-usaha di seluruh temuan ini.
2. **Isi `Unit Dilihat` untuk 6 pengguna yang masih kosong.** Nol baris kode — kolom sudah ada, logikanya (`_unitBoleh`) sudah membacanya. Menutup temuan #6 audit 30 Juli yang sudah 2 hari lebih lama tanpa tindakan.
3. **Putuskan definisi menyeluruh untuk fungsi migrasi ID Kirim yang mana yang dipakai** (`Code.gs` vs `Migrasi.gs`) — bukan menulis kode baru, hanya menghapus salah satu definisi yang duplikat supaya perilakunya pasti. Mencegah kejadian Rp455rb berulang dengan cara yang tidak bisa diprediksi.
4. **Rekonsiliasi `CACHE_LOKA` (Buku Toko) vs `dashboard-dataset.json` (Enterprise OS) satu kali saja**, untuk memastikan dua sistem yang menghitung margin dari sumber Loka yang sama menghasilkan angka yang bisa dipertanggungjawabkan berdampingan — bukan mengganti salah satu, hanya membandingkan.
5. **Pindahkan `roles.js`/dataset builder Enterprise OS untuk membaca `Invoice.status==='PENDING'` untuk Outstanding Receivables**, memakai entity yang sudah ada — ini pekerjaan implementasi (di luar scope "tidak boleh implementasi" sprint ini), tapi layak dicatat sebagai kandidat kerja termurah-berdampak-tinggi berikutnya begitu fase implementasi dibuka lagi.

---

## Final Question

**"What does the production system know that Enterprise OS still does not know?"**

Diurutkan berdasarkan kepentingan operasional (ringkas dari §6, lihat detail di atas):

1. Formula Net Profit sudah nyata, hidup di produksi, dan hanya tertahan oleh `BEBAN` yang kosong — bukan oleh larangan bisnis.
2. "Ibu" tidak punya identitas digital di sistem manapun yang teraudit — Increment 1 baru saja menciptakannya untuk pertama kali.
3. Dashboard finansial produksi adalah OWNER-only; kasir (Ayu) tidak diberi akses sama sekali hari ini.
4. Spreadsheet ID Buku Toko sudah didokumentasikan di repo sejak 31 Juli — bukan lagi blocker yang sah.
5. Kebijakan kustodi kas (`Rp2 jt`/`Rp5 jt`) dan migrasi dompet ke BRI sudah berlaku sejak kemarin, di luar dokumen governance manapun.
6. Piutang dan peringatan stok bisa dihitung dari data yang sudah dibaca connector — bukan butuh entity baru seperti diasumsikan.
7. "Goods Out" adalah sistem penuh (`KELUAR`/`TERIMA`/`REKAP`) yang hidup di luar Loka — bukan data yang hilang.
8. Lima dari delapan temuan audit 30 Juli masih terbuka tanpa perubahan lima hari kemudian.

Yang **tetap UNKNOWN** dan jujur tidak bisa dijawab dari sprint ini: seluruh sisi omzet Central Kitchen (spreadsheet "Buku biaya SJ 4" tidak pernah teraudit), apakah keempat trigger terjadwal benar-benar berjalan tanpa error, apakah email `MailApp` benar-benar dibaca siapa pun, definisi mana dari fungsi migrasi ID Kirim yang sebenarnya aktif, dan apakah rekening BRI tujuan setoran adalah rekening resmi usaha atau pribadi.

