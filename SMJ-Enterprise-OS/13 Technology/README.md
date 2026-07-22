# 13 Technology

## Technology Stack

| Layer | Tool | Role | Status |
|---|---|---|---|
| Documentation & Code | **GitHub** (this repository) | Single Source of Truth for all documentation, schemas, scripts | 🟡 Built locally with real git history — **not yet pushed to an actual GitHub remote** (see Governance below) |
| File Storage | **Google Drive** | Raw file storage only (binary assets, original exports) — no longer the documentation source of truth | 🟢 Live, being demoted to storage-only per this refactor |
| Live Execution Scheduling | **Google Calendar** | 16 recurring event series (daily/weekly/monthly operating rhythm) | 🟢 Live |
| Live Operational Database | **Notion** | CRM & Revenue System (7 databases) + Executive Command Center (10 databases) | 🟢 Live |
| Local Development | **VS Code** | ⚠️ Referenced in instructions, not yet actively used in any documented workflow |
| Version Control | **Git** | Used for this repository | 🟢 Initialized |
| Language / Data Engineering | **Python 3.13** | Data Platform resolver, importer, analytics | 🟢 Live (see `11 Data Platform/`) |
| Database Engine | **SQLite** | Toko Sembako Sejahtera's operational database | 🟢 Live, validated |
| Source Data Format | **Realm** (mobile database) → **JSON** (export) | Loka POS's native storage → export format | 🟢 Understood and decoded (custom resolver built) |
| POS System | **Loka Kasir** | Toko Sembako Sejahtera's point-of-sale system | 🟢 Live, real data |
| Future | **DuckDB** | Analytics warehouse layer | ⚪ Not started |
| Future (optional) | **Power BI** | Dashboard/BI layer | ⚪ Not started, optional |
| Future | **API integrations** | ⚠️ Unspecified — no confirmed integration targets beyond n8n/Claude Code (see `14 Automation/`) |

## GitHub Governance

**GitHub is the permanent Single Source of Truth for documentation and
code.** This means:
- Every document that previously lived only in Google Drive as the
  "official" copy is being migrated into this repository (see
  `15 Decision Memory/Migration_Report.md` for what moved where)
- Google Drive becomes file storage only — for binary assets, original
  data exports (e.g. `raw/loka_export.json`), and anything that genuinely
  cannot be represented as a text file in git
- Notion remains the live operational database (CRM, Executive Command
  Center) because those are genuinely relational, queryable systems — they
  are *referenced* from this repository (see `09 Sales/README.md`), not
  duplicated into it, since duplicating live database content into static
  git files would go stale immediately

### ⚠️ Important Honest Limitation

This repository has been built and version-controlled locally (`git init`,
real commit history) but **has not been pushed to an actual remote GitHub
repository**, because doing so requires the CEO's own GitHub account/
credentials, which are not available to Claude in this session. **This is
the one manual step required to complete the "GitHub as Single Source of
Truth" mandate.** See `15 Decision Memory/Migration_Report.md` for exact
next steps.

### Version Control

- **Branch strategy:** `main` only, for now (per instruction — no
  branching model needed at this stage of the enterprise)
- **Commit convention:** ⚠️ Not yet formalized — recommend a simple
  convention (e.g. `[folder]: change description`) be adopted once real
  multi-person contribution begins
- **Contribution workflow:** Currently single-contributor (CEO + Claude).
  ⚠️ No pull-request/review process is needed yet since there is no second
  human contributor — revisit if/when staff or ATHENA-initiated changes
  need a review gate

## Cross-References

- `12 AI Workforce/README.md` — which AI role operates which tool
- `14 Automation/README.md` — future n8n/Claude Code integrations
- `15 Decision Memory/Migration_Report.md` — the GitHub push step
