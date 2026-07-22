# 14 Automation

## Automation Roadmap (status as of this refactor)

| Workflow | Status | Priority | Notes |
|---|---|---|---|
| Google Drive (Knowledge/File Storage) | 🟢 Live | Critical | Being demoted to storage-only, see `13 Technology/README.md` |
| Google Calendar (Execution) | 🟢 Live | Critical | 16 recurring event series |
| Notion (Live Operational DB) | 🟢 Live | Critical | CRM + Executive Command Center |
| GitHub (this repository) | 🟡 Built, not pushed | Critical | See `13 Technology/README.md` |
| Git / GitHub tooling | 🟢 Initialized locally | Critical | Real commit history exists |
| Docker | ⚪ Not started | Low | Not yet needed |
| Claude Code | ⚪ Not started | Low | Future technical build agent for custom integrations (CRM/POS/inventory connections) |
| n8n | ⚪ Not started | Medium | Cross-posting, scheduling automation, analytics collection — blocked on a stable content pipeline first |
| Marketing Automation | 🟡 Partially live | High | Prompt Library + Campaign System exist; scheduling/publishing automation still fully manual |
| CRM | 🟡 Documentation-only in Drive, live in Notion | Medium | Tool decision (Notion vs. dedicated CRM platform) still open |
| POS | 🟢 Live (Loka Kasir, Toko Sembako Sejahtera only) | — | Not integrated with any other system yet |
| Inventory | ⚪ Not scoped | Low | — |
| Finance | ⚪ Not started | Medium | Real POS financial data exists but isn't connected to any finance workflow/tool |
| Analytics | 🟡 Structure live, awaiting real use | High | 10 analytics SQL files built and tested against real data; DuckDB/dashboard layer not started |

## Priority Sequencing Logic

Automation should follow real usage, not precede it. Per this refactor's
honest assessment (`00 Executive/README.md`), the biggest gap isn't missing
automation — it's that the *manual* processes (publishing SBGA content,
running a real campaign) haven't happened yet either. Building n8n
automation for a marketing pipeline that has never published anything would
be automating a process that hasn't been validated. See
`16 Roadmap/90_Day_Roadmap.md`.

## Cross-References

- `12 AI Workforce/README.md` — n8n and Claude Code role definitions
- `13 Technology/README.md`
- `16 Roadmap/90_Day_Roadmap.md`
