# Operational Event Standard v1

| | |
|---|---|
| **Status** | Draft — proposed, pending CEO acceptance |
| **Date** | 1 Agustus 2026 |
| **Scope** | Satu envelope field yang dipakai bersama oleh **setiap** event operasional — Delivery, Shift, Incident, Cash, Inventory, Central Kitchen |
| **Does NOT define** | Field khusus bisnis, skema database, API, kode |
| **Builds on** | [Operational Accountability Architecture v1](operational-accountability-architecture-v1.md) §1/§2/§4 (Evidence, EventType taxonomy), [Workforce Assignment Architecture v1](workforce-assignment-architecture-v1.md) §3 (Assignment), Canonical Data Contract v1 §2 (Immutable History) |

Ini bukan taksonomi event baru — `operational-accountability-architecture-v1.md` §2 sudah mendaftar event apa saja yang ada (`GoodsDeparted`, `ShiftClosed`, dst.). Dokumen ini hanya mendefinisikan **bentuk amplop** yang sama dipakai setiap event, apa pun jenisnya — supaya modul Delivery, Shift, Incident, Cash, Inventory, dan Central Kitchen tidak masing-masing menciptakan bentuk sendiri.

---

## 1. Sembilan field, tidak lebih

| Field | Wajib? | Arti | Sumber/preseden |
|---|---|---|---|
| **EventID** | Ya | Pengenal unik satu kejadian tercatat | Pola sudah ada (`ID Kirim` di Buku Toko, `DEP-YYYYMMDD-...` di Delivery App) — format persis tetap milik masing-masing modul, Standard ini hanya mensyaratkan uniknya, bukan formatnya |
| **EventType** | Ya | Nama event, dari taksonomi yang **sudah** didefinisikan | `operational-accountability-architecture-v1.md` §2 — dokumen ini tidak menambah atau mengubah daftar itu |
| **BusinessUnit** | Ya | Unit bisnis tempat event terjadi | Canonical Data Contract §4 — nilai nyata: Toko Sembako Sejahtera, Central Kitchen, dst. |
| **AssignmentID** | Ya | Rujukan ke Today's Assignment yang berlaku saat event terjadi | `workforce-assignment-architecture-v1.md` §3. **Catatan jujur:** modul Assignment sesungguhnya belum dibangun — sampai ada, field ini boleh diisi turunan sederhana (mis. peran hasil pemetaan `ORANG.Peran`, seperti yang sudah dipakai Delivery App Increment 2) alih-alih ID Assignment sungguhan. Ini bukan pelanggaran Standard, ini tahap transisi yang diakui secara eksplisit |
| **Operator** | Ya | Orang yang benar-benar melakukan aksi | Terpisah dari AssignmentID — satu Assignment bisa dijalankan Primary atau Acting (Workforce Assignment §4), Operator selalu mencatat siapa yang benar-benar ada, apa pun status itu |
| **Evidence** | Ya | Rujukan ke bukti event ini — foto, angka terhitung, catatan | Isinya berbeda per EventType (Operational Accountability §4 sudah mendefinisikan evidence minimum per event) — Standard ini hanya mewajibkan *ada slot untuk itu*, tidak mendefinisikan isinya per jenis event |
| **ResponsibilityStatus** | Ya | `Recorded` / `Transferred` / `Disputed` — tiga nilai saja | `Recorded`: bukti ada, belum ada pihak kedua yang mengonfirmasi. `Transferred`: tanggung jawab sudah berpindah terbukti (mis. `GoodsReceived` mencocokkan `GoodsDeparted`). `Disputed`: sebuah Incident dibuka terhadap event ini (Operational Accountability §7 — status Incident itu sendiri tetap milik model Incident, tidak diduplikasi di sini) |
| **CreatedAt** | Ya | Waktu event ini pertama kali tercatat | Tidak pernah berubah setelah diisi — Immutable History (Canonical Data Contract §2) |
| **UpdatedAt** | Hanya kalau `ResponsibilityStatus` event ini bisa berubah | Waktu terakhir `ResponsibilityStatus` berubah | Satu-satunya field yang boleh berubah setelah `CreatedAt` adalah `ResponsibilityStatus` — fakta event itu sendiri (Evidence, Operator, dst.) tidak pernah ditimpa, sesuai Immutable History. `UpdatedAt` ada supaya perubahan status itu sendiri punya jejak waktu, tanpa menyentuh field lain. Event yang statusnya tidak pernah berubah (mis. `Observation` yang selesai begitu dicatat) boleh tidak punya field ini sama sekali |

