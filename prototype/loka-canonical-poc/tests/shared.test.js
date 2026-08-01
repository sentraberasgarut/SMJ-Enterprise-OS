const test = require('node:test');
const assert = require('node:assert/strict');

const errors = require('../src/shared/errors');
const { Logger } = require('../src/shared/logger');
const registry = require('../src/registry/entityRegistry');
const { extract } = require('../src/extract');

test('typed errors', async (t) => {
  await t.test('each typed error is distinguishable by type, not by message string', () => {
    const err = new errors.SchemaDriftError('schema drift detected', { detected: 200, expected: 109 });
    assert.equal(err.name, 'SchemaDriftError');
    assert.ok(err instanceof errors.SchemaDriftError);
    assert.ok(err instanceof errors.PipelineError);
    assert.ok(err instanceof Error);
    assert.deepEqual(err.details, { detected: 200, expected: 109 });
  });

  await t.test('ConfigurationError is thrown, not a plain Error, when no backup path is given', async () => {
    await assert.rejects(
      () => extract(null, ['Product']),
      (err) => err instanceof errors.ConfigurationError
    );
  });

  await t.test('ExtractionError is thrown, not a plain Error, for a missing file', async () => {
    await assert.rejects(
      () => extract('C:/this/file/does/not/exist.realm', ['Product']),
      (err) => err instanceof errors.ExtractionError
    );
  });
});

test('structured logger', async (t) => {
  await t.test('emits a run summary containing every required field', () => {
    const originalLog = console.log;
    const lines = [];
    console.log = (text) => lines.push(text);
    try {
      const logger = new Logger('test-run-id');
      logger.info('hello');
      const summary = logger.runSummary({
        entityCounts: { Product: 1 },
        canonicalCounts: { Product: 1 },
        validationSummary: { totalIssues: 0, errors: 0, warnings: 0, byRule: {} },
        exportSummary: { canonicalPath: 'x', reportPath: 'y' },
      });
      assert.equal(summary.runId, 'test-run-id');
      assert.ok(summary.startedAt);
      assert.ok(summary.finishedAt);
      assert.ok(typeof summary.durationMs === 'number');
      assert.deepEqual(summary.entityCounts, { Product: 1 });
      assert.deepEqual(summary.validationSummary, { totalIssues: 0, errors: 0, warnings: 0, byRule: {} });

      const summaryLine = lines.map((l) => JSON.parse(l)).find((l) => l.message === 'run summary');
      assert.ok(summaryLine, 'expected the run summary to actually be logged, not just returned');
      assert.equal(summaryLine.runId, 'test-run-id');
    } finally {
      console.log = originalLog;
    }
  });
});

test('entity registry', async (t) => {
  await t.test('knows about all 8 canonical entities without any hardcoded list in this test', () => {
    const names = registry.names();
    assert.deepEqual(
      [...names].sort(),
      ['Customer', 'Expense', 'Invoice', 'InvoiceItem', 'Payment', 'Product', 'Shift', 'Supplier']
    );
  });

  await t.test('separates top-level from derived entities correctly', () => {
    const topLevelNames = registry.topLevel().map((d) => d.name);
    const derivedNames = registry.derived().map((d) => d.name);
    assert.deepEqual([...topLevelNames].sort(), ['Customer', 'Expense', 'Invoice', 'Product', 'Shift', 'Supplier']);
    assert.deepEqual([...derivedNames].sort(), ['InvoiceItem', 'Payment']);
  });

  await t.test('get() throws a ConfigurationError for an unknown entity, rather than returning undefined', () => {
    assert.throws(() => registry.get('NotARealEntity'), errors.ConfigurationError);
  });
});
