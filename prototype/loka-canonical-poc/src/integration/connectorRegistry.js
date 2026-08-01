// ============================================================================
// Connector Registry — Enterprise Integration Layer
// ============================================================================
//
// In-memory registry of connectors validated against connectorContract.js.
// One registry per process — this file holds no knowledge of any specific
// source system. register() is the single door every future connector
// walks through.
// ============================================================================

const { assertValidConnector } = require('./connectorContract');
const { ConnectorConfigError } = require('./errorContract');

const _connectors = new Map();

/** @param {import('./types').ConnectorDefinition} connector */
function register(connector) {
  assertValidConnector(connector);
  if (_connectors.has(connector.id)) {
    throw new ConnectorConfigError(`Connector "${connector.id}" is already registered.`, {
      connectorId: connector.id, stage: 'config',
    });
  }
  _connectors.set(connector.id, connector);
  return connector;
}

/** @param {string} connectorId */
function get(connectorId) {
  return _connectors.get(connectorId) || null;
}

function list() {
  return Array.from(_connectors.values());
}

/** @param {string} connectorId */
function unregister(connectorId) {
  return _connectors.delete(connectorId);
}

/** Test/reset helper — never called by application code. */
function _clear() {
  _connectors.clear();
}

module.exports = { register, get, list, unregister, _clear };
