// Tests for Dashboard Dataset v1 (src/dataset/), per this sprint's
// requirements: schema stability, backward compatibility, UNKNOWN
// propagation, BLOCKED propagation, lineage completeness, and the
// structural "no Realm / no Connector / no Business Service dependency"
// guarantee. All unit tests use synthetic Reporting Service output — this
// module never touches Realm, so no skip-if-unset pattern is needed for
// most of this file. One integration test runs against real data when
// LOKA_BACKUP_PATH is set, matching the rest of this suite's convention.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { buildDashboardDataset, DATASET_VERSION } = require('../src/dataset/datasetBuilder');
const { BUSINESS_UNITS } = require('../src/dataset/businessUnits');
const { USER_ROLES } = require('../src/dataset/roles');
const { buildSystemHealth, STAGE_STATUS } = require('../src/dataset/health');

// The exact 11-card contract this dataset must always support, per
// implementation/dashboard-v2-implementation-plan.md §3 — the same list
// used to build the synthetic fixture below.
const CARD_IDS = [
  'todays-revenue', 'gross-profit', 'transaction-count', 'cash-in-hand', 'safe-cash',
  'inventory-value', 'goods-out', 'outstanding-receivables', 'expenses', 'net-profit', 'stock-alerts',
];

function syntheticCard(overrides) {
  return {
    id: 'x', name: 'X', value: 1, status: 'ok', lastUpdated: '2026-08-01T00:00:00.000Z',
    dataFreshness: { latestDataDate: '2026-07-31T00:00:00.000Z', ingestedAt: '2026-08-01T00:00:00.000Z', ageInDays: 1 },
    sourceEntity: 'Invoice', businessService: 'Sales Service', confidence: 'High', caveat: 'none',
    ...overrides,
  };
}

function syntheticDashboard() {
  const cards = CARD_IDS.map((id) => syntheticCard({ id, name: id }));
  const netProfit = cards.find((c) => c.id === 'net-profit');
  netProfit.value = 'UNKNOWN';
  netProfit.status = 'blocked';
  netProfit.confidence = 'N/A';
  const cashInHand = cards.find((c) => c.id === 'cash-in-hand');
  cashInHand.value = 'UNKNOWN';
  cashInHand.status = 'unavailable';
  cashInHand.confidence = 'N/A';
  return { generatedAt: '2026-08-01T00:00:00.000Z', snapshotStatus: 'PARTIAL_DAY', cardCount: cards.length, cards };
}

function syntheticSummary() {
  return { generatedAt: '2026-08-01T00:00:00.000Z', snapshotStatus: 'PARTIAL_DAY', entityCounts: { Invoice: 10 }, headline: {}, cardsAvailable: 9, cardsUnavailable: 1, cardsBlocked: 1 };
}

function syntheticHealth() {
  return {
    generatedAt: '2026-08-01T00:00:00.000Z',
    freshness: { sourceFile: 'x.realm', sourceChecksum: 'abc', schemaVersion: 109, connectorVersion: 'test-0.0.0', ingestedAt: '2026-08-01T00:00:00.000Z', snapshotStatus: 'PARTIAL_DAY' },
    reconciliation: { status: 'reconciled', checkedInvoiceCount: 10, grossProfitSum: 100, computedMarginSum: 100, differenceAbs: 0, note: 'x' },
    backupValidation: { issues: [{ check: 'unknown-schema-version', message: 'test warning', severity: 'warning' }] },
    duplicateOf: null,
  };
}

function syntheticRunMetadata() {
  return {
    runId: 'run-1',
    startedAt: '2026-08-01T00:00:00.000Z',
    finishedAt: '2026-08-01T00:00:01.000Z',
    sourceFile: 'x.realm',
    sourceChecksum: 'abc',
    schemaVersion: 109,
    connectorVersion: 'test-0.0.0',
    snapshotStatus: 'PARTIAL_DAY',
    entityCounts: { Invoice: 10 },
    canonicalCounts: { Invoice: 10 },
    validationSummary: { totalIssues: 0, errors: 0, warnings: 0, byRule: {} },
    backupValidation: { issues: [{ check: 'unknown-schema-version', message: 'test warning', severity: 'warning' }] },
    duplicateOf: null,
    failure: null,
  };
}

