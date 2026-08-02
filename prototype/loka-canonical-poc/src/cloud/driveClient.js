// Thin Google Drive API wrapper for the cloud Buku Toko sync connector.
//
// Scope, deliberately narrow: list files in a folder, list subfolders of a
// folder, download a file to a local path, read a file's text content, and
// create-or-replace a file by name in a folder. Nothing else.
//
// Auth supports two paths, tried in this order:
//
//   1. GDRIVE_SERVICE_ACCOUNT_KEY (a static JSON key, pasted whole into a
//      GitHub secret). Kept for local/manual testing convenience. NOT the
//      primary path in production — many Google Cloud orgs now disable
//      service-account key creation entirely via org policy (this org hit
//      exactly that wall), and a static key is a standing leak risk anyway.
//   2. Application Default Credentials (ADC) — no explicit credentials
//      object passed at all. In GitHub Actions this is populated by the
//      google-github-actions/auth action using Workload Identity
//      Federation: GitHub's own OIDC token is exchanged for short-lived
//      Google credentials at run time, with no key file ever created or
//      stored anywhere. This is the primary, recommended path — see
//      cloud/README.md for the full Workload Identity Federation setup.
//
// Either way, the identity used is a Google service account that must be
// explicitly granted access to the relevant Drive folder(s) by the folder
// owner (a Drive "Share" action, documented in cloud/README.md) — it has
// zero access to anything not explicitly shared with it.

const fs = require('fs');
const { google } = require('googleapis');

const DRIVE_SCOPE = ['https://www.googleapis.com/auth/drive'];
const FOLDER_MIME = 'application/vnd.google-apps.folder';

/**
 * Builds an authenticated Drive v3 client. Prefers a static
 * GDRIVE_SERVICE_ACCOUNT_KEY if present (local/manual testing); otherwise
 * falls back to Application Default Credentials, which is what a
 * Workload-Identity-Federated GitHub Actions run provides with no key file
 * involved at all.
 */
function driveFromEnv() {
  const raw = process.env.GDRIVE_SERVICE_ACCOUNT_KEY;
  let auth;
  if (raw) {
    let credentials;
    try {
      credentials = JSON.parse(raw);
    } catch (err) {
      throw new Error(`GDRIVE_SERVICE_ACCOUNT_KEY is set but is not valid JSON: ${err.message}`);
    }
    auth = new google.auth.GoogleAuth({ credentials, scopes: DRIVE_SCOPE });
  } else {
    // No explicit credentials — relies on Application Default Credentials.
    // google-github-actions/auth (Workload Identity Federation) populates
    // this automatically in CI; `gcloud auth application-default login`
    // populates it for a human running this locally.
    auth = new google.auth.GoogleAuth({ scopes: DRIVE_SCOPE });
  }
  return google.drive({ version: 'v3', auth });
}

/**
 * Whether Drive auth has any credential source available at all — used by
 * the orchestrator to decide between a real run and the graceful no-op
 * path, since ADC's absence only surfaces as an error once actually used,
 * not as a missing env var the way the static-key path does.
 */
function hasAnyCredentialSource() {
  return !!(
    process.env.GDRIVE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS // set by google-github-actions/auth when WIF succeeds
  );
}

/** Lists immediate (non-recursive) subfolders of a given Drive folder ID. */
async function listSubfolders(drive, folderId) {
  const files = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      pageToken,
      pageSize: 100,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

/**
 * Lists files directly inside a folder whose name ends with the given
 * (case-insensitive) suffix, e.g. '.realm'. Non-recursive by design — same
 * reasoning as backupDiscovery.js's listRealmFiles: no folder-structure
 * convention is assumed beyond "immediate children of a known folder ID".
 */
async function listFilesBySuffix(drive, folderId, suffix) {
  const files = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, modifiedTime, size)',
      pageToken,
      pageSize: 1000,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files.filter((f) => f.name.toLowerCase().endsWith(suffix.toLowerCase()));
}

/** Downloads a Drive file's binary content to a local path. */
async function downloadFile(drive, fileId, destPath) {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  await new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(destPath);
    res.data.on('error', reject);
    dest.on('error', reject);
    dest.on('finish', resolve);
    res.data.pipe(dest);
  });
}

/** Reads a small Drive file's content as a UTF-8 string (for reading the last-written JSON). */
async function readFileText(drive, fileId) {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
}

/**
 * Finds a file by exact name directly inside a folder. Returns null if not
 * found. Used both to locate "yesterday's JSON" (for checksum comparison)
 * and to decide create-vs-update when writing today's output.
 */
async function findFileByName(drive, folderId, name) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = '${name.replace(/'/g, "\\'")}' and trashed = false`,
    fields: 'files(id, name, modifiedTime)',
    pageSize: 10,
  });
  const files = res.data.files || [];
  return files.length ? files[0] : null;
}

/**
 * Lists files directly inside a folder, newest-modified first — used to
 * find "the most recently written JSON" without assuming its exact name.
 */
async function listFilesNewestFirst(drive, folderId, suffix) {
  const files = await listFilesBySuffix(drive, folderId, suffix);
  return files.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
}

/**
 * Creates a new file, or overwrites an existing one with the same name in
 * the same folder. Buku Toko's own hitungRingkasLoka() already tolerates
 * "today's file re-written" (it just re-parses whatever's there), so an
 * overwrite-on-rerun is safe and matches the existing manual workflow's
 * own behavior (the laptop task already overwrote same-day files on rerun).
 */
async function uploadOrReplaceJson(drive, folderId, filename, jsonString) {
  const media = { mimeType: 'application/json', body: jsonString };
  const existing = await findFileByName(drive, folderId, filename);
  if (existing) {
    await drive.files.update({ fileId: existing.id, media });
    return { id: existing.id, action: 'replaced' };
  }
  const created = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media,
    fields: 'id',
  });
  return { id: created.data.id, action: 'created' };
}

module.exports = {
  driveFromEnv,
  hasAnyCredentialSource,
  listSubfolders,
  listFilesBySuffix,
  listFilesNewestFirst,
  downloadFile,
  readFileText,
  findFileByName,
  uploadOrReplaceJson,
};
