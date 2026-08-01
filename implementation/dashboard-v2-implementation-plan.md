# Dashboard V2 — Implementation Plan

| | |
| --- | --- |
| **Status** | Implementation planning only — no production code, no Apps Script, no API, no database, no vendor/cloud decision. |
| **Date** | 1 August 2026 |
| **Grounded strictly in** | [Canonical Data Contract v1](../architecture/canonical-data-contract-v1.md), [Production Architecture v1](../architecture/production-architecture-v1.md), [Service Boundary Review](../architecture/service-boundary-review.md), all six [`services/`](../services/README.md) documents, [Business Rules Catalog v1](../knowledge/business-rules-catalog-v1.md), [Dashboard Reconciliation Audit](../reports/dashboard-reconciliation-audit.md), [Dashboard Lineage Audit](dashboard-lineage-audit.md), [Dashboard Refactor Plan](dashboard-refactor-plan.md), [Implementation Backlog](implementation-backlog.md), the [2026-07-31 Baseline Manifest](../enterprise-data/baseline/2026/2026-07-31-reset/MANIFEST.md) |

Wherever this plan states a fact, it names the source. Wherever a source doesn't settle something, this plan writes **UNKNOWN** — nothing is invented to fill a gap, no formula is guessed, no ownership conflict is silently resolved.

---

# 1. Dashboard Architecture

Four responsibility zones, per Production Architecture's own layering (§2, §3.5–§3.7) and the six Business Service documents.

## Apps Script Responsibilities
**Target state (V2), per Production Architecture §3.6:** render only. Apps Script reads Business Services output (via the Dashboard Dataset, see Section 2) and displays it — it does **not** compute business meaning itself. This directly reverses the current state, in which Apps Script is "both a live Authoritative Source (ADR-0003) and, in target state, a consumer of Business Services output rather than a second place where business logic is computed in parallel."
**Current state (evidence):** Apps Script currently computes several dashboard figures directly — `_bebanBulan()` sums a sheet column itself (Dashboard Lineage Audit, card 9); the `target:` block computes and labels the Gross Profit comparison itself (card 2); `dataShift()`/`simpanTutupShift()` compute Cash figures directly from the Tutup Shift sheet (cards 4–5). V2's architectural goal is to retire this computation, not the sheet-reading itself — Buku Toko remains the Authoritative Source for cash custody, logistics, and catalog per ADR-0003 §3.
**What does not change:** Apps Script remains the rendering surface and the read/write interface to Buku Toko's own Authoritative-Source data (Cash custody, Shift records) — Business Services do not replace Apps Script's role as an Authoritative Source, per `services/README.md`: "they replace *only* the parts of Apps Script that currently compute derived business meaning redundantly."

## Business Service Responsibilities
Per the six documents in `services/`, each figure has exactly one computing owner (cross-checked in `service-boundary-review.md` §3):
- **Finance Service** — Cash, Expense, Receivable, Payable, Gross/Net Profit, Baseline reconciliation.
- **Inventory Service** — Product, Supplier, Inventory (stock position).
- **Sales Service** — Transaction/Invoice, Shift, Employee.
- **Pricing Service** — Price (current and, where it exists, historical).
- **Customer Service** — Customer, Branch, Lead/Content/Campaign.
- **Reporting Service** — assembles the above into the actual card-ready output (see Section 2, Dashboard Dataset) and KPI values, never recomputing a figure another service already owns (`services/reporting-service.md`; Business Rules Catalog REP-001).

Each service is "stateless with respect to truth" (Production Architecture §3.5) — it derives from canonical data, it never originates a fact, and it never writes back to the Canonical Layer.

