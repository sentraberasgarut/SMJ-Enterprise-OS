# Architecture Governance Review v1 — ADR Acceptance Analysis

| | |
| --- | --- |
| **Status** | Draft — decision-support analysis only. Not itself a decision, not an ADR, not binding. |
| **Date** | 1 August 2026 |
| **Prepared by** | Claude (agent), on behalf of no one — CEO decides |
| **Purpose** | Help the CEO decide whether each of ADR-0001 through ADR-0004 should become (or remain) Accepted. No ADR is modified, and no ADR's status is changed, by this document. |
| **Grounded strictly in** | [ADR-0001](../adr/0001-github-authoritative-notion-mirror.md)–[0004](../adr/0004-technology-constitution-and-investment-principles.md), [Enterprise OS Blueprint v1](enterprise-os-blueprint-v1.md), [Canonical Data Contract v1](canonical-data-contract-v1.md), [Data Governance Framework v1](data-governance-framework-v1.md), [Enterprise KPI Framework v1](enterprise-kpi-framework-v1.md), [Production Architecture v1](production-architecture-v1.md), [Service Boundary Review](service-boundary-review.md), [Business Rules Catalog v1](../knowledge/business-rules-catalog-v1.md) |

**A fact this review must state up front, not bury:** ADR-0001 and ADR-0002 are **already Status: Diterima (Accepted)** — decided 30 July 2026. ADR-0003 and ADR-0004 remain **Status: Proposed**. The task of "helping the CEO decide whether each ADR should become Accepted" therefore means two different things here: for 0001/0002, this review assesses whether the existing Accepted status still holds up under everything built on top of it since; for 0003/0004, it assesses a live, still-open decision. Both are treated with equal rigor below — an already-Accepted decision is not exempt from scrutiny just because it's already decided.

Wherever this review cites evidence, it names the document. Wherever no document in the grounding list establishes something, it says **UNKNOWN**.

---

# ADR-0001 — GitHub as Source of Truth, Notion as Read-Only Mirror

## 1. Executive Summary
**Decision:** GitHub (`sentraberasgarut/SMJ-Enterprise-OS`) becomes the sole source of truth for knowledge, decisions, roadmap, SOPs, and automation code. Notion becomes a read-only mirror — sync is one-way (`repo → Notion`), runtime is GitHub Actions with a `NOTION_TOKEN` secret.
**Why proposed:** Reverses a 22 July 2026 decision (Notion as permanent repository). Three things had changed by 30 July: automation became a real, immediate need (the Buku Toko/Central Kitchen app was productive since 27 July with 8 active users); Notion cannot serve as a runtime (no scheduler, no reviewable versioning, cannot store or execute code); and Notion had already proven it could hold an undetected contradiction (a 24 July CEO Memo directly conflicting with a 27 July SOP, found only by manual audit on 28 July). Separately, the 22 July GitHub export itself was found stale — never updated after creation, six days old by the time anyone checked.

## 2. Evidence Review
- **Completed documents supporting this ADR:** Every architecture document in this review's grounding list treats ADR-0001 as accepted, settled infrastructure and builds on it without re-litigating it — the Enterprise OS Blueprint (§2, Authoritative Systems table), Canonical Data Contract (§2, "GitHub Repository" named authoritative for code/decisions/documentation), Data Governance Framework (§10, its own versioning and ADR-reference rules are explicitly "generalized here" from the reversal discipline ADR-0001 established), and Production Architecture (Source Systems component, §3.1) all cite it consistently, with no contradiction found across any of them.
- **Prototype or validation work confirming it:** **UNKNOWN** within this review's grounding list. None of the eight documents describes testing, auditing, or verifying that the GitHub Actions sync mechanism actually runs correctly in practice. The strongest evidence available is architectural consistency (every downstream document assumes it works), not operational proof.
- **Assumptions remaining:** That the sync mechanism continues to function as designed; that the accepted tooling-friction cost (Markdown + commit vs. Notion mobile editing) remains acceptable in practice — ADR-0001 itself names this as a real, accepted cost, not a resolved one ("Ini konsekuensi paling mengganggu sehari-hari").

