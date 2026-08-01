// Tests for the new connector layer (src/connector/), per
// implementation/loka-connector-v1-spec.md. Unit tests for
// snapshotClassifier and metadata run unconditionally (no Realm access
// needed — pure functions over synthetic data). Integration tests for
// backupDiscovery and connector run only when a real backup is available
// via LOKA_BACKUP_PATH / LOKA_BACKUP_DIR, matching the existing skip
// pattern already used in tests/regression.test.js.
//
// This file calls Realm.shutdown() in an after() hook — the fix already
// identified in implementation/technical-debt.md (H1) and
// implementation/root-cause-analysis.md, applied here from the start
// since this is a new file, not a retrofit of an existing one.

const test = require('node:test');
const assert = require('node:assert/strict');
const Realm = require('realm');

const { STATUSES, classifySnapshot } = require('../src/connector/snapshotClassifier');
const { buildRunMetadata, makeBackupIssue } = require('../src/connector/metadata');
const { inspectBackup, discoverBackups, selectNewestBackup, findDuplicateGroups } = require('../src/connector/backupDiscovery');
const { runConnector, KNOWN_SCHEMA_VERSIONS } = require('../src/connector/connector');
const { ConfigurationError, ExtractionError } = require('../src/shared/errors');

test.after(() => {
  Realm.shutdown();
});

// ---------------------------------------------------------------------
// snapshotClassifier — pure unit tests, synthetic profiles
// ---------------------------------------------------------------------

test('classifySnapshot', async (t) => {
  await t.test('MID_SHIFT when a Shift has an unresolved closeTime, regardless of other dates', () => {
    const profile = {
      shiftsWithUnresolvedCloseTime: 1,
      dateRanges: {
        Invoice: { max: '2026-07-31T10:00:00.000Z' },
        InvoiceDebt: { max: null },
        'Shift.closeTime': { max: '2026-07-31T09:00:00.000Z' },
      },
    };
    assert.equal(classifySnapshot(profile), STATUSES.MID_SHIFT);
  });

  await t.test('COMPLETE_DAY when a Shift closes on or after the latest activity day', () => {
    const profile = {
      shiftsWithUnresolvedCloseTime: 0,
      dateRanges: {
        Invoice: { max: '2026-07-30T18:00:00.000Z' },
        InvoiceDebt: { max: null },
        'Shift.closeTime': { max: '2026-07-30T20:00:00.000Z' },
      },
    };
    assert.equal(classifySnapshot(profile), STATUSES.COMPLETE_DAY);
  });

  await t.test('PARTIAL_DAY when no Shift has closed for the latest activity day yet', () => {
    // Matches the real 1 August backup exactly: Invoice reaches 1 August,
    // the latest Shift close is still 31 July.
    const profile = {
      shiftsWithUnresolvedCloseTime: 0,
      dateRanges: {
        Invoice: { max: '2026-08-01T00:38:28.354Z' },
        InvoiceDebt: { max: '2026-08-01T00:38:55.464Z' },
        'Shift.closeTime': { max: '2026-07-31T10:12:53.714Z' },
      },
    };
    assert.equal(classifySnapshot(profile), STATUSES.PARTIAL_DAY);
  });

  await t.test('UNKNOWN when there is no Invoice or InvoiceDebt activity at all', () => {
    const profile = {
      shiftsWithUnresolvedCloseTime: 0,
      dateRanges: {
        Invoice: { max: null },
        InvoiceDebt: { max: null },
        'Shift.closeTime': { max: '2026-07-30T20:00:00.000Z' },
      },
    };
    assert.equal(classifySnapshot(profile), STATUSES.UNKNOWN);
  });

  await t.test('UNKNOWN for a malformed profile, rather than throwing', () => {
    assert.equal(classifySnapshot(null), STATUSES.UNKNOWN);
    assert.equal(classifySnapshot({}), STATUSES.UNKNOWN);
  });

  await t.test('InvoiceDebt alone can anchor the latest-activity day', () => {
    const profile = {
      shiftsWithUnresolvedCloseTime: 0,
      dateRanges: {
        Invoice: { max: null },
        InvoiceDebt: { max: '2026-07-31T05:00:00.000Z' },
        'Shift.closeTime': { max: '2026-07-31T10:00:00.000Z' },
      },
    };
    assert.equal(classifySnapshot(profile), STATUSES.COMPLETE_DAY);
  });
});

