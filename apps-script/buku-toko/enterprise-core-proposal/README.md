# Enterprise Core Proposal — NOT DEPLOYED, NOT TESTED

This folder is a proposed internal-service refactor of Buku Toko's production `Code.gs` (v2.1, 30 Jul 2026 — the live file at `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\Code.gs`).

**Nothing here has touched the live file. Nothing here has been executed.** I have no way to run or deploy Apps Script from this environment — every line below was moved by careful, verbatim, line-by-line transcription of the real production source, not regenerated or rewritten from memory.

**Status: all 12 files written.** Coverage verified mechanically against the live source: all 89 functions present exactly once (zero missing, zero invented, zero duplicated within this proposal — cross-checked with `comm` against a fresh read of the live `Code.gs`), all 32 top-level `var` constants present exactly once. This has NOT been reviewed function-by-function for silent logic drift — that review, plus manual testing in a copy of the spreadsheet, is still the CEO's to do before anything touches production.

## What this is

Buku Toko's 89 functions, currently one 2,880-line `Code.gs`, reorganized into 12 files that share one Apps Script project (exactly like the live project already does with `Code.gs` + `Migrasi.gs` today — this is not a new capability, it's the existing multi-file-one-project pattern applied more deliberately). Every function's **logic is unchanged** — this is code motion, not rewriting. Global `var` declarations remain global and visible across all files, exactly as they already are between `Code.gs` and `Migrasi.gs`.

## What this is not

Not deployed. Not tested. Not a replacement for anything. Not smaller in scope than the original — same functions, same behavior, same 8 users' daily workflow, unchanged.

## Before this ever goes near production

1. Open every file below side by side with the live `Code.gs` and confirm, function by function, that nothing changed except which file it lives in.
2. Test in a copy of the spreadsheet first — never the live one.
3. Only then consider pasting into the real Apps Script project.

## One known issue this refactor does NOT fix

`Migrasi.gs` and `Code.gs` (live) both define `migrasiIdKirimUjiCoba()`/`migrasiIdKirimJalankan()` — with different logic. This was already flagged in `implementation/appsscript-migration-plan.md` and `production-system-crosswalk-v1.md`. `10-MigrationService.gs` below preserves `Code.gs`'s exact current version, unchanged — it does not silently pick a winner between the two, because that would be a behavior decision, not a reorganization. See that file's own header comment.

## File map

| File | Service | Functions moved (verbatim) |
|---|---|---|
| `00-ConfigurationService.gs` | Configuration | All top-level constants |
| `01-AuthenticationService.gs` | Authentication | `_siapa`, `_unitBoleh`, `_menuPeran`, `_boleh`, `_samarkanPin`, `_cekKunciPin`, `_catatPinSalah`, `masuk`, `_sapaan` |
| `02-OperationalEventService.gs` | Operational Event (audit trail) | `_catatAkses`, `_bacaHari` |
| `03-PeopleService.gs` | People | `tambahOrang`, `nonaktifkanOrang`, `_nomorOrang` |
| `04-InventoryService.gs` | Inventory / Catalog | `_bacaMaster`, `tambahBarang`, `simpanHarga`, `_kabarHarga`, `perbaikiMaster`, `perbaikiMasterCK`, `perbaikiMasterCKMenu`, `perbaikiMasterMenu`, `_perbaikiMasterUmum`, `_statusHargaCK` |
| `05-DeliveryService.gs` | Delivery / Logistics | `_petaTerima`, `_buangCacheTerima`, `_semuaKeluar`, `_daftarKirimHariIni`, `_kodeTujuan`, `_buatIdKirim`, `_cariKiriman`, `simpanKeluar`, `batalkanKiriman`, `ambilRincianKirim`, `_hapusTerima`, `simpanTerima`, `riwayatHariIni`, `_isiUlangTujuanTerima`, `rekapHarian`, `_tulisRekap`, `_kirimAlarm`, `rekapSekarang`, `_teksSuratJalan` |
| `06-CashService.gs` | Cash | `_dompetBerlaku`, `_tglTeks`, `_folderBukti`, `_jenjangSetoran`, `cekHarianKas`, `setBrankasMenu` |
| `07-ShiftService.gs` | Shift | `dataShift`, `simpanFotoShift`, `simpanFotoShiftBanyak`, `simpanTutupShift`, `_kabarShift` |
| `08-ReportingService.gs` | Reporting | `_folderLokaJson`, `_ringkasLoka`, `hitungRingkasLoka`, `_simpanRingkas`, `hitungLokaDariApp`, `hitungLokaMenu`, `_num`, `_tglDariMs`, `_olahLoka`, `_targetUnit`, `_bebanBulan`, `catatBeban`, `dashboard`, `_tabRekapSJ4`, `_ringkasCK`, `dashboardCK` |
| `09-CommunicationService.gs` | Communication (PO/WhatsApp) | `kirimPOMalam`, `kirimPOSekarang`, `_bacaPO`, `_teksPO`, `_kabarPO`, `_wa` |
| `10-MigrationService.gs` | Migration (maintenance) | `migrasiIdKirimUjiCoba`, `migrasiIdKirimJalankan`, `_migrasiIdKirim` |
| `11-SharedUtils.gs` | Shared utilities | `_sheet`, `_headerStyle`, `_tglString`, `_angkaTeks`, `_rp` |
| `Code.gs` | App shell / entry point | `doGet`, `onOpen`, `setup`, `ambilKonfigurasi`, `segarkanKiriman` |
| `appsscripts.json` | Manifest | unchanged copy |