## 3. Benefits if Accepted
Already realized, per ADR-0001's own stated consequences: automation no longer depends on the CEO's laptop; every change carries a commit, author, timestamp, and reviewable diff; contradictions become detectable by CI instead of only by manual audit; Apps Script code gains version history for the first time.

## 4. Risks if Accepted
Already accepted, so these are the risks of the current state, named directly in ADR-0001 itself: the CEO can no longer edit the repo from Notion mobile — edits to a mirror page are lost on the next sync, named as "the most disruptive day-to-day consequence"; writing Markdown and committing has a higher barrier than typing in Notion; initial setup (token creation, page sharing) required manual steps that could not be delegated to AI.

## 5. Risks if Deferred
Not applicable in the literal sense — this decision is not deferred, it is Accepted. Reframed as "risks of reversal" (per ADR-0001's own "Cara membalik keputusan ini" section): reversing would require a new ADR explicitly naming ADR-0001, and would risk re-introducing the exact failure this ADR was written to close — an undetected contradiction between two documents, this time possibly at a larger scale given how much has been built on GitHub-as-source-of-truth since.

## 6. Outstanding Questions
The status of Notion's separate operational databases (Lead Database, Content Pipeline, KPI Dashboard, Consultation Log) — explicitly named out of scope by ADR-0001 itself, deferred to "a future ADR after the funnel system has been designed." Still unresolved as of the most recent document in this grounding set: the Canonical Data Contract (§3) names SBGA's Authoritative Source as tied to this exact same unresolved question, and Production Architecture (§10) lists "a new ADR resolving the Notion operational-database question, already deferred once by ADR-0001" as a still-required future ADR.

## 7. Readiness Assessment
| Dimension | Rating | Basis |
| --- | --- | --- |
| Documentation | **Ready** | Complete, internally consistent, cited without contradiction by every subsequent document reviewed. |
| Architecture | **Ready** | Blueprint, Canonical Data Contract, and Production Architecture all build on it directly, without exception. |
| Prototype | **UNKNOWN / Not assessable** | No document in this review's scope describes testing the sync mechanism itself. |
| Governance | **Ready** | Data Governance Framework's own Versioning Rules (§6) are explicitly derived from ADR-0001's reversal discipline — treated as a proven, working pattern. |
| Business Alignment | **Ready** | Directly serves a named, real, already-active operational need (8 daily users on a live app). |

## 8. Recommendation
**Accept** (affirm current status; no change recommended).
**Justification:** No document reviewed contradicts this decision or its ongoing consequences. It closes a real, previously-proven failure mode (an undetected document contradiction) and every subsequent architecture document depends on it without friction. Its one named outstanding item — Notion's operational databases — was deliberately scoped out by ADR-0001 itself as a decision to be made "after the funnel system has been designed," not a flaw in this decision. The absence of direct operational proof that the sync mechanism runs correctly (Section 2) is a documentation gap in this review's evidence base, not a reason to doubt a decision this repository has already been operating under for two days at the time of this review.

---

# ADR-0002 — Dana Ibu di TSS adalah Modal Awal, bukan Hutang

## 1. Executive Summary
**Decision:** All of Ibu's funds present in TSS as of 31 July 2026 are recorded as founding capital (modal awal), not a liability. No repayment obligation, no installment schedule. Future contributions from Ibu are recorded as additional capital, not loans. Opening balance formula: *Aset − Hutang ke pihak luar = Ekuitas milik Aditya + Ibu.*
**Why proposed:** TSS's operational cash had never cleanly separated the CEO's funds from Ibu's. The 31 July books reset forced the question of whether Ibu's funds were debt or capital. The default conservative accounting assumption (treat outside funds as a liability) was found to contradict the actual agreement between Aditya and Ibu, and was corrected explicitly by both parties jointly.

## 2. Evidence Review
- **Completed documents supporting this ADR:** The 2026-07-31 Baseline Manifest directly implements this decision — its own text states "Ownership clarification... see ADR-0002. That decision is what made a clean reset possible." The Canonical Data Contract (§4) encodes it directly into the Payable entity's definition ("explicitly excluding Ibu's capital, ADR-0002"). The Enterprise KPI Framework quotes ADR-0002's exact formula verbatim as the one **Defined** formula for Opening Equity, calling it "the most firmly established KPI in this entire framework." The Business Rules Catalog (FIN-001, FIN-002, FIN-007) rates this rule's baseline application as **Implemented**, the only Financial rule in that catalog to reach that status.
- **Prototype or validation work confirming it:** Uniquely among the four ADRs, this decision has a real, executed, checksum-verified artifact directly implementing it — the Financial Baseline workbook (`FORM_RESET_TSS_31JULI2026_v2_redesign.xlsx`), whose own Manifest describes "CEO decision — Aditya, as owner, prepared and finalized this reset" and "Ibu's decision — Ibu... agreed to the capital treatment this baseline depends on, and witnessed the reset per the workbook's own signing record." This is stronger validation than a prototype in the software sense — it is a completed, signed, checksummed financial artifact.
- **Assumptions remaining:** ADR-0002 itself names four explicitly unresolved items: (1) the percentage capital split between Aditya and Ibu, (2) the basis for future profit distribution, (3) the mechanism for a capital withdrawal, (4) whether Aditya's owner salary is calculated before or after profit-sharing. Item 1 was meant to be resolved directly out of the reset process ("Nomor 1 harus keluar dari proses reset 31 Juli"); per the Business Rules Catalog's own most recent assessment (FIN-001, Known Gaps), it remains unresolved.

## 3. Benefits if Accepted
Already realized: TSS's opening equity is larger and cleaner (no debt drag from Ibu's contributions); the structure honestly reflects Ibu as a co-founder — the repository's own memory records her as a "founding catalyst" via years of built supplier relationships — rather than as a lender; the Immutable History / additive-correction discipline this decision helped establish for the Baseline is reused as a general pattern by the Canonical Data Contract.

