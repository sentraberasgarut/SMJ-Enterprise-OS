# Workforce Assignment Architecture v1

| | |
|---|---|
| **Status** | Draft — proposed, pending CEO acceptance |
| **Date** | 1 Agustus 2026 |
| **Builds on** | [Operational Accountability Architecture v1](operational-accountability-architecture-v1.md) §3/§5, [`production-system-crosswalk-v1.md`](../implementation/production-system-crosswalk-v1.md), `src/dataset/roles.js`, [Dashboard Design System v1](../design/dashboard-design-system-v1.md), [Dashboard Frontend Architecture v1](dashboard-frontend-architecture-v1.md), [Canonical Data Contract v1](canonical-data-contract-v1.md) (Employee entity, §4/§9), ADR-0004 |
| **Defines** | Which operational role exists, who fills it today, and how that changes without changing the architecture |
| **Does NOT define** | Payroll, attendance, leave balances, HR records, database schema, code |
| **Classification key** | `[Repository Evidence]` — stated in another doc or this sprint's own brief · `[Current Production Evidence]` — observed directly in the live Buku Toko spreadsheet/Code.gs · `[Future Recommendation]` — proposed here for the first time · `[Unknown]` — genuinely open |

---

## 1. Why Enterprise OS is not an HR system

`[Repository Evidence]` This sprint's brief states the governing principle directly: *"People do not permanently own responsibilities. Responsibilities belong to operational roles. People are assigned to those roles. Assignments change. Responsibilities remain."* This section explains why that principle requires deliberately staying out of HR territory, not drifting into it.

| | HR System | Operational Workforce Assignment (this document) |
|---|---|---|
| **Core question** | Who is employed, what are they paid, what leave have they accrued | Who is accountable for this role, right now |
| **Time horizon** | Contracts, tenure, career history | Today — and the next shift |
| **Change trigger** | Hiring, termination, compensation review | A role changing hands, even for one day |
| **Owns** | Salary, leave balance, performance review, contracts | Role definition, today's assignment, backup assignment, duty status |
| **Consequence of error** | Compliance/legal, compensation dispute | A moment goes unaccounted for — no evidence, no responsibility |

`[Future Recommendation]` The reason this boundary matters architecturally, not just semantically: HR data is slow-moving and consequential in a different way than operational data — it needs approval workflows, confidentiality, and legal correctness that this repository's existing governance model (`[Repository Evidence]` ADR-0004 Principle 8, Human Approval Gate) already treats as a heavyweight, always-required gate. Operational Workforce Assignment needs the opposite: it needs to be **cheap enough to update every single day** — a day-off, a swap, a temporary cover — without triggering that same heavyweight process each time. Merging the two would either make daily assignment changes bureaucratic (bad for operations) or make HR decisions casual (bad for HR). Keeping them separate is what lets each be right for its own job.

`[Current Production Evidence]` This separation already exists, informally, in production: `ORANG.Aktif` (`YA`/`TIDAK`) is the closest thing to an HR-adjacent field in the whole system — a coarse, rarely-changing employment flag — and it is deliberately the *only* one. There is no leave balance, no pay rate, no tenure field anywhere in Buku Toko. This document does not propose adding any of those; it proposes making the *operational* layer (who's covering what, today) explicit, which today lives only in informal knowledge (the brief's own "Current Real Operation" section) and nowhere in any system.

---

## 2. Operational Roles

`[Repository Evidence]` `src/dataset/roles.js` already defines seven roles as schema, each with a `visibilityScope` (several still `UNKNOWN`) — this section extends that list, it does not replace it. Roles already defined there are reused by name; only genuinely missing roles are added.

