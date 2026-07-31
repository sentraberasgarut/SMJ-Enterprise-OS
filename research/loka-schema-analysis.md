# Research — Loka `.realm` Schema Analysis

**Status:** Research only. No parser, no pipeline, no production code. This document validates one assumption from [`loka-ingestion-poc.md`](loka-ingestion-poc.md): that a real Loka `.realm` backup can actually be opened and read outside Loka itself.
**Date:** 31 July 2026
**Method:** Opened one real backup read-only with `realm-js` (Node.js) in an isolated scratch directory, outside the repo. The inspection script was throwaway — written only to enumerate schema, count records, and pull one sample record per table. It was not saved to the repo and nothing was written back to the source file.

---

## Database Overview

- **File inspected:** `[1.7.36-v109] loka-stok-backup-27-6-2026.realm` — one of three backups found (`23-6`, `26-6`, `27-6-2026`); the most recent of the three was used.
- **File size:** 512 KB (524,288 bytes).
- **Realm schema version:** `109` — matches the `v109` in the filename. This confirms the filename convention: the `vNNN` tag *is* the Realm internal schema version, which is a useful fact for any future connector that needs to detect schema drift between backups without opening the file first.
- **App version tag in filename:** `1.7.36`.
- **Total object types in the file:** 71 — 43 are top-level/queryable, 28 are embedded (sub-objects that only exist attached to a parent record, not independently listable).
- **Confirmed identity:** `Store.name = "Toko Sembako Sejahtera"`, address `Jl. Guntur Sari No.15, Haurpanggung, Tarogong Kidul, Kab. Garut 44151`. This is a real TSS production backup, not a demo file.
- **Opened via:** dynamic schema discovery — no schema definition was supplied to `Realm.open()`; the library read the object model directly from the file. This means the file is fully self-describing and did not require any external documentation to inspect.
- The assumption from the prior research doc holds: **the file opens cleanly with `realm-js` on Node.js, read-only, without Windows.**

---

## Tables

### Core transactional (has real business data)

| Table | Records | What it is |
| --- | --- | --- |
| **Invoice** | 423 | Every sales transaction — the central table |
| **InvoiceDebt** | 62 | Unpaid/credit sales (piutang) |
| **Shift** | 28 | Cashier shift open/close with cash counts |
| **ProductRestockBatch** | 53 | Stock-in batches (purchasing) |
| **ProductRestockPayment** | 13 | Payments made against restock batches |
| **PointsHistory** | 92 | Loyalty point ledger entries |
| **Expense** | 32 | Operating expenses recorded inside Loka |

### Master / reference data

| Table | Records | What it is |
| --- | --- | --- |
| **Product** | 46 | Catalog items |
| **ProductCategory** | 7 | Category master (e.g. `BERAS`/"Beras") |
| **Customer** | 8 | Customer accounts — **includes "Sederhana Jaya 4" with phone `081225050305`**, matching the branch-as-customer pattern already known from the roadmap's margin-per-pelanggan table |
| **Supplier** | 6 | Supplier master |
| **UnitGroup** | 11 | Unit-of-measure conversion groups (e.g. Karton → Botol) |
| **PaymentMethod** | 3 | e.g. QRIS, Cash |
| **OrderType** | 3 | e.g. "Makan di tempat" — a dine-in concept left over from Loka's generic F&B template, not meaningful for a sembako retail store |
| **BalanceBucket** | 4 | Cash "buckets" (e.g. `CASH` / "Laci Kasir") — conceptually the same idea as Buku Toko's `Dompet` sheet |
| **Store** | 1 | The store record itself |
| **Cashier** | 2 | Loka app login accounts |
| **Discount, ExtraCost, InitialCapital, LoyaltyPoints, OrderQueue, OrderSetting** | 1 each | Single-row store-wide settings, borderline config but hold real operational values (e.g. `InitialCapital.defaultValue = "300000"`) |

### Schema exists, zero records (feature present in the app, unused by TSS)

`CommissionRule`, `Employee`, `EmployeePosition`, `EntityPlacement`, `FixedCost`, `Ingredient`, `IngredientRestockBatch`, `IngredientRestockPayment`, `OptionGroup`, `ProductIngredientBinding`, `Refund`, `Restock`, `StockMovement`, `StoreBalanceEntry`

Two of these are worth flagging specifically — see Questions/Unknowns.

### Config / permissions — excluded from operational scope

Per the instruction to ignore metadata not useful for operations: `AccessConfig`, `AddStockConfig`, `AppPreference`, `BasicConfig`, `EmployeeConfig`, `InvoiceConfig`, `InvoiceOrderQueueTemplateConfig`, `InvoiceReceiptTemplateConfig`, `SecurityConfig`. These are all UI permission toggles (`ACCESS`/`ADD`/`EDIT`/`DELETE` booleans per feature) or display preferences — not business data.

