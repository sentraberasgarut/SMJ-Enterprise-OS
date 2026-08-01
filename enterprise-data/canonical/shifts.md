# Canonical Dataset — Shifts

- **Purpose:** The normalized record of a cashier's work period, with opening and closing cash counts.
- **Business Meaning:** Feeds Cash Balance and Shift Accuracy.
- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Authoritative Source:** **Conflicted.** Canonical Data Contract §4 states Loka's own `Shift` table and Buku Toko's Tutup Shift sheet "track the same concept in parallel, not unified." `loka-schema-analysis.md` confirms Loka's `Shift` table (28 records) carries `cashierId`, `openTime`, `closeTime`, `initialCash`, `actualCash`, `cashDiff`, and `cashInHand` — "directly comparable to Buku Toko's `Tutup Shift` sheet," not the same record.
- **Relationship with Master Data:** References [Employees master data](../master/employees/README.md), which is itself conflicted (Loka's `Cashier` table versus Buku Toko's `Pengguna` sheet) — compounding the Shift conflict with an Employee conflict underneath it.
- **Relationship with Financial Baseline:** The baseline's Cash Balance (`02_MODAL_UANG`) was a physical count at one point in time, not derived from Shift records. Shift is an ongoing operational record; the baseline is a one-time snapshot — the two are not the same lineage.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Cash Balance calculation, Automation (access rules via Employee), Reports, AI (consumer only).
- **Required Validation:** `cashDiff` (the recorded variance) is a natural check, but the Enterprise KPI Framework confirms no Alert Threshold exists for Shift Accuracy anywhere in this repository — validation here is limited to structural completeness, not a business-rule threshold, since none is defined.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite.
- **Archive Policy:** Standard.
- **Open Questions:**
  1. Which system — Loka's `Shift` or Buku Toko's Tutup Shift sheet — is treated as canonical?
  2. How does the underlying Employee/Cashier roster conflict get resolved before Shift records can be reliably attributed to one person?
