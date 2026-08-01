// System health derivation for Dashboard Dataset v1.
//
// Every status here is derived by a pure, transparent rule over data the
// connector and Reporting Service have ALREADY computed (runMetadata,
// dashboard.cards) — nothing here recomputes a business figure or opens
// any new data source. No Realm, no connector, no Business Service import
// anywhere in this file.

const STAGE_STATUS = Object.freeze({
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNAVAILABLE: 'unavailable',
});

function connectorStatus(runMetadata) {
  if (!runMetadata || !runMetadata.backupValidation) return STAGE_STATUS.UNAVAILABLE;
  const issues = runMetadata.backupValidation.issues || [];
  if (issues.some((i) => i.severity === 'error')) return STAGE_STATUS.UNHEALTHY;
  if (issues.length > 0) return STAGE_STATUS.DEGRADED;
  return STAGE_STATUS.HEALTHY;
}

function canonicalStatus(runMetadata) {
  if (!runMetadata || !runMetadata.canonicalCounts) return STAGE_STATUS.UNAVAILABLE;
  const summary = runMetadata.validationSummary;
  if (!summary) return STAGE_STATUS.UNAVAILABLE;
  if (summary.errors > 0) return STAGE_STATUS.DEGRADED;
  return STAGE_STATUS.HEALTHY;
}

function reportingStatus(dashboard) {
  if (!dashboard || !Array.isArray(dashboard.cards)) return STAGE_STATUS.UNAVAILABLE;
  // 11 is not a magic number invented here — it is the count of dashboard
  // cards already documented in implementation/dashboard-v2-implementation-plan.md §3.
  return dashboard.cards.length === 11 ? STAGE_STATUS.HEALTHY : STAGE_STATUS.DEGRADED;
}

function validationStatus(runMetadata) {
  const summary = runMetadata && runMetadata.validationSummary;
  if (!summary) return STAGE_STATUS.UNAVAILABLE;
  if (summary.totalIssues === 0) return STAGE_STATUS.HEALTHY;
  return summary.errors > 0 ? STAGE_STATUS.UNHEALTHY : STAGE_STATUS.DEGRADED;
}

/**
 * @param {object} runMetadata the connector's run metadata (unchanged shape)
 * @param {object} dashboard the Reporting Service's dashboard.json shape (unchanged)
 * @returns {object} system health section for Dashboard Dataset v1
 */
function buildSystemHealth(runMetadata, dashboard) {
  return {
    connector: connectorStatus(runMetadata),
    canonical: canonicalStatus(runMetadata),
    reporting: reportingStatus(dashboard),
    validation: validationStatus(runMetadata),
    lastSuccessfulRefresh: runMetadata ? runMetadata.finishedAt : null,
    snapshotClassification: (dashboard && dashboard.snapshotStatus) || null,
    schemaVersion: runMetadata ? runMetadata.schemaVersion : null,
    sourceBackup: runMetadata
      ? { sourceFile: runMetadata.sourceFile, sourceChecksum: runMetadata.sourceChecksum, connectorVersion: runMetadata.connectorVersion }
      : null,
  };
}

module.exports = { buildSystemHealth, STAGE_STATUS };
