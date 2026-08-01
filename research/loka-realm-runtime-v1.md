# Loka Realm Runtime v1

| | |
| --- | --- |
| **Type** | Read-only architecture research — continuation of [`loka-apk-analysis-v1.md`](loka-apk-analysis-v1.md). |
| **Date** | 1 August 2026 |
| **Subject** | The Realm database engine embedded in `loka-stock-v1-7-37.apk` (`com.loka.stock`, versionCode 12), the only APK version accessible this sprint. |
| **Method** | Plain-text string extraction (equivalent to the standard `strings` utility) from `librealm.so` (9,368,624 bytes, Realm Core's native C++ engine) and `assets/index.android.bundle` (8,340,796 bytes, Hermes JavaScript bytecode version 96 — the app's compiled business logic), read against the officially documented, public Realm Core error-message and C++ symbol vocabulary. No binary was disassembled to machine code, no proprietary algorithm was reconstructed, and nothing was modified. Every fact below distinguishes what was **directly observed** (a literal string, error message, or symbol name found in the binary) from what is **inferred** (a conclusion drawn from that evidence plus publicly documented Realm architecture), and marks anything neither observed nor safely inferable as **UNKNOWN**. |

---

# Part 2 — Realm

## 2.1 Realm SDK and Core Version

**Realm SDK (JS binding):** `io.realm.react` (community React Native Realm SDK's Android native module — see `loka-apk-analysis-v1.md` §2.9). Exact npm semver: **UNKNOWN** — the package identifier confirms which binding is in use, not its precise release.

**Realm Core version:** **UNKNOWN, not conclusively determined.** Four version-like strings (`12.2.1`, `12.2.2`, `14.3.2`, `16.3.6`) were found inside `librealm.so`, but `librealm.so` is a large, multi-component native library that also statically links other dependencies (an OpenSSL source path, `.../nssl-3.3.1.../crypto/async/async.c`, was directly observed in the same binary) — none of the four candidate strings could be conclusively attributed to Realm Core itself versus a bundled dependency without deeper binary analysis, which was not attempted (outside this sprint's scope). Reported as observed candidates, not a confirmed fact.

## 2.2 Schema Version

**Directly observed:** the string pattern `realmMigrationToVersion<N>` appears repeatedly throughout `index.android.bundle`, with a densely populated, consecutive sequence of integers from **50 through 109** (specifically: 50, 58–65, 68–72, 75, 77–80, 82, 84, 85, 87–92, 97, 98, 100–109 — not every integer in the range appears, consistent with some migration steps having been consolidated or removed over the app's history, not with the extraction method missing them). Two outlier matches (`675704`, `101065`) were also found but are almost certainly artifacts of the search pattern matching adjacent unrelated digits in the compiled bytecode, not real migration version numbers, and are excluded from the range above.

**Inference:** this is strong, direct evidence that the Realm schema in this build (versionName 1.7.37) is at, or has passed through, **schema version 109** — a substantial, actively-maintained migration history of roughly sixty distinct steps. The exact *current* schema version enforced by the live `RealmConfiguration` (i.e., whether 109 is the ceiling or an intermediate step) is **UNKNOWN** — only the highest cleanly-matching migration function name found is reported.

## 2.3 Database Location

**Directly observed**, via three independent literal path strings found in `index.android.bundle`:

```
file:///data/data/com.loka.stock/files/db/loka-stock.realm
file:///data/data/com.loka.stock/files/db/loka-stock.realm.management
file:///data/data/com.loka.stock/files/db/loka-stock.realm.lock
```

The database lives at `/data/data/com.loka.stock/files/db/loka-stock.realm` — **standard Android app-private internal storage**, not external/shared storage. The `.management` (a directory Realm Core uses for inter-process coordination state) and `.lock` (the advisory lock file Realm Core uses to coordinate concurrent readers/writers across processes) companion paths confirm Realm's standard multi-file storage layout is in use, unmodified.

**This location is the single most important fact in this document for the feasibility question that follows**: under Android's normal application-sandboxing security model, a path under `/data/data/<package>/` is readable only by that app's own UID (or a process running as `root`), regardless of what permissions that app itself declares (`MANAGE_EXTERNAL_STORAGE` governs *shared/external* storage, not other apps' private internal storage). See `live-connector-feasibility-v1.md` for the consequence of this fact.

## 2.4 Migration Strategy

**Directly observed:** the SDK validation string `"Cannot set 'deleteRealmIfMigrationNeeded' when 'onMigration' is set"` exists, alongside a separate string referencing `'onMigration' on realm configuration`, and — critically — the roughly sixty numbered `realmMigrationToVersion<N>` functions described in §2.2.

**Inference:** the sheer existence of dozens of specific, numbered migration functions is strong circumstantial evidence that Loka's `RealmConfiguration` uses a **custom `onMigration` callback** (real, incremental schema migration logic), not the blunt `deleteRealmIfMigrationNeeded` option (which would erase and recreate the database on every schema bump, and would have no reason to contain dozens of named per-version migration functions). This is an inference from strong circumstantial evidence, not a directly quoted configuration value — **the literal `RealmConfiguration` object passed by the app was not isolated and read directly.**

## 2.5 Encryption

**Directly observed:** the generic SDK type-validation string `"Expected 'encryptionKey' on realm configuration to be an ArrayBuffer, ArrayBufferView (Uint8Array)..."` confirms the `encryptionKey` configuration option exists and is supported by this build's Realm SDK. This is a library-capability fact, not evidence the option is actually used by Loka.

**No direct evidence that Loka enables encryption was found** in this analysis. **Independent, stronger corroborating evidence exists outside this specific analysis**: this project has, in prior sessions, already successfully opened real Loka `.realm` backup files directly (via the canonical connector prototype in `prototype/loka-canonical-poc/`) with no decryption key supplied. Encryption cannot be *proven* absent from static string analysis of the APK alone — an app can supply a key purely at runtime with no static trace — but combined with that independent, already-established fact, **encryption is assessed as not in use, with high confidence, not merely reported as unknown.**

## 2.6 Open Mode (Local vs. Synchronized)

**Directly observed:** `librealm.so` contains multiple Realm Sync (MongoDB Atlas Device Sync)–specific error strings, including `"Synchronized Realms cannot be opened in non-sync mode, and vice versa"` and `"The primary key property on a synchronized Realm must be named '_id'..."`, plus native symbols `SyncClient` / `SyncServer`. This confirms Realm Core in this build **was compiled with Sync capability available** — a generic build characteristic of the SDK, not proof Sync is active for Loka's own database.

**Inference, not direct proof:** the database path observed in §2.3 (`.../files/db/loka-stock.realm`, a plain local filename with no sync-realm-style naming convention) and this project's own established pattern of Loka requiring a *manual* export/backup step to produce a `.realm` snapshot (inconsistent with a database that is already continuously synced to a cloud backend, which would need no manual backup step at all) both point toward a **local, non-synchronized Realm** in normal production use. This is assessed with high confidence but is **not conclusively proven** by static analysis alone — flagged accordingly.

## 2.7 Write Transaction Model

**Directly observed**, via native C++ symbols and error strings in `librealm.so`:
- `"Can only convert Realms outside a transaction."` — confirms an explicit, bounded write-transaction API is in use (standard Realm `realm.write(callback)` semantics).
- `Transaction`, `DB::async_request_write_mutex`, `Transaction::async_complete_writes` (demangled from mangled C++ symbols such as `N5realm4util14UniqueFunctionIFvvEE12SpecificImplIZNS_11Transaction21async_complete_writesES3_E3$_0EE`) — confirms Realm Core's standard MVCC (multi-version concurrency control) transaction engine, **including support for asynchronous write-mutex acquisition and asynchronous commit completion** — a real capability of this Core build.
- `"Number of active versions (%1) in the Realm exceeded the limit of %2"` — confirms the MVCC versioning model (multiple historical versions of the database can be simultaneously open, bounded by a limit) is active, standard Realm Core behavior.

Whether Loka's own application code uses synchronous or asynchronous transactions specifically is **UNKNOWN** — both are supported by the engine; which one the app's JS code actually calls was not isolated.

## 2.8 Read Transaction Model

**Not independently re-derived from this specific binary beyond confirming it is an unmodified, standard Realm Core build** (§2.1, §2.7). Realm's well-documented, standard architecture provides each thread an automatically-updating, always-consistent read snapshot with no explicit "begin read" call required — this is stated as the expected, standard behavior for the confirmed Realm Core engine in use, not as a fact independently re-verified against this exact build's source.

## 2.9 Thread Model

**Directly observed**, via native C++ symbols: `ALooperScheduler`, `FrozenScheduler`, `ReactScheduler`, and a plain `Scheduler` base class, all under the `realm::util` and `realm::_impl` namespaces.

**`ALooperScheduler` is direct, confirmed evidence that Realm's notification delivery on this Android build is scheduled via the Android main thread's native `Looper`/message-queue mechanism** — consistent with, and confirming, Realm's standard thread-confinement model (a given Realm instance, its live objects, and its notifications are all bound to the thread — in this app's case, ultimately the Hermes/JS thread via the `ReactScheduler` wrapper — that opened it).

## 2.10 Cache

**Directly observed:** Realm Core's internal storage-engine assertions reference a `freelist`-based slab allocator (`assertion failed: WITHIN_FREELIST(list)`, `sh.freelist`, etc.) — this is Realm's own low-level, memory-mapped-file storage engine managing its internal free space, not a SQLite-style page cache. Combined with the `.management`/`.lock` companion-file evidence (§2.3), this confirms Realm's standard architecture: the `.realm` file is memory-mapped directly by each process that opens it, with the `.lock` file coordinating which process may extend/compact the shared mapping — there is no separate "cache" layer in the conventional database sense to characterize beyond this.

## 2.11 Notifications and Observers

**Directly and strongly observed** — this is one of the best-evidenced findings in this entire analysis. Native C++ symbols confirm Realm Core's full notifier hierarchy is compiled in and actively bridged to the JavaScript layer:

- Classes: `CollectionNotifier`, `ObjectNotifier`, `ListNotifier`, `ResultsNotifier`, `ListResultsNotifier`, `ResultsNotifierBase` (all under `realm::_impl`).
- Bridge symbols: `ObjectNotifier_add_callback`, and the mangled symbol `N5realm2js3JSI...ObjectNotifier_add_callback...` — direct evidence the JS binding layer (`realm::js::JSI`) wires these native notifiers to JavaScript callback functions.
- Diagnostic strings confirming these are live, in-use code paths (not merely linked-but-unused): `"Creating CollectionNotifier for %1"`, `"Creating ListResultsNotifier for %1"`, `"Creating ObjectNotifier for %1"`, `"Creating ResultsNotifier for %1"`, `"Notifier %1 gone"`.
- In `index.android.bundle` directly: the SDK validation string `"...only 'change', 'schema' and 'beforenotify' are supported"` confirms the JS-level `realm.addListener(eventName, callback)` API recognizes exactly these three event names, matching the documented, public realm-js API.

**Conclusion: Realm's native change-listener/notification mechanism is present, compiled in, and wired end-to-end from the C++ engine through to JavaScript.** Whether Loka's *own application code* explicitly calls `realm.addListener(...)`, versus relying transparently on the same underlying mechanism through higher-level React hooks (e.g. `useQuery`/`useObject` from `@realm/react`, which use these same notifiers internally without the app author writing an explicit listener), **could not be distinguished from string evidence alone** — both usages would leave an identical trace. Reported as: the mechanism is confirmed present and reachable; its exact call site and triggering condition within Loka's own code is UNKNOWN.

---

# Part 3 — Runtime Observations

Every item below is evidence found (or explicitly not found) in this static analysis. No runtime instrumentation, execution, or dynamic tracing of the app was performed — everything here is what a fully static read of the shipped binary can support.

| Evidence sought | Observed? | Evidence |
| --- | --- | --- |
| **Automatic writes** (writes not triggered by direct user action) | **No evidence found** | No WorkManager, no app-authored JobScheduler, no app-authored BroadcastReceiver, no `dataSync`-type foreground service exist anywhere in the manifest (`loka-apk-analysis-v1.md` §2.4–§2.7). Every confirmed write-transaction code path traces to the single `MainActivity`/JS runtime. This does not prove a JS-level `setInterval`-driven writer is impossible (see limitation below), but no such mechanism was found. |
| **Delayed commits** | **Engine capability confirmed; app usage UNKNOWN** | `async_request_write_mutex` / `async_complete_writes` symbols (§2.7) confirm Realm Core supports asynchronous transaction completion. Whether Loka's own code uses this asynchronous path, versus simple synchronous `realm.write()`, was not determined. |
| **Write batching** | **Standard engine behavior, not independently distinguishable** | Realm's MVCC model inherently batches every write inside one `realm.write()` block into a single committed version — this is standard behavior for any Realm app, not a Loka-specific customization observable via string analysis. |
| **Background synchronization** | **No evidence found** | No WorkManager, no app-authored JobScheduler, no `BackgroundFetch`/`TaskManager` API usage found in `index.android.bundle` (the only "BackgroundFetch"-adjacent strings found were the standard `UIBackgroundFetchResultNewData`/`Failed`/`NoData` constants belonging to a generic cross-platform networking library's iOS-facing boilerplate, not an active Android background-fetch registration). No `registerTaskAsync` or `TaskManager` strings found at all. |
| **Timers** | **No business-logic timer evidence found** | No literal business-purpose `setInterval`/scheduled-sync markers were found. The only `addListener`/`removeListener` patterns found in the JS bundle belong to `react-native-reanimated`'s animation-value listeners and React Native's generic `NativeEventEmitter` — UI/animation-layer, not data-layer. **Limitation, stated plainly:** a targeted string search cannot exhaustively rule out every possible in-app `setInterval` call, since that JavaScript builtin is used pervasively and benignly by many bundled libraries; absence of a *business-purpose* timer marker is reported as "no evidence found," not as "proven impossible." |
| **Listeners** | **Confirmed at the SDK level** (§2.11) | Realm's full notifier stack is present and bridged to JS. |
| **Realm change listeners** | **Confirmed reachable; app-level call site not isolated** | See §2.11's conclusion. |
| **File locking** | **Confirmed** | `.realm.lock` and `.realm.management` paths directly observed (§2.3); Realm Core's own error message — `"Realm file '%1' is currently open in another process which cannot share access with this process. This could either be due to the existing process being a different architecture or due to the existing process using an incompatible version of Realm..."` — is direct, first-party confirmation that multi-process concurrent access is a real, designed-for, coordinated scenario in this engine, not an edge case. |
| **WAL usage** | **Not applicable in the literal SQLite-WAL sense; a related but architecturally different mechanism is confirmed** | No literal "WAL" (Write-Ahead Log) terminology was found anywhere in `librealm.so`, and none should be expected — Realm Core does not use SQLite's WAL journal mode. Instead, durability and inter-process coordination are handled by Realm's own proprietary MVCC design: the `.lock` file plus `.management` shared state (§2.3), backed by direct `fsync`/`msync` system calls (both confirmed present as native symbols, including the diagnostic string `"msync() failed"` / `"msync() retries exhausted"`). This serves a comparable durability/coordination purpose to a WAL but is a categorically different, Realm-proprietary mechanism — stated precisely rather than answered with a simple yes/no. |

**Additional directly observed capability, not explicitly requested but load-bearing for the next document:** Realm Core supports on-demand database **compaction** (`Realm_compact`, `"DB compacted from: %1 to %2 in %3 us"`, `"Can't compact a read-only Realm"`, `"Can't compact a Realm within a write transaction"`) and explicitly supports **opening a Realm file in read-only mode** as a first-class code path (`"Realm file at path '%1' cannot be opened in read-only mode because it has a file format version (%2) which requires an upgrade"` — an error message that only exists because read-only opening is a normal, supported operation with its own failure mode, not an unsupported hack).

---

No APK, database, or code was modified, executed, or redistributed. No binary was disassembled to machine code. Nothing was committed.
