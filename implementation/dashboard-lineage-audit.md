# Dashboard Lineage Audit

| | |
| --- | --- |
| **Status** | Implementation working document |
| **Date** | 31 July 2026 |
| **Scope** | Full data lineage, card by card, for the 11 dashboard metrics already named in `reports/dashboard-reconciliation-audit.md` |
| **Hard limit, stated once:** | This repo contains **fragments** of the Apps Script codebase (`PATCH-01-performa-dan-dashboard.md`, `TutupShiftV2.gs`, `SPEC-tutup-shift-v2.md`) and a **reconstructed** data contract for the spreadsheet (`SPEC.md`) — not the full, live `Code.gs`. Every lineage step below is either a direct quote/citation of something in one of those documents, a direct computation from `prototype/loka-canonical-poc/output/canonical.json`, or a direct read of the Financial Baseline workbook. Anywhere the chain cannot be verified this way, it says **UNKNOWN** — it does not guess. |

---

## 1. Today's Revenue

```
Dashboard Card:        "Today's Revenue" (exact live label UNKNOWN)
Apps Script Function:  dashboard() — presumed; not quoted at this granularity
Google Sheet:          Ringkasan
Formula:               UNKNOWN — SPEC.md documents the field `hariIni.omzet` exists; no arithmetic is quoted anywhere
Canonical Dataset:     enterprise-data/canonical/sales.md (conceptually — not actually wired to production)
Canonical Entity:      Invoice (grandTotal)
Original Loka Entity:  Invoice
Original Realm Field:  UNKNOWN whether Ringkasan is computed from the .realm backup or the separate
                       daily loka-YYYY-MM-DD.json export (ADR-0003 §1 names both; SPEC.md's own
                       phrasing — "dihitung dari export POS Loka harian" — reads more naturally as the
                       daily JSON, not the full .realm snapshot, but this is not confirmed by any code)
Financial Baseline:    N/A — an ongoing operational figure, not a baseline concept
```

- **Current Status:** Unknown
- **Confidence:** Low
- **Evidence:** `SPEC.md`'s Ringkasan field documentation (`hariIni: {omzet, laba, trx}`); `reports/dashboard-reconciliation-audit.md`'s finding that the latest `.realm` backup contains zero 31 July invoices and only a partial 30 July.
- **Root Cause (if incorrect):** If this card is fed by the `.realm` backup rather than the daily JSON export, it would be at least one day stale — directly demonstrated by the backup's own date range in the reconciliation audit.
- **Recommended Fix:** Confirm, against the actual live Code.gs (not available here), which file `Ringkasan` is computed from and on what schedule. This single fact resolves the ambiguity for every other Ringkasan-derived card below, not just this one.

---

## 2. Gross Profit

```
Dashboard Card:        Target-progress card, pre-patch labeled "Tercapai" (achieved)
Apps Script Function:  dashboard() — the `target:` block, both pre- and post-patch versions
                       directly quoted in PATCH-01
Google Sheet:          Ringkasan (loka.bulanIni.laba) + Target (Rp20,000,000 comparison figure)
Formula:               CONFIRMED, directly quoted: "_olahLoka [menjumlahkan] i.profit per invoice"
Canonical Dataset:     enterprise-data/canonical/sales.md / summary.md (the latter not yet built)
Canonical Entity:      Invoice.invoiceProfit
Original Loka Entity:  Invoice
Original Realm Field:  Invoice.profit (confirmed present; stored as a string in the Realm schema,
                       parsed to a number by prototype/loka-canonical-poc/src/normalize.js)
Financial Baseline:    N/A directly, but the 7.21% margin independently computed in the
                       reconciliation audit matches this repo's separately recorded July figures
```

- **Current Status:** **Working** as arithmetic, **Broken** as a dashboard card — the number itself is right; what it's compared against and labeled as is wrong.
- **Confidence:** High. This is one of only two metrics in this audit with directly quoted source code AND an independent, matching computation (Rp14,838,116 / 7.21% margin, computed two ways in the reconciliation audit to the cent).
- **Root Cause:** `loka.bulanIni.laba` is gross profit (price minus cost of goods), quoted directly in PATCH-01. It was displayed labeled `tercapai` ("achieved") against the `Target` sheet's Rp20,000,000/month figure, which is understood as a **net** profit target — producing a "73% achieved" reading in a month whose real net position (recorded elsewhere in this repo) was **minus** Rp1.4 million.
- **Recommended Fix:** Confirm whether Patch 1C (documented in `PATCH-01-performa-dan-dashboard.md`) has been deployed. If not, deploy and test it — it already contains the relabeling logic (`labaKotorBulan`) and a guard (`labaBersihBisaDihitung`) that refuses to show a net figure while expenses are untracked.

