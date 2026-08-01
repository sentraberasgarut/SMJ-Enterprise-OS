# Taxonomy — Master Data

## Purpose

To define the category structure used to classify Products for reporting, pricing, and margin analysis.

**Named here for the same reason as Chart of Accounts and UOM: the business clearly categorizes products in practice, but no document formally defines a governed category structure as its own dataset.**

## Ownership

- **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen) — inferred by extension of Product ownership. Not confirmed by any document specifically addressing Taxonomy.
- **Technical Owner:** CEO.
- **Approval Authority:** UNKNOWN.

## Authoritative Source

UNKNOWN. The Canonical Data Contract §4 discusses Product's category only as part of Product's own conflicted sourcing — it does not name a separate "Taxonomy" or "Category" entity with its own Authoritative Source.

## Lifecycle

UNKNOWN.

## Update Process

UNKNOWN.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN.

## Natural Key

UNKNOWN.

## Can records be deleted?

If this dataset comes to exist, no — consistent with the Never Deleted principle applied elsewhere in this framework, stated as a consequence of that principle rather than a confirmed policy specific to this dataset.

## Can records be merged?

UNKNOWN.

## Can records be archived?

UNKNOWN.

## Expected Downstream Systems

Product, Reports (margin-by-category analysis), the Canonical Data Layer, AI (consumer only).

## Relationship with the Canonical Data Layer

Not separately named as its own entity in the Canonical Data Contract. Product's category is mentioned there only as part of Product's own conflicted sourcing (§4), not as an independently governed Taxonomy.

## Relationship with the Financial Baseline

None documented directly. The baseline's Inventory Value figure is an aggregate and does not confirm whether or how category breakdowns were used in producing it.

## Versioning Policy

Standard, per Data Governance Framework §6, if and when this dataset is formally adopted.

## Known Open Questions

This entire dataset's formal existence, structure, and ownership are UNKNOWN. No document read for this framework treats category/taxonomy as a governed entity distinct from Product itself — this file names the gap, it does not close it.
