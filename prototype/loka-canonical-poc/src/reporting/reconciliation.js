// Reconciliation status for the Reporting Service, per
// implementation/dashboard-v2-implementation-plan.md §4 ("Reconciliation
// Status") and Business Rules Catalog v1 FIN-006 (Gross Margin / Net
// Margin / Invoice.profit must not be conflated).
//
// This reuses the EXACT methodology reports/dashboard-reconciliation-audit.md
// already performed by hand: computing "gross profit" two independent
// ways from the same PAID invoices and checking they agree. That document
// found they agreed to the cent for the 30 July dataset. This module
// automates that same check — it does not invent a new one.
//
// Net Margin is excluded from this check entirely: Business Rules Catalog
// FIN-006 and the KPI Framework both confirm Net Margin has no documented
// formula or system of record ("computed manually... explicitly not a
// system"). There is nothing canonical to reconcile it against, so this
// module does not attempt to.

function computeReconciliationStatus(canonical) {
  const invoices = (canonical.Invoice || []).filter((i) => i.status === 'PAID');

  if (invoices.length === 0) {
    return {
      status: 'insufficient-data',
      checkedInvoiceCount: 0,
      grossProfitSum: null,
      computedMarginSum: null,
      differenceAbs: null,
      note: 'No PAID invoices available to reconcile.',
    };
  }

  let unparseable = 0;
  const grossProfitSum = invoices.reduce((sum, i) => sum + (typeof i.invoiceProfit === 'number' ? i.invoiceProfit : (unparseable++, 0)), 0);
  const computedMarginSum = invoices.reduce((sum, i) => {
    if (typeof i.grandTotal !== 'number' || typeof i.capitalSubTotal !== 'number') return sum;
    return sum + (i.grandTotal - i.capitalSubTotal);
  }, 0);

  const differenceAbs = Math.abs(grossProfitSum - computedMarginSum);
  // Same floating-point tolerance already used in tests/regression.test.js
  // for this identical comparison.
  const reconciled = differenceAbs < 0.01;

  return {
    status: reconciled ? 'reconciled' : 'discrepancy-found',
    checkedInvoiceCount: invoices.length,
    grossProfitSum,
    computedMarginSum,
    differenceAbs,
    note:
      'Compares Invoice.invoiceProfit (Loka\'s own field) against grandTotal - capitalSubTotal (an independently computed margin), ' +
      'for PAID invoices only — the same two-way check already performed by hand in reports/dashboard-reconciliation-audit.md. ' +
      'Net Margin is excluded: it has no canonical source or documented formula (Business Rules Catalog FIN-006).',
  };
}

module.exports = { computeReconciliationStatus };
