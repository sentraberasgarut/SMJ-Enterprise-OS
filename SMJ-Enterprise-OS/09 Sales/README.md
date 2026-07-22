# 09 Sales

## SBGA — Notion CRM & Revenue System (Live in Notion, Referenced Here)

**Note on architecture:** The actual CRM is a live Notion workspace, not a
static document — it cannot be meaningfully "moved into GitHub" without
losing its database/relation functionality. This file is the authoritative
*reference* to that live system, per the Technology governance model in
`13 Technology/README.md` (GitHub = docs/code source of truth; Notion =
live operational database).

**7 databases, fully related:**
Lead Database → Consultation Log ↔ Customer Database → Sales Pipeline /
Follow Up System / Customer Insights / Loyalty Tracker — wired into the
pre-existing Executive Command Center (Campaign Tracker, Decision Register).

**Sales Pipeline stages:** Lead → Interested → WhatsApp Conversation →
Consultation → Quotation → Purchase → Repeat Purchase → Advocate.

**Sales Philosophy — Right-Selling, Never Upselling:** SBGA will recommend
a cheaper product if it's the better fit, even over a customer's stated
preference for something pricier.

**Known gaps (carried forward honestly):** No real Purchase/transaction
database exists yet (revenue tracking in the CRM is estimate-based, not a
real ledger). Two CRM view filters ("New Leads," "Active Campaigns") had a
known bug at last check. Zero real leads/customers/consultations have been
entered — the CRM is structurally complete and completely empty.

## Toko Sembako Sejahtera — No CRM

No sales pipeline, lead tracking, or CRM exists for this unit despite it
being the unit with real customers and real transaction history. See
`16 Roadmap/90_Day_Roadmap.md`.

## Cross-References

- `05 Customers/README.md`
- `08 Marketing/README.md` — campaigns feed leads into this pipeline
- `13 Technology/README.md` — why Notion vs. GitHub for this system
