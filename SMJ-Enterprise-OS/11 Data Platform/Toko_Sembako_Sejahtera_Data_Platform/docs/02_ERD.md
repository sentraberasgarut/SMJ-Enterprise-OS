# 02 Entity Relationship Diagram

**Method:** Every relationship below was detected by matching a field's actual
values against another entity's real `id` set (see `docs/01_Data_Inventory.md`
for match counts/rates). Nothing here was guessed from field naming alone.

**Source store profile (from `Store` entity):** "Toko Sembako Sejahtera" —
Garut, RETAIL business type. This confirms the export is real retail POS data
from SBGA's storefront operation.

---

## Confirmed Relationships (used in schema.sql)

```
Customer (1) ──< Invoice (many)                  via Invoice.customer.id
                                                   [only 129/316 invoices have a
                                                    customer — 40.8%; the rest
                                                    are walk-in/anonymous sales]

Customer (1) ──< InvoiceDebt (many)              via InvoiceDebt.customer.id  (100%)

Customer (1) ──< PointsHistory (many)            via PointsHistory.customerId (100%)

Invoice (1) ──< PointsHistory (many)             via PointsHistory.invoiceId (97%;
                                                   2 orphan rows - flagged in
                                                   data quality report)

Invoice (1) ──< InvoiceDebtPayment (many)        via InvoiceDebt.items[].invoiceId
                                                   (99%; 1 orphan row flagged)

PaymentMethod (1) ──< Invoice (many)             via Invoice.paymentMethod.id (100%)
PaymentMethod (1) ──< InvoiceDebt (many)         via InvoiceDebt.paymentMethod.id (100%)
PaymentMethod (1) ──< Expense (many)             via Expense.paymentMethodId (100%)
PaymentMethod (1) ──< ProductRestockPayment (many) via ProductRestockPayment.paymentMethodId (100%)

Product (1) ──< InvoiceItem (many)               via Invoice.items[].productId (100%)
Product (1) ──< ProductRestockBatchItem (many)    via ProductRestockBatch.items[].productId (100%)

ProductCategory (1) ──< Product (many)           via Product.category.id (100%)
UnitGroup (1) ──< Product (many)                 via Product.unitGroup.id (100%)
UnitGroup (1) ──< InvoiceItem (many)             via Invoice.items[].unitId (85%;
                                                   remaining 15% are products sold
                                                   without a configured unit group
                                                   — legitimate nulls, not errors)

Supplier (1) ──< ProductRestockBatch (many)      via ProductRestockBatch.supplierId (100%)
ProductRestockBatch (1) ──< ProductRestockPayment (many) via ProductRestockPayment.batchId (100%)

Cashier (1) ──< Shift (many)                     via Shift.cashierId (96%; 1 orphan
                                                   row flagged in data quality report)
```

## Relationships Explicitly NOT Modeled as Foreign Keys (and why)

- **Invoice.cashier / ProductRestockBatch.cashier** — these are plain cashier
  *name* strings embedded at transaction time, not `id` references. No field
  matched `Cashier.id`. Modeled as a denormalized `cashier_name` text column
  instead of a foreign key, to avoid inventing a relationship the data doesn't
  actually support.
- **InvoiceOrderQueueTemplateConfig.id ↔ InvoiceReceiptTemplateConfig.id ↔
  SecurityConfig.id** — these matched each other at "100%", but each table has
  exactly 1 row, so a 1/1 match is statistically meaningless coincidence (all
  three happen to use a shared default id string), not a real relationship.
  Flagged and excluded.
- **ProductRestockPayment.date → ProductRestockBatch.id (90% match)** — `date`
  is a timestamp field; the match is coincidental overlap between epoch-ms
  timestamps and object ids (which are also epoch-ms based in this dataset),
  not a real relationship. Excluded.

## Cardinality Summary

| Parent | Child | Cardinality | Nullable FK? |
|---|---|---|---|
| Customer | Invoice | 1:N | Yes (60% of invoices have no customer) |
| Customer | InvoiceDebt | 1:N | No |
| Customer | PointsHistory | 1:N | No |
| Invoice | PointsHistory | 1:N | Yes (2 orphans exist) |
| Invoice | InvoiceDebtPayment | 1:N | Yes (1 orphan exists) |
| PaymentMethod | Invoice / InvoiceDebt / Expense / ProductRestockPayment | 1:N | No |
| Product | InvoiceItem / ProductRestockBatchItem | 1:N | No |
| ProductCategory | Product | 1:N | No |
| UnitGroup | Product | 1:N | No |
| UnitGroup | InvoiceItem | 1:N | Yes (legitimate — some products have no unit group) |
| Supplier | ProductRestockBatch | 1:N | No |
| ProductRestockBatch | ProductRestockPayment | 1:N | No |
| Cashier | Shift | 1:N | Yes (1 orphan exists) |

## Entities With No Detected Relationships (Standalone / Config Tables)

AccessConfig, AddStockConfig, AppPreference, BasicConfig, CommissionRule (empty),
Discount, Employee (empty), EmployeeConfig, EmployeePosition (empty),
EntityPlacement (empty), ExtraCost, FixedCost (empty), Ingredient (empty),
IngredientRestockBatch (empty), IngredientRestockPayment (empty),
InitialCapital, InvoiceConfig, InvoiceOrderQueueTemplateConfig,
InvoiceReceiptTemplateConfig, LoyaltyPoints, OptionGroup (empty), OrderQueue,
OrderSetting, OrderType, ProductIngredientBinding (empty), Restock (empty),
SecurityConfig, Store, UnitGroup (as a standalone unit's own sub-units — see
below).

These are loaded as standalone/config tables in the schema (Step 3) with no
foreign keys, since no relationship evidence exists for them.

## Note on UnitGroup Internal Structure

`UnitGroup` records contain a nested `units[]` array (e.g. "Karton" containing
"Botol" and "Karton" sub-units with multipliers). This is modeled as a
`unit_group_unit` child table (UnitGroup 1:N UnitGroupUnit), separate from the
UnitGroup↔Product/InvoiceItem relationships above.
