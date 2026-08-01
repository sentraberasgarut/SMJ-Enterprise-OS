const test = require('node:test');
const assert = require('node:assert/strict');

const Product = require('../src/entities/Product');
const Customer = require('../src/entities/Customer');
const Supplier = require('../src/entities/Supplier');
const Shift = require('../src/entities/Shift');
const Expense = require('../src/entities/Expense');
const [Invoice, InvoiceItem, Payment] = require('../src/entities/Invoice');

const META = {
  sourceFile: 'test.realm',
  sourceChecksum: 'abc123',
  connectorVersion: 'test-0.0.0',
  extractedAt: '2026-07-31T00:00:00.000Z',
};

test('Product.normalize', async (t) => {
  await t.test('maps a well-formed raw record', () => {
    const raw = { id: 'p1', name: 'Aquviva 700Ml', category: { id: 'AIR', text: 'Air' }, price: 2000, capitalPrice: 1667, stock: 156, code: '', unit: null };
    const out = Product.normalize(raw, META);
    assert.equal(out.id, 'p1');
    assert.equal(out.price, 2000);
    assert.equal(out.stock, 156);
    assert.equal(out._priceParseFailed, false);
    assert.deepEqual(out._provenance.sourceFile, 'test.realm');
  });

  await t.test('Product.validate flags negative price and negative stock', () => {
    const records = [Product.normalize({ id: 'p1', name: 'x', price: -50, capitalPrice: 10, stock: -3 }, META)];
    const issues = Product.validate(records);
    const rules = issues.map((i) => i.rule);
    assert.ok(rules.includes('negative-price'));
    assert.ok(rules.includes('negative-quantity'));
  });
});

test('Customer.normalize', async (t) => {
  await t.test('maps a well-formed raw record and never guesses branch status', () => {
    const out = Customer.normalize({ id: 'c1', name: 'Sederhana Jaya 4', phoneNumber: '081225050305' }, META);
    assert.equal(out._isPossibleBranch, null);
  });
});

test('Supplier.normalize', async (t) => {
  await t.test('maps a well-formed raw record', () => {
    const out = Supplier.normalize({ id: 's1', name: 'Jonny', phoneNumber: '081564652641' }, META);
    assert.equal(out.name, 'Jonny');
  });
});

test('Shift.normalize', async (t) => {
  await t.test('parses cash figures and dates', () => {
    const out = Shift.normalize(
      { id: 'sh1', cashierId: 'x', cashierName: 'Ayu', openTime: '2026-07-04T09:13:13.404Z', closeTime: '2026-07-04T23:26:35.505Z', initialCash: '166000', actualCash: '484000', cashDiff: -17500, cashInHand: 501500 },
      META
    );
    assert.equal(out.initialCash, 166000);
    assert.equal(out.actualCash, 484000);
    assert.equal(out.cashDiff, -17500);
  });

  await t.test('missing closeTime is absence, not a parse failure', () => {
    const out = Shift.normalize({ id: 'sh1', cashierId: 'x', cashierName: 'y', openTime: '2026-07-04T09:13:13.404Z', closeTime: null, initialCash: '1000' }, META);
    assert.equal(out.closeTime, null);
    assert.equal(out._closeTimeParseFailed, false);
  });
});

test('Expense.normalize', async (t) => {
  await t.test('keeps items nested, unflattened', () => {
    const out = Expense.normalize({ id: 'e1', name: 'Shodaqoh', date: '1783159039624', items: [{ name: 'Sdq', price: '2000' }] }, META);
    assert.ok(Array.isArray(out.items));
    assert.equal(out.items.length, 1);
  });
});

test('Invoice.normalize', async (t) => {
  await t.test('carries Invoice.profit through as invoiceProfit, never merged with anything else', () => {
    const out = Invoice.normalize(
      { id: 'i1', date: '1783159351490', cashier: 'x', status: 'PAID', subTotal: '325000', grandTotal: '325000', capitalSubTotal: '293250', profit: '31750', totalPayment: '325000', discount: '0', customer: null, customerName: null },
      META
    );
    assert.equal(out.invoiceProfit, 31750);
    assert.equal('profit' in out, false, 'raw field name "profit" must not leak into the canonical shape');
  });

  await t.test('resolves the true Realm link to customer.id, not a copy of the customer object', () => {
    const out = Invoice.normalize({ id: 'i1', date: '1', subTotal: '1', grandTotal: '1', status: 'PAID', customer: { id: 'c1', name: 'Someone' } }, META);
    assert.equal(out.customerId, 'c1');
  });
});

test('InvoiceItem / Payment derivation', async (t) => {
  const rawInvoices = [
    {
      id: 'i1',
      items: [{ productId: 'p1', name: 'Item A', price: '1000', capitalPrice: '800', quantity: '2', total: '2000', unit: 'pcs' }],
      paymentMethod: { id: 'CASH', name: 'Cash' },
      totalPayment: '2000',
      splitPayments: [],
    },
    {
      id: 'i2',
      items: [],
      splitPayments: [
        { paymentMethodId: 'CASH', paymentMethodName: 'Cash', amountPaid: '500' },
        { paymentMethodId: 'QRIS', paymentMethodName: 'QRIS', amountPaid: '500' },
      ],
    },
    { id: 'i3', items: [], paymentMethod: null, splitPayments: [] }, // no derivable payment at all
  ];

  await t.test('one InvoiceItem per embedded item, linked to its parent invoiceId', () => {
    const items = InvoiceItem.deriveAll(rawInvoices, META);
    assert.equal(items.length, 1);
    assert.equal(items[0].invoiceId, 'i1');
    assert.equal(items[0].productId, 'p1');
    assert.equal(items[0].quantity, 2);
  });

  await t.test('splitPayments produce one Payment per split, using the amount rename correctly', () => {
    const payments = Payment.deriveAll(rawInvoices, META);
    const i2Payments = payments.filter((p) => p.invoiceId === 'i2');
    assert.equal(i2Payments.length, 2);
    assert.equal(i2Payments[0].amount, 500);
    assert.equal('amountPaid' in i2Payments[0], false, 'the source field name must not leak into the canonical shape');
  });

  await t.test('a single paymentMethod (no splits) produces exactly one Payment', () => {
    const payments = Payment.deriveAll(rawInvoices, META);
    const i1Payments = payments.filter((p) => p.invoiceId === 'i1');
    assert.equal(i1Payments.length, 1);
    assert.equal(i1Payments[0].amount, 2000);
  });

  await t.test('Payment.validate flags an invoice with no derivable payment at all', () => {
    const canonical = {
      Invoice: rawInvoices.map((r) => ({ id: r.id })),
      Payment: Payment.deriveAll(rawInvoices, META),
    };
    const issues = Payment.validate(canonical.Payment, canonical);
    const i3Issue = issues.find((i) => i.id === 'i3');
    assert.ok(i3Issue, 'expected an orphan-payment issue for invoice i3');
  });
});
