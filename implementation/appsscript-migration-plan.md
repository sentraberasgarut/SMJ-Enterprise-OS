# Apps Script Migration Plan — Buku Toko Dashboard → Enterprise OS V2

| | |
| --- | --- |
| **Type** | Migration planning only — no code written, no implementation, no deployment |
| **Date** | 1 August 2026 |
| **Audited source** | `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\` — `Code.gs` (2,880 lines), `Index.html` (1,735 lines), `Migrasi.gs` (214 lines), `appsscripts.json` (9 lines). **This is the first time this repository has had direct access to the real, complete Apps Script source** — prior audits (`reports/dashboard-reconciliation-audit.md`, `implementation/dashboard-lineage-audit.md`) worked from reconstructed fragments (`SPEC.md`, `PATCH-01-performa-dan-dashboard.md`, `TutupShiftV2.gs`). This plan supersedes those fragments as the primary source wherever they disagree, and says so explicitly where that happens. |
| **Deployment status — read directly, not assumed** | `Code.gs`'s own header states: *"⚠️ FILE INI BELUM PERNAH DIJALANKAN. Tidak ada cara menguji Apps Script dari sisi penyusun."* ("This file has never been run. There is no way to test Apps Script from the author's side.") **This entire audit is therefore of a candidate v2.1, not a confirmed-live deployment.** Every finding below is stated as "what this source does," never as "what the live dashboard currently shows" — those are different claims, and this document does not conflate them. |

---

# 0. Source Overview

| File | Lines | Role |
| --- | --- | --- |
| `Code.gs` | 2,880 | Server-side logic: configuration, auth, all business calculations, all persistence (Sheets read/write), all outbound communication (email/WhatsApp-link generation), triggers |
| `Index.html` | 1,735 | Client: CSS, DOM rendering, client-side state, `google.script.run` calls, some duplicated live-preview calculations |
| `Migrasi.gs` | 214 | A **second, independent** one-time data-repair tool for legacy `ID Kirim` values |
| `appsscripts.json` | 9 | Manifest — timezone `Asia/Jakarta`, V8 runtime, web app executes as the deploying user, access `ANYONE` |

**Confirmed real, live business context found in the source itself** (not previously known to this repository): the real staff roster (`ORANG_AWAL`) — Ayu (Kasir), Teh Dede, Mas Haris, Mas War (Pengantar), Ayah Iman, Sanding, Aditya (Owner/CEO), Sri Nurul (Owner/CK) — and a full 30-item TSS catalog (`MASTER_ITEM`) and 100+-item Central Kitchen catalog (`MASTER_CK`, still `Harga: 0` for every item, directly confirming ADR-0003 §2's finding).

---

# 1. Apps Script Source Inventory

Organized by the file's own section structure (its `// ====== SECTION ======` comments), which is accurate and used as-is rather than re-derived.

## 1.1 `Code.gs` — Configuration (lines 32–286)

Not functions — module-level constants. Listed because several encode real business rules a migration must not silently drop: `TARGET_LABA` (`{TSS: 20000000, CK: 0}`), `BATAS_SELISIH` (30000), `BATAS_BRANKAS_MENGINAP` (2000000), `BATAS_PENDAMPING` (5000000), `DOMPET_AWAL` (the 5 named wallets — Kas Kasir, Kas Tunai, Setor ke Ibu, Setor ke Rekening BRI, Prive Owner), `BATAS_BACA = 2000` (the performance fix limiting how many rows are read per query).

## 1.2 Identity & Permission (lines 289–430)

| Function | Public? | Responsibility | Type |
| --- | --- | --- | --- |
| `_siapa(pin)` | private | Look up a person by PIN in sheet `ORANG`; reject if inactive | Business logic (auth) |
| `_unitBoleh(o)` | private | Which units (TSS/CK) an OWNER may view | Business logic (authorization) |
| `_menuPeran(peran)` | private | Which screens a role may open — a hardcoded role→screen map | Business logic (authorization) |
| `_boleh(orang, layar)` | private | Enforce `_menuPeran`/`_unitBoleh` before a screen loads | Business logic (authorization) |
| `_samarkanPin` / `_cekKunciPin` / `_catatPinSalah` | private | PIN masking and a brute-force lockout (8 tries, 5-minute lock, via `CacheService`) | Business logic (security) |
| `masuk(pin)` | **public** | Login entrypoint — calls `_siapa`, returns the user's menu | Business logic |
| `_sapaan()` | private | Time-of-day greeting text | Rendering-adjacent |
| `_catatAkses(orang, aksi, ket)` | private | Append a row to `LOG_AKSES` (audit trail) | Persistence |

