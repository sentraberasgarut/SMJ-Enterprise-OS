// ============================================================================
// Common Integration Types — Enterprise Integration Layer
// ============================================================================
//
// JSDoc typedefs shared by every module in src/integration/. Plain JS, no
// build step — these exist so every connector, whatever source system it
// integrates, is written against the same shapes instead of each one
// inventing its own. Nothing in this file is specific to any one source.
//
// CanonicalEvent's nine fields are NOT redefined here — they are quoted
// verbatim from architecture/operational-event-standard-v1.md. This file
// documents that shape for JS tooling; it does not change it.
// ============================================================================

/**
 * @typedef {Object} RawRecord
 * One record exactly as a connector's source system produced it — before
 * any mapping. Shape is connector-specific and NOT constrained here; the
 * Canonical Event Adapter is the only place that shape gets interpreted.
 * @property {string} connectorId
 * @property {*} payload
 * @property {string} [receivedAt] ISO 8601
 */

/**
 * @typedef {Object} CanonicalEvent
 * The nine-field envelope from operational-event-standard-v1.md. Every
 * connector's output must be shaped into exactly this — no more, no fewer
 * fields — before it is considered integrated.
 * @property {string} EventID
 * @property {string} EventType
 * @property {string} BusinessUnit
 * @property {string} AssignmentID
 * @property {string} Operator
 * @property {*} Evidence
 * @property {'Recorded'|'Transferred'|'Disputed'} ResponsibilityStatus
 * @property {string} CreatedAt ISO 8601
 * @property {string} [UpdatedAt] ISO 8601 — only when ResponsibilityStatus can change
 */

/**
 * @typedef {Object} ConnectorDefinition
 * What a connector module must export to satisfy connectorContract.js.
 * @property {string} id unique, stable, lowercase-kebab (e.g. "source-system-name")
 * @property {string} name human-readable
 * @property {string} version semver of the connector implementation itself
 * @property {function(string=): Promise<RawRecord[]>} pull
 * @property {function(RawRecord): CanonicalEvent} mapToCanonicalEvent
 * @property {function(): Promise<Object>} healthCheck
 */

/**
 * @typedef {Object} SyncRun
 * One attempt to sync one connector. See syncLifecycle.js for the state
 * machine that produces and mutates these.
 * @property {string} runId
 * @property {string} connectorId
 * @property {'queued'|'syncing'|'synced'|'failed'} status
 * @property {string} queuedAt ISO 8601
 * @property {string} [startedAt]
 * @property {string} [finishedAt]
 * @property {number} attempt starts at 1
 * @property {Object} [result]
 * @property {Object} [error]
 */

/**
 * @typedef {Object} ConnectorHealthRecord
 * @property {string} connectorId
 * @property {'healthy'|'degraded'|'unhealthy'|'unavailable'} status
 * @property {string} [lastSuccessAt]
 * @property {Object} [lastError]
 * @property {string} checkedAt ISO 8601
 */

/**
 * @typedef {Object} ConnectorConfig
 * @property {string} connectorId
 * @property {boolean} enabled
 * @property {number} pollIntervalMs
 * @property {string} [credentialsRef] a REFERENCE to where credentials live
 *   (e.g. a PropertiesService key, an env var name) — never the credential
 *   value itself. ADR-0004 Principle 6/7.
 */

module.exports = {};
