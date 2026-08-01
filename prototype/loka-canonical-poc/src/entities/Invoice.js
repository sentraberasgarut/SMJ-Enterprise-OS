// Invoice, InvoiceItem, and Payment entity definitions live in one file
// because InvoiceItem and Payment are NOT separate top-level Realm tables —
// per research/loka-schema-analysis.md, both are embedded inside Invoice
// (Invoice.items, and Invoice.paymentMethod / Invoice.splitPayments). They
// are derived from raw Invoice records here, never queried directly.
//
// This file exports an array of three entity definitions instead of one.

const { parseNumeric, parseDate, parsedField, parsedOptionalField } = require('../shared/fieldParser');
const { provenance } = require('../shared/provenance');
const { makeIssue } = require('../shared/issues');

function normalizeInvoice(raw, meta) {
  const profit = parseNumeric(raw.profit);
  return {
    id: raw.id ?? null,
    ...parsedField(raw, 'date', parseDate),
    cashier: raw.cashier ?? null,
    status: raw.status ?? null,
    ...parsedField(raw, 'subTotal', parseNumeric),
    ...parsedField(raw, 'grandTotal', parseNumeric),
    ...parsedField(raw, 'capitalSubTotal', parseNumeric),
    // Invoice.profit is a THIRD, independent margin figure alongside Gross
    // Margin and Net Margin, per ADR-0003 §2 and loka-schema-analysis.md.
    // It is carried through here as its own distinct field, named
    // `invoiceProfit` (not `profit`) so it is never mistaken for a generic
    // "profit" value — never relabeled or merged with Gross/Net Margin.
    // Reconciling the three is out of scope for this prototype (see
    // enterprise-data/canonical/summary.md).
    invoiceProfit: profit.value,
    _invoiceProfitParseFailed: raw.profit != null && !profit.valid,
    ...parsedField(raw, 'totalPayment', parseNumeric),
    ...parsedOptionalField(raw, 'discount', parseNumeric),
    // customer is a TRUE Realm link (not embedded), per
    // loka-schema-analysis.md's Relationships section.
    customerId: raw.customer ? raw.customer.id ?? null : null,
    customerName: raw.customerName ?? null,
    _provenance: provenance(meta),
  };
}

// Reference-equality cache so InvoiceItem's and Payment's deriveAll() don't
// recompute the same pass over the same raw Invoice array twice in one run.
let _cache = null;

function deriveChildren(rawInvoices, meta) {
  if (_cache && _cache.rawInvoices === rawInvoices && _cache.meta === meta) {
    return _cache.result;
  }

  const invoiceItems = [];
  const payments = [];

  for (const raw of rawInvoices) {
    const invoiceId = raw.id ?? null;

    const items = Array.isArray(raw.items) ? raw.items : [];
    for (const item of items) {
      invoiceItems.push({
        invoiceId,
        productId: item.productId ?? null,
        name: item.name ?? null,
        ...parsedField(item, 'price', parseNumeric),
        ...parsedField(item, 'capitalPrice', parseNumeric),
        ...parsedField(item, 'quantity', parseNumeric),
        ...parsedField(item, 'total', parseNumeric),
        unit: item.unit ?? null,
        _provenance: provenance(meta),
      });
    }

    // Payment has no top-level Realm table. It is derived from
    // Invoice.paymentMethod (a single embedded snapshot) and
    // Invoice.splitPayments (a list) — per
    // enterprise-data/canonical/payments.md. If splitPayments is
    // non-empty, one canonical Payment is emitted per split; otherwise
    // one Payment is emitted from paymentMethod + totalPayment.
    const splitPayments = Array.isArray(raw.splitPayments) ? raw.splitPayments : [];
    if (splitPayments.length > 0) {
      for (const split of splitPayments) {
        // Note the rename: source field is `amountPaid`, canonical key is
        // `amount` — matches the original prototype exactly. Handled
        // manually rather than via parsedField() since that helper assumes
        // the source and output field names are the same.
        const amountPaid = parseNumeric(split.amountPaid);
        payments.push({
          invoiceId,
          methodId: split.paymentMethodId ?? null,
          methodName: split.paymentMethodName ?? null,
          amount: amountPaid.value,
          _amountParseFailed: !amountPaid.valid,
          _provenance: provenance(meta),
        });
      }
    } else if (raw.paymentMethod) {
      const totalPayment = parseNumeric(raw.totalPayment);
      payments.push({
        invoiceId,
        methodId: raw.paymentMethod.id ?? null,
        methodName: raw.paymentMethod.name ?? null,
        amount: totalPayment.value,
        _amountParseFailed: !totalPayment.valid,
        _provenance: provenance(meta),
      });
    }
    // If neither splitPayments nor paymentMethod is present, no Payment
    // record is derived for this invoice. The Payment entity's own
    // validate() flags invoices with no derivable payment at all.
  }

  const result = { invoiceItems, payments };
  _cache = { rawInvoices, meta, result };
  return result;
}