## 4. Risks if Accepted
Named directly in ADR-0002's own Consequences section: "Modal bersama tanpa porsi tertulis adalah sumber konflik yang paling umum di bisnis keluarga" — shared capital without a written, signed split is, by the ADR's own admission, the single most common source of conflict in family businesses. Every future profit distribution depends on memory and goodwill, not a number, until the split is formalized.

## 5. Risks if Deferred
Not applicable directly — already Accepted. Reframed as risk of reversal: undoing this decision would unwind the capital-structure basis the entire 31 July Baseline (and its checksum-verified immutability) already depends on, and would require a new ADR explicitly naming ADR-0002 per its own stated reversal discipline.

## 6. Outstanding Questions
The four items named in Section 2 above, all still open as of the most recent document reviewed (Business Rules Catalog, 1 August 2026) — with items 2–4 originally given an informal "no more than one month" timeline from the ADR's own text (30 July 2026), not yet confirmed resolved.

## 7. Readiness Assessment
| Dimension | Rating | Basis |
| --- | --- | --- |
| Documentation | **Ready** | Clear, complete, explicitly names its own open items rather than hiding them. |
| Architecture | **Ready** | Canonical Data Contract and Data Governance Framework both encode it directly into entity ownership and approval rules. |
| Prototype | **Ready** | The Financial Baseline workbook is a completed, signed, checksum-verified real-world implementation — the strongest artifact-level evidence of any ADR in this review. |
| Governance | **Ready** | Data Governance Framework §2 directly assigns "CEO + Ibu (per ADR-0002)" as joint approval authority for Cash. |
| Business Alignment | **Partially Ready** | The core decision is sound and already acted on, but the unresolved capital-split item is itself a named, real business-alignment risk (future family-business conflict), not yet closed. |

