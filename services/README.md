# Business Services — Overview

| | |
| --- | --- |
| **Status** | Draft — proposed business-responsibility definitions, pending CEO acceptance. Inherits the status of ADR-0003, ADR-0004, the Canonical Data Contract, and Production Architecture v1 — all still Proposed/Draft. |
| **Date** | 1 August 2026 |
| **Proposed by** | Claude (agent), on behalf of no one — CEO decides |
| **Builds on** | [ADR-0001](../adr/0001-github-authoritative-notion-mirror.md), [ADR-0002](../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md), [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md), [ADR-0004](../adr/0004-technology-constitution-and-investment-principles.md), [Canonical Data Contract v1](../architecture/canonical-data-contract-v1.md), [Production Architecture v1](../architecture/production-architecture-v1.md) |
| **Defines** | WHAT business responsibility each service holds, in business language |
| **Does NOT define** | How a service is implemented, coded, hosted, or exposed — no schema, no API, no vendor |

---

## What Business Services Are

Production Architecture v1 (§3.5) already named **Business Services** as a layer: "the layer where derived business meaning (KPIs, reconciliation against the Financial Baseline, the not-yet-built figure that would finally reconcile Gross Margin, Net Margin, and `Invoice.profit`) is computed once instead of separately inside Apps Script, the Dashboard, and any future AI analysis."

This document set takes that one layer and gives it internal shape — six services, each owning one business responsibility, instead of one undifferentiated block. This is a **documentation refinement**, not a new architectural layer and not a new decision: every service below is scoped directly from an Enterprise Domain or canonical entity the Canonical Data Contract already named (§3, §4). No new domain, entity, or responsibility is invented here.

**Why they exist:** the Canonical Data Contract already recorded a real, named defect — "two systems computing 'profit' differently... is not a tolerated steady state" (§2, No Duplicate Meaning) — and Production Architecture already found a concrete instance of it (`_bebanBulan()` / `_olahLoka()` duplicated calculation logic inside Apps Script). Business Services exist so that a business figure — a KPI, a reconciled balance, a stock position — is computed **once**, in one named, owned place, and every consumer (Apps Script, Dashboard, AI Workforce, Automation) reads that one answer instead of each independently re-deriving its own.

## Relationship with Canonical Data

Business Services' only input is the Canonical Layer (Production Architecture §3.5, "Input: Canonical entities"). The Business Layer is explicitly **stateless with respect to truth** (§2): "it derives, it does not originate." A Business Service never invents a fact the Canonical Layer doesn't already hold, and never writes back to canonical data — the Canonical Data Contract's Consumer Isolation principle (§2) applies to Business Services exactly as it applies to Apps Script, AI, or any other consumer: dependence is on the Contract's definitions, never on a source system's native format.

## Relationship with Apps Script

Production Architecture §3.6 names the target state explicitly: Apps Script (Buku Toko) is *today* both a live Authoritative Source and a place where business logic is computed directly. In target state it becomes **a consumer of Business Services output**, not a second place where the same figure is computed in parallel. This is the architecture's stated fix for the duplication already found in production. Business Services do not replace Apps Script's role as an Authoritative Source for operational records (ADR-0003 §3) — they replace *only* the parts of Apps Script that currently compute derived business meaning redundantly.

## Relationship with AI Workforce

Per ADR-0004 Principle 8 and Production Architecture §3.8, AI Workforce reads **both** canonical data and Business Services output to produce drafts, analysis, and flagged anomalies — it never originates a canonical fact and never computes its own parallel version of a figure a Business Service already owns. Every Business Service output that reaches AI Workforce is subject to the same Human Approval Gate as everything else downstream of AI (Canonical Data Contract §2): nothing an AI agent produces from a Business Service figure takes effect on anything consequential without a named human approving it first.

## Relationship with Dashboard

Production Architecture §3.7 states the Dashboard "holds no truth of its own" and, in target state, takes Business Services output as its only input. The Dashboard Lineage Audit already found dashboard cards with no verifiable source and at least one figure mislabeled against the wrong target — Business Services exist so that every dashboard card can trace back through one named service to a canonical entity and its provenance, rather than to a bespoke calculation inside the rendering layer itself.

---

## The Six Services

Six services are documented in this directory. Five are scoped directly to an Enterprise Domain the Canonical Data Contract already named (§3); one (Reporting) is scoped to the cross-cutting KPI/reconciliation responsibility Production Architecture already assigned to Business Services as a whole.

| Service | Grounded in (Canonical Contract §3 Enterprise Domain / §4 entities) |
| --- | --- |
| [Finance](finance-service.md) | Finance domain; Cash, Expense, Receivable, Payable, Baseline Snapshot entities |
| [Inventory](inventory-service.md) | Inventory domain; Inventory, Product (stock aspect), Supplier entities |
| [Sales](sales-service.md) | Retail Operations (TSS) domain; Transaction/Invoice, Shift entities |
| [Customer](customer-service.md) | CRM and Sales & Marketing domains; Customer, Branch, Lead, Content, Campaign entities |
| [Pricing](pricing-service.md) | Price entity (§4) — not a named Enterprise Domain on its own; separated from Product because of its stricter, always-on Human Approval requirement |
| [Reporting](reporting-service.md) | Business Services' own stated purpose (§3.5) — KPIs, Financial Baseline reconciliation, the Gross/Net/`Invoice.profit` reconciliation |

Every service document follows the same structure: Responsibilities, Inputs, Outputs, Business Rules, Consumers, Future APIs. None specify a schema, a field, an endpoint, or a technology — per this sprint's explicit scope.

## Human Approval Gate — applies uniformly

No Business Service has unsupervised write access to anything. This is not a per-service judgment call — it is the same direct, uniform rule the Canonical Data Contract's Ownership Matrix (§6) already applies to every canonical entity, extended to the layer that consumes them. A Business Service may compute and expose a figure; only a named human (per the CEO-centric Ownership Matrix, since no dedicated technical role exists in this organization — ADR-0004 Principle 5) approves anything that figure would consequentially change.

## Scope Boundary

Every document in this directory is Draft, pending CEO acceptance, and inherits every open item already on record in its source documents — a Conflicted or Unresolved Authoritative Source named in the Canonical Data Contract is **not** resolved by defining a Business Service around it; it is carried forward and named again, per each service's own Business Rules section. See "Assumptions, Unresolved Questions, and Architectural Conflicts" below for what this document set could not resolve on its own.
