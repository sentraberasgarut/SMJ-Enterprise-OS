# Loka Source-Data Forensics — 2026-08-01

| | |
| --- | --- |
| **Type** | Forensic investigation only — no fixes, no code changes, no pipeline changes |
| **Subject** | `H:\My Drive\SBGA OS\Loka Kasir\Agustus\[1.7.36-v109] loka-stok-backup-1-8-2026.realm` |
| **Trigger** | Operator-reported concern: Loka may have a month-offset bug — 31 July data possibly stored under the wrong month; filename/displayed month not trusted |
| **Method** | A standalone, read-only script opened the Realm file directly (`readOnly: true`), never touching `prototype/loka-canonical-poc` code, and inspected raw field values before any pipeline transformation |

---

## Executive Summary

**No month-offset bug was found in this backup's underlying data.** Every date field checked across Invoice, Shift, Expense, Customer, Supplier, Product, and InvoiceDebt is internally consistent, chronologically contiguous, and correctly placed in July–August 2026 — including 31 July specifically, which the operator flagged as the suspect date. 31 July's 16 invoices, its Expense records, and its Shift close are all stored with raw timestamps that parse unambiguously to 31 July 2026, not to June or to a different month.

The backup's filename (`loka-stok-backup-1-8-2026.realm`, i.e. "1 Agustus 2026" in the DD-M-YYYY convention already established elsewhere in this repository) and its folder (`Agustus`) both **match** the data's actual latest timestamps — the file was created early on 1 August 2026 (Jakarta local time) and contains records through the same moment. Filename, folder, and raw Realm timestamps all agree with each other. None of them, individually or together, exhibit the symptom the operator described.

This does not mean the operator's observation was baseless — it means **this specific backup file's underlying data does not reproduce it.** The most plausible remaining explanations (Application UI display, or the observation being about a different backup not available to this investigation) cannot be confirmed or ruled out from this file alone — see Risk Assessment and Open Questions.

---

## Evidence

### Realm Metadata
| Field | Value |
| --- | --- |
| File path | `H:\My Drive\SBGA OS\Loka Kasir\Agustus\[1.7.36-v109] loka-stok-backup-1-8-2026.realm` |
| File size | 1,048,576 bytes |
| Filesystem last-modified (UTC) | 2026-08-01T01:24:03.406Z |
| Filesystem created (UTC) | 2026-08-01T01:24:06.927Z |
| SHA-256 | `c8d592a79d750d364044415e8b2c3e2047ba3a71fd4955fa82b8e895ff9cd970` |
| Realm `schemaVersion` | **109** — identical to the previously-validated 30 July backup; matches this repository's own `LAST_KNOWN_GOOD_SCHEMA_VERSION` constant. No schema drift. |
| Connector version | **N/A for this investigation.** This was a raw, standalone forensic probe — the canonical prototype pipeline (`prototype/loka-canonical-poc`) was not run against this file. For reference, that pipeline's own `CONNECTOR_VERSION` constant is currently `loka-canonical-poc-0.2.0`. |

### Object Type Inventory (top-level, non-embedded types relevant to this investigation)
| Entity | Total Records |
| --- | --- |
| Invoice | 501 |
| Shift | 34 |
| Expense | 48 |
| Customer | 8 |
| Supplier | 6 |
| Product | 47 |
| InvoiceDebt | 79 |
| StockMovement | 244 |

*(Full schema — all 46 top-level and 24 embedded types — was enumerated during the probe; only entities named in the investigation scope are reported in detail below.)*

---

## Timeline

