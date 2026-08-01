// Cloud Buku Toko sync — replaces the Windows Task Scheduler laptop job.
//
// What it does, end to end, once per run:
//   1. Find every .realm backup candidate in the Drive "Loka Kasir" folder
//      (its immediate subfolders, e.g. Juli/Agustus, plus its own root).
//   2. Download each candidate, inspect its actual data content (never its
//      filename — see backupDiscovery.js's own header comment; filenames
//      in this folder are directly confirmed unreliable, including one
//      instance of five different files all claiming the same date).
//   3. Pick the one with the latest real business data inside it.
//   4. Skip the rest of the run if that backup is the same one already
//      synced last time (checksum match) — nothing new to publish.
//   5. Dump it to the exact JSON shape Buku Toko already reads (see
//      bukuTokoRawExport.js), and write it to the Drive "JSON" folder as
//      loka-<today, Asia/Jakarta>.json — overwriting today's file if this
//      is a rerun, exactly like the laptop job already did.
//
// Buku Toko's own Code.gs needs ZERO changes for this to work — it already
// reads "the newest loka-*.json file in that Drive folder" on its own
// schedule (hitungRingkasLoka(), triggered daily at 20:00 WIB). This job
// only needs to finish before that trigger fires.
//
// Every failure below throws and the process exits non-zero, so a failed
// GitHub Actions run is a red X and (per repo notification settings) an
// email — never a silent no-op. This is the exact failure mode ADR-0004
// principle 4 (Laptop Independence) named: "Windows Task Scheduler ...
// fails silently — nobody downstream knows it didn't run." A cloud run
// that also fails silently would not actually fix the problem.

const fs = require('fs');
const os = require('os');
const path = require('path');
const Realm = require('realm');
const { Logger } = require('../shared/logger');
const { ConfigurationError, ExtractionError } = require('../shared/errors');
const { inspectBackup, selectNewestBackup, findDuplicateGroups } = require('../connector/backupDiscovery');
const { buildBukuTokoExport } = require('./bukuTokoRawExport');
const drive = require('./driveClient');

const REALM_SUFFIX = '.realm';
const JSON_SUFFIX = '.json';
const JSON_SUBFOLDER_NAME = process.env.LOKA_JSON_SUBFOLDER_NAME || 'JSON';
const JAKARTA_TZ = 'Asia/Jakarta';

/** YYYY-MM-DD for "now", in Asia/Jakarta — matches the existing loka-YYYY-MM-DD.json naming convention (named by run date, not by the data's own date; verified against a real prior output). */
function todayJakarta() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Downloads every .realm file found under folderId's immediate subfolders + folderId's own root, into tmpDir. Returns [{localPath, driveId, driveName, driveFolder}]. */
async function downloadAllRealmCandidates(driveClient, kasirFolderId, tmpDir, logger) {
  const searchFolders = [{ id: kasirFolderId, label: '(root)' }];
  const subfolders = await drive.listSubfolders(driveClient, kasirFolderId);
  for (const sf of subfolders) searchFolders.push({ id: sf.id, label: sf.name });

  const downloaded = [];
  for (const folder of searchFolders) {
    const files = await drive.listFilesBySuffix(driveClient, folder.id, REALM_SUFFIX);
    for (const file of files) {
      const localPath = path.join(tmpDir, `${file.id}.realm`);
      await drive.downloadFile(driveClient, file.id, localPath);
      downloaded.push({ localPath, driveId: file.id, driveName: file.name, driveFolder: folder.label });
      logger.debug('downloaded backup candidate', { name: file.name, folder: folder.label });
    }
  }
  return downloaded;
}

