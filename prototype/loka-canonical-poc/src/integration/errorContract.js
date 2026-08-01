// ============================================================================
// Error Contract — Enterprise Integration Layer
// ============================================================================
//
// Same structural pattern as src/shared/errors.js (typed classes, a
// `details` payload for structured handling instead of string-matching
// messages) — not extended from PipelineError, because a future connector
// is not necessarily "the pipeline"; this gets its own root so no
// connector is ever forced to import a specific pipeline's concepts.
// ============================================================================

class IntegrationError extends Error {
  constructor(message, { connectorId, stage, retryable = false, cause = null, details = {} } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.connectorId = connectorId || null;
    this.stage = stage || null;       // 'pull' | 'map' | 'publish' | 'health' | 'config'
    this.retryable = retryable;
    this.cause = cause;
    this.details = details;
  }
}

/** Connector is missing required configuration or it fails validation. */
class ConnectorConfigError extends IntegrationError {}

/** Connector could not authenticate or was rejected by its source system. */
class ConnectorAuthError extends IntegrationError {}

/** pull() itself failed — network, timeout, source system unavailable. */
class ConnectorPullError extends IntegrationError {}

/** mapToCanonicalEvent() produced something that isn't a valid CanonicalEvent. */
class MappingError extends IntegrationError {}

/** Dataset Publisher rejected or failed to publish a mapped result. */
class PublishError extends IntegrationError {}

module.exports = {
  IntegrationError,
  ConnectorConfigError,
  ConnectorAuthError,
  ConnectorPullError,
  MappingError,
  PublishError,
};