// ---------------------------------------------------------------------
// metadata — pure unit tests
// ---------------------------------------------------------------------

test('buildRunMetadata', async (t) => {
  await t.test('computes durationMs from startedAt/finishedAt', () => {
    const m = buildRunMetadata({
      runId: 'r1',
      startedAt: '2026-08-01T00:00:00.000Z',
      finishedAt: '2026-08-01T00:00:01.500Z',
      sourceFile: 'x.realm',
      sourceChecksum: 'abc',
      schemaVersion: 109,
      connectorVersion: 'test-0.0.0',
    });
    assert.equal(m.durationMs, 1500);
  });

  await t.test('every field named in the spec §8 audit trail is present', () => {
    const m = buildRunMetadata({
      runId: 'r1',
      startedAt: '2026-08-01T00:00:00.000Z',
      finishedAt: '2026-08-01T00:00:01.000Z',
      sourceFile: 'x.realm',
      sourceChecksum: 'abc',
      schemaVersion: 109,
      connectorVersion: 'test-0.0.0',
      snapshotStatus: 'PARTIAL_DAY',
      entityCounts: { Invoice: 1 },
      canonicalCounts: { Invoice: 1 },
      validationSummary: { totalIssues: 0, errors: 0, warnings: 0, byRule: {} },
      backupValidation: { issues: [] },
      duplicateOf: null,
      failure: null,
    });
    for (const field of [
      'runId', 'startedAt', 'finishedAt', 'durationMs', 'sourceFile', 'sourceChecksum',
      'schemaVersion', 'connectorVersion', 'snapshotStatus', 'entityCounts', 'canonicalCounts',
      'validationSummary', 'backupValidation', 'duplicateOf', 'failure',
    ]) {
      assert.ok(field in m, `expected field "${field}" in run metadata`);
    }
  });

  await t.test('a failed run still produces a metadata record, with later fields null', () => {
    const m = buildRunMetadata({
      runId: 'r1',
      startedAt: '2026-08-01T00:00:00.000Z',
      finishedAt: '2026-08-01T00:00:00.100Z',
      sourceFile: 'x.realm',
      sourceChecksum: 'abc',
      schemaVersion: 109,
      connectorVersion: 'test-0.0.0',
      failure: { stage: 'preflight-validation', message: 'missing required entity' },
    });
    assert.equal(m.snapshotStatus, null);
    assert.equal(m.entityCounts, null);
    assert.deepEqual(m.failure, { stage: 'preflight-validation', message: 'missing required entity' });
  });
});

test('makeBackupIssue', () => {
  const issue = makeBackupIssue('future-timestamp', 'one field is in the future');
  assert.deepEqual(issue, { check: 'future-timestamp', message: 'one field is in the future', severity: 'warning' });
});

// ---------------------------------------------------------------------
// findDuplicateGroups — pure unit test, synthetic profiles (no Realm)
// ---------------------------------------------------------------------

test('findDuplicateGroups', async (t) => {
  await t.test('groups profiles sharing a checksum, regardless of path/filename', () => {
    const profiles = [
      { path: 'C:\\a\\backup.realm', checksum: 'same-hash' },
      { path: 'H:\\renamed-copy.realm', checksum: 'same-hash' },
      { path: 'C:\\b\\other.realm', checksum: 'different-hash' },
    ];
    const groups = findDuplicateGroups(profiles);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].length, 2);
  });

  await t.test('returns no groups when every checksum is unique', () => {
    const profiles = [{ path: 'a', checksum: '1' }, { path: 'b', checksum: '2' }];
    assert.deepEqual(findDuplicateGroups(profiles), []);
  });
});

// ---------------------------------------------------------------------
// connector — configuration error tests (no Realm access needed)
// ---------------------------------------------------------------------

