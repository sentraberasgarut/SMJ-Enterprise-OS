# Dashboard Reconciliation Audit — 31 July 2026

**Goal:** prove that every business number shown on the dashboard can be traced back to the latest Loka backup. This audit does not build anything — it compares numbers already produced against numbers that should exist, and states plainly where that comparison cannot be made.

**Method and hard limits, stated up front:**

- I have **no live access** to the Buku Toko Google Sheet, the deployed `dashboard()` function, or the actual Apps Script project. The repo contains **patch documents and one standalone module** (`apps-script/buku-toko/PATCH-01-performa-dan-dashboard.md`, `apps-script/buku-toko/TutupShiftV2.gs`, `apps-script/buku-toko/SPEC-tutup-shift-v2.md`) — these describe specific functions and quote real historical data, but **do not constitute the full source of the live dashboard**. Both documents explicitly state their own code has never been run by their author. Where I quote this material, it is a documented fact about intended logic, not a confirmed observation of what the dashboard currently displays.
- "Current Dashboard Value" below means: the value a screen reader of this repository's own documentation would expect, given the quoted code. Where no document describes the relevant logic, it is marked **UNKNOWN** — not estimated, not guessed.
- **"Correct Value" is computed directly from real data**, in two ways: (1) programmatically from `prototype/loka-canonical-poc/output/canonical.json`, generated from the actual latest Loka backup (`[1.7.36-v109] loka-stok-backup-30-7-2026.realm`); and (2) read directly from the cached formula values in the official Financial Baseline workbook (`enterprise-data/baseline/2026/2026-07-31-reset/FORM_RESET_TSS_31JULI2026_v2_redesign.xlsx`). Every figure below is traceable to one of these two, cited by cell or field.
- **Critical fact discovered during this audit, affecting every "today" metric:** the latest available backup contains invoices only through **30 July 2026, 10:23 AM** — there is **no 31 July data in this backup at all**, and 30 July's own data is a partial day (only 15 invoices captured, cut off mid-morning). Any dashboard metric described as "today" cannot be sourced from this backup if "today" means 31 July.

---

## Summary Table

