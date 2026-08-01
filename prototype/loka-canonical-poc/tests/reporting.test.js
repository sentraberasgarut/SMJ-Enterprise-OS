// Tests for the Reporting Service (src/reporting/), per
// implementation/dashboard-v2-implementation-plan.md and the Reporting
// Service v1 sprint. Unit tests use synthetic canonical data (no Realm
// access needed — this module never touches Realm at all, which several
// tests below assert directly). The one integration test runs against a
// real connector output when LOKA_BACKUP_PATH is set, matching the
// existing skip pattern used throughout this test suite.

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const { buildDashboardCards, STATUS } = require('../src/reporting/cards');
const { computeReconciliationStatus } = require('../src/reporting/reconciliation');
const { generateDashboardDataset, writeDashboardOutputs } = require('../src/reporting/reportingService');

const REQUIRED_CARD_FIELDS = ['id', 'name', 'value', 'status', 'lastUpdated', 'dataFreshness', 'sourceEntity', 'businessService', 'confidence'];

function syntheticCanonical() {
  return {
    Invoice: [
      { id: 'i1', date: '2026-07-30T09:00:00.000Z', status: 'PAID', grandTotal: 100000, capitalSubTotal: 80000, invoiceProfit: 20000 },
      { id: 'i2', date: '2026-07-30T11:00:00.000Z', status: 'PAID', grandTotal: 50000, capitalSubTotal: 40000, invoiceProfit: 10000 },
      { id: 'i3', date: '2026-07-30T12:00:00.000Z', status: 'CANCELLED', grandTotal: 25000, capitalSubTotal: 20000, invoiceProfit: 5000 },
      { id: 'i4', date: '2026-07-29T09:00:00.000Z', status: 'PAID', grandTotal: 10000, capitalSubTotal: 8000, invoiceProfit: 2000 },
    ],
    Expense: [
      { id: 'e1', date: '2026-07-30T08:00:00.000Z', items: [{ name: 'a', price: '5000' }, { name: 'b', price: '3000' }] },
      { id: 'e2', date: '2026-06-15T08:00:00.000Z', items: [{ name: 'old', price: '999999' }] }, // different month — excluded
    ],
    Product: [
      { id: 'p1', stock: 10, capitalPrice: 1000 },
      { id: 'p2', stock: 5, capitalPrice: 2000 },
    ],
    Customer: [],
    Supplier: [],
    Shift: [],
    InvoiceItem: [],
    Payment: [],
  };
}

const runMetadata = {
  finishedAt: '2026-07-31T00:00:00.000Z',
  sourceFile: 'test.realm',
  sourceChecksum: 'abc',
  schemaVersion: 109,
  connectorVersion: 'test-0.0.0',
  canonicalCounts: { Invoice: 4, Expense: 2, Product: 2 },
  backupValidation: { issues: [] },
  duplicateOf: null,
};

