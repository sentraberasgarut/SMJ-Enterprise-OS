# 11 Data Platform

## ⚠️ Naming Correction Made During This Refactor

The data platform in this folder was originally built and named
"SBGA_Data_Platform." **This was a naming error, corrected here.** The
underlying data is confirmed (via the `Store` entity inside the export
itself: name "Toko Sembako Sejahtera," businessType RETAIL, address in
Garut) to belong to **Toko Sembako Sejahtera**, not SBGA. SBGA has zero
live sales to date. The folder has been renamed
`Toko_Sembako_Sejahtera_Data_Platform/` to reflect reality. No content was
altered — only the name, to remove this inconsistency per the refactor
mandate.

## What's Inside

The complete, previously-delivered SBGA Data Platform v1 project,
migrated as-is: raw export, resolver, normalized SQLite schema (26 tables),
loaded database (1,537 rows, 0 skipped), data quality report, business
dictionary, and 10 tested analytics SQL files.

```
Toko_Sembako_Sejahtera_Data_Platform/
├── README.md                 <- original project README (architecture, execution flow)
├── raw/loka_export.json      <- untouched original export
├── docs/                     <- Data Inventory + ERD
├── database/                 <- schema.sql + sbga.db (operational SQLite DB)
├── scripts/                  <- resolver, importer, analytics SQL
└── reports/                  <- import report, data quality report, business dictionary
```

## Headline Facts (Real, Validated)

- 42 entities detected, all accounted for
- 1,537 rows loaded across 26 tables, 0 skipped
- 75 FK violations found and explained (2.4% of relational rows), none deleted
- 316 invoices, 44 products, 6 suppliers, 8 registered customers, 13 confirmed relationships

## Current Operational Maturity

**Data layer: production-ready.** The SQLite database is validated,
documented, and query-tested. **Analytics/AI/Dashboard layers: not started**
— per the original project's explicit instruction to stop after SQLite and
wait for review before building DuckDB or dashboards. That review has not
yet happened.

## Known Limitations (carried forward from the original project)

1. Employee table structure unverified (0 records in export)
2. 71 invoice line items have no unit-group (real, minor source-data gap)
3. 4 isolated orphan rows (2 PointsHistory, 1 InvoiceDebtPayment, 1 Shift)
4. 21 config/settings entities stored generically rather than individually normalized

## Future Dashboard Roadmap

Per the original project and not yet started:
1. Load into DuckDB for faster analytical queries
2. Materialize the 10 analytics SQL files as DuckDB views
3. Build a semantic/metrics layer
4. AI-layer natural-language querying
5. CEO Dashboard (explicitly out of scope until the above are reviewed)

## Cross-References

- `02 Business Units/Toko Sembako Sejahtera/README.md`
- `10 Finance/README.md`, `04 Products/README.md`, `05 Customers/README.md`, `06 Suppliers/README.md`, `07 Operations/README.md` (all draw real numbers from here)
