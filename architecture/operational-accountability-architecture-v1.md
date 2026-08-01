# Operational Accountability Architecture v1

| | |
|---|---|
| **Status** | Draft — proposed, pending CEO acceptance (same pattern as every ADR/contract in this series) |
| **Date** | 1 Agustus 2026 |
| **Builds on** | [ADR-0002](../adr/0002-dana-ibu-adalah-modal-bukan-hutang.md), [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md), [ADR-0004](../adr/0004-technology-constitution-and-investment-principles.md), [Canonical Data Contract v1](canonical-data-contract-v1.md) §2/§5/§6/§7, [Service Boundary Review](service-boundary-review.md) §1/§9, [Enterprise KPI Framework v1](enterprise-kpi-framework-v1.md), [`production-system-crosswalk-v1.md`](../implementation/production-system-crosswalk-v1.md), [`operational-dashboard-mvp-plan.md`](../implementation/operational-dashboard-mvp-plan.md) |
| **Defines** | WHO is accountable for WHAT operational moment, and what evidence must exist before that accountability can be assigned |
| **Does NOT define** | Code, database schema, Apps Script implementation, UI pixels |
| **Classification key** | `[Repository Evidence]` — already stated in another doc · `[Current Production Evidence]` — observed directly in the live Buku Toko spreadsheet/Code.gs · `[Future Recommendation]` — new, proposed in this document · `[Unknown]` — genuinely open, not guessed |

---

## 0. Where this sits

`[Repository Evidence]` Prior sprints already established that Enterprise OS is not a replacement for Loka — Loka, Buku Toko, and future POS/AI applications are implementation modules underneath it (this sprint's own brief; consistent with ADR-0003's Authoritative Sources table, which keeps Loka authoritative for sales transactions and never proposes replacing it).

Two architectural documents already exist above the code:

- **Canonical Data Contract v1** answers *what a business fact means* (a Shift, a Cash figure, an Invoice) and who owns defining it.
- **Service Boundary Review** answers *which Business Service is responsible for computing what* (Finance, Inventory, Sales, Customer, Pricing, Reporting).

Neither answers a third question, and this document exists because that gap is the one this sprint's brief names directly: **the business does not primarily need reports — it needs operational accountability.** This document defines *what happened, who was responsible for it at the time, and what proves it* — a layer that sits above both existing documents, not a replacement for either.

`[Future Recommendation]` This document should be read as **Canonical Data Contract §5 ("Enterprise Events"), extended** — that section already establishes the Event-First Thinking principle and a starter event list; this document does not repeat that reasoning, it builds the operational layer that reasoning was already pointing toward.

---

## 1. Operational Accountability Principles

`[Repository Evidence]` Canonical Data Contract §2 already states two of the principles this document depends on most directly: **Event-First Thinking** ("Business reality happens as events before it becomes a stored current state... Recording the event is what makes a silent failure detectable instead of invisible") and **Immutable History** ("Once a fact is canonical, it is never silently rewritten... corrections are appended, never retroactively edited"). This document's core philosophy is what those two principles imply once applied specifically to *people* and *responsibility*, not only to data correctness.

### Why evidence, not blame

`[Future Recommendation]` Enterprise OS is designed to protect people, not to police them. The reasoning:

- A system that stores only current-state (today's cash total, today's stock count) can tell you something is *wrong*, but never *when it went wrong or under whose watch* — which means the only way to answer "whose fault" is memory, reputation, or seniority. Those are exactly the inputs a fair process must not run on.
- A system that records **events with evidence, continuously, as they happen** — regardless of whether anything ever goes wrong — means that when something *does* go wrong, the answer already exists as a fact, not as a reconstruction under pressure.
- This is the operational version of the legal principle of Presumption of Innocence: nobody is assumed responsible for a gap until evidence places them inside it. The system's job is to make that evidence exist *before* it's needed, not to produce a verdict *after* it's needed.

### Facts, Evidence, Responsibility, Decision, Incident — differentiated

