// ============================================================================
// Connector Configuration — Enterprise Integration Layer
// ============================================================================
//
// Shape + validator for connector configuration. Never holds a real
// secret — only a reference to where one lives (ADR-0004 Principle 6/7:
// Open Standards, Vendor Exit; and the lesson already paid for once in
// this repository — Increment 1 Dashboard's hardcoded-PIN defect, fixed
// in Delivery's Increment 2 by reading credentials live instead of
// copying them into source). A connector that needs a secret stores a
// credentialsRef (a Script Properties key, an env var name) — never the
// value — and resolves it at call time, outside this layer.
// ============================================================================

const { ConnectorConfigError } = require('./errorContract');

/**
 * @param {import('./types').ConnectorConfig} config
 * @throws {ConnectorConfigError}
 */
function assertValidConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new ConnectorConfigError('Connector config must be an object.', { stage: 'config' });
  }
  if (typeof config.connectorId !== 'string' || !config.connectorId.trim()) {
    throw new ConnectorConfigError('Connector config requires connectorId.', { stage: 'config' });
  }
  if (typeof config.enabled !== 'boolean') {
    throw new ConnectorConfigError('Connector config requires enabled (boolean).', {
      connectorId: config.connectorId, stage: 'config',
    });
  }
  if (typeof config.pollIntervalMs !== 'number' || config.pollIntervalMs <= 0) {
    throw new ConnectorConfigError('Connector config requires pollIntervalMs > 0.', {
      connectorId: config.connectorId, stage: 'config',
    });
  }
  if (config.credentialsRef !== undefined && typeof config.credentialsRef !== 'string') {
    throw new ConnectorConfigError('credentialsRef, if present, must be a string reference — never a raw secret.', {
      connectorId: config.connectorId, stage: 'config',
    });
  }
  // Deliberately rejects anything that looks like an inline secret under
  // a wrong key name — a cheap guard against the exact mistake already
  // made once in this repository.
  ['pin', 'password', 'token', 'apiKey', 'secret'].forEach((suspectKey) => {
    if (config[suspectKey] !== undefined) {
      throw new ConnectorConfigError(
        `Connector config for "${config.connectorId}" contains "${suspectKey}" — credentials must be a credentialsRef, never a value in config.`,
        { connectorId: config.connectorId, stage: 'config', details: { field: suspectKey } }
      );
    }
  });
  return true;
}

/**
 * @param {string} connectorId
 * @param {Partial<import('./types').ConnectorConfig>} [overrides]
 * @returns {import('./types').ConnectorConfig}
 */
function defaultConfig(connectorId, overrides = {}) {
  return {
    connectorId,
    enabled: false,
    pollIntervalMs: 15 * 60 * 1000,
    ...overrides,
  };
}

module.exports = { assertValidConfig, defaultConfig };
