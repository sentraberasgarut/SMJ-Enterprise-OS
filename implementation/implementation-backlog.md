# Implementation Backlog

| | |
| --- | --- |
| **Status** | Active backlog — replaces architecture work for this phase |
| **Date** | 31 July 2026 |
| **Builds on** | `implementation/dashboard-lineage-audit.md`, `implementation/dashboard-refactor-plan.md`, `reports/dashboard-reconciliation-audit.md` |

Every item below is actionable on its own. None require a new ADR, architecture document, governance document, or KPI document to begin — where an item is blocked on an existing, already-Proposed ADR decision, that is named explicitly as a blocking issue, not worked around.

---

## P0 — Critical

### BL-001 — Wire Loka Expense data into the Net Profit calculation

- **Description:** `_bebanBulan()` (documented in `PATCH-01-performa-dan-dashboard.md`) only reads a separate `BEBAN` sheet and returns 0. Loka's `Expense` entity contains real data (45 records for July, Rp18,517,444, proven via `prototype/loka-canonical-poc`).
- **Decision made (1 Agt 2026):** Loka `Expense` is the authoritative source. Sheet `BEBAN` di Buku Toko **tidak pernah digunakan dan harus dihapus** (manual — CEO delete dari Sheets).
- **Business Value:** Unblocks Net Profit being computable at all.
- **Technical Dependency:** Canonical pipeline (BL-008 resolved). `_bebanBulan()` reads from `canonical/latest.json → summary.totalExpenses`.
- **Estimated Complexity:** Low.
- **Blocking Issues:** ~~Requires a decision on source~~ — decided. ~~Sheet `BEBAN` deletion~~ — **deleted 1 Agt 2026 (CEO)**. **Tidak ada blocker tersisa.**
- **Acceptance Criteria:** `_bebanBulan()` returns Rp18,517,444 (or current month equivalent) traced to Loka `Expense`; net profit dashboard shows negative figure for July 2026 consistent with −Rp1,4 jt finding.

### BL-002 — Fix Gross/Net Profit dashboard labeling

