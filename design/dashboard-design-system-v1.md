# Dashboard Design System v1

| | |
| --- | --- |
| **Status** | Draft — product design direction only. No graphics, colors, mockups, or code exist yet, and none are created by this document. |
| **Date** | 1 August 2026 |
| **Scope** | Design philosophy and visual-language *principles* for the future Dashboard application. Describes what the interface should feel like and why — never what it should literally look like. |
| **Consumes** | [Dashboard Dataset v1](../prototype/loka-canonical-poc/dashboard-contract.md) — the only data contract this design is built to present. |

---

# 1. Design Philosophy

**This is not a product for a technology company. It is an Enterprise Operating System used every day by real people running a real family retail business.**

That sentence is not a slogan — it is the single fact every principle below is derived from. This repository's own history already shows what happens when a number is unclear rather than a design afterthought: a dashboard card labeled `tercapai` ("achieved") against the wrong target produced a "73% achieved" reading in a month that was actually running a net loss (`reports/dashboard-reconciliation-audit.md`), and a till balance of Rp4,298,500 sat more than fourteen times over its own Rp300,000 policy limit without anyone catching it in time (Business Rules Catalog FIN-003). Neither of those was a data problem by the time they reached a screen — the data was already correct or already known. They were **presentation** problems. This design system exists to make sure the next one doesn't happen the same way.

## Who this is for

The Dashboard Dataset already prepares schema for seven roles (`src/dataset/roles.js`). This sprint gives four of them real names, provided directly by the business:

| Role (from `src/dataset/roles.js`) | Real person / group |
| --- | --- |
| CEO | Aditya |
| Owner (Ibu) | Ibu — co-owner of capital (ADR-0002), joint Central Kitchen authority |
| Central Kitchen Manager | Teh Nurul |
| Cashier | Ayu |
| Driver | Mas War |
| Store Manager | Future — not yet named |
| Future Admin | Future — not yet defined |

None of these people are technology professionals, and none of them opened this dashboard because they wanted software — they opened it because they need to know whether the till is over its limit, whether this month's numbers are real, or whether a delivery went out correctly. Every design decision below is made for that person, not for a designer's portfolio.

## What "Enterprise OS" means for tone

- This is **operational software**, not a reporting toy. It gets used at the start of a shift, at the end of a shift, and whenever something looks wrong — not once a week in a meeting.
- This is **family-run software**. Per ADR-0002, Ibu's capital in TSS is founding capital, not a loan — she is a co-founder, not an investor checking a portfolio. Per the repository's own memory records, this business carries accumulated *family* kitchen knowledge, not one person's personal résumé. The interface should read as something the family built for itself, not something sold to them.
- This is **trust-critical software**. The whole reason the Canonical Pipeline, Connector, and Reporting Service exist is that this business was already burned by numbers that silently disagreed with each other. The interface's job is to never let that happen invisibly again.

---

# 2. Design Principles

Each principle below is stated as a requirement, then grounded in why it matters for *this* product specifically — not as a generic design-system truism.

**Warm.** The people using this every day are family and long-time staff, not enterprise IT buyers. Cold, clinical software would misrepresent what this actually is.

**Trustworthy.** Every number on this dashboard has a known confidence level and a known source today (`card.confidence`, `card.sourceEntity`, `card.audit.lineage` — all real, already-produced fields). The interface's job is to *show* that trust is earned, not just claim it.

**Calm.** No dashboard card should ever create urgency it hasn't earned. The real Kas Kasir violation already found in this data (FIN-003) is a case where *quiet, clear, persistent* visibility would have caught the problem faster than a dramatic alert would have — a business owner needs to notice a problem during a normal glance, not be startled into ignoring the tenth false alarm.

**Professional.** This is a business tool used to make real decisions about real money — Cash, Expense, Receivable, and Payable are all "Human Approval Required: Yes, always" (Business Rules Catalog FIN-010). The interface must look and feel worthy of that responsibility.

**Family-owned.** Not corporate-anonymous. The tone should feel like it was built *by* this business, not *sold to* it.