### Embedded types (28) — not independently queryable, only exist inside a parent

`BirthdateItem`, `BulkPriceItem`, `Category`, `CategoryItem`, `ExpenseItem`, `ExpiryAlert`, `ExtraCostItem`, `IngredientRestockItem`, `IngredientStockAlert`, `InvoiceDebtItem`, `InvoiceItem`, `InvoiceItemCommission`, `OptionGroupSelection`, `OptionItem`, `PaymentMethodItem`, `ProductRestockItem`, `ProductVariantItem`, `RefundItem`, `SelectedOptionItem`, `SplitPaymentItem`, `StockAlert`, `TaxItem`, `Unit`, `UnitPriceItem`, `VariantProductItem`

---

## Relationships

Loka's data model uses **three different mechanisms** that all look like "relationships" but behave differently. This distinction matters for any future canonical model — treating them the same would silently produce wrong joins.

### 1. True Realm links (live reference to a real, non-embedded record)

- `Invoice.customer` → `Customer`
- `InvoiceDebt.customer` → `Customer`
- `Product.unitGroup` → `UnitGroup`
- `Ingredient.unitGroup` → `UnitGroup` (table currently empty)

These are the only fields where changing the master record would be reflected everywhere it's referenced.

### 2. Embedded denormalized snapshots (data copied at write time, not linked)

- `Invoice.paymentMethod` → `PaymentMethodItem` — a copy of the payment method *as it was* at the moment of sale
- `Product.category` → `Category` (embedded) — **not** linked to the real `ProductCategory` master table
- `InvoiceItem.category` → `CategoryItem` — same pattern, copied onto each line item
- `Invoice.items` → `InvoiceItem` (list) — line items live inside the invoice, not as a separate queryable table
- `ProductRestockBatch.items` → `ProductRestockItem` (list)
- `InvoiceDebt.items` → `InvoiceDebtItem` (list)

This is deliberate: it protects historical invoices from changing if a category is renamed or a payment method is edited later. It also means **the real `ProductCategory` table and the embedded category snapshots on old invoices can legitimately disagree**, and that's not a bug.

### 3. Soft references by string ID (no enforced integrity — just a matching string)

- `Shift.cashierId` ↔ `Cashier.id`
- `ProductRestockBatch.supplierId` / `supplierName` ↔ `Supplier`
- `PointsHistory.customerId` ↔ `Customer.id`
- `PointsHistory.invoiceId` ↔ `Invoice.id`
- `InvoiceItem.productId` ↔ `Product.id`
- `PaymentMethod.bucketId` ↔ `BalanceBucket.id`
- `ProductIngredientBinding.productId` / `ingredientId` ↔ `Product` / `Ingredient` (table empty)
- `StockMovement.productId` ↔ `Product.id` (table empty)

Realm never enforces these — they're just strings that happen to match another table's primary key. Any future ingestion has to join by matching these IDs manually, and has to tolerate orphaned references (an ID pointing at a deleted or never-created record) since nothing in the database prevents that.

---

## Important Fields for Enterprise OS

Mapped against the minimum-metadata categories from `loka-ingestion-poc.md`:

| Category | Loka source | Key fields |
| --- | --- | --- |
| **Store** | `Store` | `name`, `address`, `businessType`, `balanceStartAt` |
| **Shift** | `Shift` | `cashierId`, `cashierName`, `openTime`, `closeTime`, `initialCash`, `actualCash`, `cashDiff`, `cashInHand` — directly comparable to Buku Toko's `Tutup Shift` sheet |
| **Cashier** | `Cashier` | `id`, `name`, `role`, `phoneNumber` — **`pin` field must be excluded from any canonical layer; it's a plaintext credential** |
| **Products** | `Product` | `id`, `name`, `category` (snapshot), `price`, `capitalPrice`, `stock`, `unitGroup`, `code`, `bulkPrice[]`, `variant[]` |
| **Transactions** | `Invoice` | `id`, `date`, `cashier`, `status`, `grandTotal`, `subTotal`, `capitalSubTotal`, `profit`, `discount`, `totalPayment`, `customer` |
| **Line items** | `InvoiceItem` (embedded in `Invoice.items`) | `name`, `productId`, `price`, `capitalPrice`, `quantity`, `total`, `discount`, `unit` |
| **Payments** | `Invoice.paymentMethod`, `Invoice.splitPayments[]` | method name, amount, split-payment breakdown |
| **Stock movement** | `ProductRestockBatch` + `ProductRestockItem` | supplier, date, quantity, cost — this is the only populated stock-in ledger |
| **Receivables** | `InvoiceDebt` + `InvoiceDebtItem` | customer, remaining balance, status — same concept as `Piutang` already tracked in Buku Toko's `Ringkasan` |
| **Expenses** | `Expense` + `ExpenseItem` | name, date, items, payment method |
| **Loyalty** | `PointsHistory` | customerId, points, invoiceId, type (EARNED/etc.), status |

