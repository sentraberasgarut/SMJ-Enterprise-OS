# Chart of Accounts — Master Data

## Purpose

To provide the structured categorization of financial accounts — Assets, Liabilities, Equity, and their sub-categories — that the Cash, Expense, Receivable, Payable, and Opening Equity entities all depend on to be reported consistently.

**This dataset is named here because the business clearly needs it, not because any document already defines it.** No document in this framework's read-set names a "Chart of Accounts" as an existing artifact or entity. This file states that plainly rather than inventing a structure to fill the gap.

## Ownership

- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Approval Authority:** UNKNOWN — no document explicitly states this for a Chart of Accounts. Assigning it to CEO here would be consistent with every other Financial-domain entity's Approval Authority in the Data Governance Framework §2, but that consistency is an inference, not a documented fact — it is marked UNKNOWN accordingly.

## Authoritative Source

UNKNOWN. The only structural precedent in any document read is ADR-0002's stated formula — *"Aset − Hutang ke pihak luar = Ekuitas milik Aditya + Ibu"* — which implies at minimum three top-level categories (Assets, Liabilities, Equity). The 2026-07-31 Baseline Manifest describes the baseline workbook's structure narratively (covering physical stock, physical cash, receivables/payables, and a resulting opening balance), which is the closest real-world precedent for what a Chart of Accounts would formalize — but the Manifest does not itself constitute an adopted Chart of Accounts, and no document claims otherwise.

## Lifecycle

UNKNOWN.

## Update Process

UNKNOWN.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN.

## Natural Key

UNKNOWN.

## Can records be deleted?

If this dataset comes to exist, no — consistent with the general Never Deleted principle applied elsewhere in this framework. This is stated as a consequence of the principle, not as a confirmed policy specific to this dataset.

## Can records be merged?

UNKNOWN.

## Can records be archived?

UNKNOWN.

## Expected Downstream Systems

Cash, Expense, Receivable, Payable, and Opening Equity (all Financial-domain entities, per the Canonical Data Contract and the Enterprise KPI Framework), Reports, AI (consumer only).

## Relationship with the Canonical Data Layer

Not a named entity in the Canonical Data Contract today. If formally adopted, it would need to be introduced through that document's additive versioning path (§9), not assumed into existence by this file.

## Relationship with the Financial Baseline

The baseline's own category structure — Modal Barang (goods), Modal Uang (cash), Piutang (receivables), Hutang (payables), and the resulting Modal Bersih (net equity), as described narratively in the Baseline Manifest — is the closest existing precedent for what a Chart of Accounts would formalize. It is a precedent, not the thing itself.

## Versioning Policy

Standard, per Data Governance Framework §6, if and when this dataset is formally adopted.

## Known Open Questions

1. Does a formal Chart of Accounts need to exist as its own governed dataset, or is the baseline's existing category structure sufficient for this organization's current scale?
2. No document has proposed formally introducing Chart of Accounts as a new canonical entity — this master-data directory may be the first place that need has been named at all.
3. If adopted, does it apply uniformly across TSS and Central Kitchen, or does each business unit need its own structure given their different ownership (CEO vs. Ibu & Teh Nurul)?
