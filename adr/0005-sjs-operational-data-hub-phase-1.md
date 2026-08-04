# ADR-0005 - SJS Operational Data Hub Phase 1

| | |
| --- | --- |
| Status | Proposed |
| Date | 5 August 2026 |
| Deciders | Aditya Ikhsan Nurjaman, S.H.; Iyen Kristianti for CK pricing and production decisions |
| Builds on | ADR-0001, ADR-0003, ADR-0004 |

## Context

Toko Sembako Sejahtera uses Loka POS for cashier operations. Buku Toko and Central Kitchen use Google Sheets and Apps Script for operational workflows. Reports currently depend on Loka export or backup files becoming available, then being parsed and summarized.

The current pain is not the absence of a POS. The pain is that operational data does not yet flow through a stable, auditable, duplicate-safe data hub.

## Decision

Build SJS Operational Data Hub Phase 1 as a read-only ingestion and canonicalization layer around Loka and Buku Toko.

Phase 1 will:

- keep Loka as the POS;
- keep Buku Toko as the current operational runtime;
- ingest source files read-only;
- track every import job;
- prevent duplicate processing by checksum;
- validate records before publishing;
- normalize data into a canonical operational schema;
- expose sync status and validation issues;
- use dummy data until real access is approved.

Phase 1 will not:

- replace Loka;
- clone Loka;
- reverse engineer private APIs;
- change production Apps Script;
- import real production data without approval;
- decide CK transfer pricing.

## Consequences

Positive:

- Downstream reports can stop depending directly on Loka export shapes.
- Duplicate imports become visible.
- Missing or failed imports become visible.
- Product alias mapping can be handled deliberately.
- The live workflow is protected while the data foundation matures.

Tradeoffs:

- Reports still are not real-time while Loka access depends on exports or backups.
- A human-approved access step remains necessary before production import.
- CK profitability still cannot be finalized until CK pricing basis is approved.

## Approval Gates

Owner approval is required before:

- connecting to real Google Drive folders;
- processing real Loka backups or exports;
- writing to any production database;
- modifying production Apps Script;
- publishing dashboards based on production financial data;
- setting CK transfer pricing.

## Status Note

This ADR is proposed by the agent. It becomes binding only after owner approval.
