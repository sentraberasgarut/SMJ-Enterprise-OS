# Finance Service

| | |
| --- | --- |
| **Status** | Draft — proposed business responsibility, pending CEO acceptance |
| **Grounded in** | Canonical Data Contract §3 (Finance domain), §4 (Cash, Expense, Receivable, Payable, Baseline Snapshot, Transaction/Invoice entities), §8 (Relationship Model); Production Architecture §3.5 (Business Services); ADR-0002 (capital structure) |

## Responsibilities

- Compute the business's financial position from canonical data: cash on hand, outstanding receivables and payables, expenses recorded, and gross vs. net profit — **once**, so Apps Script, Dashboard, and AI Workforce stop each computing their own version.
- Reconcile computed figures against the 2026-07-31 Baseline Snapshot, which the Canonical Data Contract's Relationship Model (§8) names as the anchor every TSS financial report from 1 August 2026 onward must trace back to.
- Hold the still-unbuilt reconciliation Production Architecture (§3.5) names explicitly: one coherent figure relating Gross Margin, Net Margin, and Loka's own `Invoice.profit` — today three different, all-plausible answers to "what did we make," per the Canonical Data Contract's own diagnosis (§2, No Duplicate Meaning).
- Apply ADR-0002's capital-structure decision wherever a financial figure depends on it: Ibu's funds at TSS are capital, not a liability — this changes what "Payable" and "Equity" mean for any figure Finance Service computes.

## Inputs

Canonical entities only (Business Services' input is exclusively the Canonical Layer, per Production Architecture §3.5):

- **Cash** — money custody: brankas, kasir, bank, e-wallet balances and movements (Canonical Contract §4). Authoritative Source: Buku Toko for custody; the 2026-07-31 Baseline Snapshot for the opening figure.
- **Expense** — operating costs (Loka POS `Expense` table).
- **Receivable** — money owed *to* the business (Baseline Snapshot for opening figure; Loka's `InvoiceDebt` table for ongoing activity — **the two are not yet reconciled to each other**, per the Contract).
- **Payable** — money owed *by* the business, explicitly excluding Ibu's capital per ADR-0002 (Baseline Snapshot for opening figure; **no clearly assigned ongoing source exists yet**).
- **Transaction/Invoice** — for the payment and profit figures a sale produces (Loka POS `Invoice` table).
- **Baseline Snapshot** — the immutable 2026-07-31 reset, as the reconciliation anchor.

## Outputs

Computed business figures, each traceable back to the canonical records and connector run that produced them (Production Architecture §3.5) — not new canonical facts, and never written back to the Canonical Layer:

- Cash position (current, by custody location).
- Outstanding Receivables and Payables (current).
- Expense totals over a stated period.
- Gross Profit, Net Profit, and `Invoice.profit`-derived figures, each labeled by which of the three it is — never presented as interchangeable.
- Baseline reconciliation status — whether current figures agree with the 2026-07-31 anchor, and where they diverge.

## Business Rules

- **Immutable History applies** (Canonical Data Contract §2): a wrong figure is corrected by recording a new, dated fact that supersedes it — never a silent overwrite of a previously computed figure.
- **Stateless with respect to truth** (Production Architecture §2, §3.5): if a figure is wrong, the underlying formula is fixed and the figure is recomputed from canonical data — the output itself is never hand-patched.
- **ADR-0002 governs Cash and Baseline Snapshot computation** — the Canonical Data Contract's own Relationship Model (§8) names this directly: "the decision recorded in ADR-0002... governs how the Cash and Baseline Snapshot entities are computed."
- **Human Approval Required — always**, for Cash, Expense, Receivable, and Payable alike (Canonical Data Contract §6, Ownership Matrix). Finance Service may compute and expose a figure; it does not authorize any action on it.
- **Open item this service cannot resolve on its own:** Receivable's two sources (Baseline Snapshot, Loka `InvoiceDebt`) are not yet reconciled, and Payable has no assigned ongoing source at all (Canonical Data Contract §4). Finance Service's Receivable/Payable outputs are only as complete as those unresolved sources allow — this document names the gap, it does not close it.
- **Open item:** the porsi modal (Aditya vs. Ibu capital split, ADR-0002) is unresolved as of this document. Production Architecture's own Open Decisions (§10) flags this as potentially affecting any Business Services calculation touching Equity — Finance Service inherits that same open dependency.

## Consumers

Per Production Architecture §2 (Application Layer) and Canonical Data Contract §4 (per-entity Consumers column): Apps Script (target state), Dashboard, AI Workforce (subject to the Human Approval Gate), Automation (for threshold-triggered notifications, e.g. a KPI crossing a defined value), and Reporting Service (for assembling Financial Reports).

## Future APIs

No API is designed here — this section only names anticipated access needs, per this document's scope boundary:

- A way for Dashboard to ask "what is the current Cash position" without knowing which canonical entities or Baseline Snapshot fields produced it.
- A way for Apps Script to request the same Gross Profit / Net Profit figures it currently computes independently, so its duplicated logic (`_bebanBulan()`, per Production Architecture §3.6) can be retired in favor of asking Finance Service instead.
- A way for AI Workforce to request a Baseline reconciliation status as of a given date, for anomaly-flagging purposes, always subject to the Human Approval Gate before anything derived from it is acted on.