## 1.3 Setup (lines 434–670)

`setup()` (public, menu-triggered) provisions every sheet this app depends on (`ORANG`, `LOG_AKSES`, `DOMPET`, `TUTUP_SHIFT`, `BEBAN`, `TARGET`, `HARGA_LOG`, `KELUAR`, `TERIMA`, `REKAP`, `BATAL`) and installs four time-based triggers (`rekapHarian` @21:00, `kirimPOMalam` @23:00, `hitungRingkasLoka` @20:00, `cekHarianKas` @07:00). `onOpen()` builds the spreadsheet's custom menu. `_sheet`, `_headerStyle` are small persistence/formatting helpers.

## 1.4 Web App Entry (lines 674–724)

| Function | Public? | Responsibility | Type |
| --- | --- | --- | --- |
| `doGet()` | **public** (web app entrypoint) | Serves `Index.html` | Rendering (server-side template evaluation only) |
| `ambilKonfigurasi(pin)` | **public** | Returns the client's initial bootstrap payload: user, active preparer list, destinations, both item catalogs, today's shipments | Business logic + data assembly |
| `segarkanKiriman(pin)` | **public** | Refresh just today's shipment list | Data assembly |
| `_bacaMaster(nama)` | private | Read a catalog sheet, attach formatted price strings | Business logic (formatting) |

## 1.5 Shipment ID Generation (lines 810–873)

`_kodeTujuan`, `_buatIdKirim`, `_cariKiriman` — generates a deterministic shipment ID (`YYYYMMDD-UNIT-DEST-Rn`, with an alphabetic suffix for same-day collisions) and looks one up by scanning `KELUAR` **from the end** (v2.1 change, for performance). This ID-generation logic is exactly what `Migrasi.gs` and `Code.gs`'s own `_migrasiIdKirim` both separately try to repair after the fact — see §1.9 (Duplicated Logic).

## 1.6 Barang Keluar / Batalkan Kiriman (lines 877–1007)

| Function | Public? | Responsibility | Type |
| --- | --- | --- | --- |
| `simpanKeluar(pin, payload)` | **public** | Validate, detect a duplicate submission within 15 minutes (`AMBANG_KEMBAR`), write rows to `KELUAR`, generate a WhatsApp-ready surat jalan text | Business logic + persistence |
| `batalkanKiriman(pin, idKirim, alasan)` | **public** | OWNER-only, today/yesterday-only cancellation — moves the rows to sheet `BATAL` before deleting from `KELUAR`, cascades delete into `TERIMA` | Business logic + persistence (with its own audit trail) |

## 1.7 Confirm Receipt (lines 1011–1168)

`ambilRincianKirim`, `simpanTerima` (both public) — confirm receipt against a shipment, computing per-item discrepancies (`kirim` vs `terima`) inline. `riwayatHariIni(pin)` (public) — today's shipment history, **filtered to the caller's own submissions unless OWNER** (a real, working row-level access rule, not just a screen-level one).

## 1.8 Pricing (lines 1170–1261)

`simpanHarga(pin, payload)` (public) — updates `MASTER` or `MASTER_CK`, writes to `HARGA_LOG`, flags >15% changes, emails a summary (`_kabarHarga`). Business rule embedded here: a Central Kitchen item's `Sumber Harga` flips from `CEK` to `CK` automatically the moment its price becomes non-zero — the mechanism by which the 100+ zero-priced CK items (ADR-0003 §2) get resolved one at a time.

## 1.9 Management / "Kelola" (lines 1263–1430)

`tambahBarang`, `tambahOrang` (auto-generates a unique 4-digit PIN), `nonaktifkanOrang` (soft-disable, never deletes), `catatBeban` (OWNER-only; **this is the function that makes `_bebanBulan()` — and therefore Net Profit — computable at all**). All public, all OWNER/role-gated via `_boleh`.

## 1.10 PO Malam Sederhana Jaya 4 (lines 1432–1612)

