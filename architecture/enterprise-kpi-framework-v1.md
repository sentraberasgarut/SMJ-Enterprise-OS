# Enterprise KPI Framework v1

| | |
| --- | --- |
| **Status** | Draft — proposed governance document, pending CEO acceptance. Inherits the status of its foundations: ADR-0003 and ADR-0004 remain Proposed, not Accepted. |
| **Date** | 31 July 2026 |
| **Proposed by** | Claude (agent), on behalf of no one — CEO decides |
| **Derives from** | [ADR-0001](../adr/0001-github-authoritative-notion-mirror.md), [ADR-0002](../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md), [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md), [ADR-0004](../adr/0004-technology-constitution-and-investment-principles.md), [Enterprise OS Blueprint v1](enterprise-os-blueprint-v1.md), [Canonical Data Contract v1](canonical-data-contract-v1.md), [Data Governance Framework v1](data-governance-framework-v1.md), [2026-07-31 Baseline Manifest](../enterprise-data/baseline/2026/2026-07-31-reset/MANIFEST.md) |

This document defines the enterprise-wide KPI contract: what each KPI means, in business language, and how confidently that meaning is established today. It is not a dashboard, not a spreadsheet, not code, and not an implementation plan.

**A note on discipline, stated once rather than repeated 44 times:** almost none of the KPIs below have a formula, alert threshold, or success target written down anywhere in the eight documents this framework derives from. That is not an oversight in this document — it is the honest finding of reading those documents carefully. Where a document defines something, it is cited. Where nothing defines something, it is marked **UNKNOWN**, not filled in with an invented industry-standard number. Numeric alert thresholds and success targets specifically are treated as **operational decisions** that belong in the roadmap or backlog, not as constitutional facts this governance document can assert on its own — so unless a threshold is explicitly written into one of the eight source documents, it is marked UNKNOWN here by design, not by gap.

---

# Financial

### Revenue

1. **Purpose:** Measure total sales value generated over a period.
2. **Business Meaning:** Top-line sales activity, before any cost is subtracted.
3. **Formula:** UNKNOWN — no document defines the precise computation (e.g. whether voided or refunded transactions are excluded).
4. **Unit:** IDR (Rupiah)
5. **Granularity:** UNKNOWN — plausible at transaction, day, or month level, but no document fixes one.
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO (no dedicated technical role exists — Data Governance Framework §2)
9. **Authoritative Source:** Loka POS — named authoritative for "sales transactions" (ADR-0003 §3)
10. **Consumer Systems:** Buku Toko (via cached metrics), Reports, AI
11. **Alert Threshold:** UNKNOWN — operational, not defined at governance level
12. **Success Target:** UNKNOWN — operational, not defined at governance level
13. **Related KPIs:** Gross Profit, Gross Margin, Transaction Count
14. **Known Limitations:** No document confirms whether Branch-as-Customer transactions (an unresolved overlap noted in the Canonical Data Contract §4) are included in Revenue or treated separately.
15. **Status:** Proposed

### Gross Profit

1. **Purpose:** Measure profit remaining after cost of goods sold, before operating expenses.
2. **Business Meaning:** What is left after paying for what was sold, before rent, wages, and other running costs.
3. **Formula:** UNKNOWN — not written down as an adopted formula in any document read.
4. **Unit:** IDR
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Implied via the `Ringkasan` cache referenced in ADR-0003 §2, but Gross Profit itself (the absolute value) is not separately named there — only Gross Margin (the percentage) is.
10. **Consumer Systems:** Reports, Finance domain
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Revenue, Gross Margin
14. **Known Limitations:** This framework infers Gross Profit's existence as the absolute-value counterpart to Gross Margin; no document names it independently.
15. **Status:** Unknown

### Gross Margin

1. **Purpose:** Measure profitability as a percentage of revenue, before operating expenses.
2. **Business Meaning:** How much of each Rupiah of sales is retained after cost of goods sold — the figure ADR-0003 confirms is already computed today.
3. **Formula:** UNKNOWN precisely — ADR-0003 §2 confirms it is computed from Loka via the `Ringkasan` cache, but the underlying arithmetic is not written down in any document read.
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** `Ringkasan` cache (Buku Toko), sourced from the Loka POS export (ADR-0003 §1–2)
10. **Consumer Systems:** Reports, Finance domain
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Net Margin, and a third figure — **Invoice Profit**, computed independently inside Loka on a per-transaction basis. ADR-0003 §2 states these figures "are both correct for different questions" and must not be conflated; this framework treats Gross Margin, Net Margin, and Invoice Profit as three distinct, currently-unreconciled KPIs, not interchangeable versions of "profit."
14. **Known Limitations:** No documented reconciliation exists between Gross Margin, Net Margin, and Invoice Profit today (ADR-0003 §2). Reporting any one without naming which one is a standing risk this framework exists partly to prevent.
15. **Status:** Proposed

