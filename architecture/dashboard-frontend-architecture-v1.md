# Dashboard Frontend Architecture v1

| | |
| --- | --- |
| **Status** | Draft — architecture and structure only. No frontend code, framework choice, or implementation exists yet, and none is created by this document. |
| **Date** | 1 August 2026 |
| **Companion document** | [Dashboard Design System v1](../design/dashboard-design-system-v1.md) — defines tone and visual-language principles; this document defines structure and data flow. |
| **Builds on** | [Dashboard Dataset v1 contract](../prototype/loka-canonical-poc/dashboard-contract.md), [dashboard-schema.json](../prototype/loka-canonical-poc/dashboard-schema.json), [Production Architecture v1](production-architecture-v1.md) §3.7 (Dashboard component), [dashboard-v2-implementation-plan.md](../implementation/dashboard-v2-implementation-plan.md) §6 (Error Handling — reused directly, not reinvented) |

---

# 1. Purpose

Per the Dashboard Dataset v1 contract's own opening line: **"This is the only interface any future presentation layer (PWA, Mobile, Desktop, TV Dashboard) should consume."** This document defines the structural shape a frontend built against that one contract should have — screens, navigation, states — without choosing a framework, writing a line of code, or deciding a single pixel.

Everything below is a consumer of `dashboard-dataset.json`, shaped per `dashboard-schema.json`. No section of this architecture reads Realm, the Connector, or a Business Service directly — that boundary is already enforced one layer down (`src/dataset/*.js`, structurally verified by `tests/dataset.test.js`) and this document does not weaken it.

---

# 2. Application Structure

Three structural layers, matching the shape the Dashboard Dataset itself already implies:

1. **Shell** — the persistent frame: current business unit (today: only Toko Sembako Sejahtera), current role context, system health indicator, last-refresh timestamp. Present on every screen.
2. **Navigation** — routes between screens (Section 3).
3. **Screens** — the actual content surfaces (Section 4), each consuming one or more sections of the Dashboard Dataset directly, never recomputing anything the dataset already provides.

No screen or component in this architecture computes a business figure. Every figure a screen displays already exists, verbatim, in the Dashboard Dataset — a screen's only job is to select which part of that dataset to show and how.

---

# 3. Navigation Hierarchy

```
Business Unit (today: Toko Sembako Sejahtera only)
  └── Dashboard Home (11 cards + system health)
        ├── Card Detail (one card's full audit + lineage)
        ├── Business Summary (dashboard-summary.json's headline view)
        ├── System Health (systemHealth section, per-stage status)
        └── Warnings & Issues (warnings, blockedReasons, unknownReasons, together)
```

Business Unit selection is structurally present but, per `src/dataset/businessUnits.js`, has exactly one real option today — the navigation must not visually imply the other four (Central Kitchen, Sederhana Jaya 1, Sederhana Jaya 4, Warung Makan Padang) are equally available; they are prepared, not active.

---

# 4. Screen Hierarchy

