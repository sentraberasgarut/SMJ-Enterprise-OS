# 90-Day Priority Roadmap

Grounded entirely in the honest current-state assessment in
`00 Executive/README.md` — this is not an aspirational list, it's the
shortest path from "systems built" to "systems actually creating value."

---

## Days 1-30 — Activate What's Already Built

**Priority 1: Publish SBGA's Week 1 content and run the first real
campaign.** Everything needed already exists (`08 Marketing/`) — the
content, the prompts, the campaign plan, the recommended first campaign
("What's Your Rice Actually Doing?"). The only missing ingredient is CEO
approval and actually posting. This is the single highest-leverage action
available in the entire enterprise right now, because it converts a fully
built but unvalidated system into real data.

**Priority 2: Validate SBGA Brand Voice against real founder
communication.** Fast — send/react to a handful of real customer messages.
Fixes the highest-priority knowledge gap (`15 Decision Memory/
Knowledge_Gap_Report.md` #1) before more content gets generated on an
unvalidated tone.

**Priority 3: Push this repository to a real GitHub remote.** The one
manual step Claude cannot do — requires 10 minutes of the CEO's time and
GitHub credentials.

**Priority 4: Resolve the duplicate `SBGA_Operating_System_v1` document**
and the 2 known Notion CRM view bugs. Low-effort, removes ongoing
confusion.

## Days 31-60 — Connect the Two Real Assets

**Priority 5: Apply SBGA's built marketing/CRM tooling to Toko Sembako
Sejahtera**, the unit that actually has real customers and real revenue.
Concretely: use the Prompt Library and Content framework to produce
Sembako-store-specific content (not rice-diagnostic content — different
business model, straightforward retail); stand up a lightweight version of
the CRM's Lead/Customer tracking for Sembako's 8 known + future customers.

**Priority 6: Close the remaining data-quality gaps in the Toko Sembako
Sejahtera data** — investigate the 4 isolated orphan rows and the
Employee-table ambiguity with whoever manages the Loka Kasir POS day to
day.

**Priority 7: Run the first real Weekly Retrospective / Learning Log
cycle** on SBGA's published content (from Priority 1), and use it to
correct the AI Operating Manual's daily/weekly/monthly rhythm based on
what actually works, not just what was designed.

## Days 61-90 — Build the Enterprise Layer Properly

**Priority 8: Define Sentra Telur Keluarga's founding brief**, if the CEO
is ready — origin story, philosophy, target customer, initial scope,
mirroring what exists for SBGA. Do not build any systems for this unit
before this brief exists (repeats the exact risk already visible in SBGA:
systems built ahead of validated demand).

**Priority 9: Formalize holding-company-level governance** — even a
lightweight version: how capital allocation decisions between business
units get made, what the CEO's decision authority looks like at the
holding level vs. unit level.

**Priority 10: Begin the DuckDB/analytics-warehouse phase** for the Toko
Sembako Sejahtera Data Platform, per its own documented roadmap
(`11 Data Platform/README.md`), now that 60 days of real operating
experience (from Priorities 1, 5, 7) will have generated genuinely new
data to analyze.

---

## Explicitly NOT a 90-Day Priority

- Building any systems for Sentra Telur Keluarga before its founding brief exists
- n8n/automation build-out (per `14 Automation/README.md`, automating an
  unvalidated manual process is premature)
- CEO Dashboard / Power BI (explicitly deferred pending the DuckDB phase)
- Defining Gemini's role in detail (not urgent — no active workflow is
  blocked on it)

## How to Use This Roadmap

Each priority above is deliberately sequenced so that later priorities
depend on earlier ones producing real evidence, not just plans. Re-evaluate
this roadmap at day 30 and day 60 against what actually happened — per the
Continuous Improvement principle already established in prior SBGA
documentation, this document should be updated with real results, not
treated as a fixed plan.
