# SMJ Enterprise OS — Vision 2030

| | |
| --- | --- |
| **Type** | Strategic vision document. Not implementation, not architecture, not code. Internal use. Intended as the long-term North Star for the entire project. |
| **Date** | 1 August 2026 |
| **Status** | First draft — a synthesis of everything this repository has established so far, plus explicitly labeled new recommendations. Not yet CEO-accepted; carries the same "Draft, pending acceptance" status every strategic document in this repository carries until the CEO says otherwise. |
| **Method** | Every claim below is labeled **[Repository Evidence]** (already established somewhere in this repo, cited by document), **[Future Recommendation]** (new, proposed by this document, not previously decided anywhere), or **[Unknown]** (a real open question this document does not resolve). Where a claim mixes both — a grounded principle applied to a new situation — both parts are labeled separately. Nothing here rewrites what a prior document said; where this document extends a prior idea, the extension is named as new. |
| **Reads before this one** | This document assumes familiarity with, but does not repeat, [ADR-0001](../adr/0001-github-authoritative-notion-mirror.md)–[0004](../adr/0004-technology-constitution-and-investment-principles.md), the [Enterprise OS Blueprint](../architecture/enterprise-os-blueprint-v1.md), [Production Architecture v1](../architecture/production-architecture-v1.md), the [Canonical Data Contract](../architecture/canonical-data-contract-v1.md), [Business Rules Catalog v1](../knowledge/business-rules-catalog-v1.md), [Business Rule Consolidation v1](../knowledge/business-rule-consolidation-v1.md), [`ops/failure-patterns.md`](../ops/failure-patterns.md), and [`knowledge/ceo-knowledge-base.md`](../knowledge/ceo-knowledge-base.md). |

---

# Section 1 — Why

**[Repository Evidence]** SMJ Enterprise OS exists because this organization has already paid, in this repository's own recorded history, for the specific problems it is built to solve — not hypothetical ones.

- **Truth was scattered with no rule for which copy won.** By ADR-0003's own account, business truth lived in five places at once — Loka POS, the Buku Toko sheet, the GitHub repo, Notion, and ad hoc Excel workbooks — "with no declared rule for which one wins when they disagree." The same figure was computed two different ways at once (gross margin from Loka's `Ringkasan` vs. net margin from manual analysis) with nothing stopping the two from being conflated (`adr/0003-canonical-data-platform-loka-pos.md` §2).
- **Silence looked identical to success.** The `Rekonsiliasi` sheet stopped updating after 29 July with no alert anywhere — the exact failure class ADR-0001 had already flagged for Notion contradictions, now recurring on financial data (`adr/0003...md` §2).
- **A contradiction sat undetected until a manual audit found it.** The CEO Memo of 24 July ("SBGA fokus tunggal") directly contradicted the SOP TSS of 27 July ("marketing ditunda"), and nothing caught it until someone happened to read both on 28 July (`adr/0001-github-authoritative-notion-mirror.md`, Konteks).
- **A capital structure went unrecorded until it produced a real disagreement.** Ibu's funds inside TSS were, by default, being treated as a liability — a conservative accounting assumption, not a fact about the actual agreement — until the CEO and Ibu corrected it explicitly (`adr/0002-dana-ibu-adalah-modal-bukan-hutang.md`).
- **Strategic advice was given without reading the business's own data, and it cost real money.** Four recommendations were given in one session, all four contradicted by the repo's own numbers already on record — including approving B2B expansion before the error was caught (`ops/failure-patterns.md`, Pola 4).
- **A gross figure was presented without its net counterpart, and the gap was material, not academic.** July 2026's gross profit read as an achievement against a target; the same month's net profit was a real loss of approximately Rp1.4 million (`ops/failure-patterns.md`, Pola 5).
- **The gap is now measured, not merely suspected.** This project's own [Business Rule Consolidation](../knowledge/business-rule-consolidation-v1.md) found that 26 of 40 traced business formulas (65%) have no governing business rule at all, 8 core financial definitions actively conflict between the two systems already built, and zero of 64 catalogued business rules have a mechanically-enforced human approval gate — not zero *someday*, zero *today*.
- **The gap was never purely technical.** A near-miss with Loka's own database vendor — Realm's commercial support was deprecated by its vendor with no one having asked in advance — showed that even the technology choices underneath this project were made without a standing discipline to check them against (`adr/0004-technology-constitution-and-investment-principles.md`, Purpose).

**[Repository Evidence]** None of this happened because anyone was careless. It happened because, as the Canonical Data Contract puts it, "no single document ever said, in plain business language, what a 'Transaction' is, who is allowed to define it, and who may rely on it" (`architecture/canonical-data-contract-v1.md` §1). SMJ Enterprise OS exists to be that document, and the system built around it.

