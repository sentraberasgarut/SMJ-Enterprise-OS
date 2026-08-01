# Live Connector Feasibility v1

| | |
| --- | --- |
| **Type** | Architectural feasibility analysis only. No implementation, no connector code, no patching. |
| **Date** | 1 August 2026 |
| **Builds on** | [`loka-apk-analysis-v1.md`](loka-apk-analysis-v1.md) (Parts 1–2, 6), [`loka-realm-runtime-v1.md`](loka-realm-runtime-v1.md) (Parts 2–3) — every claim below cites a specific finding in one of those two documents rather than restating raw evidence. |
| **Objective (restated)** | Determine, architecturally, whether Enterprise OS can eventually consume Loka data in near real-time **without modifying Loka itself**. |
| **Hard constraints honored throughout** | No APK modification, patching, resigning, or code injection. No device rooting. No bypassing licensing. Nothing below recommends any of these, even conditionally. |

---

# Part 4 — Live Connector: Architectural Questions

## 4.1 Can Enterprise OS safely open the Realm database read-only?

**The Realm engine itself: yes, in principle.** `loka-realm-runtime-v1.md` §2.11 confirms Realm Core in this build treats read-only opening as a normal, first-class, supported operation — the very existence of the error message *"Realm file at path '%1' cannot be opened in read-only mode because it has a file format version (%2) which requires an upgrade"* only makes sense because read-only opening is a real, working code path with its own, specific failure mode (not an unsupported hack that simply fails generically).

**The file's location: no, not from an external process on a normal device.** `loka-realm-runtime-v1.md` §2.3 places the live database at `/data/data/com.loka.stock/files/db/loka-stock.realm` — Android app-private internal storage. Under Android's standard sandboxing model, this path is readable only by the `com.loka.stock` process itself (or a process running as `root`). This is an operating-system-level constraint, entirely independent of anything Realm's own engine supports or forbids, and it is the single fact that governs every other answer in this section.

