// Responsibility: convert raw Realm objects (from extract.js) into
// canonical business objects, per architecture/canonical-data-contract-v1.md
// and enterprise-data/canonical/*.md. No file I/O happens here.
//
// This module used to contain every entity's field-mapping logic directly.
// That logic now lives in src/entities/*.js; this module only orchestrates:
// for each top-level entity, map its raw records through its own
// normalize(); for each derived entity, call its own deriveAll() against
// the raw records of whatever it derives from. Adding a 9th entity changes
// nothing here — it is picked up automatically via the registry.

const registry = require('./registry/entityRegistry');
const { NormalizationError } = require('./shared/errors');

function normalize(extracted, logger) {
  const meta = {
    sourceFile: extracted.meta.sourceFile,
    sourceChecksum: extracted.meta.sourceChecksum,
    connectorVersion: extracted.meta.connectorVersion,
    extractedAt: extracted.meta.extractedAt,
  };

  const canonical = {};

  for (const def of registry.topLevel()) {
    const rawRecords = extracted.entities[def.name] || [];
    canonical[def.name] = rawRecords.map((raw, index) => {
      try {
        return def.normalize(raw, meta);
      } catch (err) {
        throw new NormalizationError(
          `Failed to normalize ${def.name} record at index ${index}: ${err.message}`,
          { entity: def.name, index, rawId: raw && raw.id, cause: err.message }
        );
      }
    });
    if (logger) {
      logger.debug(`normalized ${def.name}`, { count: canonical[def.name].length });
    }
  }

  for (const def of registry.derived()) {
    const sourceRaw = extracted.entities[def.derivedFrom] || [];
    try {
      canonical[def.name] = def.deriveAll(sourceRaw, meta);
    } catch (err) {
      throw new NormalizationError(
        `Failed to derive ${def.name} from ${def.derivedFrom}: ${err.message}`,
        { entity: def.name, derivedFrom: def.derivedFrom, cause: err.message }
      );
    }
    if (logger) {
      logger.debug(`derived ${def.name}`, { count: canonical[def.name].length, derivedFrom: def.derivedFrom });
    }
  }

  return canonical;
}

module.exports = { normalize };