test('buildDashboardCards', async (t) => {
  await t.test('never touches Realm', () => {
    // Structural guarantee, not just a claim: the module's own source
    // must not IMPORT the realm package or the connector/discovery layer
    // (a doc-comment merely mentioning a connector file path, as this
    // module's own comments do, is not the same thing and must not fail
    // this check).
    const src = fs.readFileSync(path.join(__dirname, '../src/reporting/cards.js'), 'utf-8');
    const requireCalls = [...src.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
    assert.ok(!requireCalls.includes('realm'));
    assert.ok(!requireCalls.some((r) => r.includes('connector')));
  });

  await t.test('returns exactly 11 cards, each with every required field', () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    assert.equal(cards.length, 11);
    for (const card of cards) {
      for (const field of REQUIRED_CARD_FIELDS) {
        assert.ok(field in card, `card "${card.id}" is missing required field "${field}"`);
      }
    }
  });

  await t.test('Gross Profit sums invoiceProfit for PAID invoices only', () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    const gp = cards.find((c) => c.id === 'gross-profit');
    // PAID: i1(20000) + i2(10000) + i4(2000) = 32000. i3 (CANCELLED) excluded.
    assert.equal(gp.value, 32000);
    assert.equal(gp.status, STATUS.OK);
  });

  await t.test('Transaction Count includes every status, with the ambiguity noted', () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    const tc = cards.find((c) => c.id === 'transaction-count');
    assert.equal(tc.value, 4);
    assert.match(tc.caveat, /UNKNOWN/);
  });

  await t.test("Today's Revenue is PAID-only, for the latest calendar day present", () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    const tr = cards.find((c) => c.id === 'todays-revenue');
    // Latest day is 2026-07-30: i1 (100000) + i2 (50000) PAID; i3 CANCELLED excluded; i4 is a different day.
    assert.equal(tr.value, 150000);
  });

  await t.test('Expenses sums parsed item prices for the latest calendar month only', () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    const exp = cards.find((c) => c.id === 'expenses');
    // Latest month is 2026-07: e1 items 5000 + 3000 = 8000. e2 (June) excluded.
    assert.equal(exp.value, 8000);
  });

  await t.test('Inventory Value sums stock x capitalPrice across all Products', () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    const iv = cards.find((c) => c.id === 'inventory-value');
    // p1: 10*1000=10000, p2: 5*2000=10000 -> 20000
    assert.equal(iv.value, 20000);
  });

  await t.test('Net Profit is always UNKNOWN/blocked, never computed as Gross minus Expenses', () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    const np = cards.find((c) => c.id === 'net-profit');
    assert.equal(np.value, 'UNKNOWN');
    assert.equal(np.status, STATUS.BLOCKED);
    // Explicitly NOT 32000 - 8000 = 24000, even though that's computable
    // from the other two cards' own values above.
    assert.notEqual(np.value, 24000);
  });

  await t.test('cash-in-hand, safe-cash, goods-out, outstanding-receivables, and stock-alerts are always UNKNOWN — no canonical source exists', () => {
    const cards = buildDashboardCards(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');
    for (const id of ['cash-in-hand', 'safe-cash', 'goods-out', 'outstanding-receivables', 'stock-alerts']) {
      const card = cards.find((c) => c.id === id);
      assert.equal(card.value, 'UNKNOWN', `expected ${id} to be UNKNOWN`);
      assert.equal(card.status, STATUS.UNAVAILABLE, `expected ${id} status to be unavailable`);
    }
  });

  await t.test('handles entirely empty canonical data without throwing', () => {
    const empty = { Invoice: [], Expense: [], Product: [], Customer: [], Supplier: [], Shift: [], InvoiceItem: [], Payment: [] };
    const cards = buildDashboardCards(empty, runMetadata, 'UNKNOWN');
    assert.equal(cards.length, 11);
    assert.equal(cards.find((c) => c.id === 'gross-profit').value, null);
    assert.equal(cards.find((c) => c.id === 'transaction-count').value, 0);
  });
});

test('computeReconciliationStatus', async (t) => {
  await t.test('reconciled when invoiceProfit matches grandTotal - capitalSubTotal', () => {
    const canonical = { Invoice: [{ status: 'PAID', invoiceProfit: 20000, grandTotal: 100000, capitalSubTotal: 80000 }] };
    const result = computeReconciliationStatus(canonical);
    assert.equal(result.status, 'reconciled');
    assert.equal(result.differenceAbs, 0);
  });

  await t.test('discrepancy-found when the two figures disagree', () => {
    const canonical = { Invoice: [{ status: 'PAID', invoiceProfit: 25000, grandTotal: 100000, capitalSubTotal: 80000 }] };
    const result = computeReconciliationStatus(canonical);
    assert.equal(result.status, 'discrepancy-found');
    assert.equal(result.differenceAbs, 5000);
  });

  await t.test('insufficient-data when there are no PAID invoices', () => {
    const canonical = { Invoice: [{ status: 'CANCELLED', invoiceProfit: 1, grandTotal: 1, capitalSubTotal: 0 }] };
    const result = computeReconciliationStatus(canonical);
    assert.equal(result.status, 'insufficient-data');
  });

  await t.test('never references Net Margin — no canonical source exists for it', () => {
    const src = fs.readFileSync(path.join(__dirname, '../src/reporting/reconciliation.js'), 'utf-8');
    assert.ok(!/netMargin\s*[:=]/.test(src), 'reconciliation.js must not compute a netMargin value');
  });
});