async function main() {
  const logger = new Logger();
  logger.info('Buku Toko Loka sync starting');

  const kasirFolderId = process.env.LOKA_KASIR_FOLDER_ID;
  const hasCredentials = drive.hasAnyCredentialSource();
  if (!kasirFolderId || !hasCredentials) {
    logger.warn(
      'Missing configuration (no credential source found and/or LOKA_KASIR_FOLDER_ID not set). ' +
        'Running as a no-op dry-run — see src/cloud/README.md for Workload Identity Federation setup.',
      { hasCredentials, hasKasirFolderId: !!kasirFolderId }
    );
    return;
  }

  const driveClient = drive.driveFromEnv();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loka-sync-'));

  try {
    logger.info('1/5 Discover backup candidates', { kasirFolderId });
    const candidates = await downloadAllRealmCandidates(driveClient, kasirFolderId, tmpDir, logger);
    if (!candidates.length) {
      throw new ExtractionError(
        'No .realm files found anywhere under the configured Loka Kasir Drive folder. ' +
          'Aborting without writing anything — the prior output in the JSON folder remains current.'
      );
    }
    logger.info(`   found ${candidates.length} candidate(s)`);

    logger.info('2/5 Inspect candidates by content (never by filename)');
    const profiles = [];
    for (const c of candidates) {
      const profile = await inspectBackup(c.localPath);
      profiles.push({ ...profile, driveName: c.driveName, driveFolder: c.driveFolder });
    }
    const duplicateGroups = findDuplicateGroups(profiles);
    if (duplicateGroups.length) {
      logger.warn(`   ${duplicateGroups.length} duplicate-content group(s) found among candidates`, {
        groups: duplicateGroups.map((g) => g.map((p) => p.driveName)),
      });
    }

    const newest = selectNewestBackup(profiles);
    logger.info('   newest backup selected', {
      driveName: newest.driveName,
      driveFolder: newest.driveFolder,
      schemaVersion: newest.schemaVersion,
      checksum: newest.checksum,
    });

    logger.info('3/5 Check whether this backup was already synced');
    const jsonFolder = await resolveJsonFolder(driveClient, kasirFolderId, logger);
    const existingJsonFiles = await drive.listFilesNewestFirst(driveClient, jsonFolder.id, JSON_SUFFIX);
    if (existingJsonFiles.length) {
      const latest = existingJsonFiles[0];
      const text = await drive.readFileText(driveClient, latest.id);
      let lastChecksum = null;
      try {
        lastChecksum = JSON.parse(text)._checksum || null;
      } catch (err) {
        logger.warn('   could not parse the most recent JSON output to compare checksums', {
          file: latest.name,
          error: err.message,
        });
      }
      if (lastChecksum && lastChecksum === newest.checksum) {
        logger.info('   no new data — selected backup matches the last synced checksum. Nothing to do.', {
          lastFile: latest.name,
        });
        return;
      }
    }

    logger.info('4/5 Extract and build export JSON');
    const selectedCandidate = candidates.find((c) => c.localPath === newest.path);
    const { json, schemaVersion } = await buildBukuTokoExport(
      selectedCandidate.localPath,
      selectedCandidate.driveName,
      logger
    );
    const entityCount = Object.keys(json.data).length;
    logger.info(`   dumped ${entityCount} entities (schema version ${schemaVersion})`, {
      invoiceCount: (json.data.Invoice || []).length,
      productCount: (json.data.Product || []).length,
    });

    logger.info('5/5 Upload to Drive JSON folder');
    const filename = `loka-${todayJakarta()}.json`;
    const result = await drive.uploadOrReplaceJson(driveClient, jsonFolder.id, filename, JSON.stringify(json));
    logger.info(`   ${result.action} ${filename}`, { fileId: result.id });

    logger.runSummary({
      entityCounts: { candidatesInspected: profiles.length },
      canonicalCounts: { entitiesDumped: entityCount },
      validationSummary: { duplicateGroups: duplicateGroups.length },
      exportSummary: { filename, action: result.action, sourceBackup: newest.driveName },
    });
    logger.info('Done. Buku Toko needs no changes — it already reads the newest loka-*.json in this folder.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Resolves the "JSON" subfolder under the Kasir folder. Honors an explicit
 * LOKA_JSON_FOLDER_ID override (skips the lookup) so a differently-named
 * or differently-located output folder can be configured without a code
 * change — otherwise looks up a subfolder literally named "JSON" (or
 * LOKA_JSON_SUBFOLDER_NAME), matching the folder structure already
 * confirmed present today.
 */
async function resolveJsonFolder(driveClient, kasirFolderId, logger) {
  const override = process.env.LOKA_JSON_FOLDER_ID;
  if (override) return { id: override, name: '(configured override)' };

  const subfolders = await drive.listSubfolders(driveClient, kasirFolderId);
  const match = subfolders.find((f) => f.name === JSON_SUBFOLDER_NAME);
  if (!match) {
    throw new ConfigurationError(
      `No subfolder named "${JSON_SUBFOLDER_NAME}" found directly under the configured Loka Kasir folder. ` +
        'Set LOKA_JSON_FOLDER_ID explicitly to skip this lookup, or check the folder structure.'
    );
  }
  logger.debug('resolved JSON output folder', match);
  return match;
}

main()
  .catch((err) => {
    const logger = new Logger();
    logger.error(`Sync failed: ${err.message}`, { type: err.name || 'Error', details: err.details, stack: err.stack });
    process.exitCode = 1;
  })
  .finally(() => {
    Realm.shutdown();
  });

module.exports = { todayJakarta, downloadAllRealmCandidates, resolveJsonFolder };