| Role | Status in `roles.js` | Grounding |
|---|---|---|
| **CEO** | Exists (`ceo`) | `[Repository Evidence]` — Aditya |
| **Owner (Ibu)** | Exists (`owner-ibu`) | `[Repository Evidence]` — cross-business owner, ADR-0002 |
| **Cashier** | Exists (`cashier`) | `[Current Production Evidence]` — Ayu, `ORANG.Peran = KASIR` |
| **Driver** | Exists (`driver`) | `[Current Production Evidence]` — Mas War; note `ORANG.Peran = PENGANTAR`, not literally "Driver" — same role, different label between the two systems (see §6's naming note) |
| **Central Kitchen Manager** | Exists (`central-kitchen-manager`) | `[Repository Evidence]` — named "Teh Nurul" in the Design System; `[Current Production Evidence]` `ORANG` names the CK `OWNER` as "Sri Nurul," not "Ibu" — this sprint's brief names Central Kitchen's operator as **"Ibu"** directly. These three references do not agree on one name. Treated here as `[Unknown]` — not silently resolved — because assuming Ibu, Sri Nurul, and Teh Nurul are (or are not) the same relationship to Central Kitchen would invent a fact this document cannot verify. |
| **Store Manager** | Exists (`store-manager`), previously "Future — not yet named" (Design System) | `[Future Recommendation]` — mapped in this document to what the brief calls **Store Support**, the role Aditya/Mas War jointly occupy when Ayu is off (§5) |
| **Future Admin** | Exists (`future-admin`) | Unchanged — still a placeholder |
| **Warehouse** | **Not in `roles.js`** | `[Future Recommendation]`, `[Current Production Evidence]`-grounded: Teh Dede's actual function (`ORANG.Peran = PENYIAP` — "preparer," i.e. the person who stages goods for `GoodsDeparted`) is real and currently running, but has no named role in the schema |
| **Kitchen Support** | **Not in `roles.js`** | `[Future Recommendation]` — no person currently named to this role in the brief; added for symmetry with Store Support, since Central Kitchen will eventually need the same coverage pattern TSS already has |
| **Head of Operations** | **Not in `roles.js`** | `[Future Recommendation]`, directly grounded in the brief: *"Mas War will become Head of Padang Operations."* Modeled as one role, **scoped by Business Unit** at assignment time (§3) — "Head of Padang Operations" is this role assigned to the `Warung Makan Padang` business unit, which `[Repository Evidence]` already exists as a scaffolded, `dataConnected: false` unit in `src/dataset/businessUnits.js` (Dashboard Frontend Architecture §3/§9). The architecture did not have to change to accommodate this promotion — the business unit it will apply to was already named. |

**Naming convention going forward:** `[Future Recommendation]` this document standardizes on `roles.js`'s English role names as the canonical role identifiers (matching this sprint's own request list — Cashier, Driver, Warehouse, Kitchen, Store Owner, Store Support, Kitchen Support, Operations Manager/Head of Operations), while `ORANG.Peran`'s Indonesian labels (`KASIR`, `PENGANTAR`, `PENYIAP`, `OWNER`) remain the labels actually shown in Buku Toko today. These are **the same roles under two labels**, not two role systems — reconciling the labels themselves is out of scope here (it is an Apps Script/data question, not an architecture question) and is named as a `[Future Recommendation]` cleanup item, not resolved now.

---

## 3. Assignment Model

```
Business Unit
   ↓
Operational Role
   ↓
Today's Assignment
   ↓
Actual Person
   ↓
Evidence
   ↓
Responsibility
```

`[Future Recommendation]` Each layer answers a different, narrower question than the one above it:

| Layer | Question it answers | Example |
|---|---|---|
| Business Unit | Which part of the business | Toko Sembako Sejahtera |
| Operational Role | What function must always be covered | Cashier |
| Today's Assignment | Who occupies that role right now | Cashier → Ayu, today |
| Actual Person | The individual behind the assignment | Ayu |
| Evidence | What that person's actions produced (`[Repository Evidence]` Operational Accountability Architecture §4) | `CashClosed` at 17:41, Rp0 selisih |
| Responsibility | Who is accountable, computed from the above — never asserted directly | Ayu, for the Store Operation window, backed by that Evidence |