## 8. Recommendation
**Accept** (affirm current status; no change recommended).
**Justification:** This decision is not only documented but already executed against a real, signed, checksum-verified financial artifact — the strongest form of evidence available in this repository for any ADR. The remaining four open items are follow-up execution work that flows *from* this decision, not evidence against the decision itself. The one real risk (Section 4) is named by the ADR's own authors and is a reason to prioritize resolving the capital split promptly — not a reason to reconsider the capital-vs-debt classification itself, which both parties have already agreed to and acted on.

---

# ADR-0003 — Canonical Data Platform for Loka POS

## 1. Executive Summary
**Decision (Proposed):** Loka POS, Buku Toko, and the GitHub repository become the three formally-declared Authoritative Sources — one per domain (sales, operations, code/decisions). A Canonical Data Platform sits between these sources and every consumer application, ingesting each source through a dedicated connector (Realm being the first, not the only one) and normalizing it into one data layer that applications read from — never source formats directly. The Consumer Isolation Principle governs this boundary.
**Why proposed:** Five places currently hold business truth with no declared hierarchy; the same metric (profit) is already computed at least two different ways with nothing forcing reconciliation; Apps Script's code is unreadable via Drive API, so audit findings can only be inferred from output, never verified against source; a canonical-data gap (130+ Central Kitchen catalog items priced at Rp0) masquerades as a data-entry gap; a reconciliation sheet stopped updating silently, with nothing downstream aware; new unversioned Excel snapshots keep appearing as disconnected copies of numbers that already exist elsewhere.

## 2. Evidence Review
- **Completed documents supporting this ADR:** This is the single most heavily built-upon ADR in the entire repository. The Canonical Data Contract explicitly "builds on" it. The Data Governance Framework "derives from... ADR-0003 exclusively" among its four foundational ADRs. The Enterprise KPI Framework derives from it directly. Production Architecture v1's entire ten-stage pipeline (Source Systems → Ingestion → Validation → Canonical Layer → Business Services → Apps Script → Dashboard → AI → Automation → Archive) is this ADR's architecture, fully elaborated with Purpose/Owner/Input/Output/Failure Mode/Recovery Strategy/Dependencies/Future Scalability for every stage. The Service Boundary Review analyzes six Business Services built entirely on this ADR's canonical-layer premise. The Business Rules Catalog's GOV-001 (Single Source of Truth) and GOV-002 (Consumer Isolation) — rated Foundational, the rules nearly every other rule in that catalog ultimately depends on — are this ADR's own principles, generalized.
- **Prototype or validation work confirming it:** This is the strongest prototype evidence of any ADR reviewed here, and the only one directly tested against real production data. `prototype/loka-canonical-poc` is a real, working implementation of exactly what this ADR proposes — one connector (Realm) ingesting into a canonical layer — validated against the real 30 July 2026 backup: 47 Product, 8 Customer, 6 Supplier, 32 Shift, 45 Expense, 481 Invoice, 1,109 InvoiceItem, and 481 Payment records extracted with zero validation issues. A subsequent entity-registry refactor was independently verified to produce byte-identical output against the pre-refactor baseline. A real production defect (a Node process-exit hang, traced to documented `realm-js` library behavior) was found through direct experimentation and fixed, then re-validated. This is not a paper architecture — it is architecture that has already been built once, broken once, and fixed once, with each step independently checked.
- **Assumptions remaining:** Central Kitchen and SBGA's Authoritative Source assignments remain unresolved — named explicitly as out of scope by ADR-0003 §6 itself ("Explicitly not decided here"), and repeated as an open item in Production Architecture §10 and the Canonical Data Contract §10. The Product, Shift, and Employee entities all have Conflicted Authoritative Sources, unresolved by this ADR (Canonical Data Contract §4; Business Rules Catalog INV-003, SAL-001, SAL-006). Which of Loka's two daily exports (the `.realm` backup vs. the separate `loka-YYYY-MM-DD.json` file) actually feeds "today"-labeled figures is unresolved. Whether the still-open ADR-0002 capital split affects any Business Services calculation touching Equity is named as an open question in Production Architecture §10.

