# ADR-0003 — Canonical Data Platform for Loka POS

| | |
| --- | --- |
| **Status** | **Diterima — dengan amandemen 1 Agustus 2026** |
| **Date** | 31 July 2026 |
| **Accepted** | 1 Agustus 2026 — CEO (Aditya) |
| **Proposed by** | Claude (agent), on behalf of no one — CEO decides |
| **Relates to** | [ADR-0001](0001-github-authoritative-notion-mirror.md) (repo as source of truth for docs/code) — this ADR extends the same principle to operational data. [ADR-0002](0002-dana-ibu-adalah-modal-bukan-hutang.md) unaffected. |

---

## Amandemen 1 Agustus 2026 — Revisi sebelum diterima

Dua koreksi yang ditetapkan CEO sebelum ADR ini diterima. Isi §1–§6 di bawah tetap berlaku kecuali yang secara eksplisit diubah di sini.

### Koreksi 1 — Buku Toko adalah Enterprise OS, bukan sekadar consumer

Versi awal ADR ini menempatkan Buku Toko sebagai salah satu dari banyak consumer canonical layer, setara dengan dashboard dan agen AI. **Ini salah.**

Buku Toko adalah **Enterprise OS** — sistem operasional grup yang akan berkembang dari Apps Script ke aplikasi yang lebih lengkap sesuai kebutuhan operasional nyata, dengan model pertumbuhan seperti Odoo: fitur muncul dari masalah operasional yang terbukti, bukan dari roadmap fitur.

Konsekuensi arsitektur:
- Canonical layer bukan hanya feed ke Buku Toko — Buku Toko **adalah** tujuan utamanya. Semua consumer lain (AI agents, n8n, laporan) adalah turunan.
- Schema canonical harus dirancang untuk melayani sistem operasional yang tumbuh, bukan untuk dibaca oleh spreadsheet. Artinya lebih dekat ke data model relasional daripada flat JSON export.
- Consumer Isolation Principle menjadi lebih kritis, bukan lebih longgar: saat Buku Toko berevolusi dari Apps Script ke web app, canonical layer tidak boleh ikut berubah — ini yang memungkinkan migrasi runtime tanpa kehilangan data.
- **Runtime Apps Script adalah implementasi saat ini, bukan arsitektur final.** Keputusan teknologi Apps Script tidak perlu dipertahankan hanya karena sudah jalan — tapi juga tidak perlu diganti sebelum ada kebutuhan operasional yang membuktikannya kurang.

Revisi table authoritative sources:

| Authoritative Source | Authoritative for |
| --- | --- |
| **Loka POS** | Transaksi penjualan retail |
| **Buku Toko (Enterprise OS)** | Operasional grup: logistik, kas, shift, katalog, piutang, hutang — dan semua yang akan ditambahkan seiring tumbuh |
| **GitHub Repository** | Kode, ADR, dokumentasi, spesifikasi, automation |

### Koreksi 2 — Loka `Expense` adalah satu-satunya sumber beban operasional

Sheet `BEBAN` di Buku Toko **belum pernah digunakan** dan bukan sumber data nyata. Loka `Expense` entity adalah sumber otoritatif untuk seluruh pencatatan beban operasional.

- Sheet `BEBAN` di Buku Toko harus dihapus (CEO yang menghapus — tool tidak bisa hapus dari Sheets).
- `_bebanBulan()` di Apps Script harus membaca dari canonical layer (Loka `Expense`), bukan dari sheet `BEBAN`.
- Ini membuka BL-001 dan BL-002 untuk langsung dikerjakan tanpa keputusan tambahan.

Bukti: prototype `loka-canonical-poc` mengekstrak 45 `Expense` records senilai Rp18.517.444 dari backup 30 Jul — data ini sudah ada di sumber, hanya belum diwiring ke dashboard.

---

---

## 1. Current Architecture

Truth about the business currently lives in five places, with no declared hierarchy between them:

- **Loka POS** — register of record for retail sales. Exports `loka-YYYY-MM-DD.json` + a `.realm` backup to Drive daily.
- **Google Sheet "Buku Toko dan Central Kitchen" + bound Apps Script app** — de facto system of record for inter-unit shipments, cash custody, shift closing, and TSS/CK catalogs. Consumes the Loka export into a cached `Ringkasan` JSON. Productive since 27 Jul, 8 active users.
- **GitHub repo** — source of truth for decisions, roadmap, and SOPs (ADR-0001). Only 1 of an unknown number of Apps Script files has been copied in so far; the rest is reconstructed in `SPEC.md` from observed sheet output, not read from actual code.
- **Notion** — read-only mirror of the repo (ADR-0001), plus separate operational databases (Lead Database, Content Pipeline, KPI Dashboard, Consultation Log) that ADR-0001 explicitly left out of scope and that remain read-write.
- **Ad hoc Excel workbooks** (e.g. `FORM_RESET_TSS_31JULI2026.xlsx`, `KALKULATOR_MARGIN_LANTAI_TSS.xlsx`) — delivered via chat during working sessions, not stored in any system above.

No version-controlled schema or data contract exists. The Apps Script code is container-bound and unreadable via Drive API, so what the sheet contains and what the code actually does can drift without anyone noticing.