**Why the model stops at "Role" and never starts at "Person":** if the architecture were built starting from people ("Ayu does X"), every organizational change — a day off, a promotion, a resignation — would require touching the definition of X. Built starting from Role ("the Cashier role does X, whoever holds it today"), the same changes only touch the *assignment* — a much smaller, much safer edit, and one that can happen daily without being an architecture change at all.

### Why assignment is dynamic

`[Repository Evidence]`, directly from this sprint's brief — the current operation already proves assignment changes routinely, not exceptionally:
- Ayu: fixed weekly day off.
- Mas War, Teh Dede: two days off monthly.
- On Ayu's day off, Store Operation is covered jointly by Mas War + Aditya — a **different pair of people**, temporarily, filling the same Responsibility Window.
- On Mas War's day off, morning delivery is covered by Ayah — a **different single person**, filling the same role.

None of these are exceptions the architecture has to special-case. They are the normal, expected shape of "Today's Assignment" changing while "Operational Role" and "Responsibility Window" stay fixed. `[Current Production Evidence]` this is already visible, informally, in `KELUAR`'s own data — different names appear as `Penyiap` across different mornings for what is structurally the same Delivery-window activity (crosswalk §1, §3) — the data already behaves this way; it simply has no explicit Assignment record making it queryable as "who's covering this role today" without reading raw rows.

---

## 4. Duty Status

`[Future Recommendation]`, kept deliberately small per this sprint's own constraint ("do not overcomplicate"):

| Status | Meaning |
|---|---|
| **On Duty** | Currently the active assignment for a role, within its Responsibility Window |
| **Off Duty** | Scheduled, expected absence — a day off, known in advance |
| **Acting** | Filling a role that is not their normal one, temporarily (Mas War as Store Support on Ayu's day off; Ayah as Driver on Mas War's day off) |
| **Unavailable** | Unplanned absence — sick, emergency — distinct from Off Duty because it wasn't expected |
| **Completed Shift** | On Duty has ended for the day, normally (e.g. after `CashClosed`/`ShiftClosed`, `[Repository Evidence]` Operational Accountability Architecture §2) |

`[Current Production Evidence]` no equivalent field exists anywhere today — `ORANG.Aktif` (`YA`/`TIDAK`) is a permanent employment flag, not a daily state, and nothing in `LOG_AKSES` distinguishes a scheduled day off from an unplanned absence. This is genuinely new ground, not an extension of an existing field.

**Why five states, not more:** each one answers a single operational question a person checking the dashboard actually asks — "is this role covered right now, and is that expected." A finer-grained model (e.g. distinguishing sick leave from personal leave) would be an HR concern (§1) and does not change how Enterprise OS should behave — both are simply "Unavailable" from an accountability standpoint.

---

## 5. Backup Assignment

`[Repository Evidence]`, the exact case named in this sprint's brief:

| Role | Primary | Backup | Grounding |
|---|---|---|---|
| Driver (Delivery) | Mas War | Ayah | `[Repository Evidence]`: "When Mas War is off, morning delivery is performed by Ayah." |
| Cashier / Store Operation | Ayu | *(coverage, not a 1:1 backup — see below)* | `[Repository Evidence]`: "When Ayu is off, Mas War operates the store together with Aditya." |
| Central Kitchen | Ibu | `[Unknown]` | No backup named anywhere read for this document |

**Two different coverage patterns, not one:** `[Future Recommendation]` the Driver case is a clean **1:1 Backup Assignment** — one named person substitutes for another in the *same* role. The Cashier case is **Coverage by Reassignment** — the role's responsibility is temporarily absorbed by people already holding *other* roles (Mas War: Driver → acting Store Support; Aditya: Owner, already present), rather than one dedicated backup Cashier. Both patterns are legitimate and both should exist in the model — collapsing them into one "backup" concept would misrepresent how Ayu's coverage actually works today, since there is no second person whose job is "be the cashier when Ayu isn't."

