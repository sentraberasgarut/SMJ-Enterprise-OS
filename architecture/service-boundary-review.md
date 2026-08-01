# Service Boundary Review — Business Service Layer

| | |
| --- | --- |
| **Status** | Draft — architecture review only. Not a decision, not an implementation plan. Inherits the status of everything it reviews: ADR-0003, ADR-0004, and every architecture/services document below remain Proposed/Draft, pending CEO acceptance. |
| **Date** | 1 August 2026 |
| **Reviewed by** | Claude (agent), on behalf of no one — CEO decides |
| **Reviewed against** | [ADR-0001](../adr/0001-github-authoritative-notion-mirror.md)–[0004](../adr/0004-technology-constitution-and-investment-principles.md), [Enterprise OS Blueprint v1](enterprise-os-blueprint-v1.md), [Canonical Data Contract v1](canonical-data-contract-v1.md), [Data Governance Framework v1](data-governance-framework-v1.md), [Enterprise KPI Framework v1](enterprise-kpi-framework-v1.md), [Production Architecture v1](production-architecture-v1.md), and all six documents in [`services/`](../services/README.md) |
| **Scope** | Analysis only. No code, no API, no schema, no database, no cloud decision, no roadmap change, no ADR change, no modification to any reviewed file. |

Wherever this review states a fact, it traces to one of the eleven documents above. Wherever those documents don't settle something, this review writes **UNKNOWN** rather than resolve it.

---

# 1. Responsibility Clarity

Every one of the six services already states an explicit "never owns" boundary in its own text — this section checks whether those boundaries are real and consistent, not just asserted.

### Finance Service
- **Owns:** Computing Cash position, Receivable/Payable, Expense totals, and the Gross Profit / Net Profit / `Invoice.profit` reconciliation, against the Baseline Snapshot.
- **Never owns:** The canonical Cash/Expense/Receivable/Payable *records themselves* (Canonical Layer's), Invoice/Payment records (Sales Service's), pricing decisions (Pricing Service's), report assembly or presentation (Reporting Service's).
- **Why:** Finance Service derives financial meaning from entities it does not originate (Production Architecture §3.5, "stateless with respect to truth"); assembly/presentation is deliberately separated to Reporting Service so the same figure is computed once, not once per consumer.

