# Employees — Master Data

## Purpose

The master reference for people who operate Enterprise OS systems — cashiers, preparers, deliverers, and the owner.

## Ownership

- **Business Owner:** CEO.
- **Technical Owner:** CEO.
- **Approval Authority:** CEO — "Yes — access and role changes" (Data Governance Framework §2 Ownership Matrix).

## Authoritative Source

**Conflicted today.** The Canonical Data Contract §4 states plainly: "Loka's `Cashier` table and Buku Toko's `Pengguna` sheet are two different rosters for overlapping people." No document assigns a tiebreaker.

## Lifecycle

Created → Validated → Approved → Consumption → Archive. An employee's *system access* can and should be revoked when they leave — that is distinct from *deleting their historical record* (e.g. shifts they worked), which is never done, per the Never Deleted principle. Revocation of access is not the same action as deletion of record.

## Update Process

UNKNOWN.

## Update Frequency

UNKNOWN.

## Primary Identifier

UNKNOWN.

## Natural Key

UNKNOWN. Plausibly name or phone number, but not confirmed by any document.

## Can records be deleted?

No. Per the Never Deleted / Immutable History principle, an employee's historical record is retained even after they depart — only active access is revoked, which is a distinct action from deletion.

## Can records be merged?

UNKNOWN — this would directly matter for reconciling the Loka-vs-Buku-Toko roster conflict, but no policy is documented.

## Can records be archived?

Yes, in principle — a departed employee's record moves to an inactive/archived state. No specific process is documented.

## Expected Downstream Systems

The Shift entity, Automation (access rules), the Canonical Data Layer, AI (consumer only — see note below).

## Relationship with the Canonical Data Layer

Named in the Canonical Data Contract §8's relationship chain: `Employee → Shift → Cash`.

## Relationship with the Financial Baseline

The 2026-07-31 Baseline Manifest names specific individuals directly involved in preparing and deciding the baseline — Aditya as the owner who prepared and finalized the reset, and Ibu as co-owner of capital who agreed to the capital treatment and witnessed the reset. These are governance/decision roles recorded in the Manifest itself, not a claim that Employee master data was used to produce the baseline.

## Versioning Policy

Standard, per Data Governance Framework §6.

## Known Open Questions

1. Which system — Loka's Cashier table or Buku Toko's Pengguna sheet — is authoritative?
2. How is access formally revoked for a departed employee without deleting their historical record?
3. What is the natural key?

---

## Operational Users

Anyone who logs into or operates any Enterprise OS system (Loka, Buku Toko) — the broadest category in this dataset.

## Cashiers

Operational users specifically authorized to process transactions and shifts.

## Approvers

The role responsible for approving consequential actions, per the Human Approval Gate principle (ADR-0004 Principle 8; Data Governance Framework §4). UNKNOWN whether "Approver" is a formally distinct role today, as opposed to simply being the CEO in every observed case — the Data Governance Framework's Ownership Matrix names CEO as Approval Authority for nearly every entity in the enterprise.

## Managers

UNKNOWN. No document establishes a distinct "Manager" role separate from CEO/Owner and Cashier. Ibu & Teh Nurul function as a manager-equivalent authority specifically for Central Kitchen, per their named ownership there — but no document uses the term "Manager" to describe this role formally.

## AI Agents Are Not Employees

AI Agents must never appear as owners of this dataset, and are not themselves counted as Employees, Approvers, or Managers under any circumstance. AI Agents are consumers of Employee master data only — for example, to know who a Shift's cashier was — never participants in it. This is a direct, non-negotiable application of ADR-0004's AI Workforce Model.