| Screen | Consumes (from the real Dashboard Dataset) | Purpose |
| --- | --- | --- |
| Dashboard Home | `dashboardCards`, `systemHealth`, `lastRefresh`, `confidence` | The default entry point — the 11 cards, at a glance, with the low-cognitive-load rule from the Design System applied. |
| Card Detail | One entry from `dashboardCards`, its full `audit` block (`sourceEntity`, `businessService`, `reportingModule`, `lineage`) | Answers "where did this number come from" — the concrete home for the traceability principle in the Design System. |
| Business Summary | `businessSummary` (the Reporting Service's own `dashboard-summary.json`, embedded verbatim) | A condensed, headline-only view — for a quick check rather than a full review. |
| System Health | `systemHealth`, `dataLineage` | For anyone who needs to know whether today's numbers can be trusted at the pipeline level, not just the card level — the Connector/Canonical/Reporting/Validation per-stage status already exists for exactly this. |
| Warnings & Issues | `warnings`, `blockedReasons`, `unknownReasons` | A single place that surfaces everything the system is honest about not knowing or not being sure of — deliberately not hidden inside individual cards only. |

No screen beyond these five is specified. Any additional screen a future implementation might want (e.g. a settings screen, an approval-action screen) is out of scope for this architecture until the underlying data or mechanism it would consume actually exists.

---

# 5. Role-Based Dashboard Concept

`src/dataset/roles.js` already prepares seven roles as schema. This architecture's concept, not yet an implementation:

- A future frontend's Shell (Section 2) reads the current user's role and uses `visibilityScope` to decide which parts of the Navigation and Screen Hierarchy above are shown.
- **Today, this can only be done honestly for two roles.** CEO (`all-business-units,all-cards`) and Owner/Ibu (`central-kitchen,finance-cash-cosign`) have a grounded, non-`UNKNOWN` scope. The other five — including the three now-named real people, Ayu (Cashier), Mas War (Driver), and Teh Nurul (Central Kitchen Manager) — have `visibilityScope: "UNKNOWN"`. This architecture is **ready** for role-based filtering the moment those scopes are defined; it does not invent them now.
- **No authentication exists or is designed here.** Role context, wherever it comes from in a future implementation, is a display-scoping concern only in this architecture — never a security boundary. Per the Design System's Forms principle, anything actually consequential still routes through the Human Approval Gate regardless of which role is viewing it.

---

# 6. Future Module Expansion

Per Production Architecture §4's Multi-Brand Design, onboarding a new business unit requires only naming its Authoritative Source and Business Owner — "no new pipeline is built per brand." This frontend architecture mirrors that principle at the presentation layer: **no new screen type is required per business unit.** The same five screens in Section 4 are designed to serve any business unit in `src/dataset/businessUnits.js` once it is `dataConnected: true` — Central Kitchen, Sederhana Jaya 1, Sederhana Jaya 4, Warung Makan Padang, and any future business, in that same order of readiness.

A future module (e.g. a dedicated Central Kitchen operations view, relevant to Teh Nurul's role specifically) is not precluded by this architecture, but is explicitly not specified here — it would be new screens added to Section 4's table once real data and a real role scope exist to justify them, not designed speculatively now.

---

# 7. Offline Behavior

Grounded in ADR-0004 Principle 4 (Laptop Independence: "No business-critical process may depend on a specific machine... being powered on") and Production Architecture §8's Availability NFR. Principles only — no implementation, no caching technology, no sync protocol chosen:

- The Dashboard Dataset is a single, self-contained snapshot (`dashboard-dataset.json`) with its own `generatedAt` and `freshness` fields already built in — a frontend can display the *last successfully loaded* dataset while offline, as long as it is honest about its age, using exactly the same `dataFreshness`/`lastRefresh` fields already present.
- Per the Design System's Calm and Trustworthy principles, an offline or stale state must never be hidden or silently masked as current — it is a visible state (Section 8), not a degraded-but-unlabeled one.
- No action that would require the Human Approval Gate (Section 5) should be available while offline, since there is no path to a real approval without connectivity.

---

# 8. State Handling

This section reuses, rather than reinvents, the five states already defined in `implementation/dashboard-v2-implementation-plan.md` §6 — each mapped here to the concrete, real Dashboard Dataset field a frontend would actually read.

| State | Dashboard Dataset field(s) | Required behavior (already specified; not new here) |
| --- | --- | --- |
| **Missing / Unknown data** | `card.value === "UNKNOWN"`, `unknownReasons` | Show an explicit "Not yet available" state with the matching `unknownReasons` entry's `reason` — never blank, zero, or omitted. |
| **Stale data** | `card.dataFreshness`, top-level `freshness` | Show the figure with its `latestDataDate`/`ageInDays` explicitly — never presented as "today" without that qualifier. |
| **Conflicted data** | Not yet a distinct field in the current schema — see Architectural Conflicts below | Both known values shown side by side with their sources, per the Design System's Trustworthy principle — never silently resolved to one value. |
| **Approval Pending** | `card.approvalStatus` (currently always `"not-tracked"`), top-level `approvalStatus.mechanism: "not-yet-implemented"` | Show the last known value with a visible "not tracked" indicator today; once a real approval mechanism exists, show the last *approved* value with a distinct "pending" indicator, never an unapproved value presented as live. |
| **Blocked** | `card.status === "blocked"`, `blockedReasons` | Show the matching `blockedReasons` entry's `reason` directly — e.g. Net Profit's real, current reason ("Gross Profit minus Expenses is NOT a confirmed, adopted formula..."). |

Two additional states, not in that source document but necessary at the frontend layer specifically:

- **Loading** — the interval between a refresh request and a new Dashboard Dataset arriving. Per the Design System's Fast principle, this must never block the previously-loaded dataset from remaining visible and clearly labeled as "still loading the latest" rather than blanking the screen.
- **Empty** — a screen with a real dataset but nothing to show at all (e.g. Warnings & Issues when `warnings`, `blockedReasons`, and `unknownReasons` are all empty) — a positive, calm confirmation ("no issues right now"), not an unstyled blank space.

**Error state** (the pipeline itself failing, as distinct from a card being `UNKNOWN`) maps to `systemHealth`'s per-stage `unhealthy` / `unavailable` values (`src/dataset/health.js`) — shown at the Shell level (Section 2), since a pipeline-level failure is not any one card's problem.

---

# 9. Future Business Expansion

The same five business units named in the Design Principles section — SMJ Toko Sembako, Central Kitchen, Sederhana Jaya 1, Sederhana Jaya 4, Warung Makan Padang, and any future business — are the exact five already scaffolded in `src/dataset/businessUnits.js`. This architecture makes no unit-specific design decision beyond what Section 6 already states: the same screens, same states, same role concept apply to each, once each is actually connected. Nothing here is unit-specific.

---

# 10. Readiness Assessment

| Dimension | Status | Basis |
| --- | --- | --- |
| Data contract | **Ready** | `dashboard-dataset.json` / `dashboard-schema.json` are real, tested, and already produced from real backup data. |
| Screen structure | **Ready** | Every screen in Section 4 maps to a real, already-existing dataset section — none is speculative. |
| Role-based filtering | **Partially ready** | Concept and mechanism are ready; only 2 of 7 roles have a real, usable `visibilityScope` today. |
| Multi-business-unit support | **Partially ready** | Structurally ready (Section 6); only 1 of 5 units is actually `dataConnected`. |
| Offline behavior | **Conceptually ready, not implementable yet** | Principles are grounded in ADR-0004 Principle 4; no caching/sync mechanism is chosen, and none should be at this stage. |
| Approval-pending state | **Conceptually ready, not real yet** | The state and its display rule are fully specified; the underlying approval mechanism itself does not exist anywhere in the pipeline yet (Business Rules Catalog GOV-004, AI-005). |

---

# 11. Assumptions, Unknowns, and Architectural Conflicts

**Current repository evidence used directly:** the real Dashboard Dataset v1 schema and contract; the real 11 cards and their real status/confidence vocabulary; the real role and business-unit schema (`src/dataset/roles.js`, `businessUnits.js`); the five real error-handling states already specified in `dashboard-v2-implementation-plan.md` §6; ADR-0004 Principle 4 (Laptop Independence); Production Architecture §4 (Multi-Brand Design) and §3.7 (Dashboard component definition); Business Rules Catalog GOV-004/AI-005 (no approval-tracking mechanism exists yet).

**Future recommendations (this document's own proposals, not pre-existing repository facts):** the specific Screen Hierarchy in Section 4, the Application Structure's three-layer shape in Section 2, and the Navigation Hierarchy in Section 3 are all new structural proposals made for this sprint — grounded in the real data contract, but not themselves previously documented anywhere.

**Architectural conflict, stated plainly:** the Dashboard Dataset v1 schema, as it exists today, **has no dedicated field for "Conflicted data"** — the third state named in this sprint's own instructions. `dashboard-v2-implementation-plan.md` §6 describes the required *behavior* for conflicted data (e.g. Product/Shift/Employee's Conflicted Authoritative Source per the Canonical Data Contract), but no card in the real, current dataset actually carries two competing values to display side by side — none of the 11 cards' underlying entities currently expose a conflict in this specific shape. This architecture specifies how a Conflicted state *would* be shown, but flags honestly that the data contract does not yet carry what that display would need. Closing this gap is a Dashboard Dataset schema change, not a frontend architecture decision, and is explicitly out of this document's scope.

**Unknown:** which specific card(s), if any, will be the first to actually need the Conflicted-data display in practice; the real visibility scope for five of seven roles; which business unit, if any, will be onboarded next.

No ADR, roadmap, or governance document was created. No frontend code, framework choice, image, or mockup was created. Nothing was committed.