---

## 3. Transaction Count

```
Dashboard Card:        Likely `bulanIni.trx` or `hariIni.trx`
Apps Script Function:  dashboard() — presumed, not quoted
Google Sheet:          Ringkasan
Formula:               UNKNOWN — whether CANCELLED/PENDING invoices are excluded is not documented
Canonical Dataset:     enterprise-data/canonical/sales.md
Canonical Entity:      Invoice (count)
Original Loka Entity:  Invoice
Original Realm Field:  Invoice.id, Invoice.status
Financial Baseline:    N/A
```

- **Current Status:** Unknown
- **Confidence:** Low
- **Evidence:** `SPEC.md`'s Ringkasan field list; the reconciliation audit's own raw count from the backup (481 total: 476 PAID, 4 CANCELLED, 1 PENDING) — offered as an independent reference figure, not an observed dashboard value.
- **Root Cause:** Not established either way.
- **Recommended Fix:** Confirm the counting rule against live code — specifically whether CANCELLED/PENDING invoices inflate this figure by up to 5 transactions.

---

## 4. Cash in Hand

```
Dashboard Card:        Likely "Kas Kasir" (till)
Apps Script Function:  dashboard() reads the Tutup Shift sheet in full (22 columns, confirmed
                       in PATCH-01's own performance table); the specific rendering line for
                       this card is UNKNOWN. The related dataShift() fragment IS quoted.
Google Sheet:          Tutup Shift (per SPEC.md's 22-column list, includes "Kas Kasir")
Formula:               CONFIRMED fragment: kasAwal = Number(data[i][5]) || 0 — index 5 =
                       Kas Kasir ONLY (quoted directly in PATCH-01)
Canonical Dataset:     No real path exists — Buku Toko's Tutup Shift "Kas Kasir" is manually
                       entered by the cashier, not derived from Loka at all
Canonical Entity:      N/A. Note: Loka's own Shift entity exists in the canonical prototype,
                       but per canonical-data-contract-v1.md this is an explicitly DIFFERENT,
                       unreconciled system from Buku Toko's Tutup Shift sheet — not the same data
Original Loka Entity:  N/A for this specific figure
Original Realm Field:  N/A
Financial Baseline:    Rp4,298,500 ("Laci kasir"), 02_MODAL_UANG!D7, as of 31 July —
                       a one-time physical count, not the live running figure
```

- **Current Status:** **Broken** — the confirmed `kasAwal` asymmetry (see Root Cause) means any *variance/selisih* calculated from this chain is unreliable when brankas cash carries over between days. The raw entered "Kas Kasir" number itself is a manual value, not miscalculated on its own.
- **Confidence:** High for the bug's existence and mechanism (directly quoted code plus a real, cited historical case — the 27 July +Rp2,101,810 anomaly). Low for what the live dashboard currently displays.
- **Evidence:** PATCH-01's "Konfirmasi: bug `kasAwal`" section, quoted verbatim; `SPEC-tutup-shift-v2.md`'s three-day real data table (27–29 July).
- **Root Cause:** `kasAwal` only carries forward Kas Kasir; `sisa` (the actual/nyata figure) includes both Kas Kasir **and** Kas Tunai (brankas). Quoted directly: *"`sisa` menghitung brankas. `kasAwal` tidak. Asimetris."*
- **Recommended Fix:** `TutupShiftV2.gs` already contains the fix (`ambilSaldoBrankasAwal()`, `hitungTutupShift()`) but is explicitly marked untested in its own header comment. Run `ujiTutupShiftV2()`, then follow the file's documented install order (`migrasiTambahKolomV2()` → `setSaldoBrankasAwalManual()` with a real physical count → connect to the live form) before trusting this card again.

---

## 5. Safe Cash

