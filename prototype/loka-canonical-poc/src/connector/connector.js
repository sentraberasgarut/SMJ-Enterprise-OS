// Loka Connector v1 — orchestration layer, per
// implementation/loka-connector-v1-spec.md.
//
// This module implements ONLY the connector layer described in that spec:
// backup discovery, the new backup-level (preflight) validation checks,
// snapshot classification, and metadata assembly. It does not reimplement
// extraction, normalization, or canonical validation — those are the
// existing, already-validated extract.js / normalize.js / validate.js,
// required and called here unchanged. Output produced via that existing
// path is therefore identical to what index.js has always produced for
// the same backup.
//
// Ownership note, matching src/index.js's own established pattern: this
// module does NOT call Realm.shutdown() itself. That remains an
// entrypoint-level / test-teardown-level concern (see
// implementation/root-cause-analysis.md and
// implementation/realm-shutdown-patch.md) — a reusable orchestration
// function should not decide when the whole process's Realm usage is done.

const config = require('../config');
const { extract } = require('../extract');
const { normalize } = require('../normalize');
const { validate } = require('../validate');
const { Logger } = require('../shared/logger');
const { ConfigurationError, ExtractionError } = require('../shared/errors');
const { discoverBackups, inspectBackup, selectNewestBackup, findDuplicateGroups } = require('./backupDiscovery');
const { classifySnapshot } = require('./snapshotClassifier');
const { buildRunMetadata, makeBackupIssue } = require('./metadata');

// The two schema versions this repository has directly observed, per the
// spec's own §4/§10 statement ("105 and 109 are the two values seen so
// far"). Not exported from config.js because config.js's own
// LAST_KNOWN_GOOD_SCHEMA_VERSION (109) already exists for a different
// purpose (schema-drift policy for extraction); this list is specifically
// for the "unknown schema version" preflight check the spec adds, and
// keeping it here avoids changing config.js's existing meaning.
const KNOWN_SCHEMA_VERSIONS = [105, 109];

const REQUIRED_ENTITY_TYPES = ['Invoice', 'Shift', 'Expense', 'Customer', 'Supplier', 'Product'];

/**
 * The new backup-level checks from the spec's §4 table that are not
 * already implemented by extract.js (missing/corrupted backup, and wrong
 * schema version under the existing schemaDriftPolicy, are all already
 * handled by extract.js itself and are not reimplemented here).
 *
 * Structural "partial backup" is fatal (per the spec's §7 Failure
 * Handling table) and is signalled by returning { fatal: true, ... } —
 * everything else is informational only, per the same table.
 */
function runPreflightChecks(profile) {
  const issues = [];

  const missingRequiredEntities = REQUIRED_ENTITY_TYPES.filter((name) => profile.entityCounts[name] === null);
  if (missingRequiredEntities.length > 0) {
    return {
      fatal: true,
      issues: [
        makeBackupIssue(
          'partial-backup',
          `Backup is missing required entity type(s) from its schema: ${missingRequiredEntities.join(', ')}.`,
          'error'
        ),
      ],
    };
  }

  if (!KNOWN_SCHEMA_VERSIONS.includes(profile.schemaVersion)) {
    issues.push(
      makeBackupIssue(
        'unknown-schema-version',
        `Schema version ${profile.schemaVersion} has not been previously observed by this repository (known: ${KNOWN_SCHEMA_VERSIONS.join(', ')}).`,
        'warning'
      )
    );
  } else if (profile.schemaVersion !== config.LAST_KNOWN_GOOD_SCHEMA_VERSION) {
    issues.push(
      makeBackupIssue(
        'wrong-schema-version',
        `Schema version ${profile.schemaVersion} is known but differs from the configured last-known-good version ${config.LAST_KNOWN_GOOD_SCHEMA_VERSION}.`,
        'warning'
      )
    );
  }

  if (profile.futureDateFieldCount > 0) {
    issues.push(
      makeBackupIssue(
        'future-timestamp',
        `${profile.futureDateFieldCount} date field(s) parse to a moment later than the processing machine's current time.`,
        'warning'
      )
    );
  }

  if (profile.unparseableDateFieldCount > 0) {
    issues.push(
      makeBackupIssue(
        'impossible-timestamp',
        `${profile.unparseableDateFieldCount} date field value(s) could not be parsed at all.`,
        'warning'
      )
    );
  }

  return { fatal: false, issues };
}

