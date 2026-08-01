# Canonical Dataset — Restocks

- **Purpose:** The normalized record of stock-in / purchasing activity.
- **Business Meaning:** Feeds Inventory increases and the Payable side of the business's obligations to suppliers.
- **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen).
- **Technical Owner:** CEO.
- **Authoritative Source:** Loka POS — `ProductRestockBatch` (53 records) plus its line items and `ProductRestockPayment` (13 records), per `loka-schema-analysis.md`, described there as "the only populated stock-in ledger." A separate `Restock` table exists with zero records and appears to be a different version of the same concept, possibly deprecated (`loka-schema-analysis.md`, Unknown #2) — this is named explicitly rather than assumed resolved.
- **Relationship with Master Data:** References [Suppliers master data](../master/suppliers/README.md) and [Products master data](../master/products/README.md).
- **Relationship with Financial Baseline:** Unpaid restock batches would relate to the business's Payable position, but per the Baseline Manifest, the baseline's Payable figure came from a manual record — not derived from `ProductRestockPayment`. The two are parallel today, in the same pattern already noted for Receivables.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Inventory (as a stock-increase input), Payable / Finance, Reports, AI (consumer only).
- **Required Validation:** The `Restock` versus `ProductRestockBatch` ambiguity must be resolved, or at minimum explicitly recorded, before either is treated as the canonical source of restock events.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite.
- **Archive Policy:** Standard — a fully paid restock batch is marked settled and archived, never deleted.
- **Open Questions:**
  1. Is `Restock` a deprecated predecessor of `ProductRestockBatch`, and if so, since which app version?
  2. How and when does canonical Restock/Payable data reconcile with the baseline's manually-recorded Payable figure?