```
Dashboard Card:        Likely "Saldo Brankas" / "Kas Tunai"
Apps Script Function:  Same as Cash in Hand — dataShift() / simpanTutupShift(), quoted in PATCH-01
Google Sheet:          Tutup Shift ("Kas Tunai" column)
Formula:               Same asymmetric kasAwal/sisa bug — CONFIRMED
Canonical Dataset:     No real path exists (same reasoning as Cash in Hand)
Canonical Entity:      N/A (Loka's Shift.cashInHand is a different, unreconciled figure —
                       most recent value in canonical.json: Rp1,368,050 for the 29→30 July shift)
Original Loka Entity:  N/A for this figure
Original Realm Field:  N/A
Financial Baseline:    Rp2,300,000 ("Brankas toko"), 02_MODAL_UANG!D6, as of 31 July
```

- **Current Status:** **Broken** — same root cause as Cash in Hand, and this is the more consequential of the two: it is exactly this column's ambiguous meaning that produced the Rp5.8 million open question documented in `SPEC-tutup-shift-v2.md`.
- **Confidence:** High for the bug; Low for current live display.
- **Evidence:** Same as Cash in Hand, plus `SPEC-tutup-shift-v2.md`'s two-interpretation analysis (saldo vs. arus) of the "Kas Tunai" column.
- **Root Cause:** Identical to Cash in Hand.
- **Recommended Fix:** Identical to Cash in Hand. Additionally: do not substitute Loka's `Shift.cashInHand` for this figure — it is a parallel, unreconciled system (Canonical Data Contract §4), not a fallback source.

---

## 6. Inventory Value

```
Dashboard Card:        Likely "Nilai Stok"
Apps Script Function:  UNKNOWN — SPEC.md's documented Ringkasan fields do NOT include a total
                       inventory value field (only `nilaiStokMati`, dead-stock value specifically).
                       If this card exists, its source is not established by any document read.
Google Sheet:          UNKNOWN (possibly Ringkasan, possibly computed elsewhere in dashboard())
Formula:               UNKNOWN
Canonical Dataset:     enterprise-data/canonical/inventory.md (conceptually)
Canonical Entity:      Product (stock × capitalPrice)
Original Loka Entity:  Product
Original Realm Field:  Product.stock, Product.capitalPrice
Financial Baseline:    Rp121,375,878.80 (01_MODAL_BARANG!G54, physical count, 31 July)
```

