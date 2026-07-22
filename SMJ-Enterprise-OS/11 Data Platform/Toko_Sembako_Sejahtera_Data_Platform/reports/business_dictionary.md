# Business Dictionary

**Store profile (from the data itself):** "Toko Sembako Sejahtera" — Jl. Guntur
Sari No.15, Haurpanggung, Tarogong Kidul, Kab. Garut, 44151. Business type:
RETAIL. Tagline: "Belanja Sembako? Ya di Sejahtera!" ("Shop for groceries?
Yes, at Sejahtera!"). This is SBGA's retail storefront point-of-sale data —
a general grocery/staples ("sembako") store, consistent with SBGA's broader
rice distribution business having a retail sales channel.

**Data window:** All observed timestamps fall within a single operating
period in mid-2026 (based on epoch-millisecond ids and ISO dates present in
Shift records) — this appears to be a real but relatively short slice of
POS activity, not multi-year history.

---

## Core Entities

### Invoice
**What it is:** One sales transaction (a completed or in-progress sale) rung
up at the POS. **316 records.**
**Key fields:** `grand_total` (what the customer paid), `profit` (margin on
the sale), `status` (e.g. PAID), `customer_id` (nullable — 59% of sales are
walk-in with no customer attached), `payment_method_id`.
**Business use:** The primary source for revenue, sales volume, and
profitability analysis.

### InvoiceItem
**What it is:** One product line within an Invoice (a sale can have 1+ items).
**704 records** across 316 invoices (avg. 2.2 items/sale).
**Key fields:** `product_id`, `quantity`, `price` (unit price at time of
sale), `capital_price` (unit cost at time of sale — the spread between
`price` and `capital_price` is the item's margin), `total`.
**Business use:** Best-selling product analysis, margin-per-product, basket
composition.

### Product
**What it is:** A sellable item in the store's catalogue. **44 records.**
**Key fields:** `price` (sell price), `capital_price` (cost price), `stock`
(current on-hand quantity), `category_id`, `unit_group_id`.
**Business use:** Inventory valuation, margin analysis, stock alerts.

### ProductCategory
**What it is:** Grouping taxonomy for Products (e.g. "Air" / Water). **7
records.**

### Customer
**What it is:** A registered, named customer (as opposed to a walk-in). **8
records.** Includes `loyalty_points` balance.
**Business use:** Repeat-customer and loyalty analysis; note only 8 of
presumably many buyers are registered — most transactions are anonymous
retail sales.

### Supplier
**What it is:** A vendor the store buys stock from. **6 records.**

### PaymentMethod
**What it is:** How a sale/expense/restock was paid (Cash, QRIS, etc.). **3
records.**
**Business use:** Payment-mix analysis (cash vs. digital).

### Cashier
**What it is:** A staff login profile authorized to operate the POS. **2
records.** (Note: the separate `Employee` entity is empty in this export —
staffing is tracked only through Cashier here.)

### Shift
**What it is:** One cashier's work session — open/close time and cash
reconciliation. **23 records.**
**Key fields:** `initial_cash` (float at shift start), `actual_cash` (counted
at close), `cash_diff` (actual minus expected — negative means a shortage).
**Business use:** Cash-handling accountability; 13 of 23 shifts in this
export show a shortage, worth operational attention.

### Expense
**What it is:** A recorded business expense (e.g. "Shodaqoh"/charity, or
operational costs). **25 records**, each with 1+ `ExpenseItem` line entries.
**Business use:** Cost tracking, net-profit calculation alongside revenue.

### ProductRestockBatch
**What it is:** A stock purchase order from a Supplier — the primary
inbound-inventory event. **37 records**, each with 1+ line items
(`ProductRestockBatchItem`, 44 total).
**Key fields:** `total_amount`, `payment_status` (e.g. PAID), `supplier_id`.
**Business use:** Cost-of-goods and supplier-spend analysis.

### ProductRestockPayment
**What it is:** A payment made against a restock batch — supports paying a
supplier in installments. **10 records**, linked to `ProductRestockBatch`
via `batch_id`.

### InvoiceDebt
**What it is:** A sale that wasn't fully paid at time of purchase — store
credit / "buy now, pay later" extended to a customer. **50 records**, each
with 1+ payment-ledger entries (`InvoiceDebtPayment`, 71 total) tracking
partial repayments over time.
**Business use:** Accounts-receivable tracking, customer credit risk.

### PointsHistory
**What it is:** The ledger of loyalty-point earn/redeem events per customer,
each (mostly) tied to the Invoice that generated it. **76 records.**
**Business use:** Loyalty program effectiveness, points liability.

### UnitGroup / UnitGroupUnit
**What it is:** Unit-of-measure definitions for Products that sell in more
than one unit (e.g. a "Karton"/carton containing 12 "Botol"/bottles, with a
multiplier). **10 UnitGroups, 19 sub-units.**
**Business use:** Correctly converting between retail and wholesale unit
sales for accurate stock and revenue accounting.

### Store
**What it is:** The store's own profile (name, address, business type).
**1 record (singleton).**

### OrderType
**What it is:** Service types the store supports: Dine In, Takeaway,
Delivery. **3 records.** (Presence of "Dine In" suggests the POS software is
shared with food-service businesses, though this particular store is
grocery retail — the field may be unused/default here.)

### Discount / ExtraCost (config)
**What they are:** Store-wide default discount and extra-cost (e.g. tax)
configuration. **1 record each**, both currently set to 0% default — i.e.
not actively used as blanket policies in this dataset.

---

## Config / Settings Entities (loaded into `app_config`)

The following 21 entities are app configuration or feature-toggle data with
no relationship to the transactional data (see `docs/02_ERD.md`). They are
preserved (per "do not ignore any table") but are operational/technical
metadata, not business data: AccessConfig, AddStockConfig, AppPreference,
BasicConfig, CommissionRule (empty), EmployeeConfig, EmployeePosition
(empty), EntityPlacement (empty), ExtraCost, FixedCost (empty), Ingredient
(empty), IngredientRestockBatch (empty), IngredientRestockPayment (empty),
InvoiceConfig, InvoiceOrderQueueTemplateConfig, InvoiceReceiptTemplateConfig,
OptionGroup (empty), OrderQueue, OrderSetting, ProductIngredientBinding
(empty), Restock (empty), SecurityConfig.

## Empty Entities Worth Noting for Future Business Context

- **Employee (0 records):** No dedicated employee master data — staffing
  runs through the smaller `Cashier` table only.
- **Ingredient / ProductIngredientBinding (0 records):** The store does not
  use recipe-based/ingredient-tracked products — all Products are sold as
  standalone units, consistent with a grocery/sembako retail model rather
  than food preparation.
- **CommissionRule (0 records):** No staff sales-commission structure is
  configured in this export.
