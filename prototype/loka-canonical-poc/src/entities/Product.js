// Product entity definition. Registering a new entity means creating a
// file like this one and adding one line to entities/index.js — nothing
// else needs to change.

const { parseNumeric, parsedField } = require('../shared/fieldParser');
const { provenance } = require('../shared/provenance');
const { makeIssue } = require('../shared/issues');

module.exports = {
  name: 'Product',
  isTopLevel: true,
  requiredFields: ['id', 'name', 'price', 'capitalPrice'],

  normalize(raw, meta) {
    return {
      id: raw.id ?? null,
      name: raw.name ?? null,
      // Product.category is a denormalized snapshot, not a live link to the
      // ProductCategory master, per loka-schema-analysis.md's Relationships
      // section. Kept as-recorded here, exactly as the Canonical Data
      // Contract's Product entity specifies — not re-resolved against any
      // current category master.
      category: raw.category ?? null,
      ...parsedField(raw, 'price', parseNumeric),
      ...parsedField(raw, 'capitalPrice', parseNumeric),
      ...parsedField(raw, 'stock', parseNumeric),
      code: raw.code ?? null,
      // TODO: unit / unitGroup — Unit of Measure master data is UNKNOWN
      // (enterprise-data/master/uom/README.md); not normalized here.
      unit: raw.unit ?? null,
      _provenance: provenance(meta),
    };
  },

  validate(records) {
    const issues = [];
    for (const record of records) {
      if (typeof record.price === 'number' && record.price < 0) {
        issues.push(makeIssue('Product', record.id, 'negative-price', `price is negative (${record.price}).`, 'error'));
      }
      if (typeof record.capitalPrice === 'number' && record.capitalPrice < 0) {
        issues.push(makeIssue('Product', record.id, 'negative-price', `capitalPrice is negative (${record.capitalPrice}).`, 'error'));
      }
      if (typeof record.stock === 'number' && record.stock < 0) {
        issues.push(makeIssue('Product', record.id, 'negative-quantity', `stock is negative (${record.stock}).`, 'error'));
      }
    }
    return issues;
  },
};
