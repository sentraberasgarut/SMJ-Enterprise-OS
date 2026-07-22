# Knowledge Gap Report

Every genuinely unknown item surfaced during this refactor, prioritized.
Nothing below was guessed at in the main documentation — each gap is
marked ⚠️ at its source location too.

---

## Priority 1 — Blocking Real Trust / Immediate Business Risk

1. **SBGA Brand Voice was never validated against real founder
   communication.** It was built entirely by inference from documented
   philosophy. Highest-leverage fix available — everything downstream
   (all AI-generated content) inherits this tone. *(Location: `03 Brand/`)*
2. **Zero SBGA marketing content has ever been published; zero campaigns
   have run.** A fully built system with no real-world validation.
   *(Location: `08 Marketing/`, `00 Executive/`)*
3. **Toko Sembako Sejahtera — the actual current cash engine — has no
   marketing, CRM, or brand system at all**, despite having real
   transaction data. *(Location: `02 Business Units/Toko Sembako
   Sejahtera/`)*

## Priority 2 — Structural / Data Cleanup

4. **Duplicate `SBGA_Operating_System_v1` source document** — never
   resolved which copy is canonical (pre-dates this refactor).
5. **75 FK violations in the Toko Sembako Sejahtera data** (71 minor
   unit-group gaps, 4 isolated orphans) — explained but not corrected at
   the source (Loka Kasir POS).
6. **Two known CRM view filter bugs** in Notion ("New Leads," "Active
   Campaigns") — flagged, not fixed.
7. **Employee table structure is unverified** — 0 records in the Loka
   export, so its schema shape is an educated guess.

## Priority 3 — Business/Strategic Decisions Not Yet Made

8. **Sentra Telur Keluarga has no founding brief.** No origin story,
   philosophy, target customer, or initial scope — just a name. The
   largest single knowledge gap in the enterprise.
9. **No holding-company-level governance structure** is documented beyond
   "the CEO decides." No board, no formal capital-allocation process
   beyond the SBGA founding anecdote.
10. **No formal Hiring Philosophy** exists anywhere in prior documentation.
11. **No confirmed posting cadence** for SBGA marketing — flagged as open
    since the very first Content Factory README, still unresolved.
12. **No real Purchase/transaction database** in the Notion CRM — revenue
    tracking there is estimate-based, not a real ledger.
13. **Referral/loyalty incentive structure** for SBGA — mentioned in the
    Offer Framework, never defined.
14. **No confirmed financial/legal specifics** for CV Sederhana Maju Jaya
    (registration details, ownership structure) beyond its name and role.

## Priority 4 — Newly Surfaced By This Refactor

15. **Gemini's role ("Google Workspace Specialist") has no documented
    mission, inputs, outputs, or workflow** — it's named in this refactor's
    instructions but was never previously defined. *(Location:
    `12 AI Workforce/`)*
16. **ATHENA's (ChatGPT's) strategic conversations are not captured into
    any durable repository record** — they happen outside this
    repository/Notion/Drive and their outcomes only reach the rest of the
    enterprise if someone manually re-documents them. *(Location:
    `12 AI Workforce/`)*
17. **No consolidated, holding-company-level financial view** — each
    business unit's finances (where they exist at all) are siloed.
    *(Location: `10 Finance/`)*
18. **GitHub push step is unfinished** — this repository is not yet on an
    actual GitHub remote; requires the CEO's own credentials.
    *(Location: `13 Technology/`)*

## What This List Is For

Per the Continuous Improvement principle established in prior SBGA
documentation: every proposed system change should cite real evidence, not
speculation. This list is that evidence base for what still needs real
input — from the CEO, from real operations, or from real customer contact —
before the enterprise's documentation can claim to be fully accurate rather
than "structurally complete but partially unvalidated."
