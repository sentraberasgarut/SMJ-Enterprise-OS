# Research — Loka `.realm` Ingestion: Cloud-Only Pipeline

**Status:** Research only. No code shipped, no ADR changed, no roadmap changed.
**Date:** 31 July 2026
**Scope:** Evaluate whether a Loka `.realm` backup, uploaded manually to Google Drive, can be processed entirely in the cloud — removing the Windows Task Scheduler dependency from the pipeline described in [`apps-script/buku-toko/SPEC.md`](../apps-script/buku-toko/SPEC.md) and [ADR-0003](../adr/0003-canonical-data-platform-loka-pos.md).

This document does not implement anything and does not commit the org to an architecture. It answers six research questions and proposes a v1 to experiment with, not to build.

---

# Goal

## The operational problem

The current pipeline depends on a specific Windows machine being on, logged in, and running Task Scheduler at the right time. If that machine is off, asleep, or its scheduled task silently fails, the whole chain from Loka POS to Apps Script stops — with no alert, because nothing downstream knows the upstream step didn't run. This is the same "silent divergence" failure class already flagged in ADR-0003 (§2), applied to a single point of hardware/OS dependency instead of a spreadsheet.

**Current pipeline:**

```
Loka
  ↓
Manual upload by Ayu
  ↓
Google Drive
  ↓
Windows Task Scheduler
  ↓
Realm → JSON
  ↓
Apps Script
```

**Target pipeline:**

```
Loka
  ↓
Manual upload
  ↓
Google Drive
  ↓
Cloud Ingestion
  ↓
Enterprise Operational Data Layer
  ↓
Apps Script / AI / Automation
```

The manual upload step stays — Ayu still uploads the `.realm` file to Drive by hand. What changes is everything after that: no machine has to be on, no OS-specific scheduler is involved, and the output feeds a shared data layer that more than one consumer (Apps Script, AI agents, other automation) can read from — consistent with the Canonical Data Platform and Consumer Isolation Principle already proposed in ADR-0003.

---

# Research Questions

## 1. Can Realm database files be parsed without Windows?

**Node.js — yes.** `realm-js`, the official JavaScript SDK, ships native bindings for Windows, macOS, **and Linux**, and is explicitly documented as usable server-side under plain Node.js (not just in mobile/Electron apps). This is the most direct path: a Linux container running Node.js can open a `.realm` file the same way a desktop app would.

**Python — no mature option.** MongoDB never shipped an official Python Realm SDK. The only Python-side project found (`GaryM02/Realm-Python-Library`) is explicitly early-stage, unpublished on PyPI, and not something to depend on for financial data.

**Linux — yes, indirectly.** Linux itself has no special blocker; the question is really "does *something* runnable on Linux understand the `.realm` format," and the answer is realm-js/Node.js. The underlying engine, `realm-core` (C++, Apache 2.0, open source), is what realm-js binds to — theoretically usable directly for a custom parser, but that is a from-scratch systems-programming effort, not a research-scale option.

**⚠️ Ecosystem risk found during research, not assumed going in:** MongoDB announced deprecation of Atlas Device Sync and the Realm SDKs in September 2024, with sync end-of-life on 30 September 2025. The **client-side open-source database itself continues to exist and work**, but is no longer maintained by MongoDB's own team going forward — maintenance is now community-dependent. This matters more than a typical "pick a library" choice: the entire premise of this research (parsing `.realm` files) now rests on a formerly-vendor-backed, now community-maintained open-source project.

## 2. Can parsing happen in Cloud Run, Railway, VPS, or GitHub Actions?

| Platform | Can it run Node.js + realm-js? | Limitation |
| --- | --- | --- |
| **Cloud Run (Jobs)** | Yes — 2nd-gen execution environment is documented as fully Linux-compatible, and jobs support up to 7 days of runtime (default task timeout 10 min, configurable). | Pay-per-invocation is good for infrequent triggers, but each cold start needs the native module rebuilt or bundled into the container image correctly for `linux-x64`/`linux-arm64` — a packaging detail, not a blocker. |
| **Railway** | Yes — it's effectively a managed VPS; anything that runs in a container runs there. | Billed continuously even when idle: an always-on 1 vCPU / 1 GB container runs roughly **$30/month** in 2026 pricing, regardless of whether a file ever arrives. Overkill for something that fires once a day. |
| **VPS** (DigitalOcean/Linode/Vultr-class) | Yes — full control, no platform restrictions. | Someone has to patch, monitor, and secure the OS. That's a maintenance burden this org doesn't currently carry anywhere else in the stack. Rough order of magnitude: **$5–6/month** for a small always-on instance, but this is an estimate, not a quote. |
| **GitHub Actions** | Yes — Ubuntu-hosted runners have Node.js preinstalled and can `npm install` native modules per run. | Ephemeral by design: no persistent state between runs, and it's built for triggered/scheduled jobs, not long-lived services. Standard hosted-runner jobs are capped at a fixed number of hours per run (multi-hour ceiling), which is irrelevant here since a single ingestion run should take seconds to minutes. |

