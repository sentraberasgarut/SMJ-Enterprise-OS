# TSS Operational Baseline — 31 July 2026

## Purpose

This directory holds the official financial reset baseline for Toko Sembako Sejahtera (TSS), cut off at **31 July 2026**. It contains one artifact: `FORM_RESET_TSS_31JULI2026_v2_redesign.xlsx`, the finalized reset workbook, unmodified from the version delivered as the enterprise's official record.

Everything before 31 July 2026 is historical reference. Everything from 1 August 2026 onward is measured against this baseline, not against it as one data point among others.

## Why the Reset Happened

TSS's cash and capital had never been cleanly separated between the owner (Aditya) and Ibu — dana Ibu circulated through the business without a clear accounting treatment, so "how much cash is in the drawer" and "how much the business is actually worth" were never the same question, and profit could not be measured against a real opening position.

On 30 July 2026, ownership decided — see [ADR-0002](../../../../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md) — that all of Ibu's funds in TSS as of 31 July 2026 are recorded as **founding capital**, not a liability. That decision made a clean reset possible for the first time: a single cutoff date, a physical count of goods and cash, a full accounting of receivables and payables to outside parties, and one resulting opening equity figure.

## Why This Workbook Is the Official Baseline

This workbook is the artifact that carried out that reset:

- `01_MODAL_BARANG` — physical stock count, valued at last purchase cost
- `02_MODAL_UANG` — physical cash, bank, and e-wallet count
- `03_PIUTANG_HUTANG` — receivables and payables to outside parties only (Ibu's funds are explicitly excluded here, per ADR-0002 — they are capital, not debt)
- `04_NERACA_AWAL` — the resulting opening balance sheet, calculated automatically from the three sheets above
- `05_BIAYA_BEP` — fixed monthly costs and break-even point
- `06_ATURAN_SISTEM` — the operating rules that take effect from 1 August 2026
- `07_LOG_KEPUTUSAN` — the running decision log, starting from this reset

It is treated as official because it is the one artifact that ties a physical count, a documented ownership decision (ADR-0002), and a resulting equity number together on a single, named cutoff date. Nothing about its content is altered here — this integration only gives it a permanent, version-controlled home.

## What Future Reports Must Reconcile Against

From 1 August 2026 forward, **TSS profit is measured as growth in the opening equity figure recorded in `04_NERACA_AWAL`** ("MODAL BERSIH AWAL TSS") — not as cash observed in the till, and not as gross margin alone. Any future P&L, margin analysis, or financial statement for TSS must be able to trace back to this number as its starting point. If a later report's numbers can't be reconciled to this baseline, the report is wrong, not the baseline — unless a new, equally explicit reset is documented the same way this one was.

## What This Directory Is Not

This is not a place for edits. The workbook here is a point-in-time record, not a working copy — day-to-day data entry and future reset iterations belong elsewhere. See [`CHANGELOG.md`](CHANGELOG.md) for the history of this specific artifact, and [`CHECKSUM.md`](CHECKSUM.md) to verify the file hasn't changed since it was filed here.
