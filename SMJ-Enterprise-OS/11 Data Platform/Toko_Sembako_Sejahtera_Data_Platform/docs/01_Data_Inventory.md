# 01 Data Inventory

**Source:** `raw/loka_export.json` (Loka Kasir Realm export)
**Total entities:** 42
**Total records across all entities:** 673

This inventory is generated entirely from the resolved data - no field was invented. See `scripts/parser/realm_resolver.py` for the exact resolution algorithm and its documented, evidence-based assumptions.

---

## AccessConfig

- **Record Count:** 7
- **Primary Key:** (no 'id' field present)
- **Business Meaning:** Feature-flag / permission toggles for the POS app (e.g. ACCESS: true).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| ACCESS | bool(7) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## AddStockConfig

- **Record Count:** 1
- **Primary Key:** (no 'id' field present)
- **Business Meaning:** Configuration for how stock additions/restocks behave in the app.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| ACCESS | bool(1) | 100.0% |
| ALERT | bool(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## AppPreference

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** General app-level user preferences (singleton config).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| productViewMode | string(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## BasicConfig

- **Record Count:** 22
- **Primary Key:** (no 'id' field present)
- **Business Meaning:** Core app configuration entries (key/value settings).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| ACCESS | bool(22) | 100.0% |
| ADD | bool(22) | 100.0% |
| EDIT | bool(22) | 100.0% |
| DELETE | bool(22) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## Cashier

- **Record Count:** 2
- **Primary Key:** id (verified unique)
- **Business Meaning:** A cashier/staff login profile who can operate the POS (distinct from Employee).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(2) | 100.0% |
| name | string(2) | 100.0% |
| avatarId | string(2) | 100.0% |
| pin | string(2) | 100.0% |
| phoneNumber | string(2) | 100.0% |
| role | string(2) | 100.0% |
| createdTime | string(2) | 100.0% |
| powerUser | bool(1), null(1) | 50.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## CommissionRule

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Rules for staff sales commissions. Currently empty (no rules configured).

_No records present in this export - structure unknown, cannot profile fields._

---

## Customer

- **Record Count:** 8
- **Primary Key:** id (verified unique)
- **Business Meaning:** A registered customer, including loyalty point balance.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(8) | 100.0% |
| name | string(8) | 100.0% |
| avatarId | null(8) | 0.0% |
| phoneNumber | string(8) | 100.0% |
| address | null(8) | 0.0% |
| email | null(8) | 0.0% |
| birthDate | null(8) | 0.0% |
| joinDate | string(8) | 100.0% |
| loyaltyPoints | int(8) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## Discount

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** A discount rule/code configured in the POS.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| defaultValue | string(1) | 100.0% |
| type | string(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## Employee

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Employee master data. Currently empty - staff are tracked via Cashier instead.

_No records present in this export - structure unknown, cannot profile fields._

---

## EmployeeConfig

- **Record Count:** 7
- **Primary Key:** (no 'id' field present)
- **Business Meaning:** Per-employee configuration entries.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| ACCESS | bool(7) | 100.0% |
| ADD | bool(7) | 100.0% |
| EDIT | bool(7) | 100.0% |
| DELETE | bool(7) | 100.0% |
| POSITION | bool(7) | 100.0% |
| COMMISSION | bool(7) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## EmployeePosition

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Job position/role definitions for employees. Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## EntityPlacement

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** UI/menu placement configuration. Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## Expense

- **Record Count:** 25
- **Primary Key:** id (verified unique)
- **Business Meaning:** A recorded business expense (name, amount via items[], payment method).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(25) | 100.0% |
| name | string(25) | 100.0% |
| note | string(25) | 100.0% |
| date | string(25) | 100.0% |
| items | list(25) | 100.0% |
| paymentMethodId | string(25) | 100.0% |
| paymentMethodName | string(25) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `paymentMethodId` -> PaymentMethod.id  (25/25 values matched, 100%)

---

## ExtraCost

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** An additional cost line type that can be attached to invoices (e.g. delivery fee).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| name | string(1) | 100.0% |
| defaultValue | string(1) | 100.0% |
| type | string(1) | 100.0% |
| default | bool(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## FixedCost

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Recurring fixed cost definitions. Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## Ingredient

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Raw ingredient master data (for recipe-based products). Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## IngredientRestockBatch

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Ingredient restock purchase orders. Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## IngredientRestockPayment

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Payments against ingredient restocks. Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## InitialCapital

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** The starting capital recorded for the business/store.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| defaultValue | string(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## Invoice

- **Record Count:** 316
- **Primary Key:** id (verified unique)
- **Business Meaning:** A sales transaction (the core POS sales record). Has line items, payment, totals.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(316) | 100.0% |
| items | list(316) | 100.0% |
| taxes | null(316) | 0.0% |
| extraCosts | list(316) | 100.0% |
| paymentMethod | object(316) | 100.0% |
| subTotal | string(316) | 100.0% |
| grandTotal | string(316) | 100.0% |
| capitalSubTotal | string(316) | 100.0% |
| discount | string(316) | 100.0% |
| discountPercentage | string(314), null(2) | 99.4% |
| payDate | null(281), string(35) | 11.1% |
| date | string(316) | 100.0% |
| cashier | string(316) | 100.0% |
| status | string(316) | 100.0% |
| changeover | null(269), string(47) | 14.9% |
| totalPayment | string(316) | 100.0% |
| profit | string(316) | 100.0% |
| customer | null(187), object(129) | 40.8% |
| scheduledDate | null(308), string(8) | 2.5% |
| queue | int(316) | 100.0% |
| note | string(316) | 100.0% |
| pointsRedeemed | null(316) | 0.0% |
| pointsRedemptionValue | null(316) | 0.0% |
| orderType | null(316) | 0.0% |
| customerName | null(271), string(45) | 14.2% |
| entityPlacement | null(316) | 0.0% |
| splitPayments | list(316) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `items[].productId` -> Product.id  (704/704 values matched, 100%)
- `items[].unitId` -> UnitGroup.id  (388/459 values matched, 85%)
- `paymentMethod` -> PaymentMethod.id  (316/316 values matched, 100%)
- `customer` -> Customer.id  (129/129 values matched, 100%)

---

## InvoiceConfig

- **Record Count:** 5
- **Primary Key:** (no 'id' field present)
- **Business Meaning:** Configuration for how invoices/receipts behave.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| ACCESS | bool(5) | 100.0% |
| EDIT | bool(5) | 100.0% |
| DELETE | bool(5) | 100.0% |
| CANCEL | bool(5) | 100.0% |
| SHARE | bool(5) | 100.0% |
| PRINT | bool(5) | 100.0% |
| HIGHLIGHT_HOME | bool(5) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## InvoiceDebt

- **Record Count:** 50
- **Primary Key:** id (verified unique)
- **Business Meaning:** A credit/installment sale - an invoice not fully paid at time of sale, with a payment ledger in items[].

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(50) | 100.0% |
| items | list(50) | 100.0% |
| paymentMethod | object(50) | 100.0% |
| grandTotal | string(50) | 100.0% |
| date | string(50) | 100.0% |
| cashier | string(50) | 100.0% |
| status | string(50) | 100.0% |
| changeover | null(49), string(1) | 2.0% |
| totalPayment | string(50) | 100.0% |
| customer | object(44), null(6) | 88.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `items[].invoiceId` -> Invoice.id  (70/71 values matched, 99%)
- `paymentMethod` -> PaymentMethod.id  (50/50 values matched, 100%)
- `customer` -> Customer.id  (44/44 values matched, 100%)

---

## InvoiceOrderQueueTemplateConfig

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** Template configuration for the order-queue display/printout.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| STORE_NAME | bool(1) | 100.0% |
| TRANSACTION_ID | bool(1) | 100.0% |
| DATE | bool(1) | 100.0% |
| FOOTER_NOTE | bool(1) | 100.0% |
| ORDER_TYPE | bool(1) | 100.0% |
| ENTITY_PLACEMENT | bool(1) | 100.0% |
| CUSTOMER_NAME | bool(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `id` -> InvoiceReceiptTemplateConfig.id  (1/1 values matched, 100%)
- `id` -> SecurityConfig.id  (1/1 values matched, 100%)

---

## InvoiceReceiptTemplateConfig

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** Template configuration for the printed/digital receipt layout.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| PAPER_SIZE | string(1) | 100.0% |
| STORE_NAME | bool(1) | 100.0% |
| STORE_ADDRESS | bool(1) | 100.0% |
| STORE_LOGO | bool(1) | 100.0% |
| TRANSACTION_ID | bool(1) | 100.0% |
| DATE | bool(1) | 100.0% |
| SCHEDULED_DATE | bool(1) | 100.0% |
| CASHIER_NAME | bool(1) | 100.0% |
| CUSTOMER_NAME | bool(1) | 100.0% |
| CUSTOMER_TOTAL_LOYALTY_POINTS | bool(1) | 100.0% |
| PAYMENT_METHOD | bool(1) | 100.0% |
| TAX | bool(1) | 100.0% |
| TRANSACTION_STATUS | bool(1) | 100.0% |
| FOOTER_NOTE | bool(1) | 100.0% |
| NOTE_PER_ITEM | bool(1) | 100.0% |
| AUTO_CUT | bool(1) | 100.0% |
| QUEUE_NUMBER | bool(1) | 100.0% |
| NOTE | bool(1) | 100.0% |
| AUTO_OPEN_CASH_DRAWER | bool(1) | 100.0% |
| UNIT_PLACEMENT | string(1) | 100.0% |
| ORDER_TYPE | bool(1) | 100.0% |
| ENTITY_PLACEMENT | bool(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `id` -> InvoiceOrderQueueTemplateConfig.id  (1/1 values matched, 100%)
- `id` -> SecurityConfig.id  (1/1 values matched, 100%)

---

## LoyaltyPoints

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** Loyalty program configuration (points earning/redemption rules).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| enabled | bool(1) | 100.0% |
| pointsPerAmount | int(1) | 100.0% |
| amountPerPoint | int(1) | 100.0% |
| minPurchaseAmount | int(1) | 100.0% |
| pointsExpiry | int(1) | 100.0% |
| redemptionValue | int(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## OptionGroup

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Product option groups (e.g. size, add-ons). Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## OrderQueue

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** Order queue / numbering configuration for order-based service.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| resetDaily | bool(1) | 100.0% |
| number | int(1) | 100.0% |
| date | string(1) | 100.0% |
| note | string(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## OrderSetting

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** General order-flow settings.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| flexibleOrderTime | bool(1) | 100.0% |
| editProductPrice | bool(1) | 100.0% |
| addProductInstant | bool(1) | 100.0% |
| showProfitOnOrder | bool(1) | 100.0% |
| showProductImage | bool(1) | 100.0% |
| showProductStock | bool(1) | 100.0% |
| requireOpenShift | bool(1) | 100.0% |
| requireEmployeeForCommission | bool(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## OrderType

- **Record Count:** 3
- **Primary Key:** id (verified unique)
- **Business Meaning:** Types of orders the store supports (e.g. dine-in, takeaway).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(3) | 100.0% |
| name | string(3) | 100.0% |
| isDefault | bool(3) | 100.0% |
| icon | string(3) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## PaymentMethod

- **Record Count:** 3
- **Primary Key:** id (verified unique)
- **Business Meaning:** A payment method accepted by the store (Cash, QRIS, etc.).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(3) | 100.0% |
| name | string(3) | 100.0% |
| imageId | string(3) | 100.0% |
| icon | null(3) | 0.0% |
| iconColor | null(3) | 0.0% |
| removeable | null(3) | 0.0% |
| default | null(3) | 0.0% |
| imagePath | string(3) | 100.0% |
| extraStep | bool(3) | 100.0% |
| note | string(3) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## PointsHistory

- **Record Count:** 76
- **Primary Key:** id (verified unique)
- **Business Meaning:** Ledger of loyalty point earn/redeem events per customer, linked to invoices.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(76) | 100.0% |
| customerId | string(76) | 100.0% |
| type | string(76) | 100.0% |
| points | int(76) | 100.0% |
| invoiceId | string(76) | 100.0% |
| description | null(76) | 0.0% |
| createdAt | string(76) | 100.0% |
| orderAt | string(76) | 100.0% |
| earnedOn | string(76) | 100.0% |
| expirationDate | null(76) | 0.0% |
| status | string(76) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `customerId` -> Customer.id  (76/76 values matched, 100%)
- `invoiceId` -> Invoice.id  (74/76 values matched, 97%)

---

## Product

- **Record Count:** 44
- **Primary Key:** id (verified unique)
- **Business Meaning:** A sellable product: price, stock, category, unit configuration.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(44) | 100.0% |
| imagePath | null(43), string(1) | 2.3% |
| name | string(44) | 100.0% |
| category | object(44) | 100.0% |
| price | int(44) | 100.0% |
| bulkPrice | list(44) | 100.0% |
| description | null(44) | 0.0% |
| capitalPrice | int(44) | 100.0% |
| stock | int(28), float(13), null(3) | 93.2% |
| createdTime | string(44) | 100.0% |
| code | string(31), null(13) | 70.5% |
| isFavorite | bool(41), null(3) | 93.2% |
| unit | null(44) | 0.0% |
| unitGroup | object(41), null(3) | 93.2% |
| stockAlert | null(44) | 0.0% |
| expiryAlert | null(44) | 0.0% |
| isCustomUnitPrice | bool(44) | 100.0% |
| pricingMode | string(44) | 100.0% |
| isVariantUniformPrice | bool(44) | 100.0% |
| unitPrices | list(44) | 100.0% |
| variant | list(44) | 100.0% |
| expiredDate | null(44) | 0.0% |
| isCapitalPriceBound | bool(44) | 100.0% |
| isCommissionable | null(44) | 0.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `category` -> ProductCategory.id  (44/44 values matched, 100%)
- `unitGroup` -> UnitGroup.id  (41/41 values matched, 100%)

---

## ProductCategory

- **Record Count:** 7
- **Primary Key:** id (verified unique)
- **Business Meaning:** Product category taxonomy used to group Products.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(7) | 100.0% |
| text | string(7) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## ProductIngredientBinding

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Links Products to the Ingredients used to make them (recipes). Currently empty.

_No records present in this export - structure unknown, cannot profile fields._

---

## ProductRestockBatch

- **Record Count:** 37
- **Primary Key:** id (verified unique)
- **Business Meaning:** A stock purchase order from a Supplier - the primary inbound-inventory record.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(37) | 100.0% |
| date | string(37) | 100.0% |
| cashier | string(37) | 100.0% |
| items | list(37) | 100.0% |
| status | string(37) | 100.0% |
| supplierId | null(27), string(10) | 27.0% |
| supplierName | null(27), string(10) | 27.0% |
| totalAmount | string(37) | 100.0% |
| paymentStatus | null(27), string(10) | 27.0% |
| paidAmount | null(27), string(10) | 27.0% |
| paidDate | null(27), string(10) | 27.0% |
| referenceId | string(37) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `items[].productId` -> Product.id  (44/44 values matched, 100%)
- `supplierId` -> Supplier.id  (10/10 values matched, 100%)

---

## ProductRestockPayment

- **Record Count:** 10
- **Primary Key:** id (verified unique)
- **Business Meaning:** A payment made against a ProductRestockBatch (supports partial/installment payment to suppliers).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(10) | 100.0% |
| batchId | string(10) | 100.0% |
| amount | string(10) | 100.0% |
| date | string(10) | 100.0% |
| cashier | string(10) | 100.0% |
| note | null(10) | 0.0% |
| paymentMethodId | string(10) | 100.0% |
| paymentMethodName | string(10) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `batchId` -> ProductRestockBatch.id  (10/10 values matched, 100%)
- `date` -> ProductRestockBatch.id  (9/10 values matched, 90%)
- `paymentMethodId` -> PaymentMethod.id  (10/10 values matched, 100%)

---

## Restock

- **Record Count:** 0
- **Primary Key:** (no dict-shaped id field - see notes)
- **Business Meaning:** Legacy/alternate restock record type. Currently empty (superseded by ProductRestockBatch).

_No records present in this export - structure unknown, cannot profile fields._

---

## SecurityConfig

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** Security-related app configuration (PINs, lock settings, etc.).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| PRODUCT | object(1) | 100.0% |
| ADD_STOCK | object(1) | 100.0% |
| CATEGORY | object(1) | 100.0% |
| INVOICE | object(1) | 100.0% |
| EXPENSE | object(1) | 100.0% |
| PAYMENT_METHOD | object(1) | 100.0% |
| CUSTOMER | object(1) | 100.0% |
| SUPPLIER | object(1) | 100.0% |
| STORE | object(1) | 100.0% |
| REPORT | object(1) | 100.0% |
| EXTRA_COST | object(1) | 100.0% |
| CASHIER | object(1) | 100.0% |
| EMPLOYEE | object(1) | 100.0% |
| DATA | object(1) | 100.0% |
| DISCOUNT | object(1) | 100.0% |
| ORDER_SETTING | object(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `id` -> InvoiceOrderQueueTemplateConfig.id  (1/1 values matched, 100%)
- `id` -> InvoiceReceiptTemplateConfig.id  (1/1 values matched, 100%)

---

## Shift

- **Record Count:** 23
- **Primary Key:** id (verified unique)
- **Business Meaning:** A cashier work session: open/close time, cash reconciliation (initial, actual, difference).

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(23) | 100.0% |
| cashierId | string(23) | 100.0% |
| cashierName | string(23) | 100.0% |
| openTime | string(23) | 100.0% |
| closeTime | string(23) | 100.0% |
| initialCash | string(23) | 100.0% |
| actualCash | string(20), null(3) | 87.0% |
| cashDiff | int(20), null(3) | 87.0% |
| cashInHand | int(23) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- `cashierId` -> Cashier.id  (22/23 values matched, 96%)

---

## Store

- **Record Count:** 1
- **Primary Key:** id (verified unique)
- **Business Meaning:** The store's own profile record (name, address, etc.) - singleton.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(1) | 100.0% |
| address | string(1) | 100.0% |
| name | string(1) | 100.0% |
| imagePath | null(1) | 0.0% |
| footnote | string(1) | 100.0% |
| businessType | string(1) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## Supplier

- **Record Count:** 6
- **Primary Key:** id (verified unique)
- **Business Meaning:** A supplier the business purchases stock from.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(6) | 100.0% |
| name | string(6) | 100.0% |
| phoneNumber | string(6) | 100.0% |
| email | null(6) | 0.0% |
| address | null(6) | 0.0% |
| contactPerson | null(6) | 0.0% |
| notes | null(6) | 0.0% |
| joinDate | string(6) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---

## UnitGroup

- **Record Count:** 10
- **Primary Key:** id (verified unique)
- **Business Meaning:** Unit-of-measure group definitions (e.g. Karton containing Botol, with multipliers) used by Products.

**Fields:**

| Field | Types Observed | Completeness (non-null) |
|---|---|---|
| id | string(10) | 100.0% |
| name | string(10) | 100.0% |
| units | list(10) | 100.0% |
| baseUnitId | string(10) | 100.0% |
| createdTime | string(10) | 100.0% |

**Detected Relationships (evidence-based, matched against other entities' id sets):**

- None detected (no field's values matched another entity's id set at >=50% rate).

---
