# Data Governance Framework v1

| | |
| --- | --- |
| **Status** | Draft — proposed enterprise policy, pending CEO acceptance. Inherits the same status as its foundations: ADR-0003 and ADR-0004 are themselves still Proposed, not Accepted, so this framework cannot be more binding than the decisions it operationalizes. |
| **Date** | 31 July 2026 |
| **Proposed by** | Claude (agent), on behalf of no one — CEO decides |
| **Derives from** | [ADR-0001](../adr/0001-github-authoritative-notion-mirror.md), [ADR-0002](../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md), [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md), [ADR-0004](../adr/0004-technology-constitution-and-investment-principles.md) exclusively. No new architecture, no vendor decision, and no implementation appear anywhere in this document. |
| **Supporting context** | [Enterprise OS Blueprint v1](enterprise-os-blueprint-v1.md), [Canonical Data Contract v1](canonical-data-contract-v1.md), [`loka-ingestion-poc.md`](../research/loka-ingestion-poc.md), [`loka-schema-analysis.md`](../research/loka-schema-analysis.md), [2026-07-31 Baseline Manifest](../enterprise-data/baseline/2026/2026-07-31-reset/MANIFEST.md) |

Wherever this document states a fact, it is drawn from one of the files above. Wherever no source establishes an answer, it is marked **UNKNOWN** rather than assumed.

---

# 1. Purpose

ADR-0001 through ADR-0004 establish *what* Enterprise OS believes about data — one source of truth per domain, a canonical layer between sources and consumers, a technology constitution, and a permanent financial baseline. None of those documents establish *how the organization behaves day to day* to keep those beliefs true as more people, more brands, and more automation get added.

This framework is that missing operational layer. It does not add new architecture — it takes positions already decided or proposed in the four ADRs and turns them into standing policy: who owns which piece of data, how sensitive it is, what happens to it across its life, how it is named and versioned, what "good enough quality" means, how it is backed up, and how it gets checked over time. Every automation, report, or AI action that touches Enterprise OS data is expected to operate inside this framework, the same way `canonical-data-contract-v1.md` expects every consumer to share its vocabulary.

---

# 2. Data Ownership

The entity list, Authoritative Source assignments, and known ownership conflicts below are carried forward unchanged from `canonical-data-contract-v1.md` §4 — this section does not re-litigate them, it adds the one column that document did not need: who has the authority to approve a change.

| Entity | Business Owner | Technical Owner | Authoritative Source | Consumers | Approval Authority |
| --- | --- | --- | --- | --- | --- |
| Product | CEO / Ibu & Teh Nurul (CK) | CEO (no dedicated technical role exists) | Conflicted — Buku Toko named authoritative for "catalog" (ADR-0003), Loka independently maintains its own | Apps Script, Reports, AI | CEO (TSS); Ibu & Teh Nurul (CK) |
| Customer | CEO | CEO | Loka POS | CRM, Finance, Sales & Marketing | CEO |
| Supplier | CEO / Ibu & Teh Nurul (CK) | CEO | Loka POS | Restock, Finance | CEO (TSS); Ibu & Teh Nurul (CK) |
| Transaction / Invoice | CEO | CEO | Loka POS | Finance, Inventory, CRM, Reports | CEO |
| Shift | CEO | CEO | Conflicted — Loka's Shift table and Buku Toko's Tutup Shift sheet track it in parallel | Finance, Reports | CEO |
| Cash | CEO, Ibu co-signatory | CEO | Buku Toko (custody); Baseline Snapshot (opening figure) | Finance, Reports | CEO + Ibu (per ADR-0002) |
| Inventory | CEO / Ibu & Teh Nurul (CK) | CEO | Unresolved — no true stock-movement ledger exists yet | Product, Restock, Reports | CEO |
| Price | CEO | CEO | Buku Toko catalog sheets | Product, Finance | CEO |
| Expense | CEO | CEO | Loka POS | Finance | CEO |
| Receivable | CEO | CEO | Baseline Snapshot (opening); Loka `InvoiceDebt` (ongoing) — not reconciled | Finance, CRM | CEO |
| Payable | CEO | CEO | Baseline Snapshot (opening); no ongoing source assigned | Finance | CEO |
| Branch | CEO | CEO | Buku Toko; overlaps with Customer, unresolved | Product/Restock, Invoice | CEO |
| Employee | CEO | CEO | Conflicted — Loka `Cashier` vs. Buku Toko `Pengguna` | Shift, Automation | CEO |
| Lead | CEO | CEO | Unresolved — Notion Lead Database, out of scope per ADR-0001 | Sales & Marketing, CRM, AI | CEO |
| Content | CEO | CEO | Notion Content Pipeline — same unresolved status | Sales & Marketing, AI | CEO |
| Campaign | CEO | CEO | None exists today (Assumption in `canonical-data-contract-v1.md`) | Sales & Marketing | CEO |
| Decision | CEO | CEO | Split three ways — GitHub ADRs, Log Keputusan sheet, Notion Decision Memory | Knowledge, AI, Reports | CEO |
| Baseline Snapshot | CEO | CEO | `enterprise-data/baseline/` | Finance, Reports | CEO |
| Automation Job | CEO | Unstaffed (no dedicated technical owner exists) | Does not exist as a canonical record yet | Automation, AI | CEO |
| AI Session | CEO | CEO | Does not exist as a canonical record yet | AI Workforce, Knowledge | CEO |

