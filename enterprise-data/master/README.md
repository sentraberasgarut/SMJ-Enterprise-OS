# Enterprise Master Data

| | |
| --- | --- |
| **Status** | Draft — governance definition only, pending CEO acceptance |
| **Date** | 31 July 2026 |
| **Scope** | Defines the enterprise's master-data architecture. Contains no data. |
| **Derives from** | [ADR-0001](../../adr/0001-github-authoritative-notion-mirror.md), [ADR-0002](../../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md), [ADR-0003](../../adr/0003-canonical-data-platform-loka-pos.md), [ADR-0004](../../adr/0004-technology-constitution-and-investment-principles.md), [Enterprise OS Blueprint v1](../../architecture/enterprise-os-blueprint-v1.md), [Canonical Data Contract v1](../../architecture/canonical-data-contract-v1.md), [Data Governance Framework v1](../../architecture/data-governance-framework-v1.md), [Enterprise KPI Framework v1](../../architecture/enterprise-kpi-framework-v1.md), [2026-07-31 Baseline Manifest](../baseline/2026/2026-07-31-reset/MANIFEST.md) |

---

## Purpose

Master data is the stable, ongoing reference layer everything else in Enterprise OS depends on — which products exist, which branches exist, who the customers and suppliers are, who the employees are, what things cost, and how money and goods are categorized. Transactions come and go; master data is what a transaction *points to*. Without governed master data, the same product, customer, or branch can be represented differently in every system that touches it — which is exactly the fragmentation ADR-0003 already diagnosed at the platform level.

This directory defines **governance only** — ownership, lifecycle, and rules — for nine master datasets. It contains no populated data, no templates, no sample records, and no implementation.

## Relationship with the Financial Baseline

The [2026-07-31 baseline](../baseline/2026/2026-07-31-reset/MANIFEST.md) is a **point-in-time financial anchor** — what TSS's financial position was on that date. It is not itself master data, and it was not produced using any formally governed master-data layer, since none existed yet when it was created. Its figures (Inventory Value, Receivable, Payable, and so on) implicitly depended on master-data concepts — which products were counted, which customers owed money — without those concepts being separately governed at the time.

Master Data, as defined here, is the ongoing reference layer going forward. It does not retroactively change the baseline. Future baselines will be able to reconcile more precisely once this layer is actually populated and governed — that is a benefit this directory makes possible, not a claim that it has already happened.

## Relationship with the Canonical Data Layer

Per ADR-0003, the Canonical Data Layer is the full normalized operational data layer, holding both stable reference entities and transactional/event data together. **Master Data is the foundation subset of that layer** — the reference entities (Product, Branch, Customer, Supplier, Employee, Price, and so on) that transactional records (Invoice, Shift, Restock) point to. This directory governs that foundation; it does not implement the Canonical Data Layer itself, which remains a separate, not-yet-built piece of architecture per ADR-0003's own Migration Strategy.

## The Nine Master Datasets

| Dataset | One-line purpose |
| --- | --- |
| [Products](products/README.md) | Every sellable or stockable item across TSS and Central Kitchen |
| [Branches](branches/README.md) | Physical fulfillment points that receive goods and/or act as internal customers |
| [Customers](customers/README.md) | Every party TSS, CK, or SBGA sells to |
| [Suppliers](suppliers/README.md) | Every party TSS or CK buys from |
| [Employees](employees/README.md) | People who operate Enterprise OS systems |
| [Pricing](pricing/README.md) | Current and historical selling/cost prices |
| [Chart of Accounts](chart-of-accounts/README.md) | The financial account categories Cash, Expense, Receivable, Payable, and Opening Equity depend on |
| [Unit of Measure (UOM)](uom/README.md) | The units Products are measured, priced, and stocked in |
| [Taxonomy](taxonomy/README.md) | The category structure used to classify Products for reporting and margin analysis |

Every dataset's README states, explicitly, wherever this repository does not yet answer a governance question — ownership, identifier, deletion policy, and so on. Several of the nine (notably Chart of Accounts, UOM, and Taxonomy) are named here because the business clearly needs them, not because any existing document has already defined them. That distinction is stated plainly inside each file, not glossed over.

**AI Agents do not own any master dataset.** Across all nine, AI appears only as a downstream consumer — reading master data to inform analysis, drafts, or proposals — never as a Business Owner, Technical Owner, or Approval Authority. This is a direct, uniform application of ADR-0004's Human Approval Gate principle, not a per-dataset judgment call.

---

## Enterprise Data Flow

```
Financial Baseline
      ↓
Master Data
      ↓
Canonical Data
      ↓
Automation
      ↓
Apps Script
      ↓
Dashboard
      ↓
AI
```

- **Financial Baseline → Master Data:** the baseline is the historical anchor; master data is what exists now and going forward, informed by what the baseline already established (e.g. the products and customers implicitly counted in it).
- **Master Data → Canonical Data:** master data is the stable foundation the full Canonical Data Layer normalizes transactional and event data against.
- **Canonical Data → Automation:** automation (per the Blueprint's Automation Layer) reacts to canonical data; it does not hold its own separate copy of business truth.
- **Automation → Apps Script:** Buku Toko's Apps Script application is a consumer of automation output going forward.
- **Apps Script → Dashboard:** operational data flows onward into reporting surfaces.
- **Dashboard → AI:** AI reads dashboards and canonical data last in this chain, strictly as a consumer, gated by human approval before anything consequential happens (ADR-0004 Principle 8).

**One nuance worth stating plainly rather than smoothing over:** this diagram shows a single downward flow, but Apps Script is not purely a downstream consumer today — ADR-0003 names Buku Toko (the system Apps Script is bound to) as one of exactly three **Authoritative Sources** in the current architecture, alongside Loka POS and the GitHub repository. Apps Script both produces authoritative operational data today and is expected to consume canonical data in the target architecture. This directory does not resolve that dual role; it is recorded here so the diagram above is read as intent, not as a claim that Apps Script has already been demoted to a pure consumer.
