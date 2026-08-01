# Operational Dashboard MVP — Implementation Plan

| | |
| --- | --- |
| **Type** | Implementation planning only. No code, no Apps Script, no architecture redesign. |
| **Date** | 1 August 2026 |
| **Phase** | Operational Delivery — first sprint to reach a real user, not a documentation sprint. |
| **Principle governing every choice below** | Operational Impact First: between improving documentation and reducing operational work inside SMJ, this plan always chooses the latter. Every recommendation below is judged by whether it gets a working dashboard in front of the CEO, Ayu, and Ibu sooner, not by architectural elegance. |
| **Reused, unchanged** | Connector (`src/connector/`), Canonical Dataset, Reporting Service (`src/reporting/`), Dashboard Dataset (`src/dataset/datasetBuilder.js`), Dashboard Schema (`dashboard-schema.json`), Dashboard Contract (`dashboard-contract.md`). None of these are touched, redesigned, or reimplemented by this plan. |
| **Built new, per this plan** | Exactly one thing: the "Dashboard Dataset → Apps Script → User" link, which has never existed until now. |

---

# 1. What Already Exists vs. What Is Missing

The pipeline as given for this sprint:

```
Loka Backup → Connector → Canonical Dataset → Reporting Service → Dashboard Dataset → Apps Script → User
```

**Verified, working, unchanged by this plan** (all confirmed in prior sprints, with passing test suites): Connector extracts and validates a real Loka backup; Canonical Dataset normalizes it; Reporting Service computes the 11 dashboard cards from canonical data only; Dashboard Dataset (`datasetBuilder.js`) assembles the final `dashboard-dataset.json`, structurally enforced to never read Realm, the Connector, or a Business Service directly (`dashboard-contract.md`).

**Never built, and the actual subject of this plan:** the arrow from Dashboard Dataset to Apps Script. `dashboard-dataset.json` is a file produced by running Node.js locally (`node src/index.js`) — it does not yet reach any Apps Script project, any Google Sheet, or any human. Nothing in the existing codebase publishes it, uploads it, or reads it. This is not a gap in the architecture (the Contract is explicit that any future presentation layer should consume this one file, per `dashboard-contract.md` line 3) — it is simply the one connection nobody has built yet. Everything in this plan exists to close exactly that gap, minimally.

**A second, honest fact to carry forward:** of the 11 cards `dashboard-dataset.json` can produce today, **5 have a real computed value** (Today's Revenue, Gross Profit, Transaction Count, Inventory Value, Expenses) and **6 are correctly marked `UNKNOWN` or `blocked`** (Cash in Hand, Safe Cash, Outstanding Receivables, Goods Out, Net Profit, Stock Alerts) — per `prototype/loka-canonical-poc/src/reporting/cards.js` and reconfirmed in `knowledge/business-rule-consolidation-v1.md`. This plan does not wait for the other 6 to be resolved before shipping — see §10.

---

# 2. Apps Script Deployment Architecture

## The decision: a new, separate Apps Script project — not an extension of Buku Toko

Two options exist. This plan recommends the second, for reasons stated plainly rather than assumed.

**Option A — extend the live Buku Toko project** (`Code.gs`/`Index.html`, currently deployed, used daily by 8 people for real cash handling). Would mean adding a new tab/route to an already-large, already-fragile codebase — `implementation/appsscript-migration-plan.md` already found a live duplicate-function-name bug in this exact codebase (`Migrasi.gs` vs. `Code.gs`), evidence that its blast radius is already imperfectly understood. Adding dashboard code here couples a read-only reporting feature to a system that handles live money.

**Option B — a new, standalone Apps Script project, dedicated to the dashboard.** No Sheet binding is required: the dashboard only *reads* one JSON file from Drive, it never reads or writes any Sheet, so a bound-to-Spreadsheet project (Buku Toko's own pattern) is not architecturally necessary here. A standalone script (Apps Script supports these independently of any Sheet) keeps the dashboard's entire footprint isolated from the live operational system.

**Recommendation: Option B.** Zero risk to the live cash-handling system; a broken dashboard deployment cannot affect Buku Toko's own uptime; and it matches this whole project's own established discipline of never modifying a validated, live file without explicit, separate sign-off.

## Structure, reusing Buku Toko's own already-proven patterns exactly

- `doGet()` serves one HTML template (the same single-page-app shape as `Index.html`: a PIN gate, then a tabbed/card view), because that pattern is already proven with real users and there is no reason to invent a new one.
- One server function, e.g. `ambilDashboard(pin)`, does the entire job: authenticate the PIN (§5), read `dashboard-dataset.json` from Drive (§4), filter it by role (§6), and return the filtered object to the client for rendering.
- No write path exists anywhere in this project. It is architecturally incapable of writing to Sheets, Drive, or anything else — the smallest possible attack/failure surface for a first deployment.

## Deployment mechanics

- Deploy via **Deploy → New deployment → Web app**, `executeAs: "USER_DEPLOYING"`, `access: "ANYONE"` — the exact same manifest configuration already confirmed live and working in Buku Toko's own `appsscripts.json`. No new pattern to validate.
- A **fixed deployment** (not the auto-updating "Head" URL) is recommended so the live URL never changes silently mid-use; a new deployment version is created deliberately each time the dashboard code changes, exactly mirroring Buku Toko's own existing release discipline ("Simpan → Deploy → Manage deployments → edit → Deploy" per `Code.gs`'s own header comment).

---

# 3. Google Drive Integration

`H:\My Drive\SMJ ENTERPRISE OS\AppsScript` is confirmed (from direct prior reading) to already be the local-synced staging folder for Buku Toko's own Apps Script source files (`Code.gs`, `Index.html`, `Migrasi.gs`, `appsscripts.json`) — a local editing copy, manually copied into the live Apps Script editor at `script.google.com` (per CLAUDE.md's own standing tool note: Apps Script is container-bound and not readable via the Drive API directly).

