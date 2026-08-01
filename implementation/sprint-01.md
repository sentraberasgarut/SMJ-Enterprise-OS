# Sprint 01 — Production-Grade Canonical Data Layer Connector

| | |
| --- | --- |
| **Status** | Specification only — no implementation has started. Implementation begins only after this document is accepted. |
| **Date** | 31 July 2026 |
| **Scope of this sprint's *planning*** | `prototype/loka-canonical-poc` only |
| **Builds on** | The code audit above; `implementation/production-readiness-checklist.md`; `implementation/prototype-assumptions.md`; `implementation/implementation-backlog.md` (BL-006, BL-010, BL-012) |

---

## Project Goal

Turn the existing, already-working 8-entity prototype into a maintainable production component — same entities, same behavior, structurally hardened. This is a refactor, not a feature expansion.

## Scope

- Replace the three-places-to-edit entity list problem with a single, config-driven entity registry.
- Extract the repeated "parse field, track failure flag" pattern in `normalize.js` into one shared helper.
- Introduce typed/coded errors in place of plain string-message `Error` throws.
- Add structured logging (levels, run ID, full stack traces on failure).
- Implement schema-version drift detection (compare extracted `schemaVersion` against a documented last-known-good value — `109`, per this session's verified extraction).
- Implement a provenance/checksum registry so reprocessing the same backup file is detected, not silently duplicated.
- Define and implement a validation severity policy (what happens differently, if anything, when 'error'-severity issues exist vs. only 'warning'-severity ones).
- Build a real, automated test suite covering `parseNumeric`, `parseDate`, every `normalizeX` function, and every `validate.js` rule — using the synthetic fixtures already exercised ad hoc during this project's earlier verification as the starting point.

## Out of Scope

- Adding any new canonical entity (Receivables, Stock Alerts, Goods Out) — deferred to a later sprint that benefits from the improved extensibility this sprint produces.
- Any cloud deployment, GitHub Actions, n8n workflow, or automated trigger.
- Any Apps Script or dashboard change.
- Any change to the Canonical Data Contract, Data Governance Framework, or any other architecture document.
- Committing, pushing, or opening a PR.

## Deliverables

1. A config-driven entity registry that is the single source of truth for which entities exist, their top-level/derived status, and their required fields.
2. A shared field-parsing helper replacing the ~15 hand-written duplicate blocks in `normalize.js`.
3. Typed error classes (e.g., distinguishing "backup not found" from "backup failed to open" from "schema drift detected").
4. A structured logger with levels and a per-run identifier.
5. A schema-version drift check with a defined, documented policy for what happens when drift is detected.
6. A checksum-based registry preventing duplicate processing of the same backup file.
7. A defined validation severity policy, implemented in code, not just documented.
8. An automated test suite with fixtures covering all 8 validation categories (duplicate IDs, missing references, negative quantities, negative prices, invalid dates, orphan InvoiceItem, orphan Payment, empty required values) plus parser edge cases.

## Acceptance Criteria

- Adding a 9th entity requires editing exactly one place (the entity registry), not three.
- Running the refactored pipeline against the same 30 July backup produces **field-for-field identical** canonical output to the version already verified this session (Rp14,838,116 Gross Profit, 481 invoices, 0 validation issues on real data) — any difference is a regression, not an improvement, unless explicitly justified.
- The automated test suite passes and covers, at minimum, one positive and one negative case for each of the 8 validation categories.
- Running the same backup file twice produces one canonical output, not two, with a clear log message explaining the skip.
- Every thrown error has a distinguishable type, not just a message string.
- Schema-version drift (a version other than 109) produces a visible, policy-defined signal — not silence.

## Known Risks

- **Refactoring risks silently changing real output.** The numbers themselves (Gross Profit, transaction counts, etc.) are business-critical and already independently verified — any refactor must be checked against that same real data, not just against unit tests of synthetic fixtures.
- **`realm-js` is community-maintained only**, per `research/loka-ingestion-poc.md` — refactor work should not increase reliance on any undocumented or internal Realm API surface, since there is no vendor to escalate a breakage to.
- **The schema-drift "last known good" baseline (109) is itself only one data point.** If it's wrong or becomes stale, the drift check could produce false positives or, worse, false negatives.
- **No performance testing exists.** The only real run processed a ~1 MB backup. Behavior at meaningfully larger scale is unverified.

## Dependencies

- No new production dependency is planned beyond the existing `realm` package. A test framework would be a new devDependency — this is a decision to make explicitly during implementation, not assumed here.
- Depends on the real `canonical.json` / `validation-report.json` already produced this session (from the 30 July backup) as the regression baseline.
- Depends on `implementation/prototype-assumptions.md` being reviewed — several assumptions listed there (e.g., `REQUIRED_FIELDS`' accuracy) should be re-confirmed before or during this sprint, not silently carried forward.

## Business Validation Steps

1. Before any refactor is considered complete, re-run the pipeline against the same 30 July backup (`[1.7.36-v109] loka-stok-backup-30-7-2026.realm`) and diff the output against the copy already sitting in `prototype/loka-canonical-poc/output/`.
2. Cross-check the refactored Gross Profit figure against the reconciliation audit's independently-verified Rp14,838,116 / 7.21% — any drift is a regression to investigate before proceeding, not a number to average away.
3. Confirm `validation-report.json` still reports 0 issues against the same clean backup, and still correctly flags all 8 categories against the synthetic bad-data fixtures already exercised this session (these become the permanent automated test fixtures, not new inventions).

## Rollback Strategy

Nothing is deployed or automated yet, so rollback is simple by design: the current working `src/` files are small enough that if a refactor fails business validation, the safe default is a full revert to the pre-refactor files, not a forward-patch under time pressure. No partial-migration state should ever be left in place between a working prototype and a not-yet-verified refactor.