---

# Section 2 — Mission

**[Repository Evidence, synthesized]** The CEO's own stated 12-month North Star, recorded verbatim in this repository's own founder interview, already is the clearest mission statement available — this document does not improve on it, only restates it as a mission:

> *"A customer receives the same thoughtful, principle-based recommendation whether they speak to the CEO, an employee, or an AI-assisted system."*
> — CEO, quoted and framed as "milestone transfer pengetahuan" (`knowledge/ceo-knowledge-base.md` §8)

**Mission statement, derived directly from that quote and this repository's own operating discipline:**

**To give CV Sederhana Maju Jaya's businesses one trustworthy source of truth, one place where decisions are made from evidence instead of memory, and — over time — a system capable of carrying forward the same principle-based judgment the CEO already applies personally, so that judgment does not depend on the CEO's own presence to reach every customer, every employee, and every decision.**

---

# Section 3 — Vision 2030

**[Given, from this sprint's own context — not yet decided anywhere else in the repository]** The long-term direction, as stated for this sprint: Phase 1, Enterprise OS operates internally for SMJ Group; Phase 2, Enterprise OS replaces business workflows previously handled by Loka; Phase 3, Enterprise OS becomes a commercial SaaS platform for Indonesian SMEs. This three-phase framing is treated here as the CEO's current direction, not as something any prior document in this repository already recorded — it is new as of this sprint, and is marked as such rather than presented as pre-existing repository fact.

## Internal Operations
**[Repository Evidence]** By 2030, the internal target this repository already describes should be realized, not merely proposed: one canonical layer, one place each business figure is computed, six Business Services (Finance, Inventory, Sales, Customer, Pricing, Reporting) each owning exactly one responsibility with no duplicate computation (`services/README.md`), and Apps Script reduced to a pure rendering surface reading that output rather than computing it in parallel (`architecture/production-architecture-v1.md` §3.6).

## Multi-Business Management
**[Repository Evidence]** The architecture already states the requirement: onboarding a new brand should mean naming its Authoritative Source, assigning a Business Owner, and — only if genuinely new — extending the canonical model additively, never forking the pipeline (`architecture/production-architecture-v1.md` §4). **[Repository Evidence — named gap, not yet closed]** As of this document, that requirement is not yet met: Central Kitchen and SBGA both still have unresolved Authoritative Source assignments, and `service-boundary-review.md` §6 found real, concrete work is still required at the Business Service layer before a new brand could actually onboard without editing existing service documents. **By 2030, this gap should be closed** — a future brand (Sentra Telur, Sentra Gula, or one not yet named) should onboard by mapping, not by rebuilding.

## AI
**[Repository Evidence]** AI's role is already defined, not invented here: a workforce multiplier that audits, drafts, and proposes, never approves, never originates a canonical fact, and never acts unsupervised on anything consequential (`adr/0004...md` Principle 8; Business Rules Catalog AI-001–AI-006). **[Repository Evidence — named gap]** As of this document, the Human Approval Gate that principle depends on has **no running enforcement mechanism anywhere** — "stated as policy; nothing exists yet for it to gate" (`architecture/production-architecture-v1.md` §9, Production Readiness Matrix). By 2030, that gate should be a real, running system, not a written expectation.

## Automation
**[Repository Evidence]** Automation is already scoped to grow in stages — starting with low-risk notifications before anything resembling autonomous response (`architecture/enterprise-os-blueprint-v1.md` §5; Business Rules Catalog AUT-004). **[Repository Evidence]** The single most repeated failure pattern in this project's entire recorded history is a silent automation failure — Windows Task Scheduler, the `Rekonsiliasi` sheet stalling unnoticed, expiring push-notification channels (`architecture/production-architecture-v1.md` §3.9). By 2030, every automated step in Enterprise OS should be observable by construction — a missing expected event must be detectable, not indistinguishable from "nothing happened."

## Analytics
**[Repository Evidence]** A rich analytics layer already exists — not in Enterprise OS, but in the legacy Apps Script tool it is meant to eventually absorb: GMROI, inventory turnover, days-inventory-outstanding, days-sales-outstanding, cash conversion cycle, dead-stock detection, category and customer margin breakdowns are all real, working formulas found directly in Loka's Apps Script companion app (`knowledge/business-formula-catalog-v1.md` §3.2, §3.3). **[Repository Evidence — named gap]** None of these nine formulas has any destination in Enterprise OS's current 11-card dashboard schema today. By 2030, Enterprise OS's analytics should not merely match this — it should be the one place these figures are computed, with a governing business rule behind each one, closing the exact gap the Business Rule Consolidation already measured.

## Governance
**[Repository Evidence]** The governance model is already written: one Business Owner and one Technical Owner per canonical entity, a defined data classification scheme, an immutable/never-deleted default, and a versioning discipline that requires any reversal to name the decision it changes (`architecture/data-governance-framework-v1.md`). By 2030, this should be a running system with real audit cadence (the same document already proposes monthly, quarterly, and annual audits — §9) rather than a framework that has, by its own admission, "not yet been performed" even once.

## SaaS
**[Future Recommendation]** Nothing in this repository today describes a commercial, multi-tenant SaaS product — this is genuinely new territory, not a restatement of existing plans. What can be said with repository grounding is the *shape* the transition should take, because the shape is already implied by decisions already made: ADR-0004's Managed Services Before Self-Hosting principle, its Vendor Exit Strategy requirement, and its Decision Criteria checklist would all apply to a SaaS platform exactly as they apply to today's internal tooling — nothing about becoming a commercial product exempts it from the same constitution the rest of this project already answers to. **[Future Recommendation]** A credible SaaS product for Indonesian SMEs would need, at minimum, real multi-tenant isolation of the same canonical-entity model already defined, and a pricing/onboarding model this repository has not yet begun to design — both explicitly out of scope for this document.

---

# Section 4 — Product Philosophy

Each principle below is already active in this repository in some form. This section names why each exists, using the repository's own evidence, not abstract software-engineering doctrine.

**Single Source of Truth.** **[Repository Evidence]** Named directly: "Exactly one system is authoritative per domain; every other system is a consumer or disposable surface" (Business Rules Catalog GOV-001, from `adr/0003...md`). It exists because the alternative was already tried and already failed — five unranked sources, the same metric computed two ways with nothing to reconcile them.

**Single Input.** **[Repository Evidence, extended]** Not named under this exact phrase anywhere in the repository, but it is the direct logical consequence of two rules that are named: "Reports Reference the Baseline, Never Copy and Let Numbers Drift" (REP-004) and the Data Lifecycle's own definition of Creation as "a business event actually happens... or is entered by the person who witnessed it. This is a business moment, not a database insert" (`architecture/canonical-data-contract-v1.md` §7). A fact is entered once, at the moment it becomes true, by whoever witnessed it — never re-typed into a second workbook, never re-derived by a second calculation. **[Future Recommendation]** Naming this as its own first-class principle, distinct from Single Source of Truth, is new to this document — it exists because this repository's own history shows the two failures are different in kind: Single Source of Truth failures produce *disagreement*; Single Input failures produce *duplicate effort* even when the numbers happen to agree (the "new unversioned copies keep appearing" problem named directly in `adr/0003...md` §2).

**Human Approval.** **[Repository Evidence]** "Nothing an AI agent or automation produces takes effect on anything consequential — money, customer communication, published content — without a named human approving it first" (GOV-004, from ADR-0004 Principle 8). It exists because AI is explicitly framed, by the CEO's own technology constitution, as "a workforce multiplier for a small human team, not a replacement for its judgment on anything consequential" — and because this repository has already found the concrete cost of judgment applied without grounding (`ops/failure-patterns.md` Pola 4).

**Traceability.** **[Repository Evidence]** "Every canonical record must be traceable back to the business event or decision that produced it" (`architecture/canonical-data-contract-v1.md` §7); extended to derived figures, not yet realized, by Production Architecture's own Auditability requirement — "every Business Services figure must, in addition, be traceable to the canonical facts *and the formula version* that produced it — this second half does not exist yet" (`architecture/production-architecture-v1.md` §8). It exists because the Dashboard Lineage Audit already found cards with no verifiable source at all — a number on a screen a CEO was expected to trust, with no path back to where it came from.

**Evidence-Based Decisions.** **[Repository Evidence]** This is not aspirational language — it is a hard rule this very project operates under: "Baca `roadmap/` dan `adr/` SEBELUM memberi rekomendasi arah" (CLAUDE.md), written into existence specifically because advice was once given without it and cost the CEO a wrong approval (`ops/failure-patterns.md` Pola 4). "Koreksi jujur di atas menyenangkan" (honest correction over being agreeable) is the same principle applied to how findings are communicated once they exist.

**Offline-First.** **[Repository Evidence]** Two independent lines of evidence support this as a real operating requirement, not a preference: Loka itself — the retail POS app this whole platform is built to eventually absorb — is architected with no background sync service, no scheduled connectivity dependency, and a local Realm database as its primary operational store (`research/loka-realm-runtime-v1.md` §2.3, §2.6; `research/loka-apk-analysis-v1.md` §2.4–§2.7). And ADR-0004's own Laptop Independence principle exists because a real automated process already failed silently by depending on one machine being on (Principle 4). A retail and food-service business in Garut cannot assume constant, reliable connectivity at the point of sale — the platform it depends on already doesn't assume that, and neither should Enterprise OS.

**Business Before Technology.** **[Repository Evidence]** Named directly and first among ADR-0004's ten principles: "Technology exists to serve TSS, CK, SBGA, and the brands after them — never the reverse. A technically elegant solution that doesn't move margin, cash safety, or customer capture is not a priority, no matter how satisfying it is to build" (`adr/0004...md`, Principle 1). It exists because this repository already documented the opposite failure mode happening in practice: energy spent building *about* the business — brand guidelines, playbooks, frameworks — instead of building the business itself, with the repo's own roadmap once falling behind what the actual, already-productive business had already done (`ops/failure-patterns.md` Pola 2).

---

# Section 5 — The Living Lab Model

**[Given, from this sprint's own context, elaborated with repository evidence]** SMJ's physical businesses are not a test environment for Enterprise OS — they are its only source of ground truth, and building inside them first (rather than designing in the abstract) is a strategic advantage this repository can already point to concrete instances of, not merely assert in principle.

- **Real customer data already corrected a wrong assumption.** Walk-in retail margin was assumed to be a ceiling, worse than the B2B channel; the actual figure — 7.49% — was found to outperform four of five Sederhana Jaya branches. That correction only exists because real transaction data was available to check the assumption against (`ops/failure-patterns.md` Pola 4).
- **One real customer became a template for every future one.** Papoy, the one confirmed genuinely external, non-family B2B account, runs a 3.68% margin — the worst in the dataset. That real, painful number is now the explicit floor every future B2B pricing decision is checked against, named directly in this project's own operating rules (CLAUDE.md). No amount of abstract pricing strategy would have produced that number; only a real account, in a real ledger, could.
- **A real cash-custody bug was found because real cash moves through the system daily.** The `kasAwal` asymmetry bug — carrying forward only the till balance while the reconciliation checked till-plus-safe — produced a confirmed Rp5.8 million discrepancy. It was found because Buku Toko is used by 8 real people, daily, not because anyone audited it in the abstract (Business Rules Catalog SAL-002).
- **A real competitor's own architecture is the best evidence this project has for its own future design.** This project's three-part reverse-engineering research (`research/loka-apk-analysis-v1.md`, `research/loka-realm-runtime-v1.md`, `research/firebase-firestore-analysis-v1.md`) was only possible, and only valuable, because a real, working, already-adopted POS application exists to learn from — its database engine, its offline-first design, its own licensing architecture are all now directly informing this project's own roadmap (Section 8).

**[Given, elaborated]** The instruction this document works from is explicit: *every feature must first solve a real operational problem inside SMJ before it is offered externally.* The reasoning this repository already supports for that rule: a feature validated only in the abstract has never been checked against the specific failure modes this project has already, repeatedly, found in its own operations — the Botram pattern (a finished system with no follow-through, `ops/failure-patterns.md` Pola 1), the documentation-heavy pattern (energy spent on artifacts instead of outcomes, Pola 2), and the done-because-written pattern (status changing before verification, Pola 3). A feature that has survived contact with SMJ's own daily cash counts, real customer margins, and real schema migrations has already survived the three failure modes most likely to sink it — a feature that hasn't is still a hypothesis.

---

# Section 6 — The Value Layer

**[Future Recommendation — no prior document in this repository describes this architecture]** As Enterprise OS moves toward serving businesses beyond SMJ Group (Section 3, Phase 3), it will encounter operators whose operating values differ — not their facts, their *values*: how a recommendation is phrased, what an SOP emphasizes, what language a decision-support suggestion uses. The proposed architecture keeps these two concerns strictly separate.

**Requirement 1 — Core Enterprise OS remains neutral.** **[Future Recommendation]** The canonical data model, the Business Services layer, and every business formula (Business Formula Catalog v1) are value-neutral by construction. A `Product`, an `Invoice`, a `GMROI` calculation means exactly the same thing regardless of which business or which operator's values sit on top of it.

**Requirement 2 — Business data remains objective.** **[Future Recommendation]** Inventory value, cash position, margin, revenue — every figure this repository has already spent this much effort defining correctly, precisely, and traceably (Sections 4 above; the entire Business Rules Catalog and Business Formula Catalog) never changes based on which Value Layer is active. This is not a new principle invented for this section — it is the Single Source of Truth and No Duplicate Meaning principles (GOV-001, GOV-005) applied to a new axis of variation (operator values) the same way they already apply to source-system variation.

**Requirement 3 — Financial reports never change.** **[Future Recommendation]** A P&L, a reconciliation, a Baseline figure is computed once, by one formula, and reported identically to every operator regardless of Value Layer configuration. The Value Layer has no write access to, and no influence over, anything Finance Service or Reporting Service computes — the same "stateless with respect to truth" boundary Production Architecture already draws around the Business Layer (`architecture/production-architecture-v1.md` §2) extends, unmodified, to exclude the Value Layer from ever touching it.

**What the Value Layer influences.** **[Future Recommendation]** Exactly four things, and nothing beyond them: AI guidance (how the AI Workforce frames a suggestion), recommendations (which of several equally-true observations get surfaced first, and how), language (tone, terminology, phrasing in SOPs and in-app text), and decision support (which questions a decision-support prompt asks before presenting an option). It never decides what is true — only how truth is presented and what is emphasized when a human is choosing what to do with it.

**Examples — Universal and Islamic, illustrative only.** **[Future Recommendation, illustrative]** A "Universal" configuration might phrase an inventory-reorder recommendation in plain operational terms. An "Islamic" configuration serving an operator who wants that framing might phrase the same, identical, unchanged recommendation — built from the same numbers, the same GMROI, the same stock-alert threshold — using language and emphasis consistent with that operator's own values (for example, framing supplier fairness or avoiding waste in terms that resonate with that operator's own principles). **This document does not attempt to specify what that language should say** — doing so would mean inventing business or religious content this repository has no authority or evidence to originate, exactly the kind of speculation this sprint's own constraints forbid. What is being proposed is the *architecture* — a swappable presentation/guidance layer — not its content. **[Unknown]** Whether "Universal" and "Islamic" are the right two starting configurations, what others might eventually be needed, and how a Value Layer would actually be authored, reviewed, and kept from silently drifting into asserting something as fact that is really a value — all genuinely unresolved, and explicitly not decided by naming the two examples given.

**The one hard constraint, stated plainly.** **[Future Recommendation]** The Value Layer must never be permitted to change a business fact to make it more palatable to a given value system. A margin is a margin. A recommendation can be framed differently; a number cannot be made different by who is looking at it. This is the same discipline that already governs this repository's own numbers (CLAUDE.md: "Angka: selalu sebut sumber dan tanggal") extended forward to a feature that does not exist yet.

---

# Section 7 — AI Philosophy

**[Repository Evidence]** AI's role in Enterprise OS is already defined by ADR-0004 Principle 8 and Business Rules Catalog Section 10 (AI-001 through AI-006). This section restates that role in the terms this sprint asked for, without redefining it.

## AI should

- **Assist.** **[Repository Evidence]** "AI agents... are a workforce multiplier for a small human team" (ADR-0004 Principle 8) — not a replacement for the people doing the work, an amplifier of what they can get done.
- **Explain.** **[Repository Evidence]** Every finding this project has produced — from the cash-custody bug to the Firestore licensing hypothesis — has been delivered with its reasoning and evidence shown, not asserted. This is not incidental; it is required by this repository's own standing discipline (CLAUDE.md: "sampaikan keterbatasan tool," "koreksi jujur di atas menyenangkan").
- **Recommend.** **[Repository Evidence]** "AI may: audit, draft, propose, analyze, flag anomalies" (AI-002). Recommending is explicitly permitted — approving what happens next is not.
- **Summarize.** **[Repository Evidence]** Directly the role assigned to AI Workforce in Production Architecture: reading canonical and Business Services data "to produce drafts and analysis" (`architecture/production-architecture-v1.md` §3.8).
- **Educate.** **[Repository Evidence, connected]** The CEO's own hiring philosophy already draws this exact line for human employees: "pengetahuan teknis" (technical knowledge) is explicitly ranked as *teachable, documentable* — third priority, below honesty and character, but the one dimension the CEO already treats as transferable knowledge rather than innate trait (`knowledge/ceo-knowledge-base.md` §4). AI's educating role is the direct extension of that same idea: technical and product knowledge is exactly the kind of thing this repository already believes can and should be transferred, systematically, to anyone who needs it — customer, employee, or the CEO's own future self.

## AI should not

- **Approve.** **[Repository Evidence]** "AI may not: approve anything, act unsupervised on anything consequential, or originate a canonical fact" (AI-002). This is absolute, with no entity-level exception found anywhere in this repository's governance documents.
- **Modify transactions.** **[Repository Evidence]** No canonical entity in the Ownership Matrix grants AI anything beyond "Read + Propose" (`architecture/canonical-data-contract-v1.md` §6) — Transaction/Invoice included, explicitly requiring human approval "always" (Business Rules Catalog SAL-007).
- **Change financial records.** **[Repository Evidence]** Cash, Expense, Receivable, and Payable are named, specifically and by ID, as requiring human approval "always, with no read-only carve-out beyond viewing" (FIN-010) — the strictest tier of approval this repository defines, applied to exactly the entities where AI touching them unsupervised would be most damaging.
- **Replace accountable humans.** **[Repository Evidence]** The Decision entity's own Ownership Matrix row states AI access as "Read + Propose (never Approve)" — the one entity where "never Approve" is written as its own explicit carve-out beyond the general rule, because a Decision record is, by definition, the thing a human's judgment produces (AI-006). Accountability cannot be delegated to something that cannot be held accountable — this repository does not attempt to.

**[Repository Evidence, connecting principle to mission]** The reason this boundary exists is the same reason the mission (Section 2) is framed the way it is: the goal is a customer receiving the *same* recommendation whether they speak to the CEO, an employee, or an AI-assisted system — not a *replacement* for the CEO's judgment, a *carrier* of it. The CEO's own diagnostic framework for what disqualifies an employee — "merekomendasikan beras demi keuntungan toko, bukan demi kebutuhan pelanggan" (recommending for the shop's benefit, not the customer's need) — is, unchanged, exactly the standard AI's recommendations must be held to as well (`knowledge/ceo-knowledge-base.md` §3–4).

---

# Section 8 — Long-Term Product Roadmap

**[Given, from this sprint's own context, grounded where evidence exists]** A logical evolution, not a dated schedule — consistent with ADR-0004's own Technology Investment Roadmap principle: "Technology investments are sequenced behind business priority... not built in parallel with it by default" (Principle 9).

```
Dashboard
  ↓
Business Services
  ↓
Workflow Automation
  ↓
Replace Restock
  ↓
Replace Inventory
  ↓
Replace Purchasing
  ↓
Replace POS
  ↓
Independent Enterprise OS
```

**Dashboard.** **[Repository Evidence]** Already scoped in detail — 11 cards, each with a defined source entity, Business Service owner, and refresh strategy (`implementation/dashboard-v2-implementation-plan.md`). This is the stage furthest along.

**Business Services.** **[Repository Evidence]** Already documented as six named services (Finance, Inventory, Sales, Customer, Pricing, Reporting), each with an explicit "never owns" boundary (`services/README.md`; `architecture/service-boundary-review.md`). Confirmed not yet implemented — the Production Readiness Matrix marks this layer "Almost entirely unbuilt" (`architecture/production-architecture-v1.md` §9).

**Workflow Automation.** **[Repository Evidence]** Already scoped as a staged capability — notifications first, autonomous response only much later, gated by the same Human Approval discipline as everything else (`architecture/enterprise-os-blueprint-v1.md` §5; AUT-001–AUT-004). Not yet implemented anywhere — "a design requirement this architecture states explicitly, not yet an implemented capability anywhere in this project" (`architecture/production-architecture-v1.md` §3.9).

**Replace Restock.** **[Repository Evidence, as a named gap]** "Goods Out" — the inter-branch and restock shipment concept — has no canonical entity today; this is named directly as deferred, explicit modeling work, not yet started (`architecture/dashboard-frontend-architecture-v1.md`'s and the Reporting Service's own citation of Implementation Backlog BL-013). Replacing restock workflows is the point at which this named gap must finally be closed.

**Replace Inventory.** **[Repository Evidence, as a named gap]** Inventory's Authoritative Source is explicitly Unresolved today — "no system currently holds a true stock-movement history — only a current snapshot" (INV-002). Replacing inventory management is not possible before this is resolved; it is, in effect, the trigger that forces the resolution.

**Replace Purchasing.** **[Repository Evidence, as a named gap]** Payable — money owed to suppliers — has no assigned ongoing source beyond the one-time 31 July baseline figure (SUP-002). A purchasing workflow cannot be replaced by a system that does not yet know, on an ongoing basis, what the business owes.

**Replace POS.** **[Repository Evidence, directly supporting this stage as a logical endpoint, not merely an ambition]** This project's own live-connector feasibility research already found the ceiling of *not* eventually replacing Loka: the best achievable outcome without owning the POS layer directly is "MEDIUM" feasibility for near-real-time data — bounded by Loka's own export cadence, not by anything Enterprise OS itself could improve, and explicitly blocked from ever reaching genuinely live access by Android's own sandboxing model (`research/live-connector-feasibility-v1.md`, Success Criteria Q1, Q5). Replacing POS is not merely the final item in an arbitrary sequence — it is the only evidenced way past a ceiling this project has already measured and documented, not assumed.

**Independent Enterprise OS.** **[Future Recommendation]** The point at which Enterprise OS no longer connects to or depends on any external operational system for SMJ's own businesses — the natural precondition for Section 3's Phase 3 (commercial SaaS), since a platform cannot credibly be sold to other businesses to run their operations while it is still itself dependent on connecting to someone else's.

**[Repository Evidence]** Every arrow above should be read the same way ADR-0004 already frames the current pipeline: "Each phase gates the next... this ordering follows the same discipline already applied to cash-custody and CK work — one-time foundational work goes first and in sequence, not spread thin in parallel" (`architecture/enterprise-os-blueprint-v1.md` §8). No stage here is dated. No stage here is assumed complete because the stage before it produced a document.

---

# Section 9 — Digital Business

**[Given, elaborated with repository evidence]** SMJ Group and SMJ Enterprise OS are designed to strengthen each other in one specific, evidenced direction: the physical business is continuous, unglamorous validation the digital product cannot get any other way.

**[Repository Evidence]** Every one of this project's real findings — the cash asymmetry bug, the Papoy margin floor, the walk-in margin correction, the CK Rp0-pricing gap, the Realm schema's ~60 real migrations, Loka's own confirmed cross-device licensing behavior — came from a real, operating business, not a specification exercise. A digital product built without that operating business behind it would have had to invent all of these, and would very likely have invented the wrong ones, or missed them entirely (Section 5).

**[Future Recommendation, extending the given premise]** The strengthening runs the other direction too, though this repository has not yet realized it: as Enterprise OS matures, it should give SMJ's physical businesses capability they do not have today — the analytics layer already sitting unused in Loka's own Apps Script companion (Section 3, Analytics), governance discipline strong enough that a wrong recommendation like the one already recorded in this repository's own history becomes structurally harder to make twice, and, eventually, the principle-based consistency named in the mission statement extended to every customer interaction, not only the ones the CEO personally handles.

**[Future Recommendation]** This is the concept of the physical business as *continuous* validation, not a one-time pilot: every phase in Section 8's roadmap should be proven inside SMJ's own operations before it is generalized, and every generalization should be checked, again, against whether it still serves SMJ's own operations as well as it serves anyone else — the Living Lab model (Section 5) does not end once Phase 3 begins; it is the reason Phase 3 can be trusted at all.

---

# Section 10 — Success Metrics

Per explicit instruction, revenue is not used. Every category below is grounded in something this repository has already measured, or already knows how to measure, not invented for this document.

**Operator time saved.** **[Repository Evidence, as a model]** ADR-0004 Principle 2 already names the correct shape for this metric, not a hypothetical one: "Adendum 1's cash/CK/funnel time budget (~9 hours one-time, ~15 minutes/day after) is the model: name the one-time cost, name the recurring cost, name what it buys back." Every future feature's success should be stated the same way — not "this saves time" in the abstract, but a named one-time cost against a named recurring saving.

**Duplicate work eliminated.** **[Repository Evidence, as a measured baseline]** This is not an abstract goal — this project has already counted it. The Business Rule Consolidation found four confirmed formula-divergence pairs where the same business fact (Gross Profit, Expenses, Transaction Count, Inventory Value) is computed two different, disagreeing ways across two different systems (`knowledge/business-rule-consolidation-v1.md` §5). Success is that number reaching zero, and staying there — a literal, already-defined, countable metric.

**Decision quality.** **[Repository Evidence, as a measured baseline]** This repository already has a real incident on record — a wrong recommendation approved before correction (`ops/failure-patterns.md` Pola 4) — and a documented detection method for catching the pattern that produced it: recommendations must be checked against `roadmap/` and `adr/` before being given. Success is measured by that specific failure mode never recurring, checkable by the same audit method already written down.

**Data quality.** **[Repository Evidence, as a measured baseline]** The Business Rules Catalog scored itself directly: "Business Rule Completeness: 48/100." Cross-referencing that score against real, traced formulas in the Business Rule Consolidation revised it down to 38/100, because the original score had no visibility into gaps the cross-reference later found (`knowledge/business-rule-consolidation-v1.md` §8). Success is this number rising, honestly re-measured the same disciplined way each time, not simply re-asserted higher.

**Governance.** **[Repository Evidence, as a measured baseline]** Zero of 64 catalogued business rules, as of this document, have a mechanically-enforced human approval gate (`knowledge/business-rule-consolidation-v1.md` §5). Success is that number rising from zero — starting with the highest-stakes rules (Cash, Price, Net Profit) first, per the same business-value ranking this repository already uses elsewhere (`knowledge/business-formula-catalog-v1.md` §9.10).

**Business transparency.** **[Repository Evidence, as a measured baseline]** The Dashboard Lineage Audit already established a concrete, countable baseline: only 2 of 11 dashboard cards could be fully verified end-to-end to their source (`architecture/production-architecture-v1.md` §3.7, §10). Success is that number reaching 11 of 11, and staying there as new cards are added.

**Customer impact.** **[Future Recommendation, grounded in the mission]** Not yet measured anywhere in this repository. The mission (Section 2) implies the right shape for this metric once it exists: whether a customer's experience — the recommendation they receive, the consistency of service — is measurably the same whether they are served by the CEO, an employee, or the system. No instrument for measuring this exists yet; naming the target is new, measuring it is future work this document does not claim to have solved.

---

# Section 11 — Risks

**Feature creep.** **[Repository Evidence]** Already a named, observed pattern, not a hypothetical: "Energi dihabiskan membangun *tentang* bisnis — brand guideline, playbook, knowledge base, framework — daripada membangun bisnis itu sendiri" (`ops/failure-patterns.md` Pola 2), with a concrete historical instance already on record (a roadmap that fell behind an already-productive application). This vision document itself carries this risk — a strategy document is, definitionally, more of the pattern the repo has already warned about, unless every phase in Section 8 stays anchored to Section 5's Living Lab discipline.

**Building before validation.** **[Repository Evidence]** The Botram pattern: "Sistem selesai dibangun, playbook selesai ditulis, data tercatat dengan baik — lalu tidak ada yang terjadi karena follow-up tidak dilakukan pada waktunya" (`ops/failure-patterns.md` Pola 1). Every phase in Section 8 that gets built without a real SMJ operational problem behind it (Section 5) is a candidate for this exact failure.

**AI overreach.** **[Repository Evidence — not hypothetical, already the measured current state]** This is not a future risk to guard against — it is the current, documented state: zero of 64 business rules have a mechanically-enforced Human Approval Gate (`knowledge/business-rule-consolidation-v1.md` §5), and AI-003's own Known Gap states plainly, "no running gate mechanism exists yet." Every AI-assisted action taken in this project today, including the production of this very document, currently depends entirely on human review outside any enforced system boundary. This is the single risk this vision document treats as most urgent to close, precisely because it is not speculative.

**Poor governance.** **[Repository Evidence]** Already measured, not projected: 26 of 40 traced business formulas have no governing rule, 8 core financial definitions actively conflict, and only 3 of 64 rules are genuinely and fully implemented in a real system by the strictest standard this repository has applied to itself (`knowledge/business-rule-consolidation-v1.md` §8).

**Vendor lock-in.** **[Repository Evidence]** A real, already-experienced near-miss, not a theoretical concern: Loka's `.realm` backup format depends on a database whose commercial vendor deprecated official support, discovered only when this organization went looking for a way to read its own backups (`adr/0004...md` Principle 6). A second, newly-surfaced instance of the same risk category: Firebase Firestore is confirmed actively integrated into Loka with a purpose this project could not fully determine even with direct, careful analysis (`research/firebase-firestore-analysis-v1.md`) — a second vendor dependency this organization does not control and does not yet fully understand.

**The single-person bottleneck.** **[Repository Evidence]** Named directly and repeatedly as an active, unresolved risk: "A single-person bottleneck (the CEO) governs both business decisions and all technical work — named as an active risk since Roadmap v6 and unchanged since" (`architecture/production-architecture-v1.md` §10, Known Risks). Every phase of Section 8's roadmap depends on CEO time and CEO approval; none of it reduces that dependency until the AI Philosophy in Section 7 and the Human Approval Gate in Section 11's "AI overreach" risk are both real, running systems — not before.

---

# Section 12 — Manifesto

Not marketing language. A restatement, in one place, of what this repository has already, repeatedly, insisted on the hard way.

**Truth lives in exactly one place, and everyone reads from it — never a second copy, never a convenient re-derivation.**

**A number without its source and its date is not a number this organization trusts.**

**A recommendation given without reading what the business already knows is not a recommendation — it is a guess wearing the CEO's authority.**

**Gross is not net. A figure that looks like an achievement is not one until the cost behind it has been subtracted and shown.**

**Nothing an AI system produces changes money, a customer's experience, or a public record until a named human has looked at it and said yes.**

**A system is not done because the document describing it exists. It is done when someone has checked it against what actually happened.**

**Every feature earns its place inside SMJ's own operations first. If it cannot solve a real problem here, it is not ready to be offered to anyone else.**

**Honesty about what is broken is worth more than comfort about what might be. Correction, delivered plainly, is the respect this project owes the people who depend on it.**

**The goal was never a dashboard. It was a customer, anywhere, receiving the same care the CEO would have given them personally — whether the CEO is in the room or not.**

---

No code was written. No implementation was performed. No existing document was modified. Nothing was committed.
