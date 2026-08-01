# Dashboard Refactor Plan

| | |
| --- | --- |
| **Status** | Migration plan — not code |
| **Date** | 31 July 2026 |
| **Builds on** | `implementation/dashboard-lineage-audit.md`, `reports/dashboard-reconciliation-audit.md` |

This is a plan for sequencing work, not an implementation. Nothing here is built yet.

---

## Classification

| # | Metric | Class | Why |
| --- | --- | --- | --- |
| 1 | Today's Revenue | **B** — Needs Canonical Data extension | No live ingestion pipeline exists; the source-file ambiguity (`.realm` vs. daily JSON) must be resolved before any canonical path can be built |
| 2 | Gross Profit | **E** — Should be redesigned | The arithmetic is already correct and already extractable (canonical `Invoice.invoiceProfit`) — what needs to change is the card's label and its relationship to the Target sheet, not the data behind it |
| 3 | Transaction Count | **B** — Needs Canonical Data extension | Data is extractable via canonical Invoice, but the counting rule (which statuses count) is undefined and needs to be decided before wiring it up |
| 4 | Cash in Hand | **C** — Apps Script only | This figure has no Loka or canonical equivalent at all — it is manually entered cash-custody data. The fix lives entirely in `TutupShiftV2.gs` |
| 5 | Safe Cash | **C** — Apps Script only | Same reasoning as Cash in Hand |
| 6 | Inventory Value | **B** — Needs Canonical Data extension | Loka-side value is already computable (canonical Product); the dashboard's actual source (if any) is undocumented and needs to be defined against the canonical figure, not invented from scratch |
| 7 | Goods Out | **B** — Needs Canonical Data extension | No canonical entity exists for inter-branch distribution at all — this is new modeling work, not a fix to something broken |
| 8 | Outstanding Receivables | **B** — Needs Canonical Data extension | `InvoiceDebt` was never extracted by the prototype; this is a scoping gap, not a design flaw |
| 9 | Expenses | **A** — Already supported by Canonical Data | Loka's `Expense` entity is already extracted and proven (Rp18,517,444, verified in the reconciliation audit). The remaining work is wiring Apps Script to read it — a connection problem, not a data-availability problem |
| 10 | Net Profit | **E** — Should be redesigned | Depends entirely on Expenses (item 9) being wired correctly; once it is, the "safe to show / not safe to show" pattern PATCH-01 already proposes is the right design, not a new one |
| 11 | Stock Alerts | **B** — Needs Canonical Data extension | Loka has the underlying fields (`stockAlert`, `expiryAlert`); the prototype simply never mapped them |

No metric in this set was classified **D** (should be removed) — every one of the eleven answers a real business question, even the two (Goods Out, Stock Alerts) with no data path yet.

---

## Complexity, Risk, and Business Impact

| # | Metric | Complexity | Risk | Business Impact |
| --- | --- | --- | --- | --- |
| 9 | Expenses | Low — the canonical data already exists; this is a wiring change | Low | **Critical** — this single fix unblocks Net Profit entirely |
| 2 | Gross Profit (label) | Low — the fix is already written in PATCH-01, only needs testing and deployment | Low | **Critical** — this is the exact bug that produced a false "73% achieved" reading in a month that was actually running a net loss |
| 10 | Net Profit | Low, but blocked on #9 | Low | **Critical** — directly downstream of Expenses |
| 4 | Cash in Hand | Medium — `TutupShiftV2.gs` exists but is explicitly untested; requires a physical brankas count before the new baseline (`setSaldoBrankasAwalManual`) can be trusted | **High** — this touches real cash custody | **Critical** |
| 5 | Safe Cash | Medium, same file and process as Cash in Hand | **High** | **Critical** |
| 8 | Outstanding Receivables | Medium — extending the prototype to a ninth entity (`InvoiceDebt`) follows the same pattern already proven for the other eight | Medium — affects reconciliation against the Financial Baseline's Opening Equity | High |
| 1 | Today's Revenue | Medium — blocked on resolving which Loka export actually feeds it, before any pipeline can be built with confidence | Medium — risk of building against the wrong file | High |
| 6 | Inventory Value | Medium — the Loka-side number already exists; work is deciding how it's presented against the Financial Baseline figure | Low | Medium |
| 7 | Goods Out | High — requires defining a wholly new canonical entity, plus resolving the `KELUAR`/`Kirim` naming question first | Low | Medium |
| 3 | Transaction Count | Low | Low | Low–Medium |
| 11 | Stock Alerts | Low — a small, well-understood extension to `normalize.js` | Low | Low |

---

## Recommended Implementation Order

Sequenced by business-correctness-first, per this phase's stated priority — not by ease of implementation.

1. **Expenses wiring (#9).** Lowest complexity, highest leverage: this single fix is a prerequisite for Net Profit and directly contradicts a false code comment already found in the repo.
2. **Gross Profit relabeling / Net Profit safe-display (#2, #10).** Already-written fix, low complexity, and this is the single most CEO-visible number on the dashboard. Sequenced immediately after #9 because Net Profit's "safe to show" logic only becomes meaningful once Expenses is real.
3. **Cash custody chain — Cash in Hand and Safe Cash (#4, #5).** Independent of items 1–2; can run in parallel. Higher complexity because it requires a physical brankas count first (per `TutupShiftV2.gs`'s own documented install order) and touches real money — sequenced early despite the complexity because the risk of leaving it unresolved is the highest in this list.
4. **Outstanding Receivables extension (#8).** Follows the exact pattern already proven for the other eight canonical entities — the lowest-risk way to close a real reconciliation gap.
5. **Today's Revenue source clarification (#1).** Blocked on one factual question (which export feeds Ringkasan) that should be resolved before building anything further on top of it.
6. **Inventory Value presentation (#6).** Both numbers already exist; this is a decision about what the dashboard shows and how it's labeled against the Financial Baseline, not new data work.
7. **Goods Out modeling (#7).** Deferred — it requires new canonical modeling work this phase was explicitly told not to produce (no new canonical theory), so this item waits until that constraint lifts.
8. **Transaction Count rule + Stock Alerts extension (#3, #11).** Lowest business impact; scheduled last, opportunistically alongside whichever of the above they naturally piggyback on.

**Not sequenced here, but blocking everything above it in spirit:** ADR-0003 and ADR-0004 remain in "Proposed" status. Every one of the "B" classifications above assumes a Canonical Data Layer that does not yet formally exist as an accepted architecture. This plan proceeds on the working assumption that the prototype's approach is directionally correct, but a CEO decision on those two ADRs is still the thing every canonical-data item ultimately depends on.
