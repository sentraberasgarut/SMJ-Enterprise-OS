"""
inspect_data.py

STEP 1 of the SBGA Data Platform pipeline.

Reads the raw Loka Kasir export, resolves every entity, and produces
docs/01_Data_Inventory.md: for every entity, record count, inferred primary
key, field list with types and null-completeness, candidate relationships
(detected by matching field values against other entities' id sets — never
guessed), and a business-meaning note.

Usage:
    python scripts/inspection/inspect_data.py
"""
from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "parser"))
from realm_resolver import RealmGraph  # noqa: E402

RAW_PATH = ROOT / "raw" / "loka_export.json"
DOCS_DIR = ROOT / "docs"
PROCESSED_DIR = ROOT / "processed"

# Hand-written, domain-informed business meaning for each entity.
# This is knowledge, not inference from the data - written by inspecting
# field names/values, not invented.
BUSINESS_MEANING = {
    "AccessConfig": "Feature-flag / permission toggles for the POS app (e.g. ACCESS: true).",
    "AddStockConfig": "Configuration for how stock additions/restocks behave in the app.",
    "AppPreference": "General app-level user preferences (singleton config).",
    "BasicConfig": "Core app configuration entries (key/value settings).",
    "Cashier": "A cashier/staff login profile who can operate the POS (distinct from Employee).",
    "CommissionRule": "Rules for staff sales commissions. Currently empty (no rules configured).",
    "Customer": "A registered customer, including loyalty point balance.",
    "Discount": "A discount rule/code configured in the POS.",
    "Employee": "Employee master data. Currently empty - staff are tracked via Cashier instead.",
    "EmployeeConfig": "Per-employee configuration entries.",
    "EmployeePosition": "Job position/role definitions for employees. Currently empty.",
    "EntityPlacement": "UI/menu placement configuration. Currently empty.",
    "Expense": "A recorded business expense (name, amount via items[], payment method).",
    "ExtraCost": "An additional cost line type that can be attached to invoices (e.g. delivery fee).",
    "FixedCost": "Recurring fixed cost definitions. Currently empty.",
    "Ingredient": "Raw ingredient master data (for recipe-based products). Currently empty.",
    "IngredientRestockBatch": "Ingredient restock purchase orders. Currently empty.",
    "IngredientRestockPayment": "Payments against ingredient restocks. Currently empty.",
    "InitialCapital": "The starting capital recorded for the business/store.",
    "Invoice": "A sales transaction (the core POS sales record). Has line items, payment, totals.",
    "InvoiceConfig": "Configuration for how invoices/receipts behave.",
    "InvoiceDebt": "A credit/installment sale - an invoice not fully paid at time of sale, with a payment ledger in items[].",
    "InvoiceOrderQueueTemplateConfig": "Template configuration for the order-queue display/printout.",
    "InvoiceReceiptTemplateConfig": "Template configuration for the printed/digital receipt layout.",
    "LoyaltyPoints": "Loyalty program configuration (points earning/redemption rules).",
    "OptionGroup": "Product option groups (e.g. size, add-ons). Currently empty.",
    "OrderQueue": "Order queue / numbering configuration for order-based service.",
    "OrderSetting": "General order-flow settings.",
    "OrderType": "Types of orders the store supports (e.g. dine-in, takeaway).",
    "PaymentMethod": "A payment method accepted by the store (Cash, QRIS, etc.).",
    "PointsHistory": "Ledger of loyalty point earn/redeem events per customer, linked to invoices.",
    "Product": "A sellable product: price, stock, category, unit configuration.",
    "ProductCategory": "Product category taxonomy used to group Products.",
    "ProductIngredientBinding": "Links Products to the Ingredients used to make them (recipes). Currently empty.",
    "ProductRestockBatch": "A stock purchase order from a Supplier - the primary inbound-inventory record.",
    "ProductRestockPayment": "A payment made against a ProductRestockBatch (supports partial/installment payment to suppliers).",
    "Restock": "Legacy/alternate restock record type. Currently empty (superseded by ProductRestockBatch).",
    "SecurityConfig": "Security-related app configuration (PINs, lock settings, etc.).",
    "Shift": "A cashier work session: open/close time, cash reconciliation (initial, actual, difference).",
    "Store": "The store's own profile record (name, address, etc.) - singleton.",
    "Supplier": "A supplier the business purchases stock from.",
    "UnitGroup": "Unit-of-measure group definitions (e.g. Karton containing Botol, with multipliers) used by Products.",
}


def infer_type(val) -> str:
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "bool"
    if isinstance(val, int):
        return "int"
    if isinstance(val, float):
        return "float"
    if isinstance(val, str):
        return "string"
    if isinstance(val, list):
        return "list"
    if isinstance(val, dict):
        return "object"
    return type(val).__name__


def field_profile(records: list[dict]) -> dict:
    """For dict-shaped records, profile every field: types seen + null rate."""
    field_types: dict[str, Counter] = defaultdict(Counter)
    field_nulls: dict[str, int] = defaultdict(int)
    n = len(records)
    for rec in records:
        if not isinstance(rec, dict):
            continue
        for k, v in rec.items():
            field_types[k][infer_type(v)] += 1
            if v is None:
                field_nulls[k] += 1
    profile = {}
    for k in field_types:
        types_seen = ", ".join(f"{t}({c})" for t, c in field_types[k].most_common())
        null_pct = round(100 * field_nulls[k] / n, 1) if n else 0.0
        profile[k] = {"types": types_seen, "null_pct": null_pct}
    return profile