### Net Profit

1. **Purpose:** Measure profit after both cost of goods sold and operating expenses.
2. **Business Meaning:** What the business genuinely keeps after all costs — the figure that determines whether TSS is gaining or losing value.
3. **Formula:** UNKNOWN — ADR-0003 §2 references "net margin (manual analysis)" as an existing figure without documenting its formula.
4. **Unit:** IDR
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** "Manual analysis" per ADR-0003 §2 — explicitly not a system. This is itself a governance gap: no system of record currently exists for this figure.
10. **Consumer Systems:** Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Gross Margin, Net Margin, Invoice Profit (see Gross Margin, Related KPIs)
14. **Known Limitations:** Computed manually today, not by any authoritative system — a direct violation of the Single Source of Truth principle until formalized.
15. **Status:** Unknown

### Net Margin

1. **Purpose:** Net Profit expressed as a percentage of Revenue.
2. **Business Meaning:** Same as Net Profit, normalized for comparison across periods.
3. **Formula:** UNKNOWN — same basis as Net Profit above.
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Manual analysis (ADR-0003 §2) — no system of record.
10. **Consumer Systems:** Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Gross Margin, Net Profit, Invoice Profit
14. **Known Limitations:** **Explicitly distinguished from Gross Margin and Invoice Profit** per ADR-0003 §2 — three different, unreconciled figures today.
15. **Status:** Unknown

### Operating Expense

