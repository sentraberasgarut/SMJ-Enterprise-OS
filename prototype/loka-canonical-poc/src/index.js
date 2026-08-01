// Orchestrates the pipeline: Extract -> Normalize -> Validate -> Export.
// No business logic lives here — this module only sequences the other four.

const Realm = require('realm');
const config = require('./config');
const { extract } = require('./extract');
const { normalize } = require('./normalize');
const { validate } = require('./validate');
const { exportResults } = require('./export');
const { Logger } = require('./shared/logger');
const { PipelineError } = require('./shared/errors');

async function main() {
  const logger = new Logger();

  logger.info('Loka -> Canonical pipeline starting', { connectorVersion: config.CONNECTOR_VERSION });
  logger.info('This is a local prototype. It does not deploy, schedule, or run in the cloud.');

  logger.info('1/4 Extract', { backupPath: config.BACKUP_PATH || '(LOKA_BACKUP_PATH not set)' });
  const extracted = await extract(
    config.BACKUP_PATH,
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
    logger.info(`   ${name}: ${entityCounts[name]} record(s)`);
  }

  logger.info('2/4 Normalize', { note: 'mapping raw Realm objects to canonical entities' });
  const canonical = normalize(extracted, logger);
  const canonicalCounts = {};
  for (const name of config.CANONICAL_ENTITIES) {
    canonicalCounts[name] = (canonical[name] || []).length;
    logger.info(`   ${name}: ${canonicalCounts[name]} canonical record(s)`);
  }

  logger.info('3/4 Validate', { note: 'running business validation (never discards records)' });
  const validationReport = validate(canonical);
  logger.info(
    `   ${validationReport.summary.totalIssues} issue(s) found ` +
      `(${validationReport.summary.errors} error, ${validationReport.summary.warnings} warning)`
  );

  logger.info('4/4 Export', { note: 'writing canonical.json and validation-report.json' });
  const { canonicalPath, reportPath } = exportResults(config.OUTPUT_DIR, canonical, validationReport, logger);
  logger.info(`   ${canonicalPath}`);
  logger.info(`   ${reportPath}`);

  logger.runSummary({
    entityCounts,
    canonicalCounts,
    validationSummary: validationReport.summary,
    exportSummary: { canonicalPath, reportPath },
  });

  logger.info('Done. Nothing was written back to the source backup.');
}

main()
  .catch((err) => {
    const logger = new Logger();
    if (err instanceof PipelineError) {
      logger.error(`Pipeline failed: ${err.message}`, { type: err.name, details: err.details, stack: err.stack });
    } else {
      logger.error(`Pipeline failed: ${err.message}`, { type: err.name || 'Error', stack: err.stack });
    }
    process.exitCode = 1;
  })
  .finally(() => {
    // Realm's own docs: "Call this method to free up the event loop and
    // allow Node.js to perform a graceful exit." Runs exactly once,
    // regardless of whether main() succeeded, failed, threw before
    // extract() ever ran, or threw after — see
    // implementation/root-cause-analysis.md for the full investigation.
    Realm.shutdown();
  });