## Canonical Data Responsibilities
The Canonical Layer holds the one normalized, provenance-tagged dataset every Business Service reads from — never a source-native format (ADR-0003 §3, Consumer Isolation Principle). Today this is the 8-entity `prototype/loka-canonical-poc` output (Product, Customer, Supplier, Shift, Expense, Invoice, InvoiceItem, Payment), independently validated against the real 30 July 2026 backup. It does **not** yet cover Receivable (`InvoiceDebt`), Goods Out, or Stock Alert fields — named gaps, not silent omissions (Implementation Backlog BL-006, BL-012, BL-013).

## Google Sheet (Buku Toko) Responsibilities
Remains the Authoritative Source for cash custody, logistics, inventory operations, catalog, and business workflows (ADR-0003 §3) — unchanged by this plan. In V2's target state, its dashboard-facing sheets (`Ringkasan`, `Tutup Shift`, `Target`, `BEBAN`, `KELUAR`) stop being *where figures are computed* and become, at most, *one of the inputs* Business Services read (for the entities Buku Toko is genuinely authoritative for — Cash, Shift). Where Loka is the authoritative source instead (Invoice, Expense, Product), Buku Toko's own copies of those figures are retired in favor of the canonical pipeline, per the Dashboard Refactor Plan's own classification.

---

# 2. Data Flow

```
Loka
  ↓  (manual backup upload — stays human, per Enterprise OS Blueprint §3)
Canonical Pipeline
  ↓  (Extract → Normalize → Validate → Export; prototype/loka-canonical-poc, validated)
Business Services
  ↓  (Finance / Inventory / Sales / Pricing / Customer Service — each derives its own figures)
Dashboard Dataset
  ↓  (Reporting Service's assembled output — see note below)
Apps Script
  ↓  (reads the Dashboard Dataset, renders only — no computation)
Dashboard
```

**Note on "Dashboard Dataset":** this exact term does not appear in Production Architecture v1, which names the equivalent stage as Reporting Service's output — "Assembled Financial Reports... traceable to the Baseline Snapshot they reconcile against and the Business Service outputs they were built from" (`services/reporting-service.md`). This plan maps "Dashboard Dataset" directly onto that existing, already-defined output, rather than inventing a new architectural stage. Stating this mapping explicitly, as an assumption made by this plan, not a new fact.

**What does not flow backward:** per Consumer Isolation (ADR-0003 §3) and every service's own "stateless with respect to truth" rule, nothing in this chain writes upstream — Apps Script does not write into Business Services, Business Services do not write into the Canonical Layer, and the Canonical Layer does not write into Loka. Buku Toko's own writes (Cash custody entries, Shift closes) enter the chain as Authoritative Source data, the same way Loka's backup does — not as a downstream write-back.

---

# 3. Every Dashboard Card

All eleven cards from the Dashboard Reconciliation Audit and Dashboard Lineage Audit, in the same order. Where the Lineage Audit itself says UNKNOWN, this plan does not resolve it — it inherits the UNKNOWN.

### 3.1 Today's Revenue
| Field | Value |
| --- | --- |
| Source Entity | Invoice (`grandTotal`) |
| Source Dataset | `Ringkasan` sheet — **UNKNOWN** whether fed by the `.realm` backup or the daily `loka-YYYY-MM-DD.json` export (Lineage Audit card 1; ADR-0003 §1 names both) |
| Canonical Dataset | `enterprise-data/canonical/sales.md` (conceptual — not wired to production) |
| Business Service | Sales Service (`services/sales-service.md`) |
| Calculation Owner | Sales Service (target state); Apps Script `dashboard()` (current state, unconfirmed at this granularity) |
| Apps Script Responsibility | Render the figure Sales Service provides; do not recompute from `Ringkasan` directly once V2 is live |
| Refresh Strategy | **Blocked** on resolving the source-file ambiguity (Implementation Backlog BL-007) — no refresh cadence can be responsibly set until this is answered |
| Validation Rule | Business Rules Catalog SAL-004 (Transaction Count inclusion rule, UNKNOWN) affects any per-transaction rollup this card depends on |

