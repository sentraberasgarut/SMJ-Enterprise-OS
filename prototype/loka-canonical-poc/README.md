# Loka → Canonical Proof of Concept

**Status:** Prototype only. Not deployed, not scheduled, not cloud-hosted. Run manually, locally, by a human, with a real backup path supplied by hand.

This directory contains a small, working Node.js program that opens a real Loka `.realm` backup and produces `canonical.json` — a first, minimal proof that the pipeline ADR-0003 describes conceptually can actually run end to end against real data.

---

## Purpose

Every architecture and governance document written so far for this platform — the Canonical Data Contract, the Data Governance Framework, the Enterprise KPI Framework, the Canonical Data Layer's own README — describes what canonical data *should* look like and *why*. None of them prove it can actually be produced from a real file. This prototype exists to close that one gap, narrowly: extract eight entities from a real backup, normalize them into a canonical shape, validate them, and write the result to disk. Nothing more.

It was run against the most recently collected real backup available in this environment (`[1.7.36-v109] loka-stok-backup-30-7-2026.realm`) during development of this prototype, and produced real output: 47 Products, 8 Customers, 6 Suppliers, 32 Shifts, 45 Expenses, 481 Invoices, 1,109 derived InvoiceItems, 481 derived Payments, and zero validation issues on that particular file. The validation logic itself was separately exercised against deliberately bad synthetic data to confirm every required check actually fires — a clean result on the real file means the real file was clean, not that the checks don't work.

## Architecture

```
Realm Backup
     ↓
Extract     — open the file, read genuine top-level collections, return raw objects
     ↓
Normalize   — map raw Realm objects into canonical business objects
     ↓
Validate    — run business validation, collect warnings, never discard records
     ↓
Canonical Objects
     ↓
canonical.json (+ validation-report.json)
```

Each stage is one file with exactly one responsibility, matching the requirement this prototype was built against — `extract.js` never interprets, `normalize.js` never writes files, `validate.js` never removes records, `export.js` never computes anything.

## Folder Structure

```
prototype/loka-canonical-poc/
├── README.md
├── package.json
├── package-lock.json
├── src/
│   ├── index.js       — orchestrates Extract → Normalize → Validate → Export
│   ├── config.js       — configuration only: paths, entity lists, required fields
│   ├── extract.js       — opens the Realm file, reads raw objects, computes provenance
│   ├── normalize.js       — raw Realm objects → canonical business objects
│   ├── validate.js       — business validation, collects warnings, never discards
│   └── export.js       — writes canonical.json and validation-report.json
└── output/
    └── .gitkeep       — real output (canonical.json, validation-report.json) is
                          generated locally and is not committed; see .gitignore
```

## Execution Flow

