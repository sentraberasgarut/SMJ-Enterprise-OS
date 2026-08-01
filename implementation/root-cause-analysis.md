# Root Cause Analysis — Node Process Does Not Exit After Using `realm`

**Date:** 2026-08-01
**Scope:** `prototype/loka-canonical-poc` — investigation only. No code was changed, no fix was implemented, nothing was committed.
**Prior context:** flagged as F1 in `implementation/validation-report.md` — a process-exit hang observed on `node src/index.js` and on any test file that requires `src/extract.js` (which requires the `realm` package).

---

## Observed Behaviour

- `node src/index.js`, run against the real 30 July backup, completes all four pipeline stages, logs a full structured "run summary," logs `"Done. Nothing was written back to the source backup."` — and then never returns control to the shell. The process must be killed externally.
- `tests/shared.test.js`, isolated with a 45s hard timeout, logs all 10 of its assertions passing (~10ms of real work) and then sits alive until the timeout kills it.
- `tests/validate.test.js` and `tests/fieldParser.test.js` — neither requires `src/extract.js` — exit cleanly and immediately (exit code 0) every time.
- Two `node.exe` processes from a pre-compaction session (started 31 Jul, 10:01 PM and 10:03 PM, both running `src/index.js`) were still alive at the *start* of this investigation, roughly 8 hours later — independent, real-world corroboration that this is a persistent, reproducible hang, not a one-off.

---

## Experiments

All experiments below were run directly (not simulated) from a standalone script requiring `realm` via its absolute path in `prototype/loka-canonical-poc/node_modules/realm`, using `realm@20.2.0` on Node `v26.5.0`, Windows x64. Each was wrapped in a hard `timeout` so a hang would produce a killed-process exit code (`124`) rather than blocking indefinitely.

### Experiment A — require only, nothing else
```js
const Realm = require('realm');
// ...then, after 200ms via setTimeout:
process._getActiveHandles().length   // 0
process._getActiveRequests().length  // 0
// script reaches its last line, no process.exit() called
```
**Result: hangs.** `timeout` killed it (exit code `124`) despite the script having logged its final line and despite zero active handles/requests being reported. No `Realm.open()` was ever called — this reproduces the hang from a bare `require()` alone.

### Experiment B — open + close a real Realm, no explicit shutdown
```js
const realm = await Realm.open({ path: BACKUP, readOnly: true });
realm.objects('Product').length;  // 47
realm.close();
realm.isClosed;                   // true
process._getActiveHandles().length   // 0
process._getActiveRequests().length  // 0
```
**Result: hangs.** Exit code `124`. This is functionally identical to what `src/extract.js` does today — open, read, close — and matches its behavior exactly. `isClosed === true` and zero reported handles/requests, and it still does not exit.

### Experiment C — open + close + `Realm.shutdown()`
Identical to B, with one line added after `close()`:
```js
Realm.shutdown();
```
**Result: exits cleanly.** Exit code `0`. Total in-process work: 81ms. The process terminated on its own, no `timeout` kill needed.

### Experiment D — require only + `Realm.shutdown()`, no `Realm.open()` ever called
```js
const Realm = require('realm');
Realm.shutdown();
```
**Result: exits cleanly.** Exit code `0`. Confirms the keep-alive mechanism exists from the moment the module is `require()`'d — before any Realm instance is ever created — and that `Realm.shutdown()` neutralizes it even with zero Realms opened.

