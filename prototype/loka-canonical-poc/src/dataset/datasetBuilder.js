// Dashboard Dataset v1 — the stable contract every future presentation
// layer (PWA, Mobile, Desktop, TV Dashboard) consumes. Per this sprint's
// explicit instruction, this module NEVER imports realm, the connector,
// or any Business Service module — it only transforms data the Reporting
// Service and Connector have already computed. That is enforced
// structurally (asserted directly by a test), not just claimed here.
//
// Data flow this module sits at the end of, reused from
// implementation/dashboard-v2-implementation-plan.md §2, not reinvented:
//   Loka -> Canonical Pipeline -> Business Services -> Dashboard Dataset
//        -> Apps Script -> Dashboard
// "Dashboard Dataset" there was already mapped onto the Reporting
// Service's own output; this module is the concrete v1 contract shape
// for that same concept, now formalized and versioned.

const { BUSINESS_UNITS } = require('./businessUnits');
const { USER_ROLES } = require('./roles');
const { buildSystemHealth } = require('./health');

const DATASET_VERSION = '1.0.0';

// Every card in dashboard.json already comes from exactly one reporting
// module (src/reporting/cards.js) — recorded here once rather than
// re-deriving it per card, since it is the same for all eleven.
const CARD_REPORTING_MODULE = 'src/reporting/cards.js';

function buildCardLineage(card) {
  return [
    { stage: 'source', value: card.sourceEntity },
    { stage: 'businessService', value: card.businessService },
    { stage: 'reportingModule', value: CARD_REPORTING_MODULE },
    { stage: 'datasetBuilder', value: 'src/dataset/datasetBuilder.js' },
  ];
}

function enrichCard(card) {
  return {
    ...card,
    audit: {
      sourceEntity: card.sourceEntity,
      businessService: card.businessService,
      reportingModule: CARD_REPORTING_MODULE,
      refreshTimestamp: card.lastUpdated,
      confidence: card.confidence,
      currentStatus: card.status,
      lineage: buildCardLineage(card),
    },
    // No approval-tracking mechanism exists anywhere in this pipeline yet
    // (Business Rules Catalog GOV-004's own Known Gaps: "No running
    // system currently enforces this"; AI-005: the AI Session record
    // that would make approval auditable "does not yet exist as a
    // canonical record"). Stated as a fact about the pipeline's current
    // state, not fabricated as if an approval had happened or not.
    approvalStatus: 'not-tracked',
  };
}

function collectWarnings(runMetadata, cards) {
  const warnings = [];
  const backupIssues = (runMetadata && runMetadata.backupValidation && runMetadata.backupValidation.issues) || [];
  for (const issue of backupIssues) {
    warnings.push({ source: 'connector-preflight', check: issue.check, message: issue.message, severity: issue.severity });
  }
  for (const card of cards) {
    if (card.confidence === 'Medium' || card.confidence === 'Low') {
      warnings.push({ source: `card:${card.id}`, message: card.caveat || 'Reduced confidence, no further detail recorded.', severity: 'warning' });
    }
  }
  return warnings;
}

function collectBlockedReasons(cards) {
  return cards
    .filter((c) => c.status === 'blocked')
    .map((c) => ({ cardId: c.id, reason: c.caveat || 'Blocked, no further detail recorded.' }));
}

function collectUnknownReasons(cards) {
  return cards
    .filter((c) => c.value === 'UNKNOWN')
    .map((c) => ({ cardId: c.id, reason: c.caveat || 'UNKNOWN, no further detail recorded.' }));
}

function confidenceDistribution(cards) {
  // A distribution, not a single blended score — a single number would
  // require inventing a weighting scheme no document defines.
  const dist = { High: 0, Medium: 0, Low: 0, 'N/A': 0 };
  for (const card of cards) {
    if (card.confidence in dist) dist[card.confidence]++;
  }
  return dist;
}

/**
 * Builds the Dashboard Dataset v1 contract. Pure — no I/O, no Realm, no
 * connector, no Business Service dependency.
 *
 * @param {object} inputs
 * @param {object} inputs.dashboard the Reporting Service's dashboard.json shape
 * @param {object} inputs.summary the Reporting Service's dashboard-summary.json shape
 * @param {object} inputs.health the Reporting Service's dashboard-health.json shape
 * @param {object} inputs.runMetadata the connector's run metadata (for validationSummary,
 *   canonicalCounts, and other fields not threaded into the Reporting Service's own
 *   output shape — see implementation notes for why this is accepted directly
 *   rather than re-derived from the three JSON files alone)
 * @returns {object} Dashboard Dataset v1
 */
function buildDashboardDataset({ dashboard, summary, health, runMetadata }) {
  const enrichedCards = dashboard.cards.map(enrichCard);
  const generatedAt = new Date().toISOString();

  return {
    metadata: {
      datasetVersion: DATASET_VERSION,
      generatedAt,
      generatedFrom: {
        reportingGeneratedAt: dashboard.generatedAt,
        connectorRunId: runMetadata ? runMetadata.runId : null,
      },
    },

    systemHealth: buildSystemHealth(runMetadata, dashboard),

    businessUnits: BUSINESS_UNITS,

    userRoles: USER_ROLES,

    dashboardCards: enrichedCards,

    lastRefresh: runMetadata ? runMetadata.finishedAt : null,

    confidence: confidenceDistribution(dashboard.cards),

    freshness: health.freshness,

    warnings: collectWarnings(runMetadata, dashboard.cards),

    blockedReasons: collectBlockedReasons(dashboard.cards),

    unknownReasons: collectUnknownReasons(dashboard.cards),

    approvalStatus: {
      mechanism: 'not-yet-implemented',
      governingRule: 'Business Rules Catalog GOV-004 (Human Approval Gate)',
      note: 'No AI Session or Automation Job record exists anywhere in this pipeline yet, so no card carries a real approval event. Every card\'s own approvalStatus is "not-tracked" for the same reason.',
    },

    dataLineage: {
      pipeline: ['Loka (.realm backup)', 'Connector', 'Canonical Layer', 'Reporting Service', 'Dashboard Dataset v1'],
      reference: 'implementation/dashboard-v2-implementation-plan.md §2',
      sourceChecksum: runMetadata ? runMetadata.sourceChecksum : null,
      reconciliation: health.reconciliation,
    },

    businessSummary: summary,
  };
}

module.exports = { buildDashboardDataset, DATASET_VERSION };
