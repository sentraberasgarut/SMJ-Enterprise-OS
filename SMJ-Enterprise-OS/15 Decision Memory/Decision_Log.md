# Decision Log

Consolidated from all prior sprint-level decision logs (SBGA build-out) plus
this refactor's own decisions.

| Date/Sprint | Decision | Why |
|---|---|---|
| SBGA Sprint 1 | Foundation-first — no content until Brand + Knowledge complete | Prevents building marketing on an ungrounded, inconsistent knowledge base |
| SBGA Sprint 2 | `SBGA OS/01 Brand` = single master source of truth; consumption-layer copies never compete | Prevents two competing sources of brand truth |
| SBGA Sprint 2 | Scope expanded from "Content Factory" to full 13-subsystem AMOS | CEO decided the ambition was larger than content alone |
| SBGA Sprint 4 | Shift to Marketing Production Mode; audience narrowed to Household + Reseller | Perfection deprioritized vs. execution; CEO set 12-month audience priority |
| SBGA Sprint (Executive Command Center) | Markdown ECC → Google Sheets attempt → Notion (final) | Sheets hit real tool limitations (no Sheets API access); Notion could actually deliver real databases/relations |
| SBGA Sprint (CRM) | CRM added as an extension of the Notion ERP, never a replacement | CEO explicit mandate: "Never build a contact list. Build a Revenue System." |
| Data Platform Sprint | Full-refresh reload strategy for SQLite import (not incremental) | Appropriate for a file-based snapshot export, not a live feed |
| Data Platform Sprint | FK enforcement deferred to explicit post-load check, not enforced during bulk insert | Avoids false skips from insert-order artifacts; makes real data-quality issues visible instead |
| **This Refactor** | SBGA repositioned from "the company" to "a Business Unit" under CV Sederhana Maju Jaya | CEO's explicit new company architecture instruction |
| **This Refactor** | "SBGA_Data_Platform" renamed to "Toko_Sembako_Sejahtera_Data_Platform" | The underlying data was never SBGA's — confirmed via the `Store` entity itself |
| **This Refactor** | GitHub established as documentation/code Single Source of Truth; Google Drive demoted to file storage only | Explicit CEO governance instruction |
| **This Refactor** | Notion CRM/ECC referenced, not duplicated, into this repository | Live relational databases would go stale if copy-pasted into static git files |
| **This Refactor** | Project Bible split into 18 topical folders instead of remaining one file | Explicit instruction: "DO NOT produce one giant markdown file" |
| **This Refactor** | Repository built locally with real git history; NOT pushed to a GitHub remote | No GitHub credentials available to Claude — flagged as the one required manual step |

## Cross-References

- `15 Decision Memory/Migration_Report.md` — full accounting of this refactor's changes
- Each business-unit and topic folder's README for unit-specific decisions
