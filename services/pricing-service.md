# Pricing Service

| | |
| --- | --- |
| **Status** | Draft — proposed business responsibility, pending CEO acceptance |
| **Grounded in** | Canonical Data Contract §4 (Price entity), §5 (`PriceChanged` event); Production Architecture §3.5; ADR-0004 Principle 1 (Business First) |

**Note on scope:** Price is not, on its own, a named Enterprise Domain in the Canonical Data Contract's §3 table — this service is scoped around the Price *entity* (§4) specifically, separated from Inventory/Product Service because of its distinct, stricter business rule: Human Approval is required **always**, with no read-only exception, unlike Product or Inventory. This is a documentation choice made in this sprint, named explicitly as an assumption (see services/README.md).

## Responsibilities

- Hold current and, where it exists, historical pricing for a Product — as its own service, separate from Product identity/catalog (Inventory Service), because a price change carries a stricter approval requirement than most other Product-related facts.
- Represent the `PriceChanged` event the Canonical Data Contract already names (§5, Inventory domain events) as a first-class, recorded occurrence — not merely an overwritten field.

## Inputs

- **Price** — the current and historical selling/cost price of a Product (Canonical Contract §4). Authoritative Source: "Buku Toko catalog sheets hold current price; a historical price-change record is not yet reliably populated anywhere."
- **Product** — read-only, for the identity a Price attaches to (owned by Inventory Service, not duplicated here).

## Outputs

- Current price for a given Product, traceable to the canonical Price record and its source.
- A `PriceChanged` event history, only to the extent the underlying source actually holds one — the Contract is explicit that a reliable historical record does not yet exist anywhere, so this output is currently limited by its source, not by this service's design.

## Business Rules

- **Stateless with respect to truth** (Production Architecture §3.5): Pricing Service derives from canonical Price data; it does not decide a new price.
- **Human Approval Required — yes, always** (Canonical Data Contract §6) — the single strictest rule in the entire Ownership Matrix's approval column, with no read-only carve-out. Pricing Service may compute and expose the current price; it never changes one, and nothing downstream may treat its output as authorization to change one either.
- **Business Before Technology** (ADR-0004 Principle 1, Canonical Data Contract §2): a price figure this service exposes exists to serve a real pricing decision already in progress elsewhere in this business (e.g. the margin-floor work referenced in the operations backlog) — this service does not decide pricing policy, it only makes the current, canonical figure visible.
- **Open item this service cannot resolve on its own:** no reliable historical price-change record exists in any source today (Canonical Data Contract §4). Pricing Service's historical output is bounded by that gap, not by anything this document could design around.

## Consumers

Per Production Architecture §2 and Canonical Data Contract §4: Apps Script (target state, catalog display), Dashboard, Inventory Service (Product's pricing reference), Finance Service (cost/margin figures that depend on price), AI Workforce (subject to Human Approval Gate — always, matching the entity's own strictest rule), Reporting Service.

## Future APIs

No API is designed here — this section only names anticipated access needs:

- A way for Inventory Service to read a Product's current price without holding its own copy.
- A way for Dashboard to display current prices without knowing whether the underlying source is the Buku Toko catalog sheet directly.
- A way for AI Workforce to be notified of a `PriceChanged` event once one exists, so a pricing-trend observation could be drafted — always subject to Human Approval before anything derived from it is acted on, matching this entity's always-on approval rule.
