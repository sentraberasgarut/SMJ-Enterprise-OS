# Sprint 01 — Live Data Pipeline

| | |
| --- | --- |
| **Status** | Draft — implementation blueprint, not yet started |
| **Date** | 31 July 2026 |
| **Type** | Implementation planning only — no code, no vendor selection |
| **Builds on** | [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md), [ADR-0004](../adr/0004-technology-constitution-and-investment-principles.md), [Enterprise OS Blueprint v1](../architecture/enterprise-os-blueprint-v1.md), [Canonical Data Contract v1](../architecture/canonical-data-contract-v1.md), [`loka-schema-analysis.md`](../research/loka-schema-analysis.md), [`loka-ingestion-poc.md`](../research/loka-ingestion-poc.md) |

This is the first of the sprints named in the Architecture Audit's recommended order — specifically, proving the pipeline for one connector, one domain, end-to-end, before extending to anything else.

---

# 1. Sprint Goal

**One real Loka `.realm` backup, uploaded by Ayu to Google Drive exactly the way she does today, is automatically turned into a canonical JSON record — with no Windows machine, no scheduled task, and no manual conversion step anywhere in the chain — and that record is verifiably correct and readable by Apps Script.**

That is the only outcome this sprint measures itself against. Nothing else — not a dashboard, not AI analysis, not a second brand — is in scope until this one outcome is real and repeatable.

---

# 2. Current Process

**Human actions:**
- Ayu uploads the day's `.realm` backup file to a Google Drive folder, by hand, once a day.

**System actions:**
- A Windows Task Scheduler entry on a specific machine runs a Realm→JSON conversion step at a scheduled time.
- The resulting JSON feeds into Buku Toko's Apps Script–bound spreadsheet.

**Pain points:**
- If the specific Windows machine is off, asleep, or the scheduled task fails, the whole chain stops — and nothing downstream is notified, because nothing today watches for the absence of a successful run (ADR-0003 §2; `loka-ingestion-poc.md`).
- The conversion step has no validation layer — a corrupt, partial, or schema-mismatched backup is not distinguished from a good one before use.
- There is no record of *why* a given day's data is missing or wrong — only that it is.

**Dependencies:**
- A specific physical machine, powered on and logged in, at the right time.
- Windows Task Scheduler configured correctly on that machine.
- Ayu remembering to upload daily.
- No dependency today on anyone reviewing whether the conversion actually succeeded — that step is currently invisible.

---

# 3. Target Process

**Human actions:**
- Unchanged: Ayu uploads the `.realm` backup to the same Google Drive folder, at her normal cadence. Nothing new is asked of her.

**Automation:**
- An automated mechanism detects the new file's arrival in Drive — replacing the Windows Task Scheduler trigger with something that does not depend on any specific machine being on (Required Components, Section 6).
- Parsing, validation, and canonical generation run in a cloud-hosted step, not on a laptop.

**Validation:**
- Every parsed backup is checked against the last known-good schema version, expected record shapes, and basic business sanity (e.g. no negative counts) before anything is trusted — closing the validation gap named in the Architecture Audit.
- Provenance is attached to every output: which source file, when it was ingested, which parser version ran, and a checksum of the source — per the minimum-metadata findings in `loka-ingestion-poc.md`.

**Outputs:**
- One canonical JSON record per backup, shaped according to `canonical-data-contract-v1.md`'s entity definitions (at minimum: Transaction, Product, Customer, Shift, Supplier, Expense, Receivable — the entities a Loka backup can actually produce).
- The original `.realm` file and the resulting canonical JSON are both retained permanently (Archive component).

**Failure handling:**
- Every failure scenario in Section 7 results in a human notification — never a silent stop. The target process treats "nobody was told" as a failure in itself, not an acceptable side effect of a technical failure.

---

# 4. Success Criteria

Sprint 1 is finished when all of the following are true:

1. At least one real Loka `.realm` backup, uploaded the same way Ayu uploads it today, produces a canonical JSON record with **zero manual conversion step**.
2. The pipeline runs **without any specific Windows machine or Task Scheduler entry being involved** — verified by the fact that machine can be off during a successful run.
3. The canonical JSON's record counts and key figures (e.g. transaction count, total value) **match an independent manual read of the same backup** — the same cross-check method already used in `loka-schema-analysis.md`.
4. A deliberately corrupted or malformed backup is **detected and produces a human notification**, rather than failing silently or producing a wrong canonical record.
5. The pipeline runs successfully for **at least 5 consecutive real daily uploads** without requiring manual intervention to complete — proving reliability, not just a single demo.
6. Apps Script can successfully read at least one canonical JSON output produced by this pipeline — proving the next link in the target chain, without requiring Buku Toko's existing logic to be rewritten.

---

# 5. Non-Goals

Sprint 1 explicitly does **not** include:

