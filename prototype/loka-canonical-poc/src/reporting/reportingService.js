// Reporting Service v1 — orchestrator, per implementation/loka-connector-v1-spec.md's
// sibling task and the Reporting Service definition in services/reporting-service.md.
//
// Consumes ONLY canonical data (the connector's own output shape) plus the
// connector's run metadata and snapshot classification. Never opens a
// Realm file, never reads a Loka backup, never reads Buku Toko. This is
// the architectural boundary the whole sprint is built around — enforced
// here simply by never importing `realm` or any connector/discovery
// module in this file.

const fs = require('fs');
const path = require('path');
const { buildDashboardCards } = require('./cards');
const { computeReconciliationStatus } = require('./reconciliation');
const { ExportError } = require('../shared/errors');

/**
 * Builds the three required outputs from canonical data. Pure — no I/O.
 *
 * @param {object} canonical the connector's canonical output (unchanged shape)
 * @param {object} runMetadata the connector's run metadata
 * @param {string} snapshotStatus the connector's snapshot classification
 * @returns {{dashboard: object, summary: object, health: object}}
 */
function generateDashboardDataset(canonical, runMetadata, snapshotStatus) {
  const generatedAt = new Date().toISOString();

  const cards = buildDashboardCards(canonical, runMetadata, snapshotStatus);
  const reconciliation = computeReconciliationStatus(canonical);

  const dashboard = {
    generatedAt,
    snapshotStatus,
    cardCount: cards.length,
    cards,
  };

  const cardById = Object.fromEntries(cards.map((c) => [c.id, c]));
  const summary = {
    generatedAt,
    snapshotStatus,
    entityCounts: (runMetadata && runMetadata.canonicalCounts) || null,
    headline: {
      grossProfit: cardById['gross-profit'].value,
      expenses: cardById['expenses'].value,
      netProfit: cardById['net-profit'].value,
      todaysRevenue: cardById['todays-revenue'].value,
      transactionCount: cardById['transaction-count'].value,
      inventoryValue: cardById['inventory-value'].value,
    },
    cardsAvailable: cards.filter((c) => c.status === 'ok').length,
    cardsUnavailable: cards.filter((c) => c.status === 'unavailable').length,
    cardsBlocked: cards.filter((c) => c.status === 'blocked').length,
  };

  const health = {
    generatedAt,
    freshness: {
      sourceFile: runMetadata ? runMetadata.sourceFile : null,
      sourceChecksum: runMetadata ? runMetadata.sourceChecksum : null,
      schemaVersion: runMetadata ? runMetadata.schemaVersion : null,
      connectorVersion: runMetadata ? runMetadata.connectorVersion : null,
      ingestedAt: runMetadata ? runMetadata.finishedAt : null,
      snapshotStatus,
    },
    reconciliation,
    backupValidation: (runMetadata && runMetadata.backupValidation) || null,
    duplicateOf: (runMetadata && runMetadata.duplicateOf) || null,
  };

  return { dashboard, summary, health };
}

/**
 * Writes the three required JSON files to `outputDir`. Mirrors the
 * existing export.js's own error-handling pattern (typed ExportError on
 * failure) without modifying export.js itself.
 */
function writeDashboardOutputs(outputDir, dataset) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    throw new ExportError(`Failed to create output directory: ${err.message}`, { outputDir, cause: err.message });
  }

  const files = {
    dashboardPath: path.join(outputDir, 'dashboard.json'),
    summaryPath: path.join(outputDir, 'dashboard-summary.json'),
    healthPath: path.join(outputDir, 'dashboard-health.json'),
  };

  try {
    fs.writeFileSync(files.dashboardPath, JSON.stringify(dataset.dashboard, null, 2), 'utf-8');
    fs.writeFileSync(files.summaryPath, JSON.stringify(dataset.summary, null, 2), 'utf-8');
    fs.writeFileSync(files.healthPath, JSON.stringify(dataset.health, null, 2), 'utf-8');
  } catch (err) {
    throw new ExportError(`Failed to write dashboard dataset: ${err.message}`, { ...files, cause: err.message });
  }

  return files;
}

module.exports = { generateDashboardDataset, writeDashboardOutputs };
