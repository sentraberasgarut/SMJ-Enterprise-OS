// ============================================================================
// Loka Connector — implementation stub
// ============================================================================
//
// The ONE file in the Enterprise Integration Layer allowed to mention Loka
// by name. It demonstrates how any connector registers against the
// generic layer — it does not implement Loka integration. Every method
// throws. When "Implement Loka Connector" begins, this file's bodies get
// filled in; connectorContract.js, canonicalEventAdapter.js,
// syncLifecycle.js, connectorRegistry.js, connectorHealth.js,
// datasetPublisher.js, datasetRefreshTrigger.js, and connectorConfig.js
// do not change to make that possible — that is the point of this layer.
//
// Not registered automatically — nothing calls require() on this file
// from anywhere else in the codebase. Registering it is a deliberate,
// future, explicit act ("Implement Loka Connector"), not a side effect
// of this sprint.
// ============================================================================

const { STATES } = require('../syncLifecycle');

/** @type {import('../types').ConnectorDefinition} */
const lokaConnectorStub = {
  id: 'loka',
  name: 'Loka POS',
  version: '0.0.0-stub',

  /**
   * Will pull new Invoice/Product/Expense/Shift records since the given
   * cursor. Today the only proven source is a manually-copied .realm
   * backup (src/connector/connector.js, src/extract.js) — whether a live
   * pull ever becomes possible depends on Loka itself, not on this layer.
   */
  async pull(sinceCursor) {
    throw new Error('Loka Connector pull() not implemented — this is the remaining work.');
  },

  /**
   * Will map one raw Loka record into the CanonicalEvent envelope via
   * canonicalEventAdapter.toCanonicalEvent(). EventType values would be
   * drawn from the existing taxonomy (operational-accountability-
   * architecture-v1.md §2) — InvoiceCreated, PaymentReceived, etc. — not
   * invented here.
   */
  mapToCanonicalEvent(rawRecord) {
    throw new Error('Loka Connector mapToCanonicalEvent() not implemented — this is the remaining work.');
  },

  /**
   * Will report connector health per connectorHealth.js's shared
   * vocabulary. A trivial default is possible today using
   * statusFromRecentRuns() once real SyncRuns exist — left unimplemented
   * because there are none yet.
   */
  async healthCheck() {
    throw new Error('Loka Connector healthCheck() not implemented — this is the remaining work.');
  },
};

module.exports = { lokaConnectorStub, STATES };