## 3. Benefits if Accepted
Formalizes a structure already proven to work at prototype scale, with real data. Unblocks the majority of the Dashboard Refactor Plan's "B"-classified fixes, which that plan's own closing note states explicitly assume "a Canonical Data Layer that does not yet formally exist as an accepted architecture." Gives the CEO a stated, sequenced relationship to existing operational fires rather than a competing demand on the same bandwidth (ADR-0003 §4, Migration Strategy point 5: "this ADR formalizes structure, it does not compete with them for CEO time").

## 4. Risks if Accepted
Named directly in ADR-0003 §5: CEO bandwidth is the binding constraint, and platform-consolidation work risks the same one-person bottleneck already flagged in Roadmap v6; Apps Script code migration cannot be automated — the code stays unreadable via Drive API, so every file must be copied in manually; declaring a canonical system does not itself fix what is inside it (Central Kitchen remains priced at Rp0, the shipment-ID format bug remains open); the live Buku Toko app cannot be touched carelessly, since it serves 8 daily users.

## 5. Risks if Deferred
The problems this ADR diagnoses continue unaddressed: the same-metric-different-answers problem (Gross Margin / Net Margin / `Invoice.profit`) stays unreconciled, with no declared hierarchy to even detect future silent divergence. Every "B"-classified item in the Dashboard Refactor Plan — six of eleven dashboard metrics reviewed — stays blocked; the Implementation Backlog's own BL-008 names this ADR's acceptance as a direct blocker for BL-001, BL-006, BL-007, BL-009, BL-010, and BL-012.

## 6. Outstanding Questions
Central Kitchen and SBGA Authoritative Source assignments; which Loka export actually feeds "today"-labeled dashboard figures (Dashboard Reconciliation Audit, Implementation Backlog BL-007); the Notion operational-database question, shared with ADR-0001; whether ADR-0002's unresolved capital split affects any Equity-touching Business Services calculation.

## 7. Readiness Assessment
| Dimension | Rating | Basis |
| --- | --- | --- |
| Documentation | **Ready** | Extraordinarily thorough — five-plus architecture documents built directly on it, fully cross-referenced, no contradiction found. |
| Architecture | **Ready** | Production Architecture v1's complete ten-stage pipeline is this ADR fully elaborated, component by component. |
| Prototype | **Ready** | The only ADR in this review with real, executed, independently re-verified code and data behind it — including a real defect found and fixed. |
| Governance | **Partially Ready** | Extensively built upon by governance documents, but its own core principles (GOV-001, GOV-002 in the Business Rules Catalog) are themselves still rated Proposed, and no running system enforces them outside the prototype's own eight-entity, single-connector scope. |
| Business Alignment | **Partially Ready** | Strongly aligned with named, real, already-confirmed problems (the exact bugs already found — Gross/Net mislabeling, unread Expense data, the Kas Kasir violation — all trace back to the same underlying absence of a canonical layer) — but the alignment is currently proven for TSS only; Central Kitchen and SBGA are explicitly unresolved. |

## 8. Recommendation
**Accept.**
**Justification, grounded only in the documents reviewed:** This is the only Proposed ADR with real, executed, independently re-verified evidence directly testing its central architectural claim — not a design on paper, but working code validated against real production data, refactored without losing correctness, and already used to find and fix a real defect through the exact process this architecture anticipates. The risks named in ADR-0003 §5 are real but are about *sequencing and scope* (CEO bandwidth, Central Kitchen/SBGA not yet in scope), not about whether the core architecture works — and the ADR's own Migration Strategy (§4) already explicitly sequences this work behind active operational fires, directly addressing the bandwidth risk by design rather than ignoring it. Deferring this decision indefinitely leaves a large, already-identified, already-prioritized set of dashboard fixes blocked, per the Implementation Backlog's own explicit dependency chain.

---

# ADR-0004 — Technology Constitution & Investment Principles