Reads a **completely separate external spreadsheet** (`ID_TOTALAN_SJ4`) by scanning for a date-block pattern, and emails a formatted purchase-order with WhatsApp deep-links to named recipients (`PENERIMA_PO = ['Aditya', 'Teh Dede', 'Mas War']`). `kirimPOMalam` runs nightly at 23:00 via trigger.

## 1.11 Dashboard Owner (lines 1614–2021) — the largest, richest business-logic block in the whole file

| Function | Public? | Responsibility | Type |
| --- | --- | --- | --- |
| `_folderLokaJson`, `hitungRingkasLoka`, `_simpanRingkas`, `hitungLokaDariApp`, `hitungLokaMenu` | mixed | Locate the newest `loka-YYYY-MM-DD.json` in a Drive folder, parse it, cache the computed summary in a single spreadsheet cell (`CACHE_LOKA`), truncating `grafik`/`piutang` if the JSON exceeds ~48KB | Infra + business logic |
| `_olahLoka(D, namaFile)` | private | **The single largest business-logic function found.** Computes, from raw Loka JSON: today/month revenue+profit+transaction count, per-day and per-customer rollups, `stokMenipis` (low-stock, ≤5 days runway), `piutang` (outstanding, status=PENDING), `nilaiStok` (inventory value), **GMROI**, **inventory turnover (`putaran`)**, **DIO**, **DSO**, **cash cycle (`siklusKas`)**, **dead stock (`stokMati`, `nilaiStokMati`)**, **category-level margin**, **customer-level margin**, **Sederhana-Jaya customer concentration** (explicitly excluding "Dapur" from the SJ grouping as of v2.1, with a stated reason) | **Business logic — extensive** |
| `_targetUnit(unit)` | private | Read the monthly profit target per unit from sheet `TARGET` | Business logic |
| `_bebanBulan(bulan)` | private | Sum sheet `BEBAN` for the given month; **returns 0 for "not yet recorded," which the caller must not treat as "zero expenses"** — this exact distinction is the fix for the Gross/Net mislabeling bug this repository already found independently | Business logic |
| `dashboard(pin)` | **public** | Assembles the entire owner dashboard payload: today's KPIs, an 8-item action list (`tindak`) prioritized worst-first, the `target` block with the `labaKotorBulan`/`labaBersihBisaDihitung` guard already confirmed in prior audits | Business logic + data assembly |

## 1.12 Central Kitchen (lines 2023–2158)

