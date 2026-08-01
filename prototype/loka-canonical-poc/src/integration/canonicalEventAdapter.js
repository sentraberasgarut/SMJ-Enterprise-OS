// ============================================================================
// Canonical Event Adapter — Enterprise Integration Layer
// ============================================================================
//
// Shapes a connector's RawRecord into the CanonicalEvent envelope. The
// nine fields below are quoted VERBATIM from
// architecture/operational-event-standard-v1.md — this file does not
// define them, it enforces them. No new field is invented here; that
// would be redesigning Canonical Events, which this sprint forbids.
//
// This adapter does not know how to read any specific source format —
// each connector supplies its own `mapFn(rawRecord) -> partial fields`,
// and this file's only job is to assemble and validate the result.
// ============================================================================

const { MappingError } = require('./errorContract');

const REQUIRED_FIELDS = [
  'EventID', 'EventType', 'BusinessUnit', 'AssignmentID',
  'Operator', 'Evidence', 'ResponsibilityStatus', 'CreatedAt',
];
const OPTIONAL_FIELDS = ['UpdatedAt'];
const RESPONSIBILITY_STATUSES = ['Recorded', 'Transferred', 'Disputed'];

/**
 * @param {string} connectorId
 * @param {import('./types').RawRecord} rawRecord
 * @param {function(import('./types').RawRecord): Partial<import('./types').CanonicalEvent>} mapFn
 *   Connector-supplied. Receives the raw record, returns the nine (or ten,
 *   with UpdatedAt) fields — this adapter never inspects rawRecord.payload
 *   itself, since its shape is connector-specific.
 * @returns {import('./types').CanonicalEvent}
 * @throws {MappingError} if mapFn's output does not satisfy the envelope
 */
function toCanonicalEvent(connectorId, rawRecord, mapFn) {
  if (typeof mapFn !== 'function') {
    throw new MappingError('mapFn must be a function.', { connectorId, stage: 'map' });
  }

  let mapped;
  try {
    mapped = mapFn(rawRecord);
  } catch (cause) {
    throw new MappingError(`mapFn threw while mapping a record: ${cause.message}`, {
      connectorId, stage: 'map', cause,
    });
  }

  const event = {};
  REQUIRED_FIELDS.forEach((field) => { event[field] = mapped[field]; });
  OPTIONAL_FIELDS.forEach((field) => { if (mapped[field] !== undefined) event[field] = mapped[field]; });

  assertValidCanonicalEvent(event, connectorId);
  return event;
}

/**
 * @param {import('./types').CanonicalEvent} event
 * @param {string} [connectorId]
 * @throws {MappingError}
 */
function assertValidCanonicalEvent(event, connectorId) {
  REQUIRED_FIELDS.forEach((field) => {
    if (event[field] === undefined || event[field] === null || event[field] === '') {
      throw new MappingError(`Mapped event is missing required field "${field}".`, {
        connectorId, stage: 'map', details: { field },
      });
    }
  });

  if (!RESPONSIBILITY_STATUSES.includes(event.ResponsibilityStatus)) {
    throw new MappingError(
      `ResponsibilityStatus must be one of ${RESPONSIBILITY_STATUSES.join('/')}, got "${event.ResponsibilityStatus}".`,
      { connectorId, stage: 'map', details: { field: 'ResponsibilityStatus' } }
    );
  }

  if (Number.isNaN(Date.parse(event.CreatedAt))) {
    throw new MappingError('CreatedAt must be a valid ISO 8601 timestamp.', {
      connectorId, stage: 'map', details: { field: 'CreatedAt' },
    });
  }

  return true;
}

module.exports = { toCanonicalEvent, assertValidCanonicalEvent, REQUIRED_FIELDS, OPTIONAL_FIELDS };