### Invoice Date Frequency Table (by calendar day, UTC)
```
2026-07-04 -> 2      2026-07-14 -> 25     2026-07-24 -> 21
2026-07-05 -> 16     2026-07-15 -> 20     2026-07-25 -> 25
2026-07-06 -> 10     2026-07-16 -> 20     2026-07-26 -> 21
2026-07-07 -> 14     2026-07-17 -> 25     2026-07-27 -> 18
2026-07-08 -> 6      2026-07-18 -> 22     2026-07-28 -> 10
2026-07-09 -> 9      2026-07-19 -> 29     2026-07-29 -> 15
2026-07-10 -> 17     2026-07-20 -> 13     2026-07-30 -> 17
2026-07-11 -> 24     2026-07-21 -> 17     2026-07-31 -> 16
2026-07-12 -> 28     2026-07-22 -> 27     2026-08-01 -> 2
2026-07-13 -> 17     2026-07-23 -> 15
```
**Every day from 4 July through 1 August 2026 is present with no gap.** The Gap Analysis check (looking for any jump of more than one calendar day between consecutive dates with invoice activity) found **zero gaps**. **31 July specifically shows 16 invoices, correctly dated 31 July** — directly contradicting the "stored under the wrong month" hypothesis for the one date the operator named.

### Invoice Hour-of-Day Distribution (UTC)
```
00 -> 92   05 -> 27   10 -> 55
01 -> 31   06 -> 41   11 -> 1
02 -> 30   07 -> 31   13 -> 3
03 -> 20   08 -> 43   22 -> 1
04 -> 39   09 -> 48   23 -> 39
```
Converting to Jakarta local time (UTC+7, the timezone already established elsewhere in this repository for this business), this maps to a concentration in the local morning-through-afternoon (UTC 00–10 = WIB 07:00–17:00) with a smaller early-morning tail (UTC 22–23 = WIB 05:00–06:00) — a plausible retail pattern, not evidence of an impossible or artificially-generated distribution. No hour shows a count so extreme (e.g., every record at one exact timestamp) as to suggest fabricated or duplicated data.

### Earliest / Latest Per Entity
| Entity | Field | Earliest (UTC) | Latest (UTC) | Raw type |
| --- | --- | --- | --- | --- |
| Invoice | `date` | 2026-07-04T10:02:31.490Z | 2026-08-01T00:38:28.354Z | string, epoch-millis |
| Shift | `openTime` | 2026-07-04T09:13:13.404Z | 2026-07-30T23:31:11.080Z | string, ISO |
| Shift | `closeTime` | 2026-07-04T23:26:35.505Z | 2026-07-31T10:12:53.714Z | string, ISO |
| Expense | `date` | 2026-07-03T23:21:00.000Z | 2026-07-31T10:22:25.176Z | string, epoch-millis |
| Customer | `joinDate` | 2026-07-05T00:11:53.134Z | 2026-07-10T16:24:56.575Z | string, epoch-millis |
| Supplier | `joinDate` | 2026-07-06T01:17:12.540Z | 2026-07-20T02:32:34.537Z | string, epoch-millis |
| Product | `createdTime` | 2026-07-04T07:38:11.110Z | 2026-07-29T06:54:21.761Z | string, epoch-millis |
| InvoiceDebt | `date` | 2026-07-05T03:46:20.396Z | 2026-08-01T00:38:55.464Z | string, epoch-millis |
| StockMovement | `createdAt` | 2026-07-27T00:34:44.798Z | 2026-08-01T00:38:28.591Z | native Realm `date` |
| **Payment** (derived — see below) | inherits Invoice `date` | 2026-07-04T10:02:31.490Z | 2026-08-01T00:38:28.354Z | — |

**Payment note:** Payment is not a top-level Realm table — as already established in this repository's canonical prototype work, it is derived from `Invoice.paymentMethod` / `Invoice.splitPayments`. It has no independent timestamp; its effective date is its parent Invoice's date by construction. 501 Payment records were derivable from the 501 Invoices (one per Invoice with a resolvable payment method or split), matching the existing prototype's own derivation logic in shape.

---

## Entity Analysis

