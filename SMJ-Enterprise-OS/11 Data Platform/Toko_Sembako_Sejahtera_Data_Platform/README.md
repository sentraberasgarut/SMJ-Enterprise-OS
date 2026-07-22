# SBGA Data Platform v1

The permanent Business Data Platform for Sentra Beras Garut Asli's retail POS
data (Loka Kasir), built to move from raw JSON export toward a real
analytics warehouse and eventually an AI-assisted CEO dashboard.

**Status: SQLite layer fully operational and validated. Stopped here per
project instruction, pending review before proceeding to DuckDB/dashboards.**

---

## Architecture

```
Loka Kasir POS (Realm Database, on-device)
        │  export
        ▼
raw/loka_export.json          <- Realm's raw internal object graph (NOT a
        │                        normal "array of tables" JSON export -
        │                        see "The Data Format" below)
        ▼
scripts/parser/realm_resolver.py     <- decodes the pointer-graph into
        │                                real, resolved records
        ▼
scripts/inspection/inspect_data.py   <- Step 1-2: profiles every entity,
        │                                detects real relationships,
        │                                writes docs/01_Data_Inventory.md
        │                                and feeds docs/02_ERD.md
        ▼
database/schema.sql                  <- Step 3: normalized SQLite schema
        │
        ▼
scripts/parser/import_json.py        <- Step 4-6: loads, validates, and
        │                                reports on database/sbga.db
        ▼
database/sbga.db                     <- Step 5: the operational SQLite DB
        │
        ▼
scripts/analytics/*.sql              <- Step 8: 10 analytics-ready queries
        │
        ▼
DuckDB warehouse                     <- Step 9: NOT YET BUILT (next phase)
        │
        ▼
Analytics Layer / AI Layer / CEO Dashboard   <- future phases, not started
```

## The Data Format (Why This Wasn't a Simple Conversion)

`raw/loka_export.json` is not a conventional per-table JSON export. It is
Realm's raw internal object store: a single flat array where

- index `0` is a schema map (`{EntityName: "table_id"}`)
- `data[table_id]` is a list of object indices belonging to that entity
- every object's field values are either literal values, or "pointer
  strings" (digit-strings that are themselves valid indices back into the
  same array)

`scripts/parser/realm_resolver.py` implements and documents the exact,
evidence-validated resolution algorithm used to turn this into real records.
This was reverse-engineered and cross-checked against 11+ entity types
before being trusted for the full import — see the module docstring for the
full reasoning, including the one documented residual ambiguity.

## Folder Structure

```
SBGA_Data_Platform/
├── README.md                  <- this file
├── requirements.txt
├── config/
│   └── config.py               <- shared path config (no hardcoded paths)
├── raw/
│   └── loka_export.json        <- the original export, untouched
├── processed/
│   └── resolved_records.json   <- full resolved dataset (all 42 entities),
│                                   intermediate artifact from Step 1
├── exports/                    <- reserved for future output exports
├── docs/
│   ├── 01_Data_Inventory.md    <- every entity, field, type, completeness,
│   │                               detected relationships, business meaning
│   └── 02_ERD.md               <- confirmed relationships, cardinality,
│                                   and what was deliberately NOT modeled
├── logs/
│   └── import.log              <- full import run log (every skip, if any)
├── database/
│   ├── schema.sql               <- the normalized schema (source of truth)
│   └── sbga.db                  <- the operational SQLite database
├── scripts/
│   ├── inspection/
│   │   └── inspect_data.py      <- Step 1-2 entrypoint
│   ├── parser/
│   │   ├── realm_resolver.py    <- the core decoding algorithm (shared)
│   │   └── import_json.py       <- Step 4-6 entrypoint
│   ├── transform/                <- reserved for future DuckDB transforms
│   ├── validation/                <- reserved for future standalone
│   │                                  validation scripts (currently
│   │                                  validation logic lives inside
│   │                                  import_json.py's verify_foreign_keys)
│   └── analytics/
│       ├── 01_revenue.sql
│       ├── 02_profit.sql
│       ├── 03_best_selling.sql
│       ├── 04_customer.sql
│       ├── 05_supplier.sql
│       ├── 06_stock.sql
│       ├── 07_margin.sql
│       ├── 08_category.sql
│       ├── 09_payment.sql
│       └── 10_daily_sales.sql
├── models/                     <- reserved for future dbt-style models
└── reports/
    ├── import_report.md         <- Step 5: row counts, attempted/loaded/skipped
    ├── data_quality_report.md   <- Step 6: FK violations, nulls, anomalies
    └── business_dictionary.md   <- Step 7: what every entity/field means
```

