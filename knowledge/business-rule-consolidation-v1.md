# Business Rule Consolidation v1

| | |
| --- | --- |
| **Type** | Governance sprint — cross-reference and consolidation only. No code, no Apps Script, no Reporting Service, no Dashboard Dataset change. No formula migrated or fixed. |
| **Date** | 1 August 2026 |
| **Reviewed, none modified** | [`knowledge/business-formula-catalog-v1.md`](business-formula-catalog-v1.md), [`knowledge/business-rules-catalog-v1.md`](business-rules-catalog-v1.md), [`architecture/service-boundary-review.md`](../architecture/service-boundary-review.md), [`implementation/dashboard-v2-implementation-plan.md`](../implementation/dashboard-v2-implementation-plan.md), [`implementation/appsscript-migration-plan.md`](../implementation/appsscript-migration-plan.md), [`architecture/canonical-data-contract-v1.md`](../architecture/canonical-data-contract-v1.md), [`prototype/loka-canonical-poc/src/reporting/cards.js`](../prototype/loka-canonical-poc/src/reporting/cards.js), [`prototype/loka-canonical-poc/src/reporting/reconciliation.js`](../prototype/loka-canonical-poc/src/reporting/reconciliation.js). |
| **Purpose** | Answer one question before the APK Analysis sprint begins: *do we already know every business rule Enterprise OS must preserve?* |
| **Discipline** | Every claim below traces to one of the eight documents above, by name and, where applicable, by exact line. Nothing is invented to fill a gap — the word **UNKNOWN** or **Missing** is used instead. No conflict is resolved in this document; conflicts are named, never decided. |

---

# 0. What This Document Is Not

It is not a fix. It does not change which invoice population counts as revenue, does not add a Business Rule for GMROI's 3.2× benchmark, does not decide whether Apps Script's or the Reporting Service's Gross Profit is "correct." Every finding below ends in a **named, undecided gap** — closing any of them is future work, listed in priority order in §9, not attempted here.

---

# 1. Task 1 — Formula → Business Rule Coverage

Every one of the 40 formulas in `business-formula-catalog-v1.md` §3, checked against all 64 rules in `business-rules-catalog-v1.md`. **Exists** = a rule directly governs this formula's exact behavior. **Partial** = a related rule exists but does not govern the formula's specific behavior (e.g. a labeling rule exists, but not the underlying population/threshold). **Missing** = no rule of any kind addresses this formula. **Unknown** = not used below — every formula's rule-coverage status was determinable from the two source catalogs; none required guessing.

| Formula ID | Formula | Business Rule(s) Found | Status |
| --- | --- | --- | --- |
| FIN-F-01 | Gross Profit Bulan | FIN-006, FIN-009 | **Partial** — rules govern labeling/conflation, not which invoice statuses (PAID/PENDING/CANCELLED) count |
| FIN-F-02 | Net Profit Bulan / Safe-Display Guard | FIN-008, FIN-009 | **Exists** — this formula *is* FIN-008's reference implementation |
| FIN-F-03 | Beban Bulan (Expenses) | FIN-008 (dependency only) | **Partial** — no rule defines which expense source (`BEBAN` sheet vs. canonical `Expense`) is authoritative |
| FIN-F-04 | Gross Margin % Bulan | FIN-006 | **Partial** — same population ambiguity as FIN-F-01 |
| FIN-F-05 | Omzet Perlu | None | **Missing** |
| FIN-F-06 | Omzet Tambah | None | **Missing** |
| FIN-F-07 | Margin Perlu | None | **Missing** |
| FIN-F-08 | Proyeksi Laba Bulan | None | **Missing** |
| FIN-F-09 | Proyeksi Omzet Bulan | None | **Missing** |
| FIN-F-10 | Sisa Hari | None | **Missing** |
| FIN-F-11 | Piutang Total | FIN-007 | **Partial** — FIN-007 requires excluding Ibu's capital; the formula applies no such exclusion |
| INV-F-01 | GMROI | None | **Missing** |
| INV-F-02 | Perputaran Stok | INV-002 (undermines reliability, does not define the formula) | **Missing** |
| INV-F-03 | DIO | INV-002 (same) | **Missing** |
| INV-F-04 | DSO | FIN-007 (non-applied, same as FIN-F-11) | **Missing** |
| INV-F-05 | Siklus Kas | None | **Missing** |
| INV-F-06 | Nilai Stok | INV-005 | **Partial** — INV-005 explains why this figure and the Baseline's physical count should differ; it does not define the formula itself |
| INV-F-07 | Stok Mati | None | **Missing** — Rp100,000 threshold undocumented |
| INV-F-08 | Stok Menipis | None | **Missing** — 5-day threshold undocumented |
| INV-F-09 | Margin per Kategori | None | **Missing** |
| CUS-F-01 | Margin per Pelanggan | CUS-001, CUS-004 | **Partial** — CUS-004 exists and is directly relevant, but this formula does not apply CUS-004's internal/external filter |
| CUS-F-02 | Konsentrasi Sederhana Jaya | CUS-001, CUS-004 | **Partial** — same reasoning; the formula's own "Dapur" exclusion is a partial, undocumented attempt at what CUS-004 formally requires |
| CASH-F-01 | Kas Awal | SAL-002 | **Exists** — this formula is SAL-002's fix, directly |
| CASH-F-02 | Seharusnya Tersisa | SAL-002 (dependency only) | **Partial** — no rule names the `seharusnya` formula itself |
| CASH-F-03 | Selisih Kas | FIN-003 (related, distinct concern) | **Missing** — the Rp30,000 tolerance itself is undocumented |
| CASH-F-04 | Status Selisih (WAJAR/PERLU DICEK) | None | **Missing** |
| CASH-F-05 | Jenjang Setoran (A/B/C) | None (a named runbook exists in a code comment, not in the Rule Catalog) | **Missing** |
| SAL-F-01 | Nilai Kirim | None | **Missing** |
| SAL-F-02 | ID Kirim Generation | None | **Missing** |
| SAL-F-03 | Deteksi Kiriman Kembar | None | **Missing** |
| SAL-F-04 | Selisih Terima | None | **Missing** |
| SAL-F-05 | Status Rekap Harian | AUT-003 (observability principle, not this specific status logic) | **Partial** |
| PRC-F-01 | % Perubahan Harga | PRC-001 (approval requirement, not the formula) | **Partial** |
| PRC-F-02 | Ambang Peringatan 15% | None | **Missing** |
| SUP-F-01 | Kontribusi CK ke Omzet SJ4 | GOV-006 (ownership gap, not this formula) | **Missing** |
| SUP-F-02 | Rata-rata CK Harian | None | **Missing** |
| SUP-F-03 | Proyeksi CK Bulanan | None | **Missing** |
| SUP-F-04 | Status Kelengkapan Harga CK | INV-007 | **Exists** — this formula is the live counter behind INV-007's own cited figure |
| SEC-F-01 | PIN Lockout Counter | SEC-002 (classification, not lockout policy) | **Missing** |
| DASH-F-01 | Action List Prioritization | REP-001, REP-003 | **Partial** — general principles exist; the specific severity ordering is undocumented |