### Cross-entity date comparison
| Entity | Latest timestamp | Latest calendar day |
| --- | --- | --- |
| Invoice | 2026-08-01T00:38:28.354Z | **2026-08-01** |
| InvoiceDebt | 2026-08-01T00:38:55.464Z | **2026-08-01** |
| StockMovement | 2026-08-01T00:38:28.591Z | **2026-08-01** |
| Shift (close) | 2026-07-31T10:12:53.714Z | 2026-07-31 |
| Shift (open) | 2026-07-30T23:31:11.080Z | 2026-07-30 |
| Expense | 2026-07-31T10:22:25.176Z | 2026-07-31 |

**They do not all end on the same calendar day.** Invoice, InvoiceDebt, and StockMovement reach into 1 August; Shift and Expense stop at 31 July. This is the one genuine cross-entity asymmetry found.

**Assessment of this asymmetry, without inventing a cause:** the backup was created at 2026-08-01T01:24 UTC (08:24 WIB). The latest Invoice/InvoiceDebt/StockMovement timestamps (~00:38 UTC = 07:38 WIB) fall about 46 minutes before the backup was taken — consistent with early-morning business activity on 1 August already having occurred (2 invoices) while no Shift had yet been closed and no Expense yet logged for that new, still-very-young day. This is the same pattern already documented in this repository for the prior (30 July) backup, which also captured a partial final day. **This is a plausible, ordinary explanation, not a confirmed one** — this investigation did not have access to a shift-by-shift operational log to independently verify that no 1 August Shift or Expense existed at backup time versus one existing but not captured. Reported as an open, unconfirmed item, not resolved as fact.

