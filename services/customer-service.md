# Customer Service

| | |
| --- | --- |
| **Status** | Draft — proposed business responsibility, pending CEO acceptance |
| **Grounded in** | Canonical Data Contract §3 (CRM and Sales & Marketing domains), §4 (Customer, Branch, Lead, Content, Campaign entities), §5 (`LeadCreated`, `LeadQualified`, `ConsultationStarted`, `ConsultationClosed` events), §8 (Relationship Model) |

## Responsibilities

- Compute customer-facing business meaning from canonical Customer and Branch data — who the business sells to, and whether a given Customer record is actually a branch recorded as a B2B account.
- Represent the funnel chain the Canonical Data Contract already names (§8): `Lead → Consultation → Customer → Invoice` — "a Lead is not a separate universe of data, it is an earlier stage of the same eventual Customer relationship." Customer Service owns the point where a Lead becomes a Customer; Sales Service owns what happens from Invoice onward.
- Surface the Branch/Customer overlap named as an open item in the Contract (§4, §8): "a Branch plays two different roles today, and this contract does not paper over that."

## Inputs

- **Customer** — any party TSS/CK/SBGA sells to, including branches recorded as B2B accounts (Canonical Contract §4). Authoritative Source: Loka POS `Customer` table, "confirmed real branch-as-customer records."
- **Branch** — a physical fulfillment point (e.g. Sederhana Jaya 1–5) that receives goods and is sometimes also recorded as a Customer. Authoritative Source: Buku Toko (unit definitions). **Overlaps with Customer — a named open item, not yet resolved.**
- **Lead** — a prospective customer signal from a marketing channel. **Explicitly unresolved**: lives in Notion's Lead Database, which ADR-0001 named out of scope pending its own future decision.
- **Content** — a marketing content item. Same unresolved status as Lead, per ADR-0001.
- **Campaign** — a grouped marketing effort spanning multiple Content items. **Assumption in the Contract itself:** named as a future concept; no authoritative source currently exists for it in any system.

## Outputs

- A Customer list, with each record flagged where it is suspected (not confirmed) to actually be a Branch — Customer Service surfaces the ambiguity, it does not resolve it.
- Funnel-stage summaries (Lead → Consultation → Customer), only for the portion of the chain that has a named Authoritative Source today — Lead and Content are explicitly out of that scope pending ADR-0001's deferred decision.
- Customer-side inputs to Finance Service's Receivable computation, where a Customer carries an outstanding balance.

## Business Rules

- **Stateless with respect to truth** (Production Architecture §3.5): Customer Service derives from canonical Customer/Branch/Lead/Content/Campaign data; it does not decide, on its own, that a given Customer record is a Branch — that determination belongs upstream, in the Canonical Layer, once the Contract's own open item is resolved.
- **Human Approval Required — yes, for any customer-facing action** (Canonical Data Contract §6) — this applies without exception to any output of this service that would reach an actual customer, not only to outreach.
- **Open item this service cannot resolve on its own:** the Branch/Customer overlap (Canonical Data Contract §4, §8, "Unknown #6" per `loka-schema-analysis.md` as cited there). Until resolved, Customer Service's Branch-flagging output is a surfaced signal, not an authoritative reclassification.
- **Open item:** Lead, Content, and Campaign have no resolved Authoritative Source today. Customer Service's funnel-stage outputs are limited to what canonical Customer data alone can show (i.e., the point a Lead becomes a real Customer/Invoice) until ADR-0001's deferred Notion operational-database decision is made.

## Consumers

Per Production Architecture §2 and Canonical Data Contract §4: Apps Script (target state), Dashboard, Sales Service (Customer as counterparty to Invoice), Finance Service (Customer as source of Receivables), AI Workforce (subject to Human Approval Gate — always, for anything customer-facing per the Contract's Ownership Matrix), Reporting Service.

## Future APIs

No API is designed here — this section only names anticipated access needs:

- A way for Sales Service to resolve "is this Invoice's Customer actually a Branch" without duplicating Customer Service's own logic.
- A way for Dashboard to show a funnel summary once Lead/Content/Campaign gain a resolved Authoritative Source.
- A way for AI Workforce to draft (never send) customer-facing communication informed by Customer Service data, always routed through the Human Approval Gate before anything reaches an actual customer.