const invoiceDefinition = {
  name: 'Invoice',
  isTopLevel: true,
  requiredFields: ['id', 'date', 'subTotal', 'grandTotal', 'status'],
  normalize: normalizeInvoice,
  validate() {
    return [];
  },
};

const invoiceItemDefinition = {
  name: 'InvoiceItem',
  isTopLevel: false,
  derivedFrom: 'Invoice',
  requiredFields: ['name', 'price', 'quantity', 'total'],
  deriveAll(rawInvoices, meta) {
    return deriveChildren(rawInvoices, meta).invoiceItems;
  },
  validate(records, canonical) {
    const issues = [];
    const productIds = new Set((canonical.Product || []).map((p) => p.id).filter((id) => id != null));
    const invoiceIds = new Set((canonical.Invoice || []).map((i) => i.id).filter((id) => id != null));

    for (const record of records) {
      if (typeof record.quantity === 'number' && record.quantity < 0) {
        issues.push(makeIssue('InvoiceItem', record.invoiceId, 'negative-quantity', `quantity is negative (${record.quantity}) for product "${record.productId}".`, 'error'));
      }
      if (typeof record.price === 'number' && record.price < 0) {
        issues.push(makeIssue('InvoiceItem', record.invoiceId, 'negative-price', `price is negative (${record.price}) for product "${record.productId}".`, 'error'));
      }
      if (typeof record.capitalPrice === 'number' && record.capitalPrice < 0) {
        issues.push(makeIssue('InvoiceItem', record.invoiceId, 'negative-price', `capitalPrice is negative (${record.capitalPrice}) for product "${record.productId}".`, 'error'));
      }
      if (record.invoiceId != null && !invoiceIds.has(record.invoiceId)) {
        // Structurally very unlikely, since InvoiceItem is derived from
        // Invoice directly — checked anyway for robustness.
        issues.push(makeIssue('InvoiceItem', record.invoiceId, 'orphan-invoice-item', `references invoice "${record.invoiceId}", which is not present in canonical Invoice data.`, 'error'));
      }
      if (record.productId != null && !productIds.has(record.productId)) {
        // This is the realistic case: productId is a soft string reference
        // with no enforced integrity in Loka's own data model, per
        // loka-schema-analysis.md's Relationships section (#3).
        issues.push(makeIssue('InvoiceItem', record.invoiceId, 'orphan-invoice-item', `references productId "${record.productId}", which does not match any canonical Product.`, 'warning'));
      }
    }
    return issues;
  },
};

const paymentDefinition = {
  name: 'Payment',
  isTopLevel: false,
  derivedFrom: 'Invoice',
  requiredFields: ['invoiceId'],
  deriveAll(rawInvoices, meta) {
    return deriveChildren(rawInvoices, meta).payments;
  },
  validate(records, canonical) {
    const issues = [];
    const invoiceIds = new Set((canonical.Invoice || []).map((i) => i.id).filter((id) => id != null));
    const invoicesWithPayment = new Set(records.map((p) => p.invoiceId));

    for (const record of records) {
      if (record.invoiceId != null && !invoiceIds.has(record.invoiceId)) {
        issues.push(makeIssue('Payment', record.invoiceId, 'orphan-payment', `references invoice "${record.invoiceId}", which is not present in canonical Invoice data.`, 'error'));
      }
      if ((record.methodName === null || record.methodName === undefined) && (record.amount === null || record.amount === undefined)) {
        // Payment has no top-level table of its own in Loka — it is
        // derived from an embedded snapshot on Invoice, so it cannot be
        // "orphaned from its parent" the way a real foreign key could be.
        // This is the closest honest analog: a derived Payment record with
        // neither a method name nor an amount is structurally present but
        // semantically empty.
        issues.push(makeIssue('Payment', record.invoiceId, 'orphan-payment', 'derived payment record has neither a method name nor an amount.', 'warning'));
      }
    }

    // Invoices with a total but no derivable payment at all.
    for (const invoice of canonical.Invoice || []) {
      if (invoice.id != null && !invoicesWithPayment.has(invoice.id)) {
        issues.push(makeIssue('Payment', invoice.id, 'orphan-payment', `invoice "${invoice.id}" has no derivable Payment record (no paymentMethod and no splitPayments).`, 'warning'));
      }
    }
    return issues;
  },
};

module.exports = [invoiceDefinition, invoiceItemDefinition, paymentDefinition];
