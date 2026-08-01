# Canonical Data Contract v1 — Enterprise Data Constitution

| | |
| --- | --- |
| **Status** | Draft — proposed as the Enterprise Data Constitution, pending CEO acceptance |
| **Date** | 31 July 2026 |
| **Proposed by** | Claude (agent), on behalf of no one — CEO decides |
| **Builds on** | [ADR-0001](../adr/0001-github-authoritative-notion-mirror.md), [ADR-0002](../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md), [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md), [ADR-0004](../adr/0004-technology-constitution-and-investment-principles.md), [Enterprise OS Blueprint v1](enterprise-os-blueprint-v1.md), and the [2026-07-31 baseline](../enterprise-data/baseline/2026/2026-07-31-reset/MANIFEST.md) (git `cab4a5b`) |
| **Defines** | WHAT data exists in Enterprise OS, in business language |
| **Does NOT define** | How data is stored, implemented, coded, or which database or vendor holds it |

---

# 1. Purpose

Enterprise OS currently has five places where business truth can originate — Loka POS, the Buku Toko sheet, the GitHub repo, Notion, and ad hoc spreadsheets — with no declared rule for which one wins when they disagree (ADR-0003 §2). It has already produced the same business fact three different ways at once (gross margin, net margin, and Loka's own per-invoice profit figure), all plausible, none reconciled. It has already had a reconciliation process stop silently with nothing downstream aware it had stopped. None of this happened because anyone was careless — it happened because **no single document ever said, in plain business language, what a "Transaction" is, who is allowed to define it, and who may rely on it.**

This document is that definition. It does not store data, run automation, or specify a schema — it specifies the vocabulary every future system must share. A Canonical Data Contract exists so that:

- Every future automation, report, or AI analysis built on top of Enterprise OS starts from the same meaning of "Customer," "Shift," "Invoice," and every other business concept named here — instead of each new system quietly re-deriving its own definition, the way Loka, Buku Toko, and Notion each independently do today.
- The Canonical Data Platform proposed in ADR-0003 has something concrete to normalize *toward*. ADR-0003 defines the pipeline (source → connector → canonical layer → consumer); this document defines the vocabulary that pipeline carries.
- The discipline already proven in the 2026-07-31 financial baseline — one declared authoritative record, immutable, explicitly reconciled against — is generalized from a single snapshot to the whole enterprise, permanently, rather than repeated as a one-off exercise every time a reset is needed.

**Why future automation must follow this document, specifically:** an automation, dashboard, or AI agent that invents its own definition of a business concept instead of using this one recreates exactly the fragmentation ADR-0003 diagnosed — just inside a new system instead of an old one. This document is the thing that makes the Consumer Isolation Principle (ADR-0003 §3) enforceable in practice: a consumer can only be isolated from source formats if it has somewhere else, shared and stable, to get its meaning from. This is that somewhere else.

---

# 2. Principles

Each principle below already exists in this repository in some form; this section names it explicitly as a constitutional rule rather than a one-time decision.

**Single Source of Truth** — Every business domain has exactly one Authoritative Source (ADR-0003 §3). No canonical entity may be defined by two systems at once without one of them being explicitly demoted to "consumer."

**Business Before Technology** — A canonical entity, event, or contract change is justified by a business need, not by technical convenience (ADR-0004 Principle 1). This document itself is not exempt: every entity listed in Section 4 is here because a real business fact needs it, not because it is easy to model.

**Immutable History** — Once a fact is canonical, it is never silently rewritten. The 2026-07-31 baseline already established this in practice — corrections are appended, never retroactively edited (MANIFEST.md, Integrity Rules). This contract generalizes that rule to all canonical data, not only the baseline.

**Explicit Ownership** — Every entity has a named Business Owner. "Nobody's clearly in charge of this data" is not a permitted state (Section 6 makes this concrete, entity by entity).

**Consumer Isolation** — Consumers (Apps Script, AI agents, automation, dashboards) depend on this contract's definitions, never on a source system's native format (ADR-0003 §3). A change to how Loka stores a field must never require a change to how a report reads "Transaction."

**Versioned Contract** — This document is v1. It changes only through the versioning rules in Section 9 — never by silent edit, mirroring the reversal discipline ADR-0001 and ADR-0002 already established ("write a new decision that names the one it changes; never edit another document to quietly contradict it").

**Event-First Thinking** — Business reality happens as events before it becomes a stored current state (Section 5). Recording the event, not only the resulting row, is what makes a silent failure detectable instead of invisible — the exact failure mode already observed when the `Rekonsiliasi` sheet stopped updating with nothing downstream aware of it (ADR-0003 §2).

**Human Approval Gate** — Nothing an AI agent produces takes effect on anything consequential — money, customer communication, published content — without a named human approving it first (ADR-0004 Principle 8). This applies to canonical data the same way it applies to everything else: an AI agent may propose a canonical record; it may not canonicalize one unsupervised where consequence is real.

**No Duplicate Meaning** — Two systems computing "profit" differently, or two tables both claiming to be the record of a cashier's shift, is not a tolerated steady state — it is a defect to be named and resolved, not lived with indefinitely. Section 4 names every place this already exists today, so the defect is visible rather than assumed away.

---

# 3. Enterprise Domains

Each domain below is justified against something already established in this repository — none are invented for completeness.

| Domain | Justification |
| --- | --- |
| **Retail Operations (TSS)** | ADR-0003's Authoritative Sources table names Loka POS and Buku Toko for exactly this domain |
| **Central Kitchen** | Named explicitly in ADR-0004's Purpose ("TSS, Central Kitchen, SBGA, and the brands after them") and in ADR-0003's scope (CK catalog, CK pricing authority) |
| **Sales & Marketing** | SBGA is named in ADR-0004's Purpose as a distinct business line requiring its own customer-acquisition activity |
| **Finance** | ADR-0002 (capital structure) and the 2026-07-31 baseline (opening equity, reconciliation) are both explicitly financial in nature |
| **Inventory** | Present as a first-class concept in Loka's own schema (`Product.stock`, `StockMovement`) and in the baseline's `01_MODAL_BARANG` physical stock count |
| **CRM** | Loka's own `Customer` table is real operational data, including branches recorded as customers (`loka-schema-analysis.md`) |
| **Automation** | ADR-0003's Consumer Isolation Principle names automation as a defined consumer category; the Blueprint's Automation Layer (§5) confirms it as a standing part of the architecture |
| **AI Workforce** | ADR-0004 Principle 8 and the Blueprint §6 both treat this as a distinct, governed domain, not an ordinary consumer |
| **Knowledge** | ADR-0001 establishes the GitHub repo as authoritative for decisions, documentation, and specifications |
| **Decision Memory** | Named explicitly in ADR-0002's own impact table ("Notion Decision Memory: dicatat sebagai entri terpisah") as a distinct record type from an ordinary document |
| **Future Brands** | Explicitly named in ADR-0004's Purpose and the Blueprint's Enterprise Context diagram ("Sentra Telur, Sentra Gula, ...") as a domain this architecture must already anticipate |

**Assumption:** no domain here is claimed to have a fully resolved Authoritative Source today — several (Central Kitchen, Sales & Marketing, Future Brands) are named as domains that *exist* without yet having a clean, single authoritative system assigned to them. That gap is carried forward explicitly in Section 4, not hidden by naming the domain.

---

# 4. Canonical Business Entities

No fields, no schema — purpose, source, ownership, and consumers only. Where two systems already claim the same entity today, that conflict is named rather than silently resolved in one direction.

| Entity | Purpose | Authoritative Source | Business Owner | Consumers |
| --- | --- | --- | --- | --- |
| **Product** | A sellable or stockable item and its identity, category, and pricing reference | **Conflicted today**: Buku Toko is named authoritative for "catalog" (ADR-0003), but Loka independently maintains its own Product table with its own pricing fields (`loka-schema-analysis.md`). Not yet reconciled. | CEO (TSS); Central Kitchen catalog per repo record is Ibu & Teh Nurul's authority | Apps Script, Reports, AI |
| **Customer** | Any party TSS/CK/SBGA sells to, including branches recorded as B2B accounts | Loka POS (`Customer` table, confirmed real branch-as-customer records) | CEO | CRM domain, Finance (receivables), Sales & Marketing |
| **Supplier** | Any party TSS/CK buys from | Loka POS (`Supplier` table) | CEO (TSS); CK ingredient suppliers per repo record fall under Ibu & Teh Nurul | Restock/Purchase Order, Finance (payables) |
| **Transaction / Invoice** | A completed sale | Loka POS (`Invoice`, the central transactional table) | CEO | Finance, Inventory, CRM, Reports |
| **Shift** | A cashier's work period with opening/closing cash | **Conflicted today**: Loka's own `Shift` table and Buku Toko's `Tutup Shift` sheet track the same concept in parallel, not unified (`loka-schema-analysis.md`) | CEO | Finance, Reports |
| **Cash** | Money custody — brankas, kasir, bank, e-wallet balances and movements | Buku Toko is named authoritative for "cash custody" (ADR-0003); the 2026-07-31 Baseline Snapshot is authoritative specifically for the opening figure | CEO, with Ibu as co-signatory per ADR-0002 | Finance, Reports |
| **Inventory** | Quantity of a Product on hand, per location | **Unresolved today**: Loka's stock-movement ledger exists as a schema but holds zero records (`loka-schema-analysis.md`) — no system currently holds a true history, only a current snapshot | CEO (TSS); Ibu & Teh Nurul (CK) | Product, Restock, Reports |
| **Price** | The current and historical selling/cost price of a Product | Buku Toko catalog sheets hold current price; a historical price-change record is not yet reliably populated anywhere | CEO | Product, Finance |
| **Expense** | Operating costs recorded against the business | Loka POS (`Expense` table) | CEO | Finance, break-even reporting |
| **Receivable** | Money owed *to* the business by outside parties | The 2026-07-31 Baseline Snapshot for the opening figure; Loka's `InvoiceDebt` table for ongoing activity — the two are not yet reconciled to each other | CEO | Finance, CRM |
| **Payable** | Money owed *by* the business to outside parties, explicitly excluding Ibu's capital (ADR-0002) | The 2026-07-31 Baseline Snapshot for the opening figure; no clearly assigned ongoing source exists yet | CEO | Finance |
| **Branch** | A physical fulfillment point (e.g. Sederhana Jaya 1–5) that receives goods and is sometimes also recorded as a Customer | Buku Toko (unit definitions); **overlaps with Customer** — a named open item, not yet resolved (`loka-schema-analysis.md` Unknown #6) | CEO | Product/Restock (as recipient), Invoice (as customer) |
| **Employee** | A person who operates the business — cashier, preparer, deliverer, owner | **Conflicted today**: Loka's `Cashier` table (2 records) and Buku Toko's `Pengguna` sheet (8 records) are two different rosters for overlapping people | CEO | Shift, Automation (access rules) |
| **Lead** | A prospective customer signal from a marketing channel | **Explicitly unresolved**: lives in Notion's Lead Database, which ADR-0001 named out of scope pending its own future decision | CEO | Sales & Marketing, CRM, AI |
| **Content** | A marketing content item (post, draft) | Notion Content Pipeline — same unresolved status as Lead, per ADR-0001 | CEO | Sales & Marketing, AI |
| **Campaign** | A grouped marketing effort spanning multiple Content items | **Assumption:** named here as a future concept; no authoritative source currently exists for it in any system read for this contract | CEO | Sales & Marketing |
| **Decision** | A recorded business or architectural decision with its reasoning and expected consequence | **Split three ways today**: GitHub repo ADRs (structural decisions), Buku Toko's `Log Keputusan` sheet (operational decisions), and Notion Decision Memory (a separate mirrored entry per ADR-0002) — not reconciled to one another | CEO | Knowledge domain, AI, Reports |
| **Baseline Snapshot** | An immutable, point-in-time financial or operational reference that later reporting reconciles against | `enterprise-data/baseline/` — the 2026-07-31 reset is the first instance | CEO | Finance, Reports, future Baseline Snapshots |
| **Automation Job** | A record of one automation run — what triggered it, what it did, whether it succeeded | **Assumption:** does not yet exist as a cross-system canonical record; n8n and GitHub Actions each keep their own internal logs today, with nothing unifying them | CEO (no dedicated technical owner exists yet — see Section 6) | Automation domain, AI |
| **AI Session** | A record of an AI agent's work — what it read, what it proposed, what a human approved or rejected | **Assumption:** does not yet exist as a canonical record; this is the direct architectural consequence of the Human Approval Gate principle, needed to make "did a human approve this" auditable rather than assumed | CEO | AI Workforce domain, Knowledge domain |

---

# 5. Enterprise Events

## Why Enterprise OS records events, not only current-state tables

A table row answers "what is true right now." It cannot answer "did the thing that was supposed to happen, happen" — and Enterprise OS has already been burned by exactly that gap twice: a scheduled reconciliation stopped running with no record of its absence (ADR-0003 §2), and a Windows-dependent backup step can fail with nothing downstream aware it failed (`loka-ingestion-poc.md`). An event log makes an *absence* detectable — if `AutomationSucceeded` was expected daily and didn't fire, that is visible. If only a current-state table is kept, a day where nothing happened looks identical to a day where something broke.

Events are also inherently additive — recording that `ShiftClosed` happened at a specific time, with specific values, is compatible with Immutable History (Section 2) in a way that "just update the Shift row" is not: the event is a permanent fact about what occurred, even if a later correction is layered on top of it.

## Representative events, by domain

| Domain | Events |
| --- | --- |
| Retail Operations | `ShiftOpened`, `ShiftClosed`, `InvoiceCreated`, `PaymentReceived`, `CashDeposited` |
| Inventory | `InventoryAdjusted`, `RestockReceived`, `PriceChanged` |
| Sales & Marketing / CRM | `LeadCreated`, `LeadQualified`, `ConsultationStarted`, `ConsultationClosed` |
| Data Platform / Automation | `BackupUploaded`, `AutomationSucceeded`, `AutomationFailed` |
| Knowledge / Decision Memory | `DecisionApproved` |

This list is illustrative, not exhaustive — new events are added under the additive path in Section 9's versioning rules, not invented ad hoc by whichever system needs one next.

---

# 6. Ownership Matrix

**Assumption, stated once rather than repeated per row:** no dedicated engineering or operations function exists in this organization today (ADR-0004 Principle 5 states this directly). Wherever "Technical Owner" appears below as the CEO, that reflects the organization's actual current staffing, not a design choice of this contract.

| Entity | Business Owner | Technical Owner | AI Access | Human Approval Required? |
| --- | --- | --- | --- | --- |
| Product | CEO / Ibu & Teh Nurul (CK) | CEO (no dedicated technical role exists) | Read + Propose | Yes — price and catalog changes |
| Customer | CEO | CEO | Read + Propose | Yes — for any customer-facing action |
| Supplier | CEO / Ibu & Teh Nurul (CK) | CEO | Read + Propose | No for read/analysis; yes for new agreements |
| Transaction / Invoice | CEO | CEO | Read + Propose | Yes — financial record |
| Shift | CEO | CEO | Read + Propose | No for read; yes for corrections |
| Cash | CEO, with Ibu as co-signatory | CEO | Read + Propose | Yes — always |
| Inventory | CEO / Ibu & Teh Nurul (CK) | CEO | Read + Propose | Yes — adjustments |
| Price | CEO | CEO | Read + Propose | Yes — always |
| Expense | CEO | CEO | Read + Propose | Yes — always |
| Receivable / Payable | CEO | CEO | Read + Propose | Yes — always |
| Branch | CEO | CEO | Read + Propose | No for read; yes for structural changes |
| Employee | CEO | CEO | Read + Propose | Yes — access and role changes |
| Lead | CEO | CEO | Read + Propose | Yes — outreach actions |
| Content | CEO | CEO | Read + Propose | Yes — before publishing |
| Campaign | CEO | CEO | Read + Propose | Yes — before launch |
| Decision | CEO | CEO | Read + Propose (never Approve) | Yes — always, by definition |
| Baseline Snapshot | CEO | CEO | Read only | Yes — creation of a new snapshot |
| Automation Job | CEO | CEO (unstaffed) | Read + Propose | Yes — for anything beyond notification |
| AI Session | CEO | CEO | N/A — this record is *about* AI, not accessed *by* it to modify itself | Yes — the record itself is the approval trail |

No row grants an AI agent unsupervised write access to anything consequential. This is a direct, uniform application of ADR-0004 Principle 8, not a per-entity judgment call.

---

# 7. Data Lifecycle

- **Created** — a business event actually happens (a sale occurs, a decision is made, a count is taken) or is entered by the person who witnessed it. This is a business moment, not a database insert.
- **Validated** — the fact is checked against this contract's definitions and against other already-canonical facts it should agree with (does this Transaction's Customer already exist as a canonical Customer; does this Cash figure reconcile with the last known Baseline Snapshot).
- **Canonical** — the fact becomes the one agreed record of what happened, and everything downstream refers to it as such.
- **Consumed** — reports, dashboards, AI agents, and automation read the canonical fact. Consumption never mutates it (Consumer Isolation, Section 2).
- **Archived** — once a fact's active operational relevance passes, it is retained, not discarded — the 2026-07-31 baseline is the working model for this: filed permanently, referenced going forward, never deleted.
- **Never Deleted** — this is not a retention *policy* with an expiry; it is a constitutional rule. A fact found to be wrong is corrected by recording a new, dated fact that supersedes it — the same discipline ADR-0001 and ADR-0002 already require for reversing a decision ("write a new one that names the old one; never silently edit").

---

# 8. Relationship Model

Conceptual only — not an ERD, not SQL. Each chain below describes how a business fact flows from one entity to the next.

```
Customer  →  Invoice  →  Payment  →  Cash  →  Financial Report
```
A sale to a known customer produces a payment, which affects cash custody, which rolls up into a report — a report is only as trustworthy as the weakest link in this chain.

```
Supplier  →  Restock  →  Inventory  →  Product  →  Invoice
```
Goods enter through a supplier relationship, change inventory levels, are represented as a Product, and are eventually sold via an Invoice.

```
Employee  →  Shift  →  Cash
```
A named person's work period is the unit at which cash custody is opened and closed and reconciled.

```
Lead  →  Consultation  →  Customer  →  Invoice
```
The funnel is conceptually a chain into the same Customer/Invoice entities already defined above — a Lead is not a separate universe of data, it is an earlier stage of the same eventual Customer relationship.

```
Decision  →  (governs)  →  any entity's business rules
```
For example, the decision recorded in ADR-0002 (Ibu's funds are capital, not debt) governs how the Cash and Baseline Snapshot entities are computed — a Decision is not just a document, it is something other canonical entities depend on for their own correctness.

```
Baseline Snapshot  →  (anchors)  →  Financial Report
```
Every TSS financial report from 1 August 2026 onward must trace back to the 2026-07-31 Baseline Snapshot, per its own Manifest — this is the relationship in its most literal form already in force today.

```
Branch  →  Invoice (as Customer)
Branch  →  Restock (as recipient)
```
Shown separately and deliberately: a Branch plays two different roles today, and this contract does not paper over that — it is one of the open items in Section 4.

---

# 9. Versioning Rules

This contract follows the same reversal discipline ADR-0001 and ADR-0002 already established for decisions, applied to itself.

- **v1 → v1.1 (additive):** a new entity, event, or domain is added; an existing definition is clarified without changing its meaning. Does not require deprecating anything or migrating existing consumers.
- **v1 → v2 (breaking):** an existing entity's meaning changes, an Authoritative Source assignment changes, or something is removed. Requires an explicit migration note, a stated deprecation timeline for the v1 definition, and does not take effect until consumers have had the chance to adapt.
- **Deprecation policy:** a deprecated definition is marked as such in the new version; its historical meaning is never rewritten. Facts already recorded under a prior version keep referencing the version they were created under (Immutable History, Section 2/7).
- **Backward compatibility:** consumers built against v1 continue to work until they explicitly migrate. A contract version change is, from a consumer's point of view, the same kind of event as a source format change — and per the Consumer Isolation Principle, it must never ripple downstream silently.

---

# 10. Future Expansion

This contract is deliberately written in business language independent of any specific brand or system, so that adding a new business line means **naming its Authoritative Source and Business Owner and mapping its data into the entities already defined here** — not inventing a new contract.

- **TSS** — already mapped throughout Section 4 as the primary example.
- **Central Kitchen** — already partially mapped (Product, Inventory, Supplier ownership under Ibu & Teh Nurul); its own Authoritative Source for day-to-day CK operational data is still an open item, not a redesign requirement.
- **SBGA** — maps onto the Sales & Marketing domain and the Lead/Content/Campaign entities already defined; its Authoritative Source is explicitly unresolved today (Notion's operational databases, per ADR-0001), which is a decision to make, not a gap in this contract's structure.
- **Sentra Telur, Sentra Gula, and businesses not yet named** — to the extent a future brand sells things, buys from suppliers, runs shifts, and takes payments, it fits the existing entity set without a new version of this contract. **Assumption:** if a future brand introduces a genuinely new business concept with no analog here — for example, a production or manufacturing stage unlike simple retail resale — that would warrant a new canonical entity through the v1.1 or v2 path in Section 9, not a redesign of Enterprise OS itself.

The claim this document makes is not that it has anticipated every future business. It is that adding one is a bounded, additive act of mapping — not a reason to start over.
