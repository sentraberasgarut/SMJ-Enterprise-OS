# Dashboard Dataset v1 — Contract

**This is the only interface any future presentation layer (PWA, Mobile, Desktop, TV Dashboard) should consume.** No frontend should read Realm, the Connector, or a Business Service directly — only `dashboard-dataset.json`, shaped per `dashboard-schema.json`.

Produced by `src/dataset/datasetBuilder.js`, which consumes only the Reporting Service's own output (`dashboard.json`, `dashboard-summary.json`, `dashboard-health.json`) plus the Connector's run metadata — never Realm, never the Connector, never a Business Service module directly. This is enforced structurally, not just documented: `tests/dataset.test.js` asserts none of `src/dataset/*.js` contains a `require('realm')`, a connector import, or a `services/` import.

## Top-level sections

| Section | Contents |
| --- | --- |
| `metadata` | Dataset version (`1.0.0`), generation timestamp, and traceability back to the Reporting Service run and Connector run ID. |
| `systemHealth` | Per-stage status (`connector` / `canonical` / `reporting` / `validation`), each `healthy` \| `degraded` \| `unhealthy` \| `unavailable`, derived by a pure rule over already-computed data — nothing here is a new calculation. |
| `businessUnits` | Schema preparation for 5 named units. Only Toko Sembako Sejahtera is `dataConnected: true` today — everything else is `not-onboarded`, honestly, not implied to work. |
| `userRoles` | Visibility metadata for 7 named roles. Only CEO and Owner (Ibu) have a grounded, non-`UNKNOWN` `visibilityScope` — the rest are `UNKNOWN` because no document defines them. No authentication of any kind. |
| `dashboardCards` | The same 11 cards from `implementation/dashboard-v2-implementation-plan.md` §3, each enriched with an `audit` block (source entity, Business Service, reporting module, refresh timestamp, confidence, current status, 4-stage lineage) and an `approvalStatus` (always `"not-tracked"` today). |
| `lastRefresh` / `confidence` / `freshness` | Top-level convenience fields — `confidence` is a distribution across the 11 cards' own confidence ratings, never a single blended score. |
| `warnings` | Connector preflight issues plus any card with reduced confidence, collected in one place. |
| `blockedReasons` | Every card with `status: "blocked"` (today: only `net-profit`), with its reason. |
| `unknownReasons` | Every card with `value: "UNKNOWN"`, with its reason. |
| `approvalStatus` | A single top-level note that no approval-tracking mechanism exists in this pipeline yet (Business Rules Catalog GOV-004, AI-005) — a fact about the pipeline's current state, not a fabricated approval record. |
| `dataLineage` | The full pipeline chain (`Loka → Connector → Canonical Layer → Reporting Service → Dashboard Dataset v1`), the source backup's checksum, and the reconciliation result. |
| `businessSummary` | The Reporting Service's own `dashboard-summary.json`, embedded verbatim — not recomputed. |

## Stability

`metadata.datasetVersion` follows semver. `tests/dataset.test.js`'s "backward-compatibility baseline" test enumerates every field this v1 contract guarantees — any future change that removes or renames one of those fields is a breaking change and must bump the major version.

## What this contract deliberately does not do

- It does not add, remove, or redefine any of the 11 existing dashboard cards.
- It does not compute Net Profit, or any other figure this repository has not already established a confirmed formula for — those stay `"UNKNOWN"`.
- It does not implement multi-business-unit logic or role-based access control — both sections above are schema/metadata only, prepared for future use.
- It does not touch the Connector, canonical pipeline, Business Services, or Reporting Service's own calculations. All of them remain exactly as they were before this sprint.
