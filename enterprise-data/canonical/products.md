# Canonical Dataset — Products

- **Purpose:** The normalized, ingested record of the product catalog — the canonical realization of the governance rules defined in [Products master data](../master/products/README.md).
- **Business Meaning:** What can be sold or stocked; feeds pricing, inventory, and margin analysis.
- **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen) — Canonical Data Contract §4.
- **Technical Owner:** CEO.
- **Authoritative Source:** **Conflicted.** ADR-0003 names Buku Toko authoritative for "catalog," while `loka-schema-analysis.md` confirms Loka independently maintains its own `Product` table (46 records in the inspected backup) with its own pricing fields. No document assigns a tiebreaker — canonical ingestion would need to either resolve this or explicitly record both as parallel inputs.
- **Relationship with Master Data:** This is the canonical instantiation of [Products master data](../master/products/README.md) — the master file defines the rules; this dataset is what exists once those rules are applied to real ingested records.
- **Relationship with Financial Baseline:** The 2026-07-31 baseline's Inventory Value depended on product identity during the physical stock count, but Product itself was not separately published as a baseline artifact — only the resulting aggregate figure is.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Sales (line items), Inventory, Pricing, Apps Script, Reports, AI (consumer only).
- **Required Validation:** Completeness (required fields present); Integrity — specifically, `loka-schema-analysis.md`'s Relationships section documents that `Product.category` is an embedded snapshot, not a live link to the `ProductCategory` master, and the two "can legitimately disagree" without that being a bug. A canonical model must decide, and record, which one it reports from.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite.
- **Archive Policy:** A discontinued product is archived, never deleted, per the Never Deleted principle (Products master data).
- **Open Questions:**
  1. Which system — Loka or Buku Toko — is treated as canonical when the two disagree?
  2. Does canonical Product use the category as recorded at a point in time, or resolve it against the current category master? `loka-schema-analysis.md` (Unknown #5) states neither answer is obviously correct without asking whoever owns margin reporting.
  3. How is unit-of-measure handled, given [UOM master data](../master/uom/README.md) is itself almost entirely UNKNOWN?
