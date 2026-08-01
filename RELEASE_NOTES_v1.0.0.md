# Release Notes — v1.0.0

**Date:** 2026-08-01
**Repository:** SMJ-Enterprise-OS (CV Sederhana Maju Jaya)

---

## Purpose

This milestone marks the end of the documentation-and-prototyping phase and the point where a real, working, validated piece of the Enterprise OS exists: a Canonical Data Layer connector that turns a real Loka POS backup into trustworthy, business-verified data. It is a checkpoint, not a launch — nothing here is deployed, scheduled, or customer-facing.

## Scope

This release covers:
- The full architecture and governance documentation stack (ADRs, Canonical Data Contract, Data Governance Framework, Enterprise KPI Framework, Production Architecture v1).
- The immutable Financial Baseline (31 July 2026 reset).
- A working prototype (`prototype/loka-canonical-poc`) that extracts, normalizes, validates, and exports canonical business data from a real Loka `.realm` backup.
- A refactor of that prototype into a maintainable, entity-registry-driven structure, independently validated to produce byte-identical output.
- A root-cause investigation and fix for a process-exit defect discovered during validation.

It does **not** cover: any fix to the live dashboard's known-wrong numbers, any automation or scheduling, any cloud deployment, or any change to business pricing/margin decisions still pending CEO review.

## Major Achievements

1. **A canonical data model exists and is proven correct against real data**, not just designed on paper — Product, Customer, Supplier, Shift, Expense, Invoice, InvoiceItem, Payment, verified against the 30 July 2026 backup with zero validation issues.
2. **The prototype survived a real refactor without losing correctness** — an entity-registry pattern replaced three separate hardcoded entity lists, and the refactored output was proven byte-identical to the pre-refactor baseline, not just assumed to be.
3. **A real, reproducible production defect was found, root-caused, and fixed** — not worked around — using direct experimentation rather than guesswork, with the fix traced to the library's own documented API.
4. **The financial baseline is now immutable and checksum-verified**, giving the business one agreed-upon starting point going forward.
5. **A known set of real dashboard bugs was found and documented** (not yet fixed) — the business now has a precise, evidenced list of what's wrong with the numbers it looks at today, instead of a vague sense that something might be off.

## Architecture Completed

- ADR-0003 (Canonical Data Platform) and ADR-0004 (Technology Constitution) — both still formally **Proposed, pending CEO acceptance**, not yet binding decisions.
- Enterprise OS Blueprint, Canonical Data Contract, Data Governance Framework, Enterprise KPI Framework, Production Architecture v1 — a complete, internally cross-referenced layer stack covering Business/Application/Data/Infrastructure/Governance concerns, event flow, and a Production Readiness Matrix.
- Master data and canonical data governance scaffolding (`enterprise-data/master/`, `enterprise-data/canonical/`) — structure and rules defined; actual master data not yet populated (explicitly out of scope, marked "Draft — governance definition only" throughout).

## Prototype Completed

- Extract → Normalize → Validate → Export pipeline, run against the real 30 July 2026 backup.
- Config-driven entity registry — adding an entity means one new file, one require line, nothing else.
- Typed errors, structured logging, shared field-parsing logic.
- 52/52 automated test assertions passing across 5 test files.
- Confirmed figures: Revenue Rp208,131,203; Gross Profit (Σ Invoice.invoiceProfit) Rp14,958,715.89; 481 Invoices, 1,109 InvoiceItems, 481 Payments, 0 validation issues.

## Validation Completed

- Independent, twice-repeated field-level comparison of pipeline output against golden fixtures — identical both times.
- Business figures re-derived independently of the test suite's own assertions and cross-checked against the figure already on record in this repo (~Rp14.9jt gross profit for July 2026) — consistent.
- Full repo consistency check (`automation/validate.mjs`) passes: 69 Markdown files, no dead relative links, no conflicting Accepted ADRs, exactly one active roadmap.

## Known Limitations

- The prototype covers 8 of Loka's roughly 71 object types by deliberate scope decision — several fields (Unit of Measure, Customer branch detection, Product category master) remain explicit TODOs.
- The pipeline runs manually, once, on one machine, pointed at one manually-provided backup file — no automation, no scheduling, no cloud.
- Two of five test files still require manual process termination after their assertions pass (see Known Risks).

## Known Risks

- **A test fixture (`tests/fixtures/golden-canonical.json`) contains real, unredacted customer and supplier names and phone numbers** extracted from the production backup — flagged before this repository is pushed to any remote. See `implementation/technical-debt.md`, item C1.
- **The live dashboard has three confirmed, unresolved numeric discrepancies** against real data (Expenses source, Kas Kasir over its Rp300rb policy limit, Gross Profit mislabeled against a Net target) — documented in `reports/dashboard-reconciliation-audit.md`, not fixed by this release. See `implementation/technical-debt.md`, item C2.
- The prototype's own test suite is not wired into CI, so future changes have no automated regression signal yet.

## Deferred Work

- Fixing the dashboard's confirmed-wrong numbers.
- Redacting or excluding the PII-bearing golden fixture.
- Extending the `Realm.shutdown()` fix to the two test files that still hang.
- Wiring the prototype's test suite into the existing CI workflow.
- Formal CEO acceptance of ADR-0003 and ADR-0004.
- Populating actual master data (currently governance stubs only).
- Everything described in `implementation/enterprise-os-alpha.md` (Daily Backup, Canonical, Business Services, Dashboard, Mobile milestones).

## Next Milestone

Phase A of the Enterprise OS Alpha roadmap — see `implementation/enterprise-os-alpha.md` for the full milestone sequence (Daily Backup → Canonical → Business Services → Dashboard → Mobile), starting from the two Critical items in `implementation/technical-debt.md` as prerequisites.