These five words get used interchangeably in ordinary conversation. This architecture depends on keeping them separate.

| Term | Definition | SMJ example | Who/what produces it |
|---|---|---|---|
| **Fact** | Something that objectively happened, independent of whether anyone recorded it | Barang keluar dari toko jam 05:00 | Reality itself — exists whether or not the system knows about it |
| **Evidence** | A recorded, timestamped, attributable trace of a Fact | Baris `KELUAR` dengan `Waktu Input`, `Penyiap`, `ID Kirim` | The system, at the moment the Fact is entered by whoever witnessed it |
| **Responsibility** | The party accountable for a Fact during the time window it occurred | Siapa pun yang berada di Delivery Responsibility Window jam 05:00 | Derived — computed from Evidence + the active Responsibility Window (§3), never asserted directly |
| **Decision** | A human judgment made using Evidence as input | "Selisih ini wajar, bukan kesalahan Ayu" | A human, always — `[Repository Evidence]` this mirrors Canonical Data Contract's Human Approval Gate: an AI agent may surface Evidence, it may never issue a Decision about a person |
| **Incident** | A Fact whose Evidence indicates a deviation serious enough to require a Decision before it can close | Selisih kas melebihi Rp30.000 (`[Current Production Evidence]` `BATAS_SELISIH`, `Code.gs:250`) | The system flags it; a human resolves it (full state model in §7) |

The ordering that matters: **Fact happens → Evidence is recorded → Responsibility can be computed → (if something looks wrong) an Incident opens → a human makes a Decision.** Responsibility never skips Evidence. An Incident never skips Responsibility. A Decision never happens without a human. This ordering — not any specific field or table — is what "operational accountability" means in this document.

---

## 2. Operational Event Taxonomy

`[Repository Evidence]` Canonical Data Contract §5 already defines a starter list (`ShiftOpened`, `ShiftClosed`, `InvoiceCreated`, `PaymentReceived`, `CashDeposited`, `InventoryAdjusted`, `RestockReceived`, `PriceChanged`, plus CRM/Automation/Decision events) and states explicitly: *"This list is illustrative, not exhaustive — new events are added under the additive path in Section 9's versioning rules, not invented ad hoc."* The table below is that addition — a new domain, **Operational Accountability**, using the same PascalCase past-tense naming convention already established, not a competing taxonomy.

Only events grounded in something real — either already running in production, or named directly in this sprint's brief — are included. Nothing invented for completeness.

