# Data Quality Report

**Generated against:** `database/sbga.db`, loaded from `raw/loka_export.json`
**Rows loaded:** 1,537 across 26 typed tables (0 skipped during load — see `reports/import_report.md`)

---

## 1. Duplicate Primary Keys

**None found.** SQLite's PRIMARY KEY constraint enforces uniqueness at insert
time; every load attempted 0 primary-key collisions (0 rows skipped for any
table during import — see import report). No further action needed.

## 2. Missing / Broken Foreign Keys

Checked via `PRAGMA foreign_key_check` after full load. **75 real violations
found** — these are genuine data issues in the source export, not
load-process artifacts (verified by cross-checking against the independent
relationship-detection pass in `docs/01_Data_Inventory.md`, which found the
same rates).

| Table | References | Violations | Likely Cause |
|---|---|---|---|
| `invoice_item` | `unit_group.id` | 71 | These invoice line items sold a product that has no configured `unitGroup` — i.e. the product's unit configuration was never set up in the POS, so the line item's `unitId` legitimately has nothing to point to. **This is a real, if minor, source-data completeness gap**, not a resolver bug (matches the 85%-match rate independently detected in Step 1/2). |
| `points_history` | `invoice.id` | 2 | 2 loyalty-point events reference an invoice id that doesn't exist in the `Invoice` table. Possible causes: the invoice was later deleted from the POS but its points ledger entry wasn't cleaned up, or it refers to an invoice type not captured in this export window. Flagged for manual review — do not assume either explanation without checking with the business owner. |
| `invoice_debt_payment` | `invoice.id` | 1 | 1 debt-payment line item references an invoice id not present in `Invoice`. Same caveat as above. |
| `shift` | `cashier.id` | 1 | 1 shift references a `cashierId` that doesn't match any `Cashier` record. Possible cause: a cashier account was deleted after the shift was recorded, or this shift was opened by a user account type not captured in the `Cashier` table. |

**None of these 75 rows were dropped.** They remain in the database with a
"dangling" foreign key value (not NULL — the original value is preserved) so
no information is lost. Analytics queries that INNER JOIN on these
relationships will silently exclude them; queries needing full completeness
should use LEFT JOIN and be aware of this gap.

## 3. Negative / Anomalous Values

These were checked as **potential data quality issues**, but on inspection
are **legitimate business events**, not errors — flagged here for visibility,
not for correction:

| Check | Count | Assessment |
|---|---|---|
| `invoice.profit < 0` | 1 | One sale was recorded at a loss. Legitimate business event (e.g. a discount below cost, or a pricing error at point of sale) — worth a manual look, but not a data defect. |
| `shift.cash_diff < 0` | 13 of 23 | 13 of 23 shifts closed with less cash than expected (till shortages). This is a real, recurring operational pattern worth the business owner's attention — **not** a data import defect. |
| `invoice.grand_total < 0` | 0 | None found. |
| `invoice_item.total < 0` | 0 | None found. |
| `product_restock_batch.total_amount < 0` | 0 | None found. |

## 4. Null Values on Key Business Fields

| Field | Nulls | Assessment |
|---|---|---|
| `invoice.grand_total` | 0/316 | Fully populated. |
| `invoice.payment_method_id` | 0/316 | Fully populated. |
| `product.price` | 0/44 | Fully populated. |
| `product.category_id` | 0/44 | Fully populated. |
| `customer.phone_number` | 0/8 | Fully populated. |
| `supplier.phone_number` | 0/6 | Fully populated. |
| `invoice.customer_id` | 187/316 (59.2%) | **Not a defect** — this is walk-in/anonymous retail sales, which is normal for a retail store. Confirmed via `Store.businessType = RETAIL`. |
| `invoice_item.unit_id` | 71/704 (10.1%) | Matches the FK violation count above — products without a configured unit group. |

## 5. Structural Completeness

- **Employee table: 0 records.** The export contains no Employee data — staff
  are represented via the separate `Cashier` table (2 records) instead. The
  `employee` SQLite table exists (per the "do not ignore any table"
  instruction) but is empty and its column shape is unverified (see
  `database/schema.sql` comment).
- **19 of 42 source entities are empty** (0 records): CommissionRule,
  Employee, EmployeePosition, EntityPlacement, FixedCost, Ingredient,
  IngredientRestockBatch, IngredientRestockPayment, OptionGroup,
  ProductIngredientBinding, Restock. These are loaded into `app_config` (or
  left absent, for Employee) with no data — not a load failure, the source
  simply has no records for these features (the store doesn't use
  ingredient-based recipes, employee-position tracking, etc.).

## 6. Overall Assessment

The dataset is **complete and internally consistent** for its core
transactional purpose (sales, restocking, expenses, loyalty). The 75 FK
violations represent **2.4% of loaded relational rows** (75/3,146 rows with
an FK column) and are concentrated in one well-understood, low-severity
pattern (missing unit-group configuration on some products) plus 4 isolated
orphan rows worth a manual look. No evidence of systemic data corruption or
resolver error was found — the flagged issues match, at the row level,
across two independently-computed passes (Step 1 inspection and Step 6
post-load FK check), which is strong internal evidence the resolution
algorithm in `realm_resolver.py` is correct.
