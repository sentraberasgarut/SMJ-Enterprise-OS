// Shift entity definition.

const { parseNumeric, parseDate, parsedField, parsedOptionalField } = require('../shared/fieldParser');
const { provenance } = require('../shared/provenance');

module.exports = {
  name: 'Shift',
  isTopLevel: true,
  requiredFields: ['id', 'cashierId', 'cashierName', 'openTime', 'closeTime'],

  normalize(raw, meta) {
    return {
      id: raw.id ?? null,
      cashierId: raw.cashierId ?? null,
      cashierName: raw.cashierName ?? null,
      ...parsedField(raw, 'openTime', parseDate),
      ...parsedField(raw, 'closeTime', parseDate),
      ...parsedField(raw, 'initialCash', parseNumeric),
      ...parsedOptionalField(raw, 'actualCash', parseNumeric),
      cashDiff: raw.cashDiff ?? null, // already numeric in source
      cashInHand: raw.cashInHand ?? null, // already numeric in source
      _provenance: provenance(meta),
    };
  },

  validate() {
    return [];
  },
};