| Event | Domain | Status | Grounding |
|---|---|---|---|
| `StoreOpened` | Store Operations | `[Future Recommendation]` | Named directly in this sprint's brief; no equivalent record exists in production today — `LOG_AKSES` records individual logins (`MASUK`), not a single "store is open" declaration |
| `ShiftOpened` | Cash & Shift Custody | `[Future Recommendation]`, name reused from `[Repository Evidence]` Canonical Data Contract §5 | `LOG_AKSES`'s `MASUK` action (`[Current Production Evidence]`) is adjacent but is a *login*, not a *shift-open declaration* — no cash-counted-at-open record exists anywhere today |
| `GoodsDeparted` | Logistics & Delivery | `[Future Recommendation]`; substance already live as `[Current Production Evidence]` | Every row appended to `KELUAR` (Code.gs `simpanKeluar`) already **is** this event in practice — this taxonomy names it explicitly so it can be reasoned about as an event, not just a sheet row |
| `GoodsReceived` | Logistics & Delivery | Same as above | Every row appended to `TERIMA` (`simpanTerima`) already **is** this event |
| `DeliveryCompleted` | Logistics & Delivery | `[Future Recommendation]` | Not separately recorded today — `REKAP`'s `Status: COCOK` (`[Current Production Evidence]`, produced by `rekapHarian`) is the closest existing signal, but it's a nightly batch reconciliation, not a real-time completion event |
| `StockAdjusted` | Inventory | Reuses `InventoryAdjusted`, `[Repository Evidence]` Canonical Data Contract §5 | No new event needed — the taxonomy already covers this |
| `CashOpened` | Cash & Shift Custody | `[Future Recommendation]` | No equivalent exists — `TUTUP_SHIFT.Kas Awal` (`[Current Production Evidence]`) is read from the *previous* shift's closing figure, not recorded as its own opening event with its own evidence |
| `CashClosed` | Cash & Shift Custody | `[Future Recommendation]`; substance already live as `[Current Production Evidence]` | Every row appended to `TUTUP_SHIFT` (`simpanTutupShift`) already carries this — `Selisih`, `Status`, three-to-four photos. Named separately from `ShiftClosed` deliberately (see note below) |
| `StoreClosed` | Store Operations | `[Future Recommendation]` | Named directly in the brief; no record today — closing currently happens implicitly whenever the last `TUTUP_SHIFT` of the day is filed |
| `IncidentReported` | Accountability | `[Future Recommendation]` | Full model in §7; no equivalent event exists, though `TUTUP_SHIFT.Status = PERLU DICEK` and `REKAP.Status = BELUM DIKONFIRMASI` (`[Current Production Evidence]`) are today's closest de facto incident signals, buried inside other events rather than raised as their own |
| `StockOpnameCompleted` | Inventory | `[Future Recommendation]` | Named directly in the brief; the 2026-07-31 Baseline Snapshot's physical stock count (`[Repository Evidence]`, `enterprise-data/baseline/`) is the one precedent for what this event's evidence should look like, but it was a one-time reset, not a recurring event type |
| `ReturnProcessed` | Sales / Inventory | `[Future Recommendation]` | Named directly in the brief; **no evidence of any return workflow found anywhere in production data** during the crosswalk audit — genuinely new ground, not merely unnamed |
| `ManualAdjustmentRecorded` | Cross-cutting | `[Future Recommendation]` | Named directly in the brief; closest existing precedent is `HARGA_LOG` (`[Current Production Evidence]`, exists as a mechanism, zero rows ever written) — a cautionary example, not a working model, for §4's minimalism argument |
| `ResponsibilityTransferred` | Cross-cutting (Handover) | `[Future Recommendation]` | Full model in §5; `GoodsDeparted`→`GoodsReceived` pairing is the one place this already happens implicitly in production |

**Why `CashClosed` is named separately from `ShiftClosed`** — `[Future Recommendation]`: today these are the same physical form (`TUTUP_SHIFT`) filled once. Conceptually they answer different questions: a Shift is a *person's* work period; a cash close is a *custody checkpoint* that must exist independent of who's working — Central Kitchen has no shift concept today (`[Current Production Evidence]`: `_menuPeran`/`_boleh` never grant CK roles a `shift` screen) but will eventually need the same cash-custody discipline. Keeping the events distinct now avoids having to split them apart later once CK needs one but not the other.

**Explicitly not included** (checked against the crosswalk audit and found no grounding): `VehicleDeparted`/`VehicleReturned` as standalone events — the brief mentions "vehicle return" under Handover (§5), but no vehicle-tracking data exists anywhere in production; treated as a property of `DeliveryCompleted`'s evidence, not its own event, until real data says otherwise.

---

## 3. Responsibility Windows

`[Repository Evidence]` — this sprint's own brief — three windows for Toko Sembako's actual daily operation:

| Window | Time | Accountability |
|---|---|---|
| Delivery | 05:00–06:30 | Goods leaving the store toward Warung Nasi Sederhana Jaya 1 & 4 |
| Store Operation | 06:30–17:30 | Cashier / in-store operation |
| Closing | 17:30–Store Closed | Cash closing, store closing |

