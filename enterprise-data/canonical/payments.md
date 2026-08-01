# Canonical Dataset — Payments

- **Purpose:** The normalized record of the payment method and amount associated with a sale.
- **Business Meaning:** Feeds Cash Balance and cash reconciliation.
- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Authoritative Source:** Loka POS — `Invoice.paymentMethod` (an embedded snapshot, per `loka-schema-analysis.md`) and `Invoice.splitPayments[]`; also the `PaymentMethod` master table (3 records: e.g. QRIS, Cash) and `BalanceBucket` (4 records, cash "buckets").
- **Relationship with Master Data:** Payment Method has **no dedicated master-data folder today** — unlike Products, Customers, or Suppliers, no `enterprise-data/master/` dataset governs it. This is stated as a gap, not filled in here; Payments is named in the Canonical Data Contract's relationship chain (`Customer → Invoice → Payment → Cash → Financial Report`, §8) without a separate governed master dataset behind "Payment" itself.
- **Relationship with Financial Baseline:** The baseline's Cash Balance (`02_MODAL_UANG`, per the Baseline Manifest) was a physical count across cash, bank, and e-wallet positions — conceptually related to Loka's `BalanceBucket` concept, but not derived from it.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Sales, Cash Balance calculation, Reports, AI (consumer only).
- **Required Validation:** The same embedded-snapshot-versus-live-master pattern flagged for Product applies here — `Invoice.paymentMethod` is a copy made at the moment of sale (`loka-schema-analysis.md`, Relationships §2), and may legitimately disagree with the current `PaymentMethod` master if a method was later renamed or edited.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite.
- **Archive Policy:** Standard.
- **Open Questions:**
  1. Should a dedicated Payment Method master dataset be created, parallel to Pricing, given none exists today?
  2. How should the embedded payment snapshot on an old sale be reconciled against a `PaymentMethod` master record that may have since changed?