**Tidak ada field kesepuluh.** Kalau sebuah modul butuh menyimpan sesuatu yang khusus untuknya (tujuan pengiriman, nilai selisih kas, item stok) — itu bukan bagian dari amplop ini, itu isi `Evidence` atau data khusus modul itu sendiri, di luar cakupan Standard.

---

## 2. Berlaku sama di enam modul

| Modul | Contoh `EventType` (dari taksonomi yang sudah ada) | Yang **tidak** ikut masuk envelope |
|---|---|---|
| Delivery | `GoodsDeparted`, `GoodsReceived` | Tujuan, isi foto — bagian dari `Evidence` |
| Shift | `ShiftOpened`, `ShiftClosed` | Nilai kas — bagian dari `Evidence` |
| Incident | `IncidentReported` | Status Incident (`Observation`/`Warning`/dst.) — model terpisah, §7 Accountability Architecture |
| Cash | `CashOpened`, `CashClosed` | Selisih, foto — `Evidence` |
| Inventory | `StockAdjusted`, `StockOpnameCompleted` | Barang, kuantitas — `Evidence`/data modul |
| Central Kitchen | Event sama seperti unit lain, `BusinessUnit = Central Kitchen` | Tidak ada event khusus CK — prinsipnya sama, hanya `BusinessUnit`-nya beda (Operational Accountability §0, "Central Kitchen managed separately but follows the same accountability philosophy") |

Satu envelope, enam modul, tanpa satu pun modul menciptakan bentuknya sendiri.

---

## 3. Contoh, bukan skema

Ilustrasi satu event nyata (Delivery App, Increment 2) diselaraskan ke Standard ini — bukan kode, hanya menunjukkan bagaimana field terisi:

| Field | Nilai |
|---|---|
| EventID | `DEP-20260801-SJ1-053200` |
| EventType | `GoodsDeparted` |
| BusinessUnit | Toko Sembako Sejahtera |
| AssignmentID | *(turunan sementara)* `Warehouse — Primary — Teh Dede` |
| Operator | Teh Dede |
| Evidence | 1 foto, catatan kosong |
| ResponsibilityStatus | `Recorded` (belum ada `GoodsReceived` yang cocok) |
| CreatedAt | 2026-08-01T05:32:00+07:00 |
| UpdatedAt | — (belum berubah) |

**Catatan jujur:** sheet `GOODS_DEPARTED` yang sudah dibangun di Increment 2 memakai nama kolom `Timestamp` dan `RoleStatus`, bukan `CreatedAt`/`ResponsibilityStatus` — dibangun sebelum Standard ini ada. Ini bukan pelanggaran yang perlu diperbaiki sekarang (di luar cakupan sprint ini — "Do NOT redesign existing architecture"), hanya dicatat di sini supaya penyelarasan nama kolom jadi pekerjaan sadar di masa depan, bukan ditemukan tanpa sengaja.

---

## 4. Yang sengaja tidak didefinisikan di sini

- Field khusus bisnis apa pun (tujuan, nilai kas, item stok, jenis Incident).
- Skema tabel/database.
- Kontrak API atau bentuk pemanggilan fungsi.
- Taksonomi event itu sendiri (tetap milik Operational Accountability Architecture §2).
- Model status Incident (tetap milik Operational Accountability Architecture §7).
- Bentuk Assignment yang sesungguhnya (tetap milik Workforce Assignment Architecture — modulnya sendiri belum dibangun).

Dokumen ini hanya amplopnya.