`[Current Production Evidence]` cross-references, confirming the windows against real roster/role data (`ORANG` sheet, crosswalk §1/§5):
- Ayu (`peran: KASIR`) holds Store Operation Responsibility — matches `operational-dashboard-mvp-plan.md`'s independently-sourced observation that "Ayu's day begins around 06:30."
- Mas War (`peran: PENGANTAR`), Teh Dede (`peran: PENYIAP`), and Aditya (`peran: OWNER`) are the actors named in the brief as possible Delivery-window operators — all three already appear making `KELUAR` entries in the early-morning hours in production data (crosswalk §1, `KELUAR` rows timestamped ~05:30–05:50).
- `_boleh()`'s access rule (`[Current Production Evidence]`, Code.gs:345-358) already enforces something adjacent to window-based access — `KASIR` cannot open `dashboard()` at all, `PENYIAP`/`PENGANTAR` cannot open `shift`. Today this is a *role* boundary, not a *time* boundary; §10 Phase 1 proposes making it time-aware too.

### Why windows, not people

`[Future Recommendation]` A Responsibility Window is a scope of accountability bound to a time range, not to a specific person. This is the direct mechanism that satisfies the brief's stated objective — *"Everything before Ayu starts working must never automatically become Ayu's responsibility"* — and it works structurally, not by policy alone:

- Whoever performs a `GoodsDeparted` event at 05:15 is accountable for that Fact under the **Delivery window**, regardless of whether it's Mas War, Teh Dede, Teh Nurul, or Aditya that morning — the roster can rotate freely without the window's boundary changing.
- When Ayu opens the store at 06:30, any Evidence timestamped before 06:30 already belongs to the Delivery window by construction — she does not need to argue this from memory under pressure; the timestamp on the `GoodsDeparted`/`GoodsReceived` Evidence already places it outside her window.
- If something is later found missing, the Incident (§7) opens against the window whose Evidence covers that time range, not against whoever happens to be blamed first informally. This is the direct operational expression of Presumption of Innocence from §1: the default state is "unassigned until Evidence says otherwise," never "assigned until proven innocent."

`[Unknown]` Central Kitchen's actual operating hours and window boundaries — no document read for this architecture or the production crosswalk states them. `[Future Recommendation]` CK should receive the same window model once its hours are known, not a different one — the brief's own instruction ("Central Kitchen is managed separately but should follow exactly the same accountability principles") is treated as binding for this document's design, even though CK's concrete boundaries remain `[Unknown]`.

---

## 4. Evidence Requirements

`[Repository Evidence]` reused directly: Canonical Data Contract §7's Data Lifecycle already establishes that a fact is "Created... when the person who witnessed it" enters it — this section defines what that entry must minimally contain, per event type from §2.

### Minimum evidence, by event

