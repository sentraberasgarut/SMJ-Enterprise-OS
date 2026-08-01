# Loka Connector v1 — Technical Specification

| | |
| --- | --- |
| **Type** | Technical specification only — not code, not an API, not a database design, not an architecture document |
| **Date** | 1 August 2026 |
| **Grounded in** | [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md), [Canonical Data Contract v1](../architecture/canonical-data-contract-v1.md), [Production Architecture v1](../architecture/production-architecture-v1.md) §3.2 (Ingestion), [Data Governance Framework v1](../architecture/data-governance-framework-v1.md) §5, §8, [Business Rules Catalog v1](../knowledge/business-rules-catalog-v1.md), [Dashboard Reconciliation Audit](../reports/dashboard-reconciliation-audit.md), [Loka Source Forensics 2026-08-01](../reports/loka-source-forensics-2026-08-01.md), and the working behavior of `prototype/loka-canonical-poc` (existing `src/extract.js`, `src/shared/fieldParser.js`, `src/shared/provenance.js`) |

Wherever this spec states a behavior as **already implemented**, it is describing code that exists in `prototype/loka-canonical-poc` today. Wherever it states a behavior as **new/proposed**, it is describing something this spec recommends but that does not exist yet. Nothing in this document changes any existing code.

---

# 1. Connector Purpose

ADR-0003 §3 establishes the general architecture: "Realm is the first implemented connector, not the model" — a dedicated connector per source format, translating a source-native artifact into the Canonical Layer's shape, with nothing downstream depending on the source format directly (Consumer Isolation Principle). Production Architecture §3.2 names the Ingestion component's purpose as exactly this translation step.

**This spec defines what it means to promote the already-validated prototype (`prototype/loka-canonical-poc`) into the first production connector** — the same extraction/normalization/validation logic already proven against real data, now specified with the discovery, validation, classification, output, failure-handling, and audit behaviors a production connector needs that a one-off prototype did not.

This connector's scope is **Loka POS `.realm` backups only**. It does not cover Buku Toko, the GitHub repository, or any other Authoritative Source named in ADR-0003 §3.

---

# 2. Input

## Supported Backup Formats
- **`.realm`** — the only format this connector processes. Directly confirmed working against two real backups in this repository's history (30 July and the 1 August backup analyzed in the Loka Source Forensics report).
- **The daily `loka-YYYY-MM-DD.json` export**, named in ADR-0003 §1 as a second Loka export artifact, is **explicitly out of scope for this spec**. Its reliability, naming behavior, and relationship to the `.realm` backup are unresolved (Implementation Backlog BL-007) — this connector does not attempt to reconcile the two.