**Conclusion:** the question has two different correct answers depending on *which* file is meant. Opening a **copy** of the database (the `.realm` snapshot files this project already ingests, produced by Loka's own manual export feature) read-only is safe and already proven — this project's own canonical connector prototype already does exactly this. Opening the **live, in-place** file at its real Android path is not reachable by an external process at all under the current, unmodified architecture.

## 4.2 Can Enterprise OS detect changes?

Only against whatever copy of the database is actually reachable. Two distinct mechanisms exist in the evidence, at two different levels:

- **Snapshot comparison** (comparing two `.realm` export files taken at different times) — already the model this project operates on, and it works regardless of anything else in this document.
- **Realm's own native change-notification system** (`loka-realm-runtime-v1.md` §2.11 — `CollectionNotifier`/`ObjectNotifier`/`ResultsNotifier`, confirmed present and wired end-to-end) is real and would, in principle, let a *cooperating process with access to the live file* receive change notifications directly, without polling. But per §4.1, no external process has that access today. This mechanism is evidenced as **real but currently unreachable**, not fictional and not currently usable.

## 4.3 Can Enterprise OS poll safely?

Yes — polling a **copy** of the export (re-checking the Google Drive-synced backup folder on an interval, which is close to what already happens manually) is architecturally safe and requires no new access mechanism. Polling the **live** file's directory is not reachable per §4.1, so there is nothing unsafe to poll there — the question is moot for the in-place path, not merely risky.

## 4.4 Can Enterprise OS monitor filesystem changes?

Only on paths that are actually reachable. Watching the Google Drive-synced folder that already receives Loka's manual exports (`H:\My Drive\SMJ ENTERPRISE OS\Loka Kasir\...`) for new or modified `.realm` files is architecturally sound and requires nothing beyond a standard filesystem watcher on a folder this project already has full access to — see Opportunity O1 below. Monitoring `/data/data/com.loka.stock/files/db/` for changes is not possible from outside the app's own process on a normal device, per §4.1.

## 4.5 Can Enterprise OS coexist with the running application?

**At the Realm-engine level: yes, by design.** `loka-realm-runtime-v1.md` §2.9's file-locking evidence — the `.realm.lock`/`.realm.management` companion files, and Realm Core's own error message describing what happens when *"a Realm file is currently open in another process"* — confirms multi-process concurrent access is an explicitly designed-for, coordinated scenario in this engine, not an edge case Realm merely tolerates. The engine's own error message names the actual constraint: coexistence requires **compatible Realm Core versions/architectures** across the two processes, not merely "don't do it."

**In practice: the question is moot today**, because §4.1 already establishes no external process can reach the live file at all without root. If a future, cooperating architecture change ever placed an Enterprise OS component legitimately on the same device (for example, if Loka's own vendor added a supported export/sync feature), Realm's own engine would not itself be the obstacle to safe coexistence — the current obstacle is Android's sandboxing, not Realm's concurrency model.

## 4.6 Can Enterprise OS avoid corrupting the database?

**Yes, for the model already in use** — reading a fully-copied, closed snapshot file involves zero concurrent access of any kind, so there is nothing to corrupt.

**A real, named risk exists for any hypothetical alternative that does not go through Realm's own protocol.** If a live file were ever reachable (e.g. via a legitimately cooperating on-device process) and something copied its bytes directly (a raw file copy) while Loka's own process had it open, that copy could capture a torn, inconsistent snapshot — precisely the failure mode Realm's `.lock` file mechanism exists to prevent for *cooperating* readers that go through the actual Realm SDK/locking protocol, but which a naive byte-level copy would not respect. This is a real, evidenced risk (§5, Risk R1), not a hypothetical scare — it follows directly from the locking mechanism's own documented purpose.

---

# Part 5 — Risks

| # | Risk | Evidence basis | Severity |
| --- | --- | --- | --- |
| R1 | **Torn/inconsistent read from a naive raw copy of a live, open file.** A file-system-level copy of `loka-stock.realm` taken while Loka's process has it open, made *without* going through Realm's own SDK/locking protocol, could capture an inconsistent mid-write state. | Realm's `.lock`/`.management` coordination mechanism exists specifically because concurrent access without it is unsafe (`loka-realm-runtime-v1.md` §2.3, §2.9). | High, if this path were ever attempted — but currently moot per §4.1 (no external access to copy from in the first place). |
| R2 | **Realm Core version/architecture incompatibility.** Realm Core's own error message (§4.5) states explicitly that two processes with *incompatible* Realm library versions or architectures cannot safely share access to the same file. | Direct, first-party error string in `librealm.so` (`loka-realm-runtime-v1.md` §2.9). | Medium — only relevant in a future scenario where any second process legitimately opens the live file. |
| R3 | **Schema evolution outpacing any external consumer.** Roughly sixty confirmed schema migrations (versions ~50–109) across the observed build history (`loka-realm-runtime-v1.md` §2.2) show this schema changes frequently and substantially. Any future connector built against today's schema shape risks silent breakage on the next Loka update. | Direct string evidence of the migration count/range. | Medium-High, ongoing. |
| R4 | **Vendor/build updates changing fundamentals with no notice.** This analysis covers exactly one build (versionCode 12 / 1.7.37); no version history was available to establish a trend (`loka-apk-analysis-v1.md` §1.1, §Part 6). A future Loka update could change the database path, add encryption, add Realm Sync, or otherwise invalidate assumptions in this document without any warning to Enterprise OS. | Direct consequence of the single-version limitation already stated. | Medium-High. |
| R5 | **Analyzed build may not represent the true production artifact.** `expo-dev-launcher`/`expo-dev-menu` and an exported `androidx.compose.ui.tooling.PreviewActivity` (`loka-apk-analysis-v1.md` §2.3, §2.9) suggest this specific file may be a staging/internal build, not the exact Play Store release. Conclusions drawn here may not perfectly describe the binary actually running on production devices. | Two independent, directly observed signals. | Medium. |
| R6 | **Backup/export conflict.** The existing, working workflow already depends on Loka's own manual export feature producing `.realm` snapshots. Any future change to *how* or *how often* Enterprise OS reads that same folder must not interfere with, lock, or race against that existing manual export process. | Consequence of the confirmed shared-folder architecture (`loka-apk-analysis-v1.md` §2.8, `MANAGE_EXTERNAL_STORAGE` finding). | Low-Medium, manageable by design (read-only, non-exclusive access to completed files). |
| R7 | **Unsupported access risk if this analysis's boundaries are ever exceeded.** Every finding above assumes continued adherence to this sprint's constraints (no rooting, no APK modification, no live in-place file access). Any future work that crosses those lines would trade a currently well-understood, low-risk posture for an unsupported and higher-risk one. | Direct consequence of §4.1's core finding. | Stated as a standing guardrail, not a probability estimate. |

---

# Part 6 — Opportunities

Only opportunities directly supported by evidence already established; nothing here proposes an access mechanism this analysis found to be unreachable.

**O1 — Filesystem watcher on the existing Google Drive-synced export folder.** `H:\My Drive\SMJ ENTERPRISE OS\Loka Kasir\` (and its `Agustus\`/`Juli\`/`JSON\` subfolders) is a location this project already has full, legitimate, standing access to, and already receives Loka's own manual `.realm` exports. A standard filesystem watcher on this folder — reacting the moment a new or updated `.realm` file finishes syncing — would tighten the feedback loop from "someone manually checks" to "automatically triggered the moment a new export lands," without requiring any new access mechanism at all. This is a direct evolution of a workflow already proven safe, not a new risk surface.

**O2 — Scheduled polling of the same folder, as a fallback to O1.** If a true filesystem-event watcher proves unreliable on Google Drive's virtual/streamed filesystem (this session's own experience enumerating `File Aplikasi Loka\` — three separate timeouts — is a direct, first-hand data point that this filesystem can behave unpredictably for enumeration/watching), a simple periodic poll of the folder's modification state is a safe, lower-tech fallback requiring the same access this project already has.

**O3 — Snapshot comparison (diffing).** Already effectively the model behind this project's existing forensics work comparing successive `.realm` backups. Formalizing this into a standard "diff the new export against the last-ingested one" step is a direct extension of proven practice.

**O4 — Investigate whether Firebase Firestore already carries real business data.** `loka-apk-analysis-v1.md` §2.9 confirms Firestore is bundled and actively registered as a live Firebase component (not a stray dependency) — full `.proto` schema set present, `FirestoreRegistrar` active. **This is evidence-supported as a real question worth investigating, not evidence that it already provides what Enterprise OS needs** — what data (if any) flows through it is entirely unconfirmed. If it does carry real, current business data, a cloud API is categorically safer and more "supported" than any local file-access approach, and would be the strongest available path toward genuine near-real-time access. This is flagged as the single highest-value open question this analysis surfaced, not as a confirmed opportunity.

**Opportunities explicitly not listed, because evidence does not support them:** a live Realm change-listener connection to the in-place database (blocked by Android sandboxing, §4.1); any Android background service/WorkManager-based push mechanism from within Loka itself (would require modifying Loka, explicitly out of scope); any filesystem watch on the live `/data/data/...` path (unreachable, same reason).

---

# Success Criteria — Answered With Evidence

**1. Can Enterprise OS eventually become near real-time?**

Conditionally yes, but not via the mechanism the question's phrasing might suggest (direct, instant, push-based access to the live database). Two evidence-grounded paths exist: (a) tightening the existing export-and-read cycle (O1/O2) can move Enterprise OS from "someone manually checks a backup" to "automatically ingested within seconds to minutes of Loka's own export completing" — genuinely *near* real-time, bounded by how often Loka itself exports, not by anything Enterprise OS controls; (b) if Firestore (O4) is confirmed to carry real business data, a supported cloud API could offer a materially faster path, but this is unconfirmed. **True instant/live access to the in-place database is not architecturally reachable without either rooting the device (explicitly forbidden) or Loka's own vendor adding a new supported access mechanism (would mean modifying Loka, explicitly out of scope) — this is stated plainly, not soft-pedaled.**

**2. What is the safest integration strategy?**

Continue and refine the existing model: **read completed, closed copies of Loka's own exports, from a location Enterprise OS already has legitimate access to.** This requires no new access mechanism, contends with neither Android's sandboxing nor Realm's file-locking model, and is already proven in this project's own history. Layering a filesystem watcher (O1) or scheduled poll (O2) on top of that existing model is the safest available improvement. Investigating Firestore (O4) as a parallel, independent track is the safest available path toward something more than "near" real-time, precisely because it would not touch the local file at all.

**3. What assumptions remain unverified?**

- Whether the analyzed APK (`loka-stock-v1-7-37.apk`) matches the actual production build end users and Loka's own operators run day-to-day, given R5's staging/internal-build signals.
- The exact Realm Core version (four candidate strings found, none conclusively attributed — `loka-realm-runtime-v1.md` §2.1).
- Whether encryption and Realm Sync are truly inactive in the *live, in-app* database specifically, as opposed to inactive only in the exported backup files this project has already read (§2.5, §2.6 of the runtime document — both assessed with high confidence, neither conclusively proven).
- What data, if any, actually flows through the confirmed, active Firestore integration (O4) — the single largest open question.
- The entire architectural history represented by `File Aplikasi Loka\`'s inaccessible contents (`loka-apk-analysis-v1.md` §1.1) — whether the database path, migration strategy, or any other finding in this document has changed across versions is completely unknown.
- The actual backup-inclusion/exclusion rule for the Realm database under Android's own Auto Backup feature (`dataExtractionRules`/`fullBackupContent` resources were referenced but not decoded — `loka-apk-analysis-v1.md` §2.2).

**4. What experiment should be performed next?**

In order of value versus risk, staying strictly within this sprint's read-only, no-execution, no-rooting boundaries:
1. **Resolve access to `File Aplikasi Loka\`** (retry via a different mechanism, or request the business owner move/copy its contents somewhere more immediately reachable) to complete the version-history comparison this sprint could not perform.
2. **Decode `resources.arsc`'s `dataExtractionRules`/`fullBackupContent` resources** (still pure static analysis, no execution) to determine definitively whether the Realm database is excluded from Android's own cloud backup mechanism — this bears directly on data-governance questions, not just connector feasibility.
3. **Ask the business owner directly** whether Firestore/cloud sync is a documented, already-available capability of the Loka product they have — or could obtain — legitimate credentials for. This is a business inquiry, not further reverse engineering, and is the fastest way to resolve O4, the highest-value open question, without any additional technical risk.

**Explicitly not recommended as a next step:** running/executing the analyzed APK, capturing its live network traffic, or acquiring root access to inspect the live database in place — all would cross this sprint's own stated constraints.

**5. Overall feasibility: MEDIUM**

**Justification.** Not **LOW**, because a real, evidence-grounded, low-risk path to tangibly better freshness exists today (O1/O2, a direct evolution of an already-proven workflow) and a plausible, evidence-supported path to something considerably better exists but is unconfirmed (O4, Firestore). Not **HIGH**, because the specific outcome implied by "near real-time" in its strongest sense — live, instant, event-driven updates from the database itself — is blocked by a hard, well-evidenced operating-system constraint (§4.1) that no amount of Realm-level cleverness resolves without either rooting a device (forbidden) or Loka's own vendor cooperation (would mean modifying Loka, out of scope). The feasible improvement available today is bounded by Loka's own export cadence, not by Enterprise OS's own capability — that ceiling, not any unresolved technical risk, is what keeps this at **MEDIUM** rather than **HIGH**.

---

# Final Report

**Confirmed facts.** Package `com.loka.stock`, versionName 1.7.37; single-Activity React Native/Expo app with zero app-authored Services, Receivers, or data-exposing Providers; no WorkManager, no app-authored JobScheduler, no `dataSync` foreground service anywhere in the manifest; Realm Core (`librealm.so`, the largest native library in the app) backing a local database at the Android-private path `/data/data/com.loka.stock/files/db/loka-stock.realm`, with confirmed `.lock`/`.management` multi-process coordination files, confirmed native change-notifier classes wired to JavaScript, confirmed read-only-open and compaction support, and roughly sixty numbered schema migrations (versions ~50–109) evidencing an actively evolving schema; Firebase Firestore bundled and actively registered as a live component.

**Unknowns.** Whether this specific APK matches the true production build (two independent staging-build signals found); the exact Realm Core version; whether Sync/encryption are inactive in the live app specifically (versus only in the backups already read); what data flows through Firestore; the entire contents and version history of `File Aplikasi Loka\`; the Android Auto Backup inclusion rule for the Realm database.

**Architectural risks.** A torn read from any naive raw copy of a live, open file (currently moot, since no external access exists); Realm Core version/architecture incompatibility in any future coexistence scenario; ongoing schema evolution outpacing a future connector; vendor updates changing fundamentals with no notice; the analyzed build possibly not representing production; potential interference with the existing manual export workflow if not designed carefully around it.

**Opportunities.** A filesystem watcher, or scheduled-poll fallback, on the Google Drive-synced export folder Enterprise OS already has legitimate access to (the single most concrete, low-risk improvement available today); formalized snapshot-diffing on top of that; and — the highest-value open question — determining whether the app's own confirmed, active Firestore integration already carries real business data, which would offer a categorically safer and faster path than any local-file approach.

**Recommended next experiment.** Ask the business owner directly whether Firestore-based cloud sync is a real, credential-accessible capability of Loka today — this single question, answerable without any further reverse engineering, has the highest potential to change this document's MEDIUM feasibility rating in either direction, and is the most responsible place to spend the next unit of effort on this question.

No code was written. Nothing was implemented. No APK was modified, executed, or redistributed. Nothing was committed.
