# Reporting Service

| | |
| --- | --- |
| **Status** | Draft — proposed business responsibility, pending CEO acceptance |
| **Grounded in** | Production Architecture §3.5 (Business Services' stated purpose), §3.7 (Dashboard's input); Canonical Data Contract §8 (Relationship Model — "Baseline Snapshot → (anchors) → Financial Report"; Decision entity's Consumers include Reports) |

**Note on scope:** "Financial Report" and "KPI" are referenced repeatedly across the Canonical Data Contract and Production Architecture but are **not themselves formally defined as canonical entities** in the Contract's §4 table. Reporting Service is scoped around this gap as it already exists in the source documents — it is not this document's invention, and it is not resolved here (see Architectural Conflicts, below).

## Responsibilities

- Assemble the KPI and reconciliation outputs Production Architecture already assigns to Business Services as a whole (§3.5) into the actual Report and KPI artifacts that Dashboard and AI Workforce consume — the cross-cutting output layer sitting alongside, not instead of, Finance/Inventory/Sales/Customer/Pricing Service.
- Anchor every report it assembles to the Baseline Snapshot, per the Relationship Model (§8): "every TSS financial report from 1 August 2026 onward must trace back to the 2026-07-31 Baseline Snapshot."
- Carry forward the Enterprise KPI Framework gap Production Architecture already names directly (§3.5): of the KPIs that framework defines, only a small minority currently have a fully documented formula. Reporting Service cannot compute a KPI whose formula does not yet exist — it names the gap rather than inventing a formula to fill it.

## Inputs

- Outputs of Finance Service, Inventory Service, Sales Service, Customer Service, and Pricing Service — Reporting Service does not read canonical data directly for figures those five services already own; it assembles what they've already computed.
- **Baseline Snapshot** (Canonical Contract §4) — read directly, as the reconciliation anchor for any report.
- **Decision** (Canonical Contract §4) — a recorded business or architectural decision; named as a Consumer relationship in the Contract ("Decision... Consumers: Knowledge domain, AI, Reports"), i.e. a Decision can inform what a Report says, and a Report can reference a Decision as its justification.

## Outputs

- Assembled Financial Reports, each traceable to the Baseline Snapshot they reconcile against and the Business Service outputs they were built from.
- KPI values, only for the subset that already has a documented formula — every other named KPI is surfaced as "not yet computable," not silently omitted or approximated.
- A reconciliation status: whether Gross Margin, Net Margin, and `Invoice.profit` currently agree, per Finance Service's own reconciliation output (Reporting Service assembles this into a report; Finance Service computes it).

## Business Rules

- **Stateless with respect to truth** (Production Architecture §3.5): Reporting Service assembles what other services have already computed; it does not compute a figure independently that duplicates one of theirs.
- **No Duplicate Meaning** (Canonical Data Contract §2): Reporting Service is the architectural answer to the "same metric, two answers" problem ADR-0003 diagnosed (§2) — a report it produces is not a seventh place a figure gets computed, it is the one place figures already computed elsewhere get presented together.
- **Immutable History** (Canonical Data Contract §2): a report, once produced, is not silently edited — a correction is a new, dated report that supersedes it, matching the same discipline already proven in the Baseline Snapshot's own Integrity Rules.
- **Human Approval Gate applies to whatever Reporting Service hands to AI Workforce** — no different from any other Business Service output, per ADR-0004 Principle 8.
- **Open item this service cannot resolve on its own:** most KPIs in the Enterprise KPI Framework have no documented formula yet (a fact Production Architecture §3.5 states directly). Reporting Service's KPI output is bounded by that gap.
- **Open item:** whether Reporting Service is genuinely a seventh, separate service, or should instead be a shared assembly function each of the other five services exposes on their own output, is not settled by any source document — this document treats it as separate because the task required a standalone `reporting-service.md`, and flags this as a design choice, not a settled fact (see Architectural Conflicts).

## Consumers

Per Production Architecture §3.7 (Dashboard's Input is Business Services output) and §3.8 (AI Workforce reads Business Services output): Dashboard (primary consumer — this is specifically what closes the Dashboard Lineage Audit's finding that most cards have no verifiable source), AI Workforce (for analysis and anomaly-flagging, subject to Human Approval Gate), Apps Script (target state, for any report-shaped data it currently assembles itself).

## Future APIs

No API is designed here — this section only names anticipated access needs:

- A way for Dashboard to request "today's report" and receive something traceable card-by-card back to Finance/Inventory/Sales/Customer/Pricing Service outputs and, ultimately, the Baseline Snapshot.
- A way for AI Workforce to request the current KPI set, receiving an explicit "not yet computable" marker for any KPI without a documented formula, rather than a silently missing value.
- A way for a future report to reference the Decision(s) that justify a figure in it (e.g. a report reflecting ADR-0002's capital-structure decision), without duplicating the Decision's own content.
