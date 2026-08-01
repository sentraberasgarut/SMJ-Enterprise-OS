// Regression test: runs the full pipeline against the real backup this
// prototype has already been verified against, and checks the output
// against the golden fixture captured before this refactor began.
//
// "Identical" here means: every field is identical except for the
// deliberately-volatile ones (ingestion timestamp, connector version,
// which are expected to change between runs and refactors by design).

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const config = require('../src/config');
const { extract } = require('../src/extract');
const { normalize } = require('../src/normalize');
const { validate } = require('../src/validate');

const GOLDEN_CANONICAL = require('./fixtures/golden-canonical.json');
const GOLDEN_REPORT = require('./fixtures/golden-validation-report.json');

// Fields known to legitimately vary between runs/refactors. Stripped
// before comparison rather than ignored ad hoc, so the diff logic itself
// stays simple and exhaustive everywhere else.
function stripVolatile(value) {
  if (Array.isArray(value)) {
    return value.map(stripVolatile);
  }
  if (value && typeof value === 'object') {
    const copy = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '_provenance') {
        copy[k] = { ...v, ingestedAt: '<stripped>', connectorVersion: '<stripped>' };
        continue;
      }
      copy[k] = stripVolatile(v);
    }
    return copy;
  }
  return value;
}

test('regression: refactored pipeline matches golden output for the real backup', async (t) => {
  const backupPath = process.env.LOKA_BACKUP_PATH;
  if (!backupPath) {
    t.skip('LOKA_BACKUP_PATH not set — cannot run against the real backup in this environment');
    return;
  }

  const extracted = await extract(backupPath, config.TOP_LEVEL_ENTITIES, {
    lastKnownGoodSchemaVersion: config.LAST_KNOWN_GOOD_SCHEMA_VERSION,
    schemaDriftPolicy: 'warn',
  });
  extracted.meta.connectorVersion = config.CONNECTOR_VERSION;

  const canonical = normalize(extracted);
  const report = validate(canonical);

  await t.test('entity counts match the golden fixture', () => {
    for (const entity of config.CANONICAL_ENTITIES) {
      assert.equal(
        (canonical[entity] || []).length,
        (GOLDEN_CANONICAL[entity] || []).length,
        `${entity} count changed`
      );
    }
  });

  await t.test('canonical output is field-identical (ignoring provenance timestamps)', () => {
    const actual = stripVolatile(canonical);
    const expected = stripVolatile(GOLDEN_CANONICAL);
    assert.deepEqual(actual, expected);
  });

  await t.test('validation summary is unchanged (zero issues stays zero)', () => {
    assert.equal(report.summary.totalIssues, GOLDEN_REPORT.summary.totalIssues);
    assert.equal(report.summary.errors, GOLDEN_REPORT.summary.errors);
    assert.equal(report.summary.warnings, GOLDEN_REPORT.summary.warnings);
  });

  await t.test('Gross Profit (sum of Invoice.invoiceProfit) is unchanged', () => {
    const sum = (rows) => rows.reduce((acc, inv) => acc + (inv.invoiceProfit || 0), 0);
    const actualProfit = sum(canonical.Invoice);
    const expectedProfit = sum(GOLDEN_CANONICAL.Invoice);
    // Floating point sums over ~480 records can differ in the last few
    // decimal places without being a real regression.
    assert.ok(
      Math.abs(actualProfit - expectedProfit) < 0.01,
      `Gross Profit changed: ${actualProfit} vs ${expectedProfit}`
    );
  });
});
