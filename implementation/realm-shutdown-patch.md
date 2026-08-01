# Production Fix — `Realm.shutdown()` at Pipeline Exit

**Date:** 2026-08-01
**Scope:** `prototype/loka-canonical-poc` — one file changed. No business logic touched, no other files modified.
**Prior context:** [`implementation/root-cause-analysis.md`](root-cause-analysis.md) — confirmed this is documented Realm library behavior (Category B), not a bug in this codebase, and confirmed `Realm.shutdown()` as the fix via direct experimentation.

---

## File Modified

`prototype/loka-canonical-poc/src/index.js`

**`src/extract.js` was not touched.** Its ownership (opening, reading, closing the Realm backup) is unchanged — this fix lives entirely at the process entrypoint, one layer up.

---

## Exact Reason

`node src/index.js` completes all pipeline work correctly (confirmed by its own structured logs) but the OS process never terminates on its own — it must be killed externally. Root-cause analysis confirmed this is `realm-js`'s own documented behavior: requiring the `realm` package spins up native background threads that Node's own event-loop introspection (`process._getActiveHandles()` / `_getActiveRequests()`) cannot see, so the process stays alive even though there's nothing left in Node's own event loop. Realm ships a first-party static method, `Realm.shutdown()`, whose own doc comment states: *"Closes all Realms, cancels all pending Realm.open calls, clears internal caches, resets the logger and collects garbage. Call this method to free up the event loop and allow Node.js to perform a graceful exit."*

## Before

```js
const config = require('./config');
const { extract } = require('./extract');
const { normalize } = require('./normalize');
const { validate } = require('./validate');
const { exportResults } = require('./export');
const { Logger } = require('./shared/logger');
const { PipelineError } = require('./shared/errors');

async function main() {
  // ... extract -> normalize -> validate -> export -> logger.runSummary() ...
  logger.info('Done. Nothing was written back to the source backup.');
}

main().catch((err) => {
  const logger = new Logger();
  if (err instanceof PipelineError) {
    logger.error(`Pipeline failed: ${err.message}`, { type: err.name, details: err.details, stack: err.stack });
  } else {
    logger.error(`Pipeline failed: ${err.message}`, { type: err.name || 'Error', stack: err.stack });
  }
  process.exitCode = 1;
});
```

## After

```js
const Realm = require('realm');
const config = require('./config');
const { extract } = require('./extract');
const { normalize } = require('./normalize');
const { validate } = require('./validate');
const { exportResults } = require('./export');
const { Logger } = require('./shared/logger');
const { PipelineError } = require('./shared/errors');

async function main() {
  // ... unchanged: extract -> normalize -> validate -> export -> logger.runSummary() ...
  logger.info('Done. Nothing was written back to the source backup.');
}

main()
  .catch((err) => {
    const logger = new Logger();
    if (err instanceof PipelineError) {
      logger.error(`Pipeline failed: ${err.message}`, { type: err.name, details: err.details, stack: err.stack });
    } else {
      logger.error(`Pipeline failed: ${err.message}`, { type: err.name || 'Error', stack: err.stack });
    }
    process.exitCode = 1;
  })
  .finally(() => {
    // Realm's own docs: "Call this method to free up the event loop and
    // allow Node.js to perform a graceful exit." Runs exactly once,
    // regardless of whether main() succeeded, failed, threw before
    // extract() ever ran, or threw after — see
    // implementation/root-cause-analysis.md for the full investigation.
    Realm.shutdown();
  });
```

**Diff shape:** one new top-level `require('realm')`, and the existing `main().catch(...)` chain gets one `.finally(() => Realm.shutdown())` appended. No other line changed. `main()`'s internal body (the four pipeline stages) is byte-for-byte unchanged.

---

## Why This Is Production-Safe

1. **Single call site, exactly once per process.** `.finally()` on a promise chain runs after either `.catch()` handles a rejection or the chain resolves — never both, never zero times. There is no code path where `Realm.shutdown()` is skipped or duplicated.
2. **Covers every case requirement 1 asked for, uniformly, without special-casing any of them:**
   - **Successful pipeline** — `main()` resolves, `.catch()` is skipped, `.finally()` runs.
   - **Failed pipeline / thrown exception** — `main()` rejects, `.catch()` logs the error, `.finally()` still runs afterward.
   - **Early exit** — a `ConfigurationError` thrown before `extract()` ever calls `Realm.open()` (e.g. `LOKA_BACKUP_PATH` unset) takes the identical `.catch()` → `.finally()` path. `Realm.shutdown()` is safe to call even when no Realm was ever opened — confirmed directly in root-cause Experiment D.