## 1. Executive Summary
**Decision (Proposed):** A "constitution, not a project plan" — ten standing principles (Business First, ROI First, Canonical Data, Laptop Independence, Managed Services Before Self-Hosting, Open Standards, Vendor Exit Strategy, AI Workforce Model, Technology Investment Roadmap, and a Decision Criteria checklist for adopting new software) that every future technology, vendor, or architecture decision must be checked against.
**Why proposed:** Every prior ADR in this series exists because a technology decision was made ad hoc and cost something later — Notion-as-permanent-repo silently allowed contradictory memos (ADR-0001); five systems held overlapping, unranked truth (ADR-0003); and, per ADR-0004's own Purpose section, a mobile POS app's backup format turned out to rest on a database whose commercial vendor deprecated official support in 2024/2025, discovered only when this organization went looking for a way to read its own backups. This ADR generalizes the lessons those incidents already paid for into standing rules, so future decisions do not relearn them one system at a time.

## 2. Evidence Review
- **Completed documents supporting this ADR:** Near-universal integration. The Enterprise OS Blueprint states directly (§9) that it is "governed entirely by ADR-0004... every architectural choice above should trace back to one of its ten principles." The Data Governance Framework's own Governance Principles table (§10) explicitly maps every framework element back to a specific ADR-0004 principle — the most granular cross-document mapping found for any ADR in this review. Production Architecture's Deployment Principles (§5) directly implement Principles 4, 5, 7, and 2. The Business Rules Catalog's entire AI (Section 10) and Automation (Section 11) rule sets are grounded strictly in this ADR, per that catalog's own stated scope.
- **Prototype or validation work confirming it:** This is the weakest prototype-evidence case of the four ADRs reviewed — it is a constitution of principles, not a specific technical claim a prototype can directly test the way ADR-0003's canonical layer was tested. **UNKNOWN** whether any of the ten principles have been formally checked against a real, new technology decision — the Business Rules Catalog's own GOV-008 entry states directly: "no vendor has yet been evaluated against this checklist in practice." The one principle with genuine, ongoing behavioral evidence is Principle 8 (AI Workforce Model): this entire body of work — including this review itself — has consistently followed the "agent audits, drafts, and proposes; CEO decides" pattern the principle describes, across every document in this grounding set, without exception.
- **Assumptions remaining:** That the ten principles, once formally accepted, will actually be applied to a real future decision rather than remaining aspirational. ADR-0004 Principle 7 (Vendor Exit Strategy) explicitly states it "applies retroactively as information, not as an action" for existing dependencies (Loka, Notion, n8n) — meaning even upon acceptance, documenting exit paths for tools already in use remains a deliberately deferred, unstarted task, not an oversight.

## 3. Benefits if Accepted
Prevents relitigating the same category of mistake per-decision — per ADR-0004's own stated Purpose, "so future technology decisions don't have to re-learn them one system at a time." Gives every future ADR or tool proposal an explicit, seven-point checklist (§10) to be checked against, rather than ad hoc judgment each time.

## 4. Risks if Accepted
**Not directly named in the source document.** Unlike ADR-0002 and ADR-0003, ADR-0004 has no dedicated "Konsekuensi" or "Risks" section for its own acceptance — this absence is itself worth flagging to the CEO: a constitution spanning ten broad principles arguably warrants its own stated risk analysis, and none exists in the document as written. No risk is invented here to fill that gap; the gap itself is the finding.

## 5. Risks if Deferred
Every future technology decision continues without a stated checklist to check it against — the same ad hoc pattern that produced the Loka vendor-deprecation near-miss and the original Notion-as-repository mistake could recur in a new, currently unforeseen form. ADR-0004 frames this risk as its entire reason for existing.

## 6. Outstanding Questions
Whether and how the ten principles apply retroactively to existing dependencies (Loka, Notion, n8n) — Principle 7 explicitly defers this work even upon acceptance, "without this ADR mandating that work be done now," meaning the question of *when* that follow-up happens remains genuinely open even after a CEO decision on this ADR itself.

