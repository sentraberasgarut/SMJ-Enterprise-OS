# SJS Operational Data Hub Phase 1 - Approval Summary

## What Is Ready

The safe Phase 1 package is ready for review:

- current-state audit;
- target architecture;
- proposed ADR-0005;
- schema draft;
- risk register;
- roadmap;
- local dummy importer PoC;
- automated tests.

## What The Agent Can Continue Without You

- Refine schema and docs.
- Extend dummy data coverage.
- Add more validation rules.
- Prepare migration notes from SMJ repo to SJS repo.
- Keep tests passing.

## What Needs Your Approval

### Decision 1 - Repository Access

Question: should this work move into `sentraberasgarut/SJS-Enterprise`?

Recommended answer: yes, once the repo is accessible to the agent.

Why: SJS is the correct legal and operational umbrella for this phase.

### Decision 2 - Sanitized Loka Sample

Question: may the agent inspect one sanitized Loka export or backup sample?

Recommended answer: yes, after removing customer-sensitive or private data if needed.

Why: dummy data proves the pattern, but real mapping needs one real source shape.

### Decision 3 - CK Transfer Pricing Basis

Question: how should CK transfer price be calculated?

Recommended answer for analysis: HPP bahan + tenaga kerja, with overhead added later if the first calculation is too heavy.

Why: this answers whether Central Kitchen creates economic value compared with each branch cooking independently.

### Decision 4 - Production Integration

Question: may the importer connect to real Drive, Sheets, Apps Script, or a production database?

Recommended answer: not yet.

Why: first verify mapping with a sanitized sample and approve ADR-0005.

## Explicit No

Do not approve:

- replacing Loka;
- cloning Loka;
- reverse engineering private Loka APIs;
- changing production Apps Script from this branch;
- uploading real sensitive data to GitHub.
