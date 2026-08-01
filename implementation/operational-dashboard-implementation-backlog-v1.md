# Operational Dashboard — Implementation Backlog v1

| | |
| --- | --- |
| **Type** | Implementation backlog — sequencing and scoping only. No code, no Apps Script, no changes to the Connector, Reporting Service, or Dashboard Dataset. |
| **Date** | 1 August 2026 |
| **Builds on** | [`implementation/operational-dashboard-mvp-plan.md`](operational-dashboard-mvp-plan.md), unmodified. This document turns that plan into a sequenced, estimated backlog — it does not revise the plan's own conclusions except where re-reading the current Apps Script this sprint surfaced something the plan had already flagged as needing confirmation. |
| **Governing principle** | Observe first, improve second. Ship a small working dashboard over a perfect one. Every task below is judged by one question: does it reduce someone's work today? |

---

# 0. What Re-Reading the Current Apps Script Confirmed This Sprint

`Code.gs`, `Index.html`, `Migrasi.gs`, and `appsscripts.json` at `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\` were re-read directly for this sprint (file timestamps confirm no change since the prior sprint's reading — the roster below is current, not stale memory).

**The live `ORANG` roster, exactly as it stands today** (`Code.gs:46-55`):

| Nama | PIN | Peran | Unit | Unit Dilihat |
| --- | --- | --- | --- | --- |
| Ayu | 9191 | KASIR | TSS | — |
| Teh Dede | 1111 | PENYIAP & PENERIMA | SJ1 | — |
| Mas Haris | 1919 | PENYIAP & PENERIMA | SJ1 | — |
| Mas War | 1010 | PENGANTAR | – | — |
| Ayah Iman | 1414 | PENYIAP | SJ1 | — |
| Sanding | 4444 | PENERIMA | SJ4 | — |
| Aditya | 6060 | OWNER | TSS | `TSS,CK` — "CEO — lihat dua unit" |
| Sri Nurul | 1818 | OWNER | CK | `CK` |

**Reconciling this against this sprint's confirmed business decisions:**

- **CEO (Aditya) — global visibility.** Already true in the live system today, unchanged: `unitDilihat = 'TSS,CK'` already grants both units. No roster change needed for the CEO.
- **Ayu — responsible for Toko Sembako.** Already true: `Unit = TSS`, role `KASIR`. No roster change needed.
- **Teh Nurul — responsible for Central Kitchen.** No roster entry is named "Teh Nurul" — the only `OWNER`/`CK` entry is **"Sri Nurul"** (PIN 1818, `Unit = CK`, `unitDilihat = CK`). Given this project's own established convention of informal names ("Teh" = an honorific, "Mas," "Ayah," etc.) alongside formal ones, **Sri Nurul is very likely the same person referred to elsewhere as "Teh Nurul."** This is stated as a probable match requiring one human confirmation, not assumed silently — see Backlog Item B1.
- **Ibu — Owner, cross-business visibility, monitors both units.** **No roster entry represents Ibu at all.** This was already flagged in `operational-dashboard-mvp-plan.md` §6/§9 and is reconfirmed unchanged by this re-read. Ibu cannot use anything — the new dashboard or the existing one — until she is added.
- **All other existing users (Teh Dede, Mas Haris, Mas War, Ayah Iman, Sanding)** are preserved exactly as-is. None of them currently has `dashboard`/`dashCK` in their role's menu (`_menuPeran()`, `Code.gs:334-343`) and nothing in this backlog changes that — no redesign of their access is proposed anywhere below.

---

# 1. The Central Finding That Reshapes This Backlog's Scope

**Central Kitchen does not need a new dashboard built for it. One already exists, is already live, and Teh Nurul (as Sri Nurul) already has a PIN that can reach it.**

`dashboardCK(pin)` and its renderer (`renderCK()` in `Index.html`) are fully built, deployed, and reachable today inside the existing Buku Toko Apps Script project — confirmed directly in `implementation/appsscript-migration-plan.md` §1.12. This is real, working software, not a proposal.

**The tension this backlog does not silently resolve:** that existing `dashboardCK()` computes its own figures directly inside Apps Script (`_ringkasCK()`, reading an external SJ4 spreadsheet) — exactly the kind of Apps-Script-computed business logic this sprint's own principle says must not exist going forward ("Apps Script is NOT the business layer... No duplicated business rules"). This backlog does not fix that — fixing it would mean extending the Connector/Canonical/Reporting Service to cover Central Kitchen, which this sprint explicitly forbids touching. **The pre-existing violation is not new, and reusing it unchanged for the MVP period is not the same as introducing a new one.** This is named as a real, open architectural debt (Business Rule Consolidation's own §Task 6/7 findings already established Central Kitchen has zero canonical pipeline coverage), not resolved here, and explicitly out of scope for correction in this backlog.

**Practical consequence for this backlog:** "MVP supports Central Kitchen" is satisfied almost entirely by a **roster and verification task**, not a build task. The real engineering effort in this backlog is concentrated entirely in Toko Sembako — the one business unit with real, end-to-end canonical data flowing through the pipeline this project actually built.

---

# 2. Implementation Order

```
Phase 0 — Decisions & Roster (no code)
  B1  Confirm Sri Nurul = Teh Nurul
  B2  Reaffirm: new dashboard is a separate Apps Script project (not an extension of Buku Toko)
  B3  Confirm PIN-authentication source (read Buku Toko's ORANG sheet read-only, vs. a new isolated roster)
  B4  Confirm Ayu's (cashier) visibility scope for the new dashboard
  R1  Add Ibu to the live ORANG sheet, with her own PIN and unitDilihat = 'TSS,CK'

Phase 1 — Toko Sembako Dashboard (new build, the real engineering work)
  T1  New Apps Script project created, staged in Drive
  T2  Drive Data Transport folders created
  T3  PIN gate + authentication
  T4  Read dashboard-dataset.json from Drive
  T5  Role-based filtering (CEO / Ibu / Ayu)
  T6  Presentation UI (card rendering, reusing Index.html's proven visual patterns only)
  T7  Freshness / staleness / warning display
  T8  Deploy (fixed web app deployment)
  T9  Distribute URL + "Add to Home Screen" instructions

Phase 2 — Central Kitchen (verification only, no build)
  CK1  Verify Teh Nurul can log into the existing Buku Toko app and reach dashboardCK()
  CK2  (Optional, lower priority) A link from the new dashboard to the existing CK screen
```

Phase 0 and the roster change in Phase 0 can start immediately and in parallel with nothing else — they block everything downstream. Phase 1 and Phase 2 (CK1) can then run in parallel; Phase 2 has no dependency on Phase 1 completing.

---

# 3. Individual Backlog Items

## Phase 0 — Decisions & Roster

### B1 — Confirm Sri Nurul = Teh Nurul
- **Dependencies:** None.
- **Estimated effort:** Trivial (one question to the CEO).
- **Business value:** High — unblocks the entire Central Kitchen track (§1). Without this confirmation, nothing about "Teh Nurul's access" can be verified rather than assumed.
- **Technical risk:** None.
- **Acceptance criteria:** CEO confirms (or corrects) the identity match. If confirmed, no roster change is needed for Teh Nurul at all — her access already exists.

### B2 — Reaffirm the new dashboard is a separate Apps Script project
- **Dependencies:** None.
- **Estimated effort:** Trivial (a decision, not work).
- **Business value:** High — determines the entire shape of Phase 1.
- **Technical risk:** Low either way, but the two options carry different risk profiles, restated briefly here rather than re-argued from scratch (already reasoned in `operational-dashboard-mvp-plan.md` §2): a separate project keeps a brand-new, less-proven codebase away from the live system that handles real cash for 8 daily users; the existing codebase already carries one confirmed duplicate-function bug (`Migrasi.gs` vs. `Code.gs`, per the Apps Script audit), evidence its blast radius is not fully understood today. This backlog carries forward that recommendation unchanged rather than reversing it without new evidence.
- **Acceptance criteria:** Explicit CEO sign-off recorded before T1 begins.

### B3 — Confirm PIN-authentication source
- **Dependencies:** B2.
- **Estimated effort:** Trivial (a decision).
- **Business value:** Medium-High — affects onboarding friction (one PIN to remember vs. two) and coupling risk (a read-only cross-project Sheet reference vs. full isolation).
- **Technical risk:** Low for either option; the read-only-reference option (recommended in the MVP plan) creates a live dependency on Buku Toko's own `ORANG` sheet that must be explicitly accepted, not assumed.
- **Acceptance criteria:** Explicit CEO sign-off recorded before T3 begins.

### B4 — Confirm Ayu's (cashier) visibility scope
- **Dependencies:** None, but should be resolved before T5.
- **Estimated effort:** Trivial (a decision), though it requires the CEO to actually decide a real business fact this project cannot invent.
- **Business value:** Medium — Ayu is one of the three named MVP users; without this, T5 cannot be fully completed for her specifically (CEO and Ibu's scopes are already grounded and do not block).
- **Technical risk:** None — this is a business decision, not a technical one. `src/dataset/roles.js` already marks `cashier` visibility as `UNKNOWN`; this backlog does not invent an answer, it carries forward the MVP plan's proposal (Today's Revenue and Transaction Count only) as a starting point for the CEO to accept, narrow, or reject.
- **Acceptance criteria:** A specific, named list of cards for the `cashier` role is confirmed in writing before T5 is built for Ayu.

### R1 — Add Ibu to the live ORANG sheet
- **Dependencies:** None technically, but should follow B1 (so both new/confirmed entries can be handled in one careful pass over a live production sheet).
- **Estimated effort:** Trivial technically (one new row), **but real-world coordination effort is non-trivial**: someone must generate or choose a PIN, communicate it to Ibu directly (never through a group chat, per this project's own already-established `tambahOrang()` convention — "Sampaikan langsung ke orangnya, jangan lewat grup"), and confirm she can actually use it.
- **Business value:** High — this is the single action that makes "Ibu, cross-business visibility" possible at all, for both the new dashboard and (unchanged) the existing Central Kitchen screen.
- **Technical risk:** Low, but not zero: this is a direct edit to a **live production sheet** 8 people depend on daily. Recommended precaution, consistent with this whole project's own established discipline around live-system changes: take a manual backup/copy of the `ORANG` sheet immediately before adding the row, and verify the new row immediately after (per CLAUDE.md's own standing rule — verify against the real source, not the fact that an edit was made).
- **Acceptance criteria:** A new row exists for Ibu with a working PIN and `unitDilihat = 'TSS,CK'`; logging in with her PIN via the *existing* `masuk()` flow returns both units in her menu, exactly as it already does for the CEO today (same code path, no new logic).

## Phase 1 — Toko Sembako Dashboard

### T1 — New Apps Script project created, staged in Drive
- **Dependencies:** B2.
- **Estimated effort:** Small.
- **Business value:** High (foundational — nothing else in Phase 1 can start without it).
- **Technical risk:** Low.
- **Acceptance criteria:** A new, standalone Apps Script project exists; `doGet()` serves a placeholder page reachable at a real URL; source is staged locally under a new subfolder of `H:\My Drive\SMJ ENTERPRISE OS\AppsScript\`, mirroring Buku Toko's own existing staging convention exactly.

### T2 — Drive Data Transport folders created
- **Dependencies:** None — can run in parallel with T1.
- **Estimated effort:** Trivial.
- **Business value:** High (foundational — blocks T4).
- **Technical risk:** None.
- **Acceptance criteria:** The two folders named in `operational-dashboard-mvp-plan.md` §3 exist, and their exact paths/IDs are written down somewhere both the pipeline-runner (human) and the Apps Script code will reference identically.

### T3 — PIN gate + authentication
- **Dependencies:** T1, B3.
- **Estimated effort:** Small — this is a direct, working pattern being copied (`masuk()`/`_siapa()`), not invented.
- **Business value:** High (nothing else can be safely exposed without this).
- **Technical risk:** Low-Medium if B3 resolves to the cross-project read (the first, and only, live coupling this new project would have to the operational system) — Low if B3 resolves to an isolated roster.
- **Acceptance criteria:** A valid PIN (CEO's `6060`, at minimum, for first testing) logs in successfully; an invalid PIN is rejected with the same lockout behavior already proven in Buku Toko (`MAKS_GAGAL`/`LAMA_KUNCI`); no PIN is ever logged or stored unmasked, matching the existing `_samarkanPin()` discipline.

### T4 — Read `dashboard-dataset.json` from Drive
- **Dependencies:** T1, T2, **and a real `dashboard-dataset.json` must exist in the Drive folder** — i.e., the pipeline must have been run manually at least once. This is a pre-requisite condition, not a code dependency, and is easy to miss when sequencing actual work.
- **Estimated effort:** Small.
- **Business value:** High — this is the literal task that closes the "Dashboard Dataset → Apps Script" gap this whole MVP exists to close.
- **Technical risk:** Low, with one failure mode to design for explicitly, not improvise later: what the dashboard shows if the file is missing or malformed on a given day. Reuse the existing, already-specified "Missing data" state from `implementation/dashboard-v2-implementation-plan.md` §6 rather than inventing a new one.
- **Acceptance criteria:** A real `dashboard-dataset.json` (produced by a real pipeline run against real Loka data) is successfully read and parsed inside Apps Script; a missing or malformed file produces the pre-specified "not yet available" state, never a silent blank screen or a crash.

### T5 — Role-based filtering
- **Dependencies:** T4, B4 (for Ayu specifically — CEO and Ibu's scopes are already grounded and do not need to wait).
- **Estimated effort:** Small-Medium.
- **Business value:** High — this is the direct implementation of this sprint's own confirmed business decisions.
- **Technical risk:** Low.
- **Acceptance criteria:** Logging in as CEO shows all 11 cards, including the 6 currently `UNKNOWN`/`blocked` ones, shown honestly as such. Logging in as Ibu shows the finance/cash-relevant subset her grounded `owner-ibu` scope already supports (`src/dataset/roles.js`). Logging in as Ayu shows exactly the list confirmed in B4, no more.

### T6 — Presentation UI
- **Dependencies:** T4, T5.
- **Estimated effort:** Medium — the largest single chunk of genuinely new work in this backlog, though it is UI assembly, not new logic.
- **Business value:** High — this is the visible product.
- **Technical risk:** Low. Explicit constraint carried forward from this sprint's own principle: this step reuses `Index.html`'s proven *visual and interaction* patterns (PIN gate styling, card layout, mobile-first CSS) — it does **not** reuse or reimplement any of its calculation logic (`hitungShift()`, `hitung()`, etc.), since none of that applies to a read-only dashboard and copying it would reintroduce exactly the kind of duplicated-calculation risk this sprint explicitly warns against.
- **Acceptance criteria:** Every card in the filtered set renders its value, status, and label correctly on both a real Android device and a real iPhone, in the same session.

### T7 — Freshness / staleness / warning display
- **Dependencies:** T6.
- **Estimated effort:** Small.
- **Business value:** Medium-High — directly protects against the exact kind of harm this whole project already has one confirmed real incident of (a mislabeled figure read as an achievement, FIN-009). Not cosmetic.
- **Technical risk:** Low.
- **Acceptance criteria:** Every rendered card visibly shows its `dataFreshness`/`lastUpdated` value; any card present in `warnings`, `blockedReasons`, or `unknownReasons` is visually distinguished from a normally-computed card, using fields `dashboard-dataset.json` already provides — no new computation is introduced to produce these labels.

### T8 — Deploy
- **Dependencies:** T1–T7 complete and manually tested end-to-end.
- **Estimated effort:** Trivial.
- **Business value:** High — this is the step that turns "built" into "usable."
- **Technical risk:** Low.
- **Acceptance criteria:** A fixed (non-Head) deployment exists with a stable URL, matching Buku Toko's own existing release discipline exactly.

### T9 — Distribute
- **Dependencies:** T8, R1 (Ibu must already have a PIN before being sent the link).
- **Estimated effort:** Trivial.
- **Business value:** High — this is the step that actually delivers the operational impact this whole sprint exists for.
- **Technical risk:** None.
- **Acceptance criteria:** CEO, Ayu, and Ibu have each successfully opened the URL, logged in with their own PIN, and added it to their home screen, on their own actual devices.

## Phase 2 — Central Kitchen

### CK1 — Verify existing access
- **Dependencies:** B1, R1 (if Ibu's cross-business access is also being verified in the same pass).
- **Estimated effort:** Trivial — this is testing, not building.
- **Business value:** High — confirms "MVP supports Central Kitchen" is satisfied at effectively zero new engineering cost, which is the single highest-leverage finding in this entire backlog.
- **Technical risk:** None.
- **Acceptance criteria:** Teh Nurul (as Sri Nurul, PIN `1818`) logs into the existing, live Buku Toko app and successfully reaches `dashboardCK()`. Ibu, once R1 is complete, does the same.

### CK2 — (Optional, lower priority) A link from the new dashboard to the existing CK screen
- **Dependencies:** T8.
- **Estimated effort:** Small.
- **Business value:** Medium — a convenience unification, not a functional requirement; CK1 already satisfies the actual business need on its own.
- **Technical risk:** Low, provided this stays a link/redirect only and does not attempt to embed, proxy, or recompute anything from the CK screen — doing so would immediately violate this sprint's "no duplicated business rules" principle.
- **Acceptance criteria:** Not defined further here — this item is explicitly deferred and only worth scoping in detail if the CEO decides it's wanted after Phase 1 and CK1 are both live.

---

# 4. Definition of Done — Operational Dashboard MVP

The MVP is done when all of the following are simultaneously true, not when any single task above is individually complete:

1. CEO, Ayu, and Ibu can each open a URL on their own phone (Android or iPhone, no native app) and see a working dashboard behind their own PIN.
2. What each of them sees matches the confirmed role decisions in this document exactly — no more, no less.
3. Every figure shown is either a real value or an honest "not yet available" state — never a silently wrong or blank number.
4. Teh Nurul retains her existing, working access to the Central Kitchen dashboard, unchanged.
5. Nothing in the Connector, Canonical Dataset, Reporting Service, or Dashboard Dataset was modified to achieve any of the above.
6. Nothing in the existing Buku Toko `Code.gs`/`Index.html`/`Migrasi.gs` was modified — only its `ORANG` sheet's *data* gained one new row (Ibu).

---

# 5. What Can Be Implemented Immediately

Everything in Phase 0 that is a pure decision (B2, B3, B4) can be resolved today with no engineering prerequisite — these are the fastest possible unblocks in this entire backlog. B1 and R1 are almost as fast (a confirmation and a sheet edit) and directly unblock Phase 2 entirely and part of Phase 1. **T1 and T2 can start in parallel with Phase 0**, since creating an empty project and creating empty folders depends on nothing except B2 (already a same-day decision). **CK1 can happen today, independent of everything else in Phase 1** — it is pure verification of something that may already work.

# 6. What Should Wait

**T3 should wait for B3.** Building authentication against an undecided roster source means rebuilding it once the decision lands — cheaper to wait a day than to build twice. **T5 for Ayu specifically should wait for B4** — CEO and Ibu's portions of T5 do not need to wait, since their scopes are already grounded and do not require a new decision. **T9 (distribution) should wait for R1** — there is no reason to send Ibu a link she cannot yet log into. **CK2 should wait until after Phase 1 and CK1 are both live and used for at least a few real days** — it is the one item in this backlog explicitly labeled a convenience rather than a requirement, and per this sprint's own principle (ship small, working, over perfect), it should not compete for attention with anything that actually blocks the three named MVP users from having a working dashboard at all.

---

# Final Question

**"If you were the Lead Engineer, what would you build first tomorrow morning?"**

**T2 — create the two Drive Data Transport folders, and manually run the pipeline once to produce a real `dashboard-dataset.json` inside them.**

This is the one task with no decision dependency at all (B2's answer doesn't change where a Drive folder lives), takes under an hour, and — critically — it produces the one artifact every other piece of this backlog needs to be tested against. Building T1's project shell, T3's auth, or T6's UI against a `dashboard-dataset.json` that doesn't exist yet means testing against fabricated placeholder data, which risks discovering a real, undocumented shape mismatch late instead of on day one. Doing this first turns every subsequent task, starting tomorrow afternoon, into work done against real data from the very first line of code — not a shortcut, the single highest-leverage hour available before anything else in this backlog can be honestly verified.

---

No code was written. No existing Apps Script, Connector, Reporting Service, or Dashboard Dataset file was modified. Nothing was committed.
