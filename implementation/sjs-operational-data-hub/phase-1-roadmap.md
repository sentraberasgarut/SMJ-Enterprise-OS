# SJS Operational Data Hub Phase 1 - Roadmap

| | |
| --- | --- |
| Status | Draft |
| Date | 5 August 2026 |
| Operating rule | Agent continues until approval gates are reached |

## Phase 1A - Discovery and Safety Boundary

Outcome: the team knows what exists, what is blocked by access, and what must not be touched.

Deliverables:

- current-state audit;
- source inventory;
- non-production rule;
- SJS repository access blocker documented;
- owner approval gates documented.

Exit criteria:

- no production system touched;
- all unknowns are marked as unknown, not guessed;
- SJS repo access is either available or explicitly blocked.

## Phase 1B - Canonical Architecture

Outcome: Loka and Buku Toko have a clear place in the target architecture.

Deliverables:

- target architecture;
- ADR-0005;
- canonical schema draft;
- import lifecycle definition;
- duplicate prevention rule.

Exit criteria:

- every proposed source has one responsibility;
- every consumer reads canonical data, not source-native data;
- real credentials are still not required.

## Phase 1C - Dummy Importer PoC

Outcome: the ingestion pattern is proven locally without real business data.

Deliverables:

- dummy source data;
- local importer;
- canonical JSON output;
- import job log;
- validation issue output;
- automated tests.

Exit criteria:

- importer runs locally;
- duplicate import is skipped by checksum;
- validation catches missing product aliases and invalid quantities;
- tests pass.

## Phase 1D - Implementation Approval Packet

Outcome: owner can approve the next step without reading the whole repo.

Deliverables:

- approval summary;
- risk register;
- open business decisions;
- recommended next approval.

Exit criteria:

- decisions are separated into sensitive and non-sensitive;
- agent work is separated from owner-only work;
- no production deployment is implied.

## Recommended Next Approval

Approve only this narrow next step:

> Allow the agent to inspect the real SJS repository and one sanitized Loka export sample, without touching production systems.

Do not approve yet:

- production Drive integration;
- production database writes;
- Apps Script changes;
- CK transfer prices;
- replacement POS work.
