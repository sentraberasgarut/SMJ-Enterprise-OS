# Changelog

All notable changes to this repository are documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); versioning follows [Semantic Versioning](https://semver.org/).

This repository mixes business documentation (roadmap, ADRs, operations) with a software prototype (`prototype/loka-canonical-poc`). Versions here mark **repository-level milestones**, not package releases — there is no published package.

---

## [1.0.0] — 2026-08-01

### Added — Architecture & Governance
- ADR-0003: Canonical Data Platform for Loka POS.
- ADR-0004: Technology Constitution and Investment Principles.
- `architecture/production-architecture-v1.md` — full production architecture (Business/Application/Data/Infrastructure/Governance layers, event flow, sequence diagrams, Production Readiness Matrix).
- `architecture/canonical-data-contract-v1.md`, `architecture/data-governance-framework-v1.md`, `architecture/enterprise-kpi-framework-v1.md`.
- `enterprise-data/canonical/` and `enterprise-data/master/` — canonical entity definitions and master-data scaffolding (mostly README placeholders pending real master data).

### Added — Financial Baseline
- `enterprise-data/baseline/2026/2026-07-31-reset/` — immutable financial baseline (README, CHANGELOG, CHECKSUM, MANIFEST, source workbook).

### Added — Prototype (`prototype/loka-canonical-poc`)
- Working Node.js pipeline: Extract (real Loka `.realm` backup via `realm-js`) → Normalize → Validate → Export.
- Config-driven entity registry (`src/registry/entityRegistry.js`) — a new entity self-registers in `src/entities/index.js`; nothing else needs editing.
- 8 canonical entities: Product, Customer, Supplier, Shift, Expense, Invoice, InvoiceItem (derived), Payment (derived).
- Shared `fieldParser` module (numeric/date parsing, deduplicated from what was previously hand-repeated per entity).
- Six typed errors: `ConfigurationError`, `ExtractionError`, `SchemaDriftError`, `ValidationError`, `NormalizationError`, `ExportError`.
- Structured JSON logging with run ID, timestamps, duration, entity counts, and validation summary on every run.
- Automated test suite (`node:test`): `fieldParser.test.js`, `entities.test.js`, `validate.test.js`, `shared.test.js`, `regression.test.js` — 52/52 assertions passing.
- Golden regression fixtures captured from a verified run against the real 30 July 2026 backup.

### Fixed
- **Process-exit hang on the production entrypoint.** `node src/index.js` completed all pipeline work correctly but never returned control to the shell — root-caused to documented `realm-js` behavior (native background threads invisible to Node's own event-loop introspection). Fixed by calling the library's own documented `Realm.shutdown()` once, in a `.finally()` on the `main()` promise chain in `src/index.js`, covering success, failure, thrown-exception, and early-exit paths uniformly. See `implementation/root-cause-analysis.md` and `implementation/realm-shutdown-patch.md`.

### Verified
- Full regression: refactored pipeline output is field-identical to the pre-refactor golden fixtures (ignoring only provenance timestamps) against the real backup.
- Business figures unchanged and independently re-verified twice: Revenue Rp208,131,203; Gross Profit (Σ Invoice.invoiceProfit) Rp14,958,715.89; 0 validation issues; all 8 entity counts matching.
- Repo-wide consistency check (`automation/validate.mjs`) passes against the full working tree: 69 Markdown files checked, no dead relative links, no conflicting "Diterima" ADRs, single active roadmap.

### Known Issues (see `implementation/technical-debt.md` for full detail)
- A regression test fixture (`prototype/loka-canonical-poc/tests/fixtures/golden-canonical.json`) contains unredacted real customer/supplier names and phone numbers extracted from the production backup — flagged before this milestone is pushed anywhere.
- Dashboard reconciliation bugs documented in `reports/dashboard-reconciliation-audit.md` (Expenses source, Kas Kasir over policy limit, Gross Profit mislabeling) remain unfixed — out of scope for this prototype track.
- Two of five prototype test files (`shared.test.js`, `regression.test.js`) still require an external kill after their assertions pass — the `Realm.shutdown()` fix was scoped to the production entrypoint only, not the test files.
- Prototype test suite is not yet wired into the repository's existing CI workflow.

---

## [Unreleased]
Nothing yet.
