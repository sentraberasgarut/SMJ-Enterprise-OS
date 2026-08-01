// Backup discovery for the Loka Connector, per
// implementation/loka-connector-v1-spec.md §3.
//
// Core rule, stated once: the backup's filename is NEVER trusted for any
// decision made here. "Newest" is determined by opening each candidate file
// and comparing the actual data it contains, not by parsing a date out of
// its name. This directly supports manually-renamed backups (per the
// operator's own confirmed renaming of a prior backup) without any special
// casing — a renamed file is inspected exactly like any other.
//
// This module opens its own, independent, read-only Realm handle per file
// it inspects. It does NOT reuse extract.js's own Realm.open() call and
// does NOT add InvoiceDebt (or anything else) to the canonical entity
// registry — per the spec's explicit instruction not to change canonical
// mapping, InvoiceDebt is read here only for discovery/classification
// purposes, never normalized or exported as a canonical entity.

const fs = require('fs');
const path = require('path');
const Realm = require('realm');
const { checksumFile } = require('../extract');
const { parseDate } = require('../shared/fieldParser');

const DATE_ENTITIES = {
  Invoice: 'date',
  Expense: 'date',
  InvoiceDebt: 'date',
};

const SHIFT_TIME_FIELDS = ['openTime', 'closeTime'];

const COUNT_ENTITIES = ['Invoice', 'Shift', 'Expense', 'Customer', 'Supplier', 'Product', 'InvoiceDebt'];

/**
 * Lists candidate backup files in a directory. Non-recursive by design —
 * per the spec, a stable month-subfolder convention is not confirmed, so
 * this does not assume or search any particular subfolder structure.
 * Filters to `.realm` only; Realm's own sidecar files (`.realm.lock`,
 * `.realm.management`) are never treated as candidates.
 */
function listRealmFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.realm'))
    .map((name) => path.join(dir, name));
}

function rangeFromDates(rawValues) {
  let min = null;
  let max = null;
  let unparseable = 0;
  for (const raw of rawValues) {
    const parsed = parseDate(raw);
    if (!parsed.valid) {
      if (raw !== null && raw !== undefined && raw !== '') unparseable++;
      continue;
    }
    if (parsed.value === null) continue; // genuinely absent, not a parse failure
    const ms = new Date(parsed.value).getTime();
    if (min === null || ms < min) min = ms;
    if (max === null || ms > max) max = ms;
  }
  return {
    min: min === null ? null : new Date(min).toISOString(),
    max: max === null ? null : new Date(max).toISOString(),
    unparseable,
  };
}

/**
 * Opens one backup read-only, gathers everything backup discovery,
 * pre-flight validation, and snapshot classification need, then closes it.
 * Never mutates the file. Never derives anything from its filename.
 *
 * @param {string} filePath
 * @returns {Promise<object>} a backup profile
 */
