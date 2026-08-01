# Unit of Measure (UOM) — Master Data

## Purpose

To define the units (for example, piece, kilogram, carton) in which Products are measured, priced, and stocked, and the conversions between units of the same product.

**As with Chart of Accounts, this dataset is named here because Product, Pricing, and Inventory cannot be reported consistently without it — not because any document already defines it.** No document in this framework's read-set names "Unit of Measure" as an existing entity.

## Ownership

- **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen) — inferred by extension of Product ownership, since units are meaningless without a product to attach them to. This inference is stated as such, not presented as a confirmed fact — no document addresses UOM ownership directly.
- **Technical Owner:** CEO.
- **Approval Authority:** UNKNOWN.

## Authoritative Source

UNKNOWN. No document names a system authoritative for unit definitions or conversions.

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

Product, Pricing, Inventory, the Canonical Data Layer, AI (consumer only).

## Relationship with the Canonical Data Layer

Not a named entity in the Canonical Data Contract today. If formally adopted, it would be introduced through that document's additive versioning path (§9).

## Relationship with the Financial Baseline

Inventory Value in the baseline implicitly depends on consistent units for its figures to be summed meaningfully, but no document formalizes this dependency or confirms what units were actually used.

## Versioning Policy

Standard, per Data Governance Framework §6, if and when this dataset is formally adopted.

## Known Open Questions

This entire dataset's existence, ownership, and mechanics are UNKNOWN beyond the implied need described above. No document read for this framework addresses Unit of Measure at all.
