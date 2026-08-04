# SJS Operational Data Hub Phase 1 - Target Architecture

| | |
| --- | --- |
| Status | Draft |
| Date | 5 August 2026 |
| Scope | Safe architecture for TSS and Central Kitchen operational data |
| Builds on | `adr/0003-canonical-data-platform-loka-pos.md` and `architecture/canonical-data-contract-v1.md` |

## Architecture Decision

SJS Operational Data Hub is an integration and normalization layer around existing systems. It does not replace Loka and does not replace Buku Toko in Phase 1.

```text
Loka POS export / backup
        |
        v
Drive intake folder
        |
        v
Import job tracker
        |
        v
Source connector
        |
        v
Validation and quarantine
        |
        v
Canonical operational database
        |
        v
Buku Toko adapters, reports, dashboards, AI analysis
```

## Source Responsibilities

| Source | Authoritative for | Phase 1 Handling |
| --- | --- | --- |
| Loka POS | TSS sales transactions, payments, Loka expenses, Loka customer data | Read-only import |
| Buku Toko | Dispatches, receipts, reconciliation, shift closing, operational activity | Read-only adapter design until production approval |
| GitHub | Code, ADR, schema, documentation, tests | Working source of truth for implementation assets |
| Google Drive | Intake storage and photo evidence | No direct connection in dummy PoC |

## Canonical Domains

Phase 1 stores only what is needed to make TSS and CK data traceable:

- `source_files`
- `import_jobs`
- `business_units`
- `products`
- `product_aliases`
- `customers`
- `suppliers`
- `sales_orders`
- `sales_order_lines`
- `payments`
- `expenses`
- `transfers`
- `transfer_lines`
- `inventory_movements`
- `shift_closings`
- `validation_issues`

## Import Lifecycle

```text
discovered
  -> fingerprinted
  -> accepted
  -> parsed
  -> validated
  -> canonicalized
  -> published
```

Failure states:

- `duplicate_skipped`
- `validation_failed`
- `parse_failed`
- `quarantined`

Every import must produce an `import_job` record, even when it fails. Silent failure is not an acceptable state.

## Duplicate Prevention

Every source file receives:

- file name
- source type
- checksum
- observed timestamp
- source period
- importer version

If the same checksum has already been published, the importer must skip it and write a `duplicate_skipped` job. It must not rewrite canonical records.

## Consumer Contract

Consumers may read canonical records and validation reports. Consumers may not depend on Loka-native field names, Google Sheet column positions, or Drive folder layout.

This protects future migration from Apps Script to another runtime: the runtime can change while the canonical contract remains stable.

## Production Boundary

The dummy PoC writes local JSON only. A production version requires explicit owner approval for:

- real source credentials;
- destination database;
- Drive folder access;
- scheduled execution;
- production Apps Script integration;
- any real data import.