### Impossible / anomalous date check
- **31 June, or any calendar-invalid date:** none found. Every parsed date resolves to a real calendar date.
- **Future dates** (relative to the investigating machine's clock, 2026-08-01T01:33:53Z — noted as a reference point only, not asserted as ground truth): **zero** found across Invoice, Shift, and Expense.
- **Negative chronology** (a Shift's `closeTime` before its own `openTime`): **zero** found across all 34 Shift records.
- **Large gaps:** none in the Invoice date series (see Timeline).
- **Duplicate days:** multiple invoices per day is normal and expected (up to 29/day, per the frequency table) — not itself an anomaly. Multiple Shifts opened on the same calendar day also occurs (e.g., 3 on 16 July) and is not, on its own, evidence of a problem.

### Comparison to the previously-validated 30 July backup (context, not part of the numbered investigation scope)
`schemaVersion` is identical (109). Entity counts grew by amounts consistent with 1–2 additional days of business activity: Invoice 481→501 (+20), Shift 32→34 (+2), Expense 45→48 (+3); Customer, Supplier, and Product counts are unchanged (8, 6, 47). No entity count reset to zero or jumped implausibly.

---

## Risk Assessment

### Classification: is the observed "month bug" A, B, C, D, or E?

| Option | Finding |
| --- | --- |
| **A — Filename only** | **Not supported.** The filename (`1-8-2026`) correctly matches the data's actual latest activity (early 1 August). |
| **B — Backup folder naming** | **Not supported.** The `Agustus` folder correctly matches the backup's creation date and content. |
| **C — Realm timestamps** | **Not supported.** Every date field checked across seven entities is internally consistent, chronologically contiguous, and correctly placed — 31 July data is stored as 31 July, not shifted. |
| **D — Application UI** | **UNKNOWN.** This investigation has no access to the live Loka application UI and cannot confirm or rule out a display-layer issue (e.g., a timezone-conversion or month-label rendering bug independent of the underlying stored data). |
| **E — Unknown** | This is where this investigation's conclusion lands for the operator's *original symptom*: the backup data itself does not reproduce a month-offset, so if the operator's observation was accurate, its cause is not in this file. |

**Direct conclusion:** A, B, and C are ruled out by direct evidence. D cannot be assessed (no access). The residual classification is **E — Unknown**, specifically narrowed to "not a data-storage problem in this backup" rather than "the whole concern is baseless" — this investigation cannot speak to what the operator originally saw, only to what this file contains.

### Whether the canonical prototype can continue trusting Realm timestamps

**Classification: SAFE WITH WARNING.**

**Why SAFE:** Every timestamp field checked parses cleanly using the same epoch-millis-string-first, ISO-fallback logic the canonical prototype's own `fieldParser.js` already uses. No impossible date, no future date, no negative chronology, no unparseable value, and no gap was found across 501 Invoices, 34 Shifts, 48 Expenses, and 79 InvoiceDebts. `schemaVersion` matches the last-known-good value the prototype already checks against.

**Why WITH WARNING, not plain SAFE:**
1. The cross-entity "latest day" asymmetry (Invoice/InvoiceDebt/StockMovement reaching 1 August; Shift/Expense stopping at 31 July) is real and observed, even though a plausible, non-alarming explanation exists (partial final day at backup time). The canonical prototype does not currently have any check that would surface this asymmetry on its own — it validates each entity independently, not cross-entity date coherence.
2. Option D (Application UI) remains genuinely unconfirmed. If the operator's original concern traces to a UI display issue rather than stored data, that issue would be invisible to the canonical prototype (which never touches the UI) — meaning "the canonical pipeline is safe" and "the operator's concern is resolved" are not necessarily the same statement.
3. This was a single-file, single-snapshot investigation. It confirms this backup is internally trustworthy; it does not confirm every future backup will be.

---

## Recommendation

1. **The canonical prototype may continue processing Loka backups using its existing timestamp-parsing logic** — no evidence found in this investigation requires a change to that logic. (Stated as a finding for the CEO's decision, not implemented — per this task's explicit scope, no code was touched.)
2. **Ask the operator directly which screen or report in the live Loka app showed the suspected month offset**, and at what date/time it was observed — this investigation could not reproduce the symptom from the backup data alone, and closing the loop requires the observation's original source, which is outside this file.
3. **If the operator's concern persists, obtain a second, independent backup at a different time of day** and re-run this same forensic check — a single snapshot cannot distinguish "the app has a display bug" from "the app is fine and the backup is fine," since both would look identical from a backup-only investigation.

No fix, normalization, or pipeline change is recommended or implemented here, per this task's explicit scope.

---

## Confidence Level

**High confidence** that this specific backup file's stored data does not exhibit a month-offset bug — this conclusion is based on direct inspection of all 501 Invoice, 34 Shift, 48 Expense, and 79 InvoiceDebt records, with zero exceptions found across every check performed (impossible dates, future dates, negative chronology, gaps, cross-entity comparison).

**Low confidence / UNKNOWN** on whether the operator's original observation has any basis at all — that would require information (the live app UI, or the specific prior observation) this investigation did not have access to.

---

## Open Questions

1. What exactly did the operator see that prompted the "month ahead/behind" concern — which screen, which date, which app version? Not established by this investigation.
2. Is there an earlier backup (prior to this one) that the operator was originally looking at, which might have exhibited the actual symptom, and which is not the file investigated here? **UNKNOWN** — not located during this investigation's scope (this investigation was directed to use only `H:\My Drive\SBGA OS\Loka Kasir\Agustus`, per explicit instruction, and did not search elsewhere).
3. Does the Loka application UI convert stored UTC-epoch timestamps to Jakarta local time correctly for display? **UNKNOWN** — no UI access.
4. Is the 1-August partial-day gap between Invoice/InvoiceDebt (which reach 1 August) and Shift/Expense (which stop at 31 July) purely a timing artifact of when the backup was taken, or does it indicate something about how those specific entities are written? **UNKNOWN** — plausible explanation offered above, not independently confirmed.
5. Does `StockMovement` — which per this repository's own prior research previously held zero records — now holding 244 records reflect a real operational change, a schema/feature activation, or something else? **Not investigated** — outside this task's named entity scope (Invoice, Shift, Expense, Payment, Customer, Supplier, Product); noted here only because it was visible during the initial schema probe.

No file besides this one was created. No prototype code, dashboard, architecture document, or ADR was modified. Nothing was committed.