1. Set `LOKA_BACKUP_PATH` to a real `.realm` file. No path is hardcoded anywhere in this codebase — a real backup contains Personal- and Financial-classified data (per the Data Governance Framework's classification rules) and should not be casually embedded in code.
2. Run `npm install`, then `npm start` (or `node src/index.js`).
3. `extract.js` opens the file read-only with dynamic schema discovery (no schema is supplied — the file describes its own object model, exactly as validated in `research/loka-schema-analysis.md`), reads six genuine top-level collections (`Product`, `Customer`, `Invoice`, `Shift`, `Expense`, `Supplier`), and computes a SHA-256 checksum of the source file for provenance.
4. `normalize.js` converts each raw record into a canonical shape. Two of the eight required canonical entities — `InvoiceItem` and `Payment` — are **not** separate top-level Realm tables; both are embedded inside `Invoice` (`Invoice.items`, and `Invoice.paymentMethod` / `Invoice.splitPayments`), per `loka-schema-analysis.md`. They are derived here, not extracted separately, and each derived record carries its parent `invoiceId`.
5. `validate.js` runs eight categories of business validation and returns a full report. **No record is ever removed for failing validation** — a bad record still appears in `canonical.json`; its problems appear in `validation-report.json`. Silently dropping a record would hide a real data problem, which is the exact silent-failure pattern ADR-0003 §2 already found once in this organization (the `Rekonsiliasi` sheet stalling with nothing downstream aware).
6. `export.js` writes both files to `output/`.

## Current Limitations

- **Single file, single run.** There is no incremental or delta ingestion, and no registry of previously-processed backups — running this twice on the same file produces the same output twice, with no de-duplication.
- **No automated trigger.** This is invoked manually. Per the constraints of this task, no GitHub Actions workflow, no n8n workflow, and no cloud deployment exist here — the "Cloud Ingestion" stage from `research/loka-ingestion-poc.md`'s target pipeline is not built.
- **No schema-drift detection.** Loka's schema version is recorded in the extraction metadata but is not compared against any "last known good" version. `research/loka-schema-analysis.md` already observed a schema version change (`v105` → `v109`) between backups collected days apart — this prototype would not notice if that happened again.
- **Six entities only.** Everything in Loka's schema outside the eight required canonical entities (71 object types exist in total, per `loka-schema-analysis.md`) is untouched — including `ProductCategory`, `PaymentMethod`, `BalanceBucket`, `PointsHistory`, and `ProductRestockBatch`. Left as TODO, not silently ignored.
- **No access control on output.** `canonical.json` contains real customer phone numbers and real financial figures once run against a real backup. It is written to a local, uncommitted folder with no further protection.

## Known Unknowns

Every open question already on record elsewhere is inherited here, unresolved by this prototype:

- Whether Loka's own `Product` table or Buku Toko's catalog should win when they disagree (Canonical Data Contract §4) — this prototype simply reads Loka's version, without resolving the conflict.
- Whether `Product.category` (kept here as the point-in-time snapshot, unchanged) should ever be re-resolved against a current category master (`loka-schema-analysis.md`, Unknown #5).
- Whether Loka's `InvoiceDebt` (not read by this prototype — Receivables were not in the required entity list) will ever reconcile with the Financial Baseline's manually-recorded Receivable figure.
- Branch-as-Customer detection: `loka-schema-analysis.md` observed that at least one `Customer` record is actually a Sederhana Jaya branch. No formal rule or registry for detecting this exists in any document, so `normalize.js` leaves an explicit `_isPossibleBranch: null` TODO rather than guessing from a phone number pattern.
- Whether `Invoice.profit` (carried through here as its own distinct `invoiceProfit` field, never merged with anything else) will ever be reconciled against Gross Margin and Net Margin — that reconciliation is the stated purpose of the not-yet-built `summary` canonical dataset.

## Future Cloud Migration

Per `research/loka-ingestion-poc.md`'s already-researched target architecture, this prototype's four in-process function calls (`extract → normalize → validate → export`) map directly onto a future pipeline where:

- A Drive-watching mechanism replaces the developer manually setting `LOKA_BACKUP_PATH`.
- `extract`, `normalize`, `validate`, and `export` run as a scheduled or triggered job in a managed, pay-per-use environment (per ADR-0004's "Managed Services Before Self-Hosting" principle) instead of a local `node` invocation.
- Output is written to the actual Canonical Data Layer instead of a local `output/` folder.
- A provenance/checksum registry (this prototype computes a checksum per run but does not store or compare it anywhere) prevents reprocessing the same backup twice.

None of this is implemented here. This prototype proves the four processing stages work; it does not prove they can run unattended.

## How This Prototype Relates to ADR-0003

ADR-0003 defines the Data Ingestion Architecture in the abstract: source → connector → canonical layer → consumers, with Realm named as "the first implemented connector, not the model." This prototype **is** that first connector, built narrowly enough to test the idea without committing to any hosting decision. `extract.js` is the connector; `normalize.js` and `validate.js` are the first real exercise of the Consumer Isolation Principle — everything downstream of this prototype would read `canonical.json`, never the `.realm` file directly.

## Cloud Buku Toko Sync (`src/cloud/`)

A separate, narrower connector lives at [`src/cloud/`](src/cloud/README.md) — it does **not** produce `canonical.json` and is not part of the pipeline described above. It reuses this prototype's proven Realm-opening and backup-discovery code to replace the Windows Task Scheduler job that produces `loka-YYYY-MM-DD.json` for Buku Toko specifically, running instead as a scheduled GitHub Actions workflow. See that directory's own README for status, verification, and required manual setup — it is code-complete and verified against real data locally, but has not yet run against live Google Drive credentials.

## How This Prototype Differs from Production

- **No laptop/Windows independence yet, for this canonical.json pipeline.** This still runs on whatever machine a person invokes `node` on — it does not yet solve the dependency ADR-0004 Principle 4 and `research/loka-ingestion-poc.md` were written to eliminate. (The separate `src/cloud/` connector above solves this for the Buku Toko JSON export specifically; this canonical pipeline remains manual.)
- **No automated trigger, no monitoring, no alerting.** A production pipeline per `research/loka-ingestion-poc.md` needs a Drive Watcher and Notification component; neither exists here.
- **No human approval gate.** Per ADR-0004 Principle 8, nothing consequential should happen on AI- or automation-produced data without a named human sign-off. This prototype's output has not passed through any such gate — it is proof-of-concept output, not an artifact anyone should treat as trustworthy for a real business decision.
- **No governed storage.** `output/canonical.json` is a local file on one machine, not the Canonical Data Layer described in `enterprise-data/canonical/README.md`.
- **No provenance registry or deduplication**, as noted above.

---

## 1. Folder Tree

```
prototype/
└── loka-canonical-poc/
    ├── README.md
    ├── package.json
    ├── package-lock.json
    ├── src/
    │   ├── index.js
    │   ├── config.js
    │   ├── extract.js
    │   ├── normalize.js
    │   ├── validate.js
    │   └── export.js
    └── output/
        └── .gitkeep
```

## 2. Files Created

- `prototype/loka-canonical-poc/README.md`
- `prototype/loka-canonical-poc/package.json`
- `prototype/loka-canonical-poc/package-lock.json` (generated by `npm install`)
- `prototype/loka-canonical-poc/src/index.js`
- `prototype/loka-canonical-poc/src/config.js`
- `prototype/loka-canonical-poc/src/extract.js`
- `prototype/loka-canonical-poc/src/normalize.js`
- `prototype/loka-canonical-poc/src/validate.js`
- `prototype/loka-canonical-poc/src/export.js`
- `prototype/loka-canonical-poc/output/.gitkeep`
- `prototype/loka-canonical-poc/.gitignore` (added so that real `canonical.json` / `validation-report.json` output, `node_modules/`, and generated content never get committed by accident — the task's own "do not commit anything" instruction applies to this whole session, but this file protects future sessions too)

## 3. Assumptions

Stated once here rather than scattered — every one of these is also called out inline in code comments or the sections above:

1. `InvoiceItem` and `Payment` are derived from `Invoice`'s embedded fields rather than extracted as their own top-level collections, because Loka's schema does not have separate top-level tables for either (confirmed directly, not assumed from documentation alone).
2. The `REQUIRED_FIELDS` list in `config.js` reflects fields observed as non-optional in Loka's own schema during `research/loka-schema-analysis.md` — treated as Loka's own rule, not an invented business policy, but explicitly marked for re-verification before production use.
3. Numeric-looking fields stored as strings in Loka (`Invoice.grandTotal`, `InvoiceItem.quantity`, `Shift.initialCash`, and others) are parsed to numbers; a failed parse is reported as a validation issue, never silently defaulted to zero.
4. Where `splitPayments` is present on an Invoice, one canonical `Payment` is emitted per split; otherwise one is emitted from `paymentMethod` plus `totalPayment`. This structure is stated directly in `enterprise-data/canonical/payments.md`; the per-split emission choice itself is this prototype's own reasonable interpretation, not something any document specifies explicitly.

## 4. TODO List

- Branch-as-Customer detection (no rule or registry exists to implement it against).
- Schema-version drift detection against a "last known good" version.
- Reconciliation between `Invoice.profit`, Gross Margin, and Net Margin (the `summary` canonical dataset's stated job).
- Provenance/checksum registry to prevent reprocessing the same backup twice.
- Normalization of every entity outside this prototype's eight (`ProductCategory`, `PaymentMethod`, `BalanceBucket`, `PointsHistory`, `ProductRestockBatch`, and everything else in Loka's 71 object types).
- Resolution of the Product/Shift/Employee Authoritative Source conflicts already on record — this prototype reads Loka's version of each without resolving which source should ultimately win.
- Automated trigger, monitoring, and notification (Drive Watcher / Notification components from `research/loka-ingestion-poc.md`).

## 5. Risks Before Production

- **Realm's SDK ecosystem lost its commercial maintainer in 2025** (`research/loka-ingestion-poc.md`) — this prototype's one dependency, `realm`, is community-maintained only, with no vendor obligation to track future Loka format changes.
- **No visibility into Loka's own release roadmap.** A future Loka update could change the `.realm` schema with zero notice, and this prototype has no drift detection to catch it.
- **Zero validation issues on the one real file tested does not mean the real data is always clean** — it means this one backup, on this one day, was clean. The validation logic was separately proven to catch bad data using synthetic records; production use should not assume every future backup will pass as cleanly.
- **Real personal and financial data flows through a developer's local machine** with this prototype, unmonitored and ungoverned, which is acceptable for a one-time proof of concept and not acceptable as a standing practice.
- **No human approval gate exists yet** between this prototype's output and any real decision — treating `canonical.json` from this prototype as authoritative for anything would violate ADR-0004 Principle 8.
