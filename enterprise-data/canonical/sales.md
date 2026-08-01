# Canonical Dataset — Sales

- **Purpose:** The normalized record of every completed sales transaction.
- **Business Meaning:** The core revenue-generating activity of the business — feeds Revenue, Transaction Count, and Average Basket in the Enterprise KPI Framework.
- **Business Owner:** CEO (Canonical Data Contract §4, Transaction/Invoice entity).
- **Technical Owner:** CEO — no dedicated technical role exists (Data Governance Framework §2).
- **Authoritative Source:** Loka POS, named authoritative for sales transactions (ADR-0003 §3). `loka-schema-analysis.md` confirms the `Invoice` table (423 records in the inspected backup) as "the central table."
- **Relationship with Master Data:** References [Products](../master/products/README.md) (line items), [Customers](../master/customers/README.md) (buyer), and [Employees](../master/employees/README.md) (cashier who processed it).
- **Relationship with Financial Baseline:** Sales activity from 1 August 2026 onward is what the baseline's Opening Equity growth is measured against (Baseline Manifest, Reconciliation Rule). Sales itself was not part of the baseline — the baseline is a point-in-time balance, not a transaction log.
- **Refresh Trigger:** UNKNOWN. No document defines what triggers ingestion of new sales data.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Apps Script, Reports, Automation, AI (consumer only).
- **Required Validation:** Per Data Governance Framework §7 — Completeness, Consistency, Uniqueness, Integrity, Freshness, Traceability, Provenance all apply. Specifically: `Invoice.profit` is a third, independent margin figure (`loka-schema-analysis.md`) that must be reconciled against Gross Margin and Net Margin, not treated as agreeing with either by default.
- **Provenance Requirements:** Source file, ingestion timestamp, connector/parser version, and a checksum of the source, per the Provenance rule in Data Governance Framework §7.
- **Versioning:** Per Canonical Data Contract §9 — additive for new fields or record types, breaking for anything that changes an existing meaning or Authoritative Source assignment.
- **Retention:** Indefinite — Never Deleted (Data Governance Framework §4, §7).
- **Archive Policy:** Retained permanently once active relevance passes; a voided or refunded transaction is marked as such, never removed.
- **Open Questions:**
  1. Does canonical Sales include voided or refunded transactions? `loka-schema-analysis.md` notes Loka's `Refund` table exists but held zero records in the inspected backup — refund handling in a canonical model is unconfirmed.
  2. How does `Invoice.profit` reconcile against Gross Margin and Net Margin?
  3. Are Branch-as-Customer transactions (internal transfers recorded as sales) included, excluded, or separately flagged?