1. **Purpose:** Total operating costs incurred over a period, distinct from cost of goods sold.
2. **Business Meaning:** The recurring cost of running the business that Gross Profit must cover for Net Profit to be positive.
3. **Formula:** UNKNOWN — no document defines the boundary between "operating" cost and cost of goods sold.
4. **Unit:** IDR
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** UNKNOWN — not established in any document read for this framework.
10. **Consumer Systems:** Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Net Profit, Net Margin
14. **Known Limitations:** No document confirms whether owner drawings (Prive, per ADR-0002's capital framing) are included in or excluded from this figure.
15. **Status:** Unknown

### Cash Balance

1. **Purpose:** Total cash and cash-equivalent (bank, e-wallet) held by the business at a point in time.
2. **Business Meaning:** Liquid resources available for operations, distinct from equity or inventory value.
3. **Formula:** UNKNOWN precise arithmetic — conceptually a sum across custody positions, not written down as an adopted formula.
4. **Unit:** IDR
5. **Granularity:** UNKNOWN (plausibly per shift, per the cash-custody discipline named in ADR-0003 §3, but not confirmed)
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO, with Ibu as co-signatory (ADR-0002)
8. **Technical Owner:** CEO
9. **Authoritative Source:** Buku Toko — named authoritative for "cash custody" (ADR-0003 §3); the 2026-07-31 Baseline Snapshot is authoritative specifically for the opening figure (MANIFEST.md)
10. **Consumer Systems:** Reports, Opening Equity calculation
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Opening Equity, Cash Reconciliation Accuracy
14. **Known Limitations:** Split across multiple wallets/custody points today with no single confirmed rollup formula in any document read.
15. **Status:** Proposed

### Opening Equity

1. **Purpose:** The TSS's net worth at the moment of the 31 July 2026 reset — the anchor figure all future profit is measured against.
2. **Business Meaning:** Per ADR-0002 and the Baseline Manifest, profit from 1 August 2026 onward is growth in this figure, not cash observed in the till.
3. **Formula:** **Defined.** Per ADR-0002: *"Neraca awal TSS: Aset − Hutang ke pihak luar = Ekuitas milik Aditya + Ibu"* (Assets − External Liabilities = Equity, jointly owned by Aditya and Ibu).
4. **Unit:** IDR
5. **Granularity:** Baseline (one-time, per reset event) — not transaction, shift, day, week, or month.
6. **Refresh Frequency:** Per baseline reset only. The 2026-07-31 baseline is the first instance; a future reset would produce a new, separately dated Baseline Snapshot (Data Governance Framework §6), never overwriting this one.
7. **Business Owner:** CEO, with Ibu as joint capital owner (ADR-0002)
8. **Technical Owner:** CEO
9. **Authoritative Source:** **2026-07-31 Financial Baseline**, `enterprise-data/baseline/2026/2026-07-31-reset/` (MANIFEST.md) — the most firmly established KPI in this entire framework.
10. **Consumer Systems:** Finance, Reports — every future TSS financial report must reconcile to this figure (MANIFEST.md, Reconciliation Rule)
11. **Alert Threshold:** Not applicable — a point-in-time anchor, not a continuously monitored metric.
12. **Success Target:** Not applicable — there is no "target" for an opening balance; it is what it is, once measured and reconciled.
13. **Related KPIs:** Cash Balance, Inventory Value, Receivable, Payable — all three feed this formula's Assets/Liabilities terms.
14. **Known Limitations:** The percentage split of this equity between Aditya and Ibu is **explicitly not yet established** — ADR-0002 names this as an open item requiring its own decision.
15. **Status:** **Defined**

### Inventory Value

1. **Purpose:** Total value of physical stock on hand, valued at cost.
2. **Business Meaning:** How much capital is tied up in goods rather than cash.
3. **Formula:** UNKNOWN precise arithmetic — one of the terms feeding the Opening Equity formula (as physical stock opname, per MANIFEST.md), but not stated as its own adopted formula.
4. **Unit:** IDR
5. **Granularity:** Baseline (one-time, confirmed); ongoing granularity UNKNOWN
6. **Refresh Frequency:** UNKNOWN beyond the baseline event
7. **Business Owner:** CEO (TSS); Ibu & Teh Nurul (Central Kitchen)
8. **Technical Owner:** CEO
9. **Authoritative Source:** 2026-07-31 Baseline Snapshot for the opening figure (physical stock opname, MANIFEST.md); ongoing authoritative source is **Unresolved** — Product's own Authoritative Source is conflicted (Canonical Data Contract §4)
10. **Consumer Systems:** Opening Equity, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Opening Equity, Stock Accuracy, Dead Stock
14. **Known Limitations:** Inherits Product's unresolved Authoritative Source conflict for anything beyond the one-time baseline figure.
15. **Status:** Proposed (baseline instance defined; ongoing tracking unresolved)

### Receivable

1. **Purpose:** Total amount owed *to* the business by outside parties.
2. **Business Meaning:** Sales already made but not yet collected in cash.
3. **Formula:** UNKNOWN precise arithmetic.
4. **Unit:** IDR
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** 2026-07-31 Baseline Snapshot for the opening figure; ongoing tracking not yet reconciled to the baseline (Canonical Data Contract §4, Data Governance Framework §2)
10. **Consumer Systems:** Opening Equity, Finance, CRM
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Opening Equity, Payable
14. **Known Limitations:** Explicitly excludes Ibu's funds, which are capital, not debt (ADR-0002) — this exclusion must never be violated by future automation.
15. **Status:** Proposed

### Payable

1. **Purpose:** Total amount owed *by* the business to outside parties.
2. **Business Meaning:** Obligations that reduce true equity, separate from Ibu's capital.
3. **Formula:** UNKNOWN precise arithmetic.
4. **Unit:** IDR
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** 2026-07-31 Baseline Snapshot for the opening figure; no ongoing source assigned (Data Governance Framework §2)
10. **Consumer Systems:** Opening Equity, Finance
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Opening Equity, Receivable
14. **Known Limitations:** **Explicitly excludes Ibu's funds** per ADR-0002 — the single most important rule governing this KPI; treating Ibu's contributions as Payable would directly violate that decision.
15. **Status:** Proposed

---

# Operations

*None of the eight source documents for this framework define an operational formula, threshold, or measurement mechanism for this domain in detail — the entries below name what each KPI is for and why it matters, and are honest about how little is formally established.*

### Stock Accuracy

1. **Purpose:** Measure how closely recorded stock matches physical stock on hand.
2. **Business Meaning:** Confidence that Inventory Value and related figures reflect reality, not just what a system says.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage (proposed unit only — not confirmed by any document)
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO (TSS); Ibu & Teh Nurul (CK)
8. **Technical Owner:** CEO
9. **Authoritative Source:** UNKNOWN — the Inventory entity itself has no confirmed Authoritative Source (Canonical Data Contract §4)
10. **Consumer Systems:** UNKNOWN
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Inventory Value, Dead Stock, Catalog Completeness
14. **Known Limitations:** No mechanism for measuring this exists anywhere in the documents read.
15. **Status:** Unknown

### Inventory Turnover

1. **Purpose:** Measure how quickly stock is sold and replaced.
2. **Business Meaning:** Signals whether capital is moving efficiently through goods or sitting idle.
3. **Formula:** UNKNOWN
4. **Unit:** UNKNOWN (commonly a ratio or a time period; not defined here)
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** UNKNOWN
10. **Consumer Systems:** UNKNOWN
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Inventory Value, Dead Stock, Restock Frequency
14. **Known Limitations:** Not defined in any document read.
15. **Status:** Unknown

### Dead Stock

1. **Purpose:** Measure the value of stock with no recent movement.
2. **Business Meaning:** Capital effectively frozen in goods that are not selling.
3. **Formula:** UNKNOWN
4. **Unit:** IDR (proposed only)
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO (TSS); Ibu & Teh Nurul (CK)
8. **Technical Owner:** CEO
9. **Authoritative Source:** UNKNOWN — related to Inventory's unresolved Authoritative Source (Canonical Data Contract §4)
10. **Consumer Systems:** UNKNOWN
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Inventory Value, Inventory Turnover
14. **Known Limitations:** No document defines what counts as "no recent movement."
15. **Status:** Unknown

### Restock Frequency

1. **Purpose:** Measure how often supply replenishment occurs.
2. **Business Meaning:** Signals supply-chain rhythm and dependency on specific suppliers.
3. **Formula:** UNKNOWN
4. **Unit:** UNKNOWN
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO (TSS); Ibu & Teh Nurul (CK)
8. **Technical Owner:** CEO
9. **Authoritative Source:** Related to Supplier, whose Authoritative Source is Loka POS (Canonical Data Contract §4) — but Restock itself is not detailed in any document read for this framework.
10. **Consumer Systems:** UNKNOWN
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Supplier Fulfillment, Inventory Turnover
14. **Known Limitations:** Not formally defined.
15. **Status:** Unknown

### Supplier Fulfillment

1. **Purpose:** Measure whether suppliers deliver what and when agreed.
2. **Business Meaning:** Reliability of the supply side of the business.
3. **Formula:** UNKNOWN
4. **Unit:** UNKNOWN
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO (TSS); Ibu & Teh Nurul (CK)
8. **Technical Owner:** CEO
9. **Authoritative Source:** UNKNOWN
10. **Consumer Systems:** UNKNOWN
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Restock Frequency
14. **Known Limitations:** Not formally defined.
15. **Status:** Unknown

### Shift Accuracy

1. **Purpose:** Measure whether a shift's recorded cash matches the counted cash at close.
2. **Business Meaning:** Directly tied to the Shift entity, whose Authoritative Source is itself conflicted between Loka's own Shift record and Buku Toko's Tutup Shift sheet (Canonical Data Contract §4).
3. **Formula:** UNKNOWN precise arithmetic — conceptually a variance (recorded vs. counted), consistent with the physical cash-count discipline established for the 2026-07-31 Baseline.
4. **Unit:** IDR (variance) or Percentage
5. **Granularity:** Shift
6. **Refresh Frequency:** Per shift, plausibly — not confirmed
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Conflicted — see Shift in Canonical Data Contract §4
10. **Consumer Systems:** Cash Balance, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Cash Reconciliation Accuracy, Cash Balance
14. **Known Limitations:** Cannot be reliably measured until the Shift ownership conflict is resolved.
15. **Status:** Unknown

### Cash Reconciliation Accuracy

1. **Purpose:** Measure how closely recorded cash matches bank statements or physical counts.
2. **Business Meaning:** Confidence in the Cash Balance KPI and, by extension, Opening Equity.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage or IDR variance
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO, with Ibu as co-signatory
8. **Technical Owner:** CEO
9. **Authoritative Source:** Buku Toko (cash custody, ADR-0003 §3); the Baseline Snapshot's own checksum-verification discipline (MANIFEST.md) is the closest documented analog, applied to a different kind of record.
10. **Consumer Systems:** Cash Balance, Opening Equity
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Cash Balance, Shift Accuracy, Baseline Integrity
14. **Known Limitations:** No ongoing (post-baseline) reconciliation mechanism is documented.
15. **Status:** Unknown

### Catalog Completeness

1. **Purpose:** Measure what fraction of the Product catalog has all required data (e.g. price, category assigned).
2. **Business Meaning:** Directly the "Completeness" Data Quality Rule (Data Governance Framework §7), applied specifically to Product.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO (TSS); Ibu & Teh Nurul (CK)
8. **Technical Owner:** CEO
9. **Authoritative Source:** Conflicted — see Product in Canonical Data Contract §4
10. **Consumer Systems:** Product, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Data Completeness, Stock Accuracy
14. **Known Limitations:** Cannot be measured consistently while Product has two competing Authoritative Sources.
15. **Status:** Unknown

---

# Sales

### Transaction Count

1. **Purpose:** Number of completed sales in a period.
2. **Business Meaning:** Raw sales activity volume, independent of value.
3. **Formula:** UNKNOWN precise definition — whether voided or refunded transactions count is not stated.
4. **Unit:** Count
5. **Granularity:** Transaction (aggregated to day/week/month) — aggregation level not fixed by any document
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Loka POS (ADR-0003 §3)
10. **Consumer Systems:** Reports, Revenue calculation
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Revenue, Average Basket
14. **Known Limitations:** Edge-case handling (voids, refunds, Branch-as-Customer transfers) is undefined.
15. **Status:** Proposed

### Average Basket

1. **Purpose:** Average value per transaction.
2. **Business Meaning:** Indicates how much a typical sale is worth.
3. **Formula:** UNKNOWN — no document states this as an adopted formula, though it is conceptually related to Revenue and Transaction Count.
4. **Unit:** IDR
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Loka POS (via Revenue and Transaction Count)
10. **Consumer Systems:** Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Revenue, Transaction Count
14. **Known Limitations:** Not independently defined anywhere.
15. **Status:** Unknown

### Average Item per Transaction

1. **Purpose:** Average number of line items per sale.
2. **Business Meaning:** Indicates basket composition depth, distinct from basket value.
3. **Formula:** UNKNOWN
4. **Unit:** Count
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Loka POS
10. **Consumer Systems:** Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Average Basket, Transaction Count
14. **Known Limitations:** Not defined anywhere.
15. **Status:** Unknown

### Repeat Customer Rate

1. **Purpose:** Proportion of customers who purchase more than once.
2. **Business Meaning:** Signals genuine customer retention, distinct from one-off sales.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Customer entity (Loka POS, Canonical Data Contract §4)
10. **Consumer Systems:** CRM, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** New Customer Rate, Repeat Purchase (Customer Funnel)
14. **Known Limitations:** Directly affected by the Branch-as-Customer overlap (Canonical Data Contract §4) — a branch receiving regular internal transfers could inflate this figure if not distinguished from genuine retail repeat purchases.
15. **Status:** Unknown

### New Customer Rate

1. **Purpose:** Proportion or count of first-time customers in a period.
2. **Business Meaning:** Signals whether the customer base is growing.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage or Count
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Customer entity (Loka POS)
10. **Consumer Systems:** CRM, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Repeat Customer Rate
14. **Known Limitations:** Same Branch-as-Customer caveat as Repeat Customer Rate.
15. **Status:** Unknown

### Loyalty Usage

1. **Purpose:** Measure engagement with the loyalty points mechanism.
2. **Business Meaning:** Indicates whether the loyalty program is actually influencing repeat behavior.
3. **Formula:** UNKNOWN
4. **Unit:** UNKNOWN
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Loyalty Ledger entity (Canonical Data Contract §4)
10. **Consumer Systems:** CRM, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Repeat Customer Rate
14. **Known Limitations:** Not formally defined beyond the entity's existence.
15. **Status:** Unknown

---

# Customer Funnel

*Every KPI in this domain depends on the Lead and Content entities, whose Authoritative Source is explicitly unresolved — Notion's operational databases were named out of scope by ADR-0001 pending a future decision. That single open item is the root cause of "Unknown" appearing throughout this section.*

### Lead Count

1. **Purpose:** Number of prospective customer signals captured.
2. **Business Meaning:** Top-of-funnel activity volume.
3. **Formula:** UNKNOWN
4. **Unit:** Count
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Unresolved — Notion Lead Database, out of scope per ADR-0001
10. **Consumer Systems:** Sales & Marketing, CRM, AI
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Qualified Lead, Conversion Rate
14. **Known Limitations:** Cannot be treated as canonical until the Lead entity's Authoritative Source is resolved.
15. **Status:** Unknown

### Qualified Lead

1. **Purpose:** Leads meeting a defined qualification bar.
2. **Business Meaning:** Distinguishes serious prospects from casual interest.
3. **Formula:** UNKNOWN — no qualification criteria are defined in any document read for this framework.
4. **Unit:** Count
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Unresolved (see Lead Count)
10. **Consumer Systems:** Sales & Marketing
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Lead Count, Offer Rate
14. **Known Limitations:** Qualification criteria are not documented in this framework's source set.
15. **Status:** Unknown

### Response SLA

1. **Purpose:** Measure time-to-first-response for a lead or consultation.
2. **Business Meaning:** Speed of engagement with a prospective customer.
3. **Formula:** UNKNOWN
4. **Unit:** Time (hours, likely) — not confirmed
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Unresolved (see Lead Count)
10. **Consumer Systems:** Sales & Marketing
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Qualified Lead
14. **Known Limitations:** No SLA figure is defined in any document read for this framework.
15. **Status:** Unknown

### Offer Rate

1. **Purpose:** Proportion of qualified leads that receive a concrete offer.
2. **Business Meaning:** Measures whether qualification actually leads to action.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Unresolved
10. **Consumer Systems:** Sales & Marketing
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Qualified Lead, Closing Rate
14. **Known Limitations:** Not defined.
15. **Status:** Unknown

### Closing Rate

1. **Purpose:** Proportion of offers that convert to a sale.
2. **Business Meaning:** Effectiveness of the offer stage of the funnel.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Unresolved
10. **Consumer Systems:** Sales & Marketing
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Offer Rate, Conversion Rate
14. **Known Limitations:** Not defined.
15. **Status:** Unknown

### Conversion Rate

1. **Purpose:** Overall lead-to-customer conversion.
2. **Business Meaning:** End-to-end funnel effectiveness.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Unresolved
10. **Consumer Systems:** Sales & Marketing, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Lead Count, Closing Rate
14. **Known Limitations:** Not defined.
15. **Status:** Unknown

### Repeat Purchase

1. **Purpose:** Whether a customer originating from the funnel purchases again.
2. **Business Meaning:** Funnel-specific counterpart to the Sales domain's Repeat Customer Rate — tracks retention specifically for funnel-acquired customers.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** Unresolved (Lead) joined with Customer (Loka POS) — the join itself is not documented anywhere
10. **Consumer Systems:** Sales & Marketing, CRM
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Repeat Customer Rate, Conversion Rate
14. **Known Limitations:** Requires linking two entities whose relationship is not yet defined in any document.
15. **Status:** Unknown

---

# Automation

*Every KPI in this domain depends on the Automation Job entity, which the Canonical Data Contract explicitly states "does not yet exist as a canonical record," with no Technical Owner staffed to build one (Data Governance Framework §2, §6). That single fact governs every entry below.*

### Automation Success Rate

1. **Purpose:** Proportion of automation runs that complete successfully.
2. **Business Meaning:** Confidence that automated processes are working as intended.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** Does not exist yet (Automation Job entity, Canonical Data Contract §4)
10. **Consumer Systems:** Automation domain, AI
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Automation Failure Rate
14. **Known Limitations:** Cannot be measured until Automation Job is realized as a canonical record.
15. **Status:** Unknown

### Automation Failure Rate

1. **Purpose:** Proportion of automation runs that fail.
2. **Business Meaning:** The inverse and equally important counterpart to Automation Success Rate — a system with no failure visibility has already failed silently before (ADR-0003 §2, the `Rekonsiliasi` sheet stalling with nothing downstream aware).
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** Does not exist yet
10. **Consumer Systems:** Automation domain, AI
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Automation Success Rate
14. **Known Limitations:** Same as Automation Success Rate.
15. **Status:** Unknown

### Data Freshness

1. **Purpose:** Measure how current canonical data is relative to its source.
2. **Business Meaning:** Directly the "Freshness" Data Quality Rule (Data Governance Framework §7), whose cautionary example is already on record: a schema analysis performed against a backup found to be five weeks stale relative to the rest of the organization's timeline.
3. **Formula:** UNKNOWN
4. **Unit:** Time (lag)
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** No measurement mechanism exists yet
10. **Consumer Systems:** Automation domain, AI, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Ingestion Success, Sync Delay
14. **Known Limitations:** The rule is named; no measurement exists.
15. **Status:** Unknown

### Ingestion Success

1. **Purpose:** Proportion of source-to-canonical ingestion attempts that succeed.
2. **Business Meaning:** Directly tied to the Canonical Data Platform's ingestion architecture (ADR-0003 §3), which is proposed but not yet operating.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** No ingestion pipeline is yet operating (ADR-0003 §4, Migration Strategy — still sequenced, future work)
10. **Consumer Systems:** Canonical Data Layer, AI
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Validation Success, Data Freshness
14. **Known Limitations:** Cannot be measured before ADR-0003 is accepted and its ingestion architecture is built.
15. **Status:** Unknown

### Validation Success

1. **Purpose:** Proportion of ingested records that pass Data Quality validation.
2. **Business Meaning:** Directly tied to the Data Quality Rules in Data Governance Framework §7.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** No validation mechanism exists yet
10. **Consumer Systems:** Canonical Data Layer, AI
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Ingestion Success, Data Quality Score
14. **Known Limitations:** Same as Ingestion Success.
15. **Status:** Unknown

### Sync Delay

1. **Purpose:** Measure time lag in the one-way repo-to-Notion sync established by ADR-0001.
2. **Business Meaning:** Confidence that Notion's mirror reflects the repo promptly, per ADR-0001's stated intent.
3. **Formula:** UNKNOWN
4. **Unit:** Time
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** The sync mechanism itself is established (GitHub Actions, one-way repo → Notion, ADR-0001), but no measurement of its delay is documented.
10. **Consumer Systems:** Knowledge domain, Notion dashboards
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Data Freshness
14. **Known Limitations:** The mechanism exists; the metric measuring it does not.
15. **Status:** Unknown

---

# Enterprise

*This domain measures the health of governance itself. Most entries here are proposed directly by the Data Governance Framework rather than by any prior operational system, since no prior system was designed to measure governance.*

### Data Quality Score

1. **Purpose:** A composite measure across the seven Data Quality Rules — Completeness, Consistency, Uniqueness, Integrity, Freshness, Traceability, Provenance (Data Governance Framework §7).
2. **Business Meaning:** A single number intended to summarize how trustworthy Enterprise OS data is overall.
3. **Formula:** UNKNOWN — no weighting or aggregation method across the seven rules is defined anywhere.
4. **Unit:** UNKNOWN (score or percentage — not fixed)
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** Proposed at Monthly Audit cadence (Data Governance Framework §9), not yet practiced
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** Data Governance Framework §7 (the rules themselves); no measurement system exists
10. **Consumer Systems:** Audit Policy, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Data Completeness, Data Consistency, Audit Findings
14. **Known Limitations:** Proposed conceptually via the governance framework; not yet operationalized in any form.
15. **Status:** Unknown

### Data Completeness

1. **Purpose:** Measure how many canonical records have all required fields.
2. **Business Meaning:** Direct measurement of the "Completeness" Data Quality Rule.
3. **Formula:** UNKNOWN
4. **Unit:** Percentage
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** Data Governance Framework §7 (rule defined; measurement mechanism does not exist)
10. **Consumer Systems:** Data Quality Score, Catalog Completeness
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Catalog Completeness, Data Quality Score
14. **Known Limitations:** Rule exists; measurement does not.
15. **Status:** Unknown

### Data Consistency

1. **Purpose:** Measure whether the same business fact agrees across sources.
2. **Business Meaning:** Its clearest current failing example is already documented: Gross Margin, Net Margin, and Invoice Profit are three unreconciled figures for essentially the same underlying question (ADR-0003 §2).
3. **Formula:** UNKNOWN
4. **Unit:** UNKNOWN
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** Data Governance Framework §7 ("No Duplicate Meaning" / Consistency rule); no measurement mechanism exists
10. **Consumer Systems:** Data Quality Score, Finance
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Gross Margin, Net Margin, Data Quality Score
14. **Known Limitations:** The violation this KPI would detect is already known and named; the KPI to track it does not yet exist.
15. **Status:** Unknown

### Audit Findings

1. **Purpose:** Count and severity of issues found during the Monthly, Quarterly, and Annual audits defined in Data Governance Framework §9.
2. **Business Meaning:** Tracks whether governance is actually being checked, not just written down.
3. **Formula:** UNKNOWN — no scoring or severity scale is defined.
4. **Unit:** Count
5. **Granularity:** Per audit cycle (Monthly / Quarterly / Annual)
6. **Refresh Frequency:** Per the audit cadence itself
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** Data Governance Framework §9 — **explicitly states no audit under this policy has yet been performed.**
10. **Consumer Systems:** Policy Compliance, Reports
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Policy Compliance, Data Quality Score
14. **Known Limitations:** Zero historical data exists — this KPI has never been measured.
15. **Status:** Unknown

### Policy Compliance

1. **Purpose:** Measure adherence to this KPI Framework and the Data Governance Framework's rules.
2. **Business Meaning:** Are Ownership, Classification, and Lifecycle rules actually being followed, not just documented.
3. **Formula:** UNKNOWN
4. **Unit:** UNKNOWN
5. **Granularity:** UNKNOWN
6. **Refresh Frequency:** UNKNOWN
7. **Business Owner:** CEO
8. **Technical Owner:** Unstaffed
9. **Authoritative Source:** No measurement mechanism exists
10. **Consumer Systems:** Audit Policy
11. **Alert Threshold:** UNKNOWN
12. **Success Target:** UNKNOWN
13. **Related KPIs:** Audit Findings
14. **Known Limitations:** Entirely aspirational at this stage — the frameworks it would measure compliance against are themselves still Proposed, not Accepted.
15. **Status:** Unknown

### Baseline Integrity

1. **Purpose:** Confirm the 2026-07-31 (and any future) Baseline Snapshot remains unmodified since it was recorded.
2. **Business Meaning:** The one governance guarantee already made concrete and checkable today.
3. **Formula:** **Defined** — checksum comparison against the value recorded in the baseline's own `CHECKSUM.md` (named as part of the baseline's Enterprise Artifacts in MANIFEST.md).
4. **Unit:** Match / Mismatch (boolean), not a numeric metric
5. **Granularity:** Baseline (per snapshot)
6. **Refresh Frequency:** UNKNOWN — no defined re-verification cadence exists yet, though the Data Governance Framework's Monthly/Quarterly audits (§9) are the natural place for it
7. **Business Owner:** CEO
8. **Technical Owner:** CEO
9. **Authoritative Source:** `enterprise-data/baseline/2026/2026-07-31-reset/CHECKSUM.md`, referenced by MANIFEST.md
10. **Consumer Systems:** Opening Equity, Audit Policy
11. **Alert Threshold:** Any checksum mismatch — not a graduated threshold, a binary integrity failure
12. **Success Target:** 100% match, always — this is the one KPI in this framework where the target is definitionally fixed, not an operational choice
13. **Related KPIs:** Opening Equity, Audit Findings
14. **Known Limitations:** The mechanism exists and is sound; whether it is actually re-checked on any cadence today is UNKNOWN.
15. **Status:** **Defined**

