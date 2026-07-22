-- =====================================================================
-- SBGA Data Platform - SQLite Schema
-- Generated from evidence in docs/01_Data_Inventory.md and docs/02_ERD.md
-- Every table/column below traces to a real field observed in the
-- resolved Loka Kasir export. No column was invented.
--
-- DESIGN NOTE: Config/settings entities (singleton or near-singleton
-- tables with no detected relationships - see docs/02_ERD.md "Entities
-- With No Detected Relationships") are stored generically as
-- (id, raw_json, loaded_at) rather than hand-normalized. This is a
-- deliberate, documented trade-off: normalizing ~20 one-row settings
-- tables individually would add schema surface without adding analytical
-- value, since none of them relate to the transactional data. If any of
-- them later prove relevant to analytics, they should be promoted to a
-- fully-typed table.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- CORE MASTER DATA
-- ---------------------------------------------------------------------

CREATE TABLE store (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    address         TEXT,
    image_path      TEXT,
    footnote        TEXT,
    business_type   TEXT
);

CREATE TABLE payment_method (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    image_id        TEXT,
    icon            TEXT,
    icon_color      TEXT,
    removeable      INTEGER,
    is_default      INTEGER,
    image_path      TEXT,
    extra_step      INTEGER,
    note            TEXT
);

CREATE TABLE product_category (
    id              TEXT PRIMARY KEY,
    text            TEXT
);

CREATE TABLE unit_group (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    base_unit_id    TEXT,
    created_time    TEXT
);

CREATE TABLE unit_group_unit (
    unit_group_id   TEXT NOT NULL REFERENCES unit_group(id),
    unit_id         TEXT NOT NULL,
    name            TEXT,
    multiplier      REAL,
    is_base         INTEGER,
    PRIMARY KEY (unit_group_id, unit_id)
);

CREATE TABLE product (
    id                  TEXT PRIMARY KEY,
    name                TEXT,
    image_path          TEXT,
    category_id         TEXT REFERENCES product_category(id),
    price               REAL,
    capital_price       REAL,
    stock               REAL,
    code                TEXT,
    is_favorite         INTEGER,
    unit_group_id       TEXT REFERENCES unit_group(id),
    stock_alert         REAL,
    description         TEXT,
    created_time        TEXT
);

CREATE TABLE customer (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    avatar_id       TEXT,
    phone_number    TEXT,
    address         TEXT,
    email           TEXT,
    birth_date      TEXT,
    join_date       TEXT,
    loyalty_points  REAL
);

CREATE TABLE supplier (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    phone_number    TEXT,
    email           TEXT,
    address         TEXT,
    contact_person  TEXT,
    notes           TEXT,
    join_date       TEXT
);

CREATE TABLE cashier (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    avatar_id       TEXT,
    pin             TEXT,
    phone_number    TEXT,
    role            TEXT,
    created_time    TEXT,
    power_user      INTEGER
);

CREATE TABLE employee (
    -- Structure unknown: 0 records present in this export (see
    -- docs/01_Data_Inventory.md). Columns mirror the Cashier shape as the
    -- closest known analogue; re-verify against a future export that
    -- actually contains Employee records before trusting this shape.
    id              TEXT PRIMARY KEY,
    raw_json        TEXT
);

CREATE TABLE order_type (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    is_default      INTEGER,
    icon            TEXT
);

CREATE TABLE discount (
    id              TEXT PRIMARY KEY,
    default_value   REAL,
    type            TEXT
);

CREATE TABLE extra_cost_config (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    default_value   REAL,
    type            TEXT,
    is_default      INTEGER
);

CREATE TABLE initial_capital (
    id              TEXT PRIMARY KEY,
    raw_json        TEXT
);

CREATE TABLE loyalty_points_config (
    id              TEXT PRIMARY KEY,
    raw_json        TEXT
);

-- ---------------------------------------------------------------------
-- SALES: INVOICE (the core transactional record)
-- ---------------------------------------------------------------------

CREATE TABLE invoice (
    id                          TEXT PRIMARY KEY,
    sub_total                   REAL,
    grand_total                 REAL,
    capital_sub_total           REAL,
    discount                    REAL,
    discount_percentage         REAL,
    pay_date                    TEXT,
    invoice_date                TEXT,
    cashier_name                TEXT,       -- denormalized: no reliable FK to cashier.id (see ERD)
    status                      TEXT,
    changeover                  TEXT,
    total_payment                REAL,
    profit                      REAL,
    customer_id                 TEXT REFERENCES customer(id),   -- nullable: 60% of invoices have no customer
    scheduled_date               TEXT,
    queue                       INTEGER,
    note                         TEXT,
    points_redeemed              REAL,
    points_redemption_value      REAL,
    order_type                   TEXT,
    customer_name                TEXT,       -- denormalized display name at time of sale
    payment_method_id            TEXT REFERENCES payment_method(id)
);

CREATE TABLE invoice_item (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id      TEXT NOT NULL REFERENCES invoice(id),
    product_id      TEXT REFERENCES product(id),      -- nullable: not all items resolved cleanly (see data quality report)
    name            TEXT,
    price           REAL,
    capital_price   REAL,
    quantity        REAL,
    total           REAL,
    discount        REAL,
    note            TEXT,
    category_id     TEXT,
    unit_name       TEXT,
    unit_id         TEXT REFERENCES unit_group(id),   -- nullable: 15% legitimately have no unit group
    unit_multiplier REAL,
    variant         TEXT
);

CREATE TABLE invoice_extra_cost (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id      TEXT NOT NULL REFERENCES invoice(id),
    raw_json        TEXT
);

CREATE TABLE invoice_split_payment (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id      TEXT NOT NULL REFERENCES invoice(id),
    raw_json        TEXT
);

-- ---------------------------------------------------------------------
-- CREDIT SALES / DEBT
-- ---------------------------------------------------------------------

CREATE TABLE invoice_debt (
    id                  TEXT PRIMARY KEY,
    grand_total         REAL,
    debt_date           TEXT,
    cashier_name        TEXT,
    status              TEXT,
    changeover          TEXT,
    total_payment       REAL,
    customer_id         TEXT REFERENCES customer(id),
    payment_method_id   TEXT REFERENCES payment_method(id)
);

CREATE TABLE invoice_debt_payment (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_debt_id TEXT NOT NULL REFERENCES invoice_debt(id),
    invoice_id      TEXT REFERENCES invoice(id),   -- nullable: 1 orphan row exists (see data quality report)
    total            REAL,
    payment_date      TEXT,
    status            TEXT,
    remaining         REAL,
    grand_total       REAL
);

-- ---------------------------------------------------------------------
-- LOYALTY
-- ---------------------------------------------------------------------

CREATE TABLE points_history (
    id              TEXT PRIMARY KEY,
    customer_id     TEXT REFERENCES customer(id),
    type            TEXT,
    points          REAL,
    invoice_id      TEXT REFERENCES invoice(id),   -- nullable: 2 orphan rows exist (see data quality report)
    description     TEXT,
    created_at      TEXT,
    order_at        TEXT,
    earned_on       TEXT,
    expiration_date TEXT,
    status          TEXT
);

-- ---------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------

CREATE TABLE expense (
    id                  TEXT PRIMARY KEY,
    name                TEXT,
    note                TEXT,
    expense_date        TEXT,
    payment_method_id   TEXT REFERENCES payment_method(id),
    payment_method_name TEXT
);

CREATE TABLE expense_item (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id      TEXT NOT NULL REFERENCES expense(id),
    name            TEXT,
    price           REAL
);

-- ---------------------------------------------------------------------
-- INVENTORY: RESTOCK (inbound stock from suppliers)
-- ---------------------------------------------------------------------

CREATE TABLE product_restock_batch (
    id              TEXT PRIMARY KEY,
    batch_date      TEXT,
    cashier_name    TEXT,
    status          TEXT,
    supplier_id     TEXT REFERENCES supplier(id),
    total_amount    REAL,
    payment_status  TEXT,
    paid_amount     REAL,
    paid_date       TEXT,
    reference_id    TEXT
);

CREATE TABLE product_restock_batch_item (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id            TEXT NOT NULL REFERENCES product_restock_batch(id),
    product_id          TEXT REFERENCES product(id),
    variant_id          TEXT,
    product_name        TEXT,
    quantity            REAL,
    note                TEXT,
    capital_price       REAL,
    received_quantity   REAL
);

CREATE TABLE product_restock_payment (
    id                  TEXT PRIMARY KEY,
    batch_id            TEXT NOT NULL REFERENCES product_restock_batch(id),
    payment_date        TEXT,
    amount              REAL,
    payment_method_id   TEXT REFERENCES payment_method(id)
);

-- ---------------------------------------------------------------------
-- OPERATIONS: SHIFTS
-- ---------------------------------------------------------------------

CREATE TABLE shift (
    id              TEXT PRIMARY KEY,
    cashier_id      TEXT REFERENCES cashier(id),   -- nullable: 1 orphan row exists (see data quality report)
    cashier_name    TEXT,
    open_time       TEXT,
    close_time      TEXT,
    initial_cash    REAL,
    actual_cash     REAL,
    cash_diff       REAL,
    cash_in_hand    REAL
);

-- ---------------------------------------------------------------------
-- GENERIC CONFIG / SETTINGS TABLES
-- (singleton or near-singleton, no detected relationships - see
-- docs/02_ERD.md. Stored as raw JSON to avoid over-engineering schema
-- for entities with zero analytical relationship to the transactional
-- data. `entity_name` disambiguates which Realm entity each row is from.)
-- ---------------------------------------------------------------------

CREATE TABLE app_config (
    entity_name     TEXT NOT NULL,
    record_index    INTEGER NOT NULL,
    raw_json        TEXT NOT NULL,
    PRIMARY KEY (entity_name, record_index)
);

-- Entities loaded into app_config: AccessConfig, AddStockConfig,
-- AppPreference, BasicConfig, CommissionRule, EmployeeConfig,
-- EmployeePosition, EntityPlacement, ExtraCost (raw config, distinct
-- from extra_cost_config which is the resolved typed version),
-- FixedCost, Ingredient, IngredientRestockBatch, IngredientRestockPayment,
-- InvoiceConfig, InvoiceOrderQueueTemplateConfig,
-- InvoiceReceiptTemplateConfig, OptionGroup, OrderQueue, OrderSetting,
-- ProductIngredientBinding, Restock, SecurityConfig.

-- ---------------------------------------------------------------------
-- INDEXES (for the analytics layer - Step 8)
-- ---------------------------------------------------------------------

CREATE INDEX idx_invoice_date ON invoice(invoice_date);
CREATE INDEX idx_invoice_customer ON invoice(customer_id);
CREATE INDEX idx_invoice_payment_method ON invoice(payment_method_id);
CREATE INDEX idx_invoice_item_invoice ON invoice_item(invoice_id);
CREATE INDEX idx_invoice_item_product ON invoice_item(product_id);
CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_points_history_customer ON points_history(customer_id);
CREATE INDEX idx_points_history_invoice ON points_history(invoice_id);
CREATE INDEX idx_restock_batch_supplier ON product_restock_batch(supplier_id);
CREATE INDEX idx_restock_batch_item_batch ON product_restock_batch_item(batch_id);
CREATE INDEX idx_restock_batch_item_product ON product_restock_batch_item(product_id);
CREATE INDEX idx_restock_payment_batch ON product_restock_payment(batch_id);
CREATE INDEX idx_shift_cashier ON shift(cashier_id);
CREATE INDEX idx_expense_date ON expense(expense_date);
CREATE INDEX idx_invoice_debt_customer ON invoice_debt(customer_id);
CREATE INDEX idx_invoice_debt_payment_debt ON invoice_debt_payment(invoice_debt_id);
