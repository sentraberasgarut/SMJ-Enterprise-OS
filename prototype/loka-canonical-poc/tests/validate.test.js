// Formalizes the synthetic bad-data checks originally run ad hoc (via a
// throwaway `node -e` script) during this prototype's initial
// verification. Same fixtures, same expected rules — now a permanent,
// repeatable test instead of a one-off terminal session.

const test = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('../src/validate');

test('validate() catches all required categories against deliberately bad data', async (t) => {
  const canonical = {
    Product: [
      { id: 'p1', name: 'Good', price: 100, capitalPrice: 80, stock: 5 },
      { id: 'p1', name: 'Dup', price: -50, capitalPrice: 80, stock: -3 }, // duplicate id, negative price, negative stock
      { id: '', name: '', price: 10, capitalPrice: 5, stock: 1 }, // empty required id/name
    ],
    Customer: [{ id: 'c1', name: 'Cust', phoneNumber: '08123' }],
    Supplier: [],
    Shift: [
      {
        id: 's1', cashierId: 'x', cashierName: 'y',
        openTime: null, closeTime: null,
        _openTimeParseFailed: true, _closeTimeParseFailed: false,
        initialCash: 1000, actualCash: 900,
      },
    ],
    Expense: [],
    Invoice: [
      { id: 'i1', date: null, _dateParseFailed: true, subTotal: 100, grandTotal: 100, status: 'PAID' },
    ],
    InvoiceItem: [
      { invoiceId: 'i1', productId: 'p1', name: 'x', price: 10, capitalPrice: 5, quantity: -2, total: -20 }, // negative qty
      { invoiceId: 'i1', productId: 'MISSING', name: 'y', price: 10, capitalPrice: 5, quantity: 1, total: 10, _priceParseFailed: true }, // orphan product ref + parse failure
    ],
    Payment: [
      { invoiceId: 'i1', methodId: 'CASH', methodName: 'Cash', amount: 100 },
      { invoiceId: 'NOPE', methodId: null, methodName: null, amount: null }, // orphan invoice + empty payment
    ],
  };

  const report = validate(canonical);
  const rules = report.issues.map((i) => i.rule);

  await t.test('duplicate IDs', () => {
    assert.ok(rules.includes('duplicate-id'));
  });
  await t.test('negative quantities', () => {
    assert.ok(rules.filter((r) => r === 'negative-quantity').length >= 2, 'expected Product.stock and InvoiceItem.quantity both flagged');
  });
  await t.test('negative prices', () => {
    assert.ok(rules.includes('negative-price'));
  });
  await t.test('invalid dates', () => {
    assert.ok(rules.includes('invalid-date'));
  });
  await t.test('missing references / orphan InvoiceItem', () => {
    assert.ok(rules.includes('orphan-invoice-item'));
  });
  await t.test('orphan Payment', () => {
    assert.ok(rules.filter((r) => r === 'orphan-payment').length >= 1);
  });
  await t.test('empty required values', () => {
    assert.ok(rules.includes('empty-required-value'));
  });
  await t.test('parse failures', () => {
    assert.ok(rules.includes('parse-failure'));
  });
  await t.test('records are never discarded, even when they fail validation', () => {
    // The bad Product record (id: 'p1', duplicated) must still be present
    // in canonical.Product — validate() only reports, never filters.
    assert.equal(canonical.Product.length, 3);
  });
});

test('validate() reports zero issues for entirely clean data', async (t) => {
  const canonical = {
    Product: [{ id: 'p1', name: 'Good', price: 100, capitalPrice: 80, stock: 5 }],
    Customer: [{ id: 'c1', name: 'Cust', phoneNumber: '08123' }],
    Supplier: [{ id: 's1', name: 'Supp', phoneNumber: '08123' }],
    Shift: [{ id: 'sh1', cashierId: 'x', cashierName: 'y', openTime: '2026-01-01T00:00:00.000Z', closeTime: '2026-01-01T10:00:00.000Z', initialCash: 1000, actualCash: 900 }],
    Expense: [{ id: 'e1', name: 'x', date: '2026-01-01T00:00:00.000Z', items: [] }],
    Invoice: [{ id: 'i1', date: '2026-01-01T00:00:00.000Z', subTotal: 100, grandTotal: 100, status: 'PAID' }],
    InvoiceItem: [{ invoiceId: 'i1', productId: 'p1', name: 'x', price: 10, capitalPrice: 5, quantity: 1, total: 10 }],
    Payment: [{ invoiceId: 'i1', methodId: 'CASH', methodName: 'Cash', amount: 100 }],
  };

  await t.test('produces zero issues', () => {
    const report = validate(canonical);
    assert.equal(report.summary.totalIssues, 0);
  });
});
