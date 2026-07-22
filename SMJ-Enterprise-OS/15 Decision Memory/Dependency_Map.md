# Dependency Map

Folder-to-folder dependencies across the enterprise repository. An arrow
means "depends on / draws facts from."

```
01 Holding
   └──> 02 Business Units (holding oversees units)

02 Business Units
   ├──> 03 Brand (SBGA unit's brand identity)
   ├──> 04 Products (both units' product knowledge)
   ├──> 11 Data Platform (Toko Sembako Sejahtera's real data)
   └──> 08 Marketing, 09 Sales (SBGA unit's built systems)

03 Brand ──> 08 Marketing (Prompt Library enforces Brand Voice programmatically)

04 Products ──> 05 Customers (product-to-customer matching logic)
04 Products ──> 11 Data Platform (real product/stock/margin data)

05 Customers ──> 09 Sales (CRM tracks these customer segments)
05 Customers ──> 11 Data Platform (real customer transaction data)

06 Suppliers ──> 11 Data Platform (real supplier spend/payment data)

07 Operations ──> 12 AI Workforce (who executes the daily/weekly/monthly rhythm)
07 Operations ──> 11 Data Platform (real shift/cash reconciliation data)

08 Marketing ──> 09 Sales (campaigns feed leads into the sales pipeline)
08 Marketing ──> 12 AI Workforce (which AI role executes which marketing step)

09 Sales ──> 13 Technology (why Notion, not GitHub, hosts the live CRM)

10 Finance ──> 11 Data Platform (all real financial numbers)
10 Finance ──> 01 Holding (would roll up to holding-level view — not yet built)

11 Data Platform ──> 04 Products, 05 Customers, 06 Suppliers, 07 Operations, 10 Finance
   (this is the single most-depended-upon folder in the repository, since
   it is the only source of REAL, validated transactional data anywhere
   in the enterprise)

12 AI Workforce ──> 13 Technology (which tools each AI role operates within)

13 Technology ──> everything (the substrate every other folder's live systems run on)

14 Automation ──> 12 AI Workforce, 13 Technology (n8n/Claude Code roles and their tech dependencies)

15 Decision Memory <── everything (every folder's gaps/decisions feed back here)

16 Roadmap <── 00 Executive, 08 Marketing, 09 Sales, 11 Data Platform, 15 Decision Memory
   (the roadmap synthesizes the honest current-state assessment across
   all of these into prioritized next steps)

17 Archive ──> (no forward dependencies; things point TO archive, not FROM it)
```

## Critical Path Insight

`11 Data Platform` is the only folder in the repository containing fully
validated, real (not aspirational) business data. Every other folder's
"real-world grounding" ultimately traces back to it. This is why the
90-Day Roadmap (`16 Roadmap/90_Day_Roadmap.md`) treats connecting SBGA's
built marketing/CRM systems to real operations — the same kind of grounding
Toko Sembako Sejahtera already has via the Data Platform — as the top
priority.