/**
 * Runs the Loka Connector end to end: discover (or accept) a backup,
 * validate it, extract, normalize, canonically validate, classify the
 * snapshot, and assemble run metadata.
 *
 * Exactly one of `options.backupPath` or `options.backupDir` must be
 * given. `backupPath` processes one specific file. `backupDir` discovers
 * every `.realm` file directly inside that directory (non-recursive,
 * per the spec — no month-subfolder convention is assumed) and selects
 * the newest by content, never by filename.
 *
 * @param {object} options
 * @param {string} [options.backupPath]
 * @param {string} [options.backupDir]
 * @param {import('../shared/logger').Logger} [options.logger]
 * @returns {Promise<{canonical: object, validationReport: object, runMetadata: object, snapshotStatus: string}>}
 */
async function runConnector(options = {}) {
  const logger = options.logger || new Logger();
  const startedAt = new Date().toISOString();

  if (!options.backupPath && !options.backupDir) {
    throw new ConfigurationError('runConnector requires either options.backupPath or options.backupDir.');
  }
  if (options.backupPath && options.backupDir) {
    throw new ConfigurationError('runConnector accepts only one of options.backupPath or options.backupDir, not both.');
  }

  let profile;
  let duplicateOf = null;

  if (options.backupDir) {
    logger.info('Discovering backups', { backupDir: options.backupDir });
    const profiles = await discoverBackups(options.backupDir);
    if (profiles.length === 0) {
      throw new ExtractionError(`No .realm backup files found in ${options.backupDir}`, { backupDir: options.backupDir });
    }
    const duplicateGroups = findDuplicateGroups(profiles);
    profile = selectNewestBackup(profiles);
    const ownGroup = duplicateGroups.find((group) => group.some((p) => p.path === profile.path));
    if (ownGroup) {
      const other = ownGroup.find((p) => p.path !== profile.path);
      if (other) duplicateOf = { checksum: profile.checksum, path: other.path };
    }
    logger.info('Selected newest backup by content', { path: profile.path, latestActivity: profile.dateRanges.Invoice.max });
  } else {
    profile = await inspectBackup(options.backupPath);
  }

  const preflight = runPreflightChecks(profile);
  for (const issue of preflight.issues) {
    logger.warn(`backup validation: ${issue.check}`, issue);
  }

  if (preflight.fatal) {
    const finishedAt = new Date().toISOString();
    const runMetadata = buildRunMetadata({
      runId: logger.runId,
      startedAt,
      finishedAt,
      sourceFile: profile.path,
      sourceChecksum: profile.checksum,
      schemaVersion: profile.schemaVersion,
      connectorVersion: config.CONNECTOR_VERSION,
      backupValidation: { issues: preflight.issues },
      duplicateOf,
      failure: { stage: 'preflight-validation', message: preflight.issues[0].message },
    });
    throw new ExtractionError(preflight.issues[0].message, { runMetadata });
  }

  const snapshotStatus = classifySnapshot(profile);
  logger.info('Snapshot classified', { snapshotStatus });

  const extracted = await extract(
    profile.path,
    config.TOP_LEVEL_ENTITIES,
    {
      lastKnownGoodSchemaVersion: config.LAST_KNOWN_GOOD_SCHEMA_VERSION,
      schemaDriftPolicy: config.SCHEMA_DRIFT_POLICY,
    },
    logger
  );
  extracted.meta.connectorVersion = config.CONNECTOR_VERSION;

  const entityCounts = {};
  for (const name of config.TOP_LEVEL_ENTITIES) {
    entityCounts[name] = extracted.entities[name].length;
  }

  const canonical = normalize(extracted, logger);
  const canonicalCounts = {};
  for (const name of config.CANONICAL_ENTITIES) {
    canonicalCounts[name] = (canonical[name] || []).length;
  }

  const validationReport = validate(canonical);

  const finishedAt = new Date().toISOString();
  const runMetadata = buildRunMetadata({
    runId: logger.runId,
    startedAt,
    finishedAt,
    sourceFile: profile.path,
    sourceChecksum: profile.checksum,
    schemaVersion: profile.schemaVersion,
    connectorVersion: config.CONNECTOR_VERSION,
    snapshotStatus,
    entityCounts,
    canonicalCounts,
    validationSummary: validationReport.summary,
    backupValidation: { issues: preflight.issues },
    duplicateOf,
    failure: null,
  });

  logger.runSummary({ entityCounts, canonicalCounts, validationSummary: validationReport.summary, exportSummary: null });

  return { canonical, validationReport, runMetadata, snapshotStatus };
}

module.exports = { runConnector, KNOWN_SCHEMA_VERSIONS, REQUIRED_ENTITY_TYPES };
