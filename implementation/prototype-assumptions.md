# Prototype Assumptions — `prototype/loka-canonical-poc`

| | |
| --- | --- |
| **Status** | Assumption inventory — every assumption baked into the current working code, named explicitly |
| **Date** | 31 July 2026 |

Each entry states what the code currently assumes, what evidence supports it, how confident that evidence makes this audit, what happens to the business if the assumption is wrong, and what would resolve it.

---

### 1. The six top-level entities are the only genuine top-level Realm tables needed

- **Current Assumption:** `Product`, `Customer`, `Invoice`, `Shift`, `Expense`, `Supplier` are queried directly via `realm.objects()`; `InvoiceItem` and `Payment` are always derivable from `Invoice`'s embedded fields, never separate top-level tables.
- **Evidence:** Directly confirmed against the real 30 July backup this session, consistent with `research/loka-schema-analysis.md`.
- **Confidence:** High.
- **Business Risk:** Low — this is an observed structural fact for schema version 109, not a guess.
- **Recommended Resolution:** Re-verify against any future schema version before trusting this remains true; schema drift is a documented, known risk.

### 2. `REQUIRED_FIELDS` reflects genuinely non-optional fields in Loka's schema

- **Current Assumption:** The fields listed per entity in `config.js`'s `REQUIRED_FIELDS` match what Loka's own schema marks non-optional.
- **Evidence:** Observed during `research/loka-schema-analysis.md`'s manual schema inspection; not independently re-verified against a fresh schema dump during this sprint.
- **Confidence:** Medium.
- **Business Risk:** Medium — too short a list misses real data problems; too strict a list false-flags valid records.
- **Recommended Resolution:** Mechanically re-derive this list from a fresh schema dump's `optional: false` flags before production use — already flagged as a TODO in `config.js` itself.

### 3. Split payments become one canonical Payment record each

- **Current Assumption:** When `Invoice.splitPayments` is non-empty, one canonical `Payment` is emitted per split entry; otherwise, one is emitted from `paymentMethod` + `totalPayment`.
- **Evidence:** This is the prototype's own design choice. `enterprise-data/canonical/payments.md` describes the general shape but does not specify this exact emission rule.
- **Confidence:** Medium — internally consistent, never confirmed against a stated business expectation.
- **Business Risk:** Medium — if the business expects split payments summed into one record rather than represented individually, downstream sums-by-payment-method could misattribute or double count.
- **Recommended Resolution:** Confirm this interpretation with whoever owns Payment reconciliation before treating it as permanent.

### 4. `Invoice.profit` is carried through unmerged, as its own field

- **Current Assumption:** `invoiceProfit` is never combined with Gross Margin or Net Margin computations.
- **Evidence:** Directly grounded in ADR-0003 §2 and independently cross-verified in `reports/dashboard-reconciliation-audit.md` (matched an independently computed Revenue-minus-COGS figure to the cent).
- **Confidence:** High.
- **Business Risk:** Low.
- **Recommended Resolution:** None needed — well-evidenced, not a guess.

### 5. `Product.category` is kept as its point-in-time snapshot, never re-resolved

- **Current Assumption:** The category value recorded on a Product at extraction time is used as-is, never re-matched against a current `ProductCategory` master.
- **Evidence:** This is the Canonical Data Contract's own documented position (§4), not invented by this prototype.
- **Confidence:** High that this matches the Contract; Medium on whether the Contract's position is the correct business call — that is a decision, not an established fact.
- **Business Risk:** Medium — if margin-by-category reporting is expected to reflect current categories rather than historical snapshots, every report built on this data would systematically use stale labels for older transactions.
- **Recommended Resolution:** This is the same open question already named in `loka-schema-analysis.md`'s Unknown #5 — needs a decision from whoever owns margin reporting.

### 6. Branch-as-Customer records are left unflagged

- **Current Assumption:** `_isPossibleBranch` exists as a field on canonical Customer but is always `null` — no detection logic runs.
- **Evidence:** `reports/dashboard-reconciliation-audit.md` found 7 of the 8 real Customer records in Loka are very likely internal (branches, a kitchen unit, a "RUMAH" entry sharing a phone number with the kitchen), not external customers.
- **Confidence:** High that the underlying problem is real; Low that "leave it unflagged" is the right permanent resolution.
- **Business Risk:** High for any future customer-behavior KPI (e.g. Repeat Customer Rate) built on this data without addressing it — it would very likely be dominated by internal transfers, not real customers.
- **Recommended Resolution:** Needs an explicit registry or confirmed rule, not a guessed phone-number heuristic — already tracked as backlog item BL-015; resolve before building any customer-behavior metric on this data.

### 7. Failed parses are recorded as `null` plus a failure flag, never silently defaulted

- **Current Assumption:** A numeric or date field that fails to parse becomes `null` with a `_xParseFailed: true` marker — never coerced to `0` or the current date.
- **Evidence:** A deliberate design principle, stated directly in code comments, consistent with the Data Governance Framework's provenance and no-silent-discard principles.
- **Confidence:** High that this is internally consistent and well-reasoned.
- **Business Risk:** Low — if anything, this is already the safest available choice; included here for completeness, not because it needs fixing.
- **Recommended Resolution:** Carry this principle forward unchanged into any refactor.

### 8. One backup file per run, no incremental or delta processing

- **Current Assumption:** The connector processes exactly one `.realm` file per invocation, in full, every time.
- **Evidence:** This is the prototype's documented, stated limitation — not a hidden assumption; the `README.md` says so directly.
- **Confidence:** High that this is current behavior.
- **Business Risk:** Medium — running this in production without delta/dedup handling risks reprocessing the same data repeatedly once automation exists.
- **Recommended Resolution:** Already tracked as backlog item BL-010; resolve before any automation phase begins.

### 9. `.toJSON()` (or the manual fallback) faithfully represents every field without loss

- **Current Assumption:** Converting a Realm record to a plain object via `toJSON()` captures every field correctly, for all six top-level entities.
- **Evidence:** Spot-checked manually against sample records during this session's verified run (Product, Invoice, InvoiceItem, Payment, Shift samples were inspected directly and looked correct) — not exhaustively verified field-by-field against the full schema for every entity.
- **Confidence:** Medium — spot-checks passed; no systematic comparison was performed.
- **Business Risk:** Medium — a silently dropped or mistranslated field would not necessarily surface as a validation error unless it happens to be in `REQUIRED_FIELDS` or checked by an explicit rule.
- **Recommended Resolution:** Build the field-by-field regression test named in `production-readiness-checklist.md` before relying on this beyond spot-checks.

### 10. The one backup tested (30 July, schema v109) is representative of future backups

- **Current Assumption:** Behavior verified against this one file will hold for future backups.
- **Evidence:** This is the only backup this prototype has ever been run against in full. `research/loka-schema-analysis.md` already documents the schema version changing once (v105 → v109) between backups collected days apart.
- **Confidence:** High only for this specific file; Low for any future one.
- **Business Risk:** High if schema drift silently breaks assumptions #1 or #2 above — there is currently no automated way to detect this.
- **Recommended Resolution:** Implement the schema-drift detection already named in `production-readiness-checklist.md` before relying on this connector against any backup other than the one it was built and tested against.