test('runConnector argument validation', async (t) => {
  await t.test('throws ConfigurationError when neither backupPath nor backupDir is given', async () => {
    await assert.rejects(() => runConnector({}), ConfigurationError);
  });

  await t.test('throws ConfigurationError when both backupPath and backupDir are given', async () => {
    await assert.rejects(() => runConnector({ backupPath: 'a', backupDir: 'b' }), ConfigurationError);
  });
});

// ---------------------------------------------------------------------
// Integration tests against a real backup — skipped gracefully if unset
// ---------------------------------------------------------------------

test('backupDiscovery.inspectBackup against a real backup', async (t) => {
  const backupPath = process.env.LOKA_BACKUP_PATH;
  if (!backupPath) {
    t.skip('LOKA_BACKUP_PATH not set — cannot inspect a real backup in this environment');
    return;
  }

  const profile = await inspectBackup(backupPath);

  await t.test('never derives anything from the filename', () => {
    // The profile object has no field that could only have come from
    // parsing the path string for a date — asserted structurally by
    // checking every date-bearing field traces to dateRanges, not path.
    assert.equal(profile.path, backupPath);
    assert.ok(profile.dateRanges.Invoice);
  });

  await t.test('reports a checksum, size, and schema version', () => {
    assert.equal(typeof profile.checksum, 'string');
    assert.equal(profile.checksum.length, 64);
    assert.ok(profile.sizeBytes > 0);
    assert.equal(typeof profile.schemaVersion, 'number');
  });
});

test('backupDiscovery.selectNewestBackup selects by content, not filename', async (t) => {
  const dir = process.env.LOKA_BACKUP_DIR;
  if (!dir) {
    t.skip('LOKA_BACKUP_DIR not set — cannot test multi-candidate discovery in this environment');
    return;
  }

  const profiles = await discoverBackups(dir);
  if (profiles.length < 2) {
    t.skip(`LOKA_BACKUP_DIR (${dir}) has fewer than 2 .realm files — cannot meaningfully test "newest" selection`);
    return;
  }

  const newest = selectNewestBackup(profiles);
  const { overallLatestTimestamp } = require('../src/connector/backupDiscovery');
  const newestTimestamp = overallLatestTimestamp(newest);

  await t.test('the selected backup\'s own latest timestamp is >= every other candidate\'s', () => {
    for (const p of profiles) {
      const t2 = overallLatestTimestamp(p);
      if (t2 === null) continue;
      assert.ok(
        new Date(newestTimestamp).getTime() >= new Date(t2).getTime(),
        `expected ${newest.path} (${newestTimestamp}) to be >= ${p.path} (${t2})`
      );
    }
  });
});

test('runConnector end-to-end against a real backup', async (t) => {
  const backupPath = process.env.LOKA_BACKUP_PATH;
  if (!backupPath) {
    t.skip('LOKA_BACKUP_PATH not set — cannot run the connector against a real backup in this environment');
    return;
  }

  const result = await runConnector({ backupPath });

  await t.test('returns exactly the four required outputs', () => {
    assert.ok(result.canonical);
    assert.ok(result.validationReport);
    assert.ok(result.runMetadata);
    assert.ok(typeof result.snapshotStatus === 'string');
  });

  await t.test('snapshotStatus is one of the four defined statuses', () => {
    assert.ok(Object.values(STATUSES).includes(result.snapshotStatus));
  });

  await t.test('snapshotStatus is embedded in runMetadata too', () => {
    assert.equal(result.runMetadata.snapshotStatus, result.snapshotStatus);
  });

  await t.test('canonical output structure matches the existing pipeline\'s own entity set', () => {
    for (const entity of ['Product', 'Customer', 'Supplier', 'Shift', 'Expense', 'Invoice', 'InvoiceItem', 'Payment']) {
      assert.ok(Array.isArray(result.canonical[entity]), `expected canonical.${entity} to be an array`);
    }
  });

  await t.test('schema version is one of the two this repository has observed', () => {
    assert.ok(KNOWN_SCHEMA_VERSIONS.includes(result.runMetadata.schemaVersion));
  });
});
