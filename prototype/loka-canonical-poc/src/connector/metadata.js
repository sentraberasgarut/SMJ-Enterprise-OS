// Run metadata / audit trail assembly for the Loka Connector, per
// implementation/loka-connector-v1-spec.md §8.
//
// Pure data assembly only — no I/O, no Realm, no decisions. Everything
// this module needs is passed in by connector.js.

/**
 * Assembles the audit-trail record for one connector run. Every field
 * named in the spec's §8 list is present, whether or not the run actually
 * reached the point of producing canonical output — a failed/aborted run
 * still gets a metadata record, with the later fields left null.
 */
function buildRunMetadata({
  runId,
  startedAt,
  finishedAt,
  sourceFile,
  sourceChecksum,
  schemaVersion,
  connectorVersion,
  snapshotStatus = null,
  entityCounts = null,
  canonicalCounts = null,
  validationSummary = null,
  backupValidation = null,
  duplicateOf = null,
  failure = null,
}) {
  return {
    runId,
    startedAt,
    finishedAt,
    durationMs: finishedAt && startedAt ? new Date(finishedAt).getTime() - new Date(startedAt).getTime() : null,
    sourceFile, // a label, per the spec — never treated as a fact about content
    sourceChecksum,
    schemaVersion,
    connectorVersion,
    snapshotStatus,
    entityCounts,
    canonicalCounts,
    validationSummary,
    backupValidation, // preflight checks from connector.js — §4 of the spec
    duplicateOf, // { checksum, path } of the first-seen backup with the same checksum, or null
    failure, // { stage, message } if the run aborted, or null
  };
}

/**
 * A single issue record shape shared by every backup-level (preflight)
 * check connector.js performs — kept structurally distinct from the
 * existing canonical validate.js issue shape (entity/id/rule/message/
 * severity) since these are backup-level facts, not canonical business
 * data facts, per the spec's own separation of the two.
 */
function makeBackupIssue(check, message, severity = 'warning') {
  return { check, message, severity };
}

module.exports = { buildRunMetadata, makeBackupIssue };
