// Responsibility: run business validation against canonical objects and
// collect warnings. This module NEVER removes or alters a record — it only
// reports. A record that fails validation still appears in canonical.json;
// its problems appear in validation-report.json. Silently discarding a
// record would hide a real data problem, which is exactly the kind of
// silent failure this whole platform (per ADR-0003 §2) exists to prevent.
//
// Generic checks (duplicate IDs, empty required values, parse failures)
// used to hardcode the entity list separately from config.js and
// normalize.js. They now iterate the same central registry those two use,
// so a new entity is checked automatically without editing this file.
// Entity-specific checks (negative price, orphan references, etc.) live in
// each entity's own module and are invoked here generically too.

const registry = require('./registry/entityRegistry');
const { makeIssue } = require('./shared/issues');
const { ValidationError } = require('./shared/errors');

function checkDuplicateIds(canonical, issues) {
  for (const def of registry.topLevel()) {
    const seen = new Map();
    for (const record of canonical[def.name] || []) {
      const id = record.id;
      if (id === null || id === undefined) continue; // handled by empty-required check
      seen.set(id, (seen.get(id) || 0) + 1);
    }
    for (const [id, count] of seen.entries()) {
      if (count > 1) {
        issues.push(makeIssue(def.name, id, 'duplicate-id', `${def.name} id "${id}" appears ${count} times.`, 'error'));
      }
    }
  }
}

function checkEmptyRequiredValues(canonical, issues) {
  const requiredFieldsByEntity = registry.requiredFieldsByEntity();
  for (const [entity, fields] of Object.entries(requiredFieldsByEntity)) {
    for (const record of canonical[entity] || []) {
      for (const field of fields) {
        const value = record[field];
        if (value === null || value === undefined || value === '') {
          issues.push(
            makeIssue(
              entity,
              record.id ?? record.invoiceId ?? null,
              'empty-required-value',
              `required field "${field}" is empty.`,
              'error'
            )
          );
        }
      }
    }
  }
}

function checkInvalidDates(canonical, issues) {
  // Generic: any field ending in "ParseFailed" whose underlying field name
  // ends in a date-shaped hint is reported under the same rule the
  // original code used. In practice this overlaps with checkParseFailures
  // below; kept separate because "invalid-date" was a named requirement.
  for (const [entity, records] of Object.entries(canonical)) {
    for (const record of records) {
      for (const key of Object.keys(record)) {
        if (!key.endsWith('ParseFailed') || record[key] !== true) continue;
        const field = key.replace(/^_/, '').replace(/ParseFailed$/, '');
        if (/date|time/i.test(field)) {
          issues.push(
            makeIssue(entity, record.id ?? record.invoiceId ?? null, 'invalid-date', `${field} could not be parsed as a valid date.`, 'error')
          );
        }
      }
    }
  }
}

function checkParseFailures(canonical, issues) {
  // Any field that failed numeric or date parsing during normalization is
  // surfaced here too, so it isn't only visible as a buried "null" value
  // in canonical.json. Date-shaped failures are also reported by
  // checkInvalidDates above under a more specific rule name — both fire,
  // matching the original prototype's behavior exactly (it had the same
  // overlap, just with hand-written per-entity checks).
  for (const [entity, records] of Object.entries(canonical)) {
    for (const record of records) {
      for (const key of Object.keys(record)) {
        if (key.endsWith('ParseFailed') && record[key] === true) {
          const field = key.replace(/^_/, '').replace(/ParseFailed$/, '');
          issues.push(
            makeIssue(
              entity,
              record.id ?? record.invoiceId ?? null,
              'parse-failure',
              `field "${field}" had a value that could not be parsed to the expected type.`,
              'error'
            )
          );
        }
      }
    }
  }
}

function runEntitySpecificValidators(canonical, issues) {
  for (const def of registry.all()) {
    if (typeof def.validate !== 'function') continue;
    const records = canonical[def.name] || [];
    let entityIssues;
    try {
      entityIssues = def.validate(records, canonical);
    } catch (err) {
      throw new ValidationError(`Entity "${def.name}"'s validate() failed: ${err.message}`, {
        entity: def.name,
        cause: err.message,
      });
    }
    if (Array.isArray(entityIssues)) {
      issues.push(...entityIssues);
    }
  }
}

/**
 * Runs every validation rule against the canonical objects and returns a
 * validation report. Never mutates or removes records from `canonical`.
 */
function validate(canonical) {
  const issues = [];

  checkDuplicateIds(canonical, issues);
  checkInvalidDates(canonical, issues);
  checkParseFailures(canonical, issues);
  checkEmptyRequiredValues(canonical, issues);
  runEntitySpecificValidators(canonical, issues);

  const summary = {
    totalIssues: issues.length,
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    byRule: issues.reduce((acc, i) => {
      acc[i.rule] = (acc[i.rule] || 0) + 1;
      return acc;
    }, {}),
  };

  return { generatedAt: new Date().toISOString(), summary, issues };
}

module.exports = { validate };