### Inventory Service
- **Owns:** Current stock position per Product/location; the Supplier → Restock → Inventory → Product chain; surfacing the known CK Rp0-pricing catalog gap as a visible condition.
- **Never owns:** The Price value itself (`pricing-service.md`'s own stated rationale for separating Pricing out), Product's identity/creation (Canonical Layer's, and Conflicted regardless), Payables owed to a Supplier (Finance Service's).
- **Why:** deliberately narrowed to stock/movement; pricing was split out specifically because Price carries a stricter, always-on approval rule than the rest of Product.

### Sales Service
- **Owns:** Transaction/Invoice computation (revenue, transaction counts), Shift summaries, the Employee → Shift half of the `Employee → Shift → Cash` chain.
- **Never owns:** Cash position — stated explicitly in `sales-service.md`: "Sales Service does not itself compute a Cash position; that is Finance Service's responsibility." Also never owns Customer identity/branch determination (Customer Service's) or stock (Inventory Service's).
- **Why:** boundary is stated in the document's own text, not just implied.

### Customer Service
- **Owns:** The Customer list and Branch-ambiguity surfacing; the `Lead → Consultation → Customer` funnel-stage summary, bounded by Lead's unresolved source.
- **Never owns:** Invoice/Payment (Sales Service's), the Receivable figure itself (Finance Service's — Customer Service only feeds it), and — stated explicitly — the *definitive* Branch/Customer reclassification: "Customer Service surfaces the ambiguity, it does not resolve it."
- **Why:** the entity's own Authoritative Source conflict (Branch/Customer overlap, Canonical Contract §4) is upstream of this service; the service is honest about not being able to close it.

### Pricing Service
- **Owns:** Current price for a Product; the `PriceChanged` event history, to the extent a source for it exists.
- **Never owns:** Product identity/catalog (Inventory Service's); and — stated explicitly — pricing *policy*: "this service does not decide pricing policy, it only makes the current, canonical figure visible."
- **Why:** separated from Product specifically for its uniquely strict, always-on Human Approval requirement (the only entity in the whole Ownership Matrix with no read-only exception).

### Reporting Service
- **Owns:** Assembling Financial Reports and KPI values from the other five services' outputs, anchored to the Baseline Snapshot.
- **Never owns:** Computing any figure independently that duplicates one of the other five's — stated explicitly: "a report it produces is not a seventh place a figure gets computed."
- **Why:** exists specifically to close the "same metric, two answers" defect ADR-0003 §2 already diagnosed.

**Answer to Question 1: Yes — every service states a clear responsibility, with an explicit "never owns" boundary in its own text, not merely implied.** The boundaries are consistent with each other (cross-checked below in Section 2), with one confirmed exception (Finding O1).

---

# 2. Overlap Analysis

| Pair | Nature of overlap | Classification |
| --- | --- | --- |
| **Sales ↔ Inventory** | Both reference Product (Sales via Invoice line items, Inventory via stock). Neither claims to compute the other's figure — Sales never computes stock, Inventory never computes revenue. | **Valid overlap** — shared canonical dependency (Product), not shared computed responsibility. |
| **Inventory ↔ Pricing** | Inventory Service's own Inputs describe Product as carrying "identity, category, and pricing reference," and its Outputs include a named list of "Products whose... price is Rp0 due to the known CK catalog gap" — a price-related fact appearing in Inventory Service's output. | **Architecture smell (Finding O1)** — see below. |
| **Finance ↔ Reporting** | Both touch "reconciliation status." Finance Service *computes* it; Reporting Service explicitly states it only assembles what "Finance Service computes." | **Valid overlap** — deliberate producer/consumer split, exactly matching Production Architecture's Business Layer (derive) vs. Application Layer (present) distinction. |
| **Customer ↔ Sales** | Both touch Invoice — Customer Service owns the Customer *becoming* one; Sales Service owns the Invoice once it exists. `sales-service.md` explicitly defers Branch/Customer disambiguation to Customer Service. | **Valid overlap** — clean, explicitly documented handoff point. |
| **Pricing ↔ Finance** | Finance Service's Gross/Net Profit figures depend on cost, which depends on Price. `pricing-service.md` names Finance Service as a consumer of price-derived cost/margin figures. | **Valid overlap** — producer (Pricing) / consumer (Finance), no duplicate computation claimed by either. |
| **Reporting ↔ (all five)** | Reporting Service is coupled to all five by design. | **Valid, but a governance dependency worth naming (Finding O2)** — see below. |

### Finding O1 — Architecture Smell: Inventory Service's price-related output
Inventory Service's stated Output — a list of Products at Rp0 due to the Central Kitchen catalog gap — is, strictly, a statement *about price*, even though it is framed as a stock/catalog data-quality flag inherited directly from ADR-0003 §2's own wording ("130+ Central Kitchen catalog items at `Harga = 0`"). Because Pricing Service was deliberately split out specifically to be the one place price-related facts live, this output sits on the wrong side of that boundary as currently written. **This is a real, self-identified smell, not a fatal one** — the underlying finding (CK items priced at zero) is correctly sourced from ADR-0003, but *which* service should be the one to say so is ambiguous between the two documents as written today.

### Finding O2 — Reporting Service's non-duplication is a written rule, not a structural one
Nothing in any of the six documents *prevents* Reporting Service from computing its own version of a figure the other five already own — the "No Duplicate Meaning" guard in `reporting-service.md` is a sentence of intent, not a mechanism. Not classified as a smell today (the current document is disciplined about it), but worth naming as a standing risk for whoever builds this.

---

# 3. Canonical Entity → Business Service Ownership Matrix

One Business Service per entity, per instruction. Nineteen entities are named in Canonical Data Contract §4; a twentieth (Loyalty Ledger) appears only in the Blueprint's diagram (§4) and the KPI Framework, not in the Contract's own entity table — included below for completeness, flagged accordingly.

| Canonical Entity | Business Owner (Service) | Basis |
| --- | --- | --- |
| Product | **Inventory Service** | `services/README.md`'s own domain mapping ("Inventory domain; Inventory, Product (stock aspect)..."); contested with Pricing Service in spirit — see Finding O1 |
| Customer | **Customer Service** | Explicit, undisputed across all six documents |
| Supplier | **Inventory Service** | `services/README.md` domain mapping |
| Transaction / Invoice | **Sales Service** | Explicit — "the central transactional table" |
| Shift | **Sales Service** | Explicit — Employee → Shift chain |
| Cash | **Finance Service** | Explicit |
| Inventory | **Inventory Service** | Explicit |
| Price | **Pricing Service** | Explicit |
| Expense | **Finance Service** | Explicit input |
| Receivable | **Finance Service** | Explicit |
| Payable | **Finance Service** | Explicit |
| Branch | **Customer Service** | Explicit — Branch/Customer overlap named as this service's open item |
| Employee | **Sales Service** | Explicit input ("the person operating a Shift") |
| Lead | **Customer Service** | Explicit |
| Content | **Customer Service** | Explicit input |
| Campaign | **Customer Service** | Explicit input |
| Baseline Snapshot | **Finance Service** | Explicit input; Reporting Service reads it too, but Finance is the one that computes reconciliation against it — Reporting only assembles that result |
| **Decision** | **UNKNOWN** | None of the six services claims this entity. Reporting Service references it only narratively as something that "can inform what a Report says." No service is its Business Owner. |
| **Automation Job** | **UNKNOWN** | Not mentioned as an input or output in any of the six service documents. Belongs to the Automation domain (Production Architecture §3.9), which was not built as one of the six services. |
| **AI Session** | **UNKNOWN** | Not mentioned in any of the six service documents. Belongs to the AI Workforce domain (Production Architecture §3.8), likewise not one of the six services. |
| Loyalty Ledger *(not in Contract §4; appears in Blueprint §4 diagram and KPI Framework only)* | **Customer Service** *(inferred, not stated)* | The KPI Framework names its Authoritative Source as "Loyalty Ledger entity (Canonical Data Contract §4)" — but no such entity actually exists in that section; this is itself a small inconsistency between two source documents, not something this review can resolve. |

**Three of nineteen formally-defined canonical entities (Decision, Automation Job, AI Session) have no Business Service owner among the six built.** This is expected, not an error: `services/README.md` only built services for five of the eleven Enterprise Domains named in Canonical Contract §3 plus one cross-cutting service — Knowledge, Decision Memory, Automation, and AI Workforce domains were never turned into services. See Gap #2.

---

# 4. Relationship Review — Producer / Consumer / Shared

| Relationship (Canonical Contract §8, or named in the task) | Producer | Consumer | Notes |
| --- | --- | --- | --- |
| Invoice → Customer | Customer Service | Sales Service | Clean handoff |
| Invoice → Product / Inventory | Inventory Service | Sales Service | Sales reads Product for line items; never writes stock |
| Invoice → Price | **Shared — unresolved** | — | An Invoice's line-item price is a *point-in-time sale fact*, potentially independent of Pricing Service's *current* price. No document states whether Sales Service's recorded price defers to Pricing Service's canonical Price, or is its own independent historical fact. Flagged, not resolved. |
| Invoice → Payment | Sales Service | Finance Service | Payment is derived from Invoice (matches the actual canonical model); Finance consumes it for Cash |
| Supplier → Restock → Inventory → Product | Inventory Service (internal chain) | Sales Service, Pricing Service (read Product) | Self-contained within Inventory Service |
| Supplier → Payable | Inventory Service (Supplier) | Finance Service (Payable) | Cross-service, valid producer/consumer |
| Employee → Shift → Cash | Sales Service (Employee, Shift) | Finance Service (Cash) | Matches Sales Service's own stated boundary |
| Lead → Consultation → Customer → Invoice | Customer Service (through Customer) | Sales Service (from Invoice onward) | Handoff point is the Customer record itself |
| Decision → (governs) → any entity's rules | **UNKNOWN — no publisher** | Finance Service, Pricing Service *(narrative only)* | E.g. ADR-0002 governs Finance Service's Cash rules — but this is written as prose in `finance-service.md`, not a live dependency on a Decision *record*, because Decision has no owning service (Section 3) |
| Baseline Snapshot → Financial Report | Finance Service | Reporting Service | Finance computes the reconciliation; Reporting assembles it into a report |
| Branch → Invoice (as Customer) | Customer Service | Sales Service | Matches Section 2's Customer↔Sales finding |
| **Branch → Restock (as recipient)** | **UNKNOWN — undocumented** | — | Canonical Contract §8 names this relationship explicitly. `inventory-service.md`'s Inputs list Inventory, Product, and Supplier only — Branch is never mentioned. This relationship is simply missing from the service documentation. See Gap #8. |

---

# 5. KPI Ownership

Cross-referenced against all 44 KPIs in `enterprise-kpi-framework-v1.md`, by domain.

**Financial (11 KPIs):** Revenue → **Sales Service** (Loka POS/Invoice is its Authoritative Source). Gross Profit, Gross Margin, Net Profit, Net Margin, Operating Expense, Cash Balance, Receivable, Payable, Opening Equity → **Finance Service** (all explicitly named as Finance Service outputs, or dependent on entities it owns). Inventory Value → **Inventory Service**.

**Operations (8 KPIs):** Stock Accuracy, Inventory Turnover, Dead Stock, Restock Frequency, Supplier Fulfillment, Catalog Completeness → **Inventory Service**. Shift Accuracy → **Sales Service** (Shift is its entity; Cash Balance is only a *consumer* of this KPI, per the Framework's own Consumer Systems column). Cash Reconciliation Accuracy → **Finance Service**.

**Sales (6 KPIs):** Transaction Count, Average Basket, Average Item per Transaction → **Sales Service**. Repeat Customer Rate, New Customer Rate, Loyalty Usage → **Customer Service**.

**Customer Funnel (7 KPIs):** Lead Count, Qualified Lead, Response SLA, Offer Rate, Closing Rate, Conversion Rate, Repeat Purchase → all **Customer Service**.

**Automation (6 KPIs):** Automation Success Rate, Automation Failure Rate, Data Freshness, Ingestion Success, Validation Success, Sync Delay → **None of the six Business Services.** These are pipeline-health metrics belonging to the Ingestion, Validation, and Automation components (Production Architecture §3.2, §3.3, §3.9), which sit in the Data and Application Layers, not the Business Layer. Correctly out of scope for all six services — not a gap.

**Enterprise (6 KPIs):** Data Quality Score, Data Completeness, Audit Findings, Policy Compliance → **None** — Governance Layer concerns (Production Architecture §2), not Business Services. Baseline Integrity → **None** — a checksum-based Data Layer integrity check (Production Architecture §3.3-adjacent), computed before data reaches Business Services at all; assigning it to Finance Service would conflate validation with derivation. Data Consistency → **Finance Service (computes) / Reporting Service (surfaces)** — this is the one Enterprise-domain KPI that genuinely maps to a service, because its own "clearest current failing example" (Gross Margin vs. Net Margin vs. `Invoice.profit`) is exactly the reconciliation both `finance-service.md` and `reporting-service.md` already claim.

### Finding K1 — No confirmed case of two services computing the *same* KPI
No KPI is claimed as an Output by two services simultaneously in the current documents.

### Finding K2 — One real, unaddressed duplicate-computation *risk*
**Opening Equity** (Finance Service) is formula-defined in ADR-0002 as depending on Assets, which the KPI Framework explicitly states includes **Inventory Value** — an Inventory Service KPI. Neither `finance-service.md` nor `inventory-service.md` states whether Finance Service consumes Inventory Service's already-computed Inventory Value, or would independently recompute it. This is not a confirmed duplicate (neither document claims to compute it twice) — it is an **unaddressed hand-off**, and the most concrete place a real duplicate-computation defect could quietly appear if implementation proceeds without resolving it.

---

# 6. Future Scalability

**Question: can Sentra Telur, Sentra Gula, another retail company, or another restaurant be added without modifying existing services? No.**

Reasons, each traced to a specific place in the current documents:

1. **Finance Service and Reporting Service are implicitly singular-Baseline-scoped.** Both reference "the 2026-07-31 Baseline Snapshot" as *the* anchor, not *a* per-brand anchor. A new brand needs its own Baseline Snapshot (Data Governance Framework §6 already establishes baselines are per-date, not per-number, but says nothing about per-brand). Neither service document expresses "which brand's baseline" as a dimension — adding a brand means editing these two files, not just adding a mapping.
2. **Sales Service names Loka POS as *the* Authoritative Source**, not "a" source parameterized per brand. A brand using a different POS (plausible for a restaurant concept) would require editing `sales-service.md`'s Inputs section directly.
3. **Central Kitchen is written as a named exception, not a pattern.** Wherever CK ownership appears (Inventory Service, implicitly Pricing Service via Product), it's "Ibu & Teh Nurul" by name, not "the Business Owner assigned to this brand." Onboarding Sentra Telur means adding a new named exception, the same way CK was added — this is exactly the "no new pipeline per brand, only new mappings" pattern Production Architecture §4 calls for **at the Canonical Layer**, but the six Business Service documents were not written with that same parameterization discipline.

This finding does not contradict Production Architecture §4's Multi-Brand Design principle — it shows that principle has not yet been carried down from the Canonical Layer into the Business Service layer's own documents.

---

# 7. AI Readiness — Ranked Lowest to Highest Risk

Ranked using two explicit, sourced criteria: the Ownership Matrix's per-entity Human Approval strictness (Canonical Contract §6), and Data Governance Framework §3's classification tiers.

1. **Reporting Service — Lowest risk.** Pure read/assembly of what other services already computed, with an explicit non-duplication rule. Matches Production Architecture §3.8's description of AI's safest role directly: reading Business Services output to draft observations.
2. **Inventory Service.** Mostly read-oriented (Stock Accuracy, Dead Stock); Human Approval is required only for *adjustments*, not reads. Risk here is data-quality (Inventory's Authoritative Source is Unresolved), not consequence-severity.
3. **Sales Service.** Reads (revenue, counts) are low-stakes, but Shift and Employee are both Conflicted-source entities — AI analysis risks confidently favoring the wrong of two disagreeing sources.
4. **Customer Service.** Human Approval is required "for any customer-facing action... without exception" — the strictest customer-facing rule in the Ownership Matrix — and Customer data is Personal-classified (Data Governance Framework §3).
5. **Finance Service.** Cash, Expense, Receivable, and Payable are *all* "Human Approval Required — yes, always," and Financial-classified data carries the framework's second-highest scrutiny tier.
6. **Pricing Service — Highest risk.** Price is the single entity in the entire Ownership Matrix with **no read-only exception at all** — always requires approval, full stop. Also directly touches customer-facing money, which ADR-0004's Business First principle and CLAUDE.md both reserve for the CEO alone.

---

# 8. Automation Readiness

No service may execute a consequential action without the Human Approval Gate — this is not a per-service judgment call, it is uniform across all six, per ADR-0004 Principle 8 and the Ownership Matrix's near-universal "Yes" in the Approval column. The only thing every service can safely automate **without** the gate is a **notification** — matching Production Architecture §3.9's own description of Automation's Output ("Notifications; triggered downstream actions... prompting a Dashboard refresh") and the Automation Job entity's own rule: "Human Approval Required: Yes — for anything beyond notification."

| Service | Safe without approval | Always requires the Human Approval Gate |
| --- | --- | --- |
| Reporting Service | Refreshing/notifying "new report available" | Any report content that would be acted on |
| Inventory Service | Low-stock notifications | Any stock adjustment |
| Sales Service | "Shift closed" / transaction-count notifications | Any Invoice or Shift correction |
| Customer Service | Internal "new lead" notification | **Any customer-facing action, absolutely — no exception, per the entity's own rule** |
| Finance Service | Threshold notifications (e.g. "Cash below X") | Any write to Cash, Expense, Receivable, or Payable — always |
| Pricing Service | A read-only "price unchanged in N days" observation | Any Price change — always, the strictest rule in the whole matrix |

**No service is more than partially automatable.** Reporting and Inventory have the largest safe surface area (mostly read/notify); Customer, Finance, and Pricing have almost none — nearly every meaningful action they could take is gated.

---

# 9. Event Ownership

Only events actually named in Canonical Data Contract §5 are assigned below. Three of the task's own example events — **`ExpenseCreated`, `SupplierPaid`, `CustomerRegistered`** — are **not defined in any of the eleven source documents** and are marked UNKNOWN rather than invented.

| Event | Publisher | Subscriber(s) |
| --- | --- | --- |
| `ShiftOpened` / `ShiftClosed` | Sales Service | Finance Service (cash custody opens/closes with shift) |
| `InvoiceCreated` | Sales Service | Inventory Service (stock impact), Finance Service (Receivable/Cash), Customer Service (funnel/repeat tracking), Reporting Service |
| `PaymentReceived` | Sales Service | Finance Service (Cash update) |
| `CashDeposited` | Finance Service | Reporting Service |
| `InventoryAdjusted` *(task's "StockAdjusted" is treated as this named event)* | Inventory Service | Reporting Service, Finance Service (Inventory Value → Opening Equity, per Finding K2) |
| `RestockReceived` | Inventory Service | Finance Service (Payable impact) |
| `PriceChanged` | Pricing Service | Inventory Service, Finance Service (margin), Sales Service |
| `LeadCreated` / `LeadQualified` | Customer Service | *(none named downstream — self-contained within Customer Service until conversion)* |
| `ConsultationStarted` / `ConsultationClosed` | Customer Service | Sales Service (on conversion toward Invoice) |
| `BackupUploaded` / `AutomationSucceeded` / `AutomationFailed` | **None of the six Business Services** | Belongs to Ingestion and Automation components (Production Architecture §3.2, §3.9), outside the Business Layer entirely |
| `DecisionApproved` | **UNKNOWN — no publisher**, since Decision has no owning service (Section 3) | Finance Service, Pricing Service *(narrative-only, not a live subscription)* |
| `ExpenseCreated` | **UNKNOWN — not a defined event anywhere** | — |
| `SupplierPaid` | **UNKNOWN — not a defined event anywhere** | — |
| `CustomerRegistered` | **UNKNOWN — not a defined event anywhere** | — |

---

# 10. Conclusion

## Architecture Score

| Dimension | Score /100 | Basis |
| --- | --- | --- |
| **Cohesion** | 78 | Strong, explicit single-purpose boundaries per service; docked for Finding O1 (Inventory/Pricing overlap) and Product's split ownership. |
| **Coupling** | 58 | Appropriate coupling to Canonical Layer (unavoidable, by design), but two real unaddressed cross-service dependencies (Finding K2, Section 4's Invoice→Price ambiguity) add avoidable risk. |
| **Scalability** | 45 | Section 6's finding stands: real modification is required to onboard a new brand today, contrary to Production Architecture §4's stated goal. |
| **Governance** | 88 | Every service explicitly inherits the Ownership Matrix, Human Approval Gate, and Data Classification — the strongest dimension by a clear margin. |
| **AI Readiness** | 40 | Governance framing is mature (Section 7's ranking is clean and well-sourced), but zero KPIs have reached Maturity Level 3 (per the KPI Framework's own Maturity Model) — practical readiness is near-zero beneath the good policy. |
| **Maintainability** | 80 | Consistent structure across all six documents; "No Duplicate Meaning" is a stated first-class rule, not an afterthought. |
| **Documentation Completeness** | 68 | All required sections present throughout, but three canonical entities (Decision, Automation Job, AI Session) and one relationship (Branch → Restock) have no coverage at all. |
| **Enterprise Readiness** | 30 | The foundation (ADR-0003, ADR-0004) is still Proposed, not Accepted; only 2 of 44 KPIs have a documented formula. This document set is sound *analysis*, not yet an operable system. |

## Top 10 Remaining Architecture Gaps Before Implementation

1. ADR-0003 and ADR-0004 remain Proposed, not Accepted — every service definition in this review is provisional on that decision.
2. Decision, Automation Job, and AI Session have no Business Service owner among the six built (Section 3).
3. Product's ownership is split between Inventory Service (stock) and Pricing Service (price) with no documented handoff (Finding O1).
4. Opening Equity's dependency on Inventory Value is unaddressed — the clearest concrete duplicate-computation risk found (Finding K2).
5. Product, Shift, Employee, and Inventory all have Conflicted or Unresolved Authoritative Sources at the Canonical Layer — no Business Service can be more correct than the weakest input it reads.
6. Only 2 of 44 KPIs (Opening Equity, Baseline Integrity) have a documented formula — most of what Finance Service and Reporting Service are nominally responsible for cannot yet be computed.
7. Multi-brand scalability requires real edits to Finance, Reporting, and Sales Service documents today, not clean additive mapping (Section 6).
8. Branch → Restock (as recipient) is a relationship the Canonical Data Contract names explicitly but no service document addresses (Section 4).
9. Reporting Service's "no duplicate computation" rule is written policy only, with no structural enforcement described anywhere.
10. `ExpenseCreated`, `SupplierPaid`, and `CustomerRegistered` — three plausible, obviously-needed events — are not defined in any source document; event-driven automation for Finance and Customer domains has a definition gap before it can even be designed.

No file besides this one was created. No existing file was modified. Nothing was committed.