### 3.2 Gross Profit
| Field | Value |
| --- | --- |
| Source Entity | Invoice (`profit` / `invoiceProfit`) |
| Source Dataset | `Ringkasan` (`loka.bulanIni.laba`), confirmed via quoted `_olahLoka()` logic (Lineage Audit card 2) |
| Canonical Dataset | `enterprise-data/canonical/sales.md` / `summary.md` (latter not yet built) |
| Business Service | Finance Service |
| Calculation Owner | Finance Service (target state) — arithmetic already confirmed correct (Reconciliation Audit: Rp14,838,115.89, two independent computations agreeing to the cent) |
| Apps Script Responsibility | Render only, using the label `labaKotorBulan` — never `tercapai` against a net target (Business Rules Catalog FIN-009) |
| Refresh Strategy | Monthly aggregate — recompute on each new Invoice ingestion (event-driven, once available) or daily otherwise |
| Validation Rule | FIN-006 (Gross/Net/`Invoice.profit` must not be conflated); FIN-009 (must not be labeled "achieved" against a net target) |

### 3.3 Transaction Count
| Field | Value |
| --- | --- |
| Source Entity | Invoice (count) |
| Source Dataset | `Ringkasan` (likely `bulanIni.trx` or `hariIni.trx`) |
| Canonical Dataset | `enterprise-data/canonical/sales.md` |
| Business Service | Sales Service |
| Calculation Owner | Sales Service (target state) |
| Apps Script Responsibility | Render only |
| Refresh Strategy | Same source-file dependency as 3.1 — blocked pending BL-007 |
| Validation Rule | SAL-004 — **UNKNOWN** whether CANCELLED/PENDING invoices are included; the raw backup contains 476 PAID, 4 CANCELLED, 1 PENDING (481 total) — up to 5 transactions of ambiguity until this rule is defined |

### 3.4 Cash in Hand
| Field | Value |
| --- | --- |
| Source Entity | N/A — no Loka canonical equivalent; Loka's own `Shift.cashInHand` is confirmed a **different, unreconciled** concept (Canonical Data Contract §4) |
| Source Dataset | `Tutup Shift` sheet, "Kas Kasir" column — manually entered |
| Canonical Dataset | None exists |
| Business Service | Finance Service (Cash entity) |
| Calculation Owner | Finance Service (target state, once the `kasAwal` fix is validated); Apps Script `dataShift()`/`simpanTutupShift()` today, confirmed carrying the `kasAwal` asymmetry bug |
| Apps Script Responsibility | Continue as the entry point for Buku Toko's own authoritative Cash data (Apps Script is not being replaced as an Authoritative Source here) — but must not compute a `sisa`/variance figure using the confirmed-broken asymmetric formula |
| Refresh Strategy | Event-driven — on Shift close |
| Validation Rule | FIN-003 (Kas Kasir Rp300,000 policy limit — **confirmed violated** in the 31 July baseline, Rp4,298,500); SAL-002 (Kas Awal must include both Kas Kasir and Kas Tunai); SAL-003 (a physical brankas count is required before this figure can be trusted going forward) |

### 3.5 Safe Cash
| Field | Value |
| --- | --- |
| Source Entity | N/A — same reasoning as 3.4 |
| Source Dataset | `Tutup Shift` sheet, "Kas Tunai" column |
| Canonical Dataset | None exists |
| Business Service | Finance Service (Cash entity) |
| Calculation Owner | Finance Service (target state); same untested Apps Script fix as 3.4 |
| Apps Script Responsibility | Same as 3.4 — never substitute Loka's `Shift.cashInHand` for this figure (Lineage Audit card 5, explicit) |
| Refresh Strategy | Event-driven — on Shift close |
| Validation Rule | Identical to 3.4 — this is the more consequential of the two cards, per the Lineage Audit ("exactly this column's ambiguous meaning produced the Rp5.8 million open question") |