## Expected Folder Layout
The most recently observed backup location is `H:\My Drive\SBGA OS\Loka Kasir\Agustus\` — a Google-Drive-synced folder, organized by a month-name subfolder. **This is a single observed instance, not a confirmed stable convention.** Prior backups in this repository's history were found directly under `C:\Users\WIN10\Downloads\`, a completely different location with no month-subfolder structure. This spec does not assume either location is permanent — see Open Questions.

## Backup Naming Assumptions
Data Governance Framework §5 documents an observed naming pattern: `[appVersion-vSchemaVersion] loka-stok-backup-DD-M-YYYY.realm`. **This spec does not treat that pattern as trustworthy input.** Per the operator's own direct statement (this task's Recent Finding #2), the filename currently in use was **manually renamed** by the operator, not produced automatically by Loka. The connector must never derive the backup's actual date, or any other fact, from the filename.

## Known Filename Ambiguity
Two separate, related issues are on record, and this spec treats them as distinct:
1. **The filename cannot be assumed to be Loka's original, automatically-generated name.** The current file (`[1.7.36-v109] loka-stok-backup-1-8-2026.realm`) may reflect the operator's own correction rather than an automated, trustworthy label.
2. **Loka's own UI displayed an incorrect month during backup creation** (1/7/2026, i.e. 1 July, shown while the backup was actually taken on 1 August) — per this task's Recent Finding #3. The Loka Source Forensics report (2026-08-01) directly inspected this exact backup's raw Realm timestamps and found them internally consistent, with 31 July data correctly stored under July and no month-level offset in the underlying data. **This spec treats the UI display issue as a possible UI-layer bug only, separate from the stored data, and does not redesign any parsing logic because of it** — consistent with this task's explicit instruction and the Forensics report's own conclusion (Realm timestamps: not supported as the source of the observed symptom).

**Net effect on this spec:** the filename is a human-readable label for audit purposes only — never an input to any decision the connector makes about which backup is newest, what date it covers, or whether it is valid.

---

# 3. Backup Discovery

## How the Newest Backup Should Be Selected
**Not by filename date-parsing** — per Section 2, the filename is untrusted. The recommended policy, directly modeled on the technique already used and proven in the Loka Source Forensics investigation: open each candidate `.realm` file read-only, extract the maximum timestamp across its top-level date-bearing entities (Invoice, Shift, Expense, InvoiceDebt at minimum — the same entities inspected in that forensic investigation), and treat the file with the latest such maximum as the newest. Filesystem modification time is a weak, secondary signal only (useful as a first-pass filter to avoid opening every historical file, not as the deciding factor) — it reflects when a file was written to this location, not necessarily what date its data covers.

## How Duplicate Backups Should Be Handled
Two backup files with an **identical SHA-256 checksum** (already computed per file during extraction, per `extract.js`'s existing `checksumFile()` function) are the same backup under two names or in two locations. Implementation Backlog BL-010 already names the gap this closes: "the canonical prototype computes a SHA-256 checksum per run but does not store or compare it anywhere." This spec's recommended behavior: the second occurrence of an already-processed checksum is not re-ingested — it is logged as a detected duplicate and skipped, without producing a second canonical output or a second audit-trail entry claiming new data. This is a specification of intended behavior, not new logic beyond what BL-010 already anticipates.

## How Renamed Backups Should Be Treated
Exactly as any other backup — validated and processed based on its content (checksum, internal timestamps, schema version), never rejected or specially handled because its name doesn't match an expected pattern. The filename is recorded in the audit trail (Section 8) as a label, alongside the facts actually derived from content, so a human reviewing the audit trail can see both — a mismatch between the label and the content-derived facts is useful information to surface, not a reason to fail the run.

---

# 4. Validation

Checks required before a backup's data is trusted. The first three below are already implemented in `extract.js`; the remainder are new, specified here for the first time.

| Check | Behavior | Status |
| --- | --- | --- |
| **Missing backup** | No file exists at the resolved path. | **Already implemented** — `extract.js` checks `fs.existsSync()`, throws `ExtractionError` if absent. |
| **Corrupted backup** | The file exists but `Realm.open()` fails (unreadable, not a valid Realm file, or damaged). | **Already implemented** — wrapped in try/catch, throws `ExtractionError`. |
| **Partial backup** *(structural, distinct from a partial business day — see Section 5)* | The file opens successfully, but one or more of the top-level entity types this connector expects (Invoice, Shift, Expense, Customer, Supplier, Product, InvoiceDebt) is entirely absent from the schema, or the file's on-disk size is implausibly small relative to a normally-sized backup (both prior backups examined were 1,048,576 bytes exactly — a marked deviation from that size is worth surfacing, not silently ignored). | **New — not yet implemented.** |
| **Wrong schema version** | `realm.schemaVersion` does not match `LAST_KNOWN_GOOD_SCHEMA_VERSION` (currently 109). | **Already implemented** — `extract.js`'s schema-drift check, currently defaulting to policy `'warn'` (logs, does not block), configurable to `'fail'`. |
| **Unknown schema version** | The reported schema version does not match any version this repository has directly observed at all (105 and 109 are the two values seen so far, per filenames/metadata in this repository's history) — distinct from "wrong," which implies a known-but-different value. | **New — not yet implemented.** Recommended behavior: treat identically to "wrong schema version" for policy purposes, but log the distinction explicitly, since a truly novel version number is a stronger signal of an untested schema shape than a version this repository has at least seen once before. |
| **Future timestamp** | Any Invoice, Shift, or Expense date field parses to a moment later than the processing machine's current clock. | **New — not yet implemented.** Directly modeled on the check performed in the Loka Source Forensics investigation (zero found in either backup examined). The processing machine's clock is a reference point only, not asserted as perfect ground truth — consistent with how that forensic check was framed. |
| **Impossible timestamp** | A date field's raw value cannot be parsed by the existing epoch-millis-string-first / ISO-fallback logic (`fieldParser.js`, unchanged), or parses to a calendar-invalid construction. | **Partially implemented** — unparseable values already surface as `_XParseFailed` flags and a `parse-failure` validation issue in the existing pipeline. Explicit reporting of *calendar-invalid* constructions (as opposed to merely unparseable strings) is new. |

**Explicit non-change:** none of these checks alter `fieldParser.js`'s actual parsing logic. They are checks performed *using* that existing logic, not replacements for it — consistent with this task's instruction not to redesign the parser.

---

# 5. Snapshot Classification

Every processed backup is assigned exactly one status. **Grounded only in the two backups this repository has directly examined** — no status below describes behavior that has not been observed, and where a status has not yet been observed in practice, that is stated plainly rather than assumed.

- **`COMPLETE_DAY`** — the backup's latest Invoice activity falls on a calendar day for which a Shift has also closed (a `closeTime` on or after that same day exists), indicating the business day was fully wound down before the backup was taken. **Not yet observed in this repository's history** — both backups examined so far (30 July, 1 August) were partial captures. This status is defined for the case a future backup is expected to eventually produce, not one already confirmed.
- **`PARTIAL_DAY`** — the backup's latest Invoice/InvoiceDebt activity falls on a calendar day for which no Shift has yet closed. **Directly matches both backups examined.** The 30 July backup was cut off mid-morning (last invoice 10:23 AM, per the Dashboard Reconciliation Audit). The 1 August backup's latest Invoice/InvoiceDebt timestamps fall roughly 46 minutes before the file was created, with no Shift closed and no Expense logged yet for that day (Loka Source Forensics report).
- **`MID_SHIFT`** — a Shift record exists whose `closeTime` is absent, empty, or unparseable, indicating an open, not-yet-closed shift at the moment of backup. **Not observed in either backup examined** — all 34 Shift records in the most recent backup, and all Shift records in the prior one, had a fully valid, parseable `closeTime`. This status is defined based on the Shift entity's own schema shape (a `closeTime` field exists, implying an unset state is meaningful), not on any directly observed instance. Whether Loka's exported data actually represents an in-progress shift this way is **UNKNOWN** — see Open Questions.
- **`UNKNOWN`** — assigned when a snapshot cannot be confidently placed in any of the above categories: for example, if per-entity latest-timestamp calendar days are inconsistent in a way none of the other statuses explain, or if the classification step itself cannot complete (e.g., a required entity is present but every one of its date fields fails to parse). This is the safe default when the other three don't clearly apply — never silently defaulted to `COMPLETE_DAY` or `PARTIAL_DAY` on an ambiguous case.

No other status is defined. In particular, no status attempts to characterize *why* a day is partial (e.g., distinguishing "backup taken early" from "store closed early that day") — that determination is outside what backup data alone can establish, consistent with the Forensics report's own refusal to assert a cause for the asymmetry it found.

---

# 6. Connector Output

Four outputs, each already partially specified by existing code, extended here with the new Snapshot Status:

- **Canonical dataset** — `canonical.json`, the existing 8-entity shape (Product, Customer, Supplier, Shift, Expense, Invoice, InvoiceItem, Payment) produced by `normalize.js`. **Unchanged by this spec.**
- **Validation report** — `validation-report.json`, the existing output of `validate.js` (duplicate IDs, empty required values, invalid dates, negative quantities/prices, orphan references, parse failures). **Unchanged by this spec**, extended only insofar as the new checks in Section 4 add new possible issue types to the same report shape, not a new report format.
- **Metadata** — the existing per-record `_provenance` block (`sourceFile`, `sourceChecksum`, `connectorVersion`, `ingestedAt`) already produced by `shared/provenance.js`. **Unchanged.**
- **Run summary** — the existing structured summary already produced by `Logger.runSummary()` (run ID, start/finish timestamps, duration, entity counts, canonical counts, validation summary, export paths). **Extended by this spec** to include the new Snapshot Status (Section 5) as an additional field — this is the one genuinely new piece of output data this spec calls for.

No new output artifact is introduced. Snapshot Status is an addition to the existing run summary, not a new file or new stage.

---

# 7. Failure Handling

Behavior only — no retry mechanism, no scheduler, no implementation is specified.

| Failure | Required Behavior |
| --- | --- |
| Missing backup | The run aborts before any extraction is attempted. No canonical output is written or overwritten — the prior successful run's output remains the current, authoritative canonical dataset (Business Rules Catalog GOV-003, Immutable History). The failure must be surfaced to a human, not silently retried or ignored — mechanism for that surfacing is deliberately unspecified here (no scheduler/automation decision is made by this spec). |
| Corrupted backup | Same as Missing backup — abort before producing any output; prior canonical output is untouched; failure surfaced to a human. |
| Partial backup (structural) | The run aborts — a structurally incomplete file must not be partially ingested, since a partial extraction could silently under-report entity counts in a way indistinguishable from genuine business data. Prior canonical output is untouched. |
| Wrong schema version | Per the existing, already-implemented `schemaDriftPolicy`: under `'warn'` (the current default), the run proceeds and the discrepancy is logged; under `'fail'`, the run aborts before extraction, with the prior canonical output untouched. This spec does not change which policy is the default — that remains a decision already made in existing configuration. |
| Unknown schema version | Same policy behavior as Wrong schema version, with the distinction (known-different vs. never-seen-before) preserved in the log message, per Section 4. |
| Future timestamp | The run does **not** abort — this is a data-quality finding, not a structural failure. The affected record(s) are still extracted and included in canonical output (per the existing, proven "never discard records" principle), and the finding is added to the validation report as a new issue type, visible to a human reviewing that report. |
| Impossible timestamp | Same as Future timestamp — surfaced as a validation issue, record still included, run does not abort. This matches the existing `parse-failure` handling already proven in the pipeline. |

**Principle governing every row above, stated once:** per Business Rules Catalog AUT-003 (automation failures must be observable, never silent) and GOV-003 (Immutable History), a failed or aborted run must never leave the canonical dataset in a partially-updated or corrupted state — either a run completes and produces a complete, validated output, or it aborts and changes nothing.

---

# 8. Audit Trail

What must always be recorded for every processed backup, whether the run succeeds, is skipped as a duplicate, or aborts:

- The backup's file path **as found** (its label, per Section 3 — not asserted as a fact about its content).
- SHA-256 checksum of the backup file (already computed today).
- Schema version reported by Realm (already computed today).
- Connector version (already recorded today, currently `loka-canonical-poc-0.2.0`).
- Ingestion timestamp — when the connector processed the file, not any date derived from the file's own content or name (already recorded today, as `ingestedAt`).
- **Snapshot Status** (Section 5) — new, not recorded today.
- Run ID, duration, entity counts, and validation summary (already recorded today via `Logger.runSummary()`).
- For a skipped duplicate: the checksum that matched, and which prior run first processed it — new, not recorded today (depends on the duplicate-detection behavior in Section 3, itself not yet implemented per BL-010).
- For an aborted run: which check failed (Section 4) and at what stage — new, not recorded today in a structured form (currently only a free-text error message and stack trace, per `index.js`'s existing error logging).

This list does not include anything beyond what Sections 3–7 already establish is needed — no new audit field is introduced without a stated reason above.

---

# 9. Future Improvements

Named here as documented direction only — nothing in this section is implemented, and none of it modifies Loka or proposes replacing it.

- **Double-entry restock/expense workflow.** The operator's confirmed pain point: a restock (supplier → products → payment status → save) requires a second, separate manual step in Loka's Expense module to reflect the same cash outflow. This repository does not yet have a canonical entity for Restock/Purchase as a first-class concept — the Canonical Data Contract's own Relationship Model names `Supplier → Restock → Inventory` only as a conceptual chain (Service Boundary Review §4 already flagged that "Restock" is not a formally defined canonical entity). Once such an entity exists, a future Business Service (Finance Service, per `services/finance-service.md`) could derive the corresponding Expense record automatically from a canonical Restock event — eliminating the operator's second manual entry — without this connector or any other part of Enterprise OS ever writing back into Loka itself. This is future direction, not a design being started here.
- **Backup filename bug.** This spec's Section 2–3 policy (never trust the filename; classify by content) is the immediate mitigation. A future improvement would be agreeing an explicit, stable naming/storage convention with the operator, and having the connector verify a human-assigned label against content-derived facts automatically, surfacing a mismatch as a report rather than silently accepting or correcting it.
- **Multi-brand support.** This connector is scoped to TSS's Loka data only. Central Kitchen's and SBGA's Authoritative Sources remain unresolved (Production Architecture §10, Open Decisions) — extending backup discovery to brand-scoped folders/files is future work, contingent on those decisions being made first, not something this spec anticipates the shape of.
- **Scheduled processing.** This connector, as specified, is manually invoked — no scheduler, automation, or trigger mechanism is specified here (explicitly out of scope per this task's rules). Future automation would build on the Automation component already named in Production Architecture §3.9 and the staged-rollout principle (Business Rules Catalog AUT-004) — notification-first, nothing autonomous, consistent with the Human Approval Gate.

---

# 10. Open Questions

**UNKNOWN — not established by any document or observation available to this spec:**
- Whether Loka has any automatic backup-naming convention at all, or whether manual renaming by the operator is normal, expected practice.
- Whether the observed UI month-display bug (1/7/2026 shown instead of 1 August) is a one-time glitch or a recurring Loka defect.
- Whether the daily `loka-YYYY-MM-DD.json` export shares the same naming/reliability characteristics as the `.realm` backup, or behaves independently.
- Whether a `MID_SHIFT` condition has ever actually occurred in Loka's exported data, and if so, how an open shift is represented in the raw `closeTime` field.
- Whether Google Drive sync of the new `H:\My Drive\...` storage location introduces its own timing/consistency risks (e.g., reading a file mid-sync).
- What schema version boundary should be treated as "known" versus "unknown" beyond the two values (105, 109) this repository has directly observed.
- Whether the `H:\My Drive\SBGA OS\Loka Kasir\<Month>\` folder structure is a stable, ongoing convention or a one-off change from the prior `Downloads`-based location.

**ASSUMPTIONS made by this spec, stated explicitly so they can be checked, not treated as fact:**
- That comparing each candidate backup's internal maximum timestamp (Section 3) is a reliable way to determine "newest" now that filenames cannot be trusted — this is this spec's own proposed policy, not an independently confirmed external fact.
- That SHA-256 checksum equality is sufficient to treat two files as the same backup (Section 3) — a reasonable extension of Implementation Backlog BL-010's already-planned approach, not separately re-verified here.
- That the month-name subfolder convention observed once (`Agustus`) will continue for future months — assumed only for describing expected folder layout (Section 2), not confirmed.

No file besides this one was created. No code, API, database, cloud vendor, queue, scheduler, GitHub Actions, Docker, CI/CD, new architecture, ADR, roadmap, backlog, KPI, or governance document was created or modified. Nothing was committed.