| Metric | Current Dashboard Value | Correct Value | Source of Truth | Root Cause | Required Fix | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| **Today's Revenue** | UNKNOWN — no dashboard code read defines this field | **N/A — cannot be computed for 31 Jul from this backup** (30 Jul partial-day revenue = Rp3,831,050, 15 invoices) | Canonical `Invoice.grandTotal`, filtered by date | The backup is stale relative to "today" by at least one full day, and even 30 Jul's own data is incomplete (cut off at 10:23 AM) | Confirm with Ayu what time the backup is normally taken, and whether "Today's Revenue" is meant to come from the daily `loka-YYYY-MM-DD.json` export (per ADR-0003 §1) rather than the `.realm` backup at all — these may be two different files on two different schedules | **High** (the staleness fact is directly measured; the fix recommendation is a question, not an assumption) |
| **Gross Profit** | UNKNOWN as a screen value, but PATCH-01 documents the underlying figure (`loka.bulanIni.laba`) as **mislabeled** "tercapai" against a net-profit target | **Rp14,838,116** for July, PAID invoices only (476 of 481) | `Invoice.invoiceProfit` summed = `Invoice.grandTotal` − `Invoice.capitalSubTotal` summed, exactly (difference is floating-point noise, ~1.5e-8) | None for the arithmetic itself — Loka's own `Invoice.profit` field and independently-computed Revenue-minus-COGS agree exactly in this dataset. The documented problem (PATCH-01) is a **labeling** bug: this gross figure is shown against a label ("tercapai") implying it is net profit measured against the Rp20,000,000/month net target | If Patch 1C has not been deployed, apply it — relabel as "laba kotor," never as "tercapai" against the net target | **High** for the Rp14.84M figure itself (directly computed, and consistent with this repo's own session log recording ~Rp14.9 jt / 7.2% for the same period). **Medium** for whether the mislabeling is still live, since PATCH-01 is undeployed as documented |
| **Transaction Count** | UNKNOWN | **481** invoices total in the backup (476 PAID, 4 CANCELLED, 1 PENDING), spanning 4–30 July | `Invoice` entity count | N/A | Confirm whether "Transaction Count" on the dashboard includes CANCELLED and PENDING invoices — if it does, it overstates real completed sales by up to 5 transactions / Rp2,357,500 | **High** for the raw count; **Unknown** for whether the dashboard's definition matches |
| **Cash in Hand** | UNKNOWN (no live sheet access) | **Rp4,298,500** (`02_MODAL_UANG` row 7, "Laci kasir") as of 31 July baseline | Financial Baseline workbook, `02_MODAL_UANG!D7` | This is a **baseline (one-time) figure**, not a live dashboard read — it cannot be "the" current Cash in Hand for any day after 31 July | Confirm whether "Cash in Hand" on the dashboard reads from Buku Toko's live `Tutup Shift` sheet (Kas Kasir column) or is expected to reconcile to this baseline figure going forward | **High** for the baseline figure as recorded; **Unknown** for what the dashboard currently shows |
| **Safe Cash** | UNKNOWN | **Rp2,300,000** (`02_MODAL_UANG` row 6, "Brankas toko") as of 31 July baseline | Financial Baseline workbook, `02_MODAL_UANG!D6` | Same as above — a baseline snapshot, not a live figure. Separately: Loka's own `Shift.cashInHand` (a different, parallel figure — see Root Cause note below) shows Rp1,368,050 for the most recent recorded shift (29→30 Jul), which is **not the same concept** as "Saldo Brankas" in Buku Toko | Same confirmation as Cash in Hand, plus: do not conflate Loka's `Shift.cashInHand` with Buku Toko's brankas balance — they are two unreconciled systems (Canonical Data Contract §4) | **High** for both cited figures individually; **Unknown** for whether either is what the dashboard displays |
| **Inventory Value** | UNKNOWN | **Two different real figures exist, and they are expected to differ:** Rp121,375,878.80 (Financial Baseline, physical count) vs. Rp109,405,977.38 (computed from Loka: Σ `stock × capitalPrice` across 47 products) | Baseline: `01_MODAL_BARANG!G54`. Loka: canonical `Product` entity | The baseline was **deliberately** a physical count, "counted fresh rather than taken from any system's recorded stock figure" (Products master data) — a difference here is the reset working as designed, not a bug. Product-by-product comparison (below) confirms this: only 15 of 49 baseline line items match Loka's recorded stock exactly | No fix required for the gap itself. Do recommend investigating the 8 baseline items that don't match Loka's product list **by name at all** (listed below) — this is a naming/identity gap, not a quantity gap | **High** — both totals are directly computed/read, and the item-level comparison was run in full |
| **Goods Out** | UNKNOWN | UNKNOWN | Buku Toko `KELUAR` sheet (per PATCH-01, this is one of the sheets `dashboard()` reads) | This data lives entirely in Buku Toko's live Google Sheet, which this audit has no access to. It is not represented anywhere in the Loka backup or canonical output | Obtain read access to the live `KELUAR` sheet, or export it, before this metric can be reconciled at all | **N/A — cannot be assessed** |
| **Outstanding Receivables** | UNKNOWN | Baseline: **Rp1,734,000** (`03_PIUTANG_HUTANG!D37`, real entry: "Sederhana Jaya 1 dan Dapur"). Loka: **not computable from this prototype** — `InvoiceDebt` was not one of the eight entities the canonical prototype extracts | Baseline formula; Loka's `InvoiceDebt` table (62 records per prior research, not re-verified here) | Two separate gaps: (1) this prototype's scope excluded Receivables entirely, so no Loka-side figure exists to compare; (2) a second row in the same sheet ("Sederhana Jaya Cabang Cikajang," Rp4,500,000) is present but excluded from the total — **see flagged anomaly below** | Extend the canonical prototype to extract `InvoiceDebt` before this metric can be reconciled against Loka at all. Separately, confirm the Cikajang row's status | **Low** — half of this metric (the Loka side) is simply not available from current work |
| **Expenses** | UNKNOWN as a screen value, but PATCH-01 states in code comments that "**beban operasional belum tercatat di mana pun**" (operating expenses are not recorded anywhere) | **Rp18,517,444** for July, computed from Loka's own `Expense` entity (45 records, line items summed) | Canonical `Expense` entity | **Direct contradiction, not a rounding issue.** Loka has real, non-trivial expense data (Rp18.5 million for July). The documented dashboard logic (`_bebanBulan()` in PATCH-01) reads a separate `BEBAN` sheet in Buku Toko and returns 0 if that sheet doesn't exist — it does not read Loka's `Expense` table at all. The code's own comment asserts expenses aren't tracked anywhere, which is not true of the data source it could be reading from | Either point `_bebanBulan()` (or its successor) at Loka's `Expense` data, or explicitly decide Buku Toko's `BEBAN` sheet is the intended authoritative source and start populating it — right now, neither is happening, and the code assumes the gap is total when it is not | **High** — the Rp18.5M figure is directly computed; the contradiction with the code comment is a direct textual comparison, not an inference |
| **Net Profit** | UNKNOWN as a screen value, but per PATCH-01's own design intent, **the dashboard should refuse to display a net profit number at all** while `_bebanBulan() === 0` (it sets `labaBersihBisaDihitung: false`) | **UNKNOWN** — cannot be computed responsibly. Gross Profit (Rp14,838,116) minus Loka's own Expense total (Rp18,517,444) would produce a **negative** figure, but subtracting Loka's Expense from Loka's Gross Profit is not something any document specifies as the intended Net Profit formula, and doing so here would be inventing a business rule this audit was told not to invent | N/A directly observed; Expense and Gross Profit entities | If the dashboard is currently showing *any* net profit number, it is being shown against the documented intent of PATCH-01, which explicitly says a net figure must not be presented while expenses are untracked | Confirm whether Patch 1C is deployed. If it is, the dashboard should currently be showing no net-profit number at all — if it is showing one, that is itself a finding. If it is not deployed, the pre-patch dashboard is showing gross profit mislabeled as "tercapai," per the original bug PATCH-01 describes | **Medium** — the design intent is clearly documented; whether it was ever deployed, and what the dashboard shows today, are both unverified |
| **Stock Alerts** | UNKNOWN | **UNKNOWN — not computable from current canonical output.** Loka's schema includes `StockAlert` / `ExpiryAlert` structures on `Product` (per prior research), but this prototype's `normalize.js` does not extract either field | N/A | The canonical prototype's own scope gap — `stockAlert` and `expiryAlert` were never mapped in `normalizeProduct()` | Extend `normalize.js` to carry these fields through before this metric can be reconciled at all | **N/A — cannot be assessed with current tooling** |

