# Customers — Master Data

## Purpose

The master reference for any party TSS, Central Kitchen, or SBGA sells to.

## Ownership

- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Approval Authority:** CEO — "Yes — for any customer-facing action" (Data Governance Framework §2 Ownership Matrix).

## Authoritative Source

Loka POS — named authoritative for exactly this domain in the Canonical Data Contract §4, which confirms Loka's Customer table already holds real branch-as-customer records in practice.

## Lifecycle

Created → Validated → Approved → Consumption → Archive. Never deleted.

## Update Process

UNKNOWN.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN.

## Natural Key

UNKNOWN. Plausibly a phone number, but no document confirms this as the adopted natural key.

## Can records be deleted?

No — per the Never Deleted / Immutable History principle.

## Can records be merged?

UNKNOWN — this would directly matter for reconciling the Branch-as-Customer overlap, but no merge policy is documented.

## Can records be archived?

Yes, in principle, per the general Archive lifecycle stage. No customer-specific process is documented.

## Expected Downstream Systems

CRM domain, Finance (Receivables), Sales & Marketing, the Canonical Data Layer, AI (consumer only).

## Relationship with the Canonical Data Layer

Central to the relationship chain named in the Canonical Data Contract §8: `Customer → Invoice → Payment → Cash → Financial Report`.

## Relationship with the Financial Baseline

The 2026-07-31 baseline's Receivable figure represents amounts owed by specific customers, though the baseline did not separately publish a customer master list — it recorded receivable amounts, not the customer master records behind them.

## Versioning Policy

Standard, per Data Governance Framework §6.

## Known Open Questions

1. How is a Branch-as-Customer distinguished from a genuine retail or wholesale customer in reporting, so the two are never silently combined?
2. Is a formal natural key (e.g. phone number) adopted anywhere?
3. Is Loyalty membership its own record, or an attribute on the Customer record?

---

## Retail Customer

An individual walk-in or ad hoc buyer purchasing directly, generally without a standing account relationship. UNKNOWN whether this is a formally distinguished category in any system today — no document establishes a retail/wholesale flag on the Customer record.

## Wholesale Customer

A customer purchasing in bulk or under negotiated terms, distinct from a walk-in retail sale. UNKNOWN whether this distinction is formally tracked anywhere today.

## Internal Branch-as-Customer

A Sederhana Jaya branch recorded as a Customer for internal goods transfers, not a genuine external sale. This category is confirmed to exist in practice, per the Canonical Data Contract §4, which names it directly as an unresolved overlap between the Branch and Customer entities — this is the one sub-category in this file with real, documented evidence behind it, rather than an inferred possibility.

## Loyalty Member

A customer enrolled in the loyalty points mechanism, per the "Loyalty Ledger" entity named in the Canonical Data Contract §4. UNKNOWN whether Loyalty membership constitutes its own master record or is simply a status/attribute carried on the Customer record.