| Event | Timestamp | Operator | Business Unit | Destination/Counterparty | Photo | Notes | Verification Status |
|---|---|---|---|---|---|---|---|
| `StoreOpened`/`StoreClosed` | ✅ | ✅ | ✅ | — | — | Optional | ✅ |
| `ShiftOpened`/`ShiftClosed` | ✅ | ✅ | ✅ | — | — | Optional | ✅ |
| `GoodsDeparted` | ✅ | ✅ | ✅ | ✅ (matches `KELUAR.Tujuan`, `[Current Production Evidence]`) | Only if high-value | ✅ (item/qty, per line) | ✅ |
| `GoodsReceived` | ✅ | ✅ | ✅ | ✅ (matches originating `GoodsDeparted`'s `ID Kirim`) | Only on discrepancy | ✅ | ✅ |
| `DeliveryCompleted` | ✅ | — (system-derived from matched pair) | ✅ | ✅ | — | — | ✅ |
| `CashOpened`/`CashClosed` | ✅ | ✅ | ✅ | — | ✅ **always** (`[Current Production Evidence]`: `TUTUP_SHIFT` already requires 3-4 photos) | ✅ | ✅ |
| `IncidentReported` | ✅ | ✅ (reporter) | ✅ | — | Only if relevant | ✅ **required, not optional** | ✅ (state machine, §7) |
| `StockOpnameCompleted` | ✅ | ✅ | ✅ | — | Recommended | ✅ | ✅ |
| `ReturnProcessed` | ✅ | ✅ | ✅ | ✅ (who/where returned to) | Only if damaged/disputed | ✅ | ✅ |
| `ManualAdjustmentRecorded` | ✅ | ✅ | ✅ | — | — | ✅ **required — this is the whole point of the event** | ✅ |
| `ResponsibilityTransferred` | ✅ | ✅ (both parties) | ✅ | ✅ (receiving party) | — | Optional | ✅ |

### Why evidence should stay minimal

`[Future Recommendation]`, grounded in a real, observed counter-example: `[Current Production Evidence]` `HARGA_LOG` (price-change log) exists as a fully-built mechanism — `simpanHarga()` already writes to it — and has **zero rows** in production despite prices having visibly changed (`MASTER`'s `MANUAL`-tagged Panawuan entry, crosswalk §6). `BEBAN` shows the same pattern: a designed field, structurally sound, operationally dead. Neither failed because the fields were wrong — they failed because filling them was never made *cheap enough to actually happen every time*.

The lesson this architecture applies directly: an evidence requirement that isn't filled in practice provides **zero** protection — worse than not having the field, because its emptiness later reads as suspicious rather than simply unused. So the requirement is: **the minimum that makes a dispute resolvable, not the maximum that would be nice to have.** Photo evidence specifically is reserved for cash-custody and disputed events — `[Current Production Evidence]` TUTUP_SHIFT's exact existing practice (3-4 photos, not a photo per line item) is the working precedent this document generalizes, not a new invention.

---

## 5. Responsibility Transfer (Handover)

```
Warehouse ──(GoodsDeparted)──► Delivery ──(GoodsReceived)──► Store
                                                                 │
                                                    (separately) ▼
                                                          Central Kitchen
```

`[Current Production Evidence]` This exact chain **already runs in production** — `KELUAR` → `TERIMA` → `REKAP` is a working two-party handover protocol, not a proposal. It is the strongest evidence in this whole document that the model works operationally, not just on paper:

- **Departure** (`GoodsDeparted`/`KELUAR`) is one party's Evidence — it does not, by itself, transfer Responsibility.
- **Arrival** (`GoodsReceived`/`TERIMA`) is the *second* party's independent confirmation, matched against the first by `ID Kirim`.
- **Only when both exist and match** does `REKAP.Status = COCOK` — Responsibility has now genuinely transferred, provably, not just declared. Until that match, `REKAP.Status = BELUM DIKONFIRMASI` — an honest, temporary, **unassigned** state. Nobody is blamed for goods that are simply mid-transfer.

### Why two-sided confirmation, not one-sided declaration, is the point

`[Future Recommendation]` A Handover that only records the *sending* party's claim ("I sent it") can never resolve a dispute — it's one person's word. A Handover that requires the *receiving* party's independent confirmation makes the transfer a Fact with two witnesses, not an assertion. This is precisely why `BELUM DIKONFIRMASI` existing as a real, visible state — rather than the system silently assuming receipt — is a feature of the design, not a gap to be hidden.

`[Current Production Evidence]`, cautionary: the crosswalk audit's Rp455.000 Micin Sobaso case is the concrete failure mode when a Handover's *matching key* breaks (an ID-format mismatch caused two genuinely-received shipments to sit permanently `BELUM DIKONFIRMASI`). Nothing was actually lost — the goods arrived — but the *evidence of the transfer* failed to link, which is functionally identical to a real dispute from the dashboard's point of view. This is the direct argument for §6: a Timeline view that surfaces stuck handovers as they happen would have caught this the same week, not left it open five days later, discovered only by an unrelated audit.

### Handovers not yet modeled in production

`[Future Recommendation]`, Phase 1/2 targets (§10):

- **Shift handover** — `TUTUP_SHIFT` today is filled only by the *closing* kasir; there is no equivalent record of the *next* shift's opener counter-confirming the opening cash figure they're accepting. `dashboard()`'s `Kas Awal` (`[Current Production Evidence]`, Code.gs:1929) is read automatically from the prior shift's close — a one-sided inheritance, not a two-party handover.
- **Vehicle return** — no data exists anywhere; genuinely new.
- **Cash handover** (kasir → brankas, brankas → BRI deposit) — `[Current Production Evidence]` DOMPET's `Status Setoran: MENUNGGU VERIFIKASI` (introduced 31 Jul, crosswalk §6 finding #6) is the closest existing precedent — a deposit recorded by one party, awaiting independent confirmation. It is not yet generalized into the same two-sided pattern as `KELUAR`/`TERIMA`.

---

## 6. Operational Timeline

`[Repository Evidence]` The dashboard actually built in Increment 1 (`apps-script/dashboard/Index.html`) is a **card grid** — a fixed set of KPI cards (`todays-revenue`, `gross-profit`, etc.), each showing one number. This is not a criticism of that sprint (it correctly scoped to "presentation only, reuse `dashboard-dataset.json`") — it is the observation this section acts on: a card grid answers *"how much"*, never *"what happened."*

`[Repository Evidence]` Canonical Data Contract §5 already states the reasoning this section extends: *"An event log makes an absence detectable... If only a current-state table is kept, a day where nothing happened looks identical to a day where something broke."* A KPI card showing `Rp3.831.050` cannot distinguish a normal day from a day where a delivery never arrived and got quietly absorbed into a rounding error. A Timeline can.

### `[Future Recommendation]` What the first screen should be

The first screen of Enterprise OS should be a chronological feed of the day's Operational Events (§2), each shown with its Verification Status (§7) — not a KPI grid. Concretely, ordered by time: `StoreOpened` → `GoodsDeparted ×N` → `GoodsReceived ×N` (each paired, showing matched/unmatched) → `ShiftOpened` → any `IncidentReported` → `CashClosed` → `StoreClosed`. A CEO scans this in under a minute and immediately sees where a gap sits — a `GoodsDeparted` with no matching `GoodsReceived` three hours later, a `ShiftOpened` with no corresponding `CashClosed` by evening. KPI cards remain — they become the **second** screen, or a second scroll, not the deleted alternative. This is additive to `dashboard-dataset.json`'s existing card model, not a replacement of it.

### Why "what happened today" before "how much money did we make"

`[Future Recommendation]`: money questions are answerable *retroactively* from canonical entities at any time — Gross Profit for July is still computable in August. Operational questions are only answerable *while the evidence trail is fresh* — whether today's 05:00 delivery actually left, whether Ayu's shift opened normally, whether the brankas was checked before closing. A CEO who checks the Timeline every morning catches a broken handover the same day; a CEO who only checks KPI cards catches it, if ever, during the next audit — which is exactly how the Rp455.000 case and the unexplained 27 Jul Rp2.101.810 variance (crosswalk §6 finding #10) both sat open for days. This is also the direct implementation of `operationalization-roadmap-v1.md`'s own milestone — *"CEO opens the dashboard every morning before opening Loka"* — a Timeline gives that daily open a reason to exist beyond curiosity: it is the fastest way to confirm the day started clean.

---

## 7. Incident Model

`[Repository Evidence]`/`[Current Production Evidence]` — this state model generalizes a pattern that already exists, narrowly, in one place: `TUTUP_SHIFT.Status` (`WAJAR` / `PERLU DICEK`, threshold `BATAS_SELISIH = Rp30.000`, Code.gs:250) is a working two-state incident classifier for exactly one event type (cash closing). This section extends that same discipline to every Operational Event in §2, and adds the intermediate states production's current two-state model doesn't have room for.

| State | Meaning | Who sets it | SMJ example |
|---|---|---|---|
| **Observation** | A fact worth noting; no threshold breached, no action implied | System, automatically | Brankas balance trending up, still under `BATAS_BRANKAS_MENGINAP` (`[Current Production Evidence]`, Rp2.000.000) |
| **Warning** | A threshold breached, but within a normal, self-resolving pattern | System, automatically | `GoodsDeparted` with no matching `GoodsReceived` yet, same day, within normal confirmation lag |
| **Incident** | A threshold breached AND outside normal resolution — requires a human Decision to close | System opens it; only a human closes it | Cash selisih `> Rp30.000` (`PERLU DICEK`, `[Current Production Evidence]`); a `GoodsDeparted` still unmatched after 24h |
| **Pending Evidence** | An Incident is open, but the facts needed to explain it don't exist yet — an honest "we know something's off, we don't yet know why" | System marks it when no explanatory Evidence is attached | `[Current Production Evidence]`: the unexplained 27 Jul Rp2.101.810 shift variance (crosswalk §6 #10) — today this sits as `PERLU DICEK` with no distinct "still waiting on an explanation" marker; this state gives it one |
| **Verified** | Evidence has been supplied and a human has reviewed and confirmed the explanation | Human only | CEO reviews the selisih, confirms it was a legitimate large deposit day, records why |
| **Completed** | Resolved with no residual concern — either downgraded (false alarm) or fully explained and closed | Human only | Incident closes; the Incident record itself is never deleted (Immutable History, `[Repository Evidence]` Canonical Data Contract §2) |
| **Escalated** | A human decision that this Incident needs attention beyond the normal operator/CEO loop | Human only, explicit act | A cash discrepancy large enough to involve Ibu as cash co-signatory (`[Repository Evidence]` ADR-0002); never automatic |

**What never changes across every state:** the system flags, a human decides. No state in this table is ever set to imply a specific person is at fault — `Verified`/`Completed` record that an explanation exists and was accepted, not a verdict on a person. This is §1's Facts→Evidence→Responsibility→Decision ordering, made concrete as a state machine.

---

## 8. Relationship with KPI

`[Repository Evidence]` Canonical Data Contract §2's Event-First Thinking principle already states the direction this section makes explicit for KPIs specifically: business reality happens as events first. The **Enterprise KPI Framework v1** should be read the same way — KPIs are aggregates computed *over* Operational Events (and the canonical entities they produce), not independently defined and separately collected.

**A concrete demonstration, not a hypothetical:** `[Repository Evidence]` the KPI Framework's own **Shift Accuracy** entry states `Formula: UNKNOWN precise arithmetic` and `Alert Threshold: UNKNOWN`. `[Current Production Evidence]` this sprint's production audit already found the answer sitting in `Code.gs:250` — `BATAS_SELISIH = 30000` is the operative threshold, right now, in the live system. This is exactly the failure mode Event-First Thinking is meant to prevent: a KPI defined in the abstract, disconnected from the event stream that already answers it. This document does not edit the KPI Framework directly (out of scope — "extend, don't rewrite"), but names this as the clearest available proof that KPIs should be derived from the Operational Event/Evidence layer, not maintained as a parallel, independently-sourced document.

`[Future Recommendation]` The general rule going forward: every KPI in the Enterprise KPI Framework should be traceable to the specific Operational Event(s) that produce it. A KPI with no underlying event is either legitimately derived from a canonical entity's current state (fine, per Canonical Data Contract §4) or is a sign this taxonomy (§2) is missing something — not a sign the KPI framework needs its own separate data collection.

---

## 9. Relationship with Business Services

`[Repository Evidence]` Service Boundary Review §1 names exactly six Business Services: **Finance, Inventory, Sales, Customer, Pricing, Reporting.** `[Unknown]` No "Kitchen Service" exists in that document or anywhere else read for this architecture — Central Kitchen is a named *domain* (Canonical Data Contract §3) without its own Business Service today. This sprint's brief lists "Kitchen" alongside the six named services; this document does not resolve that gap by inventing one — it is named here explicitly as open, for whoever revisits `service-boundary-review.md` next.

**How this architecture relates to those services — sits above, does not replace:**

- The six Business Services own canonical entities and compute *business meaning* — margin, receivables, inventory value, customer concentration.
- The Operational Accountability layer owns *events and evidence*, and answers a different class of question: **did what was supposed to happen, happen, and who is presently responsible for the window it happened in.** A Finance Service can tell you Cash Balance is Rp X right now; it cannot tell you whether this morning's `CashOpened` evidence was ever recorded, or whether yesterday's `CashClosed` selisih is still `Pending Evidence`.
- `[Repository Evidence]` Service Boundary Review §9 already runs a Publisher/Subscriber model for events (`ShiftOpened`/`ShiftClosed` published by Sales Service, subscribed by Finance Service; `InventoryAdjusted` published by Inventory Service, etc.). Every new event in §2 should be assigned a Publisher and Subscriber(s) the same way, not through a new mechanism — this architecture plugs into an existing seam rather than building a parallel one. `[Future Recommendation]`: `GoodsDeparted`/`GoodsReceived`/`DeliveryCompleted` most plausibly publish from Inventory Service (goods movement) with Finance Service and Reporting Service as subscribers, mirroring `RestockReceived`'s existing assignment — proposed, not decided.

---

## 10. Implementation Roadmap

Each phase is filtered through the same test `operationalization-roadmap-v1.md` already established: **does this help Aditya, Ayu, or Ibu tomorrow morning?** No phase below includes work that fails that test.

### Phase 1 — Delivery Evidence, Shift Opening, Shift Closing

`[Future Recommendation]`, directly scoped by this sprint's brief:
- Formalize `GoodsDeparted`/`GoodsReceived` as named events with the minimum evidence from §4 — largely a naming/discipline exercise over what `KELUAR`/`TERIMA` already capture, not new data collection.
- Add `ShiftOpened` as a real event with its own evidence (currently: no equivalent exists — only a login and an inherited `Kas Awal` figure).
- Add `ShiftClosed` explicitly as the named, generalized form of what `TUTUP_SHIFT` already does.
- Tag each event to its Responsibility Window (§3) at the moment it's recorded — the cheapest possible version of window enforcement, no new UI required beyond what already captures a timestamp.

**Explicitly not in Phase 1:** Central Kitchen, Incident state machine, Timeline UI, Store Opening/Closing. Phase 1 only touches what's already the busiest, highest-evidence-value part of the day.

### Phase 2 — Operational Timeline, Incident, Central Kitchen

`[Future Recommendation]`:
- Build the Timeline-first dashboard view (§6) on top of Phase 1's events — the first real UI work this architecture produces, and only after Phase 1 has evidence to show.
- Wire the Incident state machine (§7) to the two thresholds that already exist in production (`BATAS_SELISIH`, `BATAS_BRANKAS_MENGINAP`) before inventing any new ones.
- Bring Central Kitchen under the same event/evidence principles — `[Unknown]` CK's actual operating hours and actors first need to be established (not assumed) before its Responsibility Windows can be defined; this is discovery work, not implementation work, and belongs at the *start* of this phase, not skipped.

### Phase 3 — Enterprise-wide Accountability Layer

`[Future Recommendation]`:
- `StoreOpened`/`StoreClosed`, `StockOpnameCompleted`, `ReturnProcessed`, `ManualAdjustmentRecorded` as full events.
- Complete the Handover model (§5) for shift-to-shift, vehicle return, and cash-to-BRI deposit — extending the `KELUAR`/`TERIMA` two-party pattern to the handovers that don't have it yet.
- Extend the same architecture to future brands (SBGA and beyond) — `[Repository Evidence]` ADR-0004's Purpose already names this as a standing requirement ("TSS, Central Kitchen, SBGA, and future brands"); this document's design (windows and events defined independent of any specific person or brand) is written so that extension does not require redesigning the model, only re-instantiating it.

---

## Summary

Enterprise OS's first job is not to compute numbers faster than Loka does. It is to make sure that for every operational moment — a delivery leaving, a shift opening, cash closing, a stock count — there is a Fact, recorded as Evidence, at the time it happened, by whoever was there. Responsibility follows from that Evidence, never from memory. Decisions about what that Evidence means are always made by a person, never by the system. This is what "operational accountability" means in practice, and it is the foundation every future dashboard, KPI, and Business Service in this repository should be built to sit on top of — not the other way around.
