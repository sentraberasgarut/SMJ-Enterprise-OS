# Canonical Dataset — Inventory

- **Purpose:** The normalized record of stock quantity on hand, per product.
- **Business Meaning:** Feeds Inventory Value and the Operations-domain KPIs (Stock Accuracy, Dead Stock, Inventory Turnover) in the Enterprise KPI Framework.
- **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen).
- **Technical Owner:** CEO.
- **Authoritative Source:** **Unresolved.** Canonical Data Contract §4 states plainly that "no system currently holds a true history, only a current snapshot." `loka-schema-analysis.md` confirms this directly: Loka's `StockMovement` table — the schema meant to hold a proper stock ledger — has zero records. `Product.stock` appears to be incremented or decremented directly, with no history kept (Unknown #1).
- **Relationship with Master Data:** Inventory has no dedicated master-data folder of its own — it is treated as a canonical/transactional concept derived from Products master data's own "Inventory Relationship" section, which names Product and Inventory as related but distinct.
- **Relationship with Financial Baseline:** Important distinction, stated explicitly rather than assumed: the baseline's Inventory Value (`01_MODAL_BARANG`, per the Baseline Manifest) came from a **physical stock count**, "deliberately counted fresh rather than taken from any system's recorded stock figure." A future canonical Inventory dataset and the baseline figure are not the same lineage — one is a physical count, the other would be system-derived — and they are not automatically expected to agree.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Products, Reports, Restocks (as a reconciliation input), AI (consumer only).
- **Required Validation:** Integrity (no negative stock without an explained cause); Freshness — the Data Governance Framework's cautionary example is directly on point here: a schema analysis performed against a backup already five weeks stale relative to the rest of the organization's timeline.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum — especially important here, since no historical ledger exists upstream; the canonical layer would be the first place a real history could begin.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite, once established. Historical reconstruction prior to the point ingestion begins is not promised — see Open Questions.
- **Archive Policy:** Standard — superseded stock figures are retained as history, not overwritten.
- **Open Questions:**
  1. Can historical stock-level reconstruction ever be achieved, given `StockMovement`'s empty state — or can canonical Inventory only ever represent a current snapshot going forward?
  2. Is canonical Inventory ever expected to reconcile with the physically-counted baseline figure, and on what cadence?
  3. `loka-schema-analysis.md` (Unknown #2) notes `Restock` (0 records) versus `ProductRestockBatch` (53 records) look like two versions of the same concept — which one, if either, is the source of Inventory change events?
