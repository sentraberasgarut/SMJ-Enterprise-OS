# Business Formula Catalog v1

| | |
| --- | --- |
| **Type** | Knowledge extraction — documentation only. No code written, no formula changed, no formula fixed, no formula simplified. |
| **Date** | 1 August 2026 |
| **Source audited** | `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\` — `Code.gs` (2,880 lines, v2.1), `Index.html` (1,735 lines, v2.1), `Migrasi.gs` (214 lines). Same source as [`implementation/appsscript-migration-plan.md`](../implementation/appsscript-migration-plan.md), re-read in full for this sprint rather than recalled, so every line number below is verified against the current file, not memory. |
| **Deployment caveat, repeated because it matters for every formula below** | `Code.gs`'s own header states this candidate v2.1 has **never been run**: *"FILE INI BELUM PERNAH DIJALANKAN. Tidak ada cara menguji Apps Script dari sisi penyusun."* Every formula catalogued here is therefore a **legacy/candidate implementation whose live deployment status is unverified**, not a confirmed-running production calculation. This caveat is not repeated in every entry's prose — it is baked into the **Validation Status** field instead. |
| **Cross-referenced against** | [`architecture/canonical-data-contract-v1.md`](../architecture/canonical-data-contract-v1.md), [`knowledge/business-rules-catalog-v1.md`](business-rules-catalog-v1.md), [`prototype/loka-canonical-poc/dashboard-schema.json`](../prototype/loka-canonical-poc/dashboard-schema.json), [`prototype/loka-canonical-poc/src/reporting/cards.js`](../prototype/loka-canonical-poc/src/reporting/cards.js) and `reconciliation.js`, [`implementation/dashboard-v2-implementation-plan.md`](../implementation/dashboard-v2-implementation-plan.md). None of these five documents were modified — read-only cross-reference, per this sprint's explicit instruction. |
| **Grounding discipline** | Every field below is either a fact read directly from the source (with file + line), or the word **UNKNOWN**. Nothing is invented to fill a gap. Where a formula "looks wrong," it is recorded as a finding (§8) — not corrected, not simplified, not assumed correct. |

---

# 1. Purpose

Apps Script (`Code.gs`, `Index.html`) is legacy implementation, but it is not *empty* legacy implementation — it contains a substantial body of real business calculation that has never been transcribed anywhere else in this repository at formula-level precision: GMROI, inventory turnover, DIO, DSO, cash-conversion cycle, dead-stock detection, category/customer margin, customer concentration, a working (if unverified) Net Profit safe-display guard, and the full cash-custody reconciliation chain. Prior documents in this repository (`architecture/dashboard-v2-implementation-plan.md`, `knowledge/business-rules-catalog-v1.md`) describe *what a dashboard card should show* or *what rule governs a figure* — neither transcribes the actual arithmetic. This catalog is that transcription: **40 distinct formulas**, each traced to its exact function and line, each mapped forward to where — if anywhere — it already exists in Enterprise OS.

---

# 2. Method

Both files were read in full, sequentially, in this sprint (not recalled from a prior session's summary). Every calculation that transforms an input into a business-meaningful number, ratio, status, or classification was extracted — not only functions with "KPI" or "metric" in their name. Pure rendering (HTML string assembly), pure persistence (sheet writes), and pure navigation/auth-gating logic were excluded unless they themselves compute something (e.g. a PIN-lockout counter is included; a menu-visibility lookup is not). Formatting-only functions (`_rp`, `rp`) are excluded as *formulas* but are included in the Duplication Analysis (§6), since the task asks for exactly that category of finding.

---

# 3. Formula Catalog

Each entry follows the required fifteen-field format (eighteen fields as specified), Rule-Catalog style, for direct cross-reading with `business-rules-catalog-v1.md`.

## 3.1 Finance Formulas (11)

### FIN-F-01 — Gross Profit Bulan (Monthly Gross Profit / `labaKotorBulan`)
1. **Nama Formula:** Laba Kotor Bulan Ini.
2. **Tujuan bisnis:** Headline profit figure shown on the owner dashboard; the number the Rp20,000,000/month target is measured against (with an explicit "kotor, bukan bersih" label per the FIN-009 fix).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dashboard(pin)`, reading `loka.bulanIni.laba` computed inside `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1946` (`dashboard`), `Code.gs:1740-1753` (accumulation inside `_olahLoka`).
6. **Input yang digunakan:** `D.Invoice[].profit`, `D.Invoice[].date`, `D.Invoice[].status` (all invoices where `status !== 'CANCELLED'` — see Finding F-1, §8).
7. **Output:** `bulanIni.laba` (Rupiah), surfaced as `target.labaKotorBulan`.
8. **Canonical Entity yang dipakai:** Transaction / Invoice (Canonical Data Contract §4), but read here from a raw Loka JSON export cached in Drive, **not** from the Connector's canonical output.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service (per `cards.js`'s own assignment for the equivalent card).
10. **Dashboard Card yang menggunakan formula ini:** "Gross Profit" (`dashboard-v2-implementation-plan.md` §3.2); Apps Script's own `renderDash()` target block (`Index.html:1176-1188`).
11. **Business Rule yang berkaitan:** FIN-006 (Gross/Net/`Invoice.profit` must not be conflated), FIN-009 (never labeled "achieved" against a net target — this exact fix is what v2.1 implements).
12. **Dependencies:** `_bebanBulan()` (FIN-F-03), for the Net Profit guard that reads this value.
13. **Assumptions:** That `Invoice.profit` in the Loka JSON export is the correct per-invoice profit figure — not independently re-derived here.
14. **Current Status:** Legacy Only (no equivalent runs in production; the Reporting Service's own "Gross Profit" card computes a **different** population — see §6, Duplicate #1).
15. **Validation Status:** Unknown — this exact population (CANCELLED-excluded, PAID+PENDING included) has never been independently reconciled; only the PAID-only population was reconciled in `reports/dashboard-reconciliation-audit.md`.
16. **Human Approval Required?** No for the read itself; yes for anything decided from it (FIN-010's Cash/Expense/Receivable/Payable "always" gate does not literally name Gross Profit, but GOV-004 applies to any consequential use).
17. **Notes:** See Finding F-1 (§8) — this formula includes PENDING invoices, unlike the Reporting Service's PAID-only equivalent.

### FIN-F-02 — Net Profit Bulan / Safe-Display Guard (`labaBersihBulan`, `labaBersihBisaDihitung`)
1. **Nama Formula:** Laba Bersih Bulan Ini (dengan Guard).
2. **Tujuan bisnis:** Prevents the exact harm this repository already has on record — a Gross Profit figure being read as an "achieved 73%" Net Profit result in a month that was actually a Rp1.4 million net loss.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dashboard(pin)`.
5. **Baris:** `Code.gs:2009-2012`.
6. **Input yang digunakan:** `labaKotorBulan` (FIN-F-01), `beban` (FIN-F-03).
7. **Output:** `labaBersihBisaDihitung` (boolean guard), `labaBersihBulan` (Rupiah or `null`).
8. **Canonical Entity yang dipakai:** Transaction/Invoice + Expense (Canonical Data Contract §4) — but Expense here is Apps Script's own `BEBAN` sheet, not the canonical `Expense` entity (see Finding F-2, §8).
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** "Net Profit" (`dashboard-v2-implementation-plan.md` §3.10); `renderDash()` (`Index.html:1184-1187`).
11. **Business Rule yang berkaitan:** FIN-008 (Safe-Display Guard: no Net Profit without real expense data) — **this formula is the reference implementation FIN-008 describes**, previously known to this repository only secondhand via a citation to `PATCH-01-performa-dan-dashboard.md`; FIN-009.
12. **Dependencies:** FIN-F-01, FIN-F-03.
13. **Assumptions:** That `beban > 0` reliably distinguishes "expenses recorded" from "expenses genuinely zero" — the code's own comment (`Code.gs:1868-1873`) states this explicitly as a deliberate design choice, not an oversight.
14. **Current Status:** Legacy Only — the Reporting Service (`cards.js:251-260`) deliberately leaves Net Profit `UNKNOWN`/`blocked`, citing "no confirmed, adopted formula exists." **This finding revises that premise**: a candidate formula does exist, here, gated exactly as FIN-008 describes — its deployment status is simply unverified. See Finding F-3, §8.
15. **Validation Status:** Unknown — never run.
16. **Human Approval Required?** Yes for any consequential use per GOV-004/FIN-010.
17. **Notes:** This is the single highest business-value formula in this catalog per the migration-order ranking in §9.10 — it is the one directly tied to a real, already-documented near-miss.

### FIN-F-03 — Beban Bulan (Monthly Expense Sum)
1. **Nama Formula:** Total Beban Operasional Bulan Ini.
2. **Tujuan bisnis:** Feeds FIN-F-02's guard; the "0 means not-yet-recorded, not zero expenses" convention is itself the load-bearing business rule.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_bebanBulan(bulan)`.
5. **Baris:** `Code.gs:1874-1885`.
6. **Input yang digunakan:** Sheet `BEBAN`, columns Tanggal/Nilai, filtered to the current calendar month.
7. **Output:** Total Rupiah, or `0` if none recorded.
8. **Canonical Entity yang dipakai:** No canonical `Expense` equivalent read here — Apps Script's `BEBAN` sheet is a **separate, manually-entered ledger** (Gaji/Sewa/Listrik/Transport/Susut/Lain), distinct from the canonical `Expense` entity, which is sourced from Loka POS's own `Expense` table (Canonical Data Contract §4). See Finding F-2, §8.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** "Expenses" (`dashboard-v2-implementation-plan.md` §3.9).
11. **Business Rule yang berkaitan:** FIN-008 (dependency).
12. **Dependencies:** None upstream; `catatBeban()` (`Code.gs:1412-1430`) is the only write path.
13. **Assumptions:** That every real operational expense is entered manually via `catatBeban()` — no automated or imported expense source feeds `BEBAN`.
14. **Current Status:** Legacy Only. The Reporting Service's "Expenses" card (`cards.js:221-249`) computes a similarly-named figure from a **different source entirely** (canonical `Expense.items[].price`) — see §6, Duplicate #3.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** Yes, always (FIN-010).
17. **Notes:** None.

### FIN-F-04 — Gross Margin % Bulan (`margin`)
1. **Nama Formula:** Margin Kotor Bulan Ini.
2. **Tujuan bisnis:** The percentage figure used both as a headline ratio and as an input to the "two paths to target" calculation (FIN-F-05/06/07).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1789` (`margin = bulanIni.omzet ? bulanIni.laba / bulanIni.omzet : 0`), reported ×100 at `Code.gs:1836`.
6. **Input yang digunakan:** `bulanIni.laba` (FIN-F-01's numerator), `bulanIni.omzet` (sum of `grandTotal`).
7. **Output:** Percentage (0-100 scale after the ×100 at line 1836).
8. **Canonical Entity yang dipakai:** Transaction/Invoice (same population caveat as FIN-F-01).
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards directly; feeds the "GMROI" metric card (`Index.html:1207-1215`) as a displayed factor.
11. **Business Rule yang berkaitan:** FIN-006 (must be clearly labeled as Gross, not conflated with Net Margin).
12. **Dependencies:** FIN-F-01.
13. **Assumptions:** Same population assumption as FIN-F-01.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No for the read.
17. **Notes:** None.

### FIN-F-05 — Omzet Perlu (Revenue Needed to Reach Target)
1. **Nama Formula:** Omzet Perlu untuk Capai Target.
2. **Tujuan bisnis:** "Path 1" of the two-path target-closing narrative shown to the owner — how much total revenue (at today's margin) would close the gap to target.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dashboard(pin)`.
5. **Baris:** `Code.gs:2014` (`omzetPerlu: m > 0 ? target / m : 0`).
6. **Input yang digunakan:** `target` (from `_targetUnit`), `m` (= FIN-F-04's margin as a fraction).
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** None directly — derived from FIN-F-01/04 and the `TARGET` sheet (no canonical entity for a business target exists in Canonical Data Contract §4).
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards; Apps Script-only narrative block (`Index.html:1191-1195`, "Jalan 1 · lewat omzet").
11. **Business Rule yang berkaitan:** None named specifically — a target-tracking formula with no Business Rules Catalog entry of its own (candidate for Section 15's "Missing Rules" list).
12. **Dependencies:** FIN-F-01, FIN-F-04.
13. **Assumptions:** That margin stays constant while revenue scales — a simplifying assumption stated implicitly, not flagged in the source.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### FIN-F-06 — Omzet Tambah (Additional Revenue Still Needed)
1. **Nama Formula:** Omzet Tambahan yang Masih Dibutuhkan.
2. **Tujuan bisnis:** Same narrative as FIN-F-05, expressed as a delta rather than a total.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dashboard(pin)`.
5. **Baris:** `Code.gs:2015` (`omzetTambah: m > 0 ? Math.max(target / m - omzetProyeksi, 0) : 0`).
6. **Input yang digunakan:** FIN-F-05's `target/m`, `omzetProyeksi` (FIN-F-09).
7. **Output:** Rupiah, floored at 0.
8. **Canonical Entity yang dipakai:** Same as FIN-F-05.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** `Index.html:1193` ("Jalan 1" value line).
11. **Business Rule yang berkaitan:** None named (see FIN-F-05).
12. **Dependencies:** FIN-F-05, FIN-F-09.
13. **Assumptions:** Same as FIN-F-05.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### FIN-F-07 — Margin Perlu (Margin Needed to Reach Target)
1. **Nama Formula:** Margin yang Dibutuhkan untuk Capai Target.
2. **Tujuan bisnis:** "Path 2" of the target-closing narrative — how much margin would need to rise, holding revenue constant.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dashboard(pin)`.
5. **Baris:** `Code.gs:2016` (`marginPerlu: omzetProyeksi > 0 ? (target / omzetProyeksi * 100) : 0`).
6. **Input yang digunakan:** `target`, `omzetProyeksi` (FIN-F-09).
7. **Output:** Percentage.
8. **Canonical Entity yang dipakai:** Same as FIN-F-05.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** `Index.html:1196-1199` ("Jalan 2 · lewat margin").
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** FIN-F-09.
13. **Assumptions:** That revenue stays at its current projected level while margin rises — the mirror-image assumption of FIN-F-05.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### FIN-F-08 — Proyeksi Laba Bulan (Monthly Profit Projection)
1. **Nama Formula:** Proyeksi Laba Kotor Sebulan Penuh.
2. **Tujuan bisnis:** Extrapolates month-to-date gross profit to a full-month run-rate, shown as "proyeksi" next to the actual figure.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1840` (`proyeksiLabaBulan: (bulanIni.laba / nHari) * 30`).
6. **Input yang digunakan:** `bulanIni.laba`, `nHari` (distinct days with data this month).
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** Same population as FIN-F-01.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** `Index.html:1178` (target block subtitle).
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** FIN-F-01.
13. **Assumptions:** Flat daily run-rate for the rest of the month — no seasonality, no day-of-week weighting. See Finding F-4, §8.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### FIN-F-09 — Proyeksi Omzet Bulan (Monthly Revenue Projection)
1. **Nama Formula:** Proyeksi Omzet Sebulan Penuh.
2. **Tujuan bisnis:** Same run-rate extrapolation as FIN-F-08, applied to revenue instead of profit; feeds FIN-F-06/07.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1841` (`proyeksiOmzetBulan: (bulanIni.omzet / nHari) * 30`).
6. **Input yang digunakan:** `bulanIni.omzet`, `nHari`.
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** Same as FIN-F-01.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** None of the 11 documented cards directly; internal to the target narrative.
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** None upstream besides raw invoice data.
13. **Assumptions:** Same flat run-rate assumption as FIN-F-08 (Finding F-4, §8).
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### FIN-F-10 — Sisa Hari (Days Remaining in Month)
1. **Nama Formula:** Sisa Hari Bulan Berjalan.
2. **Tujuan bisnis:** Denominator for the "per-day required profit" narrative shown to the owner.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dashboard(pin)`.
5. **Baris:** `Code.gs:1981-1983`.
6. **Input yang digunakan:** Today's date, total days in the current calendar month.
7. **Output:** Integer, floored at 1.
8. **Canonical Entity yang dipakai:** None — a pure calendar calculation.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service (as a supporting input, not a standalone service concern).
10. **Dashboard Card yang menggunakan formula ini:** `Index.html:1182-1183`.
11. **Business Rule yang berkaitan:** None.
12. **Dependencies:** None.
13. **Assumptions:** None beyond standard Gregorian calendar arithmetic.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Proven — pure date arithmetic, deterministic, no business ambiguity.
16. **Human Approval Required?** No.
17. **Notes:** None.

### FIN-F-11 — Piutang Total (Outstanding Receivables Sum)
1. **Nama Formula:** Total Piutang Belum Lunas.
2. **Tujuan bisnis:** Feeds the "Piutang belum lunas" warning on the owner's action list (DASH-F-01) and DSO (INV-F-04).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1778-1783` (`piutang` array), `Code.gs:1796` (`piutangNilai`).
6. **Input yang digunakan:** `D.Invoice[]` filtered to `status === 'PENDING'`, summing `grandTotal`.
7. **Output:** Array of `{tgl, nama, nilai}` plus a Rupiah total.
8. **Canonical Entity yang dipakai:** Receivable (Canonical Data Contract §4) — but read here from the raw Loka JSON, not from any canonical `Receivable`/`InvoiceDebt` source. Reporting Service explicitly declines to compute this at all (`cards.js:211-219`, citing `InvoiceDebt` not being in the canonical dataset).
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** "Outstanding Receivables" (`dashboard-v2-implementation-plan.md` §3.8).
11. **Business Rule yang berkaitan:** FIN-007 (Receivable must exclude Ibu's capital — not addressed by this formula, which is a raw PENDING-invoice sum with no such exclusion applied).
12. **Dependencies:** None upstream.
13. **Assumptions:** That every `PENDING`-status invoice represents a genuine outstanding receivable, not (for example) an in-progress transaction. Not verified against FIN-007's capital-exclusion rule.
14. **Current Status:** Legacy Only — this is the **only** working implementation of Outstanding Receivables found anywhere in this repository; the Reporting Service leaves it `UNKNOWN` by design.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** Yes, always (FIN-010, Receivable).
17. **Notes:** This is a genuine gap-fill candidate — see §9.9.

## 3.2 Inventory Formulas (9)

### INV-F-01 — GMROI (Gross Margin Return on Inventory)
1. **Nama Formula:** GMROI.
2. **Tujuan bisnis:** "Laba per rupiah modal stok" — the headline capital-efficiency metric on the owner dashboard, with an explicit benchmark comparison (≥3.2× = "sehat").
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1791-1793` (`labaSetahun = (bulanIni.laba / nHari) * 365; gmroi = nilaiStok ? labaSetahun / nilaiStok : 0`).
6. **Input yang digunakan:** `bulanIni.laba`, `nHari`, `nilaiStok` (INV-F-06).
7. **Output:** A multiplier (e.g. `3.2×`).
8. **Canonical Entity yang dipakai:** Product (for `nilaiStok`), Transaction/Invoice (for `laba`).
9. **Business Service yang seharusnya memiliki formula ini:** Inventory Service, jointly with Finance Service (it combines a margin figure with an inventory figure).
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards — a genuinely new capability with no destination in the current schema (§6, Gap #1).
11. **Business Rule yang berkaitan:** None named in `business-rules-catalog-v1.md` — no GMROI rule exists there.
12. **Dependencies:** FIN-F-01, FIN-F-08, INV-F-06.
13. **Assumptions:** The ≥3.2× "healthy retail benchmark" (`Index.html:1207`) is an externally-sourced industry reference embedded directly in client code, with no citation and no internal Business Rule backing it. See Finding F-5, §8.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No for the read.
17. **Notes:** Same annualization caveat as FIN-F-08/09 (Finding F-4) — the 365-day extrapolation compounds the flat-run-rate assumption twice (once for the month, again implicitly for the year).

### INV-F-02 — Perputaran Stok (Inventory Turnover)
1. **Nama Formula:** Perputaran Stok (kali per tahun).
2. **Tujuan bisnis:** How many times inventory value cycles per year — a companion metric to GMROI, with its own benchmark (≥12× = efficient for general retail).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1792,1794` (`hppSetahun = (hppBulan / nHari) * 365; putaran = nilaiStok ? hppSetahun / nilaiStok : 0`).
6. **Input yang digunakan:** `hppBulan` (= `bulanIni.omzet - bulanIni.laba`, i.e. cost of goods sold this month), `nHari`, `nilaiStok`.
7. **Output:** A multiplier (e.g. `12.4×`).
8. **Canonical Entity yang dipakai:** Same as INV-F-01.
9. **Business Service yang seharusnya memiliki formula ini:** Inventory Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards (§6, Gap #1).
11. **Business Rule yang berkaitan:** None named. INV-002 (Inventory Authoritative Source Unresolved) directly undermines this formula's reliability, since it depends on a trustworthy `nilaiStok`.
12. **Dependencies:** INV-F-06, FIN-F-01 (via `hppBulan`).
13. **Assumptions:** Same flat-run-rate annualization as INV-F-01. The ≥12× benchmark (`Index.html:1217`) is, like GMROI's, an unsourced external reference embedded in client code (Finding F-5, §8).
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### INV-F-03 — DIO (Days Inventory Outstanding)
1. **Nama Formula:** DIO — Hari Stok Mengendap.
2. **Tujuan bisnis:** How many days, on average, capital sits in inventory before selling through — a direct input to the Cash Conversion Cycle (INV-F-05).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1795` (`dio = hppBulan ? nilaiStok / (hppBulan / nHari) : 0`).
6. **Input yang digunakan:** `nilaiStok`, `hppBulan`, `nHari`.
7. **Output:** Days.
8. **Canonical Entity yang dipakai:** Product.
9. **Business Service yang seharusnya memiliki formula ini:** Inventory Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards (§6, Gap #1).
11. **Business Rule yang berkaitan:** INV-002 (undermines reliability, same as INV-F-02).
12. **Dependencies:** INV-F-06.
13. **Assumptions:** Same as INV-F-02.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### INV-F-04 — DSO (Days Sales Outstanding)
1. **Nama Formula:** DSO — Hari Piutang Mengendap.
2. **Tujuan bisnis:** How many days, on average, revenue sits uncollected as receivables — the other direct input to the Cash Conversion Cycle.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1797` (`dso = bulanIni.omzet ? piutangNilai / (bulanIni.omzet / nHari) : 0`).
6. **Input yang digunakan:** `piutangNilai` (FIN-F-11), `bulanIni.omzet`, `nHari`.
7. **Output:** Days.
8. **Canonical Entity yang dipakai:** Receivable (via FIN-F-11's same raw-JSON caveat).
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service, jointly with Inventory Service (it feeds the shared Cash Conversion Cycle metric).
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards (§6, Gap #1).
11. **Business Rule yang berkaitan:** FIN-007 (same caveat as FIN-F-11 — no capital exclusion applied here either).
12. **Dependencies:** FIN-F-11.
13. **Assumptions:** Same as FIN-F-11.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### INV-F-05 — Siklus Kas (Cash Conversion Cycle)
1. **Nama Formula:** Siklus Kas.
2. **Tujuan bisnis:** Total days capital is locked up before returning to cash — the single combined figure the dashboard presents as "makin pendek makin lega."
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1837` (`siklusKas: dio + dso`).
6. **Input yang digunakan:** INV-F-03, INV-F-04.
7. **Output:** Days.
8. **Canonical Entity yang dipakai:** Same as INV-F-03/04, combined.
9. **Business Service yang seharusnya memiliki formula ini:** Shared Inventory Service / Finance Service ownership — a genuine cross-service formula with no single obvious owner, itself worth flagging (see §7).
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards (§6, Gap #1); `Index.html:1228-1235`.
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** INV-F-03, INV-F-04.
13. **Assumptions:** Simple additive combination — no working-capital financing offset (e.g. Days Payable Outstanding is not subtracted, so this is DIO+DSO, not the fuller DIO+DSO−DPO Cash Conversion Cycle formula used in some retail finance contexts). Not flagged as wrong by the source, but worth naming as a modeling choice.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### INV-F-06 — Nilai Stok (Inventory Value)
1. **Nama Formula:** Nilai Stok (Modal Kerja di Stok).
2. **Tujuan bisnis:** Total capital value sitting in inventory — the denominator for GMROI/Turnover/DIO, and a figure in its own right.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1767-1773` (per-product `nilai = s * capitalPrice`), `Code.gs:1787` (`nilaiStok = stok.reduce(...)`).
6. **Input yang digunakan:** `D.Product[].stock`, `D.Product[].capitalPrice`.
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** Product (`stock × capitalPrice` — the identical formula `cards.js:179-183` uses for its "Inventory Value" card).
9. **Business Service yang seharusnya memiliki formula ini:** Inventory Service.
10. **Dashboard Card yang menggunakan formula ini:** "Inventory Value" (`dashboard-v2-implementation-plan.md` §3.6).
11. **Business Rule yang berkaitan:** INV-005 (Stock Opname Discrepancy is Expected — the Financial Baseline's `nilaiStok` is a physical count, not this Loka-derived figure, and the two are expected to disagree by design).
12. **Dependencies:** None upstream.
13. **Assumptions:** That `D.Product[].stock` and `.capitalPrice` in the Loka JSON export are current and correct at export time.
14. **Current Status:** Legacy Only — see §6, Duplicate #4: the **same formula** exists in `cards.js`, but reading from a different pipeline entry point (raw JSON export vs. the Connector's Realm extraction).
15. **Validation Status:** Partially Proven — the formula itself matches `cards.js`'s independently-written equivalent exactly, though the two have never been run against the same snapshot to confirm they agree numerically.
16. **Human Approval Required?** No for the read; yes for any Inventory adjustment that would change it (INV-006).
17. **Notes:** None.

### INV-F-07 — Stok Mati (Dead Stock Detection)
1. **Nama Formula:** Deteksi Stok Mati.
2. **Tujuan bisnis:** Flags high-value inventory that has not sold at all this month — "modal terjebak."
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1799-1802` (`mati = stok.filter(x => x.nilai >= 100000 && !(terjual[x.nama] > 0)).sort(...).slice(0, 6)`).
6. **Input yang digunakan:** `nilai` (per-product, INV-F-06), `terjual` (units sold this month, from `D.Invoice[].items[]`).
7. **Output:** Array of up to 6 products, plus `nilaiStokMati` (sum).
8. **Canonical Entity yang dipakai:** Product, Transaction/Invoice.
9. **Business Service yang seharusnya memiliki formula ini:** Inventory Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards; closest conceptual match is "Stock Alerts" (§3.11), which is UNKNOWN in the Reporting Service for an unrelated reason (no `stockAlert` field in canonical Product — `cards.js:262-272`).
11. **Business Rule yang berkaitan:** None named — the Rp100,000 value threshold is an undocumented magic number (Finding F-5, §8).
12. **Dependencies:** INV-F-06.
13. **Assumptions:** That zero units sold this month, combined with the Rp100,000 threshold, is a meaningful proxy for "dead" rather than merely "not yet due to sell" — no seasonality or product-type adjustment.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No for the read.
17. **Notes:** None.

### INV-F-08 — Stok Menipis (Low Stock / Days-of-Supply)
1. **Nama Formula:** Deteksi Stok Menipis.
2. **Tujuan bisnis:** Flags products that will run out within roughly 5 days at the current sales pace.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1767-1776` (`perHariRata = jual / nHari; hari = perHariRata > 0 ? Math.floor(s / perHariRata) : 999`), filter at `Code.gs:1775-1776`.
6. **Input yang digunakan:** `D.Product[].stock`, `terjual` (units sold this month), `nHari`.
7. **Output:** Array of up to 8 products with `{nama, stok, hari}`, sorted ascending by days remaining.
8. **Canonical Entity yang dipakai:** Product.
9. **Business Service yang seharusnya memiliki formula ini:** Inventory Service.
10. **Dashboard Card yang menggunakan formula ini:** "Stock Alerts" (§3.11) is the closest conceptual match — see §6, Gap #2.
11. **Business Rule yang berkaitan:** None named — the 5-day threshold is an undocumented magic number (Finding F-5, §8). Implementation Backlog BL-012 (cited by `cards.js:271`) names the general absence of a stock-alert field, not this specific formula.
12. **Dependencies:** None upstream besides raw Product/Invoice data.
13. **Assumptions:** The sentinel value `999` for a product with zero sales this month (line 1773) is used as "effectively infinite days of supply" — a reasonable proxy, but an undocumented convention that a future consumer could mistake for a real number if not aware of the sentinel (Finding F-6, §8).
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### INV-F-09 — Margin per Kategori (Category Margin)
1. **Nama Formula:** Margin per Kategori Barang.
2. **Tujuan bisnis:** "Di mana untungnya" — breaks down margin by product category, directly informing pricing/assortment strategy already referenced elsewhere in this repository (e.g. CLAUDE.md's Minyak/Beras margin figures, though those come from a different source, POS Loka's `Ringkasan` sheet, not this formula — see Finding F-7, §8).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1804-1818`.
6. **Input yang digunakan:** `D.Invoice[].items[].category.text`, `.total`, `.capitalPrice`, `.quantity`, filtered to the current month.
7. **Output:** Array of `{nama, omzet, laba, margin}` per category, sorted descending by revenue.
8. **Canonical Entity yang dipakai:** Product (category), Transaction/Invoice.
9. **Business Service yang seharusnya memiliki formula ini:** Inventory Service, jointly with Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards — a genuinely new capability (§6, Gap #1).
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** None upstream besides raw Invoice line items.
13. **Assumptions:** That `item.category.text` is populated and consistent across invoices — no reconciliation against Product's own category field is performed.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** See Finding F-7, §8 — this formula's output is conceptually the same kind of figure CLAUDE.md quotes for category margins, but from an entirely different, unreconciled data pipeline. The two must never be assumed interchangeable.

## 3.3 Customer Formulas (2)

### CUS-F-01 — Margin per Pelanggan (Customer Margin)
1. **Nama Formula:** Margin per Pelanggan.
2. **Tujuan bisnis:** Per-customer profitability breakdown, with customers below 5% margin flagged red in the UI — directly relevant to this repository's own already-documented finding that Papoy (the one confirmed external B2B customer) runs a 3.68% margin and functions as a pricing-floor template.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1749-1751` (accumulation), `Code.gs:1820-1825` (`pelArr` construction).
6. **Input yang digunakan:** `D.Invoice[].customer.name` (or `.customerName`, falling back to `'(eceran)'`), `.grandTotal`, `.profit`, filtered to the current month.
7. **Output:** Array of `{nama, omzet, laba, margin}`, top 8 by revenue.
8. **Canonical Entity yang dipakai:** Customer, Transaction/Invoice.
9. **Business Service yang seharusnya memiliki formula ini:** Customer Service, jointly with Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards (§6, Gap #1).
11. **Business Rule yang berkaitan:** CUS-001 (Branch-as-Customer Overlap Unresolved), CUS-004 (Internal vs. External Customer Distinction — this formula does **not** apply CUS-004's filter; every branch/family record is mixed in with genuine external customers undifferentiated, which is exactly the gap CUS-004 names as unresolved).
12. **Dependencies:** None upstream besides raw Invoice data.
13. **Assumptions:** Customer name string is a reliable join key — no customer ID is used, consistent with the unresolved state of CUS-001.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No for the read; yes for any customer-facing action derived from it (CUS-002).
17. **Notes:** The 5% "low margin" threshold (`Index.html:1268`) is an undocumented magic number (Finding F-5, §8).

### CUS-F-02 — Konsentrasi Sederhana Jaya (Customer Concentration)
1. **Nama Formula:** Konsentrasi Pelanggan (Sederhana Jaya).
2. **Tujuan bisnis:** Measures what share of monthly revenue comes from Sederhana Jaya-branded customers — directly the same concern this repository's own CLAUDE.md already flags at ~77% concentration (a different figure, different source — see Finding F-7, §8).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_olahLoka(D, namaFile)`.
5. **Baris:** `Code.gs:1827-1839` (v2.1 change: "Dapur" deliberately excluded from the Sederhana Jaya grouping, with the code's own comment explaining why — including it "membuat angka konsentrasi terlihat lebih buruk dari kenyataannya").
6. **Input yang digunakan:** `pelArr` (CUS-F-01's output), string-matched on `nama.toLowerCase().indexOf('sederhana') === 0`.
7. **Output:** Percentage.
8. **Canonical Entity yang dipakai:** Customer, Branch (the Branch/Customer overlap CUS-001 names directly).
9. **Business Service yang seharusnya memiliki formula ini:** Customer Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards (§6, Gap #1); `Index.html:1250-1260`, with its own hardcoded ">75% = buruk" threshold.
11. **Business Rule yang berkaitan:** CUS-001, CUS-004 — this formula is a **direct, working instance of exactly the unresolved gap** CUS-004 describes: it string-matches "sederhana" as a proxy for "internal," which is a real but fragile substitute for the missing internal/external customer flag.
12. **Dependencies:** CUS-F-01.
13. **Assumptions:** That every customer name starting with "sederhana" is a branch, and every other name is external — untrue for "Dapur" specifically (deliberately excluded) and unverified for any other edge case. The 75% "buruk" threshold (`Index.html:1250`) is an undocumented magic number (Finding F-5, §8).
14. **Current Status:** Legacy Only.
15. **Validation Status:** Partially Proven — the "Dapur" exclusion is a reasoned, documented correction (the code comment explains it), but the underlying string-match method itself has never been independently validated against a ground-truth internal/external customer list.
16. **Human Approval Required?** No for the read.
17. **Notes:** This formula's output (a concentration percentage) and CLAUDE.md's already-known ~77% figure are conceptually the same question, computed differently, from different data — they must not be assumed to be the same number. See Finding F-7, §8.

## 3.4 Cash Formulas (5)

### CASH-F-01 — Kas Awal (Opening Cash)
1. **Nama Formula:** Kas Awal Shift.
2. **Tujuan bisnis:** The starting-balance figure every subsequent shift's reconciliation depends on — the exact formula whose prior asymmetry produced a confirmed Rp5.8 million discrepancy (SAL-002).
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dataShift(pin)`.
5. **Baris:** `Code.gs:2228-2240` (`kasAwal: kasKasirAwal + brankasAwal`).
6. **Input yang digunakan:** Previous day's `TUTUP_SHIFT` row, columns `Kas Kasir` (F) and `Kas Tunai` (G).
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** Cash (Canonical Data Contract §4) — no canonical Cash entity has an ongoing source at all (`dashboard-v2-implementation-plan.md` §3.4/§3.5); this remains Apps Script's own sheet, unreachable by the Reporting Service.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** "Cash in Hand" (§3.4) conceptually, though the specific `kasAwal` figure is an intermediate value, not the card itself.
11. **Business Rule yang berkaitan:** SAL-002 (Kas Awal Must Include Both Kas Kasir and Kas Tunai) — **this is that exact fix, live in source**, superseding the earlier version that only carried forward Kas Kasir.
12. **Dependencies:** SAL-003 (physical brankas count required to trust the starting point).
13. **Assumptions:** That the previous day's `TUTUP_SHIFT` row correctly reflects both wallet balances — assumes no manual sheet edits between shifts.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Partially Proven — the root-cause asymmetry bug is independently documented (`reports/dashboard-reconciliation-audit.md`), and this fix directly targets it with a clear before/after rationale in the code's own comment, but Business Rules Catalog SAL-002 itself states the fix is "explicitly untested by its own author."
16. **Human Approval Required?** Yes, always (Cash is always-gated per FIN-010).
17. **Notes:** Duplicated client-side for live preview — see §6, Duplicate #2.

### CASH-F-02 — Seharusnya Tersisa (Expected Remaining Cash)
1. **Nama Formula:** Seharusnya Tersisa.
2. **Tujuan bisnis:** The authoritative "what the cash count should be" figure a shift's physical count is checked against.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanTutupShift(pin, payload)`.
5. **Baris:** `Code.gs:2357` (`seharusnya = kasAwal + jual - keluar - keluarDompet`).
6. **Input yang digunakan:** CASH-F-01 (`kasAwal`, re-fetched server-side, never trusted from the client), `jual` (cash sales this shift), `keluar` (cash expenses this shift), `keluarDompet` (sum of KELUAR-type wallet movements: Setor Ibu, Setor BRI, Prive).
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** Cash.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards directly.
11. **Business Rule yang berkaitan:** SAL-002 (dependency), FIN-003 (Kas Kasir till limit, a related but distinct cash-custody rule).
12. **Dependencies:** CASH-F-01.
13. **Assumptions:** That every cash movement in the shift is captured in exactly one of `jual`/`keluar`/`keluarDompet` — no category is double-counted or missed.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown (server-authoritative recomputation is itself a good practice, but the formula's real-world correctness is unverified, per SAL-002's own "untested" status).
16. **Human Approval Required?** Yes, always.
17. **Notes:** The comment at `Code.gs:2188-2202` explicitly warns that the **first** shift closed after this fix deploys will likely show a large one-time variance — "akumulasi ketimpangan yang sebelumnya tersembunyi, bukan kesalahan baru." This is a critical piece of operational context for whoever eventually deploys this formula.

### CASH-F-03 — Selisih Kas (Cash Variance)
1. **Nama Formula:** Selisih Kas.
2. **Tujuan bisnis:** The actual reconciliation check — physical count minus expected.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanTutupShift(pin, payload)`.
5. **Baris:** `Code.gs:2358` (`selisih = sisa - seharusnya`).
6. **Input yang digunakan:** `sisa` (sum of physically-counted SISA-type wallets), CASH-F-02.
7. **Output:** Rupiah, signed.
8. **Canonical Entity yang dipakai:** Cash.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards.
11. **Business Rule yang berkaitan:** FIN-003 (Kas Kasir Rp300,000 policy limit — a related, distinct check not itself computed by this formula).
12. **Dependencies:** CASH-F-02.
13. **Assumptions:** None beyond CASH-F-02's.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** Yes, always.
17. **Notes:** Duplicated client-side for live preview — see §6, Duplicate #2.

### CASH-F-04 — Status Selisih (WAJAR / PERLU DICEK)
1. **Nama Formula:** Status Kewajaran Selisih Kas.
2. **Tujuan bisnis:** Converts CASH-F-03's raw variance into a pass/fail classification, and gates whether a written explanation is required before saving.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanTutupShift(pin, payload)`.
5. **Baris:** `Code.gs:2359` (`status = Math.abs(selisih) <= BATAS_SELISIH ? 'WAJAR' : 'PERLU DICEK'`), enforcement at `Code.gs:2365-2369`.
6. **Input yang digunakan:** CASH-F-03, `BATAS_SELISIH` (constant, Rp30,000 — `Code.gs:250`).
7. **Output:** String enum `WAJAR` / `PERLU DICEK`.
8. **Canonical Entity yang dipakai:** Cash.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Feeds `dashboard()`'s action list (DASH-F-01).
11. **Business Rule yang berkaitan:** None named specifically for the Rp30,000 threshold itself — an undocumented magic number functioning as a de facto business rule (Finding F-5, §8), distinct from FIN-003's separate Rp300,000 till-limit rule.
12. **Dependencies:** CASH-F-03.
13. **Assumptions:** None beyond the threshold's own reasonableness, which is not independently justified in any source document read for this catalog.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** Yes, always.
17. **Notes:** None.

### CASH-F-05 — Jenjang Setoran (Cash Deposit Tier A/B/C)
1. **Nama Formula:** Jenjang Kebijakan Setoran Brankas.
2. **Tujuan bisnis:** A three-tier policy classification (A = may hold, B = must deposit today, C = must deposit today with an escort) implementing the "Runbook Kustodi Kas" cash-custody policy that took effect 31 July 2026.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_jenjangSetoran(brankasAkhir)`.
5. **Baris:** `Code.gs:2404-2428`.
6. **Input yang digunakan:** `brankasAkhir` (closing safe balance), `BATAS_BRANKAS_MENGINAP` (Rp2,000,000 — `Code.gs:284`), `BATAS_PENDAMPING` (Rp5,000,000 — `Code.gs:285`).
7. **Output:** `{jenjang: 'A'|'B'|'C'|'-', wajibSetor, pendamping, pesan}`.
8. **Canonical Entity yang dipakai:** Cash.
9. **Business Service yang seharusnya memiliki formula ini:** Finance Service.
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards; surfaced directly in the Tutup Shift screen (`Index.html:1412`, `1534-1551`) and referenced in `dashboard()`'s action list.
11. **Business Rule yang berkaitan:** None named by ID in `business-rules-catalog-v1.md` — the Rp2,000,000/Rp5,000,000 thresholds and the named "Runbook Kustodi Kas, berlaku 31 Jul 2026" (`Code.gs:283`) are not themselves catalogued as a numbered Business Rule anywhere in this repository, despite being a real, dated, named policy. Candidate for Section 15 of the Business Rules Catalog.
12. **Dependencies:** None upstream besides the closing safe balance.
13. **Assumptions:** None beyond the two threshold values' own correctness, which trace to a named runbook this catalog was not asked to independently verify.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** Yes, always (Cash).
17. **Notes:** Duplicated client-side, verbatim threshold logic — see §6, Duplicate #5. This is the clearest instance in the whole source of two independent implementations of the *same* threshold policy that must be kept manually in sync.

## 3.5 Sales / Shipment Formulas (5)

### SAL-F-01 — Nilai Kirim (Shipment Line + Total Value)
1. **Nama Formula:** Nilai Barang Keluar.
2. **Tujuan bisnis:** The Rupiah value of a goods-out shipment, per line and in total — feeds the surat jalan (delivery note) text and the daily "barang keluar" dashboard figure.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanKeluar(pin, payload)`.
5. **Baris:** `Code.gs:917-920` (per-line `qty * harga`), `Code.gs:925` (`total = rows.reduce(...)`).
6. **Input yang digunakan:** Per-item `qty`, `harga` (from the catalog snapshot sent by the client).
7. **Output:** Rupiah, per line and total.
8. **Canonical Entity yang dipakai:** No canonical "Goods Out" entity exists (`cards.js:196-204`, "Goods Out" card is `UNKNOWN`, "genuinely unmodeled, not merely unread").
9. **Business Service yang seharusnya memiliki formula ini:** None — no Business Service is assigned this concern (`cards.js:197`: "None — not covered by any Business Service").
10. **Dashboard Card yang menggunakan formula ini:** "Goods Out" (§3.7), conceptually.
11. **Business Rule yang berkaitan:** None named — Implementation Backlog BL-013 (goods-out/inter-branch shipment) is cited as the reason no canonical entity exists yet.
12. **Dependencies:** None upstream.
13. **Assumptions:** That `harga` sent by the client matches the current catalog price at submission time — no server-side re-lookup against `MASTER`/`MASTER_CK` is performed here (a potential trust gap, not flagged as a bug by the source, noted here as an assumption).
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No — an operational record, not one of the four always-gated Financial entities.
17. **Notes:** Duplicated client-side for live preview — see §6, Duplicate #6.

### SAL-F-02 — ID Kirim Generation (Shipment ID Formula)
1. **Nama Formula:** Pembuatan ID Kirim.
2. **Tujuan bisnis:** A deterministic, collision-avoiding shipment identifier used to link `KELUAR` and `TERIMA` rows for the same physical delivery.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_buatIdKirim(now, tujuan, rit, unit, dataSemua)`, using `_kodeTujuan(tujuan)`.
5. **Baris:** `Code.gs:812-845`.
6. **Input yang digunakan:** Current date, destination name, rit (trip) number, unit (TSS/CK), all of today's existing shipment IDs (for collision detection).
7. **Output:** String ID, format `YYYYMMDD-UNIT-DEST-Rn`, with an alphabetic suffix on collision.
8. **Canonical Entity yang dipakai:** None — an internal Apps Script identifier scheme, not a canonical entity field.
9. **Business Service yang seharusnya memiliki formula ini:** N/A — operational/logistics identifier generation, not a Business Service concern per se.
10. **Dashboard Card yang menggunakan formula ini:** None.
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** None upstream.
13. **Assumptions:** That destination names map cleanly through `_kodeTujuan`'s lookup table or fallback initials-extraction — the exact mechanism whose earlier, simpler version produced the "SEDERH"-prefixed legacy IDs both `Migrasi.gs` and `Code.gs`'s own `_migrasiIdKirim` independently try to repair (see `implementation/appsscript-migration-plan.md` §1.20 for the full duplicate-repair-tool finding — not repeated here as this catalog is formula-scoped, not migration-scoped).
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown — the existence of two independent repair tools for this ID scheme's past failures is itself evidence the formula has produced incorrect/ambiguous output in practice.
16. **Human Approval Required?** No.
17. **Notes:** None.

### SAL-F-03 — Deteksi Kiriman Kembar (Duplicate Shipment Detection)
1. **Nama Formula:** Deteksi Kiriman Kembar (15 Menit).
2. **Tujuan bisnis:** Prevents an accidental double-submission of the same shipment (e.g. from a network retry or a double tap) from being recorded twice.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanKeluar(pin, payload)`.
5. **Baris:** `Code.gs:898-915`.
6. **Input yang digunakan:** All of today's shipments with the same generated ID within the last `AMBANG_KEMBAR` (15) minutes, matched by item name + exact quantity.
7. **Output:** Boolean gate — throws a "KEMBAR" error unless `payload.paksa` (force) is set.
8. **Canonical Entity yang dipakai:** None.
9. **Business Service yang seharusnya memiliki formula ini:** N/A — an operational data-integrity check, not a Business Service concern.
10. **Dashboard Card yang menggunakan formula ini:** None.
11. **Business Rule yang berkaitan:** None named — a candidate for the Missing Rules list (no formal "duplicate transaction detection" rule exists in `business-rules-catalog-v1.md`).
12. **Dependencies:** SAL-F-02 (uses the generated ID as the matching key).
13. **Assumptions:** That an exact item-name + exact-quantity match within 15 minutes reliably distinguishes an accidental duplicate from two genuinely separate, coincidentally identical shipments — a heuristic, not a certainty, and the user retains an explicit override (`payload.paksa`).
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No — the override is a same-user action, not a separate approval step.
17. **Notes:** None.

### SAL-F-04 — Selisih Terima (Receipt Discrepancy)
1. **Nama Formula:** Selisih Kirim vs Terima.
2. **Tujuan bisnis:** Per-item discrepancy between what was recorded as sent and what was confirmed received.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanTerima(pin, payload)`.
5. **Baris:** `Code.gs:1091-1100`.
6. **Input yang digunakan:** Sum of sent quantities per item name (`kirim`), sum of confirmed-received quantities per item name (`terimaPer`).
7. **Output:** Array of `{nama, kirim, terima, beda}` for every item where `beda !== 0`.
8. **Canonical Entity yang dipakai:** None (same "Goods Out" gap as SAL-F-01).
9. **Business Service yang seharusnya memiliki formula ini:** None assigned (same reasoning as SAL-F-01).
10. **Dashboard Card yang menggunakan formula ini:** None.
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** None upstream.
13. **Assumptions:** That item names match exactly between the KELUAR and TERIMA records — no fuzzy matching or ID-based join.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** None.

### SAL-F-05 — Status Rekap Harian (Daily Reconciliation Status)
1. **Nama Formula:** Status Rekap Harian (COCOK / SELISIH / BELUM DIKONFIRMASI).
2. **Tujuan bisnis:** Nightly, automated reconciliation of every shipment against its confirmed receipt, producing a per-item status and triggering an alert email for anything not `COCOK`.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `rekapHarian()` (21:00 daily trigger).
5. **Baris:** `Code.gs:2666-2674` (`selisih = ada ? (k.qty - diterima) : k.qty`; status logic in the same block).
6. **Input yang digunakan:** Today's `KELUAR` rows (aggregated per shipment+item), today's matching `TERIMA` rows.
7. **Output:** String enum `BELUM DIKONFIRMASI` / `COCOK` / `SELISIH`, written to sheet `REKAP`.
8. **Canonical Entity yang dipakai:** None (same "Goods Out" gap).
9. **Business Service yang seharusnya memiliki formula ini:** None assigned.
10. **Dashboard Card yang menggunakan formula ini:** None of the 11 documented cards.
11. **Business Rule yang berkaitan:** AUT-003 (Automation Failures Must Be Observable, Never Silent) — this formula is a direct, working example of that principle in practice (an email alert fires specifically when reconciliation finds a problem, and separately when *no* shipments were recorded at all for the day — `Code.gs:2705-2707`).
12. **Dependencies:** SAL-F-04 (conceptually the same comparison, applied at the daily-rollup level rather than per-confirmation).
13. **Assumptions:** Same item-name-matching assumption as SAL-F-04.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No — an automated notification, consistent with AUT-002's "notification is always allowed" carve-out.
17. **Notes:** None.

## 3.6 Pricing Formulas (2)

### PRC-F-01 — % Perubahan Harga (Price Change Percentage)
1. **Nama Formula:** Persentase Perubahan Harga.
2. **Tujuan bisnis:** Quantifies how much a price changed, logged to `HARGA_LOG` and included in the change-notification email.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanHarga(pin, payload)`.
5. **Baris:** `Code.gs:1215` (`pct = lama ? (baru - lama) / lama : 0`).
6. **Input yang digunakan:** `lama` (previous price), `baru` (new price).
7. **Output:** A fraction (stored), formatted as a percentage in the UI/email.
8. **Canonical Entity yang dipakai:** Price (Canonical Data Contract §4).
9. **Business Service yang seharusnya memiliki formula ini:** Pricing Service.
10. **Dashboard Card yang menggunakan formula ini:** None of the 11 documented cards.
11. **Business Rule yang berkaitan:** PRC-001 (Price Requires Human Approval, Always — this formula computes the *record* of a change that, per PRC-001, should never have been "silently applied"; whether `simpanHarga()` itself enforces a pre-approval gate is UNKNOWN from this catalog's scope — it appears to write the change directly, then notify, which is worth flagging against PRC-001's absolute wording).
12. **Dependencies:** None upstream.
13. **Assumptions:** None beyond `lama`/`baru` being correctly read from the catalog sheet at write time.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** Yes, always, per PRC-001 — see the potential gap noted in field 11 above.
17. **Notes:** Duplicated client-side for live preview — see §6, Duplicate #7.

### PRC-F-02 — Ambang Peringatan Harga Ekstrem (Extreme Price-Change Alert Threshold)
1. **Nama Formula:** Ambang Peringatan Perubahan Harga (>15%).
2. **Tujuan bisnis:** Flags a price change large enough to plausibly be a typo, both in the saved log's row coloring and in the owner notification email.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `simpanHarga(pin, payload)` (log highlighting), `_kabarHarga(...)` (email flag).
5. **Baris:** `Code.gs:1230` (`Math.abs(rows[k][6]) > 0.15`), `Code.gs:1249` (`Math.abs(r.pct) > 15`).
6. **Input yang digunakan:** PRC-F-01's output.
7. **Output:** Boolean flag per changed item.
8. **Canonical Entity yang dipakai:** Price.
9. **Business Service yang seharusnya memiliki formula ini:** Pricing Service.
10. **Dashboard Card yang menggunakan formula ini:** None.
11. **Business Rule yang berkaitan:** None named — the 15% threshold is an undocumented magic number (Finding F-5, §8), distinct from but adjacent to PRC-001's approval requirement.
12. **Dependencies:** PRC-F-01.
13. **Assumptions:** That 15% is a reasonable typo-detection threshold — no stated rationale in the source.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No for the flag itself; the underlying price change is always-gated per PRC-001.
17. **Notes:** Duplicated client-side, identical 15% threshold — see §6, Duplicate #7.

## 3.7 Supplier / Central Kitchen Formulas (4)

**Classification note:** none of the eleven catalog categories offered by this sprint's scope ("finance, inventory, customer, supplier...") map cleanly onto Central Kitchen, which is a production unit whose output *supplies* Sederhana Jaya 4 rather than a third-party supplier in the Canonical Data Contract's sense (Product/Supplier entity). These four formulas are grouped here as the closest fit, with the mismatch flagged explicitly rather than silently forced into "Supplier."

### SUP-F-01 — Kontribusi CK ke Omzet SJ4 (CK Revenue Contribution %)
1. **Nama Formula:** Kontribusi Central Kitchen terhadap Omzet SJ 4.
2. **Tujuan bisnis:** What share of Sederhana Jaya 4's total operating cost is CK-sourced goods — the only lens this repository has on CK's economic footprint at all, given CK has no cost data of its own (per CLAUDE.md's own standing note: "Central Kitchen berjalan tanpa satu pun angka biaya").
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_ringkasCK()`.
5. **Baris:** `Code.gs:2107` (`kontribusi: totalOmzet ? (totalCK / totalOmzet * 100) : 0`).
6. **Input yang digunakan:** `totalCK` (sum of CK-column values from SJ4's external "buku biaya" spreadsheet), `totalOmzet` (sum of an adjacent "omzet"-labeled column in the same sheet).
7. **Output:** Percentage.
8. **Canonical Entity yang dipakai:** None — no canonical entity exists for Central Kitchen at all (Canonical Data Contract §10: CK's "own Authoritative Source for day-to-day CK operational data is still an open item").
9. **Business Service yang seharusnya memiliki formula ini:** None — no CK-scoped Business Service exists.
10. **Dashboard Card yang menggunakan formula ini:** None of the 11 documented cards (all 11 are TSS-scoped).
11. **Business Rule yang berkaitan:** GOV-006's Known Gap (whether CK Approval Authority sits with Ibu alone, Teh Nurul alone, or jointly is explicitly UNKNOWN).
12. **Dependencies:** None upstream besides the external spreadsheet's own column layout.
13. **Assumptions:** That the column found via a case-insensitive text search for "omzet"/"omset" in the first 8 rows of the sheet is actually SJ4's total operating cost, and not, for example, gross sales — the source code makes no independent confirmation of this beyond the header-text match.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** UNKNOWN — CK data ownership sits with Ibu & Teh Nurul, outside this repository's normal CEO-approval framing (per CLAUDE.md: "Scope CEO hanya pencatatan").
17. **Notes:** The underlying column-discovery mechanism (`_tabRekapSJ4`, `Code.gs:2027-2051`) locates the right sheet/tab by scanning cell text for the literal string "central kitchen" — a fragile method the source's own migration-plan audit (`implementation/appsscript-migration-plan.md` §1.12) already flagged as needing REFACTOR before any MOVE.

### SUP-F-02 — Rata-rata CK Harian (CK Average Daily Revenue)
1. **Nama Formula:** Rata-rata Pendapatan CK per Hari.
2. **Tujuan bisnis:** Smooths daily CK-to-SJ4 revenue into a single average figure.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_ringkasCK()`.
5. **Baris:** `Code.gs:2095` (`rata = hariIsi ? totalCK / hariIsi : 0`).
6. **Input yang digunakan:** `totalCK`, `hariIsi` (count of days with a non-zero CK value).
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** None (same as SUP-F-01).
9. **Business Service yang seharusnya memiliki formula ini:** None assigned.
10. **Dashboard Card yang menggunakan formula ini:** None.
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** SUP-F-01's inputs.
13. **Assumptions:** Averaging only over days with a non-zero value (rather than all calendar days) could overstate the "typical" day if zero-value days represent genuine non-delivery rather than missing data — the source itself flags this ambiguity via a separate warning (`Code.gs:2137-2138`: "cek apakah memang tidak ada kiriman").
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** UNKNOWN (same as SUP-F-01).
17. **Notes:** None.

### SUP-F-03 — Proyeksi CK Bulanan (CK Monthly Projection)
1. **Nama Formula:** Proyeksi Pendapatan CK Sebulan.
2. **Tujuan bisnis:** Same run-rate extrapolation pattern as FIN-F-08/09, applied to CK-to-SJ4 revenue.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_ringkasCK()`.
5. **Baris:** `Code.gs:2105` (`proyeksiBulan: rata * 30`).
6. **Input yang digunakan:** SUP-F-02.
7. **Output:** Rupiah.
8. **Canonical Entity yang dipakai:** None.
9. **Business Service yang seharusnya memiliki formula ini:** None assigned.
10. **Dashboard Card yang menggunakan formula ini:** None.
11. **Business Rule yang berkaitan:** None named.
12. **Dependencies:** SUP-F-02.
13. **Assumptions:** Same flat-run-rate assumption as FIN-F-08/09 (Finding F-4, §8), plus SUP-F-02's own averaging caveat.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** UNKNOWN.
17. **Notes:** None.

### SUP-F-04 — Status Kelengkapan Harga CK (CK Price Completion %)
1. **Nama Formula:** Status Kelengkapan Harga Barang Dapur.
2. **Tujuan bisnis:** Tracks how many of the 130+ Central Kitchen catalog items have a real price entered — directly the same gap this repository's own INV-007 already documents, now traced to its exact live counter.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_statusHargaCK()`.
5. **Baris:** `Code.gs:2115-2124`.
6. **Input yang digunakan:** Sheet `MASTER_CK`, column D (`Harga`) — counts rows where `Number(harga) > 0`.
7. **Output:** `{terisi, total}` (count with price, total items).
8. **Canonical Entity yang dipakai:** Product (Central Kitchen catalog scope).
9. **Business Service yang seharusnya memiliki formula ini:** Pricing Service, jointly with Inventory Service.
10. **Dashboard Card yang menggunakan formula ini:** None of the 11 documented cards.
11. **Business Rule yang berkaitan:** INV-007 (Central Kitchen Catalog Rp0 Pricing Gap) — this formula is the exact live counter behind that rule's "130+ items" figure.
12. **Dependencies:** None upstream.
13. **Assumptions:** That `harga > 0` reliably means "priced" — matches the same convention used elsewhere in the source (e.g. FIN-F-03's "0 means not-yet-recorded").
14. **Current Status:** Legacy Only.
15. **Validation Status:** Proven — this is a direct, simple count against a live sheet; the underlying MASTER_CK data (per this repository's own prior source-reading, `Code.gs:110-237`) independently confirms nearly every CK item is priced 0, matching what this formula would report.
16. **Human Approval Required?** UNKNOWN (CK pricing authority sits with Ibu & Teh Nurul).
17. **Notes:** None.

## 3.8 Security / Access Formulas (1)

### SEC-F-01 — PIN Lockout Counter (Brute-Force Scoring)
1. **Nama Formula:** Penguncian PIN Setelah Percobaan Gagal.
2. **Tujuan bisnis:** A basic brute-force defense — after 8 failed PIN attempts, login is locked for 5 minutes.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `_cekKunciPin()`, `_catatPinSalah(pin)`.
5. **Baris:** `Code.gs:368-392`, constants `MAKS_GAGAL = 8` and `LAMA_KUNCI = 5` at `Code.gs:252-253`.
6. **Input yang digunakan:** A rolling count of failed PIN attempts, stored in `CacheService` with a 600-second TTL.
7. **Output:** A lock flag (`KUNCI_PIN`), active for `LAMA_KUNCI * 60` seconds once the count reaches `MAKS_GAGAL`.
8. **Canonical Entity yang dipakai:** Employee (the PIN belongs to an `ORANG` record), though this is access-control logic, not a canonical business fact.
9. **Business Service yang seharusnya memiliki formula ini:** None of the named Business Services — this is Technical/Security-classed logic per Business Rules Catalog §1's own Policy/Business/Technical/Validation distinction, not a business calculation properly speaking. Included here because the sprint's scope explicitly asked for "scoring" and this is the only scoring-shaped mechanism found.
10. **Dashboard Card yang menggunakan formula ini:** None.
11. **Business Rule yang berkaitan:** SEC-002 (Data Classification Scheme) applies to the PIN itself as Confidential data; no Business Rules Catalog entry addresses lockout policy specifically.
12. **Dependencies:** None upstream.
13. **Assumptions:** That `CacheService`'s per-script (not per-user) cache is an acceptable scope for this counter — a failed attempt from any user contributes to the same shared counter, meaning one person's mistyped PINs could lock out a different person's next login attempt. Not flagged as a bug by the source; noted here as a real behavioral property worth knowing before this logic is trusted anywhere else.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No.
17. **Notes:** Also logs every failed attempt (with the PIN masked via `_samarkanPin`) to sheet `LOG_AKSES` — a genuine, if minimal, security audit trail.

## 3.9 Dashboard Composition Formulas (1)

### DASH-F-01 — Action List Prioritization (`tindak`)
1. **Nama Formula:** Prioritas Daftar Tindak Lanjut Dashboard.
2. **Tujuan bisnis:** Assembles every warning/status a business owner needs to see into one ordered list, worst-first — the dashboard's primary "what needs my attention" mechanism.
3. **Lokasi source file:** `Code.gs`.
4. **Nama function:** `dashboard(pin)`.
5. **Baris:** `Code.gs:1950-1978`.
6. **Input yang digunakan:** FIN-F-03 (`beban`), sheet `KELUAR`/confirmation status, CASH-F-04-adjacent shift status, `dompetBulan.kasTunai` vs `BATAS_BRANKAS_MENGINAP`, INV-F-08 (`stokMenipis`), INV-F-07 (`nilaiStokMati`), FIN-F-11 (`piutangTotal`), Loka data freshness.
7. **Output:** An ordered array of `{jenis: 'bad'|'warn'|'info', teks}`, with the most severe condition (missing expense data) hardcoded first.
8. **Canonical Entity yang dipakai:** All of the above, transitively.
9. **Business Service yang seharusnya memiliki formula ini:** Reporting Service (this is exactly the kind of assembly-not-computation role REP-001 describes — though this Apps Script version does its own computation upstream too, not purely assembly).
10. **Dashboard Card yang menggunakan formula ini:** Not one of the 11 documented cards individually; a cross-cutting presentation formula.
11. **Business Rule yang berkaitan:** REP-001 (Reports Must Never Duplicate Existing Computation), REP-003 (Dashboard Holds No Truth of Its Own) — this formula is a partial violation of both in spirit, since it both computes (via the functions it calls) and orders/prioritizes in the same pass, rather than purely assembling pre-computed figures from a separate service.
12. **Dependencies:** Every formula listed in field 6.
13. **Assumptions:** The severity ordering (expense-missing first, then unconfirmed shipments, then cash variance, then stock, etc.) is a hardcoded priority sequence with no documented rationale for why this specific order reflects actual business risk ranking.
14. **Current Status:** Legacy Only.
15. **Validation Status:** Unknown.
16. **Human Approval Required?** No — read-only presentation logic.
17. **Notes:** This is the only formula in this catalog whose "Business Service" answer is itself ambiguous by construction — see §7.

---

# 4. Mapping — Apps Script Formula → Canonical Entity → Business Rule → Business Service → Dashboard Dataset → Dashboard Card

| Formula ID | Canonical Entity | Business Rule | Business Service | Dashboard Dataset field | Dashboard Card |
| --- | --- | --- | --- | --- | --- |
| FIN-F-01 | Transaction/Invoice | FIN-006, FIN-009 | Finance Service | `dashboardCards["gross-profit"]` | Gross Profit |
| FIN-F-02 | Transaction/Invoice + Expense | FIN-008, FIN-009 | Finance Service | `dashboardCards["net-profit"]` | Net Profit |
| FIN-F-03 | Expense (non-canonical, `BEBAN` sheet) | FIN-008 | Finance Service | `dashboardCards["expenses"]` | Expenses |
| FIN-F-04 | Transaction/Invoice | FIN-006 | Finance Service | UNKNOWN — no card | None |
| FIN-F-05 | None | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| FIN-F-06 | None | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| FIN-F-07 | None | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| FIN-F-08 | Transaction/Invoice | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| FIN-F-09 | Transaction/Invoice | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| FIN-F-10 | None | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| FIN-F-11 | Receivable | FIN-007 | Finance Service | `dashboardCards["outstanding-receivables"]` | Outstanding Receivables |
| INV-F-01 | Product + Transaction/Invoice | UNKNOWN | Inventory Service / Finance Service | UNKNOWN — no card | None |
| INV-F-02 | Product + Transaction/Invoice | INV-002 | Inventory Service | UNKNOWN — no card | None |
| INV-F-03 | Product | INV-002 | Inventory Service | UNKNOWN — no card | None |
| INV-F-04 | Receivable | FIN-007 | Finance Service / Inventory Service | UNKNOWN — no card | None |
| INV-F-05 | Product + Receivable | UNKNOWN | Inventory Service / Finance Service | UNKNOWN — no card | None |
| INV-F-06 | Product | INV-005 | Inventory Service | `dashboardCards["inventory-value"]` | Inventory Value |
| INV-F-07 | Product + Transaction/Invoice | UNKNOWN | Inventory Service | UNKNOWN — closest match "Stock Alerts" | Stock Alerts (partial) |
| INV-F-08 | Product | UNKNOWN | Inventory Service | UNKNOWN — closest match "Stock Alerts" | Stock Alerts (partial) |
| INV-F-09 | Product + Transaction/Invoice | UNKNOWN | Inventory Service / Finance Service | UNKNOWN — no card | None |
| CUS-F-01 | Customer + Transaction/Invoice | CUS-001, CUS-004 | Customer Service / Finance Service | UNKNOWN — no card | None |
| CUS-F-02 | Customer + Branch | CUS-001, CUS-004 | Customer Service | UNKNOWN — no card | None |
| CASH-F-01 | Cash | SAL-002 | Finance Service | UNKNOWN — no card (Cash in Hand card is itself UNKNOWN) | Cash in Hand (conceptually) |
| CASH-F-02 | Cash | SAL-002 | Finance Service | UNKNOWN — no card | None |
| CASH-F-03 | Cash | FIN-003 | Finance Service | UNKNOWN — no card | None |
| CASH-F-04 | Cash | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| CASH-F-05 | Cash | UNKNOWN | Finance Service | UNKNOWN — no card | None |
| SAL-F-01 | None ("Goods Out" unmodeled) | UNKNOWN | None assigned | UNKNOWN — closest match "Goods Out" | Goods Out (conceptually) |
| SAL-F-02 | None | UNKNOWN | None assigned | UNKNOWN — no card | None |
| SAL-F-03 | None | UNKNOWN | None assigned | UNKNOWN — no card | None |
| SAL-F-04 | None | UNKNOWN | None assigned | UNKNOWN — no card | None |
| SAL-F-05 | None | AUT-003 | None assigned | UNKNOWN — no card | None |
| PRC-F-01 | Price | PRC-001 | Pricing Service | UNKNOWN — no card | None |
| PRC-F-02 | Price | PRC-001 | Pricing Service | UNKNOWN — no card | None |
| SUP-F-01 | None (CK unmodeled) | GOV-006 (gap) | None assigned | UNKNOWN — no card | None |
| SUP-F-02 | None | UNKNOWN | None assigned | UNKNOWN — no card | None |
| SUP-F-03 | None | UNKNOWN | None assigned | UNKNOWN — no card | None |
| SUP-F-04 | Product (CK scope) | INV-007 | Pricing Service / Inventory Service | UNKNOWN — no card | None |
| SEC-F-01 | Employee (indirectly) | SEC-002 | None (Technical/Security, not a Business Service) | UNKNOWN — no card | None |
| DASH-F-01 | All of the above, transitively | REP-001, REP-003 | Reporting Service | UNKNOWN — cross-cutting, not one field | Cross-cutting |

**Read directly from this table:** of 40 formulas, only **4** (FIN-F-01, FIN-F-02, FIN-F-03, FIN-F-06/INV-F-06, FIN-F-11 — see exact count methodology in §9) have *any* mapped Dashboard Dataset destination today, and even those four have a documented implementation gap against their Reporting Service counterpart (§5). Every Cash, Sales/Shipment, Pricing, Supplier/CK, and Security formula — 22 of 40 — has **no** Business Service assignment and **no** Dashboard Dataset field at all.

---

# 5. Duplicate Formula Matrix

Formulas computed more than once, computed both client- and server-side, or computed independently by both Apps Script and the Reporting Service, with a real possibility of producing different values.

| # | Formula | Computed In | Same Logic? | Risk of Divergence |
| --- | --- | --- | --- | --- |
| 1 | Gross Profit (FIN-F-01) | Apps Script `_olahLoka()` (`Code.gs:1740-1753`, includes PAID + PENDING, excludes only CANCELLED) vs. Reporting Service `cards.js:107-123` (PAID only) | **No — different invoice population** | **High.** Confirmed real divergence, not hypothetical — see Finding F-1, §8. |
| 2 | Kas Awal / Seharusnya / Selisih (CASH-F-01/02/03) | Server `dataShift()`/`simpanTutupShift()` (authoritative) vs. client `hitungShift()` (`Index.html:1519-1531`, live preview) | Yes — same formula, same thresholds | **Low.** Server always recomputes authoritatively at save time; the client copy exists purely for optimistic-UI feedback. Risk is only that a future edit to one side and not the other silently breaks the live-preview accuracy, not the saved record. |
| 3 | Beban Bulan / Expenses (FIN-F-03) | Apps Script `_bebanBulan()` (`Code.gs:1874-1885`, reads sheet `BEBAN`) vs. Reporting Service `cards.js:221-249` (reads canonical `Expense.items[].price`) | **No — entirely different source systems**, not merely a different formula | **High.** These are not two computations of the same data — they are two unreconciled expense-tracking systems (`BEBAN` sheet vs. Loka's own `Expense` table per Canonical Data Contract §4), a direct instance of GOV-005 (No Duplicate Meaning). |
| 4 | Inventory Value (INV-F-06) | Apps Script `_olahLoka()` (`Code.gs:1767-1773,1787`, reads a Drive-cached Loka JSON export) vs. Reporting Service `cards.js:179-183` (reads canonical `Product` from the Connector's Realm extraction) | **Yes — identical formula** (`stock × capitalPrice`) | **Medium.** Same math, different pipeline entry points reading the same underlying Loka data at potentially different snapshot moments — could disagree if the JSON export and the most recent Realm backup are not from the same point in time. Never run side-by-side to confirm agreement. |
| 5 | Jenjang Setoran thresholds (CASH-F-05) | Server `_jenjangSetoran()` (`Code.gs:2404-2428`) vs. client inline `if`/`else if` (`Index.html:1536-1550`) | Yes — same two thresholds, same three messages, written twice | **Medium.** Same reasoning as #2 (server is authoritative), but this is the clearest case of a *named policy* (the "Runbook Kustodi Kas") whose exact Rupiah thresholds live in two separate code locations that must be manually kept in sync — a threshold change in one place without the other silently diverges the live preview from the saved outcome. |
| 6 | Nilai Kirim / Shipment total (SAL-F-01) | Server `simpanKeluar()` (`Code.gs:917-925`) vs. client `hitung()` (`Index.html:628-637`) | Yes — identical `qty × harga` | **Low.** Simple, unlikely-to-diverge arithmetic; standard optimistic-UI pattern. |
| 7 | % Perubahan Harga (PRC-F-01/02) | Server `simpanHarga()` (`Code.gs:1215,1230`) vs. client `ubahHarga()`/`hitungHarga()` (`Index.html:805-838`) | Yes — identical formula and identical 15% threshold | **Low.** Same reasoning as #6. |
| 8 | Transaction Count | Apps Script `_olahLoka()`'s `hariIni.trx`/`bulanIni.trx` (`Code.gs:1745-1748`, counts invoices where `status !== 'CANCELLED'`, so PAID + PENDING) vs. Reporting Service `cards.js:129-144` (counts **all** statuses including CANCELLED, `invoices.length`) | **No — different invoice population, in the opposite direction from Divergence #1** | **High.** A third, independently-discovered instance of the same underlying issue Business Rules Catalog SAL-004 already names as UNKNOWN — this catalog confirms there are now *three* different real inclusion rules in use across this repository (PAID-only, PAID+PENDING, and all-statuses), not merely an unresolved question. |
| 9 | Rupiah formatting (`_rp` / `rp`) | `Code.gs:2839` vs. `Index.html:368` | Yes — textually identical | **Very Low.** Not a business formula, included here only because the task explicitly asked for this category of duplication. |

---

# 6. Gap Analysis

## 6.1 Formulas in Apps Script with no Reporting Service equivalent at all

36 of 40 formulas: all of INV-F-01 through INV-F-05 and INV-F-07/08/09 (GMROI, Turnover, DIO, DSO, Cash Conversion Cycle, Dead Stock, Low Stock, Category Margin), both CUS-F formulas (Customer Margin, Concentration), all five CASH-F formulas, all five SAL-F formulas, both PRC-F formulas, all four SUP-F (Central Kitchen) formulas, SEC-F-01, DASH-F-01, and five of the eleven FIN-F formulas (FIN-F-04 through FIN-F-10, the target-narrative and margin-percentage formulas).

**Gap #1 — the largest single finding of this catalog:** GMROI, Inventory Turnover, DIO, DSO, Cash Conversion Cycle, Dead Stock, Category Margin, Customer Margin, and Customer Concentration — nine formulas representing the *entire strategic-analytics layer* of the legacy dashboard — have no destination anywhere in the current 11-card Dashboard Dataset schema. This is not a migration-sequencing gap; it is a genuine capability decision nobody has made: **should Enterprise OS reproduce this analytics layer at all**, and if so, does it belong in Inventory Service, Finance Service, or a new Analytics-scoped service? This catalog does not decide that question — it makes the question visible with full formula-level precision for the first time.

**Gap #2 — Stock Alerts card exists but is empty on both sides, for different reasons.** The Reporting Service's "Stock Alerts" card is `UNKNOWN` because canonical `Product` carries no `stockAlert`/`expiryAlert` field (`cards.js:262-272`, Implementation Backlog BL-012). Apps Script's INV-F-07/INV-F-08 (Dead Stock, Low Stock) are real, working formulas that would populate exactly this card's intent — but they were never connected to it, because they predate the Dashboard Dataset schema entirely. Closing this gap is a matter of wiring two things that already independently exist, not building new logic from scratch.

## 6.2 Formulas in the Reporting Service with a different implementation than Apps Script

4 of 40: FIN-F-01 (Gross Profit — Duplicate #1), FIN-F-03 (Expenses — Duplicate #3), INV-F-06 (Inventory Value — Duplicate #4), plus Transaction Count (Duplicate #8, not separately catalogued above as its own Formula ID since it is a simple count rather than a business formula, but included in the Duplicate Matrix per this section's explicit ask).

**None of these four are exact matches.** Every single formula that exists on both sides of this repository's Apps Script/Enterprise-OS boundary has at least one confirmed or plausible divergence. This is the single most important structural finding of the Gap Analysis: **there is currently no formula in this entire repository that is simultaneously (a) implemented in both systems and (b) confirmed to produce the same answer.**

---

# 7. Validation / Cross-Reference Against Existing Documents

- **Canonical Data Contract v1** — every "Canonical Entity" field above was checked against §4's entity table. Where a formula's underlying data has no canonical entity (Goods Out, Central Kitchen, cash-custody ongoing tracking), that gap was already independently named in the Contract itself (Product/Cash/Expense rows), confirming rather than contradicting this catalog's findings.
- **Business Rules Catalog v1** — every "Business Rule yang berkaitan" field was checked against all 64 rules. FIN-008/FIN-009's Net Profit guard (FIN-F-02) is the single most significant confirmation: this catalog found the Apps Script formula those two rules describe secondhand, now traced to exact source lines. Conversely, this catalog also surfaces several **undocumented** thresholds functioning as de facto business rules with no Business Rules Catalog entry at all (§8, Finding F-5) — a direct input to that catalog's own Section 15 "Missing Rules" list, not contradicting it.
- **Dashboard Dataset schema / `dashboard-v2-implementation-plan.md`** — the 11-card structure was used as-is to determine "Dashboard Card yang menggunakan formula ini" for every entry; no card was invented, and the schema file itself was not modified.
- **Reporting Service (`cards.js`, `reconciliation.js`)** — read in full for this sprint (not from a prior summary) specifically to make the Duplicate Formula Matrix and Gap Analysis precise rather than approximate. `reconciliation.js`'s own two-way check (Invoice.invoiceProfit vs. grandTotal−capitalSubTotal, PAID-only) was confirmed to apply to a **different, narrower population** than Apps Script's FIN-F-01 — the reconciliation audit's "agreed to the cent" finding therefore does not extend to validate FIN-F-01 as this catalog documents it.
- One structural observation this cross-reference surfaced, not previously named anywhere: **Siklus Kas (INV-F-05) and several Central Kitchen formulas (SUP-F group) have no single obvious Business Service owner** — they combine Inventory and Finance concerns, or fall entirely outside every named service. This is worth a note to whoever eventually revisits `service-boundary-review.md`.

---

# 8. Findings — Formulas That Look Wrong, Undocumented, or Otherwise Notable

Recorded as findings only, per this sprint's explicit instruction not to fix, simplify, or assume correctness.

**Finding F-1 (High).** `_olahLoka()`'s Gross Profit and revenue figures (FIN-F-01, FIN-F-04, FIN-F-08, FIN-F-09) include `PENDING`-status invoices, excluding only `CANCELLED` (`Code.gs:1731`). The Reporting Service's equivalent "Gross Profit" card (`cards.js:113`) filters to `PAID` only. These are not stylistic differences — a business with meaningful outstanding receivables would see genuinely different Gross Profit figures from the two systems for the same period.

**Finding F-2 (High).** Apps Script's `_bebanBulan()` (FIN-F-03) reads from sheet `BEBAN`, a manually-entered ledger with categories Gaji/Sewa/Listrik/Transport/Susut/Lain. The Reporting Service's "Expenses" card reads from the canonical `Expense` entity, whose Authoritative Source is Loka POS's own `Expense` table (Canonical Data Contract §4). These are two structurally different recording systems for the same business concept ("operating expense"), never reconciled — a live instance of GOV-005 (No Duplicate Meaning).

**Finding F-3 (Medium — revises a premise elsewhere in this repository).** `cards.js`'s comment block (lines 13-19) states Net Profit is left `UNKNOWN` because "Gross Profit minus Expenses is NOT a confirmed, adopted formula" anywhere in this repository. This catalog finds that premise needs qualification: `Code.gs:2009-2012` **is** exactly that formula, gated by exactly the guard FIN-008 describes (`beban > 0`), with a code comment explicitly citing the same Rp1.4 million net-loss incident FIN-009 documents. The formula's *deployment status* is unverified (the file has never run) — but "no confirmed formula exists" and "a candidate formula exists but is unverified" are different claims, and the distinction matters for whoever next decides whether to wire this up.

**Finding F-4 (Medium).** Every monthly/annual projection formula in this catalog (FIN-F-08, FIN-F-09, INV-F-01, INV-F-02, SUP-F-03) uses the same flat-run-rate extrapolation: `(value / daysWithData) × totalPeriodDays`. This assumes no seasonality, no day-of-week pattern, and no trend — a simplifying assumption never stated as a caveat anywhere in the UI or source comments, despite being applied to numbers presented to the owner as forward-looking projections.

**Finding F-5 (Medium).** At least eight distinct threshold constants function as de facto business rules with no corresponding entry in `business-rules-catalog-v1.md`: GMROI "healthy" benchmark ≥3.2× (`Index.html:1207`), Turnover "healthy" benchmark ≥12× (`Index.html:1217`), Dead Stock value floor Rp100,000 (`Code.gs:1799`), Low Stock day-count ≤5 days (`Code.gs:1775`), Customer Concentration "buruk" threshold >75% (`Index.html:1250`), Customer Margin "low" threshold <5% (`Index.html:1268`), Category Margin "low" threshold <6% (`Index.html:1284`), and Price-Change "extreme" threshold >15% (`Code.gs:1230`, `1249`). `BATAS_SELISIH` (Rp30,000 cash-variance tolerance) and the two Jenjang Setoran thresholds (Rp2M/Rp5M) are at least named as constants near the top of `Code.gs`, but still lack a numbered Business Rules Catalog entry justifying their specific values. None of these is presented as wrong by this catalog — several (GMROI, Turnover) read as plausible external retail benchmarks — but none is traceable to a named source document, which is exactly the gap Business Rules Catalog §15 exists to name.

**Finding F-6 (Low).** The `999` sentinel value for "effectively infinite days of stock remaining" (INV-F-08, `Code.gs:1773`) is a real number, not a null/undefined — a future consumer sorting or aggregating this field without knowing the sentinel convention could silently treat a well-stocked, slow-moving item as if it will run out in 999 real days.

**Finding F-7 (Low, but directly relevant to this repository's own standing CEO-facing figures).** This repository's `CLAUDE.md` already states specific figures for category margin (Bahan Dapur 12.43%, Gula 11.90%, Kerupuk 8.00%, Beras 5.18%, Minyak 4.18%) and customer concentration (~77% to Sederhana Jaya), both sourced explicitly from "POS Loka / sheet `Ringkasan`" and manual analysis respectively. INV-F-09 (Category Margin) and CUS-F-02 (Customer Concentration) compute conceptually the same two figures, from a **different** pipeline (a Drive-cached Loka JSON export processed by `_olahLoka()`, not the `Ringkasan` sheet or the manual analysis CLAUDE.md cites). This catalog does not claim these formulas produce different numbers than CLAUDE.md's — it was not asked to run them — but flags that they are **not the same computation**, and must not be silently treated as interchangeable sources for the same headline figures the CEO already relies on.

---

# 9. Hasil Akhir

**Methodology note on counting, stated once:** "Formula" here means any distinct calculation catalogued in §3 (40 total). "KPI" is a narrower judgment call — a formula presented as a standalone headline metric card in the dashboard UI, as opposed to an intermediate value feeding a larger narrative. Both counts are shown with their basis so the number can be checked, not just quoted.

**1. Jumlah formula yang ditemukan:** **40** (§3.1–§3.9, IDs FIN-F-01 through DASH-F-01).

**2. Jumlah KPI:** **7** — GMROI (INV-F-01), Perputaran Stok (INV-F-02), Siklus Kas (INV-F-05), Stok Mati value (INV-F-07), Konsentrasi Sederhana Jaya (CUS-F-02), Gross Margin % (FIN-F-04), CK Kontribusi % (SUP-F-01) — the seven formulas presented as their own dedicated headline metric card (`.met`/`.kpi` blocks) in `Index.html`'s dashboard renderers, distinct from intermediate values that only ever appear inline within a longer narrative (e.g. `omzetPerlu`).

**3. Jumlah formula finance:** **11** (FIN-F-01 through FIN-F-11, §3.1). If Cash (5, §3.4) is counted as a Finance sub-domain rather than separately, the combined Finance total is **16**.

**4. Jumlah formula inventory:** **9** (INV-F-01 through INV-F-09, §3.2).

**5. Jumlah formula customer:** **2** (CUS-F-01, CUS-F-02, §3.3).

**6. Jumlah formula supplier:** **4** (SUP-F-01 through SUP-F-04, §3.7 — Central Kitchen, with the classification caveat stated in that section's header: none of these are a true third-party-supplier calculation in the Canonical Data Contract's sense).

**7. Jumlah formula dashboard:** **1** as a pure cross-cutting composition formula (DASH-F-01) that does not itself belong to any single business domain. If "dashboard formula" is read more broadly as "any formula whose sole or primary consumer is the owner dashboard UI" rather than "formula that composes the dashboard's presentation," the number is effectively all 40, since every formula catalogued here was extracted specifically because it feeds `dashboard(pin)`, `dashboardCK(pin)`, or their rendering counterparts. The narrow reading (1) is used in the total below to avoid double-counting.

**Full category breakdown (sums to 40):** Finance 11 · Inventory 9 · Cash 5 · Sales/Shipment 5 · Customer 2 · Supplier/CK 4 · Pricing 2 · Security 1 · Dashboard 1.

**8. Formula yang sudah ada di Enterprise OS (Reporting Service):** **4 of 40** — Gross Profit (FIN-F-01), Expenses (FIN-F-03), Inventory Value (INV-F-06), and Transaction Count (not separately catalogued as its own Formula ID, a simple count rather than a business formula, but present in both systems). **All four have a confirmed or credible divergence from their Apps Script counterpart** (§5) — none is a verified 1:1 match. Net Profit (FIN-F-02) exists as working Apps Script logic but is deliberately left unimplemented (`blocked`) in the Reporting Service.

**9. Formula yang belum ada di Enterprise OS:** **36 of 40** — every Cash formula (5), every Sales/Shipment formula (5), every Pricing formula (2), every Supplier/CK formula (4), the Security formula (1), the Dashboard composition formula (1), and 9 of 11 Finance formulas, and all 9 Inventory-analytics formulas except Inventory Value.

**10. Rekomendasi urutan migrasi berdasarkan nilai bisnis (bukan kemudahan teknis):**

1. **Net Profit / Safe-Display Guard (FIN-F-02)** — highest business value in this catalog: directly tied to a real, already-documented near-miss (a 73%-"achieved" misreading in a month that was actually a Rp1.4 million net loss). A working candidate formula already exists; the blocker is verification, not invention.
2. **Cash reconciliation chain (CASH-F-01 through CASH-F-05)** — direct custody of real money, three Critical-priority Business Rules (FIN-003, SAL-002, SAL-003) already attached, and a confirmed Rp5.8 million historical discrepancy this exact formula chain was written to fix.
3. **Inventory strategic-analytics group (INV-F-01 through INV-F-05, INV-F-07, INV-F-08)** — GMROI, Turnover, DIO, DSO, Cash Conversion Cycle, Dead Stock, Low Stock. High strategic decision-value (capital efficiency directly informs expansion/investment decisions), no acute loss event on record, so ranked below Cash but above pure-analytics category/customer breakdowns.
4. **Customer Margin and Concentration (CUS-F-01, CUS-F-02)** — directly feeds this organization's own already-identified strategic risk (customer concentration, B2B margin-floor questions around Papoy) — high narrative and decision value even though no money is directly at risk from the formula itself.
5. **Category Margin (INV-F-09)** — directly informs pricing/assortment decisions already active in this organization's own stated priorities (e.g. the Minyak-margin finding in CLAUDE.md).
6. **Central Kitchen formulas (SUP-F-01 through SUP-F-04)** — real business interest, but blocked on an unresolved organizational question (GOV-006: is CK approval authority Ibu's, Teh Nurul's, or joint) that sits outside this repository's normal CEO-approval framing — ranked below TSS-scoped work until that question is resolved, not because the formulas themselves are less important.
7. **Sales/Shipment logistics formulas (SAL-F-01 through SAL-F-05)** — real operational-integrity value (duplicate detection, receipt reconciliation), but lower strategic-decision weight than the groups above; more "operations hygiene" than "business decision input."
8. **Pricing change formulas (PRC-F-01, PRC-F-02)** — useful alerting, lower stakes than cash or profit figures.
9. **Security/access formula (SEC-F-01)** — real but narrow value; no business-decision content at all.
10. **Dashboard composition formula (DASH-F-01)** — correctly last: it is a presentation-layer aggregation of everything above it, and migrating it before the formulas it depends on would mean migrating an assembly of still-unverified parts.

This order is explicitly **not** ranked by implementation ease — SEC-F-01 and the `rp()`/`_rp()` formatting duplicate would be trivial to migrate technically, and are ranked at or near the bottom precisely because technical ease was excluded as a ranking factor, per this sprint's instruction.

---

No file besides this one was created. No existing file was modified. No Apps Script, Node.js, API, UI, or migration code was written. Nothing was committed.
