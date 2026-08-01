# Sales Service

| | |
| --- | --- |
| **Status** | Draft — proposed business responsibility, pending CEO acceptance |
| **Grounded in** | Canonical Data Contract §3 (Retail Operations / TSS domain), §4 (Transaction/Invoice, Shift, Employee entities), §5 (`ShiftOpened`, `ShiftClosed`, `InvoiceCreated`, `PaymentReceived`, `CashDeposited` events), §8 (Relationship Model); Production Architecture §3.5 |

## Responsibilities

- Compute sales-facing business meaning from canonical Transaction/Invoice and Shift data — transaction counts, revenue, and the cashier-level cash-custody unit (open/close), once, for every consumer instead of separately in Apps Script and any Dashboard sales card.
- Represent the relationship chain the Canonical Data Contract already names (§8): `Customer → Invoice → Payment → Cash → Financial Report` — a sale to a known customer produces a payment, which affects cash custody, which rolls up into a report. Sales Service owns the first half of this chain (Invoice/Payment); Finance Service owns Cash and the report roll-up.
- Represent the second named chain (§8): `Employee → Shift → Cash` — a named person's work period is the unit at which cash custody is opened, closed, and reconciled.

## Inputs

- **Transaction/Invoice** — a completed sale (Canonical Contract §4). Authoritative Source: Loka POS `Invoice` table, "the central transactional table."
- **Shift** — a cashier's work period with opening/closing cash. **Conflicted today**: "Loka's own `Shift` table and Buku Toko's `Tutup Shift` sheet track the same concept in parallel, not unified."
- **Employee** — the person operating a Shift. **Conflicted today**: "Loka's `Cashier` table (2 records) and Buku Toko's `Pengguna` sheet (8 records) are two different rosters for overlapping people."
- **Customer** — the counterparty of a Transaction/Invoice (read, not owned, by Sales Service — see Customer Service).

## Outputs

- Revenue and transaction counts, traceable to canonical Invoice records and the connector run that produced them.
- Per-shift summaries (opened/closed, cash figures as recorded), flagged where the Shift record's own Authoritative Source conflict means the figure could disagree depending on which source (Loka or Buku Toko) it traces to.
- Payment records associated with each Invoice, feeding Finance Service's Cash computation — Sales Service does not itself compute a Cash position; that is Finance Service's responsibility (Relationship Model, §8).

## Business Rules

- **Stateless with respect to truth** (Production Architecture §3.5): Sales Service derives from canonical Invoice/Shift/Employee data; it does not originate a sale or a shift record.
- **Human Approval Required — yes, for Transaction/Invoice (financial record) always; for Shift, no for read, yes for corrections** (Canonical Data Contract §6).
- **Open item this service cannot resolve on its own:** Shift's Authoritative Source conflict (Loka vs. Buku Toko) and Employee's roster conflict (Loka Cashier vs. Buku Toko Pengguna) are both named, unresolved items in the Canonical Data Contract (§4). Sales Service's Shift-scoped and Employee-scoped outputs inherit both conflicts directly — this document does not pick a winner between the two sources.
- **Branch-as-Customer overlap is out of this service's scope to resolve:** a Branch can appear as the Customer on an Invoice (Canonical Contract §4, §8) — Sales Service treats that Invoice the same as any other; distinguishing "is this Customer actually a branch" is Customer Service's named open item, not Sales Service's.

## Consumers

Per Production Architecture §2 and Canonical Data Contract §4: Apps Script (target state, for shift-closing workflows — Production Architecture §3.6 names `TutupShiftV2.gs` as an already-written but undeployed fix in this exact area), Dashboard (revenue, transaction-count cards), Finance Service (Payment records feed Cash computation), AI Workforce (anomaly flagging, subject to Human Approval Gate), Reporting Service.

## Future APIs

No API is designed here — this section only names anticipated access needs:

- A way for Apps Script's shift-closing workflow to request today's transaction summary instead of computing it from a locally cached `Ringkasan` JSON.
- A way for Dashboard to ask for today's revenue and transaction count without knowing whether the underlying Invoice or Shift record traces to Loka or Buku Toko.
- A way for AI Workforce to be notified when a Shift or Employee record shows the two-source conflict actually producing disagreeing figures for the same shift.