**UNKNOWN:** whether Approval Authority for Central Kitchen entities should sit with Ibu alone, Teh Nurul alone, or jointly — no document read establishes this distinction beyond naming them together.

---

# 3. Data Classification

| Classification | Definition | Representative Entities / Artifacts | Handling Note |
| --- | --- | --- | --- |
| **Public** | Safe for anyone outside the organization to see | Published Content (once posted, not while in draft) | Nothing else in this repository is classified Public today |
| **Internal** | Shared within the organization, not for outside parties | Product catalog, Inventory levels, Shift records, general operational reports | Default classification for operational data with no stronger sensitivity |
| **Confidential** | Sensitive enough to restrict even internally | `Cashier.pin` (a plaintext credential per `loka-schema-analysis.md` — must never enter the canonical layer at all), AI Session records, supplier contract terms | Confidential data must be excluded at the Validation Layer stage, not merely access-controlled downstream |
| **Financial** | Directly represents money, capital, or profitability | Cash, Expense, Receivable, Payable, Baseline Snapshot, Invoice/Transaction totals, margin figures | Subject to the Reconciliation Rule in the 2026-07-31 Baseline Manifest; three unreconciled margin figures (gross, net, `Invoice.profit`) already exist and must not be treated as interchangeable |
| **Strategic** | Reveals direction, ownership structure, or competitive position | ADRs, Decision records, the capital-split status flagged as unresolved in ADR-0002, the Technology Constitution itself | Changes require the same reversal discipline ADR-0001 established — a new decision that names the one it changes |
| **Personal** | Identifies a specific individual | Customer phone numbers, Employee contact/birth details, Supplier contact persons | See Section 4 — retention and deletion rights for this class are **UNKNOWN** |
| **Operational** | Necessary to run the business day to day, not strategic or financial on its own | Shift logs, Automation Job records, `BackupUploaded`-type events | May overlap with Financial (e.g. a Shift's cash figures are both Operational and Financial at once) — classification is not mutually exclusive |

---

# 4. Data Lifecycle

This restates the lifecycle already defined in `canonical-data-contract-v1.md` §7, with **Approval**, **Retention**, and **Deletion** made explicit as their own governance concerns rather than folded into "Canonical" and "Never Deleted."

- **Creation** — a business event happens or is entered by the person who witnessed it.
- **Validation** — checked against entity definitions and Data Quality Rules (Section 7) before being trusted.
- **Approval** — per ADR-0004 Principle 8, anything consequential (money, customer communication, published content) requires a named human's sign-off before it is acted upon. This is a distinct stage from Validation: validation checks correctness, approval checks authority to act.
- **Consumption** — reports, dashboards, AI agents, and automation read the approved, canonical fact. Consumption never mutates it (Consumer Isolation Principle, ADR-0003 §3).
- **Archive** — retained once active operational relevance passes, per the model already proven by the 2026-07-31 baseline.
- **Retention** — canonical and financial data is retained **indefinitely**, matching the Baseline Manifest's Integrity Rules. **UNKNOWN:** whether a shorter, defined retention period applies to lower-tier operational logs (e.g. routine Automation Job records) — no document read establishes one.
- **Deletion** — for canonical data, deletion is **effectively prohibited**, consistent with the Never Deleted / Immutable History principle. A correction is a new, dated, additive fact, never a removal. **UNKNOWN:** whether any legal or regulatory obligation (e.g. a data-subject deletion request for Personal-classified data) overrides this — no ADR read addresses data-protection law, and none should be assumed. Until clarified, Never Deleted is the default for all classifications.

---

# 5. Naming Convention

Documented as **observed precedent** where a pattern already exists in the repository, and marked **UNKNOWN** where none has been established — this section formalizes existing behavior, it does not invent new schemes.

| Category | Convention Observed | Status |
| --- | --- | --- |
| **ADR files** | `NNNN-kebab-case-title.md`, four-digit zero-padded sequence | Established, in active use |
| **Architecture / research documents** | `kebab-case-title-vN.md` or `kebab-case-title.md` | Established, in active use |
| **Baseline folders** | `enterprise-data/baseline/YYYY/YYYY-MM-DD-reset/` | Established by the 2026-07-31 baseline (MANIFEST.md) |
| **Excel workbooks** | `UPPER_SNAKE_CASE` with an embedded date and optional version tag (e.g. `FORM_RESET_TSS_31JULI2026_v2.xlsx`) | Established precedent, distinct from the documentation convention — not something this framework forces into alignment |
| **Loka backups** | `[appVersion-vSchemaVersion] loka-stok-backup-DD-M-YYYY.realm` | Controlled entirely by Loka, a third-party app — Enterprise OS records this convention, it does not set it |
| **Canonical JSON / datasets** | — | **UNKNOWN.** No naming scheme has been decided. Any future scheme must at minimum encode source, ingestion date, and be traceable to the provenance fields required in Section 7 |
| **Automation job identifiers** | — | **UNKNOWN.** No naming scheme exists. Must, at minimum, encode source, timestamp, and outcome once an Automation Job entity is implemented |
| **Git branches** | — | **UNKNOWN.** All work recorded in this repository to date has occurred directly on `main`; no branch has been used or named |

---

# 6. Versioning Rules

**Semantic versioning** — governance and architecture documents use `vMAJOR.MINOR`. An additive, non-breaking change (new entity, new event, new clarification) is a minor version. A change that alters existing meaning, removes something, or reassigns an Authoritative Source is a major version — this is the exact rule `canonical-data-contract-v1.md` §9 already sets for itself, generalized here to every governed document.

**Baseline version** — financial baselines are versioned **by date, not by number** (`enterprise-data/baseline/YYYY/YYYY-MM-DD-reset/`). Each new reset is a new, separate, permanent baseline; none overwrites a prior one. Corrections within one baseline's lifecycle are recorded in that baseline's own `CHANGELOG.md`, never by editing the baseline artifact itself.

**Schema version** — two distinct version numbers exist and must never be conflated:
1. **Source schema version** (e.g. Loka's internal `schemaVersion`, confirmed in `loka-schema-analysis.md` to match the `vNNN` filename tag) — owned entirely by the source system, outside this organization's control.
2. **Canonical contract version** (`canonical-data-contract-v1.md`'s own v1/v1.1/v2) — owned by this organization. A change in (1) does not automatically imply a change in (2), and vice versa; a source schema change may only require a Validation Layer update, not a canonical contract revision.

**ADR references** — per the reversal discipline ADR-0001 and ADR-0002 both already establish: any document that changes a prior decision must explicitly name the ADR or document it changes. No document may silently contradict an earlier one — this is the exact failure mode ADR-0001 was written to prevent (the 24 vs. 27 July contradiction found only by manual audit).

**Breaking changes** — require an explicit migration note and a stated deprecation timeline for what came before. A breaking change never takes effect silently.

---

# 7. Data Quality Rules

| Rule | What It Means Here | Grounding |
| --- | --- | --- |
| **Completeness** | A record is not canonical until every field its entity definition requires is present | `canonical-data-contract-v1.md`, Data Lifecycle |
| **Consistency** | The same business fact must not be computed two different ways without reconciliation | Directly the "No Duplicate Meaning" principle; the standing, unresolved example is gross margin vs. net margin vs. `Invoice.profit` |
| **Uniqueness** | No canonical entity may have two authoritative records for the same real-world fact | The Product / Shift / Employee ownership conflicts named in Section 2 are exactly the violations this rule exists to eventually close |
| **Integrity** | Relationships between entities (Section 8 of `canonical-data-contract-v1.md`) must remain resolvable — no orphaned references | Loka's own soft string-ID references have no enforced integrity today (`loka-schema-analysis.md`) |
| **Freshness** | Canonical data must reflect its source within a known, stated lag | The cautionary example already on record: a schema analysis performed against a backup five weeks stale relative to the rest of the organization's timeline (`loka-schema-analysis.md`, Unknown #7) |
| **Traceability** | Every canonical record must be traceable back to the business event or decision that produced it | `canonical-data-contract-v1.md` §7 |
| **Provenance** | Every ingested record must carry its source file, ingestion timestamp, connector/parser version, and a checksum of its source | Directly from `loka-ingestion-poc.md`'s minimum-metadata findings — elevated here from a research recommendation to a governance rule |

---

# 8. Enterprise Backup Policy

**Financial baseline** — governed and already in practice: baselines live at `enterprise-data/baseline/YYYY/YYYY-MM-DD-reset/`, are immutable, checksum-verified, and corrected only by appending to `CHANGELOG.md`. This is the one place in Enterprise OS where backup policy is fully realized today, not merely proposed.

**Loka backup** — Ayu uploads `.realm` backups to Google Drive manually. **UNKNOWN:** how long existing backups are retained in Drive, or whether any are ever deleted — no document read confirms a retention practice for these files today.

**Apps Script** — the code bound to Buku Toko's spreadsheet is container-bound; only one file has been copied into the GitHub repo so far (ADR-0003 §1–2). This means Apps Script's own logic has **no confirmed backup or version history** outside of whatever Google's own internal revision history retains — a gap this framework surfaces rather than resolves, since resolving it is implementation work.

**GitHub** — the repository is the authoritative source for code, decisions, and documentation (ADR-0001). Git's distributed nature means every clone is itself a copy, but this framework notes a concrete, observed gap: work has previously sat committed locally without being pushed to `origin` for multiple commits at a time during this project. A commit that is never pushed is not yet durably backed up.

**Google Drive** — used as the transport layer for Loka backups and, previously, for the baseline workbook before it was integrated into the repository. **UNKNOWN:** whether this organization relies on Drive's own built-in version history or trash-recovery window as a safety net — not confirmed anywhere.

**Recovery expectations** — **UNKNOWN.** No document defines an acceptable recovery time or process if the GitHub repository, Google Drive, or Loka device were lost. This framework does not invent numbers here; it names the absence as a governance gap to be decided, not assumed.

---

# 9. Audit Policy

No audit under this policy has yet been performed — the cadences below define what should happen once this framework is accepted, not a record of what has already occurred.

**Monthly audit** — check for source schema drift (compare the latest Loka backup's schema version against the last known-good version); check for new ad hoc artifacts appearing outside `enterprise-data/` that duplicate something already canonical; where Sprint 01's pipeline exists, verify its canonical JSON output still reconciles against Apps Script's own figures.

**Quarterly audit** — review the Data Ownership table (Section 2) for continued accuracy as the organization grows; review whether any "conflicted today" entity (Product, Shift, Employee, Branch, Decision) has been resolved or needs escalation; check whether ADR-0003 and ADR-0004 have moved from Proposed to a formal decision.

**Annual baseline review** — confirm the most recent financial baseline still accurately anchors reporting; decide whether a new baseline reset is warranted; review whether this Governance Framework itself needs a new version given a year of operating experience.

---

# 10. Governance Principles

Every element of this framework traces to one or more of the four governing ADRs. None of it introduces new architecture, chooses a vendor, or implements anything.

| Framework Element | Derives From |
| --- | --- |
| Single Source of Truth basis for Ownership and Classification | ADR-0001, ADR-0003 |
| Human Approval Gate as its own lifecycle stage | ADR-0004 Principle 8 |
| Immutability / Never Deleted default | ADR-0002's decision-permanence pattern, generalized via the 2026-07-31 Baseline Manifest |
| Versioning and the ADR-reference rule | ADR-0001 and ADR-0002's shared reversal discipline |
| No vendor selection anywhere in Backup Policy | ADR-0004 Principles 5, 6, 7 |
| Business-first framing of the Audit Policy | ADR-0004 Principles 1, 2 |
| Data Quality Rules (Consistency, Uniqueness, Integrity) | ADR-0003 §2's own diagnosis of fragmented, unranked truth |

This document makes no claim beyond what these four ADRs already support. Where the ADRs are silent, this framework says **UNKNOWN** rather than fill the silence with invented policy — the same discipline `canonical-data-contract-v1.md` applied to business entities, applied here to governance itself.