## 2. Problems with Current Architecture

- **No declared hierarchy** — five stores, no rule for which one wins when they disagree.
- **Same metric, two answers, no enforcement** — gross margin (`Ringkasan`, from Loka) vs. net margin (manual analysis) are both correct for different questions, but nothing stops them from being conflated.
- **Code isn't reviewable** — audit findings like the shipment-ID bug (`SEDERH` vs `SJ1`–`SJ5`) are inferred from output data, not verified against source, because the code itself isn't in the repo.
- **A canonical-data gap masquerading as a data-entry gap** — 130+ Central Kitchen catalog items at `Harga = 0` mean every report built on CK shipments is wrong by construction, not incomplete.
- **Silent divergence** — the `Rekonsiliasi` sheet stopped updating after 29 Jul with no alert. This is the same failure class ADR-0001 flagged for Notion contradictions, now on financial data.
- **New unversioned copies keep appearing** — each ad hoc Excel workbook is a fresh, disconnected snapshot of numbers that already exist somewhere else.

## 3. Target Architecture

### Authoritative Sources

Each source is authoritative for one domain. These are not interchangeable and not merged into a single "system" — each keeps its own responsibility:

| Authoritative Source | Authoritative for |
| --- | --- |
| **Loka POS** | Sales transactions exported from Loka |
| **Buku Toko** (Google Sheets + Apps Script) | Operational records, cash custody, logistics, inventory, catalog, and business workflows |
| **GitHub Repository** | Source code, ADRs, documentation, specifications, automation scripts, and engineering assets |

### Canonical Data Platform

**Purpose:** provide one normalized operational data layer consumed by applications. Applications never communicate directly with heterogeneous source formats — they read from the canonical layer, not from Loka's export shape, Sheets' structure, or any other source-native format.

Notion dashboards and ad hoc Excel workbooks sit outside this model entirely: they consume the canonical layer, or exist as disposable calculation surfaces — they are never authoritative sources themselves.

### Data Ingestion Architecture

This ADR is not about converting Realm to JSON. It defines the general architecture by which any Authoritative Source is ingested into the Canonical Data Platform. **Realm is the first implemented connector, not the model.**

Future connectors may include, without the architecture itself changing:

- Google Forms
- CSV
- Excel
- WhatsApp
- Marketplace exports
- Banking exports
- APIs
- Other operational systems

Each connector's job is to translate one source-native format into the canonical layer's shape. The chain — source → ingestion connector → canonical layer → consumers — stays the same regardless of which connector is added or replaced.

### Consumer Isolation Principle

Consumer applications (Apps Script, dashboards, automation, AI agents, reports) must never depend on the original source file format. Any source-specific transformation happens only inside the ingestion layer. Changes to a source format must never require changes to downstream applications.

## 4. Migration Strategy

High level only — no implementation steps, no code, no schedule beyond sequencing intent:

1. Write down the current de facto canon (Loka + Buku Toko Sheet) as a formal data contract in the repo, kept current going forward instead of reconstructed after the fact.
2. Bring the Apps Script codebase into the repo incrementally, file by file, so code and data contract stop drifting apart.
3. Retire the one-time Excel workbooks once their purpose (the 31 Jul reset) is served — absorb their durable output into Buku Toko, the authoritative source for operational records, rather than keeping them as parallel files.
4. Resolve the Notion operational-database question (Lead Database, Content Pipeline, KPI Dashboard, Consultation Log) as a separate follow-up ADR — ADR-0001 already deferred it, this one doesn't reopen it.
5. Sequence all of this behind the operational fixes already active (cash-chain integrity, CK pricing) — this ADR formalizes structure, it does not compete with them for CEO time.

## 5. Risks

- **CEO bandwidth is the binding constraint.** Adding platform-consolidation work risks the same one-person bottleneck already flagged in Roadmap v6 and Adendum 1.
- **Code migration can't be automated.** Apps Script stays unreadable via Drive API; every file has to be copied in manually.
- **Declaring a canonical system doesn't fix what's inside it.** CK is still priced at Rp0, the ID-format bug is still open — this ADR fixes *where* truth lives, not whether today's data in it is correct.
- **The live app can't be touched carelessly.** It's used daily by 8 people; any change needs its own explicit sign-off, separate from this ADR.

## 6. Decision

**Proposed:** Loka POS, Buku Toko, and the GitHub repository become the three Authoritative Sources — one per domain (sales, operations, code/decisions/engineering assets). A Canonical Data Platform sits between these sources and all consumer applications, ingesting each source through a dedicated connector (Realm being the first, not the model) and normalizing it into one data layer that applications read from — never the source formats directly. The Consumer Isolation Principle governs this boundary: downstream applications never depend on source-native formats, and format changes never ripple downstream. Notion and ad hoc Excel workbooks are consumers or disposable calculation surfaces, never authoritative sources.

**Status:** Proposed, not accepted. Per the pattern ADR-0001 and ADR-0002 already set — the agent proposes, the CEO decides. This ADR is not binding until the CEO confirms it.

**Explicitly not decided here:** the status of Notion's operational databases, which connectors get built after Realm, and any specific code or schema change — all require their own decision.