def guess_primary_key(records: list[dict]) -> str:
    if not records or not isinstance(records[0], dict):
        return "(no dict-shaped id field - see notes)"
    if "id" in records[0]:
        ids = [r.get("id") for r in records if isinstance(r, dict)]
        unique = len(set(map(str, ids)))
        if unique == len(ids) and len(ids) > 0:
            return "id (verified unique)"
        return f"id (NOT unique: {unique}/{len(ids)} distinct - flagged)"
    return "(no 'id' field present)"


def build_id_index(all_records: dict[str, list]) -> dict[str, set]:
    """entity -> set of string ids, for relationship detection."""
    idx = {}
    for ent, recs in all_records.items():
        ids = set()
        for r in recs:
            if isinstance(r, dict) and "id" in r and r["id"] is not None:
                ids.add(str(r["id"]))
        idx[ent] = ids
    return idx


def detect_relationships(entity: str, records: list[dict], id_index: dict[str, set]) -> list[str]:
    """For every field across records, check if its values match another
    entity's id set. Only entities with a non-trivial match rate are
    reported - this is evidence-based detection, not a naming guess."""
    if not records:
        return []
    field_values: dict[str, list[str]] = defaultdict(list)
    for r in records:
        if not isinstance(r, dict):
            continue
        for k, v in r.items():
            if isinstance(v, str):
                field_values[k].append(v)
            elif isinstance(v, dict) and "id" in v and isinstance(v["id"], str):
                field_values[k].append(v["id"])
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict) and "id" in item and isinstance(item["id"], str):
                        field_values[f"{k}[].id"].append(item["id"])
                    # also check nested keys ending in Id inside list items
                    if isinstance(item, dict):
                        for ik, iv in item.items():
                            if ik.lower().endswith("id") and isinstance(iv, str):
                                field_values[f"{k}[].{ik}"].append(iv)

    findings = []
    for field, values in field_values.items():
        if not values:
            continue
        for target_entity, id_set in id_index.items():
            if target_entity == entity or not id_set:
                continue
            matches = sum(1 for v in values if v in id_set)
            rate = matches / len(values)
            if matches >= max(1, len(values) * 0.5) and rate >= 0.5:
                findings.append(
                    f"`{field}` -> {target_entity}.id  ({matches}/{len(values)} values matched, {rate:.0%})"
                )
    return findings


def main():
    graph = RealmGraph.load(RAW_PATH)
    entities = graph.entity_names()

    all_records = {ent: graph.get_records(ent) for ent in entities}
    id_index = build_id_index(all_records)

    PROCESSED_DIR.mkdir(exist_ok=True, parents=True)
    with open(PROCESSED_DIR / "resolved_records.json", "w", encoding="utf-8") as f:
        json.dump(all_records, f, indent=2, default=str)

    lines = []
    lines.append("# 01 Data Inventory")
    lines.append("")
    lines.append("**Source:** `raw/loka_export.json` (Loka Kasir Realm export)")
    lines.append(f"**Total entities:** {len(entities)}")
    lines.append(f"**Total records across all entities:** {sum(len(v) for v in all_records.values())}")
    lines.append("")
    lines.append(
        "This inventory is generated entirely from the resolved data - no field "
        "was invented. See `scripts/parser/realm_resolver.py` for the exact "
        "resolution algorithm and its documented, evidence-based assumptions."
    )
    lines.append("")
    lines.append("---")
    lines.append("")

    for ent in entities:
        records = all_records[ent]
        lines.append(f"## {ent}")
        lines.append("")
        lines.append(f"- **Record Count:** {len(records)}")
        lines.append(f"- **Primary Key:** {guess_primary_key(records)}")
        lines.append(f"- **Business Meaning:** {BUSINESS_MEANING.get(ent, '⚠️ Not yet documented - flag for review.')}")
        lines.append("")

        if not records:
            lines.append("_No records present in this export - structure unknown, cannot profile fields._")
            lines.append("")
            lines.append("---")
            lines.append("")
            continue

        if isinstance(records[0], dict):
            profile = field_profile(records)
            lines.append("**Fields:**")
            lines.append("")
            lines.append("| Field | Types Observed | Completeness (non-null) |")
            lines.append("|---|---|---|")
            for field, info in profile.items():
                completeness = 100 - info["null_pct"]
                lines.append(f"| {field} | {info['types']} | {completeness:.1f}% |")
            lines.append("")

            rels = detect_relationships(ent, records, id_index)
            lines.append("**Detected Relationships (evidence-based, matched against other entities' id sets):**")
            lines.append("")
            if rels:
                for r in rels:
                    lines.append(f"- {r}")
            else:
                lines.append("- None detected (no field's values matched another entity's id set at >=50% rate).")
            lines.append("")
        else:
            lines.append(f"_Records are not dict-shaped (type: {infer_type(records[0])}) - see raw sample below._")
            lines.append("")
            lines.append("```json")
            lines.append(json.dumps(records[0], indent=2, default=str)[:500])
            lines.append("```")
            lines.append("")

        lines.append("---")
        lines.append("")

    DOCS_DIR.mkdir(exist_ok=True, parents=True)
    out_path = DOCS_DIR / "01_Data_Inventory.md"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out_path} ({len(entities)} entities profiled)")
    print(f"Wrote {PROCESSED_DIR / 'resolved_records.json'} (full resolved dataset, for downstream steps)")


if __name__ == "__main__":
    main()
