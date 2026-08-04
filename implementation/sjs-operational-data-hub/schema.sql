-- SJS Operational Data Hub Phase 1 schema draft.
-- Purpose: implementation-ready relational shape for review and PoC mapping.
-- This file is not production migration code.

create table source_files (
  id text primary key,
  source_system text not null,
  source_type text not null,
  file_name text not null,
  checksum_sha256 text not null unique,
  observed_at text not null,
  source_period_start text,
  source_period_end text
);

create table import_jobs (
  id text primary key,
  source_file_id text not null references source_files(id),
  importer_name text not null,
  importer_version text not null,
  status text not null,
  started_at text not null,
  finished_at text,
  records_read integer not null default 0,
  records_published integer not null default 0,
  issues_count integer not null default 0
);

create table business_units (
  id text primary key,
  code text not null unique,
  name text not null,
  unit_type text not null
);

create table products (
  id text primary key,
  canonical_sku text not null unique,
  name text not null,
  category text,
  base_uom text not null,
  active integer not null default 1
);

create table product_aliases (
  id text primary key,
  product_id text not null references products(id),
  source_system text not null,
  source_product_id text,
  source_name text not null,
  source_uom text,
  confidence text not null default 'manual_required'
);

create table customers (
  id text primary key,
  source_system text not null,
  source_customer_id text,
  name text not null,
  customer_type text not null
);

create table suppliers (
  id text primary key,
  source_system text not null,
  source_supplier_id text,
  name text not null
);

create table sales_orders (
  id text primary key,
  source_system text not null,
  source_order_id text not null,
  business_unit_id text not null references business_units(id),
  customer_id text references customers(id),
  order_date text not null,
  subtotal_amount integer not null,
  total_amount integer not null,
  status text not null
);

create table sales_order_lines (
  id text primary key,
  sales_order_id text not null references sales_orders(id),
  product_id text references products(id),
  source_product_name text not null,
  quantity real not null,
  uom text not null,
  unit_price integer not null,
  line_total integer not null
);

create table payments (
  id text primary key,
  sales_order_id text not null references sales_orders(id),
  method text not null,
  amount integer not null
);

create table expenses (
  id text primary key,
  source_system text not null,
  source_expense_id text not null,
  business_unit_id text not null references business_units(id),
  expense_date text not null,
  name text not null,
  amount integer not null
);

create table transfers (
  id text primary key,
  source_system text not null,
  source_transfer_id text not null,
  from_unit_id text not null references business_units(id),
  to_unit_id text not null references business_units(id),
  transfer_date text not null,
  status text not null
);

create table transfer_lines (
  id text primary key,
  transfer_id text not null references transfers(id),
  product_id text references products(id),
  source_product_name text not null,
  quantity_sent real not null,
  quantity_received real,
  uom text not null,
  transfer_price integer,
  line_value integer
);

create table inventory_movements (
  id text primary key,
  business_unit_id text not null references business_units(id),
  product_id text references products(id),
  source_system text not null,
  source_record_id text not null,
  movement_type text not null,
  movement_date text not null,
  quantity_delta real not null,
  uom text not null
);

create table shift_closings (
  id text primary key,
  source_system text not null,
  source_shift_id text not null,
  business_unit_id text not null references business_units(id),
  shift_date text not null,
  cashier_name text not null,
  expected_cash integer,
  actual_cash integer,
  variance_amount integer
);

create table validation_issues (
  id text primary key,
  import_job_id text not null references import_jobs(id),
  severity text not null,
  rule text not null,
  entity_type text not null,
  entity_id text,
  message text not null
);
