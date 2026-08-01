# Products — Master Data

## Purpose

The master reference for every sellable or stockable item across TSS and Central Kitchen — what a Product is, independent of any one system's representation of it.

## Ownership

- **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen) — per the Canonical Data Contract §4 and Data Governance Framework §2.
- **Technical Owner:** CEO. No dedicated technical/engineering role exists in this organization (Data Governance Framework §2).
- **Approval Authority:** CEO for TSS catalog and price changes; Ibu & Teh Nurul for Central Kitchen (Data Governance Framework §2 Ownership Matrix: "Yes — price and catalog changes").

## Authoritative Source

**Conflicted today, and recorded as such rather than resolved here.** ADR-0003 names Buku Toko as authoritative for "catalog." At the same time, the Canonical Data Contract §4 confirms Loka POS independently maintains its own Product table with its own pricing fields. No document assigns a tiebreaker. This is a direct instance of the "No Duplicate Meaning" violation the Data Governance Framework exists to surface (§7).

## Lifecycle

Created → Validated → Approved → Consumption → Archive. A discontinued product is archived, never deleted, per the Never Deleted / Immutable History principle (Canonical Data Contract §2; Data Governance Framework §4).

## Update Process

UNKNOWN. No document describes who submits a new product, how it is validated, or how a disagreement between Loka's and Buku Toko's product records would be reconciled.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN. No document specifies a canonical Product ID shared across Loka and Buku Toko.

## Natural Key

UNKNOWN.

## Can records be deleted?

No. Per the Never Deleted principle, a product is archived (marked discontinued), never removed.

## Can records be merged?

UNKNOWN. No merge policy is documented — notably including for the Loka-vs-Buku-Toko conflict itself, which would be the first real candidate for a merge/reconciliation process.

## Can records be archived?

Yes, in principle, per the general Archive lifecycle stage. No product-specific archival trigger or process is documented.

## Expected Downstream Systems

Apps Script (Buku Toko), the Canonical Data Layer, Reports, AI (consumer only).

## Relationship with the Canonical Data Layer

Product is a named entity in the Canonical Data Contract, positioned in the relationship chain `Supplier → Restock → Inventory → Product → Invoice` (§8).

## Relationship with the Financial Baseline

The 2026-07-31 baseline's Inventory Value figure came from a physical stock count that implicitly relied on product identity — what was counted — but Product itself was not separately published as a baseline artifact; only the resulting aggregate figure is.

## Versioning Policy

Per Data Governance Framework §6: adding a new product is additive (minor version); changing an existing product's meaning or reassigning its Authoritative Source is a breaking change requiring migration notes.

## Known Open Questions

1. Which system wins when Loka's and Buku Toko's product records disagree?
2. Is there a canonical Product ID intended to span both systems?
3. Are Central Kitchen's products a separate list from TSS's, or a shared catalog with a category flag?

---

## Product Lifecycle

Proposed shape, not a confirmed existing process: **Draft/Proposed → Approved/Active → Discontinued → Archived.** UNKNOWN whether a formal "Draft" stage is practiced today, or whether products currently go straight from creation to active use in either source system.

## SKU Policy

UNKNOWN. No document defines a SKU numbering or coding scheme.

## Branch Availability

UNKNOWN. No document states whether a Product record specifies which branches (TSS, Central Kitchen, Sederhana Jaya branches) it is available at, or whether availability is assumed uniform. This is directly affected by the unresolved Branch/Customer overlap named in the Branches master dataset.

## Pricing Ownership

Pricing is governed as its own master dataset — see [Pricing](../pricing/README.md). A Product record references a price; the *decision* over what that price is belongs to Pricing's ownership, not to Product's.

## Supplier Relationship

Product relates to Supplier through the Restock chain: `Supplier → Restock → Inventory → Product` (Canonical Data Contract §8). UNKNOWN whether a formal "preferred supplier per product" concept exists — no document specifies this.

## Inventory Relationship

Product and Inventory are named as related but distinct entities in the Canonical Data Contract §4: Inventory is "kept distinct from Product," and the Contract notes that no true stock-movement ledger exists today — only a current snapshot. Product answers "what is this item"; Inventory answers "how much of it exists right now," and the two must not be conflated when reasoning about stock levels.
