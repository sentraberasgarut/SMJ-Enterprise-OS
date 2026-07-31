# Operational Baseline Manifest

## Baseline Information

- **Date:** 31 July 2026
- **Purpose:** Establish the official opening financial position of Toko Sembako Sejahtera (TSS) — a single, physically-verified starting point that all future TSS financial reporting measures growth against.
- **Scope:** Toko Sembako Sejahtera (TSS) only. This baseline does not cover Central Kitchen, SBGA, or any other business unit.
- **Status:** Official — Immutable

## Why This Baseline Exists

- **Financial reset.** TSS's books had never cleanly separated the owner's funds from Ibu's, so cash on hand and true business equity were never the same question. A reset was needed to answer both correctly, starting from one named date.
- **Ownership clarification.** On 30 July 2026, Aditya and Ibu agreed that Ibu's funds in TSS are founding capital, not a loan — see [ADR-0002](../../../../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md). That decision is what made a clean reset possible.
- **Opening balance establishment.** With ownership settled, a physical count of goods and money, plus a full accounting of what's owed to and by outside parties, produces one number: TSS's actual opening equity as of 31 July 2026.
- **Beginning of a new accounting period.** From 1 August 2026 onward, TSS profit is measured as growth in that opening equity figure — not as cash observed in the till and not as gross margin alone.

## Enterprise Artifacts

Everything contained in this baseline folder:

| Artifact | Role |
| --- | --- |
| `FORM_RESET_TSS_31JULI2026_v2_redesign.xlsx` | The baseline workbook itself — physical counts, receivables/payables, and the resulting opening balance sheet |
| `README.md` | Purpose, rationale, and reconciliation rule for this baseline |
| `CHANGELOG.md` | History of changes to this baseline artifact, one entry per change |
| `CHECKSUM.md` | SHA256 integrity record for the workbook |
| `MANIFEST.md` | This file — the inventory of what the baseline represents |

## Authoritative Sources

The sources actually used to establish this baseline:

- **Physical stock opname** — a physical count of goods on hand, valued at last purchase cost (`01_MODAL_BARANG`), deliberately counted fresh rather than taken from any system's recorded stock figure.
- **Physical cash count** — a physical count of cash on hand, bank balances, and e-wallet balances (`02_MODAL_UANG`).
- **Manual record of receivables and payables** — amounts owed to TSS and owed by TSS to outside parties, excluding Ibu's funds, which are capital, not debt (`03_PIUTANG_HUTANG`).
- **CEO decision** — Aditya, as owner, prepared and finalized this reset.
- **Ibu's decision** — Ibu, as co-owner of capital, agreed to the capital treatment this baseline depends on, and witnessed the reset per the workbook's own signing record.

No system-generated report (Loka POS or otherwise) was used as a source for this baseline — the workbook's own design calls for physical counts specifically to avoid inheriting any existing system discrepancy.

## Reconciliation Rule

Every financial report for TSS beginning 1 August 2026 must be reconcilable to this baseline. If a later report's numbers cannot be traced back to the opening equity figure recorded here, the report is what needs correcting — not this baseline.

Future corrections are **appended** through `CHANGELOG.md`, not made by rewriting the baseline workbook or its supporting documents. If a material error is later found in the baseline itself, it is recorded as a new, dated, explicit entry describing what was found and how it's handled — the original artifact is never silently altered.

## Integrity Rules

- This baseline is immutable.
- Workbook contents must never be edited after publication.
- Corrections are additive, never retroactive edits to what's already published.
- Historical traceability must be preserved — every number in this baseline must remain traceable to the physical count or decision that produced it.
- Enterprise reports reference this baseline; they do not copy its numbers and let them drift independently.

## Related Documents

- [ADR-0002 — Dana Ibu di TSS adalah Modal Awal, bukan Hutang](../../../../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md) — the ownership decision this baseline depends on.

For broader context on how baseline artifacts like this one relate to the enterprise's data architecture, see [ADR-0003](../../../../adr/0003-canonical-data-platform-loka-pos.md) and the [Enterprise OS Blueprint](../../../../architecture/enterprise-os-blueprint-v1.md) — referenced here for context only; this manifest does not depend on or restate their content.