**Operational.** Built for someone standing at a till or driving a delivery, not someone reading a quarterly report. Every screen should answer "what do I do right now," not just "what happened."

**Fast.** A cashier or driver checking this mid-shift cannot wait. Perceived speed (immediate feedback, honest loading states) matters as much as raw speed.

**Readable.** Real figures in Rupiah, real Indonesian business terminology (Kas Kasir, Brankas, Tutup Shift — terms already used throughout this repository's own data and documents) must be legible at a glance, not styled into illegibility.

**Low cognitive load.** This is the principle the two confirmed real bugs above both violate. A number without its label, its confidence, and its freshness in the same glance is exactly how "gross profit" became "73% achieved" against the wrong target. Every card in the real Dashboard Dataset already carries `value`, `status`, `confidence`, and `dataFreshness` together (`dashboard-schema.json`) specifically so the interface never has to choose between showing a number and showing whether that number can be trusted.

**Data-first.** The interface has no opinion the data doesn't already support. Where the Dashboard Dataset says `"UNKNOWN"` or `status: "blocked"`, the interface says so too — plainly, not hidden behind a spinner or a zero.

## Explicitly rejected directions

- **Never "tech startup."** Gradient-heavy, jargon-forward, growth-metric aesthetics speak to investors, not to a cashier counting a till. Ayu and Mas War are not the audience a startup dashboard is designed for.
- **Never "crypto."** Neon, speculative, hype-driven visual language is the opposite of "Trustworthy" and "Calm" — this dashboard's entire reason for existing is to be a *more* trustworthy source of truth than what came before it, not a flashier one.
- **Never "gaming."** No badges, streaks, leaderboards, or celebratory animations. A Gross Profit figure is not a high score, and treating it like one is exactly the kind of framing that already produced a real, harmful misreading (the "73% achieved" bug).
- **Never overloaded.** Eleven dashboard cards already exist (`implementation/dashboard-v2-implementation-plan.md` §3) and five of them are honestly `UNKNOWN` today (`dashboard-dataset.json`'s own `unknownReasons`). Showing all eleven with equal visual weight, or padding the screen with cards that have nothing real to say, is the opposite of low cognitive load.

---

# 3. Visual Language — Principles Only

No colors, graphics, or mockups are defined anywhere in this section — only the rules a future visual design should be checked against.

### Typography
Must support Indonesian business terminology and Rupiah currency formatting clearly at operational reading distance (a till, a phone in a moving vehicle). Numeric figures need a distinct, highly legible treatment from body text — a Cash figure and a caption should never be mistaken for each other at a glance. Hierarchy should be established primarily through weight and size, not color alone, since color communicates *status* in this system (see Status Indicators below) and must not be overloaded to also communicate *hierarchy*.

### Spacing
Generous enough that a cashier glancing mid-transaction can find the one figure they need without scanning. Consistent enough that the same kind of information (e.g. every card's confidence indicator) always appears in the same relative position, so recognition becomes automatic over daily use.

### Icons
Used only to reinforce meaning already present in text — never as the sole carrier of meaning, since an icon-only status indicator is exactly the kind of ambiguity that already produced a real mislabeling bug. Consistent, simple, and few enough in number that each one's meaning is learnable, not decorative.

### Cards
The dashboard card is the atomic unit of this whole system — it already exists as a real, structured object (`dashboard-schema.json`'s `dashboardCards` array). Each card must always show, together, in the same glance: its value (or `"UNKNOWN"`), its confidence, and how fresh its underlying data is. A card must never show a number without also showing how much to trust it — this is the single most important rule in this entire document, because it is the rule the real bugs already violated.

### Tables
Reserved for genuinely tabular, comparative data (e.g. a future per-product or per-shift breakdown) — not used as a default layout for single figures, which belong in cards.

### Charts
Used only where a trend genuinely matters more than a point-in-time value. Given that most of today's 11 cards are single-snapshot figures (many currently `UNKNOWN` or scoped to "the latest available day/month," not a continuous series — `src/reporting/cards.js`), charts should be treated as a *future* capability once genuine time-series data exists, not a default presentation for what exists today.

### Status Indicators
Must map directly and exclusively to the real, already-defined status vocabulary — `ok`, `unavailable`, `blocked` (card status), and `healthy` / `degraded` / `unhealthy` / `unavailable` (system health, `src/dataset/health.js`). No new status vocabulary should be invented at the visual layer that doesn't correspond to a real value already in the Dashboard Dataset.

### Notifications
Reserved for genuinely actionable, business-consequential events — never a decorative badge count. Given that no automation or approval-tracking mechanism exists yet (`dashboard-dataset.json`'s own `approvalStatus.mechanism: "not-yet-implemented"`), today's notification surface has nothing real to push proactively — this is a capability to design *for*, not one that has real content yet.

### Navigation
Must make the current business unit and the current role's scope obvious at all times, once both concepts exist in the data — today only one business unit (Toko Sembako Sejahtera) is actually connected (`src/dataset/businessUnits.js`), so navigation must not visually imply peer status among units that are not yet onboarded.

### Forms
Wherever a future form allows a human to act on a "blocked" or "pending approval" figure, the form itself must foreground the Human Approval Gate (Business Rules Catalog GOV-004) — never let a consequential action look identical to a read-only view.

### Dialogs
Reserved for genuinely interrupting, consequential moments (e.g. a Human Approval Gate confirmation) — never used for routine information display, which belongs in the persistent card/screen layout instead.

### Mobile Layout
Must be the *first-class* target, not an adaptation of desktop — Mas War (Driver) and likely Ayu (Cashier) are on-the-go or at a fixed till, not at a desk. A mobile layout that only shows a subset of "the real" desktop experience would fail this system's most operational users.

### Desktop Layout
The appropriate surface for deeper investigation — e.g. drilling into a card's full `audit.lineage` chain — but not the assumed default entry point.

---

# 4. Emotional / Brand Direction

Per this sprint's explicit constraint, no logo, no brand colors, no visual identity is defined here — only the emotional direction a future brand identity must serve.

- **Family** — grounded directly in ADR-0002: Ibu is a co-founder, not a lender ("bukan pemberi pinjaman, dia salah satu pendiri bisnis ini"). The product should feel like it belongs to the people who use it.
- **Responsibility** — grounded in the Human Approval Gate (GOV-004) being a genuine, load-bearing rule throughout this whole system, not a compliance afterthought.
- **Operational Excellence** — grounded in this project's own history: real bugs were found and fixed (Realm shutdown defect, Gross/Net mislabeling), not papered over. The product should feel like it holds itself to that same standard.
- **Business Growth** — grounded in the Multi-Brand Design already prepared in Production Architecture §4 and the five business units already scaffolded in `src/dataset/businessUnits.js` — the product should feel like it has room to grow with the business, not like a single-purpose tool.
- **Trust** — the same word used throughout this entire repository's own governance language (Canonical Data Contract, Business Rules Catalog) — earned through traceability (every card's `audit.lineage`), not asserted through polish.
- **Long-term sustainability** — this business already carries decades of accumulated family kitchen knowledge, per this repository's own memory records — the product should feel built to last that long too, not built for a quarter.

---

# 5. Assumptions and Unknowns (this document)

**Current repository evidence used directly:** the 11 real dashboard cards and their real `status`/`confidence`/`value` vocabulary (`dashboard-schema.json`); the real, already-found bugs (Gross/Net mislabeling, Kas Kasir violation) as the motivating case for low-cognitive-load design; the real role list and real named users provided in this sprint's own instructions; ADR-0002's family-capital framing; the Human Approval Gate (GOV-004).

**Future recommendations (not grounded in any prior document, proposed here for the first time):** every principle in Sections 2–4 is this document's own design proposal, not a pre-existing repository fact — they are grounded *in service of* real evidence above, but the principles themselves are new judgment calls this sprint is explicitly asked to make.

**Unknown:** actual visibility scope for five of the seven roles (Store Manager, Central Kitchen Manager, Cashier, Driver, Future Admin) remains `UNKNOWN` in `src/dataset/roles.js` — this design system describes tone and structure for those users but cannot yet say exactly what each one is allowed to see.
