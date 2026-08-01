// Produces the exact JSON shape Buku Toko's own Code.gs already consumes
// (loka-YYYY-MM-DD.json, read by hitungRingkasLoka()/_olahLoka() in
// 08-ReportingService.gs of the enterprise-core-proposal, and by the
// equivalent code in the live production Code.gs).
//
// This is deliberately NOT the canonical normalize.js pipeline. Buku
// Toko's _olahLoka() reads raw Loka field names directly (grandTotal,
// profit, customer.name, items[].unitMultiplier, items[].category.text,
// Product.capitalPrice, etc.) — the same names Realm's own schema uses,
// not the renamed/reshaped canonical entity fields (e.g. normalize.js
// renames Invoice.profit -> invoiceProfit; this module must NOT do that).
//
// Verified empirically against a real backup and a real, already-produced
// loka-2026-07-31.json (the file the existing Windows Task Scheduler job
// wrote) on 2026-08-01: the existing pipeline dumps ALL 46 top-level
// (non-embedded) Realm collections verbatim via toJSON(), wrapped in
// { _sumber, _dikonversi, _catatan, data }. This module reproduces that
// shape exactly, adding one new field (_checksum) Buku Toko does not read
// and therefore cannot break — used by runBukuTokoSync.js to detect "no
// new data since last run" without needing separate state storage.

const Realm = require('realm');
const { checksumFile, toPlainObject } = require('../extract');

const CATATAN = 'Dikonversi otomatis dari backup Loka. Jangan diedit manual.';

/**
 * Opens a local .realm file read-only and dumps every top-level (i.e. not
 * `embedded: true`) collection to plain objects via toJSON(). Embedded
 * types (InvoiceItem, Category, etc.) are never queried directly — they
 * come along as nested data inside their owning top-level record, exactly
 * as Realm's own schema models them. This mirrors extract.js's existing,
 * already-proven toPlainObject() behavior; it does not reimplement it.
 *
 * @param {string} backupPath local path to a .realm file
 * @param {import('../shared/logger').Logger} [logger]
 * @returns {Promise<{ data: object, schemaVersion: number, entityNames: string[] }>}
 */
async function dumpAllTopLevelEntities(backupPath, logger) {
  const realm = await Realm.open({ path: backupPath, readOnly: true });
  try {
    const topLevelNames = realm.schema
      .filter((s) => !s.embedded)
      .map((s) => s.name)
      .sort();

    const data = {};
    for (const name of topLevelNames) {
      const collection = realm.objects(name);
      data[name] = collection.map(toPlainObject);
      if (logger) logger.debug(`dumped ${name}`, { count: data[name].length });
    }

    return { data, schemaVersion: realm.schemaVersion, entityNames: topLevelNames };
  } finally {
    realm.close();
  }
}

/**
 * Builds the final JSON object matching the existing loka-YYYY-MM-DD.json
 * shape exactly, byte-for-byte compatible with what Buku Toko already
 * reads today (verified against a real prior output, 2026-08-01).
 *
 * @param {object} params
 * @param {string} params.sourceFilename the .realm file's own name, exactly
 *   as it appeared in Drive (never trusted for dates — recorded as a label
 *   only, per implementation/loka-connector-v1-spec.md §2-3)
 * @param {string} params.sourceChecksum SHA-256 of the source .realm file
 * @param {object} params.data the { EntityName: [...] } object from
 *   dumpAllTopLevelEntities()
 * @param {string} [params.convertedAt] ISO timestamp; defaults to now
 */
function buildExportJson({ sourceFilename, sourceChecksum, data, convertedAt }) {
  return {
    _sumber: sourceFilename,
    _dikonversi: convertedAt || new Date().toISOString(),
    _catatan: CATATAN,
    _checksum: sourceChecksum,
    data,
  };
}

/**
 * Convenience: opens a local .realm file, dumps everything, and returns
 * the ready-to-write JSON object plus the fields the caller needs for
 * duplicate detection and audit logging (checksum, schema version).
 */
async function buildBukuTokoExport(backupPath, sourceFilename, logger) {
  const sourceChecksum = checksumFile(backupPath);
  const { data, schemaVersion, entityNames } = await dumpAllTopLevelEntities(backupPath, logger);
  const json = buildExportJson({ sourceFilename, sourceChecksum, data });
  return { json, sourceChecksum, schemaVersion, entityNames };
}

module.exports = { dumpAllTopLevelEntities, buildExportJson, buildBukuTokoExport };