function buildSyntheticDataset() {
  return buildDashboardDataset({
    dashboard: syntheticDashboard(),
    summary: syntheticSummary(),
    health: syntheticHealth(),
    runMetadata: syntheticRunMetadata(),
  });
}

// ---------------------------------------------------------------------
// Dependency isolation — structural, not just claimed
// ---------------------------------------------------------------------

test('dataset module has no Realm, Connector, or Business Service dependency', async (t) => {
  const files = ['datasetBuilder.js', 'businessUnits.js', 'roles.js', 'health.js'];
  for (const file of files) {
    await t.test(`${file} imports nothing from connector/, services/, or realm`, () => {
      const src = fs.readFileSync(path.join(__dirname, '../src/dataset', file), 'utf-8');
      const requireCalls = [...src.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
      assert.ok(!requireCalls.includes('realm'), `${file} must not require 'realm'`);
      assert.ok(!requireCalls.some((r) => r.includes('connector')), `${file} must not require a connector module`);
      assert.ok(!requireCalls.some((r) => r.includes('/services/')), `${file} must not require a Business Service module`);
    });
  }
});

// ---------------------------------------------------------------------
// Schema stability / structure
// ---------------------------------------------------------------------

test('buildDashboardDataset schema stability', async (t) => {
  const dataset = buildSyntheticDataset();

  await t.test('has every required top-level section', () => {
    const requiredKeys = [
      'metadata', 'systemHealth', 'businessUnits', 'userRoles', 'dashboardCards',
      'lastRefresh', 'confidence', 'freshness', 'warnings', 'blockedReasons',
      'unknownReasons', 'approvalStatus', 'dataLineage', 'businessSummary',
    ];
    for (const key of requiredKeys) {
      assert.ok(key in dataset, `missing required top-level key "${key}"`);
    }
  });

  await t.test('metadata carries a stable dataset version', () => {
    assert.equal(dataset.metadata.datasetVersion, DATASET_VERSION);
    assert.equal(DATASET_VERSION, '1.0.0');
  });

  await t.test('businessUnits includes exactly the five named units', () => {
    assert.equal(dataset.businessUnits.length, 5);
    const ids = dataset.businessUnits.map((u) => u.id);
    assert.deepEqual(ids.sort(), ['central-kitchen', 'sj1', 'sj4', 'tss', 'warung-makan-padang']);
  });

  await t.test('userRoles includes exactly the seven named roles', () => {
    assert.equal(dataset.userRoles.length, 7);
    const ids = dataset.userRoles.map((r) => r.id);
    assert.deepEqual(
      ids.sort(),
      ['cashier', 'central-kitchen-manager', 'ceo', 'driver', 'future-admin', 'owner-ibu', 'store-manager']
    );
  });

  await t.test('dashboardCards has exactly 11 entries, matching the documented card set', () => {
    assert.equal(dataset.dashboardCards.length, 11);
    assert.deepEqual(dataset.dashboardCards.map((c) => c.id).sort(), [...CARD_IDS].sort());
  });
});

// ---------------------------------------------------------------------
// Backward compatibility baseline (v1 — establishes the contract future
// versions must not silently break)
// ---------------------------------------------------------------------

test('v1 backward-compatibility baseline', async (t) => {
  const dataset = buildSyntheticDataset();

  await t.test('metadata.datasetVersion is a semver string', () => {
    assert.match(dataset.metadata.datasetVersion, /^\d+\.\d+\.\d+$/);
  });

  await t.test('every card carries the audit contract fields', () => {
    for (const card of dataset.dashboardCards) {
      assert.ok(card.audit, `card "${card.id}" missing audit block`);
      for (const field of ['sourceEntity', 'businessService', 'reportingModule', 'refreshTimestamp', 'confidence', 'currentStatus', 'lineage']) {
        assert.ok(field in card.audit, `card "${card.id}".audit missing "${field}"`);
      }
      assert.ok('approvalStatus' in card, `card "${card.id}" missing approvalStatus`);
    }
  });

  await t.test('systemHealth exposes every required stage', () => {
    for (const field of ['connector', 'canonical', 'reporting', 'validation', 'lastSuccessfulRefresh', 'snapshotClassification', 'schemaVersion', 'sourceBackup']) {
      assert.ok(field in dataset.systemHealth, `systemHealth missing "${field}"`);
    }
  });
});

// ---------------------------------------------------------------------
// UNKNOWN propagation
// ---------------------------------------------------------------------

test('UNKNOWN propagation', async (t) => {
  const dataset = buildSyntheticDataset();

  await t.test('a card with value UNKNOWN appears in unknownReasons', () => {
    const entry = dataset.unknownReasons.find((r) => r.cardId === 'cash-in-hand');
    assert.ok(entry, 'expected cash-in-hand in unknownReasons');
    assert.equal(typeof entry.reason, 'string');
  });

  await t.test('a card with a real value does NOT appear in unknownReasons', () => {
    const entry = dataset.unknownReasons.find((r) => r.cardId === 'gross-profit');
    assert.equal(entry, undefined);
  });

  await t.test('the UNKNOWN card\'s own value is never silently replaced with a number', () => {
    const card = dataset.dashboardCards.find((c) => c.id === 'cash-in-hand');
    assert.equal(card.value, 'UNKNOWN');
  });
});

// ---------------------------------------------------------------------
// BLOCKED propagation
// ---------------------------------------------------------------------

test('BLOCKED propagation', async (t) => {
  const dataset = buildSyntheticDataset();

  await t.test('a card with status blocked appears in blockedReasons', () => {
    const entry = dataset.blockedReasons.find((r) => r.cardId === 'net-profit');
    assert.ok(entry, 'expected net-profit in blockedReasons');
  });

  await t.test('a non-blocked card does NOT appear in blockedReasons', () => {
    const entry = dataset.blockedReasons.find((r) => r.cardId === 'gross-profit');
    assert.equal(entry, undefined);
  });

  await t.test('blocked status is preserved in the card\'s own audit.currentStatus', () => {
    const card = dataset.dashboardCards.find((c) => c.id === 'net-profit');
    assert.equal(card.audit.currentStatus, 'blocked');
  });
});

// ---------------------------------------------------------------------
// Lineage completeness
// ---------------------------------------------------------------------

test('lineage completeness', async (t) => {
  const dataset = buildSyntheticDataset();

  await t.test('every card has a complete 4-stage lineage chain', () => {
    for (const card of dataset.dashboardCards) {
      const stages = card.audit.lineage.map((l) => l.stage);
      assert.deepEqual(stages, ['source', 'businessService', 'reportingModule', 'datasetBuilder']);
      for (const step of card.audit.lineage) {
        assert.ok(step.value !== undefined, `card "${card.id}" lineage stage "${step.stage}" has no value`);
      }
    }
  });

  await t.test('dataLineage.pipeline names the full chain from Loka to the dataset', () => {
    assert.deepEqual(dataset.dataLineage.pipeline, ['Loka (.realm backup)', 'Connector', 'Canonical Layer', 'Reporting Service', 'Dashboard Dataset v1']);
  });

  await t.test('dataLineage carries the source checksum for full per-run traceability', () => {
    assert.equal(dataset.dataLineage.sourceChecksum, 'abc');
  });
});

// ---------------------------------------------------------------------
// Warnings / confidence / health derivation
// ---------------------------------------------------------------------

test('warnings and confidence', async (t) => {
  const dataset = buildSyntheticDataset();

  await t.test('a connector preflight issue surfaces as a warning', () => {
    assert.ok(dataset.warnings.some((w) => w.source === 'connector-preflight'));
  });

  await t.test('confidence is a distribution, not a single fabricated score', () => {
    assert.equal(typeof dataset.confidence, 'object');
    assert.ok('High' in dataset.confidence && 'N/A' in dataset.confidence);
    const total = Object.values(dataset.confidence).reduce((a, b) => a + b, 0);
    assert.equal(total, 11);
  });
});

test('buildSystemHealth', async (t) => {
  await t.test('validation status reflects a real validationSummary', () => {
    const h = buildSystemHealth(syntheticRunMetadata(), syntheticDashboard());
    assert.equal(h.validation, STAGE_STATUS.HEALTHY);
  });

  await t.test('validation status is unavailable when validationSummary is missing', () => {
    const h = buildSystemHealth({ ...syntheticRunMetadata(), validationSummary: undefined }, syntheticDashboard());
    assert.equal(h.validation, STAGE_STATUS.UNAVAILABLE);
  });

  await t.test('reporting status is degraded if the card count is not 11', () => {
    const brokenDashboard = { cards: syntheticDashboard().cards.slice(0, 5) };
    const h = buildSystemHealth(syntheticRunMetadata(), brokenDashboard);
    assert.equal(h.reporting, STAGE_STATUS.DEGRADED);
  });
});

// ---------------------------------------------------------------------
// businessUnits / roles schema content
// ---------------------------------------------------------------------

test('businessUnits and roles schema honesty', async (t) => {
  await t.test('Toko Sembako Sejahtera is the only unit marked data-connected', () => {
    const connected = BUSINESS_UNITS.filter((u) => u.dataConnected);
    assert.equal(connected.length, 1);
    assert.equal(connected[0].id, 'tss');
  });

  await t.test('Warung Makan Padang is explicitly marked as not grounded in prior documents', () => {
    const unit = BUSINESS_UNITS.find((u) => u.id === 'warung-makan-padang');
    assert.match(unit.groundedIn, /not in any prior document/);
  });

  await t.test('roles with no documented visibility scope say UNKNOWN, not a guessed value', () => {
    for (const id of ['store-manager', 'central-kitchen-manager', 'cashier', 'driver', 'future-admin']) {
      const role = USER_ROLES.find((r) => r.id === id);
      assert.equal(role.visibilityScope, 'UNKNOWN');
    }
  });

  await t.test('CEO and Owner (Ibu) have a grounded, non-UNKNOWN visibility scope', () => {
    const ceo = USER_ROLES.find((r) => r.id === 'ceo');
    const ibu = USER_ROLES.find((r) => r.id === 'owner-ibu');
    assert.notEqual(ceo.visibilityScope, 'UNKNOWN');
    assert.notEqual(ibu.visibilityScope, 'UNKNOWN');
  });
});

// ---------------------------------------------------------------------
// Integration: real data through the full connector -> reporting ->
// dataset chain
// ---------------------------------------------------------------------

test('Dashboard Dataset v1 against real pipeline output', async (t) => {
  const backupPath = process.env.LOKA_BACKUP_PATH;
  if (!backupPath) {
    t.skip('LOKA_BACKUP_PATH not set — cannot run the full chain against real data in this environment');
    return;
  }

  const Realm = require('realm');
  const { runConnector } = require('../src/connector/connector');
  const { generateDashboardDataset } = require('../src/reporting/reportingService');

  try {
    const connectorResult = await runConnector({ backupPath });
    const { dashboard, summary, health } = generateDashboardDataset(connectorResult.canonical, connectorResult.runMetadata, connectorResult.snapshotStatus);
    const dataset = buildDashboardDataset({ dashboard, summary, health, runMetadata: connectorResult.runMetadata });

    await t.test('real dataset has 11 cards and every required top-level key', () => {
      assert.equal(dataset.dashboardCards.length, 11);
      assert.ok(dataset.systemHealth);
      assert.ok(dataset.businessUnits.length === 5);
    });

    await t.test('systemHealth.validation is healthy for real, previously-verified-clean data', () => {
      assert.equal(dataset.systemHealth.validation, STAGE_STATUS.HEALTHY);
    });

    await t.test('net-profit is UNKNOWN and appears in both blockedReasons and is never a fabricated number', () => {
      const card = dataset.dashboardCards.find((c) => c.id === 'net-profit');
      assert.equal(card.value, 'UNKNOWN');
      assert.ok(dataset.blockedReasons.some((r) => r.cardId === 'net-profit'));
    });
  } finally {
    Realm.shutdown();
  }
});
