# Cloud Buku Toko Sync

**Status:** Code complete, verified against real data locally, **not yet run in the cloud**. The Drive API calls (list/download/upload) cannot be tested from this environment — there are no live credentials available here. Manual setup (below) and a first real `workflow_dispatch` run are required before this is trustworthy.

## What this replaces

Today, `loka-YYYY-MM-DD.json` — the file Buku Toko's `hitungRingkasLoka()` reads every day at 20:00 WIB — is produced by a Windows Task Scheduler job on a specific laptop. Per `research/loka-ingestion-poc.md` and `adr/0004-technology-constitution-and-investment-principles.md` (Principle 4, "Laptop Independence"), this is a named, standing risk: if that machine is off, asleep, or its scheduled task silently fails, Buku Toko's Loka data goes stale with **no alert to anyone** — nobody downstream knows the upstream step didn't run.

This connector moves that conversion step into a scheduled GitHub Actions workflow (`.github/workflows/loka-buku-toko-sync.yml`), so it no longer depends on any specific machine being on.

**What does NOT change:** the manual upload step. Someone still has to get the `.realm` backup from Loka into the Drive "Loka Kasir" folder — that is a human/Loka-app step this connector does not touch.

## Auth: Workload Identity Federation (no key file needed)

This connector uses **Workload Identity Federation** instead of a static service account key. When GitHub Actions runs:

1. GitHub generates a short-lived OIDC token proving "this is a run from `sentraberasgarut/SMJ-Enterprise-OS`."
2. Google exchanges that token for a short-lived Google credential (valid only for this one run).
3. `googleapis` picks up that credential automatically via Application Default Credentials.

No key file is ever created. No static secret can leak or be revoked via org policy. The org-policy restriction that blocks key creation doesn't apply here.

## How the output was verified without a live cloud run

On 2026-08-01, against a real backup and a real, already-produced `loka-2026-07-31.json`:

- `bukuTokoRawExport.js` was run directly against the real `.realm` file and its output was diffed key-by-key against the real prior JSON — all 46 top-level entity names matched exactly, `Invoice`'s field set matched exactly, and `Invoice.date`'s type (a numeric-looking **string**) matched exactly.
- The newest-backup-selection logic (`backupDiscovery.js`) was run against all 10 real `.realm` files across both `Juli` and `Agustus` folders and correctly selected the true newest by internal data content, not filename.

**What is NOT verified:** the Drive API calls themselves (`driveClient.js` — list, download, upload). This requires live credentials, which don't exist until setup below is complete. The first `workflow_dispatch` run is the real test of that part.

## Manual setup (must be done by a human)

### Step 1: Google Cloud — project and service account

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project (free tier, no billing required for Drive API at this volume).
2. Enable the **Google Drive API**: APIs & Services → Enable APIs → search "Google Drive API" → Enable.
3. Create a **Service Account**: IAM & Admin → Service Accounts → Create Service Account.
   - Give it any name (e.g., `loka-buku-toko-sync`).
   - **No project-level role is needed** — access is granted per-folder in Drive (step 2 below).
4. Note the service account's **email address** (looks like `name@project-id.iam.gserviceaccount.com`).
5. Note the project's **project number** (not project ID): IAM & Admin → Settings → Project number.

### Step 2: Share the Drive folder with the service account

1. In Google Drive, find the **"Loka Kasir"** folder.
2. Share it with the service account's email address, with **Editor** access. Editor is required because this job writes into the `JSON` subfolder — Drive permissions cascade to subfolders.
3. Get the folder's ID from its URL: `https://drive.google.com/drive/folders/`**`<this part>`**.

### Step 3: Create a Workload Identity Pool and Provider

In Google Cloud Console → IAM & Admin → **Workload Identity Federation**:

1. Click **Create Pool**.
   - Name: `github-actions` (or any name).
   - Note the **Pool ID** (the auto-generated ID, not the display name).

