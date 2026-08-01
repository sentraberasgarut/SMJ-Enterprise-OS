# Branches — Master Data

## Purpose

The master reference for physical fulfillment points — Toko Sembako Sejahtera, Central Kitchen, and the Sederhana Jaya branches — that receive goods and, in some cases, are also recorded as customers.

## Ownership

- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Approval Authority:** CEO — "No for read; yes for structural changes" (Data Governance Framework §2 Ownership Matrix).

## Authoritative Source

Buku Toko (unit definitions), per the Canonical Data Contract §4. That same document names an unresolved overlap: a Branch is "sometimes also recorded as a Customer" and this is flagged as "a named open item, not yet resolved" — this master dataset records that conflict rather than resolving it.

## Lifecycle

Created → Validated → Approved → Consumption → Archive. Never deleted.

## Update Process

UNKNOWN.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN. No document in this framework's read-set formally defines a Branch identifier scheme.

## Natural Key

UNKNOWN.

## Can records be deleted?

No — per the Never Deleted / Immutable History principle.

## Can records be merged?

UNKNOWN. A merge question here would specifically concern the Branch/Customer overlap — no policy is documented for it.

## Can records be archived?

Yes, in principle, per the general Archive lifecycle stage. No branch-specific process is documented.

## Expected Downstream Systems

Product/Restock (as a goods recipient), Invoice (as a customer), the Canonical Data Layer, AI (consumer only).

## Relationship with the Canonical Data Layer

The Canonical Data Contract §8 names this relationship explicitly and deliberately as two separate arrows, because a Branch plays two roles at once:

```
Branch → Invoice (as Customer)
Branch → Restock (as recipient)
```

## Relationship with the Financial Baseline

The 2026-07-31 baseline is explicitly scoped to TSS only — its own Manifest states: "This baseline does not cover Central Kitchen, SBGA, or any other business unit." Branch records for Central Kitchen and the Sederhana Jaya branches therefore fall outside the baseline's direct scope, though TSS's Receivable figure in the baseline may include amounts owed by branches acting as B2B customers.

## Versioning Policy

Standard, per Data Governance Framework §6 — additive for new branches, breaking-change process for anything that reassigns a Branch's Authoritative Source or role.

## Known Open Questions

1. Is Branch a genuinely distinct entity from Customer, or should the overlap eventually be formally merged?
2. What uniquely identifies a Branch?
3. Does Central Kitchen have its own Branch record, distinct from TSS's, or is it represented differently altogether?
