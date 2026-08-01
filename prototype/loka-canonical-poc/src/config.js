// Configuration only. No business logic lives in this file.
//
// Entity lists (which entities exist, which are top-level, which fields
// are required) used to be hardcoded here AND in normalize.js AND in
// validate.js — three places to edit for one new entity. They now come
// from the entity registry (src/registry/entityRegistry.js), which reads
// src/entities/index.js. This file only decides where the backup lives,
// where output goes, and what identifies this connector's version.

const path = require('path');
const registry = require('./registry/entityRegistry');

// This prototype deliberately does not hardcode any real backup path.
// Per the Data Governance Framework's classification rules, a real Loka
// backup contains Personal and Financial-classified data and should not be
// casually copied into or embedded in code. Set LOKA_BACKUP_PATH to point
// at a real .realm file before running this prototype.
const BACKUP_PATH = process.env.LOKA_BACKUP_PATH || null;

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Derived from the registry — the genuine top-level Realm collections this
// prototype reads directly. InvoiceItem and Payment are NOT separate
// top-level tables in Loka's own schema — per research/loka-schema-analysis.md,
// both are embedded inside Invoice. They are derived in their own entity
// module, never queried directly here. Attempting realm.objects() on an
// embedded type throws ("You cannot query an embedded object.") — confirmed
// directly during the research this prototype builds on.
const TOP_LEVEL_ENTITIES = registry.topLevel().map((def) => def.name);

// Every canonical entity this prototype produces (top-level + derived).
// Everything else in Loka's 71-object-type schema is explicitly out of
// scope for this prototype (TODO, not normalized).
const CANONICAL_ENTITIES = registry.names();

// Fields treated as "required" for the Empty Required Value validation.
// This list is NOT invented — it reflects fields Loka's own Realm schema
// marks non-optional, as observed directly during research/loka-schema-analysis.md.
// TODO: re-verify against a fresh schema dump before relying on this in
// production. Loka's schema has already drifted once (v105 -> v109) between
// backups collected days apart, per loka-ingestion-poc.md — this list could
// go stale the same way; schema-drift detection below is the first line of
// defense, not a substitute for re-verifying this list directly.
const REQUIRED_FIELDS = registry.requiredFieldsByEntity();

// Connector identity attached to every canonical record's provenance block,
// per the minimum-metadata findings in research/loka-ingestion-poc.md and
// the Provenance rule in the Data Governance Framework (§7).
const CONNECTOR_VERSION = 'loka-canonical-poc-0.2.0';

// Schema-version drift detection. This is the last-known-good Realm schema
// version, confirmed directly against the real backup this prototype has
// been built and verified against (see research/loka-schema-analysis.md
// and this project's own regression fixtures). A future backup reporting a
// different schemaVersion does not necessarily mean anything is wrong — it
// means this prototype's assumptions (REQUIRED_FIELDS above, in particular)
// have not been re-verified against it yet.
const LAST_KNOWN_GOOD_SCHEMA_VERSION = 109;

// Whether schema drift blocks the run (throws SchemaDriftError) or only
// logs a warning. Defaults to warning-only: this refactor is not meant to
// change what the pipeline does with the one backup it has been verified
// against, only to make drift visible instead of silent.
const SCHEMA_DRIFT_POLICY = process.env.SCHEMA_DRIFT_POLICY || 'warn'; // 'warn' | 'fail'

module.exports = {
  BACKUP_PATH,
  OUTPUT_DIR,
  TOP_LEVEL_ENTITIES,
  CANONICAL_ENTITIES,
  REQUIRED_FIELDS,
  CONNECTOR_VERSION,
  LAST_KNOWN_GOOD_SCHEMA_VERSION,
  SCHEMA_DRIFT_POLICY,
};
