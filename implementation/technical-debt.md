# Technical Debt Register — v1.0.0 Milestone

**Date:** 2026-08-01
**Scope:** debt identified across the prototype (`prototype/loka-canonical-poc`) and repository hygiene as of this release-prep sprint. No fixes applied in this document — classification only, per instruction.

Severity is about **impact if left unaddressed**, not effort to fix.

---

## Critical

### C1 — Regression fixture contains unredacted real PII
**File:** `prototype/loka-canonical-poc/tests/fixtures/golden-canonical.json` (1.58 MB, currently untracked)
**Reason:** This file is a direct, complete extraction of the real 30 July 2026 Loka backup — real Customer names and phone numbers (e.g. "Sederhana Jaya 4", `081225050305`), real Supplier names and phone numbers, the full local Windows filesystem path of the machine that produced it, and a SHA-256 checksum of the real production backup. It was captured intentionally as a regression baseline, but nothing marks it as sensitive, and it is about to be swept into a milestone commit by an untracked-file sweep (`?? prototype/`).
**Impact:** If this repository is ever pushed to a remote — especially a non-private one, or one with broader collaborator access than intended — this is a direct personal-data exposure: real customer and supplier contact information becomes part of permanent git history (removing it later does not remove it from history). This is exactly the class of risk `architecture/data-governance-framework-v1.md` and this repo's own `config.js` comments already warn about for the raw backup itself; the fixture reproduces the same risk in a file that looks like an ordinary test artifact.
**Priority:** Resolve before any push to a remote. Committing locally is lower-risk than pushing, but the exposure should still be closed before this becomes routine practice.
**Suggested timing:** Immediately, before this milestone is pushed anywhere. (No fix is prescribed here — options like redacting names/phone numbers in the fixture, or excluding it from version control and regenerating it locally when needed, are a decision for the next sprint, not this analysis.)

