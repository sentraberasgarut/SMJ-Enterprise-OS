# SJS Operational Data Hub Phase 1 - Risk Register

| Risk | Severity | Status | Mitigation |
| --- | --- | --- | --- |
| SJS repository inaccessible | High | Active | Continue safe work in inspected repo; migrate after access approval |
| Real Loka format differs from dummy assumptions | High | Expected | Require sanitized sample before production implementation |
| Production Sheets or Apps Script accidentally changed | High | Controlled | Phase 1 PoC is local-only and read-only by design |
| Duplicate imports inflate reports | High | Addressed in PoC | Checksum-based duplicate skip and import job records |
| CK shipments remain valued at zero | High | Business decision needed | Model transfers now; wait for CK pricing basis |
| Product names drift between Loka, TSS, and CK | Medium | Active | Add product alias table and validation issue |
| Import succeeds but business does not notice warnings | Medium | Active | Validation issues become first-class output |
| Repo grows documentation-heavy again | Medium | Active | Tie every document to implementation gate and testable PoC |
| GitHub mistaken as transaction database | Medium | Controlled | Schema is implementation draft; production database remains undecided |
| AI agent oversteps approval boundary | High | Controlled | ADR-0005 defines explicit approval gates |

## Current Blockers Requiring Owner Action

- Access to `sentraberasgarut/SJS-Enterprise`, if that is the intended target repository.
- Sanitized Loka export or backup sample, if real mapping must be verified.
- CK transfer pricing basis.
- Production credentials for Drive, Sheets, Apps Script, or database.

## Current Non-Blockers

- Building dummy PoC.
- Writing schema draft.
- Writing architecture and ADR.
- Running local tests.
- Preparing implementation approval packet.