2. In the pool, click **Add Provider** → Select **OpenID Connect (OIDC)**.
   - Provider name: `github` (or any name).
   - Issuer URL: `https://token.actions.githubusercontent.com`
   - Note the **Provider ID**.

3. Under **Attribute Mapping**, add:
   | Google attribute | OIDC claim |
   |---|---|
   | `google.subject` | `assertion.sub` |
   | `attribute.repository` | `assertion.repository` |

4. Under **Attribute Conditions**, add:
   ```
   assertion.repository == "sentraberasgarut/SMJ-Enterprise-OS"
   ```
   This locks the credential to this specific repo only.

5. Click Save. The **full provider path** is shown on the pool's detail page — it looks like:
   ```
   projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID
   ```
   Copy this — you need it in step 4.

### Step 4: Grant the service account permission to be impersonated

Still in the Workload Identity Federation pool detail page:

1. Click **Grant Access**.
2. Select your service account.
3. Under **Select principals**, choose "Only identities matching the filter" and use:
   - Attribute: `repository`
   - Value: `sentraberasgarut/SMJ-Enterprise-OS`
4. Save.

This grants the GitHub Actions run the ability to impersonate the service account — but only when running from this specific repository.

### Step 5: Add GitHub repository configuration

Go to this repo → Settings → Secrets and variables → Actions.

**Variables** (not sensitive — visible in the UI, fine to be non-secret):

| Variable name | Value |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | The full provider path from step 3.5 |
| `GCP_SERVICE_ACCOUNT_EMAIL` | The service account email from step 1.4 |

**Secrets** (sensitive — Drive folder ID):

| Secret name | Value |
|---|---|
| `LOKA_KASIR_FOLDER_ID` | The folder ID from step 2.3 |

### Step 6: Verify failure visibility

GitHub already emails repository watchers when a scheduled workflow run fails — confirm this is on: GitHub profile picture → Settings → Notifications → Actions → ensure failed-workflow emails aren't disabled. This is the one thing that makes this migration actually solve the problem it was built to solve.

### Step 7: Test before trusting

1. Go to repo → Actions → "Sync Loka -> Buku Toko (cloud)" → **Run workflow** (manual trigger).
2. Check the log for a clean `Done.` line.
3. Verify `loka-2026-MM-DD.json` actually appears in the Drive `JSON` folder.

**Recommendation: keep the laptop Task Scheduler running in parallel for a few days** after the first successful cloud run. If they ever disagree on the same day, that's worth knowing before the laptop job is turned off.

## Configuration reference

| Name | Type | Required | Purpose |
|---|---|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Repository variable | Yes | Full WIF provider path |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Repository variable | Yes | Service account email |
| `LOKA_KASIR_FOLDER_ID` | Repository secret | Yes | Drive folder ID of "Loka Kasir" |
| `LOKA_JSON_SUBFOLDER_NAME` | Environment variable | No (default `JSON`) | Name of output subfolder to auto-discover |
| `LOKA_JSON_FOLDER_ID` | Environment variable | No | Explicit output folder ID — skips the by-name lookup |
| `GDRIVE_SERVICE_ACCOUNT_KEY` | Environment variable | No | Static key fallback for local manual testing only |

If neither WIF credentials nor `GDRIVE_SERVICE_ACCOUNT_KEY` are available, or if `LOKA_KASIR_FOLDER_ID` is missing, the job logs a warning and exits successfully as a no-op — safe to merge before GCP setup is done.

## Files in this directory

- `driveClient.js` — Drive API v3 wrapper (WIF/ADC auth, list, download, upload).
- `bukuTokoRawExport.js` — dumps every top-level Realm collection to the exact JSON shape Buku Toko already reads.
- `runBukuTokoSync.js` — orchestrator. `npm run sync:buku-toko` from `prototype/loka-canonical-poc/`.

## What this does not do

- Does not touch, deploy, or modify Buku Toko's `Code.gs`.
- Does not replace the separate canonical `normalize.js`/`validate.js` pipeline.
- Does not resolve open questions about the daily JSON export format (Implementation Backlog BL-007).