### 3.6 Inventory Value
| Field | Value |
| --- | --- |
| Source Entity | Product (`stock × capitalPrice`) |
| Source Dataset | **UNKNOWN** — no `Ringkasan` field for a total inventory value was found documented (only `nilaiStokMati`, dead-stock value specifically) |
| Canonical Dataset | `enterprise-data/canonical/inventory.md` (conceptual) |
| Business Service | Inventory Service |
| Calculation Owner | Inventory Service (target state) — two real figures already independently computed: Rp109,405,977.38 (Loka-derived) vs. Rp121,375,878.80 (Financial Baseline, physical count) |
| Apps Script Responsibility | Render only, and — critically — never present these two figures as interchangeable; label each by its actual source |
| Refresh Strategy | Lazy load (expensive product-by-product computation); recompute on each canonical ingestion |
| Validation Rule | INV-005 (a discrepancy between physical count and system figure is expected, not a defect, by design); INV-003 (Product's Authoritative Source is Conflicted — only 15 of 49 baseline items matched Loka's stock exactly) |

### 3.7 Goods Out
| Field | Value |
| --- | --- |
| Source Entity | **N/A — no canonical entity exists.** This is a genuine, unaddressed modeling gap, not a bug (Lineage Audit card 7) |
| Source Dataset | `KELUAR` sheet, or possibly `Kirim` — **UNKNOWN** whether these are the same sheet under two names |
| Canonical Dataset | None |
| Business Service | **None** — no Business Service reviewed in `service-boundary-review.md` claims Goods Out; it requires a new canonical entity through the Canonical Data Contract's own additive-versioning path, explicitly deferred (Implementation Backlog BL-013) |
| Calculation Owner | UNKNOWN — cannot be assigned until the entity exists |
| Apps Script Responsibility | Continue reading `KELUAR` directly (no change possible until a canonical path exists) |
| Refresh Strategy | Not applicable until the entity is modeled |
| Validation Rule | None can be defined — no entity, no rule |

