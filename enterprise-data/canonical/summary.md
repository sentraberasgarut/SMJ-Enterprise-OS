# Canonical Dataset — Summary

- **Purpose:** A derived, aggregate view combining figures from the other canonical datasets (Sales, Inventory, Payments, Expenses, and so on) into rollup metrics — the canonical-layer counterpart to the `Ringkasan` cache already referenced in ADR-0003, and the computation layer the Enterprise KPI Framework's KPIs would eventually read from.
- **Business Meaning:** This is where Revenue, Gross Margin, Net Margin, and other top-line figures would actually be computed, if a canonical, reconciled version of them is ever built.
- **Business Owner:** CEO.
- **Technical Owner:** CEO — no dedicated technical role exists.
- **Authoritative Source:** **Does not exist as a canonical dataset today.** ADR-0003 names `Ringkasan` as an existing cache (inside Buku Toko, sourced from the Loka export) that serves a similar purpose now — but `Ringkasan` is a source-native cache within a single Authoritative Source, not a product of a Canonical Data Layer. It is, in fact, one side of the exact "same metric, two answers" problem (Gross Margin from `Ringkasan` versus Net Margin from manual analysis versus `Invoice.profit` from Loka itself) that a true canonical Summary dataset would need to resolve, not inherit unchanged.
- **Relationship with Master Data:** None directly — Summary is derived entirely from other canonical datasets, which themselves reference Master Data. It has no master-data relationship of its own.
- **Relationship with Financial Baseline:** **The most direct link in this entire canonical layer.** Per the Baseline Manifest's Reconciliation Rule, every financial report from 1 August 2026 onward must be reconcilable to the baseline's Opening Equity. Summary is the dataset that would actually perform and expose that reconciliation, if built — it does not exist to replace the baseline, only to prove agreement with it.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Reports, AI (consumer only), the Enterprise KPI Framework's metrics generally.
- **Required Validation:** This is where the Data Governance Framework's Consistency rule and the Canonical Data Contract's "No Duplicate Meaning" principle would be enforced most directly. Gross Margin, Net Margin, and `Invoice.profit` must each be exposed as distinct, named figures here — never silently collapsed into one number labeled simply "profit."
- **Provenance Requirements:** More demanding than the other datasets in this layer: a Summary figure must record which underlying canonical datasets, and which version of the Financial Baseline, it was computed from — since it is a derived rollup, not a direct ingestion of a single source.
- **Versioning:** Per Canonical Data Contract §9 — but with a sharper distinction than most datasets: a change in *how* a figure is computed (for example, redefining what counts as Net Profit) is always a breaking change requiring migration notes, never a minor one, because it silently changes the meaning of every number already reported under the old definition.
- **Retention:** Indefinite.
- **Archive Policy:** A superseded computation's historical output is retained exactly as it was reported, never overwritten. Recomputing history under a new definition produces a new, separately dated record — consistent with Immutable History — it does not replace what was already reported.
- **Open Questions:**
  1. Does Summary eventually replace `Ringkasan`, or operate alongside it during a transition?
  2. How are Gross Margin, Net Margin, and `Invoice.profit` each surfaced here without collapsing into a single, misleadingly simple "profit" figure?
  3. This entire dataset is a stated need, not an established fact — no document confirms any part of it exists in any form today.
