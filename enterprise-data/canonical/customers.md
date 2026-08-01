# Canonical Dataset — Customers

- **Purpose:** The normalized, ingested record of customer accounts — the canonical realization of [Customers master data](../master/customers/README.md).
- **Business Meaning:** Identifies who buys; feeds the Sales-domain KPIs (Repeat Customer Rate, New Customer Rate) and Loyalty Usage in the Enterprise KPI Framework.
- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Authoritative Source:** Loka POS. `loka-schema-analysis.md` confirms the `Customer` table (8 records in the inspected backup) includes at least one Sederhana Jaya branch recorded as a customer, with a phone number matching the branch — real, observed data, not a hypothetical.
- **Relationship with Master Data:** This is the canonical instantiation of [Customers master data](../master/customers/README.md), including the Internal Branch-as-Customer category that file names as confirmed rather than merely possible.
- **Relationship with Financial Baseline:** The baseline's Receivable figure represents amounts owed by specific customers, but per the Baseline Manifest, that figure came from a **manual record**, not from Loka's Customer or `InvoiceDebt` tables. The two are parallel today, not reconciled — the same pattern already flagged for Receivables and Restocks.
- **Refresh Trigger:** UNKNOWN.
- **Refresh Frequency:** UNKNOWN.
- **Consumers:** Sales, Receivables, the CRM and Sales & Marketing domains, AI (consumer only).
- **Required Validation:** Consistency/Integrity — per `loka-schema-analysis.md`'s Candidate Canonical Model, any record whose phone number matches a known Sederhana Jaya branch number should be flagged, since it is not a retail customer in the ordinary sense.
- **Provenance Requirements:** Source file, ingestion timestamp, connector version, checksum.
- **Versioning:** Per Canonical Data Contract §9.
- **Retention:** Indefinite.
- **Archive Policy:** Standard — a closed or inactive customer account is archived, not deleted.
- **Open Questions:**
  1. Should Branch-as-Customer records be excluded from customer-facing KPIs like Repeat Customer Rate, so internal transfers don't inflate retention figures?
  2. Is a natural key (e.g. phone number) formally adopted anywhere? Not confirmed by any document.
  3. Is Loyalty membership its own canonical record, or an attribute carried on the Customer record? Customers master data leaves this open.
