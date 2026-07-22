"""
import_json.py

STEP 4-5 of the SBGA Data Platform pipeline.

Reads raw/loka_export.json, resolves it via realm_resolver, validates each
record, and loads it into database/sbga.db per database/schema.sql.

Design:
- Idempotent / rerunnable: drops and recreates all tables from schema.sql
  on every run (this is a small, file-based export snapshot, not a live
  incremental feed - full-refresh is the correct and simplest strategy).
- Invalid rows are logged and skipped, never silently dropped and never
  crash the whole import.
- No row is ever deleted from the *source* - only load-time validation
  failures are skipped from the *target* database, and every skip is logged.

Usage:
    python scripts/parser/import_json.py
"""
from __future__ import annotations

import json
import logging
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "parser"))
from realm_resolver import RealmGraph  # noqa: E402

RAW_PATH = ROOT / "raw" / "loka_export.json"
SCHEMA_PATH = ROOT / "database" / "schema.sql"
DB_PATH = ROOT / "database" / "sbga.db"
LOG_PATH = ROOT / "logs" / "import.log"
REPORT_PATH = ROOT / "reports" / "import_report.md"

LOG_PATH.parent.mkdir(exist_ok=True, parents=True)
REPORT_PATH.parent.mkdir(exist_ok=True, parents=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH, mode="w", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("import_json")

# Entities loaded generically into app_config (see schema.sql for rationale)
GENERIC_CONFIG_ENTITIES = [
    "AccessConfig", "AddStockConfig", "AppPreference", "BasicConfig",
    "CommissionRule", "EmployeeConfig", "EmployeePosition", "EntityPlacement",
    "ExtraCost", "FixedCost", "Ingredient", "IngredientRestockBatch",
    "IngredientRestockPayment", "InvoiceConfig",
    "InvoiceOrderQueueTemplateConfig", "InvoiceReceiptTemplateConfig",
    "OptionGroup", "OrderQueue", "OrderSetting", "ProductIngredientBinding",
    "Restock", "SecurityConfig",
]


def to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        try:
            return float(v)
        except ValueError:
            return None
    return None


def to_int(v: Any) -> Optional[int]:
    f = to_float(v)
    return int(f) if f is not None else None


def get_id(v: Any) -> Optional[str]:
    """Extract an id from a value that may be: None, a plain id string, or
    an embedded/denormalized dict snapshot containing an 'id' key."""
    if v is None:
        return None
    if isinstance(v, dict):
        return v.get("id")
    if isinstance(v, str):
        return v
    return None


class Importer:
    def __init__(self):
        self.graph = RealmGraph.load(RAW_PATH)
        self.records = {ent: self.graph.get_records(ent) for ent in self.graph.entity_names()}
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.execute("PRAGMA foreign_keys = OFF")  # loaded first, verified after
        self.stats: dict[str, dict[str, int]] = {}
        self.skipped: list[str] = []

    def reset_schema(self):
        if DB_PATH.exists():
            DB_PATH.unlink()
            log.info(f"Removed existing {DB_PATH} for full-refresh reload")
        self.conn = sqlite3.connect(DB_PATH)
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            self.conn.executescript(f.read())
        self.conn.commit()
        # schema.sql sets PRAGMA foreign_keys = ON for production use, but
        # during bulk load we insert tables in dependency order and want
        # skip-and-log behavior to reflect REAL data quality issues (caught
        # explicitly in Step 6 validation), not load-order artifacts. FK
        # integrity is verified explicitly after load via PRAGMA
        # foreign_key_check (see verify_foreign_keys()).
        self.conn.execute("PRAGMA foreign_keys = OFF")
        log.info("Schema created from database/schema.sql (FK enforcement deferred to explicit post-load check)")

    def _track(self, table: str, ok: bool):
        s = self.stats.setdefault(table, {"attempted": 0, "loaded": 0, "skipped": 0})
        s["attempted"] += 1
        if ok:
            s["loaded"] += 1
        else:
            s["skipped"] += 1

    def _insert(self, table: str, columns: list[str], values: tuple, source_entity: str, source_id: Any):
        try:
            placeholders = ", ".join("?" for _ in columns)
            col_list = ", ".join(columns)
            self.conn.execute(f"INSERT INTO {table} ({col_list}) VALUES ({placeholders})", values)
            self._track(table, True)
        except sqlite3.Error as e:
            self._track(table, False)
            msg = f"SKIPPED {source_entity} (id={source_id}) -> {table}: {e}"
            log.warning(msg)
            self.skipped.append(msg)

    # ---- master data -------------------------------------------------

    def load_store(self):
        for r in self.records["Store"]:
            self._insert(
                "store", ["id", "name", "address", "image_path", "footnote", "business_type"],
                (r.get("id"), r.get("name"), r.get("address"), r.get("imagePath"), r.get("footnote"), r.get("businessType")),
                "Store", r.get("id"),
            )

    def load_payment_method(self):
        for r in self.records["PaymentMethod"]:
            self._insert(
                "payment_method",
                ["id", "name", "image_id", "icon", "icon_color", "removeable", "is_default", "image_path", "extra_step", "note"],
                (r.get("id"), r.get("name"), r.get("imageId"), r.get("icon"), r.get("iconColor"),
                 r.get("removeable"), r.get("default"), r.get("imagePath"), r.get("extraStep"), r.get("note")),
                "PaymentMethod", r.get("id"),
            )

    def load_product_category(self):
        for r in self.records["ProductCategory"]:
            self._insert("product_category", ["id", "text"], (r.get("id"), r.get("text")), "ProductCategory", r.get("id"))

    def load_unit_group(self):
        for r in self.records["UnitGroup"]:
            self._insert(
                "unit_group", ["id", "name", "base_unit_id", "created_time"],
                (r.get("id"), r.get("name"), r.get("baseUnitId"), r.get("createdTime")),
                "UnitGroup", r.get("id"),
            )
            for u in r.get("units") or []:
                self._insert(
                    "unit_group_unit", ["unit_group_id", "unit_id", "name", "multiplier", "is_base"],
                    (r.get("id"), u.get("id"), u.get("name"), to_float(u.get("multiplier")), u.get("isBase")),
                    "UnitGroup.units[]", f"{r.get('id')}/{u.get('id')}",
                )

    def load_product(self):
        for r in self.records["Product"]:
            self._insert(
                "product",
                ["id", "name", "image_path", "category_id", "price", "capital_price", "stock", "code",
                 "is_favorite", "unit_group_id", "stock_alert", "description", "created_time"],
                (r.get("id"), r.get("name"), r.get("imagePath"), get_id(r.get("category")),
                 to_float(r.get("price")), to_float(r.get("capitalPrice")), to_float(r.get("stock")),
                 r.get("code"), r.get("isFavorite"), get_id(r.get("unitGroup")),
                 to_float(r.get("stockAlert")), r.get("description"), r.get("createdTime")),
                "Product", r.get("id"),
            )

    def load_customer(self):
        for r in self.records["Customer"]:
            self._insert(
                "customer",
                ["id", "name", "avatar_id", "phone_number", "address", "email", "birth_date", "join_date", "loyalty_points"],
                (r.get("id"), r.get("name"), r.get("avatarId"), r.get("phoneNumber"), r.get("address"),
                 r.get("email"), r.get("birthDate"), r.get("joinDate"), to_float(r.get("loyaltyPoints"))),
                "Customer", r.get("id"),
            )

    def load_supplier(self):
        for r in self.records["Supplier"]:
            self._insert(
                "supplier", ["id", "name", "phone_number", "email", "address", "contact_person", "notes", "join_date"],
                (r.get("id"), r.get("name"), r.get("phoneNumber"), r.get("email"), r.get("address"),
                 r.get("contactPerson"), r.get("notes"), r.get("joinDate")),
                "Supplier", r.get("id"),
            )

    def load_cashier(self):
        for r in self.records["Cashier"]:
            self._insert(
                "cashier", ["id", "name", "avatar_id", "pin", "phone_number", "role", "created_time", "power_user"],
                (r.get("id"), r.get("name"), r.get("avatarId"), r.get("pin"), r.get("phoneNumber"),
                 r.get("role"), r.get("createdTime"), r.get("powerUser")),
                "Cashier", r.get("id"),
            )

    def load_employee(self):
        for r in self.records["Employee"]:
            rid = r.get("id") if isinstance(r, dict) else None
            self._insert("employee", ["id", "raw_json"], (rid, json.dumps(r, default=str)), "Employee", rid)

    def load_order_type(self):
        for r in self.records["OrderType"]:
            self._insert(
                "order_type", ["id", "name", "is_default", "icon"],
                (r.get("id"), r.get("name"), r.get("isDefault"), r.get("icon")),
                "OrderType", r.get("id"),
            )

    def load_discount(self):
        for r in self.records["Discount"]:
            self._insert(
                "discount", ["id", "default_value", "type"],
                (r.get("id"), to_float(r.get("defaultValue")), r.get("type")),
                "Discount", r.get("id"),
            )

    def load_extra_cost_config(self):
        for r in self.records["ExtraCost"]:
            self._insert(
                "extra_cost_config", ["id", "name", "default_value", "type", "is_default"],
                (r.get("id"), r.get("name"), to_float(r.get("defaultValue")), r.get("type"), r.get("default")),
                "ExtraCost", r.get("id"),
            )

    def load_initial_capital(self):
        for r in self.records["InitialCapital"]:
            rid = r.get("id") if isinstance(r, dict) else None
            self._insert("initial_capital", ["id", "raw_json"], (rid, json.dumps(r, default=str)), "InitialCapital", rid)

    def load_loyalty_points_config(self):
        for r in self.records["LoyaltyPoints"]:
            rid = r.get("id") if isinstance(r, dict) else None
            self._insert("loyalty_points_config", ["id", "raw_json"], (rid, json.dumps(r, default=str)), "LoyaltyPoints", rid)

    # ---- sales ---------------------------------------------------------

    def load_invoice(self):
        for r in self.records["Invoice"]:
            inv_id = r.get("id")
            self._insert(
                "invoice",
                ["id", "sub_total", "grand_total", "capital_sub_total", "discount", "discount_percentage",
                 "pay_date", "invoice_date", "cashier_name", "status", "changeover", "total_payment",
                 "profit", "customer_id", "scheduled_date", "queue", "note", "points_redeemed",
                 "points_redemption_value", "order_type", "customer_name", "payment_method_id"],
                (inv_id, to_float(r.get("subTotal")), to_float(r.get("grandTotal")), to_float(r.get("capitalSubTotal")),
                 to_float(r.get("discount")), to_float(r.get("discountPercentage")), r.get("payDate"), r.get("date"),
                 r.get("cashier"), r.get("status"), r.get("changeover"), to_float(r.get("totalPayment")),
                 to_float(r.get("profit")), get_id(r.get("customer")), r.get("scheduledDate"), to_int(r.get("queue")),
                 r.get("note"), to_float(r.get("pointsRedeemed")), to_float(r.get("pointsRedemptionValue")),
                 r.get("orderType"), r.get("customerName"), get_id(r.get("paymentMethod"))),
                "Invoice", inv_id,
            )
            for item in r.get("items") or []:
                self._insert(
                    "invoice_item",
                    ["invoice_id", "product_id", "name", "price", "capital_price", "quantity", "total",
                     "discount", "note", "category_id", "unit_name", "unit_id", "unit_multiplier", "variant"],
                    (inv_id, item.get("productId"), item.get("name"), to_float(item.get("price")),
                     to_float(item.get("capitalPrice")), to_float(item.get("quantity")), to_float(item.get("total")),
                     to_float(item.get("discount")), item.get("note"), get_id(item.get("category")),
                     item.get("unit"), item.get("unitId"), to_float(item.get("unitMultiplier")),
                     json.dumps(item.get("variant"), default=str) if item.get("variant") else None),
                    "Invoice.items[]", inv_id,
                )
            for ec in r.get("extraCosts") or []:
                self._insert("invoice_extra_cost", ["invoice_id", "raw_json"], (inv_id, json.dumps(ec, default=str)), "Invoice.extraCosts[]", inv_id)
            for sp in r.get("splitPayments") or []:
                self._insert("invoice_split_payment", ["invoice_id", "raw_json"], (inv_id, json.dumps(sp, default=str)), "Invoice.splitPayments[]", inv_id)

    def load_invoice_debt(self):
        for r in self.records["InvoiceDebt"]:
            debt_id = r.get("id")
            self._insert(
                "invoice_debt",
                ["id", "grand_total", "debt_date", "cashier_name", "status", "changeover",
                 "total_payment", "customer_id", "payment_method_id"],
                (debt_id, to_float(r.get("grandTotal")), r.get("date"), r.get("cashier"), r.get("status"),
                 r.get("changeover"), to_float(r.get("totalPayment")), get_id(r.get("customer")), get_id(r.get("paymentMethod"))),
                "InvoiceDebt", debt_id,
            )
            for item in r.get("items") or []:
                self._insert(
                    "invoice_debt_payment",
                    ["invoice_debt_id", "invoice_id", "total", "payment_date", "status", "remaining", "grand_total"],
                    (debt_id, item.get("invoiceId"), to_float(item.get("total")), item.get("date"),
                     item.get("status"), to_float(item.get("remaining")), to_float(item.get("grandTotal"))),
                    "InvoiceDebt.items[]", debt_id,
                )

    def load_points_history(self):
        for r in self.records["PointsHistory"]:
            self._insert(
                "points_history",
                ["id", "customer_id", "type", "points", "invoice_id", "description", "created_at",
                 "order_at", "earned_on", "expiration_date", "status"],
                (r.get("id"), r.get("customerId"), r.get("type"), to_float(r.get("points")), r.get("invoiceId"),
                 r.get("description"), r.get("createdAt"), r.get("orderAt"), r.get("earnedOn"),
                 r.get("expirationDate"), r.get("status")),
                "PointsHistory", r.get("id"),
            )

    def load_expense(self):
        for r in self.records["Expense"]:
            exp_id = r.get("id")
            self._insert(
                "expense", ["id", "name", "note", "expense_date", "payment_method_id", "payment_method_name"],
                (exp_id, r.get("name"), r.get("note"), r.get("date"), r.get("paymentMethodId"), r.get("paymentMethodName")),
                "Expense", exp_id,
            )
            for item in r.get("items") or []:
                self._insert(
                    "expense_item", ["expense_id", "name", "price"],
                    (exp_id, item.get("name"), to_float(item.get("price"))),
                    "Expense.items[]", exp_id,
                )

    def load_product_restock_batch(self):
        for r in self.records["ProductRestockBatch"]:
            batch_id = r.get("id")
            self._insert(
                "product_restock_batch",
                ["id", "batch_date", "cashier_name", "status", "supplier_id", "total_amount",
                 "payment_status", "paid_amount", "paid_date", "reference_id"],
                (batch_id, r.get("date"), r.get("cashier"), r.get("status"), r.get("supplierId"),
                 to_float(r.get("totalAmount")), r.get("paymentStatus"), to_float(r.get("paidAmount")),
                 r.get("paidDate"), r.get("referenceId")),
                "ProductRestockBatch", batch_id,
            )
            for item in r.get("items") or []:
                self._insert(
                    "product_restock_batch_item",
                    ["batch_id", "product_id", "variant_id", "product_name", "quantity", "note", "capital_price", "received_quantity"],
                    (batch_id, item.get("productId"), item.get("variantId"), item.get("productName"),
                     to_float(item.get("quantity")), item.get("note"), to_float(item.get("capitalPrice")),
                     to_float(item.get("receivedQuantity"))),
                    "ProductRestockBatch.items[]", batch_id,
                )

    def load_product_restock_payment(self):
        for r in self.records["ProductRestockPayment"]:
            self._insert(
                "product_restock_payment", ["id", "batch_id", "payment_date", "amount", "payment_method_id"],
                (r.get("id"), r.get("batchId"), r.get("date"), to_float(r.get("amount")), r.get("paymentMethodId")),
                "ProductRestockPayment", r.get("id"),
            )

    def load_shift(self):
        for r in self.records["Shift"]:
            self._insert(
                "shift",
                ["id", "cashier_id", "cashier_name", "open_time", "close_time", "initial_cash", "actual_cash", "cash_diff", "cash_in_hand"],
                (r.get("id"), r.get("cashierId"), r.get("cashierName"), r.get("openTime"), r.get("closeTime"),
                 to_float(r.get("initialCash")), to_float(r.get("actualCash")), to_float(r.get("cashDiff")), to_float(r.get("cashInHand"))),
                "Shift", r.get("id"),
            )

    # ---- generic config -------------------------------------------------

    def load_generic_config(self):
        for entity in GENERIC_CONFIG_ENTITIES:
            for idx, r in enumerate(self.records.get(entity, [])):
                self._insert(
                    "app_config", ["entity_name", "record_index", "raw_json"],
                    (entity, idx, json.dumps(r, default=str)),
                    entity, idx,
                )

    def run(self):
        self.reset_schema()
        loaders = [
            self.load_store, self.load_payment_method, self.load_product_category,
            self.load_unit_group, self.load_product, self.load_customer, self.load_supplier,
            self.load_cashier, self.load_employee, self.load_order_type, self.load_discount,
            self.load_extra_cost_config, self.load_initial_capital, self.load_loyalty_points_config,
            self.load_invoice, self.load_invoice_debt, self.load_points_history, self.load_expense,
            self.load_product_restock_batch, self.load_product_restock_payment, self.load_shift,
            self.load_generic_config,
        ]
        for loader in loaders:
            loader()
            self.conn.commit()
        log.info("Import complete.")
        self.verify_foreign_keys()
        self.write_report()

    def verify_foreign_keys(self):
        rows = self.conn.execute("PRAGMA foreign_key_check").fetchall()
        self.fk_violations = rows  # (table, rowid, referenced_table, fkid)
        if rows:
            log.warning(f"{len(rows)} foreign key violations found (real orphans - see reports/data_quality_report.md)")
        else:
            log.info("No foreign key violations found.")

    def write_report(self):
        lines = ["# Import Report", "", f"**Run at:** {datetime.now(timezone.utc).isoformat()}", "",
                 "| Table | Attempted | Loaded | Skipped |", "|---|---|---|---|"]
        total_attempted = total_loaded = total_skipped = 0
        for table, s in sorted(self.stats.items()):
            lines.append(f"| {table} | {s['attempted']} | {s['loaded']} | {s['skipped']} |")
            total_attempted += s["attempted"]
            total_loaded += s["loaded"]
            total_skipped += s["skipped"]
        lines.append(f"| **TOTAL** | **{total_attempted}** | **{total_loaded}** | **{total_skipped}** |")
        lines.append("")
        if self.skipped:
            lines.append("## Skipped Rows (see logs/import.log for full detail)")
            lines.append("")
            for msg in self.skipped[:50]:
                lines.append(f"- {msg}")
            if len(self.skipped) > 50:
                lines.append(f"- ... and {len(self.skipped) - 50} more (see logs/import.log)")
        else:
            lines.append("No rows were skipped.")
        REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
        log.info(f"Wrote {REPORT_PATH}")


if __name__ == "__main__":
    importer = Importer()
    importer.run()
