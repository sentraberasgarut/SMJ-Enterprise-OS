# SMJ Enterprise OS

**The single permanent operating system and source of truth for CV Sederhana Maju Jaya and its business units.**

Version 1.0 | Refactored from prior single-business-unit documentation into a multi-business-unit enterprise structure.

---

## Company Architecture

```
CV Sederhana Maju Jaya (Holding Company)
│
├── Toko Sembako Sejahtera   — CURRENT CASH ENGINE (existing, revenue-generating retail store, Garut)
├── Sentra Beras Garut Asli  — GROWTH INITIATIVE (rice distribution, AI-first marketing/CRM build-out)
└── Sentra Telur Keluarga    — FUTURE EXPANSION (not yet launched)
```

**This is a hierarchy change, not a rebrand.** SBGA was previously treated as
"the company" throughout prior documentation. It is now correctly modeled as
one business unit under the CV Sederhana Maju Jaya holding structure,
alongside the store that actually generates today's cash flow (Toko Sembako
Sejahtera) and a not-yet-launched future unit (Sentra Telur Keluarga). See
`01 Holding/README.md` and `02 Business Units/README.md`.

## How To Use This Repository

- **Start here, then go to `00 Executive/`** for the Enterprise Knowledge
  Base index and current operational snapshot.
- Every top-level folder has its own `README.md` explaining its contents,
  status, and cross-references to related folders.
- **GitHub is the Single Source of Truth for documentation and code.**
  Google Drive is file storage only (raw exports, binary assets). Notion is
  the live operational database (CRM, Calendar-linked execution). See
  `13 Technology/README.md` for the full governance model.
- **Nothing here was invented.** Every fact traces to a prior sprint
  document, the Loka POS data platform, or explicit CEO decisions. Where
  something is genuinely unknown, it is marked ⚠️ and listed in
  `15 Decision Memory/Knowledge_Gap_Report.md`.

## Repository Structure

| Folder | Contents |
|---|---|
| `00 Executive/` | Enterprise Knowledge Base index, current snapshot, executive summary |
| `01 Holding/` | CV Sederhana Maju Jaya — holding company profile, governance |
| `02 Business Units/` | Toko Sembako Sejahtera, SBGA, Sentra Telur Keluarga — unit profiles |
| `03 Brand/` | Brand voice, philosophy, visual direction (currently SBGA-specific; holding-level brand TBD) |
| `04 Products/` | Rice Knowledge, Product Catalog, and (from Loka POS data) the real retail product catalogue |
| `05 Customers/` | Customer Persona, segments, and (from Loka POS data) real customer records summary |
| `06 Suppliers/` | Supplier philosophy and (from Loka POS data) real supplier records summary |
| `07 Operations/` | Consultation process, shift/cash operations (from Loka POS data) |
| `08 Marketing/` | Content Factory, Content Assets, Prompt Library, Campaign System |
| `09 Sales/` | Sales Pipeline, CRM structure, funnel |
| `10 Finance/` | Expense tracking, restock/supplier payments, revenue (from Loka POS data) |
| `11 Data Platform/` | The full Loka POS → SQLite data platform (migrated as-is) |
| `12 AI Workforce/` | Every AI role: mission, inputs, outputs, authority, escalation, KPIs |
| `13 Technology/` | Full tech stack, GitHub governance, version control strategy |
| `14 Automation/` | Automation Roadmap (n8n, future integrations) |
| `15 Decision Memory/` | Migration Report, Knowledge Gap Report, Decision Log |
| `16 Roadmap/` | 90-Day Priority Roadmap |
| `17 Archive/` | Deprecated/superseded documents, preserved not deleted |

## Constraints Honored In This Refactor

- No company facts invented
- Every prior document preserved (migrated, modularized, or archived — never deleted)
- Duplicates merged, not multiplied
- Naming normalized across all folders
- SBGA correctly repositioned as a Business Unit, not the holding entity

See `15 Decision Memory/Migration_Report.md` for the full accounting of what moved where and why.