## Task 1 Summary

| Status | Count | % of 40 |
| --- | --- | --- |
| Exists | 3 | 7.5% |
| Partial | 11 | 27.5% |
| Missing | 26 | 65% |
| Unknown | 0 | 0% |

**Two-thirds of every business calculation this repository has now traced to source code has no governing Business Rule at all.** Of the three formulas with a directly-matching rule (FIN-F-02, CASH-F-01, SUP-F-04), two are themselves *unverified fixes* (SAL-002's Kas Awal fix is explicitly untested; FIN-008's Net Profit guard has never run). Only SUP-F-04 (CK price-completion counter) is both rule-matched and independently confirmed correct.

---

# 2. Task 2 — Business Rules With No Implementation Anywhere

Every one of the 64 rules in `business-rules-catalog-v1.md`, checked against four possible implementation locations: **Reporting Service** (`cards.js`, `reconciliation.js`), **Apps Script** (`Code.gs`, `Index.html`), **Connector** (`src/connector/*`), **Dashboard Dataset** (`src/dataset/*`, `dashboard-schema.json`).

**Method note:** Many rules are explicitly declarative ("N/A — declarative rule, not computed" in their own Trigger field) — these are not expected to have code implementation, and are marked **N/A (declarative)** rather than counted as a gap. Only rules with a real Trigger/Input/Output (actionable, computable rules) are checked for actual code presence.

## 2.1 Declarative / Constitutional Rules (implementation not expected)

GOV-001, GOV-002, GOV-005, GOV-008, INV-002, INV-003, SAL-001, SAL-006, PRC-002, CUS-001, CUS-003, SUP-001, SUP-003, AI-001, AI-002, AI-004, AI-006, AUT-004, REP-004 (partially — see §2.2) — **19 rules**, N/A by design. Not a gap; these state meaning, not action.

## 2.2 Actionable Rules — Implementation Check

