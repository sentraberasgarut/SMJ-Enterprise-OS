# Pricing — Master Data

## Purpose

The master reference for current and historical selling and cost prices of Products.

## Ownership

- **Business Owner:** CEO — per the Canonical Data Contract §4. That document does not extend Central Kitchen's Ibu & Teh Nurul ownership to Price specifically, even though it does for Product, Supplier, and Inventory — this asymmetry is preserved here rather than smoothed over, and is listed below as an open question.
- **Technical Owner:** CEO.
- **Approval Authority:** CEO — "Yes — always" (Data Governance Framework §2 Ownership Matrix).

## Authoritative Source

Buku Toko catalog sheets hold the current price (Canonical Data Contract §4). A historical price-change record is "not yet reliably populated anywhere," per the same source.

## Lifecycle

Created → Validated → Approved → Consumption → Archive. A price change should produce a new, dated record rather than overwrite the old one, consistent with Immutable History — whether this is actually practiced today is UNKNOWN.

## Update Process

UNKNOWN.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN.

## Natural Key

UNKNOWN. Plausibly Product ID plus effective date, but not confirmed by any document.

## Can records be deleted?

No — a superseded price is archived as history, never deleted, per the Never Deleted principle.

## Can records be merged?

UNKNOWN.

## Can records be archived?

Yes, in principle — a superseded price should be retained as history. No specific process is documented.

## Expected Downstream Systems

Product, Finance, the Canonical Data Layer, AI (consumer only).

## Relationship with the Canonical Data Layer

Price feeds Product's pricing attribute, per the Canonical Data Contract §4 and §8.

## Relationship with the Financial Baseline

Prices in effect on 31 July 2026 implicitly underlie the Inventory Value figure in the baseline (stock valued at cost), but Price itself was not separately published as a baseline artifact.

## Versioning Policy

Standard, per Data Governance Framework §6. A price change is itself named as a business event — `PriceChanged` — in the Canonical Data Contract §5.

## Known Open Questions

1. Does Central Kitchen pricing fall under Ibu & Teh Nurul's authority, the same way CK Product, Inventory, and Supplier ownership do? No document states this explicitly for Price — it is genuinely open, not assumed either way.
2. Is a historical price-change ledger actually maintained anywhere today, or only a current price?
3. What is the natural key?