- **Description:** The dashboard displays `loka.bulanIni.laba` (gross profit) labeled `tercapai` ("achieved") against a Rp20,000,000 target understood as net profit. `PATCH-01` already contains a written fix (relabel as `labaKotorBulan`; add a `labaBersihBisaDihitung` guard) that has never been confirmed deployed.
- **Business Value:** **Critical** — this is the exact bug that produced a "73% achieved" reading in a month that was actually running a net loss of Rp1.4 million.
- **Technical Dependency:** BL-001 (Net Profit's guard logic is only meaningful once Expenses is real).
- **Estimated Complexity:** Low — the fix already exists in `PATCH-01-performa-dan-dashboard.md`; work is testing and deploying it, not designing it.
- **Blocking Issues:** Whether this patch has already been deployed is unverified — first step is confirming current live state before assuming this is still open.
- **Acceptance Criteria:** The dashboard never displays gross profit labeled as an achievement against a net target; a net profit figure is only shown when real expense data supports it, per the already-written `labaBersihBisaDihitung` guard.

### BL-003 — Deploy and test the TutupShiftV2 cash-custody chain

- **Description:** `TutupShiftV2.gs` fixes a confirmed asymmetry: `kasAwal` only carries forward "Kas Kasir," while the actual/nyata figure includes both Kas Kasir and Kas Tunai (brankas). This produced the Rp5.8 million open question in `SPEC-tutup-shift-v2.md`. The file is written but explicitly marked untested by its own author.
- **Business Value:** **Critical** — this affects real cash custody, not a reporting label.
- **Technical Dependency:** A physical brankas count, required before `setSaldoBrankasAwalManual()` can be trusted (per the file's own documented install order).
- **Estimated Complexity:** Medium.
- **Blocking Issues:** Requires a human to physically count the brankas before the fix can be safely activated — this is an operational precondition, not a coding task.
- **Acceptance Criteria:** `ujiTutupShiftV2()` passes; `migrasiTambahKolomV2()` and `setSaldoBrankasAwalManual()` have been run against a real physical count; the saldo brankas chain carries forward correctly across at least 3 consecutive days without an unexplained gap.

### BL-004 — Investigate Kas Kasir policy violation (Rp4.3M vs. Rp300k limit)

- **Description:** `TutupShiftV2.gs` defines `CFG.BATAS_KAS_KASIR = 300000`. The official 31 July Financial Baseline records the actual till balance ("Laci kasir") at Rp4,298,500 — over 14 times this limit. Directly observed, not inferred.
- **Business Value:** **Critical** — either the policy is not being followed, or the baseline figure represents an atypical reset-day condition that needs to be understood before it recurs.
- **Technical Dependency:** None — this is a factual investigation, not a code change.
- **Estimated Complexity:** Low (investigation), unknown remediation complexity pending findings.
- **Blocking Issues:** Requires a direct conversation with Ayu/CEO — cannot be resolved from repository data alone.
- **Acceptance Criteria:** A documented explanation exists for the 31 July till balance; going forward, either the policy is enforced in practice or the policy itself is revisited with a stated reason.

### BL-005 — Confirm intent of the two example-styled Piutang/Hutang rows

- **Description:** Two rows in the Financial Baseline (`03_PIUTANG_HUTANG`, "Sederhana Jaya Cabang Cikajang" Rp4,500,000 and "Supplier beras (nota belum dibayar)" Rp8,500,000) are styled exactly like the workbook's documented example-row convention and are correctly excluded from their totals by that convention — but their content is unusually specific for placeholder text.
- **Business Value:** High — Rp13,000,000 combined, against a Rp130 million balance sheet, is large enough to be worth a direct confirmation.
- **Technical Dependency:** None.
- **Estimated Complexity:** Low (a question, not a build).
- **Blocking Issues:** Requires confirmation from whoever filled in the workbook.
- **Acceptance Criteria:** Each row is either confirmed as a leftover template example and deleted, or confirmed as real data and moved into a properly numbered, non-example row with the totals recalculated accordingly.

---

## P1 — Important

### BL-006 — Extend the canonical prototype to include Receivables (`InvoiceDebt`)

- **Description:** The current 8-entity canonical prototype does not extract `InvoiceDebt`. This means Outstanding Receivables cannot be reconciled against Loka data at all today.
- **Business Value:** High — closes a real gap in reconciling the Financial Baseline's Receivable figure (Rp1,734,000) against ongoing Loka activity.
- **Technical Dependency:** `prototype/loka-canonical-poc/src/normalize.js`; `enterprise-data/canonical/receivables.md`.
- **Estimated Complexity:** Medium — follows the same extraction/normalization/validation pattern already proven for the other eight entities.
- **Blocking Issues:** None technical.
- **Acceptance Criteria:** `InvoiceDebt` is extracted, normalized, and validated using the same pipeline as the existing eight entities; its total is compared against the Financial Baseline's Piutang figure with the difference explained, not just reported.

### BL-007 — Clarify and document "Today's Revenue" true data source

- **Description:** ADR-0003 names two daily Loka exports (`.realm` backup and `loka-YYYY-MM-DD.json`). Which one feeds the `Ringkasan` cache — and therefore every "today"-labeled dashboard figure — is unresolved.
- **Business Value:** High — resolves the lineage for four dashboard cards at once (Today's Revenue, Transaction Count, Outstanding Receivables, Stock Alerts all read from `Ringkasan`).
- **Technical Dependency:** Access to live Code.gs, not available in this repository.
- **Estimated Complexity:** Low to determine (a factual question); complexity of any resulting fix is unknown until the answer is known.
- **Blocking Issues:** Requires access to the live Apps Script project, which this audit did not have.
- **Acceptance Criteria:** A single, documented answer exists for which file `Ringkasan` is computed from, and its actual refresh cadence.

### BL-008 — CEO decision on ADR-0003 and ADR-0004

- **Status: ✅ SELESAI — 1 Agustus 2026**
- ADR-0003 diterima dengan amandemen: Buku Toko adalah Enterprise OS (bukan sekadar consumer); Loka `Expense` otoritatif untuk beban; sheet `BEBAN` dihapus.
- ADR-0004 diterima tanpa amandemen.
- **Terbuka:** BL-001, BL-006, BL-007, BL-009, BL-010, BL-012 sekarang tidak diblokir keputusan ini.

### BL-009 — Resolve Product Authoritative Source conflict

- **Description:** ADR-0003 names Buku Toko authoritative for "catalog"; Loka independently maintains its own Product table with its own pricing fields. The reconciliation audit found only 15 of 49 baseline inventory items match Loka's recorded stock exactly, and 8 have no name match at all.
- **Business Value:** High — affects Inventory Value, Pricing, and any margin-by-product analysis.
- **Technical Dependency:** BL-008 (this is exactly the kind of conflict ADR-0003 acceptance would formally settle).
- **Estimated Complexity:** Medium — likely requires establishing a shared product identifier between systems, not just a policy statement.
- **Blocking Issues:** BL-008.
- **Acceptance Criteria:** One system is declared authoritative for Product going forward, and the 8 unmatched items are individually resolved (same product under a different name, genuinely different products, or discontinued).

### BL-010 — Add provenance/checksum registry to prevent duplicate backup processing

- **Description:** The canonical prototype computes a SHA-256 checksum per run but does not store or compare it anywhere. Running the prototype twice on the same backup produces the same output twice with no de-duplication.
- **Business Value:** Medium-High — becomes critical the moment ingestion is automated (not yet the case).
- **Technical Dependency:** `prototype/loka-canonical-poc/src/extract.js` (checksum already computed there).
- **Estimated Complexity:** Medium.
- **Blocking Issues:** Low priority until automation (Phase 3) actually begins — listed here so it isn't forgotten, not because it's urgent today.
- **Acceptance Criteria:** Reprocessing the same backup file is detected and skipped, with a clear log message, rather than silently duplicating canonical output.

### BL-011 — Investigate 8 unmatched product names between baseline and Loka

- **Description:** Listed directly in the reconciliation audit: "Beras Panawuan 25KILOGRAM," "Terigu Gatot Kaca 1KG," "Nasi Briyani Umi Pipik 250 gr," "Minyak Fortune 1L," "Minyak Sania 2L," "Minyak Rose Brand 2l," "Terigu Gatot Kaca 500Gr," "Nasi Briyani Umi Pipik 500 gr" — none matched a Loka product by exact name.
- **Business Value:** Medium — without resolution, any name-based reconciliation between the baseline and Loka is unreliable for these items specifically.
- **Technical Dependency:** None.
- **Estimated Complexity:** Low (investigation only).
- **Blocking Issues:** None.
- **Acceptance Criteria:** Each of the 8 items is classified as: same product under a different name, a genuinely different unit/variant, or not present in Loka at all — with a stated reason for each.

---

## P2 — Nice to Have

### BL-012 — Extend the canonical prototype to capture Stock Alert / Expiry Alert fields

- **Description:** `normalize.js`'s Product mapping does not currently carry `stockAlert` or `expiryAlert` fields through, even though Loka's schema has them.
- **Business Value:** Low today (no confirmed dashboard dependency verified); would unblock the Stock Alerts card if one exists live.
- **Technical Dependency:** `prototype/loka-canonical-poc/src/normalize.js`.
- **Estimated Complexity:** Low.
- **Blocking Issues:** None.
- **Acceptance Criteria:** `stockAlert` and `expiryAlert` appear in canonical Product output when present in the source.

### BL-013 — Define and model a Goods Out / Inter-branch Shipment canonical entity

- **Description:** No canonical entity exists today for inter-branch distribution (TSS/CK → Sederhana Jaya branches). This is genuinely new modeling work, not a fix to something broken.
- **Business Value:** Medium.
- **Technical Dependency:** BL-008 (new canonical entities are introduced via the Canonical Data Contract's additive versioning path, which itself depends on the contract being accepted).
- **Estimated Complexity:** High — also depends on first resolving whether `KELUAR` and `Kirim` (in `SPEC.md`) refer to the same sheet.
- **Blocking Issues:** This backlog is explicitly barred from creating new canonical theory this phase — this item stays queued until that constraint lifts.
- **Acceptance Criteria:** Not applicable yet — this item's acceptance criteria will be defined when the constraint above is lifted.

### BL-014 — Resolve Employee/Shift Authoritative Source conflict

- **Description:** Loka's `Cashier` table (2 records) and Buku Toko's `Pengguna` sheet (8 records) are two different rosters for overlapping people, and Loka's `Shift` table tracks the same concept as Buku Toko's Tutup Shift sheet in parallel, unreconciled.
- **Business Value:** Medium — mostly a data-hygiene concern rather than an active source of wrong numbers today.
- **Technical Dependency:** BL-008.
- **Estimated Complexity:** Medium.
- **Blocking Issues:** BL-008.
- **Acceptance Criteria:** One system is declared authoritative for Employee/Cashier identity, and the two Shift-tracking mechanisms are either merged or explicitly scoped to different purposes.

### BL-015 — Investigate duplicate phone number between "Dapur" and "RUMAH" customer records

- **Description:** Loka's `Customer` table has exactly 8 records; 6 are named Sederhana Jaya branches, and 2 more ("Dapur," "RUMAH") share an identical phone number. Only "Papoy" appears to be a genuinely external, non-family customer.
- **Business Value:** Low-Medium — relevant to any future customer-based KPI (Repeat Customer Rate, etc.) that must exclude internal transfers.
- **Technical Dependency:** None.
- **Estimated Complexity:** Low.
- **Blocking Issues:** None.
- **Acceptance Criteria:** "Dapur" and "RUMAH" are confirmed as either the same internal entity recorded twice, or two genuinely distinct internal entities that happen to share a contact number — and are flagged as non-external in any customer-facing metric going forward.