### Why backup assignment is operationally critical

`[Future Recommendation]`, grounded directly in Operational Accountability Architecture §3's own protection principle: a Responsibility Window with **no defined occupant** — primary absent, no backup named — is exactly the condition that produces an accountability gap. If Mas War is off and no one is named for Delivery, a missing or late delivery that morning has no one whose Evidence explains it, and the default — per §1 of the Accountability Architecture — must never be "whoever happened to be around gets blamed after the fact." Naming the backup in advance is what keeps that default honest. It also directly protects the backup themselves: Ayah covering a delivery is now a *visible, expected* assignment (`Acting`, §4), not an informal favor with no evidence trail if something goes wrong.

---

## 6. Future Organizational Growth

`[Repository Evidence]` reused directly: Canonical Data Contract §9's versioning discipline already distinguishes additive changes (safe, no migration needed) from breaking changes (require explicit handling). This section applies that same distinction to the workforce model.

| Event | What changes | What does NOT change |
|---|---|---|
| **New employee** | A new Assignment (and, if needed, a new Person record) | No Role definition changes; the new person is assigned to an existing Role |
| **Promotion** (`[Repository Evidence]`: Mas War → Head of Padang Operations) | Mas War's Assignment moves from Driver to Head of Operations, scoped to Warung Makan Padang. A **new** Assignment is created for Driver, held by whoever replaces him (`[Repository Evidence]`: "Future driver will replace Mas War for delivery activities") | The Driver role itself, its Responsibility Window, its Evidence requirements — none of it is redefined. The new driver inherits a fully-formed role on day one |
| **Resignation** | The Assignment ends; the role becomes unassigned until a new Assignment is made (a visible gap, not a silent one — surfaced the same way an unfilled Duty Status would be, §7) | The role continues to exist, ready for the next Assignment |
| **Business expansion** (e.g. Warung Makan Padang going from `dataConnected: false` to active) | A new Business Unit is connected; existing roles (Driver, Store Support, Head of Operations) are assigned within it the same way they already are for Toko Sembako | No new role *type* is required — the same taxonomy in §2 applies; only the Business Unit dimension of the Assignment changes |
| **New Business Unit type entirely** (e.g. a future Rice Mill) | A new Business Unit is added to the canonical list (already an additive, named-elsewhere operation — `[Repository Evidence]` Production Architecture §4's Multi-Brand Design: "no new pipeline is built per brand") | Roles are still drawn from the same taxonomy — a Rice Mill still needs a Warehouse-equivalent and an Operations-equivalent role, not a bespoke set |

**Why this survives without rewriting software:** `[Future Recommendation]` every one of the five rows above is an *Assignment* change or, at most, an *additive* Role addition — never a redefinition of an existing Role, Responsibility Window, or Evidence requirement. This mirrors exactly the discipline Canonical Data Contract §9 already established for data contracts generally; this document is that same discipline applied specifically to who does the work.

---

## 7. Dashboard Integration

`[Repository Evidence]` reused directly from the Dashboard Design System's **Calm** principle: *"No dashboard card should ever create urgency it hasn't earned."* This section is the direct application of that rule to workforce display.

`[Future Recommendation]` The dashboard should show **Role → Today's Assignment**, not a flat employee directory:

```
Cashier          Ayu            (On Duty)
Driver           Mas War        (On Duty)
Warehouse        Teh Dede       (On Duty)
Kitchen          Ibu            (On Duty)
```

When a role's Assignment shows `Off Duty` — Ayu's scheduled day off, for example — the dashboard must show that as an **expected, calm state**, explicitly distinct from an unfilled role or a missing person: `[Future Recommendation]`

```
Cashier          Ayu is off today
                 Store covered by: Mas War, Aditya (Acting)
```

versus, only if a role genuinely has no coverage at all:

```
Driver           ⚠ No assignment today
```

The difference between these two is the entire point of Duty Status (§4) existing as a first-class concept rather than the dashboard inferring "someone's missing" from an empty field. `[Repository Evidence]`: this is the same discipline the Design System already applies to data — *"Where the Dashboard Dataset says UNKNOWN or blocked, the interface says so too — plainly"* — extended here to people: an Off Duty cashier is not an `UNKNOWN`, it is a known, named, expected state, and must never render with the same visual weight as an actual gap.

---

## 8. Relationship with Operational Accountability

`[Repository Evidence]` Operational Accountability Architecture v1 already defines Responsibility Windows (§3) and Evidence (§4) but explicitly computes Responsibility from Evidence *plus the active window* — it does not, by itself, say **who** is expected to be inside that window on a given day. This document supplies that missing third axis:

```
Responsibility Window   (WHEN — 05:00–06:30 Delivery, per Accountability Architecture §3)
        +
Operational Event       (WHAT — a GoodsDeparted event with its Evidence, per Accountability Architecture §2/§4)
        +
Today's Assignment      (WHO — Role: Driver → Mas War, per this document §3)
        =
Accountability
```

`[Future Recommendation]` Concretely: a `GoodsDeparted` event recorded at 05:15 is evaluated against **whichever role's Responsibility Window covers 05:15** (Delivery), and **whoever's Today's Assignment fills the Driver role at that moment** — reading Duty Status first, since an event recorded under an `Acting` assignment (Ayah covering for Mas War) is still fully accountable, just to a different named person than the role's usual occupant. Without this document, the Accountability Architecture can say "the Evidence shows a delivery left at 05:15, within the Delivery window" but cannot say *whose* Delivery Responsibility that was without falling back to informal knowledge. This document closes that gap.

---

## 9. Future Recommendation — a lightweight Workforce Assignment module

`[Future Recommendation]`, scoped deliberately narrow, per this sprint's constraint:

**In scope:**
- **Roles** — the taxonomy in §2, extending `roles.js` additively.
- **Assignments** — Role × Business Unit × Person × date range, replacing informal knowledge of "who's covering what" with a queryable record.
- **Backup Assignments** — the primary/backup pairing in §5, including the distinction between 1:1 backup and coverage-by-reassignment.
- **Duty Status** — the five states in §4, updated daily, cheaply.

**Explicitly out of scope, restated from this sprint's own constraints:** payroll, attendance tracking, leave balances, performance records, contracts — anything that belongs to HR (§1), not to operational accountability.

**Where this sits relative to what already exists:** `[Future Recommendation]` this module is not a replacement for `ORANG` (identity/PIN, authentication) — it is a thin layer **above** it, the same "sits above, does not replace" relationship the Accountability Architecture already establishes between itself and the six Business Services (`[Repository Evidence]` Operational Accountability Architecture §9). `ORANG` continues to answer "who is this person and are they allowed to log in." This module answers "which role are they occupying today, and is that expected."

---

## Frontend Addendum

`[Repository Evidence]` The Dashboard Design System (§2) already establishes the tone this addendum must stay inside: Warm, Trustworthy, Calm, Professional, Family-owned, Operational, Fast, Readable, Low cognitive load, Data-first — and explicitly rejects "tech startup," "crypto," and "gaming" visual language. Nothing below overrides those; this section is the mobile-interaction and multi-unit-identity layer that document deliberately left undefined (*"no colors, graphics, or mockups are defined anywhere in this section"*).

### Mobile interaction model

`[Future Recommendation]`, extending the Design System's existing **Mobile Layout** and **Fast** principles into concrete interaction rules:

- **One primary action per screen, thumb-reachable.** A cashier or driver is standing, often one-handed. The interface should never require two hands or precise tapping.
- **PIN → role home in two taps, not a menu tree.** `[Current Production Evidence]` this pattern already exists and works — Buku Toko's and Increment 1's PIN gate → immediate role-scoped screen, no intermediate navigation. This addendum's recommendation is to keep exactly that shape, not replace it.
- **State is always visible without asking.** Loading, stale, offline (`[Repository Evidence]` Dashboard Frontend Architecture §7/§8) must be legible at a glance — no spinner that could be mistaken for "nothing is happening."
- **Motion only for state transitions, never for delight.** A card resolving from Loading to Loaded may transition smoothly; nothing celebrates, bounces, or confetti-fires. This is a direct restatement of the Design System's "never gaming" rejection, applied specifically to motion design, which that document didn't cover.
- **Every screen answers "what do I do right now," not "what happened historically"** for on-shift roles specifically (Cashier, Driver, Warehouse) — `[Repository Evidence]` already the Design System's Operational principle; the Timeline view from the Accountability Architecture (§6 there) is the correct home for "what happened," and should stay a secondary, not primary, screen for these roles.

### Business Identity System

`[Future Recommendation]` One consistent Enterprise OS shell; each Business Unit carries its own accent identity within it. Using this sprint's own proposed direction as a starting palette of *concepts*, not final colors:

| Layer | Identity | Grounding |
|---|---|---|
| Enterprise (shell) | Deep Navy | This sprint's own proposal — no prior repository color exists at the Enterprise level; today's live product (Buku Toko) has no shell above the individual app |
| Toko Sembako Sejahtera | Indigo / Slate | This sprint's own proposal — **conflicts with `[Current Production Evidence]`**: Buku Toko and Increment 1's dashboard already use a live green/gold palette (`--hijau:#4F6042`, `--emas:#E8A22C`, `--krem:#F7F3E9`). Whether TSS's Enterprise OS identity replaces that palette or the green/gold *is* TSS's identity and this sprint's Indigo/Slate example applies to a different unit is `[Unknown]` — named explicitly, not silently decided by this document |
| Central Kitchen | Emerald / Teal | This sprint's own proposal — no existing CK-specific identity exists to conflict with |
| Warung Makan Padang | Not proposed by this sprint | `[Unknown]` — real, scaffolded business unit (`businessUnits.js`) with no identity direction given yet |
| Future Rice Mill / Future Distribution | Amber / Earth, Cyan | This sprint's own proposal, illustrative — `[Unknown]` whether either will ever become a real business unit; treated as examples of the *system's* capacity to extend, not as commitments |

**What changes per unit:** the accent color, the unit's name/icon in the header, nothing else.

**What never changes, regardless of unit:** `[Future Recommendation]`, directly enforcing the Design System's existing rules —
- Layout grammar (card structure, spacing, navigation pattern) — Dashboard Frontend Architecture §4's five screens apply identically to every unit (already stated there).
- Typography scale and the numeric-vs-body-text distinction (Design System, Typography).
- Status vocabulary — `ok`/`unavailable`/`blocked`, `healthy`/`degraded`/`unhealthy` (Design System, Status Indicators) — never a per-unit variant.
- The Calm/Trustworthy/Data-first tone itself — a Central Kitchen screen showing `UNKNOWN` must feel exactly as honest as a Toko Sembako screen showing it.

**Why cognitive consistency matters more than decoration:** `[Future Recommendation]` Aditya already moves between Toko Sembako and Central Kitchen visibility today (`[Repository Evidence]` `roles.js`'s `ceo` scope: `all-business-units,all-cards`) — he is the concrete, already-existing case this principle protects. If each unit were a differently-structured interface, every switch would cost him re-orientation time on top of the actual operational check he came to do. A consistent shell with only an accent change means he can trust that "where's the confidence indicator" and "where's the freshness label" never move — the accent color is the only signal that tells him which business he's looking at, and it's enough, because everything else about *how to read the screen* stayed identical. The user should feel they entered another business unit, never that they opened another application — this is what makes that true without requiring heavier visual differentiation than a single accent shift.