`_tabRekapSJ4`, `_ringkasCK`, `_statusHargaCK`, `dashboardCK` (public). Reads yet another **separate external spreadsheet** (`ID_BUKU_SJ4`, Teh Nurul's own "buku biaya" sheet) by scanning cell contents for the literal text "Central Kitchen" to locate the right column and tab — a genuinely fragile lookup strategy the code itself does not claim is anything else. Computes CK revenue-from-SJ4, daily rollup, price-completion stats, and explicitly states in its own action list that CK profit **cannot** be computed at all (only inbound revenue to one branch is visible).

## 1.13 Tutup Shift (lines 2160–2549)

| Function | Public? | Responsibility | Type |
| --- | --- | --- | --- |
| `_dompetBerlaku(tgl)`, `_tglTeks` | private | Which wallets are in effect for a given date (`DOMPET`'s validity-range columns) | Business logic |
| `dataShift(pin)` | **public** | Returns opening cash — **confirmed here directly in the source**: `kasAwal = kasKasirAwal + brankasAwal`, i.e. the asymmetry bug already found by this repository (`SPEC-tutup-shift-v2.md`) is fixed in this candidate version exactly as `TutupShiftV2.gs` proposed | Business logic |
| `_folderBukti`, `simpanFotoShift`, `simpanFotoShiftBanyak` | mixed | Drive folder-per-month photo storage; the "many" variant batches all shift photos into one upload (the fix for slow-connection failures already documented) | Infra/persistence |
| `simpanTutupShift(pin, payload)` | **public** | **Recomputes `kasAwal` server-side from `dataShift(pin)` again**, explicitly not trusting the client's copy — validates the 3-step procedure checklist, computes `seharusnya`/`selisih`/`status`, requires a note if the variance exceeds `BATAS_SELISIH`, records `Saldo Brankas Awal`/`Tanggal Setor Fisik`/`Referensi Mutasi`/`Status Setoran` (the new v2.1 columns) | Business logic + persistence |
| `_jenjangSetoran(brankasAkhir)` | private | Three-tier cash-deposit policy (A/B/C) — **this exact logic is duplicated client-side, see §1.9 Duplicated Logic** | Business logic |
| `_kabarShift`, `cekHarianKas`, `setBrankasMenu` | mixed | Email alerting on variance; a daily 07:00-triggered check for stale/unverified deposits; a manual one-time "set the true opening safe balance" tool | Business logic + infra |

## 1.14 Master Data (lines 2551–2622)

`_perbaikiMasterUmum`, `perbaikiMaster`, `perbaikiMasterCK` — reconciles the hardcoded `MASTER_ITEM`/`MASTER_CK` arrays against the live sheet, preserving any price a human already entered and any item a human already added (tagged `TAMBAHAN`), never silently overwriting real data with the hardcoded defaults.

## 1.15 Daily Recap (lines 2624–2736)

`rekapHarian` (21:00 trigger), `_tulisRekap`, `_kirimAlarm`, `rekapSekarang` — reconciles `KELUAR` against `TERIMA` for the day, replaces (not appends) that day's rows in `REKAP`, emails a discrepancy alert.

## 1.16 Shipment-ID Migration (lines 2738–2809) — see §1.9, duplicated with `Migrasi.gs`

## 1.17 Shared Helpers (lines 2813–2880)

`_bacaHari`, `_tglString`, `_angkaTeks`, `_rp` (Rupiah formatting), `_wa` (phone normalization to `62...`), `_nomorOrang`, `_teksSuratJalan`. Small, reused across nearly every section above.

## 1.18 `Migrasi.gs` (full file)

A **second, independent** shipment-ID repair tool. Groups `KELUAR` rows by `(date, unit, original destination, rit)`, generates a new deterministic ID per group, and — critically — for `TERIMA` rows, only auto-fixes an ID when exactly one candidate group matches; anything ambiguous is reported for a human decision (`raguTerima`) rather than guessed, and anything with no match at all is reported separately (`yatimTerima`) rather than silently dropped. This is materially more careful than `Code.gs`'s own equivalent — see the finding below.

## 1.19 `Index.html` (full file) — Rendering + Client-Side Logic

**Pure rendering** (the large majority of the file): all CSS; all `render*`/`gambar*` functions that build innerHTML strings from server-returned data (`renderBeranda`, `render` for Barang Keluar, `renderTerima`, `renderHarga`, `renderKelola`, `renderCK`, `renderDash`, `renderShift`); `panggil()`, a `google.script.run` wrapper adding a client-side timeout with a real user-facing message (rather than an indefinite hang) — a genuinely good, non-trivial reliability pattern worth preserving in spirit.

**Business logic embedded client-side** (not merely rendering — see §1.9 for why this matters):
- `hitung()` (line 628) — live total for Barang Keluar (`qty × harga`), previewed before `simpanKeluar()` is called.
- `hitungHarga()` (line 826) — live count of pending price changes and a >15% "check again" flag, previewed before `simpanHarga()`.
- `hitungShift()` (line 1519) — **the single largest client-side business-logic function**: recomputes `seharusnya = kasAwal + jual − keluar − keluarDompet`, `selisih = sisa − seharusnya`, and the full three-tier deposit-policy message (A/B/C), for live preview before `simpanTutupShift()` is called server-side with the authoritative recomputation.
- `kecilkan()` (line 1473) — client-side JPEG downscaling (canvas-based, max 1400px, quality 0.72) before upload. Not "business logic" in the financial sense, but genuine, non-trivial logic that would need a real replacement, not just a rendering port.

## 1.20 Duplicated Logic — Confirmed Findings

| Finding | Evidence | Severity |
| --- | --- | --- |
| **Two independent shipment-ID repair implementations** | `Code.gs`'s `_migrasiIdKirim()` (line 2747, simple pattern substitution) and `Migrasi.gs`'s `_migrasiId()` (line 17, group-based with ambiguity detection) are **different algorithms**, yet `Code.gs` (line 2744–2745) and `Migrasi.gs` (line 1–2) **both define public functions literally named `migrasiIdKirimUjiCoba()` and `migrasiIdKirimJalankan()`.** Apps Script's flat cross-file namespace means one silently overwrites the other at deploy time — **which one currently wins is UNKNOWN from source inspection alone**; it depends on file evaluation order, which this audit cannot determine without live access to the deployed project. | **High** — this is not a style issue, it is two different data-repair behaviors with only one actually reachable, and no indication in either file that the other exists. |
| **Cash-deposit tier logic (A/B/C) duplicated** | Server: `_jenjangSetoran()`, `Code.gs` lines 2404–2428. Client: inline `if`/`else if` in `hitungShift()`, `Index.html` lines 1536–1550. Same three thresholds, same three messages, written twice in two languages. | Medium — server recomputes authoritatively at save time, so this is a live-preview duplication, not a correctness bug, but a formula change requires editing two places to stay consistent. |
| **Rupiah formatting duplicated verbatim** | `_rp()` (`Code.gs` line 2839) and `rp()` (`Index.html` line 368) are textually identical implementations. | Low. |
| **Shift/expense/total live-preview calculations duplicated** | `hitung()`, `hitungHarga()`, `hitungShift()` in `Index.html` each recompute a subset of what the corresponding `simpan*()` function in `Code.gs` computes authoritatively. | Low–Medium — standard optimistic-UI pattern, but each is a second place the same arithmetic must stay correct. |

---

# 2. Mapping to Enterprise OS Architecture

Per function group, not every individual private helper (which would triple this document's length without adding decision value) — grouped exactly as Section 1 above, so each row is traceable back to its inventory entry.

| Group | Decision | Reason |
| --- | --- | --- |
| Identity & Permission (§1.2) | **REFACTOR** | The PIN-based auth and role→screen map are real, working authorization logic that Enterprise OS has no replacement for yet (`src/dataset/roles.js`'s `visibilityScope` is schema, not enforcement). Keep the *behavior*, but it needs a real security review before being trusted as the system's actual access boundary — it was never designed to be one on a hostile network (`access: ANYONE` in the manifest, per §0). |
| Setup / triggers (§1.3) | **KEEP** (in Apps Script) | This is Buku Toko/Sheets infrastructure, not a canonical-data or dashboard concern. Nothing in Enterprise OS replaces spreadsheet provisioning. |
| Web app entry / `ambilKonfigurasi` (§1.4) | **KEEP**, with a caveat | Apps Script remains the operational tool per ADR-0003 §3 — this isn't dashboard logic, it's the actual data-entry app's own bootstrap. |
| Shipment ID generation (§1.5) | **REFACTOR** | Real, load-bearing logic with a confirmed history of bugs (the `SEDERH`-format legacy IDs both migration tools try to fix). Belongs wherever Restock/Goods-Out modeling eventually happens (Implementation Backlog BL-013) — not migrated now, since that canonical entity doesn't exist yet. |
| Barang Keluar / Terima / Batalkan (§1.6–1.7) | **KEEP** (in Apps Script) | This is Buku Toko's own Authoritative Source data (ADR-0003 §3: "Operational records, cash custody, logistics, inventory, catalog"). Not a dashboard concern at all. |
| Pricing (§1.8) | **KEEP**, flag for future MOVE | Price is a Business Service concern per `services/pricing-service.md`, but Buku Toko is still the actual Authoritative Source for it today (Canonical Data Contract §4) — moving the *computation* without first resolving *where price data actually lives* would be premature. |
| Management/"Kelola" (§1.9) | **KEEP** | Operational data entry, not dashboard/reporting. |
| PO Malam SJ4 (§1.10) | **KEEP** | A logistics/communication workflow entirely outside canonical data or dashboard scope. |
| **`_olahLoka()` and everything it computes (§1.11)** | **MOVE**, in stages | This is the largest, highest-value migration target in the entire codebase — GMROI, turnover, DIO, DSO, dead stock, category/customer margin all belong in a Business Service (Inventory Service and Finance Service, per `services/`), reading canonical data, not a Loka JSON export read directly from Drive. **Not moved yet** — none of these figures exist in the current 11-card Dashboard Dataset at all (Implementation Backlog has no item for them). See §5 Phasing. |
| `_bebanBulan()` / `dashboard()`'s target block (§1.11) | **MOVE** | This is Finance Service's Expenses and Gross/Net Profit responsibility, already scoped in `services/finance-service.md` and already partially implemented in `src/reporting/cards.js` — the migration target already exists in code, just not yet fed by this Apps Script's own `BEBAN` sheet. |
| Central Kitchen dashboard (§1.12) | **REFACTOR then MOVE** | The external-spreadsheet-scanning lookup (`_tabRekapSJ4`) is fragile by the code's own admission and should not be ported as-is. Central Kitchen's Authoritative Source is unresolved (Production Architecture §10) — this cannot MOVE until that's decided. |
| Tutup Shift (§1.13) | **KEEP** (in Apps Script), computation **REFACTOR** candidate | Cash custody is Buku Toko's Authoritative Source (ADR-0003 §3) — the *recording* stays. The `kasAwal`/`selisih`/`_jenjangSetoran` *calculations* are exactly the kind of thing Finance Service should eventually own and expose back to Apps Script as a read, per `services/finance-service.md`'s own Cash entity scope — not attempted now, since Cash has no canonical source at all (dashboard-v2-implementation-plan.md §3.4). |
| Master Data reconciliation (§1.14) | **KEEP** | Catalog upkeep tooling, not a dashboard concern. |
| Daily Recap (§1.15) | **KEEP** | Operational reconciliation between two Buku Toko sheets, not canonical/dashboard. |
| Shipment-ID migration tools (§1.16, §1.18) | **REMOVE the duplicate, KEEP one** | Per Finding in §1.20 — this is not a migration-to-Enterprise-OS decision, it is a pre-existing Apps Script bug this audit found. **Not fixed here** (out of scope, no code changes permitted this sprint) but flagged as the single most concrete, immediate finding in this whole report. |
| `Index.html` rendering (§1.19) | **REFACTOR** (eventually replaced, not migrated) | Per `architecture/dashboard-frontend-architecture-v1.md`, the future frontend consumes Dashboard Dataset v1 directly — this HTML/CSS/client-JS is not something to "move," it is what gets replaced once Phase 3 (§5) is reached. |
| Client-side duplicated calculations (§1.9 items) | **REMOVE** (eventually), not now | Once the authoritative figure comes from a Business Service via the Dashboard Dataset, a client-side shadow calculation has no reason to exist — but removing it before that dependency exists would remove real, working live-preview UX for no gain. |

---

# 3. Migration Matrix

```
Old Apps Script function                Business Service              Dashboard Dataset field         Frontend
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
_bebanBulan()                     ->    Finance Service         ->     dashboardCards["expenses"] ->   Card Detail
dashboard().target.labaKotorBulan ->    Finance Service         ->     dashboardCards["gross-profit"]->Dashboard Home
dashboard().target.labaBersihBulan->    Finance Service (BLOCKED)->    dashboardCards["net-profit"] ->  Dashboard Home
                                         (no confirmed formula exists — see Business Rules Catalog FIN-008;
                                          this Apps Script DOES compute it when beban>0, which is itself
                                          worth noting as a candidate formula for a future Finance Service
                                          decision — not adopted silently by this plan)
_olahLoka().hariIni / bulanIni     ->    Sales Service           ->     dashboardCards["todays-revenue",
                                                                         "transaction-count"]        ->  Dashboard Home
_olahLoka().nilaiStok              ->    Inventory Service       ->     dashboardCards["inventory-value"]->Dashboard Home
_olahLoka().gmroi / putaran /
  dio / dso / siklusKas            ->    Inventory Service + Finance Service (NEW capability,
                                          not in the current 11 cards or Business Rules Catalog at all) ->
                                                                         (none yet — see Gap below)     -> (none yet)
_olahLoka().stokMati / stokMenipis ->    Inventory Service       ->     dashboardCards["stock-alerts"]
                                                                         (currently UNKNOWN, blocked on
                                                                         Implementation Backlog BL-012)  -> Warnings & Issues
_olahLoka().kategori / pelanggan   ->    Finance Service + Customer Service (NEW capability, not in the
                                          current 11 cards)         ->  (none yet — see Gap below)       -> (none yet)
_olahLoka().piutang / piutangTotal ->    Finance Service         ->     dashboardCards["outstanding-
                                                                         receivables"] (currently UNKNOWN,
                                                                         blocked on BL-006)              -> Warnings & Issues
dataShift() / simpanTutupShift()   ->    Finance Service (Cash — no canonical source exists at all) ->
                                                                         dashboardCards["cash-in-hand",
                                                                         "safe-cash"] (UNKNOWN by design)-> Warnings & Issues
_ringkasCK() / dashboardCK()       ->    (No Business Service — Central Kitchen Authoritative Source
                                          unresolved, Production Architecture §10)                       -> (none)
```

**Gap this matrix surfaces, stated plainly:** `_olahLoka()`'s GMROI, inventory turnover, DIO, DSO, cash cycle, category margin, and per-customer margin have **no destination anywhere in the current Dashboard Dataset v1 schema, the 11 documented cards, or the Business Rules Catalog.** This is not a migration-sequencing gap — it is a genuine capability this Apps Script has that Enterprise OS has not yet been asked to reproduce. Whether it should be is a business decision, not something this migration plan decides.

---

# 4. Business Logic Still in Apps Script (Inventoried, Not Moved)

Per this sprint's explicit instruction — named here, left exactly where it is.

- **Profit/margin calculation**: `_olahLoka()`'s `laba`, `margin`, per-category and per-customer margin (`Code.gs` lines 1740–1825).
- **Inventory economics**: GMROI, `putaran`, `dio`, `dso`, `siklusKas` (lines 1791–1797).
- **Dead-stock / low-stock detection**: `menipis` (≤5-day runway heuristic, line 1775), `mati` (no sales this month + value ≥ Rp100,000, line 1799).
- **Expense aggregation**: `_bebanBulan()` (lines 1874–1885).
- **Cash reconciliation arithmetic**: `seharusnya`/`selisih` in both `simpanTutupShift()` (line 2357) and its client-side preview `hitungShift()` (`Index.html` line 1529).
- **Cash-deposit tiering**: `_jenjangSetoran()` (lines 2404–2428) and its client duplicate.
- **Parsing**: Loka JSON parsing in `_olahLoka()`'s input handling; PO block-parsing by scanning cell text for a date pattern (`_bacaPO`, lines 1479–1524); Central-Kitchen column lookup by scanning for the literal text "Central Kitchen" (`_tabRekapSJ4`, lines 2034–2050).
- **Lookup**: shipment lookup by ID (`_cariKiriman`, scanning from the end of the sheet); person lookup by PIN (`_siapa`); duplicate-submission lookup within a 15-minute window (`simpanKeluar`'s `AMBANG_KEMBAR` check).
- **Filtering**: today-only filtering (`_bacaHari`, `_daftarKirimHariIni`), own-submissions-only filtering for non-OWNER roles (`riwayatHariIni`), CANCELLED-invoice exclusion (`_olahLoka`'s `inv` filter, line 1731 — note this is a **different** exclusion rule than the canonical prototype's own status handling, which keeps CANCELLED invoices and marks the inclusion question UNKNOWN per Business Rules Catalog SAL-004 — **this Apps Script has already made a decision the canonical side has not**, worth surfacing to whoever eventually resolves SAL-004).

---

# 5. Migration Phase Order

**Phase 1 — Rendering stays in Apps Script; business logic starts reading the Dashboard Dataset.**
Scope: `dashboard(pin)`'s output for the figures that already exist in the real Dashboard Dataset today — Gross Profit, Expenses, Transaction Count, Inventory Value — is replaced with a read from `dashboard-dataset.json` (or a live equivalent) instead of `_olahLoka()`/`_bebanBulan()` recomputing them. `Index.html`'s rendering is untouched. This directly closes the exact duplication Production Architecture §2 already named as a defect (`_bebanBulan()`/`_olahLoka()` computing what a Business Service should own).
**Not in Phase 1:** GMROI, turnover, DIO/DSO, dead stock, category/customer margin, Central Kitchen — none of these have a Business Service destination yet (§3 Gap).

**Phase 2 — Business Services take over the remaining calculations that have a real destination.**
Scope: Cash/Tutup Shift computations move to Finance Service once Cash gains a canonical source (currently none — dashboard-v2-implementation-plan.md §3.4/§3.5). Outstanding Receivables moves once `InvoiceDebt` is extracted (Implementation Backlog BL-006). Stock Alerts moves once `stockAlert`/`expiryAlert` fields are mapped (BL-012). Shipment-ID generation is resolved (duplicate removed — §1.20) as a prerequisite for any Goods-Out entity work.

**Phase 3 — Apps Script becomes a renderer only.**
Scope: `Index.html` is replaced by the Frontend Architecture already specified (`architecture/dashboard-frontend-architecture-v1.md`), consuming Dashboard Dataset v1 exclusively. Apps Script's remaining role is exactly what ADR-0003 §3 already assigns it — the Authoritative Source for operational records (Barang Keluar/Terima, Tutup Shift entry, pricing entry) — never a place where a dashboard figure is computed.

**Explicitly not sequenced by this plan:** GMROI/turnover/DIO/DSO/category-margin/customer-margin/Central-Kitchen migration — these require a business decision (does Enterprise OS need to reproduce them at all) this plan does not make.

---

# 6. Risk List

| Risk | Description | Severity |
| --- | --- | --- |
| **Output change** | Any Phase 1 swap (Apps Script computation → Dashboard Dataset read) risks producing a different number than `_olahLoka()` currently would, especially since `_olahLoka()` excludes CANCELLED invoices while the canonical pipeline's own inclusion rule is UNKNOWN (§4) — these could disagree on Transaction Count and Revenue specifically. | High |
| **Formula change** | `_bebanBulan()`'s "0 means not-yet-recorded" convention must be preserved exactly — a naive migration could silently treat 0 as "genuinely zero expenses," reintroducing the exact bug this whole project already fixed once. | High |
| **Performance** | `BATAS_BACA = 2000` and the CACHE_LOKA single-cell cache are real, deliberate performance fixes for Sheets' own read limits — a Business Service reading canonical JSON doesn't have this constraint, but the *reverse* direction (Apps Script needing to fetch a Dashboard Dataset over the network per Phase 1) introduces a new, different performance profile that hasn't been measured. | Medium |
| **Cache** | `CACHE_LOKA` (one spreadsheet cell, truncated at ~48KB) and `CacheService`'s 5-minute `PETA_TERIMA` cache are both real, working mechanisms with real failure modes already handled in the source (JSON parse failure, cache-put size limit) — any migration must not lose this resilience, not just the happy path. | Medium |
| **Refresh** | The four time-based triggers (21:00, 23:00, 20:00, 07:00) assume a single spreadsheet-bound execution context — a Business Service's own refresh cadence (dashboard-v2-implementation-plan.md §7) is a separate, not-yet-reconciled schedule. | Medium |
| **Permission** | `appsscripts.json`'s `"access": "ANYONE"` combined with PIN-only auth (no rate-limit beyond the 8-try lockout, no HTTPS-independent protection beyond what Apps Script itself provides) is a real, existing exposure this migration does not fix and must not accidentally widen. | High |
| **Rollback** | No version-controlled deployment history exists for this Apps Script project outside this Drive folder — Data Governance Framework §8 already names this as an open gap ("Apps Script's own logic has no confirmed backup or version history"). A failed migration step has no confirmed rollback path today. | High |
| **The Migrasi.gs / Code.gs duplicate-function bug (§1.20)** | Independent of migration — this is a pre-existing defect. Whichever implementation currently wins is unverified; migrating *either* one without first determining which is actually live risks preserving the wrong one, or "fixing" a repair tool that was never actually reachable. | High |

---

# 7. Open Questions

**UNKNOWN — not determinable from source inspection alone:**
- Whether this v2.1 candidate (`Code.gs`, `Index.html`) is actually deployed live, partially deployed, or still fully pending — its own header says "never run."
- Which of `Code.gs`'s or `Migrasi.gs`'s `migrasiIdKirimUjiCoba`/`migrasiIdKirimJalankan` definitions actually wins at deploy time.
- Whether `_olahLoka()`'s exclusion of CANCELLED invoices (line 1731) should become the canonical pipeline's own answer to Business Rules Catalog SAL-004, or whether the two are allowed to diverge intentionally.
- Whether Enterprise OS is expected to eventually reproduce GMROI/turnover/DIO/DSO/category-margin/customer-margin at all — no prior document names these as required capabilities.

**Assumptions this plan made, stated explicitly:**
- That "currently used" (per this sprint's own framing) should be read as "the most recent candidate source available," given the explicit uncertainty about live deployment status — not as a claim that every function below is confirmed running in production today.
- That the Migration Matrix's Business Service assignments (§3) follow the same ownership already established in `services/*.md`, without re-deciding any of them.

No `Code.gs`, `Migrasi.gs`, `Index.html`, or `appsscripts.json` was modified. No new code, Business Service implementation, or Dashboard Dataset field was created. Nothing was committed.
