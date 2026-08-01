// ============================================================================
// Dataset Refresh Trigger — Enterprise Integration Layer
// ============================================================================
//
// After a sync run completes (see syncLifecycle.js), something may need
// to decide whether the published dataset should be regenerated. This
// file is that decision point — generic, connector-agnostic, and by
// default conservative: it does nothing unless a handler is registered.
// It never calls the pipeline (index.js) directly; a registered handler
// does that, so this layer never hard-depends on any specific pipeline shape.
// ============================================================================

const _handlers = [];

/**
 * @param {function({connectorId: string, run: import('./types').SyncRun}): Promise<void>} handler
 */
function registerRefreshHandler(handler) {
  if (typeof handler !== 'function') throw new Error('registerRefreshHandler requires a function.');
  _handlers.push(handler);
}

/**
 * Called after a SyncRun reaches 'synced' — see syncLifecycle.js. Runs all
 * registered handlers; a handler's failure is reported per-handler, not
 * thrown, so one broken handler cannot block the others.
 * @param {{connectorId: string, run: import('./types').SyncRun}} context
 * @returns {Promise<Array<{ok: boolean, error?: Error}>>}
 */
async function triggerRefresh(context) {
  const outcomes = [];
  for (const handler of _handlers) {
    try {
      await handler(context);
      outcomes.push({ ok: true });
    } catch (error) {
      outcomes.push({ ok: false, error });
    }
  }
  return outcomes;
}

function _reset() {
  _handlers.length = 0;
}

module.exports = { registerRefreshHandler, triggerRefresh, _reset };