async function inspectBackup(filePath) {
  const stat = fs.statSync(filePath);
  const checksum = checksumFile(filePath);

  let realm;
  try {
    realm = await Realm.open({ path: filePath, readOnly: true });
  } catch (err) {
    throw new Error(`Failed to open backup for inspection: ${err.message}`);
  }

  const schemaNames = new Set(realm.schema.map((s) => s.name));

  const entityCounts = {};
  for (const name of COUNT_ENTITIES) {
    entityCounts[name] = schemaNames.has(name) ? realm.objects(name).length : null;
  }

  const dateRanges = {};
  let unparseableDateFieldCount = 0;
  for (const [entityName, field] of Object.entries(DATE_ENTITIES)) {
    if (!schemaNames.has(entityName)) {
      dateRanges[entityName] = { min: null, max: null, unparseable: 0, present: false };
      continue;
    }
    const raw = realm.objects(entityName).map((r) => r[field]);
    const range = rangeFromDates(raw);
    dateRanges[entityName] = { ...range, present: true };
    unparseableDateFieldCount += range.unparseable;
  }

  let shiftsWithUnresolvedCloseTime = 0;
  if (schemaNames.has('Shift')) {
    for (const field of SHIFT_TIME_FIELDS) {
      const raw = schemaNames.has('Shift') ? realm.objects('Shift').map((r) => r[field]) : [];
      const range = rangeFromDates(raw);
      dateRanges[`Shift.${field}`] = { ...range, present: true };
      unparseableDateFieldCount += range.unparseable;
    }
    for (const shift of realm.objects('Shift')) {
      const parsed = parseDate(shift.closeTime);
      // Absent or unparseable closeTime is the signal an in-progress shift
      // would produce — see snapshotClassifier.js. Nothing in the data this
      // connector has directly examined has ever exhibited this (see the
      // spec's own MID_SHIFT caveat); this check exists for when it does.
      if (!parsed.valid || parsed.value === null) shiftsWithUnresolvedCloseTime++;
    }
  } else {
    dateRanges['Shift.openTime'] = { min: null, max: null, unparseable: 0, present: false };
    dateRanges['Shift.closeTime'] = { min: null, max: null, unparseable: 0, present: false };
  }

  const schemaVersion = realm.schemaVersion;
  realm.close();

  const now = Date.now();
  let futureDateFieldCount = 0;
  for (const range of Object.values(dateRanges)) {
    if (range.max && new Date(range.max).getTime() > now) futureDateFieldCount++;
  }

  return {
    path: filePath,
    sizeBytes: stat.size,
    checksum,
    schemaVersion,
    entityCounts,
    dateRanges,
    shiftsWithUnresolvedCloseTime,
    unparseableDateFieldCount,
    futureDateFieldCount,
    inspectedAt: new Date().toISOString(),
  };
}

/**
 * The single timestamp used to compare "which backup is newest" — the
 * latest of Invoice, Expense, InvoiceDebt, and Shift.closeTime, per the
 * spec's stated technique. Returns null if the profile has no usable date
 * at all (never assumed to be "oldest" by default — callers must handle
 * null explicitly rather than have it silently sort last).
 */
function overallLatestTimestamp(profile) {
  const candidates = [
    profile.dateRanges.Invoice && profile.dateRanges.Invoice.max,
    profile.dateRanges.Expense && profile.dateRanges.Expense.max,
    profile.dateRanges.InvoiceDebt && profile.dateRanges.InvoiceDebt.max,
    profile.dateRanges['Shift.closeTime'] && profile.dateRanges['Shift.closeTime'].max,
  ].filter(Boolean);
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, iso) => (new Date(iso).getTime() > new Date(latest).getTime() ? iso : latest));
}

/**
 * Given already-inspected backup profiles, returns the newest one by
 * content — never by filename. Throws if none of the profiles has any
 * usable date at all, rather than guessing.
 */
function selectNewestBackup(profiles) {
  const withTimestamp = profiles
    .map((p) => ({ profile: p, latest: overallLatestTimestamp(p) }))
    .filter((x) => x.latest !== null);
  if (withTimestamp.length === 0) {
    throw new Error('Cannot select a newest backup: none of the candidates has a usable date in Invoice, Expense, InvoiceDebt, or Shift.closeTime.');
  }
  withTimestamp.sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());
  return withTimestamp[0].profile;
}

/**
 * Groups already-inspected profiles by checksum. Any group with more than
 * one member is a set of duplicate backups (same content, regardless of
 * filename or location) — per the spec, the same file under two names, or
 * copied to two locations, is one backup, not two.
 */
function findDuplicateGroups(profiles) {
  const byChecksum = new Map();
  for (const p of profiles) {
    if (!byChecksum.has(p.checksum)) byChecksum.set(p.checksum, []);
    byChecksum.get(p.checksum).push(p);
  }
  return [...byChecksum.values()].filter((group) => group.length > 1);
}

/**
 * Convenience: list candidates in a directory, inspect every one, and
 * return their profiles. Does not select a newest or resolve duplicates —
 * callers (connector.js) decide what to do with the full set.
 */
async function discoverBackups(dir) {
  const files = listRealmFiles(dir);
  const profiles = [];
  for (const file of files) {
    profiles.push(await inspectBackup(file));
  }
  return profiles;
}

module.exports = {
  listRealmFiles,
  inspectBackup,
  overallLatestTimestamp,
  selectNewestBackup,
  findDuplicateGroups,
  discoverBackups,
};
