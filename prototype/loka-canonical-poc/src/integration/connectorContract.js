// ============================================================================
// Connector Contract — Enterprise Integration Layer
// ============================================================================
//
// What ANY connector — any external source system — must implement to be
// registered. This file validates shape only — it never
// calls pull()/mapToCanonicalEvent()/healthCheck() itself, and it does not
// know what any of them do internally. See types.js for ConnectorDefinition.
// ============================================================================

const { ConnectorConfigError } = require('./errorContract');

const REQUIRED_FIELDS = ['id', 'name', 'version'];
const REQUIRED_METHODS = ['pull', 'mapToCanonicalEvent', 'healthCheck'];

/**
 * @param {import('./types').ConnectorDefinition} connector
 * @throws {ConnectorConfigError} if the shape is invalid
 */
function assertValidConnector(connector) {
  if (!connector || typeof connector !== 'object') {
    throw new ConnectorConfigError('Connector must be an object.', { stage: 'config' });
  }

  REQUIRED_FIELDS.forEach((field) => {
    if (typeof connector[field] !== 'string' || !connector[field].trim()) {
      throw new ConnectorConfigError(`Connector is missing required field "${field}".`, {
        connectorId: connector.id, stage: 'config', details: { field },
      });
    }
  });

  if (!/^[a-z0-9-]+$/.test(connector.id)) {
    throw new ConnectorConfigError('Connector id must be lowercase-kebab (e.g. "source-system-name").', {
      connectorId: connector.id, stage: 'config',
    });
  }

  REQUIRED_METHODS.forEach((method) => {
    if (typeof connector[method] !== 'function') {
      throw new ConnectorConfigError(`Connector "${connector.id}" is missing required method "${method}".`, {
        connectorId: connector.id, stage: 'config', details: { method },
      });
    }
  });

  return true;
}

module.exports = { assertValidConnector, REQUIRED_FIELDS, REQUIRED_METHODS };
