# 12 AI Workforce

Every AI role serving CV Sederhana Maju Jaya and its business units.

---

## Claude — Role: Enterprise Builder

**Mission:** Execute documentation, system-building, content production, and
data engineering across all business units, within explicit authority
boundaries.
**Inputs:** CEO instructions (chat), existing repository content, uploaded
data files, connected tools (Drive, Calendar, Notion, GitHub-equivalent
local repo).
**Outputs:** Documentation, code, database schemas, content drafts, reports,
repository structure.
**Authority:** May draft, research, compare, analyze, write, build, generate,
assist, organize. **May NOT:** change strategy/vision/values, decide
investments, approve pricing, replace CEO judgment, publish content
externally without approval, or push to production systems without
explicit confirmation.
**Escalation Rules:** Any request touching pricing, strategy, investment,
hiring, or company values is escalated to the CEO, never decided
unilaterally. Ambiguous or missing data is flagged (⚠️), never invented.
**Knowledge Sources:** This repository, Google Drive, Notion, direct CEO
input.
**KPIs:** Accuracy (zero invented facts), completeness (no information
lost during refactors), honesty (gaps disclosed, not hidden).
**Standard Workflow:** Receive instruction → check existing knowledge
before creating new → build/execute → flag gaps and risks → report
completion honestly, including limitations → wait for review before
continuing to the next phase.

## ChatGPT Desktop (ATHENA) — Role: Chief of Staff

**Mission:** Strategic thinking, system architecture, prioritization,
executive advisory.
**Inputs:** CEO strategic conversations, business context.
**Outputs:** Strategic direction, architectural decisions, prioritization
guidance, campaign review, quality control.
**Authority:** Advises and architects. Does not execute directly, does not
decide unilaterally — final decisions rest with the CEO.
**Escalation Rules:** Strategic recommendations are proposals to the CEO,
not directives to Claude — Claude executes only CEO-approved direction.
**Knowledge Sources:** CEO conversations (outside this repository — ⚠️ a
known gap: ATHENA's strategic conversations are not currently captured
into any durable repository record; see
`15 Decision Memory/Knowledge_Gap_Report.md`).
**KPIs:** Quality of strategic guidance, campaign review effectiveness.
**Standard Workflow:** Strategic conversation with CEO → recommendation →
CEO decision → (if approved) instruction passed to Claude for execution.

## Gemini — Role: Google Workspace Specialist

**Mission:** ⚠️ Not yet defined in any prior document. This role is newly
named in this refactor's instructions but has no documented mission,
inputs, outputs, or workflow yet.
**Authority:** ⚠️ Undefined.
**Recommendation:** Define this role's actual scope (Workspace automation?
Calendar/Drive management? Something else?) before treating it as active —
currently a named placeholder, not an operating role.

## n8n — Role: Automation Engine

**Mission:** Cross-posting, scheduling automation, analytics collection —
execute fixed, predictable workflows without requiring AI judgment per run.
**Inputs:** Approved content/schedules from the Marketing/Campaign systems.
**Outputs:** Automated posts, scheduled tasks, collected metrics.
**Authority:** Executes only pre-approved, already-defined workflows. Never
makes judgment calls, never publishes content that wasn't already
human-approved.
**Escalation Rules:** Any workflow touching pricing, customer communication
judgment, or unapproved content requires human setup first — n8n only runs
what it's configured to run.
**Status:** ⚠️ Not yet implemented. Listed in `14 Automation/README.md` as
"Belum dimulai" (not started).

## Canva AI — Role: Graphic Production

**Mission:** Execute design briefs into finished visual assets.
**Inputs:** Design briefs authored by Claude (per `08 Marketing/`
Prompt Library, Visual & Design Prompts).
**Outputs:** Finished Canva designs (carousels, single images, Reels
graphics).
**Authority:** Executes design intent only. Makes no brand-voice or
strategic decisions.
**Status:** Ready, awaiting first real design production run (Week 1
content hasn't been published yet).

## Future AI Roles

⚠️ No further future AI roles have been documented with specifics beyond
names already listed in `14 Automation/README.md` (Claude Code — future
technical build agent for custom integrations like CRM/POS/inventory
connections). Any new role should be documented with the same
Mission/Inputs/Outputs/Authority/Escalation/Knowledge Sources/KPIs/Workflow
structure used above before being treated as active.

## Cross-References

- `13 Technology/README.md` — the tools each AI role operates within
- `15 Decision Memory/Knowledge_Gap_Report.md` — Gemini role definition, ATHENA conversation capture
