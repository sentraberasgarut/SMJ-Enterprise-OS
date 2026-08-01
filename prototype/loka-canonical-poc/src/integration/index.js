// ============================================================================
// Enterprise Integration Layer — single entry point
// ============================================================================
//
// Everything a future connector needs, in one place. Nothing in this file
// or anything it requires mentions a specific source system — see the
// connectors/ subfolder for the one implementation stub that's allowed to.
// ============================================================================

module.exports = {
  ...require('./connectorContract'),
  errors: require('./errorContract'),
  event: require('./canonicalEventAdapter'),
  lifecycle: require('./syncLifecycle'),
  health: require('./connectorHealth'),
  registry: require('./connectorRegistry'),
  publisher: require('./datasetPublisher'),
  refreshTrigger: require('./datasetRefreshTrigger'),
  config: require('./connectorConfig'),
};