## 7. Readiness Assessment
| Dimension | Rating | Basis |
| --- | --- | --- |
| Documentation | **Ready** | Thorough, self-contained, each principle justified against a real, named prior incident rather than abstract best practice. |
| Architecture | **Ready** | The Blueprint is explicitly built entirely on top of it; Production Architecture's Deployment Principles are a direct, section-by-section application. |
| Prototype | **Partially Ready** | No direct test of the constitution as a whole; Principle 8 (AI Workforce Model) specifically has strong, continuous behavioral evidence across every document in this repository, but the other nine principles have no comparable executed validation. |
| Governance | **Ready** | The Data Governance Framework's explicit, principle-by-principle mapping (§10) is the most granular integration of any ADR reviewed. |
| Business Alignment | **Ready** | Principle 1 (Business First) is itself the alignment mechanism, and every one of the ten principles traces to a real, named prior incident, not an abstract standard. |

## 8. Recommendation
**Accept.**
**Justification, grounded only in the documents reviewed:** This is a low-risk, high-leverage constitutional document — it commits to no specific tool, vendor, or spend on its own, and its principles are already being followed in practice throughout this entire repository, including in the production of this review itself. The main outstanding item (retroactive vendor-exit documentation) is explicitly designed by the ADR's own text to not block acceptance. The one genuine gap found in this review — ADR-0004 states no risk to its own acceptance, unlike its two sibling Accepted ADRs — is worth the CEO's attention as a documentation completeness note, not as a reason to withhold acceptance of principles this organization is, by the evidence in Section 2, already operating under.

---

# Cross-ADR Synthesis

## Architecture Readiness Summary

| ADR | Documentation | Architecture | Prototype | Governance | Business Alignment |
| --- | --- | --- | --- | --- | --- |
| ADR-0001 | Ready | Ready | UNKNOWN | Ready | Ready |
| ADR-0002 | Ready | Ready | **Ready** | Ready | Partially Ready |
| ADR-0003 | Ready | Ready | **Ready** | Partially Ready | Partially Ready |
| ADR-0004 | Ready | Ready | Partially Ready | Ready | Ready |

The pattern worth naming directly: **ADR-0002 and ADR-0003 are the only two with genuine Prototype-level Ready evidence** — one via a completed, signed, checksummed financial artifact; the other via working, independently re-verified code tested against real data. ADR-0001 and ADR-0004 are both strongly *documented* and *architecturally integrated*, but neither has comparable direct operational proof within this review's grounding set.

## Dependency Matrix — Documents Depending on Each ADR

| Depends on → | ADR-0001 | ADR-0002 | ADR-0003 | ADR-0004 |
| --- | --- | --- | --- | --- |
| Enterprise OS Blueprint | ✔ (Authoritative Systems, §2) | — | ✔ (data flow model) | ✔ ("governed entirely by," §9) |
| Canonical Data Contract | ✔ (GitHub = code/decisions source) | ✔ (Payable exclusion, §4) | ✔ ("builds on") | — (indirect, via Blueprint) |
| Data Governance Framework | ✔ (versioning rules derive from its reversal discipline) | ✔ (Cash ownership row, §2) | ✔ ("derives from... exclusively") | ✔ (§10 explicit principle map) |
| Enterprise KPI Framework | — (indirect) | ✔ (Opening Equity formula, verbatim) | ✔ ("derives from") | — (indirect) |
| Production Architecture | — (indirect) | — (indirect, via Baseline) | ✔ (entire pipeline = this ADR elaborated) | ✔ (§5 Deployment Principles) |
| Service Boundary Review | — (indirect) | — (indirect) | ✔ (services built on canonical layer) | — (indirect) |
| Business Rules Catalog | ✔ (GOV-009) | ✔ (FIN-001, FIN-002, FIN-007) | ✔ (GOV-001, GOV-002, most of the catalog) | ✔ (Section 10 AI, Section 11 Automation, GOV-008) |
| 2026-07-31 Baseline Manifest | — | ✔ (direct — "the ownership decision this baseline depends on") | — | — |
| `prototype/loka-canonical-poc` | — | — | ✔ (direct implementation) | — |

**ADR-0003 is the most heavily depended-upon document in this repository's architecture stack.** Its acceptance status is the single largest source of "Proposed" inheritance flowing through nearly every other document reviewed.

## Risk Matrix

