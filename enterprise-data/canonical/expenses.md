# Canonical Dataset — Expenses

- **Purpose:** The normalized record of operating expenses.
- **Business Meaning:** Feeds Net Profit and Net Margin.
- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Authoritative Source:** Loka POS — the `Expense` table (32 records per `loka-schema-analysis.md`).
- **Relationship with Master Data:** No dedicated Expense master-data folder exists in `enterprise-data/master/` today — Expense is treated purely as canonical/transactional data. Expense category taxonomy, if it comes to exist, is governed by [Taxonomy master data](../master/taxonomy/README.md), which is itself almost entirely UNKNOWN.
- **Relationship with Financial Baseline:** UNKNOWN beyond general Financial-domain scope. The Baseline Manifest does not itemize an Expense-specific baseline figure — it describes the overall financial position (assets, liabilities, equity) without breaking out an operating-expense line.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Net Profit / Net Margin calculation, Reports, AI (consumer only).
- **Required Validation:** Completeness and Integrity, per Data Governance Framework §7.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite.
- **Archive Policy:** Standard.
- **Open Questions:**
  1. Are owner drawings (Prive, per ADR-0002's capital framing) included in or excluded from canonical Expense? The Enterprise KPI Framework already flags this exact boundary as undefined for the Operating Expense KPI.
  2. No governed category structure exists for expense types — see Taxonomy master data's own open status.
