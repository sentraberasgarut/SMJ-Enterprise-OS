// ============================================================================
// Connector Health — Enterprise Integration Layer
// ============================================================================
//
// Reuses STAGE_STATUS from src/dataset/health.js verbatim — healthy /
// degraded / unhealthy / unavailable is already the accepted vocabulary
// for this repository (Dashboard Design System, Status Indicators). A
// connector must never invent its own status words.
// ============================================================================

const { STAGE_STATUS } = require('../dataset/health');

/**
 * @param {string} connectorId
 * @param {'healthy'|'degraded'|'unhealthy'|'unavailable'} status
 * @param {Object} [opts]
 * @param {string} [opts.lastSuccessAt] ISO 8601
 * @param {Object} [opts.lastError]
 * @param {number} [opts.now] injected for testability
 * @returns {import('./types').ConnectorHealthRecord}
 */
function buildConnectorHealth(connectorId, status, opts = {}) {
  if (!Object.values(STAGE_STATUS).includes(status)) {
    throw new Error(`Unknown connector health status "${status}". Use one of: ${Object.values(STAGE_STATUS).join(', ')}.`);
  }
  return {
    connectorId,
    status,
    lastSuccessAt: opts.lastSuccessAt || null,
    lastError: opts.lastError || null,
    checkedAt: new Date(opts.now || Date.now()).toISOString(),
  };
}

/**
 * Derives a status from a SyncRun history — the simplest honest reading:
 * most recent run's outcome, nothing inferred beyond that. A connector's
 * own healthCheck() may return something richer; this is the floor every
 * connector gets for free just by using syncLifecycle.js.
 * @param {import('./types').SyncRun[]} recentRuns newest first
 */
function statusFromRecentRuns(recentRuns) {
  if (!recentRuns || !recentRuns.length) return STAGE_STATUS.UNAVAILABLE;
  const latest = recentRuns[0];
  if (latest.status === 'synced') return STAGE_STATUS.HEALTHY;
  if (latest.status === 'failed') {
    const recentFailures = recentRuns.slice(0, 3).filter((r) => r.status === 'failed').length;
    return recentFailures >= 3 ? STAGE_STATUS.UNHEALTHY : STAGE_STATUS.DEGRADED;
  }
  return STAGE_STATUS.DEGRADED; // queued/syncing and nothing synced yet this cycle
}

module.exports = { buildConnectorHealth, statusFromRecentRuns, STAGE_STATUS };