- **Current Status:** Unknown for the dashboard card itself. **Working** for the underlying data comparison — both figures were independently computed in the reconciliation audit: Rp109,405,977.38 (Loka, system-recorded stock) vs. Rp121,375,878.80 (Financial Baseline, physical count).
- **Confidence:** High for both cited figures individually (both directly computed/read); Low for whether a dashboard card actually surfaces either one, since no Ringkasan field for it was found documented.
- **Evidence:** `SPEC.md`'s Ringkasan field list (absence of a total-value field is itself the finding); reconciliation audit's product-by-product comparison (only 15 of 49 baseline items matched Loka's stock exactly; 8 had no name match at all).
- **Root Cause:** Not applicable to the numeric gap (physical-vs-system drift is expected by design) — but if a dashboard card labeled "Inventory Value" exists with no documented source, that itself is a gap worth naming.
- **Recommended Fix:** Confirm whether this card exists at all in the live dashboard, and if so, what it reads. If it reads a stale or undocumented computation, replace it with an explicit reference to either the Loka-derived figure or the baseline figure — never both interchangeably.

---

## 7. Goods Out

```
Dashboard Card:        Likely "Barang Keluar"
Apps Script Function:  dashboard() reads the KELUAR sheet in full (confirmed, PATCH-01's own
                       performance table: "_semuaKeluar() | SELURUH sheet KELUAR")
Google Sheet:          KELUAR — NOTE: SPEC.md (an earlier, reconstructed document) describes a
                       sheet named `Kirim` for the same apparent purpose. Whether `KELUAR` and
                       `Kirim` are the same sheet under two names, or two different things, is
                       UNKNOWN — no document cross-references both names together.
Formula:               UNKNOWN
Canonical Dataset:     NONE EXISTS. No canonical entity in canonical-data-contract-v1.md or
                       enterprise-data/canonical/ covers inter-branch goods distribution. The
                       closest defined entity, `restocks.md`, covers supplier-to-business intake,
                       which is a different direction entirely (in, not out).
Canonical Entity:      N/A — this is a genuine, previously unnoticed gap in the canonical model
Original Loka Entity:  N/A — Loka is a retail POS; it has no concept of inter-branch shipment
Original Realm Field:  N/A
Financial Baseline:    N/A
```

- **Current Status:** Unknown
- **Confidence:** Low
- **Evidence:** PATCH-01's performance table; absence of any matching entity across the entire canonical data set.
- **Root Cause:** N/A — this is a scope gap, not a bug.
- **Recommended Fix:** This metric cannot be reconciled to canonical data because no canonical data model for it exists yet. It needs a new entity defined through the Canonical Data Contract's own additive-versioning process — **not attempted here**, per this task's explicit instruction not to create new canonical theory. Tracked as a backlog item instead (see `implementation-backlog.md`).

---

## 8. Outstanding Receivables

```
Dashboard Card:        Likely "Piutang"
Apps Script Function:  dashboard() — presumed, reading loka.piutangTotal from Ringkasan
Google Sheet:          Ringkasan (SPEC.md confirms `piutang[]` and `piutangTotal` fields exist)
Formula:               UNKNOWN
Canonical Dataset:     enterprise-data/canonical/receivables.md
Canonical Entity:      Receivable — NOT extracted by the current canonical prototype (InvoiceDebt
                       was out of scope for the 8-entity proof of concept)
Original Loka Entity:  InvoiceDebt (per prior research; not re-verified in this task)
Original Realm Field:  UNKNOWN precisely — not extracted or verified by any tooling in this repo
Financial Baseline:    Rp1,734,000 (03_PIUTANG_HUTANG!D37) — with a flagged, unresolved
                       Rp4,500,000 example-styled row excluded from this total (see the
                       reconciliation audit's detailed note on this)
```

- **Current Status:** Unknown
- **Confidence:** Low — half of this metric's lineage (the Loka side) simply has no verified data behind it in this repo's current tooling.
- **Evidence:** `SPEC.md`'s Ringkasan fields; the reconciliation audit's detailed treatment of the excluded Rp4,500,000 row.
- **Root Cause:** N/A confirmed — the gap is an absence of tooling, not a demonstrated error.
- **Recommended Fix:** Extend the canonical prototype's entity list to include `InvoiceDebt`, per the reconciliation audit's own recommendation, before this card can be reconciled at all.

---

## 9. Expenses

```
Dashboard Card:        Feeds the "Beban" figure inside the target-progress warning block
Apps Script Function:  _bebanBulan(bulan) — FULLY quoted in PATCH-01
Google Sheet:          BEBAN (may not exist — function returns 0 if the sheet is missing)
Formula:               CONFIRMED, quoted directly: sums column D (index 3) for rows whose
                       column A date matches the current month
Canonical Dataset:     enterprise-data/canonical/expenses.md
Canonical Entity:      Expense — extracted and proven working in the canonical prototype
Original Loka Entity:  Expense (+ embedded ExpenseItem)
Original Realm Field:  Expense.items[].price (string, parsed), Expense.date
Financial Baseline:    N/A directly for the ongoing monthly figure. The baseline workbook's
                       05_BIAYA_BEP sheet may hold a related fixed-cost figure, but its content
                       was not read or verified as part of this audit — UNKNOWN whether it
                       reconciles with anything here.
```

- **Current Status:** **Broken** — confirmed directly, not inferred.
- **Confidence:** High. Both halves of this finding are independently solid: the code (`_bebanBulan()`) is quoted verbatim, and the real figure it's missing (Rp18,517,444, 45 records, computed directly from `canonical.json`) is independently verified.
- **Evidence:** PATCH-01's quoted code and its own comment (*"Beban operasional belum tercatat sama sekali"* — "operating expenses are not recorded at all"); reconciliation audit's Rp18,517,444 computation from Loka's real `Expense` entity.
- **Root Cause:** `_bebanBulan()` only reads a separate `BEBAN` sheet in Buku Toko and defaults to 0 if it has no matching rows. It never reads Loka's own `Expense` table, which has real, non-trivial data in the same backup this whole platform already processes. The code's own comment asserts the gap is total; it is not.
- **Recommended Fix:** Either wire `_bebanBulan()` (or its successor) to also read Loka's `Expense` data via the canonical layer, or deliberately decide the `BEBAN` sheet is the one intended source and start populating it. Right now, neither is happening.

---

## 10. Net Profit

```
Dashboard Card:        The `labaBersihBisaDihitung` guard + absent net figure (post-patch design)
Apps Script Function:  dashboard()'s `target:` block, quoted directly (proposed version)
Google Sheet:          Ringkasan (gross) + BEBAN (expense) + Target (comparison figure)
Formula:               PARTIALLY confirmed: `labaBersihBisaDihitung: _bebanBulan(bulan) > 0` is
                       quoted directly. The actual net-profit subtraction, if beban were nonzero,
                       is NOT shown in any quoted fragment — presumed to be
                       labaKotorBulan − bebanTercatat, but this is a reasonable inference, not
                       confirmed code, and is labeled as such here rather than stated as fact.
Canonical Dataset:     enterprise-data/canonical/summary.md — the dataset explicitly designed to
                       reconcile Gross Margin, Net Margin, and Invoice Profit, and not yet built
Canonical Entity:      N/A — Summary does not exist as an implemented entity
Original Loka Entity:  Invoice (profit) + Expense
Original Realm Field:  Invoice.profit, Expense.items[].price
Financial Baseline:    N/A directly
```

- **Current Status:** Broken/Unknown — cannot be responsibly computed today, for the same reason Expenses is broken.
- **Confidence:** Medium. The *design intent* (refuse to show a net figure while expenses are untracked) is clearly documented; whether that guard is actually deployed and behaving this way live is unverified.
- **Evidence:** PATCH-01's quoted `target:` block and `_bebanBulan()`.
- **Root Cause:** Directly inherits Expenses' root cause — Net Profit cannot be trusted until Expenses reads real data.
- **Recommended Fix:** Fix Expenses (item 9) first. Once real expense data flows in, confirm the actual net-profit subtraction logic against live code before trusting any number this card shows — that formula is not confirmed anywhere in this repo today.

---

## 11. Stock Alerts

```
Dashboard Card:        Likely tied to Ringkasan's `stokMenipis[]` field ("barang menuju habis" —
                       items running low), which SPEC.md confirms exists
Apps Script Function:  dashboard() — presumed, not quoted
Google Sheet:          Ringkasan
Formula:               UNKNOWN — the threshold logic for "menipis" (low stock) is not documented
Canonical Dataset:     NONE — no canonical entity carries stock-alert data
Canonical Entity:      N/A. This is the prototype's own scope gap: normalize.js's Product mapping
                       never carries stockAlert or expiryAlert fields through, even though Loka's
                       schema has them (per prior research, not re-verified in this task)
Original Loka Entity:  Product (stockAlert, expiryAlert — embedded, per prior research)
Original Realm Field:  Product.stockAlert.threshold, Product.stockAlert.enabled (unverified here)
Financial Baseline:    N/A
```

- **Current Status:** Unknown
- **Confidence:** Low
- **Evidence:** `SPEC.md`'s Ringkasan field list; the prototype's own `normalize.js` (inspectable directly — it does not map either field).
- **Root Cause:** N/A confirmed as a dashboard bug — the gap is in this project's own tooling, not a demonstrated dashboard error.
- **Recommended Fix:** Extend `normalize.js`'s Product mapping to carry `stockAlert`/`expiryAlert` through before this card can be reconciled against real data at all.

---

## Cross-Cutting Findings

1. **Two Loka export files, one unresolved question.** ADR-0003 names both `loka-YYYY-MM-DD.json` and the `.realm` backup as daily Loka exports. Every Ringkasan-fed card in this audit (Today's Revenue, Transaction Count, Outstanding Receivables, Stock Alerts) inherits the same open question: which file does `Ringkasan` actually read? This single unresolved fact is the biggest lever in this entire audit — resolving it clarifies four cards at once.
2. **`KELUAR` vs. `Kirim`.** PATCH-01 (30 July, later) names a sheet `KELUAR`; `SPEC.md` (a reconstruction) describes `Kirim` for what reads like the same purpose. Not confirmed to be the same sheet.
3. **Two of eleven cards have no canonical data path at all** (Goods Out, Stock Alerts) — not because of a bug, but because nothing was ever modeled for them.
4. **Two of eleven cards are confirmed broken with quoted code as evidence** (Cash in Hand / Safe Cash via the `kasAwal` bug; Expenses via `_bebanBulan()`), and a third (Gross Profit's label) is confirmed broken in intent, with live deployment status unverified.