---

# Enterprise KPI Maturity Model

Every KPI above sits somewhere on this scale. Most sit at Level 1 or below — not measured at all yet, in a strict sense, since "measured manually" implies at least an informal manual practice, and several KPIs in this document have no practice of any kind behind them today.

**Level 1 — Measured manually**
A person computes the figure by hand, on demand, from whatever source is available. This describes Net Profit and Net Margin today (ADR-0003 §2: "net margin (manual analysis)").

**Level 2 — Measured by Apps Script**
The figure is computed by the Buku Toko Apps Script application from data it already holds or caches. This describes Gross Margin today, via the `Ringkasan` cache (ADR-0003 §1–2).

**Level 3 — Measured automatically from Canonical Data**
The figure is computed from the Canonical Data Layer proposed in ADR-0003, independent of any single source system's native format. No KPI in this framework has reached this level yet, because the Canonical Data Layer itself does not yet exist in operation.

**Level 4 — Monitored continuously**
The figure is not just computed but actively watched, with alerting when it crosses a defined threshold. No KPI in this framework has a defined Alert Threshold today, so none have reached this level.

**Level 5 — Predictive / AI-assisted**
The figure is not only monitored but used by an AI agent to forecast, flag anomalies, or propose action — always subject to the Human Approval Gate (ADR-0004 Principle 8) before anything consequential happens. No KPI in this framework has reached this level.

**Where this framework actually stands today:** Opening Equity and Baseline Integrity are the only two KPIs with a fully documented formula and source — and even they sit closer to Level 1 (a one-time, manually-verified calculation) than to Level 2 or above. Every other KPI in this document is Proposed or Unknown. This is not a deficiency in this document; it is the accurate starting line the rest of Enterprise OS's KPI maturity has to be built up from.