test('generateDashboardDataset', async (t) => {
  const dataset = generateDashboardDataset(syntheticCanonical(), runMetadata, 'PARTIAL_DAY');

  await t.test('returns exactly the three required shapes', () => {
    assert.ok(dataset.dashboard);
    assert.ok(dataset.summary);
    assert.ok(dataset.health);
  });

  await t.test('dashboard.cards has exactly 11 entries', () => {
    assert.equal(dataset.dashboard.cards.length, 11);
  });

  await t.test('summary.headline references card values, not a recomputation', () => {
    const gpCard = dataset.dashboard.cards.find((c) => c.id === 'gross-profit');
    assert.equal(dataset.summary.headline.grossProfit, gpCard.value);
  });

  await t.test('health includes freshness and reconciliation', () => {
    assert.ok(dataset.health.freshness);
    assert.ok(dataset.health.reconciliation);
    assert.equal(dataset.health.freshness.schemaVersion, 109);
  });

  await t.test('writeDashboardOutputs writes exactly three files with matching content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reporting-test-'));
    try {
      const files = writeDashboardOutputs(tmpDir, dataset);
      const writtenDashboard = JSON.parse(fs.readFileSync(files.dashboardPath, 'utf-8'));
      const writtenSummary = JSON.parse(fs.readFileSync(files.summaryPath, 'utf-8'));
      const writtenHealth = JSON.parse(fs.readFileSync(files.healthPath, 'utf-8'));
      assert.deepEqual(writtenDashboard, dataset.dashboard);
      assert.deepEqual(writtenSummary, dataset.summary);
      assert.deepEqual(writtenHealth, dataset.health);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------
// Integration: real canonical output from the connector, real dataset
// ---------------------------------------------------------------------

test('Reporting Service against real connector output', async (t) => {
  const backupPath = process.env.LOKA_BACKUP_PATH;
  if (!backupPath) {
    t.skip('LOKA_BACKUP_PATH not set — cannot run against real canonical output in this environment');
    return;
  }

  const Realm = require('realm');
  const { runConnector } = require('../src/connector/connector');
  let connectorResult;
  try {
    connectorResult = await runConnector({ backupPath });
    const dataset = generateDashboardDataset(connectorResult.canonical, connectorResult.runMetadata, connectorResult.snapshotStatus);

    await t.test('produces 11 cards, all structurally valid', () => {
      assert.equal(dataset.dashboard.cards.length, 11);
      for (const card of dataset.dashboard.cards) {
        for (const field of REQUIRED_CARD_FIELDS) {
          assert.ok(field in card);
        }
      }
    });

    await t.test('Expenses and Gross Profit are both computed (not UNKNOWN) for real data', () => {
      const gp = dataset.dashboard.cards.find((c) => c.id === 'gross-profit');
      const exp = dataset.dashboard.cards.find((c) => c.id === 'expenses');
      assert.equal(typeof gp.value, 'number');
      assert.equal(typeof exp.value, 'number');
    });

    await t.test('Net Profit remains UNKNOWN even against real, non-zero Expense data', () => {
      const np = dataset.dashboard.cards.find((c) => c.id === 'net-profit');
      assert.equal(np.value, 'UNKNOWN');
    });

    await t.test('reconciliation status is reconciled for real PAID invoice data', () => {
      // Matches reports/dashboard-reconciliation-audit.md's own finding
      // that these two computations agree to the cent for real data.
      assert.equal(dataset.health.reconciliation.status, 'reconciled');
    });
  } finally {
    Realm.shutdown();
  }
});