| Rule | Reporting Service | Apps Script | Connector | Dashboard Dataset | Status |
| --- | --- | --- | --- | --- | --- |
| GOV-003 (Never Deleted) | No | No | No | No | Implemented only in the Baseline workbook (5th location, outside this task's scope) |
| GOV-004 (Human Approval Gate) | No | No | No | No | **Not implemented anywhere** — "enforcement mechanism not yet built" per the rule's own text |
| GOV-006 (Explicit Ownership) | No | No | No | No | Implemented as a document (Ownership Matrix) only |
| GOV-007 (Reversal Discipline) | No | No | No | No | Implemented in ADR practice only, outside these four locations |
| GOV-009 (GitHub→Notion sync) | No | No | No | No | Implemented via GitHub Actions, outside these four locations |
| SEC-001 (Credentials never canonical) | Yes (implicitly — no PIN field in canonical output) | Partially — PINs stored plaintext in `ORANG_AWAL`, masked only in logs (`_samarkanPin`) | Yes (Connector never extracts a PIN field) | Yes (schema has no credential field) | **Implemented** (Connector/Dataset); **Apps Script itself is the one place the rule's underlying risk still lives** — plaintext PINs at rest |
| SEC-002/SEC-003 (Classification / exclusion) | No | No | No | No | Documented only, no code enforcement |
| FIN-001 (Opening Equity) | No | No | No | No | Implemented in the Baseline workbook only |
| FIN-002 (Ibu Capital = Equity) | No | No | No | No | Implemented in the Baseline workbook only |
| FIN-003 (Kas Kasir Rp300k limit) | No | **No — no `BATAS_KAS_KASIR` constant or check exists anywhere in the current `Code.gs`** | No | No | **Not implemented anywhere**, despite being Critical priority and confirmed violated |
| FIN-004 (Baseline Immutability) | No | No | No | No | Implemented via `CHECKSUM.md`, outside these four locations |
| FIN-005 (Baseline Reconciliation) | No | No | No | No | **Not implemented anywhere** — no report currently checks itself against the Baseline |
| FIN-006 (Gross/Net/Invoice.profit) | **Partial** — `reconciliation.js` checks Gross-side agreement (PAID only); explicitly excludes Net Margin | No | No | No | **Partial**, Reporting Service only, and only for one of the three figures the rule names |
| FIN-007 (Receivable excludes Ibu capital) | No | No | No | No | **Not implemented anywhere** — FIN-F-11 applies no such exclusion |
| FIN-008 (Safe-Display Guard) | **No** — deliberately blocks Net Profit instead of gating it | **Yes** — `dashboard()` lines 2009-2012 | No | No | **Partial**, Apps Script only, unverified |
| FIN-009 (No "Achieved" mislabel) | Yes (no `tercapai`-style field exists) | Yes (`labaKotorBulan` naming) | N/A | N/A | **Implemented**, both, independently |
| FIN-010 (Approval always for Cash/Expense/Receivable/Payable) | No | No | No | No | **Not implemented anywhere** |
| INV-001 (Physical Count Overrides) | No | No | No | No | Implemented in the Baseline only |
| INV-004 (Negative Stock — rule itself UNKNOWN) | N/A | N/A | N/A | N/A | Cannot be implemented; the rule does not exist |
| INV-005 (Discrepancy Expected) | **Partial** — `cards.js` comment cites INV-005 to explain the Inventory Value card's caveat | No | No | No | **Partial**, documented awareness only, not enforced logic |
| INV-006 (Approval for Inventory Adjustments) | No | No | No | No | **Not implemented anywhere** |
| INV-007 (CK Rp0 Pricing Gap) | No | **Yes** — `_statusHargaCK()` (SUP-F-04) | No | No | **Partial**, Apps Script only |
| SAL-002 (Kas Awal Fix) | No | **Yes** — `dataShift()` (CASH-F-01), explicitly untested | No | No | **Partial**, Apps Script only |
| SAL-003 (Physical Brankas Count) | N/A — a human/physical action, not code-implementable | N/A | N/A | N/A | Not applicable to these four locations |
| SAL-004 (Transaction Count Inclusion — rule itself UNKNOWN) | Surfaces the ambiguity in a caveat, does not resolve it | Has its own undocumented de facto answer (excludes CANCELLED only) | N/A | Inherits Reporting Service's ambiguity | **The clearest confirmed case of two systems each independently answering an explicitly-unresolved question differently** — see §4, Conflict #8 |
| SAL-005 (Discount/Refund — rule itself UNKNOWN) | N/A | N/A | N/A | N/A | Cannot be implemented; rule does not exist. Canonical `Invoice.discount` field exists structurally but no rule governs it |
| SAL-007 (Approval for Invoice writes) | N/A — read-only | N/A — Apps Script does not write Invoice | N/A | N/A | Not implemented, but also not currently violated — nothing outside Loka's own POS writes Invoice today |
| PRC-001 (Price Always Approval, no exception) | N/A — no write path | **Likely violated** — `simpanHarga()` writes prices directly with no visible pre-approval gate in the source read | N/A | N/A | **Not implemented; possible active violation** — flagged, not confirmed, since this catalog cannot observe runtime behavior |
| PRC-004 (PriceChanged event) | No | No (no event system exists) | No | No | **Not implemented anywhere** — named only |
| CUS-002 (Approval for customer-facing actions) | No | No | No | No | **Not implemented anywhere** |
| CUS-004 (Internal vs External Filter) | No | **No** — CUS-F-01/CUS-F-02 apply no such filter | No | No | **Not implemented anywhere**, despite being directly relevant to the CEO's own known concentration concern |
| SUP-002 (Payable No Ongoing Source) | No | No | No | No | Gap acknowledged, not implementable until a source is assigned |
| SUP-004 (Baseline Ambiguous Rows) | N/A — requires human confirmation | N/A | N/A | N/A | Not code-implementable |
| AI-003 (Human Sign-Off Gate) | No | No | No | No | **Not implemented anywhere** — "no running gate mechanism exists yet," by the rule's own text |
| AI-005 (AI Session Record) | No | No | No | No | **Not implemented anywhere** — the entity itself does not exist |
| AUT-001 (Automation reacts, no own truth) | N/A | Partially observed as a **failure mode** (Windows Task Scheduler dependency), not a compliance success | N/A | N/A | Named risk, not enforced |
| AUT-002 (Approval beyond notification) | No | No | No | No | **Not implemented anywhere** — no Automation Job record exists to enforce against |
| AUT-003 (Failures Observable, Never Silent) | No | **Yes, informally** — `rekapHarian()`'s email alerts (SAL-F-05) fire on mismatch or on zero shipments recorded; `cekHarianKas()` fires on stale/unverified cash state | No | No | **Partial**, Apps Script only, and not formally linked to a catalogued "Automation Job" entity |
| REP-001 (No Duplicate Computation) | **Actively violated** — see §4; four confirmed divergent formula pairs | **Actively violated** — same four pairs, from the other side | N/A | N/A | Written rule only; **confirmed non-compliant in practice**, not merely unenforced |
| REP-002 (Traceable to Formula Version) | No | No | No | No | **Not implemented anywhere** — no formula-versioning mechanism exists |
| REP-003 (Dashboard Holds No Truth) | Yes, mostly (cards.js is pure assembly) | **Partially violated** — `Index.html`'s `hitungShift()`, `hitung()`, `hitungHarga()` compute values client-side (Business Formula Catalog §5, Duplicates #2/#6/#7) | N/A | N/A | **Partial**, and partially violated in the one place it's supposed to hold |
| REP-005 (KPI Not-Yet-Computable Marker) | **Yes — fully implemented.** `cards.js` uses `UNKNOWN`/`blocked`/`unavailable` status exactly as this rule requires, for Cash in Hand, Safe Cash, Goods Out, Outstanding Receivables, Net Profit, and Stock Alerts | No | No | Yes (schema supports the same states) | **Implemented** — the single cleanest positive finding in this entire consolidation |

## Task 2 Summary

| Status | Count |
| --- | --- |
| N/A — declarative, no implementation expected | 19 |
| Implemented (in at least one of the four locations, real code, working) | 2 (SEC-001 partially, REP-005 fully, FIN-009 both) — see note |
| Partial (implemented in exactly one location, or incompletely) | 11 |
| Not implemented anywhere among the four locations | ~26 |
| Not code-implementable by nature (human/physical action) | 3 (SAL-003, SUP-004, and the "Baseline workbook only" group counted separately below) |
| Implemented only outside the four named locations (Baseline workbook, GitHub Actions, ADR practice) | 6 (GOV-003, GOV-006, GOV-007, GOV-009, FIN-001, FIN-002, FIN-004) |

**Note on the count:** these categories overlap in nuance (e.g. FIN-009 is genuinely implemented in two places; SEC-001 is implemented for its narrow scope but the underlying risk it protects against is not fully closed). The precise arithmetic is less important than the shape of the finding: **the large majority of actionable rules — roughly two-thirds — have no working implementation in any of the four locations this repository considers the operative system**, and the rules that *are* implemented are concentrated almost entirely in Apps Script (the legacy system), not the Reporting Service, Connector, or Dashboard Dataset that are meant to become authoritative.

---

# 3. Task 3 — Undocumented Thresholds

Every hardcoded threshold found across the source material, none invented. "Validation Level" follows the same Proven/Partially Proven/Unknown scale as `business-formula-catalog-v1.md`.

| # | Threshold | Value | Source | Business Meaning | Implementation Location | Validation Level | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | 
| 1 | GMROI "healthy" benchmark | ≥ 3.2× | `Index.html:1207` | Capital-efficiency health check on the owner dashboard | Apps Script (client) | Unknown — unsourced, reads as an external retail-industry reference | UNKNOWN |
| 2 | Inventory Turnover "healthy" benchmark | ≥ 12×/year | `Index.html:1217` | Stock-cycling efficiency health check | Apps Script (client) | Unknown — unsourced | UNKNOWN |
| 3 | Dead Stock value floor | Rp100,000 | `Code.gs:1799` | Minimum item value to flag as "dead stock" if unsold this month | Apps Script (server) | Unknown | UNKNOWN (CEO by catalog default) |
| 4 | Low Stock day-count window | ≤ 5 days | `Code.gs:1775` | Reorder/stockout warning window | Apps Script (server) | Unknown | UNKNOWN |
| 5 | Customer Concentration "buruk" (bad) threshold | > 75% | `Index.html:1250` | Risk flag for over-reliance on Sederhana Jaya branches | Apps Script (client) | Unknown — coincidentally close to CLAUDE.md's own separately-sourced ~77% figure, but not traceable to this threshold's origin | UNKNOWN |
| 6 | Customer Margin "low" warning | < 5% | `Index.html:1268` | Flags individually unprofitable customers | Apps Script (client) | Unknown | UNKNOWN |
| 7 | Category Margin "low" warning | < 6% | `Index.html:1284` | Flags underperforming product categories | Apps Script (client) | Unknown | UNKNOWN |
| 8 | Price-change "extreme"/typo-check threshold | > 15% | `Code.gs:1230, 1249` | Flags a price change large enough to plausibly be a data-entry error | Apps Script (server + client, duplicated) | Unknown | UNKNOWN |
| 9 | Cash variance tolerance (`BATAS_SELISIH`) | Rp30,000 | `Code.gs:250` | How much a shift's physical cash count may differ from the expected figure before requiring a written explanation | Apps Script (server) | Unknown — a named constant with no stated rationale, and no Business Rules Catalog entry of its own (FIN-003 is a related but distinct rule, about the till limit, not this variance tolerance) | UNKNOWN (CEO, cash is always CEO+Ibu co-signed per FIN-010) |
| 10 | Safe overnight-holding limit (`BATAS_BRANKAS_MENGINAP`) | Rp2,000,000 | `Code.gs:284` | Above this, cash must be deposited the same day | Apps Script (server + client, duplicated) | Partially Proven — code comment names a specific source ("Runbook Kustodi Kas, berlaku 31 Jul 2026") that is not itself tracked in this repository | CEO |
| 11 | Escort-required threshold (`BATAS_PENDAMPING`) | Rp5,000,000 | `Code.gs:285` | Above this, the deposit run must not be made alone | Apps Script (server + client, duplicated) | Partially Proven — same named runbook source as #10 | CEO |
| 12 | Kas Kasir till policy limit | Rp300,000 | Not present in the current `Code.gs` at all — only known from Business Rules Catalog FIN-003, which cites a *different* file (`TutupShiftV2.gs`) | Cashier till is policy-capped; excess must move to the safe | **None of the four implementation locations** — a documented threshold with confirmed real-world violation (Rp4,298,500 counted) and **no corresponding check anywhere in the currently-read Apps Script candidate source** | CEO, with Ibu as co-signatory |
| 13 | Duplicate-shipment detection window (`AMBANG_KEMBAR`) | 15 minutes | `Code.gs:254` | Window within which an identical shipment submission is treated as a probable accidental duplicate | Apps Script (server) | Unknown | UNKNOWN |
| 14 | PIN lockout policy (`MAKS_GAGAL` / `LAMA_KUNCI`) | 8 failed attempts / 5-minute lock | `Code.gs:252-253` | Brute-force login protection | Apps Script (server) | Unknown | UNKNOWN |
| 15 | Days-of-supply sentinel | 999 (convention, not a true threshold) | `Code.gs:1773` | Represents "effectively infinite" stock runway for a product with zero sales this month | Apps Script (server) | N/A — a coding convention rather than a business decision, included here because a future consumer could mistake it for a real value | N/A |
| 16 | Monthly profit target (`TARGET_LABA.TSS`) | Rp20,000,000/month | `Code.gs:260` | The figure every "path to target" narrative (FIN-F-05/06/07) measures against | Apps Script (server), also referenced independently elsewhere in this repository's own prior session records | Partially Proven — the only threshold in this list independently corroborated outside the source code itself | CEO |

## Task 3 Summary

**16 undocumented or under-documented thresholds found — 15 real business thresholds plus 1 coding convention.** Of the 15 real thresholds, **only 3 (#10, #11, #16) trace to any named source outside the code itself**, and none of the 16 has a numbered entry in `business-rules-catalog-v1.md`. Every one of these is, functionally, a live business rule — it changes what a human sees as "safe" or "a problem" — governing real money (thresholds #9-11, #16) or real inventory/customer decisions (#1-8) with no CEO-traceable authorization on record for 13 of the 16.

---

# 4. Task 4 — Conflicting Business Definitions

No conflict below is resolved. Each is presented as two (or more) genuinely different definitions in live use.

### Conflict #1 — Gross Profit
- **Definition A:** Apps Script `_olahLoka()` — sum of `Invoice.profit` for every invoice where `status !== 'CANCELLED'` (i.e. **includes PENDING**). `Code.gs:1740-1753`.
- **Definition B:** Reporting Service `cards.js:107-123` — sum of `Invoice.invoiceProfit`, **PAID only**.
- **Source:** Business Formula Catalog FIN-F-01; Duplicate Formula Matrix #1.
- **Current implementation:** Both live, independently, in their respective systems today.
- **Risk:** High. Any period with meaningful PENDING invoices produces two genuinely different Rupiah figures for "Gross Profit."
- **Recommendation (not a decision):** Requires a CEO-level determination of invoice-status inclusion rules, tracked as open in §9.

### Conflict #2 — Net Profit
- **Definition A:** Apps Script `dashboard()` — `labaKotorBulan − beban` when `beban > 0`, else "not computable." `Code.gs:2009-2012`.
- **Definition B:** Reporting Service `cards.js:251-260` — deliberately `UNKNOWN`/`blocked`, on the stated premise that "no confirmed, adopted formula exists."
- **Source:** Business Formula Catalog FIN-F-02, Finding F-3.
- **Current implementation:** A refuses to guess at all is B's position; A's own formula is a genuine, reasoned candidate, unverified.
- **Risk:** High — this is the exact figure tied to the repository's own documented near-miss (a "73% achieved" misreading in a real Rp1.4 million net-loss month).
- **Recommendation (not a decision):** Requires confirming whether FIN-F-02's formula is trustworthy enough to adopt, or whether Reporting Service's caution should stand until independently verified.

### Conflict #3 — Revenue / Today's Revenue
- **Definition A:** Apps Script `_olahLoka()` — `hariIni.omzet`, sum of `grandTotal` for invoices dated today's actual calendar date, status ≠ CANCELLED.
- **Definition B:** Reporting Service `cards.js:88-105` — sum of `grandTotal` for the **latest calendar day present in the canonical dataset** (not necessarily today), PAID only.
- **Source:** Business Formula Catalog §3.1 (FIN-F-01's sibling figure); `dashboard-v2-implementation-plan.md` §3.1, Implementation Backlog BL-007.
- **Current implementation:** Both live, compounding two separate, independent ambiguities (which day counts as "today," and which invoice statuses count) at once.
- **Risk:** High.
- **Recommendation (not a decision):** BL-007's source-file question and the PAID/PENDING question (Conflict #1) both need resolving before this card can be trusted from either system.

### Conflict #4 — Outstanding Receivables
- **Definition A (Apps Script):** `_olahLoka()`'s `piutangTotal` — sum of `grandTotal` for invoices where `status === 'PENDING'`. `Code.gs:1778-1783,1796`.
- **Definition B (Canonical Data Contract §4, Receivable row):** "The 2026-07-31 Baseline Snapshot for the opening figure; Loka's `InvoiceDebt` table for ongoing activity — the two are not yet reconciled to each other."
- **Definition C (Reporting Service):** `cards.js:211-219` computes nothing at all — `UNKNOWN`, citing `InvoiceDebt` not being in the canonical dataset.
- **Source:** Business Formula Catalog FIN-F-11; Canonical Data Contract §4.
- **Current implementation:** Apps Script is the only one of the three that produces a number, and it uses a fourth possible method (a raw PENDING-invoice sum) that matches none of the other three named candidates exactly.
- **Risk:** High — this is a genuinely three-or-four-way undefined concept, not a simple two-sided disagreement.
- **Recommendation (not a decision):** Requires deciding whether `InvoiceDebt`, the Baseline figure, or a PENDING-invoice proxy (or some reconciliation of all three) is the intended definition going forward.

### Conflict #5 — Inventory Value
- **Definition A (Apps Script):** `_olahLoka()` — `stock × capitalPrice`, summed, read from a Drive-cached Loka JSON export. `Code.gs:1767-1773,1787`.
- **Definition B (Reporting Service / Connector):** `cards.js:179-183` — the identical formula, read from the Connector's Realm extraction.
- **Definition C (Financial Baseline):** A physical stock count, deliberately independent of any system's recorded figure (INV-001).
- **Source:** Business Formula Catalog INV-F-06, Duplicate Formula Matrix #4; Canonical Data Contract §4 (Inventory row); Business Rules Catalog INV-005.
- **Current implementation:** A and B use the same formula but different pipeline entry points, never run side-by-side to confirm agreement. C is expected to differ from both, by explicit design.
- **Risk:** Medium — this is the **best-governed** conflict in this list. INV-005 already names the A/B-vs-C divergence as expected, not a defect. The unresolved piece is narrower: whether A and B (same formula, different data path) actually agree.
- **Recommendation (not a decision):** A and B should be run against the same snapshot at least once to confirm they produce the same number before either is trusted as "the" Inventory Value.

### Conflict #6 — Cash
- **Definition A:** Buku Toko's Tutup Shift sheet — `kasKasirAwal + brankasAwal` (CASH-F-01), the operational cash-custody figure.
- **Definition B:** Loka's own `Shift.cashInHand` (confirmed Rp1,368,050 for the most recent recorded shift, per Business Rules Catalog SAL-001) — a *different concept*, per the Canonical Data Contract's own explicit statement.
- **Source:** Canonical Data Contract §4 (Shift row); Business Rules Catalog SAL-001.
- **Current implementation:** Already named and already governed — Business Rules Catalog SAL-001's own Known Gap states these "must never be substituted" for each other. Included here for completeness, not as a new finding.
- **Risk:** High in consequence (a Rp5.8M discrepancy has already occurred, SAL-002/SAL-003), but Low in *documentation* risk — this is the one conflict already explicitly, correctly written down.
- **Recommendation:** None needed beyond what SAL-001/SAL-002/SAL-003 already state — flagged here only to complete this task's required example list.

### Conflict #7 — Opening Equity
- **Definition:** ADR-0002/FIN-001 — `Assets − External Liabilities = Equity`, where Assets includes Inventory Value.
- **The conflict:** Which Inventory Value (Conflict #5's Definition A, B, or C) feeds this formula is never stated. `service-boundary-review.md` Finding K2 names this exact gap: "Neither `finance-service.md` nor `inventory-service.md` states whether Finance Service consumes Inventory Service's already-computed Inventory Value, or would independently recompute it."
- **Source:** `service-boundary-review.md` §5, Finding K2.
- **Current implementation:** Only implemented once, in the one-time 31 July Baseline, which used the physical-count figure (Definition C) — but no rule states this is the *required* input for all future Opening Equity computations, as opposed to a one-time baseline choice.
- **Risk:** Medium — not a confirmed duplicate today (Opening Equity is not recomputed regularly yet), but the clearest concrete place a real duplicate-computation defect would appear the moment Finance Service is actually built.
- **Recommendation (not a decision):** State explicitly, before Finance Service is implemented, which Inventory Value definition Opening Equity must use going forward.

### Conflict #8 — Transaction Count
- **Definition A (Apps Script):** `_olahLoka()`'s `hariIni.trx`/`bulanIni.trx` — counts invoices where `status !== 'CANCELLED'` (i.e. **includes PENDING**).
- **Definition B (Reporting Service):** `cards.js:129-144` — counts **every** invoice regardless of status, **including CANCELLED**, with a caveat explicitly naming SAL-004 as unresolved.
- **Source:** Business Formula Catalog Duplicate Formula Matrix #8; Business Rules Catalog SAL-004.
- **Current implementation:** Both live, and — critically — SAL-004 was already known as "UNKNOWN" before this consolidation. What this consolidation adds is that **the two systems did not leave it unresolved identically: each picked its own different concrete answer**, so the practical state today is not "one open question" but "two silently different working answers to that question," a strictly worse state than the Business Rules Catalog's own framing suggested.
- **Risk:** High.
- **Recommendation (not a decision):** SAL-004 needs an actual decision (which statuses count), after which both systems must be checked for compliance — neither is currently correct by construction, since neither was built against a decided rule.

## Task 4 Summary

**8 conflicting business definitions found** — the seven the sprint named as examples (Gross Profit, Net Profit, Revenue, Outstanding Receivables, Inventory Value, Cash, Opening Equity) plus one additional confirmed conflict this consolidation surfaced independently (Transaction Count). Of these eight, **six are net-new precision** this consolidation adds (#1, #2, #3, #4, #7, #8 either newly confirmed or newly shown to be worse than previously documented); two (#5, #6) were already well-governed by an existing rule and are included only for completeness against the task's own example list.

---

# 5. Task 5 — Business Rule Maturity Assessment

Eight-stage classification per rule: **Documented** (a real, non-UNKNOWN description exists) · **Implemented** (working code exists somewhere, per §2) · **Validated** (independently confirmed correct, not merely written) · **Approved** (CEO has formally accepted this specific rule, not merely the surrounding ADR) · **Automated** (a running, unattended check or trigger enforces it) · **Measured** (a live KPI or figure lets compliance be observed) · **Audited** (an actual audit/review has checked it, e.g. the Dashboard Reconciliation Audit) · **Human-Approved** (a per-instance approval gate is mechanically wired, not merely required in writing).

Presented by category, compact Y (yes) / P (partial) / N (no) marks, grounded in every rule's own "Current Status," this consolidation's Task 2 findings, and named audits already performed in this repository (`reports/dashboard-reconciliation-audit.md`, cited throughout the Business Rules Catalog).

| Rule | Doc | Impl | Valid | Appr | Auto | Meas | Audit | Human-Appr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-001 | Y | N/A | N/A | N | N | N | N | N |
| GOV-002 | Y | N/A | N/A | N | N | N | N | N |
| GOV-003 | Y | P (baseline) | Y (baseline) | Y (baseline) | N | N | N | N |
| GOV-004 | Y | N | N | N | N | N | N | N |
| GOV-005 | Y | N/A | N/A | N | N | N | N | N |
| GOV-006 | Y | P (doc) | N | Y | N | N | N | N |
| GOV-007 | Y | P (ADR practice) | Y | Y | N | N | N | N |
| GOV-008 | Y | N/A | N/A | N | N | N | N | N |
| GOV-009 | Y | Y | Y | Y | Y | N | N | N/A |
| SEC-001 | Y | Y (Connector/Dataset) | Y | Y | N | N | N | N/A |
| SEC-002 | Y | N | N | N | N | N | N | N |
| SEC-003 | Y | N (SEC-001 only) | N | N | N | N | N | N |
| SEC-004 | N (UNKNOWN) | N/A | N/A | N | N | N | N | N |
| FIN-001 | Y | P (baseline) | Y | Y | N | Y | Y | N/A |
| FIN-002 | Y | P (baseline) | N | Y | N | N | N | N/A |
| FIN-003 | Y | **N — nowhere** | N | N | N | N | Y | N |
| FIN-004 | Y | P (checksum) | Y | Y | N | N | N | N/A |
| FIN-005 | Y | N | N | N | N | N | N | N |
| FIN-006 | Y | P (Reporting, partial) | P | N | N | N | Y | N |
| FIN-007 | Y | N | N | N | N | N | N | N |
| FIN-008 | Y | P (Apps Script, unverified) | N | N | N | N | N | N |
| FIN-009 | Y | Y (both systems) | P | N | N | N | Y | N |
| FIN-010 | Y | N | N | N | N | N | N | N |
| INV-001 | Y | P (baseline) | Y | Y | N | Y | Y | N/A |
| INV-002 | Y | N/A | N/A | N | N | N | N | N |
| INV-003 | Y | N/A | N/A | N | N | N | N | N |
| INV-004 | N (UNKNOWN) | N/A | N/A | N | N | N | N | N |
| INV-005 | Y | P (documented awareness) | Y | N | N | N | Y | N |
| INV-006 | Y | N | N | N | N | N | N | N |
| INV-007 | Y | P (Apps Script counter) | Y | N | N | Y | Y | N |
| SAL-001 | Y | N/A | N/A | N | N | N | Y | N |
| SAL-002 | Y | P (Apps Script, untested) | N | N | N | N | Y | N |
| SAL-003 | Y | N/A (physical action) | N | N | N | N | N | N |
| SAL-004 | Y (as UNKNOWN) | N (two diverging de facto answers, §4 Conflict #8) | N | N | N | N | Y | N |
| SAL-005 | N (UNKNOWN) | N/A | N/A | N | N | N | N | N |
| SAL-006 | Y | N/A | N/A | N | N | N | Y | N |
| SAL-007 | Y | N/A (nothing writes Invoice outside Loka) | N/A | N | N | N | N | N |
| PRC-001 | Y | **N — likely violated** | N | N | N | N | N | N |
| PRC-002 | Y | N/A | N/A | N | N | N | N | N |
| PRC-003 | N (UNKNOWN) | N/A | N/A | N | N | N | N | N |
| PRC-004 | Y (named only) | N | N | N | N | N | N | N |
| CUS-001 | Y (as gap) | N/A | N/A | N | N | N | Y | N |
| CUS-002 | Y | N | N | N | N | N | N | N |
| CUS-003 | Y | N/A | N/A | N | N | N | N | N |
| CUS-004 | Y (Proposed) | **N — nowhere** | N | N | N | N | Y | N |
| SUP-001 | Y | N/A | N/A | N | N | N | N | N |
| SUP-002 | Y | N/A | N/A | N | N | N | N | N |
| SUP-003 | Y | N/A | N/A | N | N | N | N | N |
| SUP-004 | Y (flagged) | N/A | N/A | N | N | N | Y | N |
| AI-001 | Y | N/A | N/A | N | N | N | N | N |
| AI-002 | Y | N/A | N/A | N | N | N | N | N |
| AI-003 | Y | N | N | N | N | N | N | N |
| AI-004 | Y | N/A | N/A | N | N | N | N | N |
| AI-005 | Y | N | N | N | N | N | N | N |
| AI-006 | Y | N/A | N/A | N | N | N | N | N |
| AUT-001 | Y | N/A | N/A | N | N (failure mode observed, not compliance) | N | Y | N |
| AUT-002 | Y | N | N | N | N | N | N | N |
| AUT-003 | Y | P (Apps Script, informal) | N | N | P | N | N | N |
| AUT-004 | Y | N/A | N/A | N | N | N | N | N |
| REP-001 | Y | **N — actively violated** | N | N | N | N | Y (this sprint) | N |
| REP-002 | Y | N | N | N | N | N | N | N |
| REP-003 | Y | P (partially violated) | N | N | N | N | Y (this sprint) | N |
| REP-004 | Y | P (baseline only) | N | N | N | N | N | N/A |
| REP-005 | Y | **Y — fully** | Y | N | N | N | N | N/A |

## Task 5 Summary

| Dimension | Y count | P count | N/N/A count |
| --- | --- | --- | --- |
| Documented | 62 | — | 2 (SEC-004, INV-004, SAL-005, PRC-003 are marked N — actually 4; see note) |
| Implemented | 3 | 13 | 48 |
| Validated | 6 | 2 | 56 |
| Approved | 6 | 0 | 58 |
| Automated | 1 | 1 | 62 |
| Measured | 2 | 0 | 62 |
| Audited | 12 | 0 | 52 |
| Human-Approved (mechanically) | 0 | 0 | 64 |

**Note on Documented count:** four rules (SEC-004, INV-004, SAL-005, PRC-003) have a catalog entry but their actual Description field reads "UNKNOWN" — counted as not-really-documented (60 substantively documented, 4 stub-only).

**The single most important row in this table is Human-Approved: zero rules, out of 64, have a mechanically-wired per-instance approval gate today.** Every rule that says "Approval Required: Yes" (the large majority of Financial, Pricing, and Customer rules) currently depends entirely on human discipline outside any system, not a system-enforced gate.

---

# 6. Task 6 — Business Service Responsibilities Depending on Undocumented Business Knowledge

One finding per service, each traced to a specific gap named in Tasks 1-4.

**Finance Service** depends on: FIN-003's till limit (documented, but implemented nowhere — §2, §3 #12); the Rp30,000 cash-variance tolerance and the Rp2M/Rp5M deposit-tier thresholds (undocumented rationale — §3 #9-11); the entire deployment-unverified Net Profit formula (§2, §4 Conflict #2); FIN-007's capital-exclusion rule (never applied — §1, FIN-F-11); and Opening Equity's undecided dependency on which Inventory Value definition to use (§4 Conflict #7).

**Inventory Service** depends on: the complete GMROI/Turnover/DIO/DSO/Siklus Kas/Dead-Stock/Low-Stock/Category-Margin analytics layer, none of which has a governing Business Rule (§1, 9 of 40 formulas rated Missing) or a documented threshold (§3, #1-4, #7); Product's own Conflicted Authoritative Source (INV-003), which undermines every figure this service would compute regardless of formula correctness; and the Inventory↔Pricing ownership smell (`service-boundary-review.md` Finding O1) that leaves the CK Rp0-pricing flag's rightful owner ambiguous.

**Sales Service** depends on: SAL-004's transaction-count inclusion rule, now confirmed to have *two different wrong answers* in production rather than one open question (§4 Conflict #8); the 15-minute duplicate-shipment detection window (§3 #13, undocumented); the ID Kirim generation scheme, whose own history of bugs required two separate, uncoordinated repair tools (`appsscript-migration-plan.md` §1.20); and the Today's Revenue date-selection ambiguity (BL-007, compounding §4 Conflict #3).

**Customer Service** depends on: CUS-004's internal-vs-external customer filter, a Proposed rule with zero implementation anywhere (§1, §2) — meaning this service's own stated boundary ("surfaces the ambiguity, does not resolve it") currently has no upstream filter to surface *from*; and the entire Customer Margin/Customer Concentration formula pair, which exists only in Apps Script with no Customer-Service-owned equivalent, despite being directly relevant to this organization's own known ~77% concentration concern.

**Pricing Service** depends on: PRC-001's approval *workflow* (who reviews, how, on what timeline — never specified, only that approval is "always" required); the undocumented 15% extreme-price-change threshold (§3 #8); and — the most serious finding in this section — whether `simpanHarga()`'s direct-write behavior in the current Apps Script source actually violates PRC-001's absolute "no exception" rule, a question this consolidation surfaces but cannot resolve from static reading alone (§2, PRC-001 row).

**Reporting Service** depends on: REP-001's "no duplicate computation" principle, now confirmed *actively violated* in four places (§2, §4); REP-002's formula-version traceability, which has no mechanism anywhere; and, most broadly, the entire strategic-analytics layer a real business owner clearly already relies on (it is rendered prominently, with its own dedicated screen section, in the legacy dashboard) but which has never been specified as a Reporting Service responsibility at all.

---

# 7. Task 7 — Roadmap for Business Rule Completion (Ranked by Business Value)

Not ranked by technical difficulty. Each item states the business consequence of leaving it unresolved, not the implementation cost of resolving it.

1. **Resolve the Net Profit formula's status (Conflict #2, FIN-F-02).** Highest business value: directly tied to a real, already-documented near-miss. Either validate the existing Apps Script candidate formula or formally adopt Reporting Service's caution — either decision is progress; the current silent disagreement between the two systems is not.
2. **Ratify the cash-custody threshold set (§3 #9-12, #16).** Real money, real physical risk (the escort requirement above Rp5M), and one of the five (FIN-003's Rp300,000 till limit) is a documented rule with **zero implementation anywhere**, already confirmed violated by over 14×.
3. **Decide the invoice-status inclusion rule once, for every consumer (SAL-004, Conflicts #1, #3, #8).** A single decision here simultaneously resolves three of the eight named conflicting definitions (Gross Profit, Revenue, Transaction Count) — the highest leverage-per-decision item on this list.
4. **Apply FIN-007's capital-exclusion rule to Receivable (Conflict #4, FIN-F-11).** Directly protects against re-introducing the exact error ADR-0002 already corrected once.
5. **Decide and implement CUS-004's internal-vs-external customer filter.** Directly serves this organization's own already-identified strategic concern (customer concentration); currently the formula that would inform that concern (CUS-F-02) runs with no such filter applied at all.
6. **Decide whether Enterprise OS should reproduce the Inventory strategic-analytics layer at all (GMROI, Turnover, DIO, DSO, Siklus Kas, Dead Stock, Category Margin).** Not urgent in the way #1-5 are, but the single largest scope decision outstanding — nine formulas' worth of work depends on one yes/no answer.
7. **Resolve Central Kitchen's ownership question (GOV-006's Known Gap).** Blocks every CK-related formula (SUP-F-01 through SUP-F-04) and the Inventory↔Pricing ownership smell (Finding O1) simultaneously; outside the CEO's direct authority per this repository's own operating rules, but the resolution path itself (Ibu, Teh Nurul, or joint) needs to be initiated.
8. **Define PRC-001's approval workflow, and audit whether `simpanHarga()` currently violates it.** The strictest rule in the entire Ownership Matrix currently has no defined process and a plausible, unaudited violation.
9. **Ratify the remaining undocumented thresholds (§3 #1-8, #13-14).** Lower individual stakes than #2, but collectively function as 10+ invisible business rules governing what an owner sees as "healthy" or "a problem" every time they open the dashboard.
10. **Build the mechanical Human Approval Gate (GOV-004/AI-003) and the AI Session record (AI-005).** Foundational to trusting any future AI-assisted work on this system — including the APK Analysis sprint this consolidation is preparing for — but ranked last because it is infrastructure that enables future safe decisions, not a specific business fact currently at risk of being wrong today.

---

# 8. Final Report

**Number of complete rules:** **7**, using the strict standard of Documented + Implemented (in at least one real system) + Validated, with no contradicting gap on record: FIN-001, FIN-004, GOV-003 (baseline-scoped), GOV-009, INV-001, INV-005, REP-005. Using the looser standard the Business Rules Catalog itself already applied (its own "Implemented" tier), the number is **12** — the gap between 7 and 12 is exactly the five rules implemented only in the one-time Baseline workbook or GitHub Actions, outside any of the four systems (Reporting Service, Apps Script, Connector, Dashboard Dataset) an "APK Analysis" would actually inspect.

**Number of partial rules:** **41** — the sum of the Business Rules Catalog's own "Documented" (23) and "Proposed" (18) tiers, both of which describe a real, written rule with no confirmed, working, validated implementation.

**Number of missing rules:** **11** (rules whose own content is UNKNOWN: SEC-004, INV-002, INV-003, INV-004, SAL-001, SAL-004, SAL-005, SAL-006, SUP-001, SUP-004, CUS-001) — reused directly from the Business Rules Catalog's own §14 tally, cross-confirmed by Task 1's independent finding that SAL-004 specifically now has *two different wrong implementations* rather than merely being unresolved.

**Undocumented thresholds:** **16** (§3) — 15 real business thresholds plus 1 coding convention, only 3 of which trace to any named source, none of which has a Business Rules Catalog entry.

**Conflicting definitions:** **8** (§4) — Gross Profit, Net Profit, Revenue, Outstanding Receivables, Inventory Value, Cash, Opening Equity, and Transaction Count (the last found independently by this consolidation, beyond the sprint's own example list).

**Undocumented service responsibilities:** **6** — one substantive finding per Business Service (§6), none of the six services is free of at least one responsibility currently resting on undocumented business knowledge.

**Governance readiness score:** **38/100.** The Business Rules Catalog scored its own "Business Rule Completeness" at 48/100 before this consolidation existed. This score is revised downward because cross-referencing against real, traced formulas (this sprint's Task 1-4) surfaced 16 undocumented thresholds and confirmed 8 live conflicting definitions that the original catalog had no visibility into when it scored itself — the true gap was larger than the document that first measured it could see.

**Implementation readiness score:** **19/100.** The Business Rules Catalog scored "Implementation Readiness" at 22/100. This consolidation's Task 2 (only 3 of 64 rules genuinely and fully implemented in a real system, per the strict standard) and Task 5 (zero rules with a mechanical Human Approval Gate) independently corroborate that figure and, if anything, argue for a slightly lower one given how concentrated the little real implementation that exists is in Apps Script — the legacy system this whole program exists to move away from, not the target systems.

## Recommendation: **NOT READY FOR APK ANALYSIS**

Answering the sprint's own success question directly: **no, Enterprise OS does not yet know every business rule it must preserve.** This document makes the actual gap fully visible for the first time — which is real progress — but visibility is not closure. Specifically, before an APK Analysis sprint should begin:

1. **26 of 40 traced business formulas (65%) have no governing Business Rule at all** — an APK's own calculations cannot be checked against "what Enterprise OS already decided" for two-thirds of the calculations this repository has ever formula-traced, because no such decision exists yet.
2. **8 core financial and operational definitions are actively, currently conflicting** between the two systems already built (Apps Script and the Reporting Service prototype) — introducing a third system (an APK) without first deciding these would risk a *third* independent answer to each, not a resolution.
3. **The single highest-stakes rule in this whole repository — Net Profit — has a working candidate formula whose correctness has never been validated**, sitting behind the exact kind of near-miss this organization has already experienced once.
4. **Zero rules, out of 64, have a mechanically-enforced Human Approval Gate.** Any AI-assisted APK Analysis work will be operating in the same governance vacuum every other AI-assisted effort in this repository already does — a real, named, unclosed risk (GOV-004, AI-003), not merely a documentation gap.

None of this means the APK Analysis sprint cannot *begin* — it means it should begin **with these four points named as open risk, not assumed resolved**, and ideally after at least the top three items in §7's roadmap (Net Profit, cash thresholds, invoice-status inclusion) have received a real CEO decision, since those three alone touch the majority of the conflicts and gaps this document found.

---

No file besides this one was created. No existing document — including `business-formula-catalog-v1.md` — was modified. No code, Apps Script, Reporting Service, or Dashboard Dataset change was made. No architecture was redesigned. Nothing was committed.
