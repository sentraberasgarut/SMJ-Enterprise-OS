# SJS Operational Data Hub Phase 1 - Current-State Audit

| | |
| --- | --- |
| Status | Draft for owner review |
| Date | 5 August 2026 |
| Scope | Toko Sembako Sejahtera, Central Kitchen, Loka export, Buku Toko |
| Source basis | Repository inspection, Roadmap v6, ADR-0003, Buku Toko SPEC, existing Loka canonical PoC |

## Executive Summary

Phase 1 should not replace Loka and should not build a new POS. The business problem is not cashier software; it is the absence of a stable operational data hub between Loka, Buku Toko, Google Drive, Google Sheets, and future reports.

The repository already contains useful architecture work and a Loka canonical prototype. The next safe step is to turn that direction into an implementation-ready Operational Data Hub: import tracking, duplicate prevention, validation, normalized entities, inventory movements, and status reporting. This can be developed with dummy data until real Loka backup/export access is approved.

## Access Status

| Repository | Status | Impact |
| --- | --- | --- |
| `sentraberasgarut/SMJ-Enterprise-OS` | Accessible locally | Work can continue here as the only inspected repository |
| `sentraberasgarut/SJS-Enterprise` | Not accessible from public GitHub URL | Treat as access blocker only; do not stop Phase 1 design |

SJS repository access is required before final placement in the intended repo. It is not required to design the architecture or build a local dummy PoC.

## Observed Current State

### Loka POS

Loka remains the sales system of record for TSS. Current integration depends on exported or backed-up data being placed where another process can read it.

Current data dependency:

```text
Loka POS
  -> local database / export / backup
  -> Google Drive folder
  -> parser / Apps Script / prototype connector
  -> Ringkasan cache or canonical output
  -> reports and dashboards
```

Strengths:

- Loka already handles production cashier work.
- Sales, products, customers, debts, expenses, shifts, and payments exist in Loka-derived data.
- Existing PoC already proves a local connector can extract and normalize Loka backup data.

Weaknesses:

- Data availability is not real-time.
- Import completion status is not business-visible enough.
- Duplicate imports and source-file lineage must be first-class records.
- Any Loka format drift could break downstream consumers unless isolated by connector contracts.

### Buku Toko and Central Kitchen

Buku Toko is already productive and should be treated as the current Enterprise OS runtime for operational workflows, not as a disposable spreadsheet.

Current workflow:

```text
PIN login
  -> barang keluar
  -> konfirmasi terima
  -> rekonsiliasi
  -> tutup shift
  -> bukti foto Drive
```

Strengths:

- Real users already use it.
- It records dispatch, receipt, reconciliation, shift closing, wallets, and activity logs.
- It has proven operational adoption in a short period.

Weaknesses:

- Central Kitchen prices are not measured yet.
- Shipment reconciliation has known ID-format risk.
- Product catalogs between Loka, TSS, and CK can drift.
- Sheets currently play too many roles: app database, configuration, report cache, and operational UI.

## Key Gaps

| Gap | Why It Matters | Phase 1 Response |
| --- | --- | --- |
| No import job ledger | Nobody can answer whether a source file was processed, skipped, duplicated, or failed | Add `import_jobs` schema and PoC |
| No stable product alias map | Loka item names, TSS catalog names, and CK names may diverge | Add `product_aliases` schema |
| No inventory movement ledger | Current stock without history cannot explain why stock changed | Add `inventory_movements` schema |
| CK transfer value not reliable | CK shipments at value 0 make group profit reports misleading | Model transfers but keep pricing decision gated |
| Apps Script production code risk | Runtime is live and cannot be changed casually | Do not touch production; document adapter boundary |
| SJS repo inaccessible | Intended target repo cannot be inspected yet | Continue safely in accessible repo and flag migration |

## Non-Negotiables

- Do not clone Loka.
- Do not reverse engineer private APIs without permission.
- Do not build a replacement POS in Phase 1.
- Do not touch production Google Sheets, Apps Script, Drive, or Loka data.
- Do not commit real customer, sales, or backup data.
- Do not treat GitHub as the transaction database.

## Implementation Readiness

Ready without owner approval:

- Dummy importer.
- Local schema draft.
- Validation rules.
- ADR and architecture documents.
- Risk register.
- Roadmap and approval summary.

Needs owner approval later:

- Real SJS repository access.
- Real Loka export/backup samples.
- Google Drive, Apps Script, or Sheets credentials.
- CK transfer pricing basis.
- Any production deployment or production data import.