- No dashboard redesign
- No Apps Script rewrite — only a read-proof that it *can* consume canonical JSON
- No AI analysis capability
- No Central Kitchen — its own authoritative source is still an open item in `canonical-data-contract-v1.md`
- No SBGA — its authoritative source (Notion's operational databases) is still unresolved per ADR-0001
- No reporting redesign — the gross-margin / net-margin / `Invoice.profit` reconciliation problem is not solved this sprint
- No full canonical schema for every entity in `canonical-data-contract-v1.md` — only what one Loka backup can actually populate
- No historical backfill of previously-collected backups (23/26/27 June, 30 July) — this sprint proves the pipeline going forward, not a reprocessing project
- No cloud vendor or hosting decision — that is a separate decision this document does not make
- No changes to Loka itself — it remains an unmodified third-party black box
- No change to Ayu's manual upload habit — it stays exactly as it is today

---

# 6. Required Components

Roles only — what each component is for, not how it is built.

- **Drive Watcher** — notices that a new backup file has arrived in the Drive folder Ayu uploads to. *Why:* this is the direct replacement for Windows Task Scheduler as the trigger; without it, nothing knows a new file exists.
- **Realm Parser** — opens the `.realm` file and reads its records. *Why:* this is the one piece of technology already confirmed working against a real backup (`loka-schema-analysis.md`) — it is the only component that needs to understand Loka's proprietary format, so nothing downstream has to.
- **Validation Layer** — checks parsed data against the last known-good schema version, expected shapes, and basic sanity rules before anything is trusted; also checks the *output* against the canonical contract, and checks for duplicate uploads via checksum. *Why:* this is what structurally closes the "missing validation" weakness already named in the Architecture Audit, and prevents a corrupt or drifted read from silently becoming canonical.
- **Canonical JSON Generator** — normalizes validated data into the shape defined by `canonical-data-contract-v1.md`, with provenance attached. *Why:* this is the actual deliverable of the target process — without it, the pipeline produces parsed data, not canonical data.
- **Archive** — retains every source `.realm` file and every resulting canonical JSON record permanently. *Why:* mirrors the Never Deleted / Immutable History principle already established for the 2026-07-31 baseline; if a canonical record is ever questioned, the exact source it came from must still exist.
- **Notification** — tells a human when something needs attention, whether success or failure. *Why:* this is what prevents the exact silent-failure pattern that has already happened twice in this system (Task Scheduler, the `Rekonsiliasi` sheet stalling) from happening a third time.

---

# 7. Failure Scenarios

| Scenario | Detection | Recovery | Human Notification |
| --- | --- | --- | --- |
| **Backup missing** (Ayu didn't upload) | Drive Watcher sees no new file by an expected daily checkpoint | None possible — there is nothing to process | Notify that no backup was seen today; absence is not treated as "no news, fine" |
| **Corrupt Realm file** | Realm Parser fails to open the file | File is archived as-is for inspection; pipeline does not proceed for it | Immediate alert naming the specific file and day |
| **Schema changed** (e.g. the `v105`→`v109` drift already observed) | Validation Layer compares parsed schema version to the last known-good version | Pipeline holds the file as "needs review" rather than guessing at a changed structure | Alert that Loka's schema changed and the parser needs re-validation before further trust |
| **Duplicate upload** | Checksum of the new file matches one already archived | Skip reprocessing; no second canonical record is created | Low-priority log entry only — this is an expected, harmless case |
| **Parser crash** (unexpected error, distinct from a known-corrupt file) | Parsing step terminates abnormally | Pipeline halts for that file only; no silent infinite retry | Alert with enough detail (file, step) for a human to investigate |
| **Network error** (reaching Drive or wherever output is stored) | Step fails to connect or times out | A bounded number of automatic retries, since this class of failure is often transient | Alert only after retries are exhausted — avoids notifying on self-resolving issues |
| **Invalid output** (generated JSON doesn't match the canonical contract) | Validation Layer checks output shape, not just input | Output is not published as canonical; held for review like a parser crash | Alert naming which validation rule failed |

---

# 8. Operational Runbook

**Ayu:**
- Uploads the `.realm` backup to the same Drive folder, at her normal daily cadence — nothing changes for her.
- If notified of a missing or corrupt backup, re-uploads or checks the export from Loka.

**CEO:**
- Receives notifications that require a decision (schema changed, parser crash, repeated failures) — not routine daily successes.
- Confirms the canonical JSON output is trustworthy against Section 4's Success Criteria before anything downstream is allowed to depend on it.
- Owns the decision to extend this pipeline to a second brand or source afterward — explicitly not part of this sprint.

**Enterprise OS (the automated system):**
- Watches the Drive folder, parses new backups, validates them, generates canonical JSON, archives everything, and notifies a human on any failure or anomaly — every day, with no laptop required to be on.

---

# 9. Readiness Checklist

**Must already exist before this sprint starts:**
- A real Loka `.realm` backup available for testing (already true — several have been collected and inspected during research).
- A confirmed, stable Google Drive folder that this pipeline will watch — not assumed to be the same folder used today without checking.
- A confirmed last-known-good Loka schema version to validate future backups against (the most recently inspected backup was schema version 109 / app `1.7.36`).

**Must be verified before this sprint starts:**
- Whether ADR-0003 and ADR-0004 have been accepted by the CEO — per the Architecture Audit's own recommended sprint order, this implementation work is sequenced *behind* that decision, not parallel to it.
- Who receives Notification alerts, and how (Ayu, CEO, or both) — the mechanism is not chosen here, but the *who* should be settled before building starts.
- Ayu's actual current upload cadence and timing — not documented in anything read for this sprint, and should be confirmed directly rather than assumed.
- That the entity definitions in `canonical-data-contract-v1.md` relevant to this sprint (Transaction, Product, Customer, Shift, Supplier, Expense, Receivable) are not already pending a breaking change.
