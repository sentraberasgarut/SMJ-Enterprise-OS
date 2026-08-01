// Central entity registry. This is what config.js, normalize.js, and
// validate.js used to each hardcode separately — now every one of them
// asks this module instead, so an entity added in src/entities/index.js
// is automatically known everywhere it needs to be.

const { definitions } = require('../entities');
const { ConfigurationError } = require('../shared/errors');

const byName = new Map();
for (const def of definitions) {
  if (!def || !def.name) {
    throw new ConfigurationError('An entity definition is missing a name.', { definition: def });
  }
  if (byName.has(def.name)) {
    throw new ConfigurationError(`Duplicate entity definition for "${def.name}".`, { name: def.name });
  }
  byName.set(def.name, def);
}

function all() {
  return [...byName.values()];
}

function topLevel() {
  return all().filter((def) => def.isTopLevel);
}

function derived() {
  return all().filter((def) => !def.isTopLevel);
}

function get(name) {
  const def = byName.get(name);
  if (!def) {
    throw new ConfigurationError(`No entity is registered under the name "${name}".`, { name });
  }
  return def;
}

function names() {
  return all().map((def) => def.name);
}

function requiredFieldsByEntity() {
  const map = {};
  for (const def of all()) {
    map[def.name] = def.requiredFields || [];
  }
  return map;
}

module.exports = { all, topLevel, derived, get, names, requiredFieldsByEntity };
