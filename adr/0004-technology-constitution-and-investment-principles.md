# ADR-0004 — Technology Constitution & Investment Principles

| | |
| --- | --- |
| **Status** | Proposed — pending CEO decision |
| **Date** | 31 July 2026 |
| **Proposed by** | Claude (agent), on behalf of no one — CEO decides |
| **Relates to** | [ADR-0001](0001-github-authoritative-notion-mirror.md), [ADR-0002](0002-dana-ibu-adalah-modal-bukan-hutang.md), [ADR-0003](0003-canonical-data-platform-loka-pos.md) — this ADR generalizes lessons those three already paid for into standing principles, so future technology decisions don't have to re-learn them one system at a time. |

---

## Purpose

SMJ Enterprise OS is no longer one store with one spreadsheet. It's TSS, Central Kitchen, SBGA, and future brands, running across Loka, Buku Toko, GitHub, Notion, and n8n — with more systems coming. Every prior ADR in this series exists because a technology decision was made ad hoc and cost something later: Notion-as-permanent-repo silently allowed contradictory memos (ADR-0001); five systems held overlapping, unranked truth (ADR-0003); a mobile POS app's backup format turned out to rest on a database whose vendor deprecated it in 2025 with no one having asked in advance (research/loka-ingestion-poc.md).

This ADR is a **constitution, not a project plan.** It does not decide anything about a specific tool today. It sets the standing rules that future tool, vendor, and architecture decisions must be checked against — so each new choice doesn't require relearning the same lessons from scratch.

---

## 1. Business First

Technology exists to serve TSS, CK, SBGA, and the brands after them — never the reverse. A technically elegant solution that doesn't move margin, cash safety, or customer capture is not a priority, no matter how satisfying it is to build. Every technology proposal should be traceable to a business outcome already named in the roadmap or backlog — not to "this is best practice" alone.

## 2. ROI First

No technology investment — CEO time or money — gets made without an explicit, stated payback case. Adendum 1's cash/CK/funnel time budget (~9 hours one-time, ~15 minutes/day after) is the model: name the one-time cost, name the recurring cost, name what it buys back. If a proposal can't state its return, it isn't ready to propose, regardless of how cheap or "obviously good" it looks.

## 3. Canonical Data

There is exactly one authoritative source per domain, and every other system is a derived, disposable, or read-only view of it — never a second source of truth. This is ADR-0003's principle, generalized: it applies to every future system, not only Loka. Before any new tool is adopted, it must be clear which domain it's authoritative for, if any — a tool that isn't authoritative for anything is a consumer, and must behave like one.

## 4. Laptop Independence

No business-critical process may depend on a specific machine, operating system, or person's device being powered on. This principle exists because it already failed once: Windows Task Scheduler on a specific machine is the current single point of failure between Loka and Apps Script, and it fails silently — nobody downstream knows it didn't run. Any new automation is evaluated on whether it survives the CEO's laptop being off, asleep, or replaced.

## 5. Managed Services Before Self-Hosting

Prefer managed, pay-per-use cloud services over self-hosted infrastructure, unless there is a specific, stated reason self-hosting is required. This organization has no dedicated engineering or ops function — a self-hosted VPS that needs patching and monitoring is a standing liability nobody is staffed to carry. This is not a permanent ban on self-hosting; it's a default that must be argued away, not the other way around.

## 6. Open Standards

Prefer open formats, open protocols, and open-source tooling with more than one implementation over proprietary, single-vendor formats — especially for anything that stores business data long-term. This principle exists because of a real near-miss: Loka's `.realm` backups depend on a database whose commercial vendor deprecated official support in 2024/2025, discovered only when this org went looking for a way to read its own backups. Proprietary lock-in is not disqualifying on its own, but it must be a known, accepted cost — not a surprise found during a migration.

## 7. Vendor Exit Strategy

Before adopting any third-party system that will hold business data or run a business process, there must be a known, written answer to "how do we get our data out, and how do we replace this, if we had to leave tomorrow?" No exit strategy is a reason to delay adoption, not a reason to skip the question. This applies retroactively as information, not as an action: existing dependencies (Loka, Notion, n8n) should have their exit paths documented over time, without this ADR mandating that work be done now.

## 8. AI Workforce Model

AI agents (Claude, or any future equivalent) are a workforce multiplier for a small human team, not a replacement for its judgment on anything consequential. The standing division of labor already established in `CLAUDE.md` — the agent audits, drafts, and proposes; the CEO decides, and alone approves anything customer-facing or price-related — is a permanent feature of this org's technology model, not a temporary limitation to be automated away. Every AI-assisted process must have a human sign-off point before anything with real-world consequence (money, customer communication, published content) happens.

## 9. Technology Investment Roadmap

Technology investments are sequenced behind business priority, not built in parallel with it by default. The established ordering — operational integrity (Fokus 1) before funnel scale (Fokus 2) before new brand expansion — governs technology work the same way it governs everything else in the roadmap. A platform investment (like the Canonical Data Platform in ADR-0003) is sequenced, not raced, against whatever operational fire is currently active; Adendum 1's rule — one-time work goes first and in sequence, only recurring work runs in parallel — applies to technology projects exactly as it applies to cash and CK work.

## 10. Decision Criteria Before Adopting New Software

Before any new software, service, or vendor is adopted — trial, free tier, or paid — it is checked against this list:

1. **Business First** — what business outcome does this serve, named specifically?
2. **ROI First** — what is the one-time cost, the recurring cost, and the return?
3. **Canonical Data** — is this authoritative for a domain, or a consumer of one?
4. **Laptop Independence** — does this survive a specific machine or person being unavailable?
5. **Managed vs. self-hosted** — if self-hosted, why was managed rejected?
6. **Open Standards** — can the data be exported in a non-proprietary format?
7. **Vendor Exit** — what does leaving this tool look like, in writing?

A proposal that can't answer these isn't ready for a decision — it's ready for more research. Passing this checklist does not itself constitute approval: per the AI Workforce Model, only the CEO approves adoption.

---

## How This ADR Is Used

Future ADRs, technology proposals, or backlog items that touch tooling should be checked against the ten principles above, the same way ADR-0001 and ADR-0002 already established that reversing a decision requires a new ADR that names the one it changes. This ADR does not override ADR-0001, ADR-0002, or ADR-0003 — it sits above them as the reasoning those three already followed, made explicit and durable.

**Status:** Proposed, not accepted. Per the pattern already set by ADR-0001 through ADR-0003 — the agent proposes, the CEO decides. This ADR is not binding until the CEO confirms it.
