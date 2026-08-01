// Expense entity definition.

const { parseDate, parsedField } = require('../shared/fieldParser');
const { provenance } = require('../shared/provenance');

module.exports = {
  name: 'Expense',
  isTopLevel: true,
  requiredFields: ['id', 'name', 'date'],

  normalize(raw, meta) {
    return {
      id: raw.id ?? null,
      name: raw.name ?? null,
      note: raw.note ?? null,
      ...parsedField(raw, 'date', parseDate),
      paymentMethodId: raw.paymentMethodId ?? null,
      paymentMethodName: raw.paymentMethodName ?? null,
      // ExpenseItem line items are kept nested, unflattened — this
      // prototype's scope names Expense, not a separate ExpenseItem
      // canonical entity.
      items: Array.isArray(raw.items) ? raw.items : [],
      _provenance: provenance(meta),
    };
  },

  validate() {
    return [];
  },
};