**Two separate Drive uses, kept distinct:**

1. **Code staging** — a new subfolder, e.g. `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\Dashboard\`, holding the new project's source files locally, for the same manual-copy-into-script.google.com workflow already in use for Buku Toko. Nothing new here; same proven process, new folder.
2. **Data transport** — a new folder, e.g. `H:\My Drive\SMJ ENTERPRISE OS\Dashboard Data\`, is where the locally-run pipeline (Connector → Canonical → Reporting Service → Dataset Builder) writes its output `dashboard-dataset.json`. Google Drive's own desktop sync client (already relied on for Loka's own backup uploads) carries the file to Drive automatically once written locally — no new sync mechanism to build.

**How Apps Script reads it:** `DriveApp.getFilesByName('dashboard-dataset.json')` (or a fixed file ID cached in `PropertiesService`, exactly mirroring the existing `FOLDER_LOKA_JSON_ID` caching pattern already proven in `Code.gs`'s `_folderLokaJson()`) — read directly, parsed with `JSON.parse()`, on each dashboard request. This is a native, well-understood Apps Script capability; nothing new is being asked of the platform.

**What this plan does not attempt:** automating the Node.js pipeline run itself. Apps Script cannot execute Node.js — there is no workaround for this that does not mean standing up new infrastructure, which this sprint's own instructions explicitly rule out ("do not redesign architecture," and per ADR-0004's Managed-Services-Before-Self-Hosting and ROI-First principles, new infrastructure is not justified for an MVP). The pipeline run stays a manual, human step — see §9 and §10.

---

# 4. Dashboard Update Mechanism

Two distinct refresh layers exist, and this plan states both honestly rather than implying one combined "live" refresh:

**Layer 1 — how new data enters `dashboard-dataset.json` at all.** A human (the CEO, initially) runs `node src/index.js` locally, after a new Loka backup is available — the exact same manual-trigger point ADR-0003 already accepts for Loka's own backup upload ("manual upload, still human," per the Enterprise OS Blueprint §3). This is not a new burden; it is one more step appended to a step that already happens.

**Layer 2 — how the dashboard reflects the latest file.** Every time a user opens or reloads the dashboard, Apps Script reads whatever is currently in the Drive Data Transport folder — there is no caching layer hiding a stale copy (or, if a short `CacheService` TTL is used for performance, it should not exceed a few minutes, mirroring the existing 5-minute `PETA_TERIMA` cache pattern already proven safe in Buku Toko). The user-visible "refresh" action is simply reloading the page.

**Freshness is surfaced, never hidden.** `dashboard-dataset.json` already carries `lastRefresh`, per-card `dataFreshness`, and a `dataLineage` block (per `dashboard-contract.md`) — the dashboard UI's only obligation here is to display these fields as-is (e.g., "Data as of [timestamp]"), exactly matching the "Stale data" handling rule already specified in `implementation/dashboard-v2-implementation-plan.md` §6: a figure is never presented as "today" without its real timestamp attached.

**What this means in practice, stated plainly:** this MVP's refresh cadence is **bounded by how often a human runs the pipeline** — realistically once daily, matching Loka's own backup cadence — not real-time, not automatic. This is a deliberate, accepted scope boundary for the MVP, not an oversight: `research/live-connector-feasibility-v1.md` already established that true real-time access is blocked by Android's own sandboxing model regardless of anything this project builds, so a daily-refresh snapshot is the correct, already-justified starting point, not a compromise awaiting a fix.

---

# 5. Deployment Strategy — Reaching CEO, Ayu, and Ibu on Android and iPhone

**No native app is needed, and none is proposed.** Apps Script web apps are plain HTTPS URLs, rendering identically in any modern mobile browser — Chrome on Android, Safari on iPhone — with zero App Store or Play Store submission. This is not a new bet: Buku Toko's own SOP Barang Keluar rollout already used exactly this mechanism successfully across a mixed-device team (Teh Dede, Teh Nurul, Ayah Iman, Mas War were all instructed to open the URL and "Add to Home Screen," per the Notion archive's own SOP documentation read in the prior sprint) — the same instruction applies here verbatim, to CEO, Ayu, and Ibu.

**Distribution mechanics:**
1. Deploy the web app (§2), obtain its fixed URL.
2. Send the URL to each of the three initial users via WhatsApp — the household's own already-proven communication channel, not a new one.
3. Each user opens the link once in their phone's browser, enters their PIN (§5), and uses the browser's native "Add to Home Screen" (iOS Safari and Android Chrome both support this natively) so the dashboard behaves like an app icon without being one.

**This directly matches an already-recorded CEO preference, not an assumption:** the very first ADR in this repository states the goal as "Notion menjadi mirror read-only. Fungsinya satu: dashboard yang bisa dibaca CEO dari HP" (ADR-0001) — a mobile-phone-first dashboard is not a new idea being introduced here; it is the same, already-stated intent, now actually being built.

---

# 6. Authentication

**Reuse the exact mechanism already proven in Buku Toko**, not a new one: a PIN entered on a gate screen, checked server-side against a roster (`_siapa(pin)`/`masuk(pin)`'s pattern in `Code.gs`), with a brute-force lockout (`MAKS_GAGAL`/`LAMA_KUNCI`) — this is a well-understood, working pattern this plan copies rather than redesigns.

**The roster question — a real decision this plan surfaces, not resolves:**

- **Option A — read Buku Toko's own live `ORANG` sheet, read-only**, via `SpreadsheetApp.openById()` with Buku Toko's sheet ID. Advantage: no second PIN for anyone to remember; CEO and Ayu already have PINs there (confirmed directly from `Code.gs`'s `ORANG_AWAL` roster: Ayu = `9191`, Aditya/CEO = `6060`). Disadvantage: creates a live coupling between the new, isolated dashboard project and the operational sheet — a read is far lower risk than a write, but it is still a dependency this plan flags for explicit sign-off rather than assuming.
- **Option B — a small, independent roster** (a short list in `PropertiesService`, or a tiny dedicated Sheet, holding just the initial 3–6 users). Advantage: total isolation from the live operational system, matching this plan's Option B recommendation in §2. Disadvantage: a second PIN to distribute and remember.

**This plan recommends Option A** (read-only reference to the existing `ORANG` sheet) on balance — the adoption cost of a second PIN for a three-person initial rollout is real, and a read-only `SpreadsheetApp` call carries materially less risk than the write-capable logic §2 already isolates away. This is stated as a recommendation requiring explicit confirmation, not a decision this plan makes unilaterally.

**A concrete, verified gap this plan surfaces directly: Ibu does not currently have a PIN anywhere in the system.** The `ORANG_AWAL` roster (directly read from `Code.gs`) lists Ayu, Teh Dede, Mas Haris, Mas War, Ayah Iman, Sanding, Aditya (OWNER, TSS+CK), and Sri Nurul (OWNER, CK) — Sri Nurul is Central Kitchen's manager ("Teh Nurul"), not Ibu herself; no entry represents Ibu, the CEO's mother and TSS co-capital-owner under ADR-0002. **Ibu must be added as a named user, with her own PIN, before this MVP can serve her at all** — this is listed explicitly in §10's pre-implementation requirements, not glossed over.

---

# 7. Role-Based Visibility

**The schema for this already exists and is reused unchanged**: `dashboard-dataset.json`'s `userRoles` section (built by `src/dataset/roles.js`) already defines 7 named roles with visibility-scope metadata. Per `dashboard-contract.md` itself: *"No authentication of any kind"* is implemented anywhere in the existing pipeline — the schema is metadata only. **This MVP's Apps Script layer is the first place any actual enforcement of this metadata is built** — that is new work this plan scopes, not a redesign of anything that already exists.

**What is already grounded, and can be enforced immediately:**
- **`ceo`** — `visibilityScope: 'all-business-units,all-cards'` (Data Governance Framework §2) → CEO sees all 11 cards, fully, including the honestly-marked `UNKNOWN`/`blocked` ones.
- **`owner-ibu`** — `visibilityScope: 'central-kitchen,finance-cash-cosign'` (ADR-0002, Canonical Data Contract §4/§6) → today's canonical pipeline covers TSS only, and Central Kitchen is `not-onboarded` (`src/dataset/businessUnits.js`), so **Ibu's grounded scope currently has no matching live data to show**. Practically, for this MVP, Ibu would see the same cash-and-finance-relevant cards CEO sees (Cash-cosignatory relevance under ADR-0002), explicitly labeled — not a Central Kitchen view that cannot yet exist.

**What is not yet defined, and this plan does not invent it:** `cashier` (Ayu's role) has `visibilityScope: 'UNKNOWN'` in the existing schema — no document anywhere in this repository defines what a cashier should see on a dashboard. **This plan does not decide that here** — inventing a business rule about Ayu's visibility would violate the same discipline every prior sprint in this project has held to (never invent a business fact; get explicit sign-off on anything touching who sees what). Instead, this plan names the decision the CEO needs to make (§10) and offers one **Future Recommendation, not a decision**: a minimal, low-risk starting scope for `cashier` — today's Transaction Count and Today's Revenue only, the two cards most directly relevant to Ayu's own shift, excluding margin, expense, and inventory-value figures that are not her operational concern and are more sensitive. This is a proposal for the CEO to accept, adjust, or reject — not something this plan implements unilaterally.

---

# 8. Daily Operational Workflow

Each persona's day is described using what this project already knows about them directly — not a generic template.

## CEO (Aditya)

Per the CEO's own words (`knowledge/ceo-knowledge-base.md` §6) and the Notion archive's own Calendar Overview (a "Morning Dashboard Review" recurring calendar block already exists as a named daily habit, per the prior sprint's archive read): the CEO's day already has a natural slot for this. **Morning:** open the dashboard on the phone as the first business action of the day — Today's Revenue and Gross Profit from the prior day, Transaction Count, and any `warnings`/`blockedReasons` surfaced at the top (per `dashboard-contract.md`'s existing fields) give the CEO a single-glance status check before the day's stock-buying, supplier, and pricing decisions begin. **Through the day:** the CEO already performs "Membeli stok ke supplier, Melayani pelanggan, Menentukan kualitas beras, Mengatur pengiriman, Mengelola keuangan, Membuat keputusan bisnis" (CEO's own words) — the dashboard is not inserted into any of these; it informs them before they happen. **Evening/end-of-day:** re-check after the day's Loka data and the manual pipeline run (§4) reflect the day's actual sales — this is also the natural moment to trigger the next pipeline run for the following morning's fresh numbers, folding the one new manual step directly into an already-existing routine rather than adding a separate obligation.

## Ayu (Cashier)

Per the SOP Barang Keluar TSS timeline already documented in this project (Notion archive, prior sprint): Ayu's day begins around 06:30, when she is first able to open Loka and begin the day's transactions; shifts recorded in this project's own data run overnight-adjacent (~23:00–10:30). **Where the dashboard fits, pending the CEO decision in §7:** a brief glance at Today's Revenue/Transaction Count at shift start or shift close — a lightweight check, not a work tool. The dashboard is explicitly **not** where Ayu does Tutup Shift (that stays in Buku Toko, unchanged, per this plan's own out-of-scope boundary) — it is a passive, informational addition to her day, not a new task.

## Ibu

Per ADR-0002 (TSS co-capital-owner, Cash co-signatory) and the CEO's own words (`knowledge/ceo-knowledge-base.md` §6: Ibu "masih cover untuk pembelian stok beras" — she independently handles a real part of stock purchasing today): Ibu's day is not shop-floor-driven the way Ayu's is. **Where the dashboard fits:** a periodic (not necessarily daily) check on overall cash and financial standing — directly relevant given ADR-0002's own still-open item that "porsi modal Aditya vs Ibu belum ditetapkan" and Ibu's real, stated financial stake in TSS's health. The dashboard gives Ibu, for the first time, a way to see the business's own numbers directly, rather than only through conversations with the CEO — a real, concrete improvement in transparency this plan can point to as tangible operational value, consistent with this sprint's own Operational Impact First principle.

---

# 9. What Is Required Before Implementation Begins

Every item below is a real decision or action this plan surfaced, not resolved. None require redesigning anything already built.

1. **CEO confirms Option B** (§2) — a new, separate Apps Script project, not an extension of Buku Toko.
2. **CEO confirms Option A** (§6) — reading Buku Toko's own `ORANG` sheet read-only for PIN authentication, or explicitly chooses Option B (a new, isolated roster) instead.
3. **Ibu is added as a named user with her own PIN** — she does not exist in the current roster at all, regardless of which authentication option is chosen (§6).
4. **CEO decides Ayu's (`cashier`) visibility scope** — accept, adjust, or reject the minimal Today's Revenue/Transaction Count proposal in §7, since no document currently defines this and this plan does not invent it.
5. **The two Drive folders (§3) are created** and their exact paths agreed and recorded, so the pipeline (writing) and Apps Script (reading) point at the same location without ambiguity.
6. **Someone (the CEO, initially) verifies the Node.js pipeline actually runs successfully end-to-end on the machine that will run it daily** — this project's pipeline has been run and tested in a development environment; it has not yet been confirmed runnable, unattended by an engineer, on the CEO's own regular device. This is a real, practical logistics step, not a formality.
7. **The CEO commits to the manual daily pipeline-run step** (§4) as a real, ongoing operational responsibility — this plan is explicit that this is a manual, human dependency (a known, accepted violation of ADR-0004's Laptop Independence principle, deliberately accepted for MVP scope, not hidden) and asks for that trade-off to be knowingly accepted, not discovered later.

---

# 10. Success Criteria — Answered Directly

- **What will be built:** one new, standalone Apps Script web app that reads `dashboard-dataset.json` from a Drive folder and renders it, filtered by role, behind a PIN gate — reusing every existing pipeline stage unchanged.
- **Where it will be deployed:** as an Apps Script web app (Deploy → New deployment → Web app), reached via a plain HTTPS URL, with source staged in a new subfolder of `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\`.
- **Who will use it:** CEO, Ayu, and Ibu at launch (Ibu pending §9 item 3); Mas War, Central Kitchen, and Warung Padang explicitly deferred, per this sprint's own scope boundary — no work is done for them here.
- **How often it refreshes:** bounded by a manual, human-triggered pipeline run — realistically once daily, not real-time, stated as a deliberate MVP boundary rather than an oversight (§4).
- **What data each role sees:** CEO — all 11 cards, including the 6 currently `UNKNOWN`/`blocked`, shown honestly. Ibu — the finance/cash-relevant subset her grounded scope already supports. Ayu — a minimal, CEO-approval-pending subset (§7), not yet decided by this plan.
- **What is required before implementation begins:** the seven items in §9, none of which require touching the Connector, Canonical Dataset, Reporting Service, Dashboard Dataset, Dashboard Schema, or Dashboard Contract.

---

# 11. Explicit Non-Goals (Restated)

Per this sprint's own scope: no code or Apps Script is written by this plan; no redesign of Reporting Service, Connector, or the Dashboard Dataset schema is proposed anywhere above; Loka is not replaced or touched; near-real-time access, multi-brand expansion, and any long-term "Enterprise App" direction are explicitly out of this document's scope and are not discussed further here.

---

No code was written. No Apps Script was created or modified. No existing document was modified. Nothing was committed.
