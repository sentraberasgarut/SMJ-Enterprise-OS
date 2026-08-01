# Suppliers — Master Data

## Purpose

The master reference for parties TSS or Central Kitchen buy from.

## Ownership

- **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen ingredient suppliers) — per the Canonical Data Contract §4.
- **Technical Owner:** CEO.
- **Approval Authority:** CEO (TSS); Ibu & Teh Nurul (CK) — "No for read/analysis; yes for new agreements" (Data Governance Framework §2 Ownership Matrix).

## Authoritative Source

Loka POS (Supplier table), per the Canonical Data Contract §4.

## Lifecycle

Created → Validated → Approved → Consumption → Archive. Never deleted.

## Update Process

UNKNOWN.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN.

## Natural Key

UNKNOWN.

## Can records be deleted?

No — per the Never Deleted / Immutable History principle.

## Can records be merged?

UNKNOWN.

## Can records be archived?

Yes, in principle. No supplier-specific process is documented.

## Expected Downstream Systems

The Restock/Purchase Order entity, Finance (Payables), the Canonical Data Layer, AI (consumer only).

## Relationship with the Canonical Data Layer

Named in the Canonical Data Contract §8's relationship chain: `Supplier → Restock → Inventory → Product → Invoice`.

## Relationship with the Financial Baseline

The 2026-07-31 baseline's Payable figure represents amounts owed to suppliers — explicitly excluding Ibu's funds, which ADR-0002 establishes as capital, not a supplier-style payable. This exclusion is the single most important rule attached to this dataset's financial relationship.

## Versioning Policy

Standard, per Data Governance Framework §6.

## Known Open Questions

1. Is there one shared supplier master between TSS and Central Kitchen, or two separate lists?
2. What is the natural key?
3. How is a supplier's category (TSS retail vs. CK ingredient) recorded — as a flag on one shared record, or as separate datasets entirely?

---

## Supplier Lifecycle

Proposed shape, not a confirmed existing process: **Onboarded → Active → Inactive → Archived.** UNKNOWN whether this staged lifecycle is practiced today.

## CK Supplier

A supplier providing ingredients or goods to Central Kitchen, falling under Ibu & Teh Nurul's authority per the Canonical Data Contract §4.

## Retail Supplier

A supplier providing goods to TSS retail operations, falling under CEO's authority.

UNKNOWN whether CK and Retail suppliers are tracked as one unified list distinguished by a category attribute, or as entirely separate master datasets — no document specifies this.