**Notable finding:** `Invoice.profit` already exists as a per-transaction field, computed by Loka itself from `capitalPrice`. This is a second, independent source for margin figures — worth reconciling against the gross-margin numbers already computed manually and in the `Ringkasan` sheet, rather than assuming they'll match.

---

## Candidate Canonical Model

**Draft only — not a schema to implement, not a data contract.** This is what a normalized shape *could* look like if ADR-0003's Canonical Data Platform ingests Loka data, shown to make the mapping concrete enough to argue about.

| Candidate entity | Built from | Notes |
| --- | --- | --- |
| `store` | `Store` | 1:1, no transformation needed |
| `cashier` | `Cashier` minus `pin` | Credential field dropped at ingestion, never carried downstream |
| `shift` | `Shift` | 1:1; `cashierId` resolved against `cashier` at read time, not stored pre-joined |
| `product` | `Product` | Category kept as-recorded (the live snapshot), not re-resolved against `ProductCategory` — see Unknown #5 |
| `customer` | `Customer` | Flag any record whose `phoneNumber` matches a known Sederhana Jaya branch number, since those aren't retail customers in the ordinary sense |
| `supplier` | `Supplier` | 1:1 |
| `transaction` | `Invoice` + flattened `InvoiceItem` list + `paymentMethod` snapshot | One row per invoice, line items as a nested array — flattening line items into separate rows is a later decision, not made here |
| `receivable` | `InvoiceDebt` + `InvoiceDebtItem` | Same shape as `transaction` but for unpaid sales |
| `restock` | `ProductRestockBatch` + `ProductRestockItem` + `ProductRestockPayment` | Three source tables collapse into one candidate entity: batch header, line items, payment history |
| `expense` | `Expense` + `ExpenseItem` | 1:1 with nested items |
| `loyalty_ledger` | `PointsHistory` | 1:1 |

Every candidate entity would also need the provenance fields already proposed in `loka-ingestion-poc.md` (source file, ingestion timestamp, connector version, source checksum) — none of that exists in Loka's own data today, since Loka has no concept of "this record came from an external ingestion."

---

## Questions / Unknowns

1. **`StockMovement` is empty.** The schema supports a proper stock ledger (`type`, `reason`, `quantity`, `balanceAfter`) but has zero records. This suggests `Product.stock` is decremented/incremented directly with no history kept — meaning historical stock-level reconstruction may not be possible from a backup alone, only the current snapshot.
2. **`Restock` (0 records) vs. `ProductRestockBatch` (53 records).** These look like two versions of the same concept, with `Restock` possibly a deprecated entity from an earlier app version. Needs confirming — this backup's schema version (109) may simply postdate whichever version used `Restock`.
3. **Only 2 `Cashier` records** exist in Loka, while Buku Toko's `Pengguna` sheet lists 8 users. These are two different systems with two different user rosters by design, but worth confirming with whoever manages Loka logins that this isn't a gap.
4. **`Cashier.pin` is stored as a plain string** in the backup file. Any future ingestion work must treat this as a hard exclusion, not an oversight to fix later.
5. **`Product.category` is a denormalized snapshot, not a live link to `ProductCategory`.** A canonical model has to decide whether category-based margin reporting should use the snapshot recorded at sale time or the current category master — these can disagree, and neither answer is obviously correct without asking whoever owns the margin reporting.
6. **Customer-list overlap with Sederhana Jaya branches.** `Customer` includes at least one branch (`Sederhana Jaya 4`) with a phone number matching what's already documented elsewhere in this repo. Unclear whether Loka's full customer list should be treated as "real end customers" or partly as internal branch transfers — mirrors the exact walk-in-vs-SJ-concentration question already open in the roadmap.
7. **This backup is dated 27 June 2026** — about five weeks before the operational period (late July) discussed throughout the rest of this repo, and the app version (`1.7.36`) may have changed schema since. Some embedded timestamps observed in the file (e.g. a `createdAt` value in July) don't cleanly align with the June filename date — possibly the filename reflects export/download time rather than a precise data cutoff, or default records get timestamped on first app load rather than at backup time. Either way: **treat this analysis as a schema shape reference, not a confirmation of current record counts.** A fresher backup should be inspected before any real ingestion design work begins.
8. **`Invoice.profit` is a third source for margin figures**, independent of the gross-margin `Ringkasan` calculation and the manual net-margin analysis already in this repo. Whether all three agree, and why, hasn't been checked — that's its own piece of research, not assumed here.
