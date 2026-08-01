# Inventory Service

| | |
| --- | --- |
| **Status** | Draft — proposed business responsibility, pending CEO acceptance |
| **Grounded in** | Canonical Data Contract §3 (Inventory domain), §4 (Inventory, Product, Supplier entities), §5 (`InventoryAdjusted`, `RestockReceived` events), §8 (Relationship Model); Production Architecture §3.5 |

## Responsibilities

- Compute current stock position per Product, per location, from canonical data — once, rather than separately inside Apps Script's catalog logic and any future Dashboard stock card.
- Track the relationship chain the Canonical Data Contract already names (§8): `Supplier → Restock → Inventory → Product → Invoice` — goods enter through a supplier relationship, change inventory levels, are represented as a Product, and are eventually sold.
- Surface the Central Kitchen catalog pricing gap already named in ADR-0003 (§2) — "130+ Central Kitchen catalog items at `Harga = 0` mean every report built on CK shipments is wrong by construction" — as a visible condition of this service's output, not a silently absorbed error.

## Inputs

- **Inventory** — quantity of a Product on hand, per location (Canonical Contract §4). **Unresolved today**: "Loka's stock-movement ledger exists as a schema but holds zero records — no system currently holds a true history, only a current snapshot."
- **Product** — the sellable/stockable item and its identity, category, and pricing reference. **Conflicted today**: Buku Toko is named authoritative for "catalog" (ADR-0003), but Loka independently maintains its own Product table with its own pricing fields.
- **Supplier** — any party TSS/CK buys from (Loka POS `Supplier` table).

## Outputs

- Current stock level per Product, per location, traceable to the canonical Inventory and Product records behind it.
- A named list of Products whose Authoritative Source is still Conflicted (inherited directly, not resolved by this service) or whose price is Rp0 due to the known CK catalog gap — surfaced, not hidden.
- Restock-related figures, where derivable from canonical data, per the Supplier → Restock → Inventory chain.

## Business Rules

- **Stateless with respect to truth** (Production Architecture §3.5): Inventory Service derives from canonical Inventory/Product/Supplier data; it does not originate a stock fact of its own.
- **Human Approval Required — yes, for adjustments** (Canonical Data Contract §6): Inventory Service may compute and expose a stock position; any adjustment to that position remains a human (CEO, or Ibu & Teh Nurul for Central Kitchen) decision, never an automatic write.
- **Central Kitchen catalog and inventory sit under Ibu & Teh Nurul's authority** (Canonical Data Contract §4, §6) — Inventory Service's output for CK-scoped Products carries that ownership, distinct from TSS-scoped Products under the CEO.
- **Open item this service cannot resolve on its own:** the Inventory entity's own Authoritative Source is Unresolved — no system holds a true movement history today, only a current snapshot (Canonical Data Contract §4). Any figure Inventory Service computes that depends on historical movement (not just current stock) is not currently possible from canonical data as it stands.
- **Open item:** "Restock" appears only in the Canonical Data Contract's Relationship Model (§8) as a step in a chain — it is not itself a formally defined canonical entity in §4. Inventory Service's Restock-related outputs are scoped only as far as that relationship chain, not as far as a defined Restock entity, because none exists yet.
- **Open item:** Product's Authoritative Source conflict (Buku Toko catalog vs. Loka's own Product table) is inherited, not resolved, by this service — an inventory figure for a given Product may disagree depending on which source it was ultimately traced to, until the Canonical Data Contract's own open item is closed.

## Consumers

Per Production Architecture §2 and Canonical Data Contract §4: Apps Script (target state, for catalog/restock workflows), Dashboard (stock alerts, per Production Architecture's Production Readiness Matrix naming "Stock Alerts" as a still-missing canonical coverage item), AI Workforce (for flagging anomalies, e.g. unexpectedly low stock — subject to Human Approval Gate), Reporting Service.

## Future APIs

No API is designed here — this section only names anticipated access needs:

- A way for Dashboard to ask for a current stock alert list (Products below a threshold), without knowing whether the underlying figure came from Loka or Buku Toko.
- A way for Apps Script to request current stock for a Product at restock time, rather than reading its own catalog sheet directly.
- A way for AI Workforce to be notified when a Product's Authoritative Source conflict actually produces two disagreeing figures, so it can be flagged for human review rather than silently picking one.