### CPU / thread sampling on a hung process (Experiment B, re-run in background)
```
Thread count:            13
CPU time at t=0s:        00:00:00.59
CPU time at t=+2s:       00:00:00.59   (delta: 0.0s of CPU consumed over 2 wall-seconds)
```
The hung process is **idle**, not spinning — 13 live OS threads consuming 0% CPU while parked. This rules out a JS-level busy-loop or a runaway `process.nextTick`/microtask chain (which would show measurable CPU and would appear in Node's own request/handle accounting). It is consistent with a native thread pool sitting blocked on a condition variable, waiting for work that will never come.

---

## Evidence Summary (mapped to the original 10 questions)

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Does Realm keep native threads alive? | **Yes.** | 13 OS threads alive and idle on a hung process that only ever required + opened + closed one Realm (Experiment B). |
| 2 | Does Realm keep file handles open? | **Not the cause.** | Experiment A hangs identically with no file ever opened at all — no `.realm` path involved. |
| 3 | Does Realm require explicit `realm.close()`? | **Necessary but not sufficient.** | Experiment B calls `close()`, confirms `isClosed === true`, and still hangs. Closing the instance is correct practice but does not by itself free the process. |
| 4 | Does any object still reference Realm after extraction? | **No — ruled out.** | `extract.js`'s `realm` local goes out of scope on return; extracted records are plain objects from `.toJSON()`, no live native binding. Experiment A hangs with **no object of any kind** ever created from the module, which rules out "a lingering reference in our code" as a possible cause outright. |
| 5 | Does `extract.js` leak Realm instances? | **No.** | Code review (already performed in the validation sprint) confirmed `realm.close()` is called on every path: success, schema-drift failure, and per-entity extraction failure. Experiment B reproduces the identical open→read→close sequence and still hangs — the hang is not conditional on any leak in our code. |
| 6 | Does Node keep an active event loop because of Realm? | **Not in a way Node's own APIs can see.** | `process._getActiveHandles()` and `process._getActiveRequests()` report `0`/`0` in every hung experiment (A and B). Combined with the idle-thread finding, the correct framing is: Node's own libuv event loop is empty, but the OS process is kept alive by native worker threads the addon spawned outside of Node's handle-tracking (they were not created through Node's N-API/NAN `HandleWrap` machinery, so `_getActiveHandles()` cannot enumerate them). |
| 7 | Reproducible in a ~10-line script? | **Yes — and more minimally than expected.** | Experiment A is 2 lines of real logic (`require('realm')`, then inspect handles/requests) — no `Realm.open()` needed at all. |
| 8 | Minimal reproduction | **Delivered above (Experiment A).** | See "Experiment A" — the smallest form: `require('realm')` alone hangs the process. |
| 9 | `_getActiveHandles()` / `_getActiveRequests()` inspection | **Performed in every experiment.** | Consistently `0`/`0` even while hung — this mismatch (empty per Node's introspection, yet alive at the OS level) is itself the key diagnostic signal pointing at native, non-libuv threads. |
| 10 | Our bug (A) or Realm library behaviour (B)? | **B — Realm library behaviour.** | See Conclusion below. |

---

## Conclusion

This is **Realm library behaviour, not a bug in this codebase.**

Four independent facts converge on the same conclusion:

1. **The hang predates any code we wrote.** Experiment A hangs from `require('realm')` alone — before `extract.js`, `Realm.open()`, or any object we control ever runs.
2. **Our code already does the "correct" thing.** `extract.js` calls `realm.close()` on every exit path (verified in the prior validation sprint and re-confirmed here). Experiment B shows that doing so — exactly as our code does — is not sufficient to free the process.
3. **The library ships an official, purpose-built fix for exactly this symptom.** `Realm.shutdown()`'s own doc comment (`node_modules/realm/dist/public-types/Realm.d.ts`, line 55) reads: *"Closes all Realms, cancels all pending Realm.open calls, clears internal caches, resets the logger and collects garbage. Call this method to free up the event loop and allow Node.js to perform a graceful exit."* — this is a first-party acknowledgment from the library authors that requiring/using Realm does not allow a graceful exit on its own.
4. **Calling that documented method empirically resolves the hang in every tested scenario** — with a real Realm opened and closed (Experiment C), and even with no Realm ever opened at all (Experiment D).

The underlying mechanism (best-supported explanation, not directly inspectable without native debugging tools): `realm-js`'s native addon (`prebuilds/node/realm.node`) initializes a persistent background thread pool at module-load time — likely realm-core's internal scheduler/notification machinery — using raw OS threads rather than threads registered through Node's N-API handle-tracking. That is why `process._getActiveHandles()`/`_getActiveRequests()` report empty while the OS process still has 13 live, idle threads. `Realm.shutdown()` is the documented, explicit call that tears this down.

## Recommended Fix

**Not implemented, per instructions.** For the record, so the next sprint can act on it directly:

- Call `Realm.shutdown()` once, at the very end of the pipeline's process lifetime in `src/index.js` — after `exportResults()` succeeds, and also in the top-level `.catch()` handler so a failed run exits cleanly too. It should **not** go inside `extract.js` itself: `Realm.shutdown()` is a global, whole-process teardown ("closes **all** Realms, cancels **all** pending opens") rather than a per-call cleanup, so it belongs at the outermost boundary of the process's Realm usage, not inside a function that could in principle be called more than once per process in the future.
- For the test suite, the equivalent fix is an `after()` hook calling `Realm.shutdown()` in `tests/shared.test.js` and `tests/regression.test.js` (the two files that touch `src/extract.js`), so `node --test` can complete and print its own aggregate summary instead of requiring an external `timeout` wrapper.
- This is a small, mechanical, low-risk change (one documented static method call, two call sites) — but it is still a code change and is out of scope for this analysis.

## Confidence Level

**Very High.** This was root-caused through direct, isolated, reproducible experimentation — not inferred from documentation or by analogy. The same fix (`Realm.shutdown()`) independently resolved two structurally different repro cases (with and without an actual Realm ever being opened), and the library's own documentation states, in its own words, that this exact symptom is what the method exists to solve.
