// Responsibility: open the Realm backup, read the genuine top-level
// collections, and return raw objects. This module does not interpret,
// reshape, rename, or drop anything — that is normalize.js's job.

const fs = require('fs');
const crypto = require('crypto');
const Realm = require('realm');
const { ConfigurationError, ExtractionError, SchemaDriftError } = require('./shared/errors');

/**
 * Computes a SHA-256 checksum of the backup file, for the provenance
 * requirement established in the Data Governance Framework (§7) and
 * research/loka-ingestion-poc.md's minimum-metadata findings.
 */
function checksumFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Converts a Realm object to a plain JS object. Uses the SDK's own
 * toJSON() where available; falls back to a manual property copy
 * otherwise. Embedded lists/objects (e.g. Invoice.items) are preserved
 * as nested plain data — normalize.js decides what to do with them.
 */
function toPlainObject(record) {
  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }
  const plain = {};
  for (const key of Object.keys(record)) {
    plain[key] = record[key];
  }
  return plain;
}

/**
 * Opens the backup read-only with dynamic schema discovery (no schema is
 * supplied — the file describes its own object model), reads the given
 * top-level entity names, and returns { entities, meta }.
 *
 * `entityNames` must only contain genuine top-level Realm object types.
 * Calling realm.objects() on an embedded type throws.
 *
 * @param {string} backupPath
 * @param {string[]} entityNames
 * @param {object} [options]
 * @param {number} [options.lastKnownGoodSchemaVersion]
 * @param {'warn'|'fail'} [options.schemaDriftPolicy]
 * @param {import('./shared/logger').Logger} [logger]
 */
async function extract(backupPath, entityNames, options = {}, logger) {
  if (!backupPath) {
    throw new ConfigurationError(
      'No backup path provided. Set LOKA_BACKUP_PATH to a real .realm file before running this prototype.'
    );
  }
  if (!fs.existsSync(backupPath)) {
    throw new ExtractionError(`Backup file not found at: ${backupPath}`, { backupPath });
  }

  const sourceChecksum = checksumFile(backupPath);

  let realm;
  try {
    realm = await Realm.open({ path: backupPath, readOnly: true });
  } catch (err) {
    throw new ExtractionError(`Failed to open Realm backup: ${err.message}`, { backupPath, cause: err.message });
  }

  const { lastKnownGoodSchemaVersion, schemaDriftPolicy = 'warn' } = options;
  if (lastKnownGoodSchemaVersion != null && realm.schemaVersion !== lastKnownGoodSchemaVersion) {
    const message =
      `Backup schema version ${realm.schemaVersion} does not match the last-known-good ` +
      `version ${lastKnownGoodSchemaVersion}. Assumptions this connector relies on ` +
      `(e.g. required-field lists) have not been re-verified against this schema version.`;
    if (schemaDriftPolicy === 'fail') {
      realm.close();
      throw new SchemaDriftError(message, {
        detected: realm.schemaVersion,
        expected: lastKnownGoodSchemaVersion,
      });
    }
    if (logger) {
      logger.warn(message, { detected: realm.schemaVersion, expected: lastKnownGoodSchemaVersion });
    }
  }

  const entities = {};
  for (const name of entityNames) {
    try {
      const collection = realm.objects(name);
      entities[name] = collection.map(toPlainObject);
    } catch (err) {
      realm.close();
      throw new ExtractionError(`Failed to extract entity "${name}": ${err.message}`, { entity: name, cause: err.message });
    }
    if (logger) {
      logger.debug(`extracted ${name}`, { count: entities[name].length });
    }
  }

  const meta = {
    sourceFile: backupPath,
    sourceChecksum,
    schemaVersion: realm.schemaVersion,
    extractedAt: new Date().toISOString(),
  };

  realm.close();

  return { entities, meta };
}

module.exports = { extract, checksumFile, toPlainObject };
