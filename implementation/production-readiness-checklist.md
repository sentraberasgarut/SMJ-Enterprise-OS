# Production Readiness Checklist — `prototype/loka-canonical-poc`

| | |
| --- | --- |
| **Status** | Checklist — no items completed yet |
| **Date** | 31 July 2026 |
| **Scope** | This connector only, not the wider Enterprise OS |

Every item is written to be actionable — a concrete change or decision, not a restated principle.

---

## Configuration

- [ ] Consolidate all configuration (backup path, output dir, entity registry, required fields) behind a single startup-time validation step that fails fast with a clear error, instead of discovering missing config mid-pipeline (today, a missing `LOKA_BACKUP_PATH` is only caught inside `extract.js`, after the pipeline has already logged its startup banner).
- [ ] Support loading configuration from a local `.env` file for developer use, separate from however production configuration will eventually be supplied (vendor/mechanism not decided — out of scope this sprint).
- [ ] Document every configuration value's purpose, type, default, and required/optional status in one place.
- [ ] Separate deployment configuration (paths, connector version) from business-rule configuration (`REQUIRED_FIELDS`) into distinct modules.

## Secrets

- [ ] Confirm no credential of any kind exists in this codebase today (true as of this audit) and add this as an explicit, checked property before any future change, not an assumption that holds by default.
- [ ] Design the configuration module so that when a real secret (e.g., a future Drive API credential) is eventually needed, it can be added without restructuring — without adding one prematurely now.
- [ ] Establish the rule now that secrets are never logged, before any secret exists to leak.

## Logging

- [ ] Replace `console.log` / `console.error` with a structured logger supporting at least `info` / `warn` / `error` levels.
- [ ] Attach a per-run identifier to every log line so concurrent or historical runs can be told apart.
- [ ] Log full stack traces on failure, not only `err.message` (current behavior in `index.js`'s catch-all).
- [ ] Decide and document where logs are written (stdout only, a file, both) before this runs unattended.

## Validation

- [ ] Derive `checkDuplicateIds`'s entity list (and any other validation function with a hardcoded entity array) from the same central registry `config.js` will provide — not a separately maintained list.
- [ ] Define and implement a validation severity policy: does the pipeline export unconditionally regardless of 'error'-severity issues (current behavior), or does something change downstream when errors, not just warnings, are present?
- [ ] Add run-level (batch) sanity checks — e.g., flag if a run's total record count per entity differs wildly from the prior run — as a complement to today's record-level-only rules.
- [ ] Preserve the "never discard records" guarantee explicitly as a test assertion, not only as a code comment.

## Error Handling

- [ ] Replace plain `Error` throws with typed/coded errors (e.g., `BackupNotFoundError`, `RealmOpenError`, `SchemaDriftError`) so callers can branch on error type.
- [ ] Wrap per-record conversion (`toPlainObject`) in a try/catch that reports which entity and which record failed, instead of aborting the whole extraction run on one bad record.
- [ ] Decide, explicitly, whether one entity's extraction failure should block all entities or whether each entity should extract and report independently — today it is all-or-nothing by accident of the loop structure, not by decision.

## Testing

- [ ] Build an automated test suite covering `parseNumeric`, `parseDate`, every `normalizeX` function, and every `validate.js` rule.
- [ ] Use the synthetic bad-data fixtures already exercised ad hoc during this project's prototype-verification phase as the starting set — they already proved every one of the 8 required validation categories fires correctly; formalize them rather than re-inventing test cases.
- [ ] Add a regression fixture using the real `canonical.json` / `validation-report.json` already produced from the 30 July backup, to catch any unintended change in real output during future refactors.
- [ ] Define a stated pass bar before any deployment: at minimum, one positive and one negative test case per validation category.

## Recovery

- [ ] Define behavior if the process crashes between writing `canonical.json` and writing `validation-report.json` — no atomicity guarantee exists between the two files today.
- [ ] Decide whether an interrupted run should be resumable, or must always restart cleanly from Extract.

## Schema Drift

- [ ] Implement the drift check `config.js`'s own comment already names as missing: compare the extracted `schemaVersion` against a documented last-known-good value.
- [ ] Record `109` as the current last-known-good baseline (per this session's verified extraction from the 30 July backup).
- [ ] Decide the policy itself — does detected drift block the run, warn only, or something in between? Not decided today.

## Versioning

- [ ] Confirm `CONNECTOR_VERSION` (currently `loka-canonical-poc-0.1.0`, attached to every record's provenance) is bumped deliberately whenever normalization or validation logic changes — not left stale across refactors.
- [ ] Adopt semantic versioning rules for this connector consistent with the Canonical Data Contract's own versioning rules (§9): additive changes are a minor bump, changes to existing field meaning are a major bump.

## Performance

- [ ] Test against a backup meaningfully larger than the one real file used so far (~1 MB, 481 invoices) before assuming current behavior scales.
- [ ] Note, without yet fixing: `extract.js` loads every record of every entity into memory at once via `.map()` — acceptable at current scale, worth watching, not worth premature optimization today.

## Monitoring

- [ ] Decide what "this connector is unhealthy" means, and how that would be observed, before any future automation phase begins (explicitly out of scope this sprint).
- [ ] Treat `validation-report.json`'s summary counts as the first candidate signal for any future monitoring to read.

## Security

- [ ] Confirm `output/canonical.json` (containing real customer phone numbers and financial figures) is never committed — the existing `.gitignore` already enforces this; keep verifying it as the project evolves, don't assume it stays correct unchecked.
- [ ] Confirm, as an explicit tested property rather than an assumption, that no backup file or derived output is ever transmitted anywhere by this code.
- [ ] Decide access control for the `output/` directory once this runs anywhere other than a single developer's machine.

## Documentation

- [ ] Keep `prototype/loka-canonical-poc/README.md` updated in lockstep with any refactor — it currently documents pre-refactor behavior and must not be left describing a codebase that no longer matches it.
- [ ] Add a `CHANGELOG.md` scoped to this component specifically, distinct from the enterprise-wide Financial Baseline's changelog, to track this connector's own version history going forward.
