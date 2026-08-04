const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { run } = require('../src/importer');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sjs-hub-poc-'));
}

test('dummy importer publishes canonical data and validation issues', () => {
  const outputDir = tempDir();
  const canonical = run({ dataDir: DATA_DIR, outputDir });

  assert.equal(canonical.importJobs.length, 2);
  assert.ok(canonical.salesOrders.length >= 2);
  assert.ok(canonical.transfers.length >= 1);
  assert.ok(canonical.expenses.length >= 1);
  assert.ok(canonical.shiftClosings.length >= 1);
  assert.ok(canonical.validationIssues.some((issue) => issue.rule === 'missing-product-alias'));
  assert.ok(canonical.validationIssues.some((issue) => issue.rule === 'missing-transfer-price'));
  assert.ok(canonical.validationIssues.some((issue) => issue.rule === 'invalid-transfer-quantity'));
  assert.ok(fs.existsSync(path.join(outputDir, 'canonical.json')));
});

test('dummy importer skips repeated files by checksum', () => {
  const outputDir = tempDir();
  run({ dataDir: DATA_DIR, outputDir });
  const secondRun = run({ dataDir: DATA_DIR, outputDir });

  assert.equal(secondRun.importJobs.length, 2);
  assert.ok(secondRun.importJobs.every((job) => job.status === 'duplicate_skipped'));
  assert.equal(secondRun.salesOrders.length, 0);
  assert.equal(secondRun.transfers.length, 0);
});
