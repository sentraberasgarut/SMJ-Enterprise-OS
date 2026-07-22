# 00 Executive

**Purpose:** The entry point for anyone (human or AI) working on SMJ Enterprise OS. Read this folder first.

## Current Reality (Honest Snapshot)

| Business Unit | Role | Status |
|---|---|---|
| **Toko Sembako Sejahtera** | Current cash engine | Live, operating retail store in Garut. Real POS data exists (316 invoices, 44 products, 6 suppliers, 8 registered customers) — see `11 Data Platform/`. |
| **Sentra Beras Garut Asli (SBGA)** | Growth initiative | Full AI-first marketing/knowledge/CRM system built (Content Factory, Prompt Library, Campaign System, Notion CRM). **Zero live campaigns published yet** — Week 1 content exists but awaits CEO approval. |
| **Sentra Telur Keluarga** | Future expansion | Not yet launched. No operational data, no built systems. Name only. |

**The single most important honest fact in this repository:** the majority
of prior AI-system-building work (Content Factory, Prompt Library, Campaign
System, AI Operating Manual, Notion CRM) was built for SBGA, which is
currently the growth initiative, not the current revenue source. The actual
cash-generating business (Toko Sembako Sejahtera) has real transaction data
but none of the marketing/CRM infrastructure built for SBGA has been applied
to it yet. This is flagged, not hidden — see `16 Roadmap/90_Day_Roadmap.md`
for how this gap is addressed.

## Executive Summary

**What CV Sederhana Maju Jaya is:** A holding company based in Garut,
Indonesia, currently operating one revenue-generating retail store (Toko
Sembako Sejahtera) while building out a second business unit (SBGA, rice
distribution with AI-first marketing) and holding a third unit in reserve
(Sentra Telur Keluarga, not yet launched).

**Why this structure exists:** SBGA's own operating philosophy — documented
extensively in `08 Marketing/` and `02 Business Units/SBGA/` — treats rice
distribution as a specialized, knowledge-driven business. That philosophy
and the systems built around it (Content Factory, CRM, Prompt Library) are
unit-level assets, not holding-company assets. The holding company's actual
job is capital allocation and oversight across business units, which is why
this refactor separates "SBGA's operating system" from "the enterprise's
operating system that happens to currently contain mostly SBGA content."

**Current business stage:** Foundation-to-operations transition, at the
business-unit level (SBGA), while the holding-level structure itself is
brand new as of this refactor (v1.0).

**Current priorities (enterprise-wide):**
1. Get SBGA's built systems into real production use (publish Week 1 content, run the first real campaign)
2. Apply lessons/tooling from SBGA's AI-first build-out to Toko Sembako Sejahtera, which has real transaction data but no marketing/CRM system yet
3. Keep Sentra Telur Keluarga as a named placeholder until the holding company is ready to allocate capital/attention to it

## Enterprise Knowledge Base Index

This repository IS the modular Knowledge Base (the former single-file
"Master Project Bible" has been split into the folders below, per the
refactor mandate — no giant single markdown file exists anymore).

| Topic | Location |
|---|---|
| Holding company profile | `01 Holding/README.md` |
| Business unit profiles | `02 Business Units/README.md` (+ per-unit subfolders) |
| Brand philosophy & voice | `03 Brand/README.md` |
| Product knowledge (rice + real retail catalogue) | `04 Products/README.md` |
| Customer knowledge (persona + real records) | `05 Customers/README.md` |
| Supplier knowledge | `06 Suppliers/README.md` |
| Operations (consultation model + real shift/cash data) | `07 Operations/README.md` |
| Marketing system (Content Factory, Prompts, Campaigns) | `08 Marketing/README.md` |
| Sales & CRM | `09 Sales/README.md` |
| Finance (from real POS data) | `10 Finance/README.md` |
| Data Platform (Loka POS → SQLite) | `11 Data Platform/README.md` |
| AI Workforce definitions | `12 AI Workforce/README.md` |
| Technology stack & GitHub governance | `13 Technology/README.md` |
| Automation roadmap | `14 Automation/README.md` |
| Decision memory (migration, gaps, decisions) | `15 Decision Memory/README.md` |
| 90-day roadmap | `16 Roadmap/README.md` |
| Archive | `17 Archive/README.md` |

## Architecture Diagram

```
                    CV SEDERHANA MAJU JAYA (Holding)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
Toko Sembako Sejahtera      SBGA                Sentra Telur Keluarga
(cash engine)         (growth initiative)         (future)
        │                     │                     │
        ▼                     ▼                     ▼
  [Real POS data]      [Full AI-first stack]    [Not started]
  11 Data Platform/    03-10, 12, 14 (unit-level)
        │                     │
        └──────────┬──────────┘
                    ▼
        SHARED ENTERPRISE LAYER
        (applies across all current/future units)
        │
        ├── 12 AI Workforce/    — same AI roles serve all units
        ├── 13 Technology/       — same tech stack serves all units
        ├── 15 Decision Memory/  — enterprise-wide decision log
        └── 16 Roadmap/          — enterprise-wide priorities
```

See `15 Decision Memory/Dependency_Map.md` for the full folder-to-folder dependency graph.