---

## Detailed Notes

### 1. Today's Revenue / Transaction Count — the backup is not "today"

The latest invoice timestamp in the 30 July backup is `2026-07-30T10:23:04.714Z`. There are zero invoices dated 31 July. Daily invoice counts for the last six days present in the data:

| Date | Invoices | Revenue (grandTotal sum) |
| --- | --- | --- |
| 2026-07-25 | 25 | Rp9,009,750 |
| 2026-07-26 | 21 | Rp6,804,000 |
| 2026-07-27 | 18 | Rp8,068,190 |
| 2026-07-28 | 10 | Rp10,009,000 |
| 2026-07-29 | 15 | Rp6,143,000 |
| 2026-07-30 | 15 | Rp3,831,050 (partial day — backup cuts off 10:23 AM) |

Any dashboard claiming to show "Today's Revenue" as of 31 July is either reading a different, more current data source (the daily `loka-YYYY-MM-DD.json` export, per ADR-0003 §1, which this audit did not have available to inspect) or is showing stale data without saying so. This distinction — `.realm` backup vs. daily JSON export — matters and should not be assumed to be the same file on the same schedule.

### 2. Gross Profit — the arithmetic is right; the label was the bug

Computed independently three ways from the same 476 PAID July invoices:

- Σ `grandTotal` − Σ `capitalSubTotal` = Rp205,773,703 − Rp190,935,587.11 = **Rp14,838,115.89**
- Σ `Invoice.profit` (Loka's own field) = **Rp14,838,115.89**
- Margin = 14,838,115.89 / 205,773,703 = **7.21%**

These two independent computations of "gross profit" agree to the cent. This is worth stating plainly because ADR-0003 and the Canonical Data Contract both flag Gross Margin, Net Margin, and `Invoice.profit` as three potentially-unreconciled figures — for **this specific pair** (Gross Margin-style calculation vs. `Invoice.profit`), they do not disagree in this dataset. Net Margin (the manually-computed figure referenced elsewhere in this repo) was not available to re-verify in this audit.

This 7.21% figure is also consistent with this repository's own previously-recorded July margin figures (~7.20–7.21%, per earlier session records), which is an independent cross-check in this figure's favor.

The actual documented problem, per PATCH-01, is that this gross figure was being shown on the dashboard labeled as `tercapai` ("achieved") against the Rp20,000,000/month **net** profit target — producing a reading of "73% achieved" when the real net position for July was reported elsewhere in this repo as **minus** Rp1.4 million. PATCH-01 calls this "a correct number with the wrong label," and proposes relabeling it explicitly as `labaKotorBulan`. **Whether this patch has been deployed is unverified** — the document itself says its code has never been run.

### 3. Cash in Hand / Safe Cash — a real policy violation, found directly in the data

The Financial Baseline's physical cash count (`02_MODAL_UANG`) breaks down as:

| Position | Amount |
| --- | --- |
| Brankas toko (safe) | Rp2,300,000 |
| Laci kasir (till) | **Rp4,298,500** |
| Rekening bank | Rp500,000 |
| E-wallet (DANA) | Rp562,500 |
| **Total** | **Rp7,661,000** |

`TutupShiftV2.gs` defines `CFG.BATAS_KAS_KASIR = 300000` — the till (Kas Kasir) is policy-capped at Rp300,000, with any excess required to move to the safe. The baseline's physically-counted till balance, **Rp4,298,500, is more than 14 times this limit.** This is a directly observed fact from the workbook's own cached values, not an inference — whether it reflects a one-time reset-day condition or an ongoing practice is something only Ayu/CEO can confirm, and this audit does not speculate about which.

Separately: Loka's own `Shift` entity carries its own `cashInHand` figure (Rp1,368,050 for the most recently recorded shift, 29→30 July) — this is a **different system tracking a different concept**, per the Canonical Data Contract's documented Shift conflict (Loka's `Shift` table vs. Buku Toko's Tutup Shift sheet, "not unified"). It should not be substituted for either Cash in Hand or Safe Cash without resolving that conflict first.

### 4. Inventory Value — product-level comparison

Comparing all 49 line items in the baseline's `01_MODAL_BARANG` sheet against Loka's 47 canonical Product records, matched by exact name:

- **41 of 49** baseline items matched a Loka product by name.
- Of those 41, **only 15 had an exactly matching stock quantity.** 26 differed — in some cases substantially (e.g. "Panawuan": baseline 1,367.04 vs. Loka 1,653.19; "Sarinah": baseline 625 vs. Loka 470; "Kerupuk Fina": baseline 27 vs. Loka 11).
- **8 baseline items had no exact name match in Loka at all** (e.g. "Beras Panawuan 25KILOGRAM," "Minyak Rose Brand 2l," "Nasi Briyani Umi Pipik 500 gr") — these may be the same products recorded under different names, different units of the same product, or genuinely new/removed items. This audit does not guess which.

**This level of disagreement is expected, not alarming** — the entire purpose of a physical stock count is to catch drift from system-recorded numbers, and the baseline workbook's own instructions say exactly this ("Hitung FISIK, bukan angka sistem"). The finding worth acting on is the **naming gap** (8 unmatched items): without a shared product identifier between the baseline workbook and Loka, this kind of comparison has to rely on name-matching, which is fragile — this is the same Product Authoritative Source conflict already on record in the Canonical Data Contract, now shown concretely rather than abstractly.

### 5. Outstanding Receivables / Payables — the excluded rows are styled, but the content is oddly specific

Both `03_PIUTANG_HUTANG!D37` (Receivables total = Rp1,734,000) and `D73` (Payables total = Rp0) are computed by formulas that exclude the first data row in their respective sections (row 6 for Receivables, row 42 for Payables). Checking the actual cell formatting in the official baseline file:

| Row | Content | Fill / font color / italic |
| --- | --- | --- |
| 6 (excluded) | "Sederhana Jaya Cabang Cikajang," Rp4,500,000, due "05 Agu" | Gray fill, gray italic font — matches this workbook's own documented "example row" style |
| 7 (included) | "Sederhana Jaya 1 dan Dapur," Rp1,734,000 | Blue fill, blue font, not italic — matches the documented "input" style |
| 42 (excluded) | "Supplier beras (nota belum dibayar)," Rp8,500,000, due "10 Agu" | Gray fill, gray italic font — same "example" style |

**Styling says these two rows are intentional examples, correctly excluded — the totals are structurally consistent with the workbook's own design.** But the content in both excluded rows is unusually specific for placeholder text (a named branch, a specific supplier note referencing an actual unpaid invoice, plausible due dates) — a generic example would not typically need this much realistic detail. **This audit does not conclude either way.** It is flagged as a fact worth a direct question to whoever filled in this workbook: are rows 6 and 42 leftover template examples that were never deleted, or real entries that were never given proper (non-example) formatting and a permanent row number? The Rp4,500,000 and Rp8,500,000 at stake are large enough, relative to a Rp130 million balance sheet, to be worth a direct confirmation rather than an assumption in either direction.

### 6. Expenses — the dashboard's own code comment is contradicted by real data

This is the clearest, most directly verifiable mismatch in this audit. PATCH-01 states, in a user-facing warning string embedded in the proposed code: *"Beban operasional belum tercatat sama sekali"* ("operating expenses are not recorded at all"). This is presented as the reason Net Profit cannot be shown.

But Loka's own `Expense` entity contains **45 real records for July, summing to Rp18,517,444** (`Shodaqoh`, and 44 others, each with named items and payment methods). This data exists, in the same backup this whole platform is built around, and the documented dashboard logic does not read it — it only checks a separate `BEBAN` sheet in Buku Toko, and defaults to 0 if that sheet has no matching rows.

This is not a case of "no data exists" — it is a case of "the code looks in the wrong place, and its own comment asserts the search that was never made."

### 7. Customer / Receivables — most "customers" are internal

Not one of the requested metrics directly, but directly relevant to Outstanding Receivables and any future customer-based dashboard number: Loka's `Customer` table has exactly 8 records:

| Name | Phone |
| --- | --- |
| Sederhana Jaya 1 | 082130933995 |
| Sederhana Jaya 2 | 081386341805 |
| Sederhana Jaya 3 | 081564632780 |
| Sederhana Jaya 4 | 081225050305 |
| Sederhana Jaya 5 | 083838639326 |
| Dapur | 082130712216 |
| RUMAH | 082130712216 |
| Papoy | 085321350400 |

Six of these are named Sederhana Jaya branches. Two more ("Dapur," "RUMAH") share an identical phone number with each other and are almost certainly internal, not external customers. **Papoy appears to be the only genuinely external, non-family customer record in the entire Customer table.** Any dashboard figure computed "per customer" or "receivables by customer" that does not separate these two groups is very likely mixing internal transfers with real third-party sales — this is the Branch-as-Customer conflict already named in the Canonical Data Contract, now shown to affect 7 of 8 records, not "at least one" as prior research cautiously phrased it.

---

## Priority: Fix Before Adding Features

In the order this audit found them, ranked by size of business impact and confidence in the finding:

1. **Expenses not read from the source that has them (Rp18.5M gap).** High confidence, directly verified. This single fix un-blocks Net Profit being computable at all.
2. **Kas Kasir policy violation (Rp4.3M vs. a Rp300k limit).** High confidence, directly observed in the baseline. Needs a human explanation, not a code fix, but needs it now.
3. **Gross-vs-net mislabeling on the dashboard (Patch 1C).** High confidence the bug was real; unverified whether it's been fixed.
4. **Confirm the status of the two example-styled rows worth Rp13M combined (Piutang Cikajang + Hutang supplier beras).**
5. **Extend the canonical prototype to cover Receivables (`InvoiceDebt`) and stock alert fields** — both are currently unreconcilable simply because nothing reads them yet, not because of any discovered error.
6. **Clarify whether "Today's Revenue" is meant to come from the `.realm` backup or the separate daily JSON export** — right now neither this audit nor, apparently, the dashboard's own documentation draws this line clearly.

No new features should be built on top of the dashboard's current numbers until items 1–3 are resolved — they affect Net Profit, Cash custody compliance, and the single most business-visible metric (progress against the monthly target) respectively.
