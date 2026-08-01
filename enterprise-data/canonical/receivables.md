# Canonical Dataset — Receivables

- **Purpose:** The normalized record of amounts owed *to* the business by outside parties.
- **Business Meaning:** Feeds the Asset side of the Opening Equity formula and the ongoing Receivable KPI.
- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Authoritative Source:** Two parallel sources, not yet reconciled — the 2026-07-31 Baseline Snapshot for the opening figure, and Loka's `InvoiceDebt` table (62 records per `loka-schema-analysis.md`) for ongoing activity (Canonical Data Contract §4).
- **Relationship with Master Data:** Instantiates [Customers master data](../master/customers/README.md) — Receivables identifies who owes; there is no separate Receivable master file, as this dataset is transactional/canonical in nature.
- **Relationship with Financial Baseline:** **Direct and explicit.** The baseline's Receivable figure, per the Baseline Manifest, came from a manual record of receivables and payables to outside parties, excluding Ibu's funds (which are capital, not debt, per ADR-0002). Every canonical Receivable figure going forward must reconcile against this opening figure per the Manifest's Reconciliation Rule.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Opening Equity / Finance, CRM, Reports, AI (consumer only).
- **Required Validation:** Ibu's funds must always be excluded — a hard rule from ADR-0002, not a judgment call. The manually-recorded baseline figure and Loka's `InvoiceDebt` table must be reconciled, not silently treated as agreeing.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum — critically important here given two currently-unreconciled sources.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite.
- **Archive Policy:** A settled receivable is marked as paid/closed and archived, never deleted.
- **Open Questions:**
  1. How and when will Loka's `InvoiceDebt` reconcile with the baseline's manually-recorded Receivable figure?
  2. Is there intended to be a single canonical Receivable ledger going forward, or do the manual and system-derived tracks remain permanently parallel?
