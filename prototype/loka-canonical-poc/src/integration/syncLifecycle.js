// ============================================================================
// Sync Lifecycle — Enterprise Integration Layer
// ============================================================================
//
// State machine for one sync attempt (SyncRun): queued -> syncing ->
// synced | failed, with failed -> queued as the retry path. Enforces
// legal transitions only — this is real, working logic, not a stub;
// nothing here depends on any specific connector or external system.
// ============================================================================

const { IntegrationError } = require('./errorContract');

const STATES = Object.freeze({
  QUEUED: 'queued',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
});

const LEGAL_TRANSITIONS = {
  [STATES.QUEUED]: [STATES.SYNCING],
  [STATES.SYNCING]: [STATES.SYNCED, STATES.FAILED],
  [STATES.SYNCED]: [],                 // terminal — a new run is created for the next sync, not a reopened one
  [STATES.FAILED]: [STATES.QUEUED],    // retry
};

let _runCounter = 0;

/**
 * @param {string} connectorId
 * @param {number} [now] injected for testability; defaults to Date.now()
 * @returns {import('./types').SyncRun}
 */
function createSyncRun(connectorId, now) {
  if (!connectorId) throw new IntegrationError('createSyncRun requires connectorId.', { stage: 'config' });
  _runCounter += 1;
  return {
    runId: `${connectorId}-${now || Date.now()}-${_runCounter}`,
    connectorId,
    status: STATES.QUEUED,
    queuedAt: new Date(now || Date.now()).toISOString(),
    attempt: 1,
  };
}

function _transition(run, toStatus, now) {
  const allowed = LEGAL_TRANSITIONS[run.status] || [];
  if (!allowed.includes(toStatus)) {
    throw new IntegrationError(
      `Illegal sync transition for run "${run.runId}": ${run.status} -> ${toStatus}.`,
      { connectorId: run.connectorId, stage: 'sync', details: { from: run.status, to: toStatus } }
    );
  }
  return { ...run, status: toStatus, _at: new Date(now || Date.now()).toISOString() };
}

/** @param {import('./types').SyncRun} run */
function markSyncing(run, now) {
  const next = _transition(run, STATES.SYNCING, now);
  next.startedAt = next._at;
  delete next._at;
  return next;
}

/** @param {import('./types').SyncRun} run */
function markSynced(run, result, now) {
  const next = _transition(run, STATES.SYNCED, now);
  next.finishedAt = next._at;
  next.result = result || {};
  delete next._at;
  return next;
}

/** @param {import('./types').SyncRun} run */
function markFailed(run, error, now) {
  const next = _transition(run, STATES.FAILED, now);
  next.finishedAt = next._at;
  next.error = error instanceof Error ? { message: error.message, name: error.name } : error;
  delete next._at;
  return next;
}

/**
 * Retry — moves a failed run back to queued with attempt incremented.
 * Caller decides backoff/delay; this function only enforces the state
 * transition and the attempt counter, nothing time-based.
 * @param {import('./types').SyncRun} run
 */
function scheduleRetry(run, now) {
  const next = _transition(run, STATES.QUEUED, now);
  next.attempt = run.attempt + 1;
  next.queuedAt = next._at;
  delete next._at;
  delete next.error;
  return next;
}

module.exports = { STATES, createSyncRun, markSyncing, markSynced, markFailed, scheduleRetry };