## Execution Flow

Run from the project root, in this order:

```bash
pip install -r requirements.txt

# Step 1-2: inspect the raw export, generate the data inventory + feed the ERD
python scripts/inspection/inspect_data.py

# Step 4-6: build the schema, load all data, validate, generate reports
python scripts/parser/import_json.py
```

Both scripts are idempotent and safe to re-run: inspection always
re-reads the raw file fresh, and the importer always drops and rebuilds
`database/sbga.db` from `database/schema.sql` (a full-refresh strategy,
appropriate for a file-based snapshot export rather than a live
incremental feed).

To run an analytics query:

```bash
python -c "
import sqlite3
conn = sqlite3.connect('database/sbga.db')
print(conn.execute(open('scripts/analytics/01_revenue.sql').read()).fetchall())
"
```

(All 10 analytics queries have been test-executed against the real loaded
database as part of this build — see conversation history / commit notes
for sample output.)

## Dependencies

- Python 3.13
- `sqlite3` (standard library)
- `pandas` (used for future transform/export convenience, not required by
  the current importer, which uses raw `sqlite3` for full control over
  error handling and logging)
- `duckdb` (installed, not yet used — reserved for Step 9)
- No hardcoded paths anywhere in the codebase — see `config/config.py`

## Data Summary (as of this build)

- **42 entities** detected in the source export, all accounted for
- **1,537 rows** loaded across 26 typed tables, **0 skipped**
- **75 foreign-key violations** found post-load (2.4% of relational rows),
  all explained and documented, none deleted — see
  `reports/data_quality_report.md`
- Source is real retail POS data from **Toko Sembako Sejahtera**, Garut
  (confirmed via the `Store` entity) — a grocery/staples retail storefront,
  not synthetic or placeholder data

## Known Limitations / Honest Gaps

1. **Employee table structure is unverified** — the export contains 0
   Employee records, so its SQLite column shape (mirrored from Cashier) is
   an educated guess, not confirmed against real data. Re-verify against a
   future export that actually contains Employee rows.
2. **71 invoice line items have no unit-group** — a real, minor source-data
   completeness gap (products missing unit configuration), not a pipeline
   defect. See `reports/data_quality_report.md` §2.
3. **4 isolated orphan rows** (2 PointsHistory, 1 InvoiceDebtPayment, 1
   Shift) reference ids that don't exist elsewhere in the export. Cause
   unconfirmed (possible prior deletions in the source POS) — flagged for
   manual review, not guessed at.
4. **21 config/settings entities are stored generically** (as JSON blobs in
   `app_config`) rather than individually normalized, since none of them
   have any detected relationship to the transactional data. This was a
   deliberate scope decision to avoid over-engineering — see
   `database/schema.sql` header comment for the full rationale.

## Future Roadmap

**Immediate next phase (per project brief — awaiting review before starting):**
- Load `database/sbga.db` into a DuckDB warehouse for faster analytical
  queries over the same normalized schema
- Materialize the 10 analytics SQL files as DuckDB views/tables

**Medium term:**
- Resolve the 4 isolated orphan rows and the Employee-table ambiguity with
  input from whoever manages the Loka Kasir POS
- Add a `scripts/validation/` standalone script (currently validation logic
  lives inside `import_json.py`) for running data-quality checks
  independently of a full reload
- Build `scripts/transform/` for any DuckDB-specific transformations
  (e.g. pre-aggregated daily/monthly rollup tables)

**Long term:**
- Analytics Layer: a proper semantic/metrics layer on top of the DuckDB
  warehouse
- AI Layer: natural-language querying over the warehouse
- CEO Dashboard: the final consumer-facing layer (explicitly out of scope
  for this phase — "Do NOT proceed to dashboards. Wait for review.")

---

*This README should be kept current — update it whenever the folder
structure, execution flow, or roadmap changes, per the project's own
documentation standard.*