**None of the four is blocked technically.** The real trade-off is cost-when-idle (Railway/VPS charge whether or not a file shows up) vs. statelessness (Cloud Run/GitHub Actions charge per run but can't hold long-running state between files).

## 3. What open-source libraries exist?

| Library | Maintenance | Maturity | Limitation |
| --- | --- | --- | --- |
| **realm-js** (Node.js) | Community-maintained post-2024 MongoDB deprecation; was actively developed for years before that. | High — the most mature option by far, years of production use in mobile apps. | No longer has a commercial vendor behind it; future compatibility with newer Realm file versions is not guaranteed. |
| **realm-core** (C++) | Same status — open source, Apache 2.0, community-maintained. | High as a library, but using it directly means writing custom bindings — effectively building your own SDK. | Not a "library you install," a foundation you'd build on. Out of proportion for this problem. |
| **Realm-Python-Library** (community) | Low — early-stage, unpublished package, single-maintainer-looking project. | Low. | Not viable to depend on for production financial data. |
| **Realm Studio** (GUI tool) | Maintained as a desktop app, not a library. | High as a manual inspection tool. | Not programmatic — useful only for a human to open a `.realm` file and look at it, e.g., during the recommended next experiment below. |

**Conclusion: realm-js is the only realistic choice.** It's also the same technology stack (JavaScript/Node.js) as the Apps Script layer already in this repo, which lowers the skill-transfer cost even though Apps Script and Node.js are not the same runtime.

## 4. Can the pipeline trigger automatically when a new file arrives in Google Drive?

Four mechanisms exist, each with a different trade-off:

- **Drive push notifications (webhook)** — `Drive.Files.watch()` / `changes.watch()` sends a POST to a public HTTPS endpoint when a watched file or folder changes. Most "real-time" option, but notification channels **expire and must be renewed periodically** — an unrenewed channel fails silently, which is exactly the kind of undetected-stoppage failure this whole research effort exists to eliminate. Needs its own always-listening endpoint (e.g., a small Cloud Run service) to receive the callback.
- **Polling** — periodically call `Drive.files.list()` and diff against what's already been processed. Simple, no public endpoint needed, but "real-time" only down to the polling interval.
- **Apps Script** — has no native "file added to Drive folder" installable trigger. In practice this means either (a) a time-driven trigger that polls on a schedule, or (b) manually wiring `Drive.Files.watch()` plus a `doPost()` web app to receive the callback — i.e., Apps Script alone doesn't give you push notifications for free, you still build the webhook receiver.
- **n8n** — has a dedicated Google Drive Trigger node that **polls every 1 minute by default** and already handles the "multiple files uploaded in the same interval" edge case. This org already uses n8n for lead-notification automation (per the active backlog), so this is the lowest-new-surface-area option.

**No mechanism here is instant and maintenance-free at the same time.** Push notifications are closer to instant but need renewal management; polling (via n8n, already adopted) is simpler and "good enough" for a pipeline that only needs to notice a file within a few minutes, not a few seconds — this is a daily POS backup, not a live feed.

## 5. What minimum metadata should the canonical layer contain?

Grounded in the fields Buku Toko's Apps Script app already tracks (`SPEC.md`) plus what any ingestion layer needs for traceability:

| Category | Minimum fields |
| --- | --- |
| **Provenance** | source file name, ingestion timestamp, connector used (`realm-v1`), checksum/hash of the source file (to detect duplicate or re-uploaded backups) |
| **Store / Unit** | which unit the data belongs to (TSS, CK, SJ1–5) |
| **Shift** | shift date, cashier, open/close time |
| **Cashier** | operator identity |
| **Transactions** | transaction ID, timestamp, line items, total |
| **Products** | SKU/name, category, quantity, unit price |
| **Payments** | method, amount, change given |
| **Stock** | opening quantity, closing quantity, adjustments |

The provenance fields are not optional extras — without them, a bad or duplicate ingestion run is indistinguishable from a good one, repeating the exact class of undetected error already found in the Buku Toko reconciliation sheet (ADR-0003 §2).

## 6. What are the biggest technical risks?

1. **The whole approach rests on an unsupported ecosystem.** Realm SDKs lost their commercial maintainer in 2025; if Loka POS ever updates its underlying Realm file format, there is no vendor obligation to keep community libraries compatible.
2. **No visibility into Loka's own roadmap.** Loka is a third-party app this org doesn't control; a Loka update could change the `.realm` schema with zero notice.
3. **Node.js is the only mature path — no language redundancy.** If realm-js breaks, there is no credible Python or other fallback today.
4. **Push-notification channels expire silently.** Any webhook-based trigger needs its own renewal monitoring, or it fails exactly the way the current Task Scheduler dependency fails — quietly.
5. **The manual upload step is still a human dependency.** Removing Windows Task Scheduler does not remove Ayu having to remember to upload the file — the single point of failure just moves one step earlier in the chain.
6. **Always-on options cost money whether or not a file arrives**; pay-per-run options (Cloud Run, GitHub Actions) avoid that but introduce cold-start/packaging complexity for the native module.

---

# Output — Recommended Architecture v1

**Trigger:** n8n Google Drive Trigger node (polling), watching the existing Drive folder Loka already exports to. Chosen over Drive push notifications because it reuses infrastructure already running in this org (n8n) and avoids the channel-renewal failure mode — a deliberate trade of latency (up to ~1 minute polling delay) for reliability.

**Processing:** GitHub Actions workflow, invoked via `repository_dispatch` from n8n, running a Node.js job with `realm-js` to open the `.realm` file and emit the canonical fields from Research Question 5. Chosen over Cloud Run/Railway/VPS because it fits inside the free tier at expected volume (one backup per day ≈ 30 runs/month, against a 2,000-minute/month free allowance) and keeps the automation inside the same GitHub-repo-as-authoritative-source model ADR-0003 already proposes — no new hosting account to secure or pay for.

**Estimated complexity:** **Medium.** No new infrastructure paradigm — GitHub Actions and n8n are both already in use in this org — but real new work: packaging `realm-js`'s native module correctly for the Actions Linux runner, defining and versioning the canonical schema, and wiring the n8n → GitHub Actions handoff.

**Estimated operating cost:** **Near $0/month** at current volume, since it stays inside GitHub Actions' free tier and n8n is already running. Cost only grows if the canonical data layer itself needs dedicated hosting (a database, an API) — which is a separate, unscoped decision.

**Major risks:** the six listed above apply directly; #1–#3 (unsupported ecosystem, no Loka roadmap visibility, no language fallback) are the ones a small pilot cannot mitigate and simply has to accept or reject going in.

**Recommended next experiment:** before writing any pipeline code, take one real Loka `.realm` backup and open it locally with realm-js (or Realm Studio, for a quick manual look) to confirm the actual internal table/object names match what this research assumed. This is the cheapest possible way to falsify the whole premise — if the file can't be opened, or the schema is nothing like a standard POS shape, everything above needs rethinking before a single line of pipeline code is written.

---

## Sources

- [realm/realm-js — GitHub](https://github.com/realm/realm-js)
- [realm - npm](https://www.npmjs.com/package/realm)
- [Realm-Python-Library — GitHub](https://github.com/GaryM02/Realm-Python-Library)
- [realm/realm-core — GitHub](https://github.com/realm/realm-core)
- [MongoDB Ends Mobile Support Today — Couchbase Blog](https://www.couchbase.com/blog/realm-mongodb-eol-day-2025/)
- [Realm is Now Atlas Device SDKs — MongoDB](https://www.mongodb.com/products/updates/realm-is-now-atlas-device-sdks/)
- [Notifications for resource changes — Google Drive API docs](https://developers.google.com/workspace/drive/api/guides/push)
- [How to Enable Push Notifications for File Changes in Google Drive with Apps Script](https://www.labnol.org/google-drive-push-notifications-230826)
- [Google Drive Trigger node documentation — n8n Docs](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.googledrivetrigger/)
- [Cloud Run Quotas and Limits — Google Cloud Docs](https://docs.cloud.google.com/run/quotas)
- [Set task timeout for jobs — Cloud Run Docs](https://docs.cloud.google.com/run/docs/configuring/task-timeout)
- [Railway Pricing Calculator (2026)](https://makerkit.dev/pricing-calculator/railway)
- [GitHub Actions Pricing 2026 — CICDCalculator.com](https://cicdcalculator.com/github-actions)
- [Pricing changes for GitHub Actions — GitHub](https://github.com/resources/insights/2026-pricing-changes-for-github-actions)