| Risk | Affected ADR(s) | Severity | Source |
| --- | --- | --- | --- |
| Undetected document contradiction recurs if ADR-0001 were reversed | 0001 | High (if reversed) | ADR-0001, own reversal-discipline section |
| Capital-split conflict (named as the most common family-business conflict source) if left unresolved | 0002 | High | ADR-0002, own Consequences section |
| CEO single-person bandwidth bottleneck from platform-consolidation work | 0003 | Medium–High | ADR-0003 §5 |
| Apps Script code migration cannot be automated, manual file-by-file only | 0003 | Medium | ADR-0003 §5 |
| Declaring a canonical system doesn't itself fix known data-quality defects (CK Rp0 pricing, shipment-ID bug) | 0003 | Medium | ADR-0003 §5 |
| Live Buku Toko app (8 daily users) cannot be modified carelessly | 0003 | High (operational) | ADR-0003 §5 |
| No principle has yet been tested against a real new-vendor decision | 0004 | Low–Medium | Business Rules Catalog, GOV-008 |
| Existing vendor exit paths (Loka, Notion, n8n) remain undocumented even after acceptance, by design | 0004 | Medium (deliberate, accepted gap) | ADR-0004 Principle 7 |
| ADR-0004 states no risk to its own acceptance — a documentation completeness gap | 0004 | Low (procedural) | Finding of this review — absent from ADR-0004 itself |

## Recommendation Order

ADR-0001 and ADR-0002 require no CEO action — they are already Accepted, and this review found no evidence contradicting either. For the two genuinely open decisions:

1. **ADR-0004 first.** It is the lower-risk of the two remaining decisions — a constitution of principles with no direct operational or financial commitment attached, already being followed in practice throughout this repository (Section "AI Rules" evidence). It also supplies the §10 Decision Criteria checklist, which is the natural tool to then apply to ADR-0003.
2. **ADR-0003 second, evaluated explicitly against ADR-0004's newly-accepted checklist.** ADR-0003 carries the real, named risks in this review (CEO bandwidth, manual migration work, a live 8-user app) — running it through ADR-0004's own seven-point checklist gives the CEO a structured way to weigh those risks against ADR-0003's uniquely strong prototype evidence, rather than deciding in isolation.

This ordering is a suggestion for how to sequence two decisions that are, per ADR-0004's own text, "not raced" against each other — it does not imply either decision is unready on its own merits.

## CEO Decision Checklist

- [ ] Confirm whether ADR-0001's and ADR-0002's Accepted status should be reaffirmed as-is, given everything built on top of them since 30 July.
- [ ] Decide: accept ADR-0004 as the standing Technology Constitution.
- [ ] Apply ADR-0004 §10's Decision Criteria checklist explicitly to ADR-0003, using this review's Section "ADR-0003" as a starting brief.
- [ ] Decide: Accept, Keep Proposed, or Needs Revision for ADR-0003.
- [ ] If ADR-0003 is accepted, explicitly name Central Kitchen's and SBGA's Authoritative Source status as still-deferred — not silently assumed resolved by the acceptance itself.
- [ ] Confirm or revise the informal "no more than one month" timeline ADR-0002 set for its own three still-open follow-up items (profit-sharing basis, capital withdrawal mechanism, owner-salary treatment); the capital-split percentage itself (item 1) remains open past its own "come out of the reset" expectation.
- [ ] Decide whether the Notion operational-database question — deferred once by ADR-0001, still unresolved per ADR-0003 and the Canonical Data Contract — needs its own ADR now or can continue to wait.

## Final Table

| ADR | Current Status | Recommended Status | Confidence |
| --- | --- | --- | --- |
| ADR-0001 | Diterima (Accepted) | Accepted — affirm, no change | High |
| ADR-0002 | Diterima (Accepted) | Accepted — affirm, no change | High |
| ADR-0003 | Proposed | Accept | Medium-High |
| ADR-0004 | Proposed | Accept | Medium |

No ADR was modified. No ADR's status was changed by this document. Only `architecture/architecture-governance-review-v1.md` was created.