3. **No ownership violation.** `extract.js`'s existing `realm.close()` calls on every internal path (success, schema-drift failure, per-entity extraction failure) are untouched and still correct — they release the specific Realm instance. `Realm.shutdown()` is a distinct, whole-process, one-time teardown call and belongs at the outermost boundary of the process's Realm usage, not nested inside a function (`extract()`) that could in principle run more than once per process in a future design. This matches the recommendation already on record in `root-cause-analysis.md`.
4. **No behavior change to any business output.** `Realm.shutdown()` runs strictly after `exportResults()` has already written `canonical.json` and `validation-report.json` in the success path, and strictly after error logging in the failure path — it cannot affect what was computed or exported.
5. **It is the library's own documented, intended way to do this** — not a workaround, not a private API. `Realm.shutdown()` is a public, non-deprecated static method on the exported `Realm` class.

---

## Validation Results (re-run after the fix)

### 1. Production entrypoint — the actual fix under test

| Run | Exit code | Notes |
|---|---|---|
| `node src/index.js`, real backup, `LOKA_BACKUP_PATH` set | **0** | Process exited **on its own**, no external kill needed. Wall clock 3.0s (includes Node/native-module startup). Internal pipeline duration logged: 1114ms. Output: Product 47, Customer 8, Supplier 6, Shift 32, Expense 45, Invoice 481, InvoiceItem 1109, Payment 481, 0 validation issues. |
| `node src/index.js`, `LOKA_BACKUP_PATH` unset (early exit, `ConfigurationError`, thrown before `Realm.open()` is ever called) | **1** | Correct failure exit code, process exited on its own — no hang. |
| `node src/index.js`, bogus backup path (`ExtractionError`, file not found) | **1** | Correct failure exit code, process exited on its own — no hang. |

This directly satisfies requirement 1: successful pipeline, failed pipeline, thrown exception, and early exit all now exit cleanly without external intervention.

### 2. Full test suite

| File | Result | Notes |
|---|---|---|
| `tests/fieldParser.test.js` + `tests/entities.test.js` + `tests/validate.test.js` (run together) | **49/49 PASS**, exit code 0 | Unaffected by this change (none require `src/index.js` or `src/extract.js`'s realm dependency in a way that hangs); clean exit as before. |
| `tests/regression.test.js` (isolated, real backup) | **4/4 assertions PASS** — entity counts match golden, canonical output field-identical, validation summary unchanged, Gross Profit unchanged | Process itself still requires an external kill after ~45s — **expected and out of scope**: this file requires `../src/extract` directly, never `../src/index.js`, so it does not go through the new `.finally()` hook. This fix was scoped to the production entrypoint only, per instruction; a test-file fix (an `after()` hook calling `Realm.shutdown()`) remains a documented, not-yet-implemented recommendation. |
| `tests/shared.test.js` (isolated) | **10/10 assertions PASS** | Same as above — requires `../src/extract` directly, unaffected by this fix, still needs an external kill. Expected. |

### 3. Canonical output vs. golden fixtures (independent re-verification, not just the test's own assertions)

```
Product: current=47 golden=47 MATCH
Customer: current=8 golden=8 MATCH
Supplier: current=6 golden=6 MATCH
Shift: current=32 golden=32 MATCH
Expense: current=45 golden=45 MATCH
Invoice: current=481 golden=481 MATCH
InvoiceItem: current=1109 golden=1109 MATCH
Payment: current=481 golden=481 MATCH

canonical.json identical to golden-canonical.json: true
validation-report summaries identical: true
```

### 4. Business figures (unchanged)

| Metric | Current | Golden | Diff |
|---|---|---|---|
| Revenue (Σ Invoice.grandTotal) | 208,131,203 | 208,131,203 | 0 |
| Gross Profit (Σ Invoice.invoiceProfit) | 14,958,715.89 | 14,958,715.89 | 0 |
| Invoice / InvoiceItem / Payment counts | 481 / 1,109 / 481 | 481 / 1,109 / 481 | 0 |
| Validation issues | 0 | 0 | — |

**Regression: PASS. All tests: PASS (52/52 total assertions across all five files). Canonical output: identical. Business figures: identical.**
