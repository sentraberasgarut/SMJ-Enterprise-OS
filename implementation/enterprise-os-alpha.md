# Road to Enterprise OS Alpha — Phase A

**Date:** 2026-08-01
**Purpose:** Describe the business milestones between where the repository stands today (a validated prototype and a documented architecture) and an "Alpha" state of the Enterprise OS — in business terms only. No cloud, vendor, database, or implementation decisions are made or implied here.

```
Daily Backup  →  Canonical  →  Business Services  →  Dashboard  →  Mobile
```

Each arrow is a milestone: the business gains a new, real capability it does not have today. None of these milestones require choosing a technology to define — they require the *business* to agree what "done" looks like.

---

## Where Phase A starts from

What already exists, verified, as of this milestone:
- A working, tested process that turns *one* manually-provided Loka backup into a trustworthy, validated canonical dataset — proven correct against real July 2026 data, with zero validation issues.
- A documented, business-reviewed set of rules for what "canonical" data means for eight core entities (Product, Customer, Supplier, Shift, Expense, Invoice, InvoiceItem, Payment).
- A known, documented list of what is currently wrong with the live dashboard (see `reports/dashboard-reconciliation-audit.md`) — a business problem Phase A must ultimately close, not just work around.

What Phase A starts from is therefore not zero — it is "we know how to do this correctly once, by hand, for one day's data." Phase A is about turning that into something that happens reliably, for every day, and reaches the people who need it.

---

## Milestone 1 — Daily Backup

**Business goal:** A backup of the day's Loka POS data becomes available every business day, without anyone having to remember to make it happen.

**Today:** A backup is produced manually, whenever someone thinks to export one from the Loka app and copy it somewhere accessible. There is no guarantee yesterday's backup exists, or that it's the most recent one.

**Done looks like:** Every business day ends with a backup that the business can point to and say "this is definitely yesterday's real numbers," without depending on any one person's memory that day.

**Why this comes first:** Nothing downstream — canonical data, business services, the dashboard, mobile access — can be trusted if the input itself is unreliable or missing on a given day. This milestone is entirely about reliability of an existing manual action, not about building anything new.

---

## Milestone 2 — Canonical

**Business goal:** Every daily backup can be turned into the same trustworthy, validated dataset the prototype already proved out for one day — every day, not just once, and not requiring an AI agent or an engineer to run it by hand each time.

**Today:** The transformation logic exists and is proven correct (validated twice, independently, against real data). But it runs once, on demand, by hand, on one person's machine.

**Done looks like:** Any given day's backup can reliably become "the canonical numbers for that day" — the same Revenue, Gross Profit, entity counts, and validation guarantees already proven — without a person needing to run anything or interpret any output personally.

**Why this matters:** This is the milestone where "we know how to compute this correctly" becomes "this gets computed correctly, every time, as a matter of course." It's the difference between a proof and a process.

---

## Milestone 3 — Business Services

**Business goal:** The canonical data starts directly answering the specific business questions people actually ask, on demand — not just existing as a file someone could theoretically read.

**Today:** Canonical data exists as a structured export. Answering a real question ("what's outstanding from Papoy," "what's today's Kas Kasir," "what needs restocking") still requires someone to look at it and work the answer out.

**Done looks like:** The specific, named business questions this repository has already identified as important — Revenue, Gross Profit vs. Net Profit, Cash in Hand vs. Safe Cash, Outstanding Receivables, Stock Alerts, and the others named in the existing KPI framework — each have a clear, current answer derived directly from canonical data, without manual interpretation.

**Why this matters:** This is where the canonical layer stops being a data-engineering achievement and starts being something the business actually uses to make a decision.

---

## Milestone 4 — Dashboard

**Business goal:** The dashboard the business already looks at every day gets its numbers from the canonical, validated pipeline instead of whatever currently produces them — and the confirmed-wrong numbers (Expenses, Kas Kasir, Gross Profit labeling) get corrected as part of that switch.

**Today:** The dashboard exists, is actively used, and has at least three confirmed discrepancies against real data, already documented and not yet fixed.

**Done looks like:** Every number on the dashboard traces back to the canonical pipeline, and the specific known-wrong numbers no longer disagree with the real Loka data.

**Why this comes fourth, not first:** Fixing the dashboard's display without first guaranteeing the data feeding it is reliable (Milestones 1–2) or that the right questions are being answered correctly (Milestone 3) would mean re-doing this work later. This is also the milestone with the most direct, immediate business payoff — it's listed fourth because of dependency order, not because it matters least.

---

## Milestone 5 — Mobile

**Business goal:** The same canonical, corrected numbers reach a phone — the CEO, or anyone else who needs it, can see the real state of the business without needing a laptop open.

**Today:** Nothing in this repository currently reaches a phone in any form.

**Done looks like:** Whatever "Business Services" and "Dashboard" already answer correctly is also reachable from a phone, in a form suited to a quick check rather than a full desktop session.

**Why this comes last:** A phone screen showing the same wrong numbers faster is not progress — this milestone only pays off once Milestones 1–4 are trustworthy.

---

## Explicitly Not Decided Here

Per this document's scope: no cloud provider, hosting choice, database technology, scheduling mechanism, or implementation approach is chosen or implied by any milestone above. Each milestone describes a business outcome; how it gets built is a separate decision for a separate sprint, informed by (but not committed by) the architecture documents already on record (`architecture/production-architecture-v1.md` and related ADRs).

## Out of Scope for Phase A
Everything beyond these five milestones — additional brands beyond what's already scoped (Central Kitchen, SBGA), multi-user access control, external integrations, anything not named above — is deliberately deferred past Alpha.