### C2 — Dashboard shows confirmed-wrong business numbers today
**Files:** documented in `reports/dashboard-reconciliation-audit.md` (pre-existing, not part of this sprint's changes)
**Reason:** Three confirmed discrepancies between the live dashboard and the real Loka data: Expenses not read from Loka's real ~Rp18.5jt figure, Kas Kasir showing ~Rp4.3jt against a Rp300rb policy limit, and Gross Profit displayed as if it were an "achieved" figure against a Net target (a different, smaller number).
**Impact:** These are numbers the business is using for real decisions right now — cash-handling policy, pricing, and profit assessment are all exposed to a wrong number of unknown magnitude of consequence. This predates the prototype work but is still open.
**Priority:** Highest business-facing priority in the repository, independent of this prototype's own readiness.
**Suggested timing:** Its own dedicated fix sprint, ideally before or alongside the "Dashboard" milestone in `implementation/enterprise-os-alpha.md` — not blocked by anything in this prototype, but also not solved by it yet.

---

## High

### H1 — Process-exit hang unresolved in the test suite
**Files:** `prototype/loka-canonical-poc/tests/shared.test.js`, `tests/regression.test.js`
**Reason:** The `Realm.shutdown()` fix (`implementation/realm-shutdown-patch.md`) was applied only to `src/index.js`, the production entrypoint, per that sprint's explicit scope. These two test files require `src/extract.js` directly and never go through `index.js`, so they still hang after all their assertions pass and require an external kill.
**Impact:** `node --test` cannot currently be run as a single command across the whole suite without a wrapper that force-kills it — blocks any future "just run the tests" workflow, including CI (see H2).
**Priority:** High — the fix pattern is already proven and low-risk (same one-line `Realm.shutdown()` call, this time in an `after()` hook), it's just not yet applied to these two files.
**Suggested timing:** Quick follow-up sprint, before wiring the suite into CI.

### H2 — Prototype test suite not wired into CI
**File:** `.github/workflows/validate.yml`
**Reason:** The existing CI workflow only runs `automation/validate.mjs` (Markdown link/ADR consistency) and a Notion sync dry-run. It has no step that runs `node --test` inside `prototype/loka-canonical-poc`.
**Impact:** A future code change to the pipeline could silently break entity counts, validation rules, or the Gross Profit figure with no automated signal — regression protection currently depends entirely on someone remembering to run the suite by hand.
**Priority:** High, but sequenced after H1 (no point wiring a suite into CI that's known to hang two of five files).
**Suggested timing:** Same follow-up sprint as H1, or immediately after.

---

## Medium

### M1 — Module-level mutable cache in `Invoice.js`
**File:** `prototype/loka-canonical-poc/src/entities/Invoice.js`
**Reason:** `deriveChildren()` memoizes its result in a single module-scoped `_cache` variable shared between the `InvoiceItem` and `Payment` entity definitions, keyed on reference equality. Correct under current single-call-per-run usage, but nothing in either definition's public shape signals this coupling.
**Impact:** Low today; would become a real bug if a future caller ever invokes `deriveAll()` more than once per process with different Invoice array instances representing the same logical data.
**Priority:** Medium — worth a comment or scoped closure next time this file is touched, not urgent on its own.
**Suggested timing:** Opportunistic — next time `Invoice.js` is edited for any other reason.

### M2 — Duplicate issue emission by design in `validate.js`
**File:** `prototype/loka-canonical-poc/src/validate.js`
**Reason:** `checkInvalidDates` and `checkParseFailures` both fire for the same date-shaped parse failures, intentionally matching the original prototype's overlapping behavior. Documented in-code, but a future reader could mistake it for an oversight.
**Impact:** Cosmetic — validation-report issue counts include some double-counting for date fields specifically. Does not affect the `totalIssues === 0` clean-data guarantee.
**Priority:** Medium — worth resolving if `validate.js`'s rule set is ever revisited, not before.
**Suggested timing:** Next time validation rules are intentionally changed (explicitly out of scope for this milestone).

### M3 — No pre-refactor performance baseline
**Reason:** The entity-registry refactor was validated for correctness (byte-identical output) but not for performance, because no pre-refactor timing was captured before the refactor began, and the prototype was never committed to git before the refactor (no commit to check out and re-benchmark).
**Impact:** Low today (current run: ~1.0–1.1s of internal pipeline work against 481 invoices) but means a future performance regression has no baseline to be caught against.
**Priority:** Medium.
**Suggested timing:** Capture a baseline now, while the current numbers are fresh, so the *next* change has something to compare against.

### M4 — Prototype scope is deliberately partial, but untracked as a backlog
**Reason:** Only 8 of Loka's ~71 Realm object types are normalized. Several fields are explicit code-level TODOs: Unit-of-Measure master resolution (`Product.unit`), Customer branch-detection heuristic (`_isPossibleBranch`), ProductCategory master resolution. These are intentional and documented in-code, but exist only as scattered comments, not as a single tracked list.
**Impact:** Low — nothing is broken, but scope decisions live in code comments rather than somewhere a future planning session would naturally look.
**Priority:** Medium.
**Suggested timing:** Worth consolidating into a single backlog entry before Enterprise OS Alpha's "Canonical" phase expands entity coverage.

---

## Low

### L1 — Dead export in `shared/logger.js`
**File:** `prototype/loka-canonical-poc/src/shared/logger.js`
**Reason:** `LEVELS` (`['debug','info','warn','error']`) is exported but never imported or used anywhere, including inside `Logger` itself.
**Impact:** None functionally; minor clarity cost for a future reader wondering what consumes it.
**Priority:** Low.
**Suggested timing:** Trivial cleanup, whenever `logger.js` is next touched.

### L2 — `archive/README.md` and root `README.md` reference an already-completed cleanup
**Files:** `archive/README.md`, `README.md`
**Reason:** Both describe a pending manual deletion of a root-level `SMJ-Enterprise-OS.zip` and `SMJ-Enterprise-OS/` folder (leftover from the first Notion migration attempt, per ADR-0001). Confirmed via `git log` that this cleanup already happened (commits `515596a` and `2009139`) and confirmed via direct filesystem check that neither artifact exists.
**Impact:** None functionally — purely stale instructions that no longer match reality.
**Priority:** Low.
**Suggested timing:** Update or remove the note next time `archive/` or root `README.md` is touched for any other reason.

### L3 — Two dead relative-path references
**Files:** `README.md` (references `data/snapshots/`, which does not exist anywhere in the repo), `roadmap/README.md` (prescribes `roadmap/archive/` as the destination for superseded roadmap versions, but that directory has never been created — no prior roadmap version has ever actually been archived there).
**Impact:** None functionally (the repo's own link-checker, `automation/validate.mjs`, only checks actual Markdown links — bracketed text followed by a parenthesized path — not prose mentions of a path, so these don't fail CI) — but both are confusing for a reader trying to follow the stated convention.
**Priority:** Low.
**Suggested timing:** Whenever either file is next edited for any other reason.

### L4 — `automation/sync-notion/manifest.json` covers a small fraction of the repo's Markdown files
**File:** `automation/sync-notion/manifest.json`
**Reason:** Currently maps only 3 files to Notion pages (ADR-0001, the 30 Jul audit, and a disabled roadmap v6 entry) despite dozens of other Markdown documents existing across `adr/`, `ops/`, `architecture/`, `implementation/`, etc. The sync automation itself is also noted in `automation/README.md` as never having been run in production.
**Impact:** Low today (Notion is documented as a mirror, GitHub is authoritative per ADR-0001) — but means most of this repo's documentation has no Notion-side counterpart at all, which could surprise anyone assuming the mirror is comprehensive.
**Priority:** Low.
**Suggested timing:** Whenever Notion-side visibility for these newer documents is actually needed — not blocking for this milestone.