### 3.8 Outstanding Receivables
| Field | Value |
| --- | --- |
| Source Entity | `InvoiceDebt` (per prior research, not extracted by the canonical prototype) |
| Source Dataset | `Ringkasan` (`piutang[]`, `piutangTotal`) |
| Canonical Dataset | `enterprise-data/canonical/receivables.md` |
| Business Service | Finance Service |
| Calculation Owner | Finance Service (target state, once `InvoiceDebt` is extracted — Implementation Backlog BL-006) |
| Apps Script Responsibility | Render only, once available |
| Refresh Strategy | Blocked on BL-006 (canonical extension) |
| Validation Rule | FIN-007 (Receivable excludes Ibu's capital, per ADR-0002); SUP-004 (the two example-styled baseline rows worth Rp13M combined remain unconfirmed) |

### 3.9 Expenses
| Field | Value |
| --- | --- |
| Source Entity | Expense (+ embedded ExpenseItem) |
| Source Dataset | `BEBAN` sheet (may not exist — `_bebanBulan()` returns 0 if missing) |
| Canonical Dataset | `enterprise-data/canonical/expenses.md` |
| Business Service | Finance Service |
| Calculation Owner | **Finance Service (target state) — already extracted and proven working in the canonical prototype: Rp18,517,444, 45 real July records.** This is the one card the Dashboard Refactor Plan classifies **A — Already supported by Canonical Data.** |
| Apps Script Responsibility | Stop computing this via `_bebanBulan()`'s current `BEBAN`-sheet-only logic; render the Finance Service figure instead |
| Refresh Strategy | Recompute on each canonical ingestion (daily, aligned with backup cadence) |
| Validation Rule | FIN-008 (no Net Profit displayed without real Expense data — this card's own correctness is the direct precondition for FIN-008 to ever resolve) |

### 3.10 Net Profit
| Field | Value |
| --- | --- |
| Source Entity | Invoice (`profit`) + Expense |
| Source Dataset | `Ringkasan` (gross) + `BEBAN` (expense) + `Target` (comparison) |
| Canonical Dataset | `enterprise-data/canonical/summary.md` — **not yet built**, explicitly designed to reconcile Gross Margin, Net Margin, and Invoice Profit |
| Business Service | Finance Service |
| Calculation Owner | Finance Service (target state) — blocked entirely on 3.9 (Expenses) being wired correctly first |
| Apps Script Responsibility | Render the `labaBersihBisaDihitung` guard's result exactly — either a real figure or an explicit "not computable" state, never a silently zero-expense-assumed number |
| Refresh Strategy | Same cadence as 3.9, strictly after it |
| Validation Rule | FIN-008 (safe-display guard); FIN-006 (must never be conflated with Gross Profit) |

### 3.11 Stock Alerts
| Field | Value |
| --- | --- |
| Source Entity | Product (`stockAlert`, `expiryAlert` — embedded, per prior research, not re-verified here) |
| Source Dataset | `Ringkasan` (`stokMenipis[]`) |
| Canonical Dataset | None — the prototype's own `normalize.js` never maps these fields through |
| Business Service | Inventory Service (would own this once the fields exist canonically) |
| Calculation Owner | UNKNOWN — blocked on Implementation Backlog BL-012 |
| Apps Script Responsibility | Continue current behavior until BL-012 is complete |
| Refresh Strategy | Not applicable until the canonical path exists |
| Validation Rule | None can be defined yet — the threshold logic for "menipis" (low stock) is itself undocumented (Lineage Audit card 11) |

---

# 4. Missing Cards

Per instruction: recommended only where an existing, sourced business rule or a **Defined** KPI formula already supports it — nothing here introduces new arithmetic.

1. **Baseline Integrity Indicator.** Grounded in the Enterprise KPI Framework's **Defined** formula (checksum comparison against `CHECKSUM.md`) and Business Rules Catalog FIN-004/GOV-003. Zero ambiguity — a pass/fail (match/mismatch) state, not a computed number. Recommended for Phase A.
2. **Reconciliation Status (Gross vs. Net vs. `Invoice.profit`).** Grounded directly in FIN-006 and REP-005, and in Finance Service's own stated output ("reconciliation status: whether Gross Margin, Net Margin, and `Invoice.profit` currently agree"). This surfaces the single most-cited defect across every document reviewed for this plan, rather than hiding it. Recommended for Phase B (depends on Finance Service existing).
3. **Kas Kasir Policy Compliance Indicator.** Grounded in FIN-003 — a direct pass/fail against the documented Rp300,000 limit, already known to be violated in the 31 July baseline. Recommended for Phase A — the underlying figure (3.4, Cash in Hand) is already a planned card; this is a compliance flag on top of it, not a new computation.
4. **Central Kitchen Rp0 Pricing Gap Indicator.** Grounded in INV-007 / ADR-0003 §2's own named finding (130+ CK catalog items priced at Rp0). A count/flag, not an invented figure. Recommended for Phase B (once Inventory Service and CK scope are further resolved).

**Considered but not recommended without caveat:** Opening Equity has a **Defined** formula (ADR-0002) but the KPI Framework itself states its "Refresh Frequency: Per baseline reset only" and "Alert Threshold: Not applicable — a point-in-time anchor, not a continuously monitored metric." It does not fit this plan's refresh model as an ordinary card — if shown at all, it belongs in a static "baseline reference" panel, not the regularly-refreshing dashboard, and this plan does not recommend it as a standard card for that reason.

No other card is recommended. Every other KPI in the Enterprise KPI Framework has an UNKNOWN formula — adding a card for any of them would mean inventing arithmetic, which this plan is explicitly instructed not to do.

---

# 5. Dashboard Loading Strategy

Vendor-neutral — no caching technology, scheduler, or hosting choice is named.

- **Preload (on dashboard open):** Cards whose underlying figure is already correct and cheap to serve once Business Services exist: Expenses (3.9, Class A), Gross Profit (3.2, once relabeled), Transaction Count (3.3, once the counting rule is resolved), Baseline Integrity (new card #1). These are the small, frequently-referenced summary figures a CEO checks first.
- **Lazy load (on demand — tab open, scroll, or explicit expand):** Cards that are either expensive to compute or blocked/partial: Inventory Value (3.6, a full product-by-product computation), Outstanding Receivables (3.8, once available), Stock Alerts (3.11, once available), the Reconciliation Status card (#2). Loading these only when viewed avoids paying their cost on every dashboard open, especially while several remain blocked or partially available.
- **Cache:** Because every Business Service is "stateless with respect to truth" (Production Architecture §3.5) — it derives from canonical data, never originates it — the Dashboard Dataset (Section 2) is inherently safe to cache between canonical-layer updates. The cache is invalidated whenever a new canonical ingestion run completes, not on a fixed timer alone, so a stale cache is never presented as current for longer than one ingestion cycle.
- **Recalculation triggers:** (1) A new Loka backup is ingested — the single event that can change nearly every card (Production Architecture §6, Event Flow: "New Loka Backup → Validation → Canonical Update → Apps Script Refresh → Dashboard Refresh"). (2) A Shift closes — affects Cash in Hand/Safe Cash specifically (event `ShiftClosed`, Canonical Data Contract §5). (3) A Price changes — affects any card depending on Pricing Service (event `PriceChanged`). (4) A manual refresh request from a human user.

---

# 6. Dashboard Error Handling

Each state defines exactly what the dashboard displays — never a silently wrong or silently blank number.

| State | Example | What the Dashboard Must Display |
| --- | --- | --- |
| **Missing data** | Goods Out (3.7), Stock Alerts (3.11) — no canonical path exists yet | An explicit "Not yet available" state on the card itself — never a blank, zero, or omitted card. Mirrors the discipline Business Rules Catalog REP-005 already requires for KPIs without a documented formula, generalized to data that doesn't exist yet at all. |
| **Stale data** | Today's Revenue (3.1) when the backup's own latest invoice is known to be from a prior day (Reconciliation Audit: zero 31 July invoices in the most recent backup available) | The figure is shown **with an explicit "as of [last ingestion timestamp]" label**, using the provenance `ingestedAt` field the canonical pipeline already produces — never presented as "today" without that qualifier. |
| **Conflicted data** | Product, Shift, or Employee (all Conflicted Authoritative Source, Canonical Data Contract §4) | Both known values are shown side by side with an explicit "source: X / source: Y — unreconciled" flag, or one value is shown with a clearly visible note naming the conflicting alternative — **never silently resolved to one value**, per this plan's own instruction and GOV-005 (No Duplicate Meaning). |
| **Human approval pending** | A proposed Price change (PRC-001, always requires approval); a proposed Baseline correction (FIN-004) | The **last approved** value continues to display, with a separate, clearly-labeled "pending approval" indicator — an unapproved/proposed value is never shown as if it were live, per GOV-004 (Human Approval Gate). |
| **Baseline mismatch** | A figure that fails FIN-005's Baseline Reconciliation Rule | A visible warning banner on the affected card stating it does not currently reconcile to the 2026-07-31 Baseline — per MANIFEST.md's own rule, the report is what needs correcting, not the baseline, so the dashboard's job is to surface the mismatch prominently, never to auto-correct or hide it. |

---

# 7. Dashboard Refresh Model

Recommendation only — nothing here is implemented.

- **Manual refresh** — recommended for **Phase A**. Matches the current reality: the canonical pipeline runs by manual invocation today (`node src/index.js`), and no automation layer exists yet (Business Rules Catalog AUT-004, staged rollout — automation should start with simple notifications, not autonomous response). A manual "Refresh" action on the dashboard is the lowest-risk way to get a usable V2 live.
- **Scheduled refresh** — recommended for **Phase B**, once Business Services exist and the canonical pipeline can run unattended. Cadence should align with Loka's own daily backup rhythm — a specific time is **UNKNOWN**, not fixed by any document reviewed.
- **Event-driven refresh** — recommended for **Phase C**, once the Automation component exists (Production Architecture §3.9). Triggers: `ShiftClosed`, `InvoiceCreated`/backup ingestion, `PriceChanged` — all already named events (Canonical Data Contract §5). Per AUT-003, any such automated trigger must be observable — a missing expected refresh must be visibly distinguishable from "nothing changed," not silent.

Automation Readiness per `service-boundary-review.md` §8 applies directly here: **only notification-class actions** (e.g., "new data available, refresh recommended") may run without human approval at any phase; anything that writes a displayed figure without a human ever reviewing it remains bounded by the Human Approval Gate (GOV-004) for the underlying data it displays, not for the refresh action itself.

---

# 8. Dashboard Implementation Phases

## Phase A — Minimal Usable Dashboard
**Scope:** Only cards already supported by canonical data plus an already-written (if unverified) fix. Directly matches the Dashboard Reconciliation Audit's own "Priority: Fix Before Adding Features" list and the Implementation Backlog's P0 items:
- Expenses (3.9) wired to the canonical `Expense` entity (BL-001).
- Gross Profit relabeling + Net Profit safe-display guard (3.2, 3.10 — BL-002).
- Cash custody chain investigation and fix validation (3.4, 3.5 — BL-003, BL-004) — including the new Kas Kasir Policy Compliance Indicator (Section 4, #3).
- Baseline Integrity Indicator (Section 4, #1) — cheap, zero-ambiguity, reinforces trust in the baseline the rest of the dashboard implicitly depends on.
- Manual refresh only (Section 7).
**Explicitly out of scope for Phase A:** Today's Revenue and Transaction Count (blocked on the source-file question, BL-007), Inventory Value, Outstanding Receivables, Goods Out, Stock Alerts.

## Phase B — Business Services Integration
**Scope:** The six Business Services (`services/`) become the actual computation layer Apps Script reads from, replacing direct sheet computation for every card whose Business Service dependency is now resolvable:
- Extend the canonical prototype to cover `InvoiceDebt` (BL-006) — unblocks Outstanding Receivables (3.8).
- Resolve the Today's Revenue / `Ringkasan` source question (BL-007) — unblocks 3.1 and 3.3.
- Resolve or explicitly carry forward the Product/Shift/Employee Authoritative Source conflicts pending ADR-0003/0004 CEO decisions (BL-008, BL-009, BL-014) — affects Inventory Value (3.6) directly.
- Add the Reconciliation Status (#2) and Central Kitchen Rp0 Pricing Gap (#4) cards.
- Move to scheduled refresh (Section 7).
**Dependency:** per the Architecture Governance Review, most of this phase's canonical-data work assumes ADR-0003's acceptance — named here as an inherited dependency, not re-decided by this plan.

## Phase C — Enterprise Dashboard
**Scope:** Full multi-brand and automation maturity:
- Model the Goods Out entity (3.7) through the Canonical Data Contract's additive-versioning path (BL-013) — explicitly deferred until this phase, per that backlog item's own stated constraint.
- Extend Stock Alert/Expiry Alert field mapping (3.11 — BL-012).
- Onboard Central Kitchen and SBGA as additional brands, per Production Architecture §4's Multi-Brand Design — contingent on their Authoritative Source assignments finally being named (still unresolved as of every document reviewed here).
- Event-driven refresh (Section 7) via the Automation component.
- AI Workforce reads Business Services/Dashboard Dataset output to flag anomalies (e.g., a KPI moving unusually), always subject to the Human Approval Gate before anything derived from it is acted on (Business Rules Catalog Section 10, AI Rules).

---

No file besides this one was created. No production code, Apps Script, API, schema, database, vendor, or cloud decision was made. Nothing was committed.
