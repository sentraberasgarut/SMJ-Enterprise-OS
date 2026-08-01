// Dashboard card computation for the Reporting Service, per
// implementation/dashboard-v2-implementation-plan.md §3 (the 11 existing
// cards' documented source entity, canonical dataset, business service,
// and calculation owner) and implementation/loka-connector-v1-spec.md.
//
// Reuses existing, already-validated business rules only:
//   - Gross Profit uses the same PAID-only, sum(invoiceProfit) methodology
//     already confirmed in reports/dashboard-reconciliation-audit.md.
//   - Expenses uses the same raw item.price parse-and-sum methodology
//     already confirmed there too, via the SAME parseNumeric function the
//     canonical pipeline itself uses (shared/fieldParser) — not a
//     reimplementation.
//   - Net Profit is deliberately left UNKNOWN. Three separate documents in
//     this repository (the reconciliation audit, the lineage audit, and
//     Business Rules Catalog v1's FIN-008) already establish that
//     Gross Profit minus Expenses is NOT a confirmed, adopted formula —
//     computing it here would be inventing a business rule, which this
//     task explicitly forbids ("do not duplicate formulas" presupposes a
//     formula exists to reuse; none does for Net Profit).
//
// No canonical data is read here beyond what the connector already
// produces. This module never opens a Realm file.

const { parseNumeric } = require('../shared/fieldParser');

const CONFIDENCE = Object.freeze({ HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', NONE: 'N/A' });
const STATUS = Object.freeze({ OK: 'ok', UNAVAILABLE: 'unavailable', BLOCKED: 'blocked' });

function calendarDay(iso) {
  return iso ? iso.slice(0, 10) : null;
}
function calendarMonth(iso) {
  return iso ? iso.slice(0, 7) : null;
}

function latestDate(records, field) {
  let max = null;
  for (const r of records) {
    const v = r[field];
    if (!v) continue;
    if (max === null || v > max) max = v;
  }
  return max;
}

/** Days between an ISO date and "now" — 0 decimal places, never negative-displayed as fresh. */
function ageInDays(iso, now) {
  if (!iso) return null;
  const ms = now - new Date(iso).getTime();
  return Math.floor(ms / 86400000);
}

function dataFreshnessFor(latestIso, ingestedAt, now) {
  if (!latestIso) return { latestDataDate: null, ingestedAt, ageInDays: null };
  return { latestDataDate: latestIso, ingestedAt, ageInDays: ageInDays(latestIso, now) };
}

function baseCard({ id, name, sourceEntity, businessService }) {
  return { id, name, sourceEntity, businessService };
}

/**
 * @param {object} canonical the connector's canonical output (unchanged shape)
 * @param {object} runMetadata the connector's run metadata (for ingestedAt, connectorVersion)
 * @param {string} snapshotStatus the connector's snapshot classification
 * @returns {object[]} exactly 11 dashboard cards, in the same order as
 *   dashboard-v2-implementation-plan.md §3
 */
function buildDashboardCards(canonical, runMetadata, snapshotStatus) {
  const now = Date.now();
  const lastUpdated = new Date(now).toISOString();
  const ingestedAt = runMetadata && runMetadata.finishedAt ? runMetadata.finishedAt : null;

  const invoices = canonical.Invoice || [];
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const products = canonical.Product || [];
  const expenses = canonical.Expense || [];

  const cards = [];

  // 1. Today's Revenue — the source-file ambiguity named in
  // implementation-backlog.md BL-007 (which of Loka's two daily exports
  // feeds "today") is about the LIVE Ringkasan dashboard, not this
  // connector's own canonical Invoice data, which is unambiguous about
  // what it contains. This card reports revenue for the latest calendar
  // day actually present in canonical Invoice data, explicitly NOT
  // asserted to be literal "today" — status/confidence reflect that.
  {
    const latestInvoiceDate = latestDate(invoices, 'date');
    const latestDay = calendarDay(latestInvoiceDate);
    const dayInvoices = latestDay ? invoices.filter((i) => calendarDay(i.date) === latestDay && i.status === 'PAID') : [];
    const value = latestDay ? dayInvoices.reduce((sum, i) => sum + (typeof i.grandTotal === 'number' ? i.grandTotal : 0), 0) : null;
    cards.push({
      ...baseCard({ id: 'todays-revenue', name: "Today's Revenue", sourceEntity: 'Invoice', businessService: 'Sales Service' }),
      value,
      status: value !== null ? STATUS.OK : STATUS.UNAVAILABLE,
      lastUpdated,
      dataFreshness: dataFreshnessFor(latestInvoiceDate, ingestedAt, now),
      confidence: value !== null ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE,
      caveat:
        'Reports revenue for the latest calendar day present in this canonical dataset, not necessarily calendar "today" — ' +
        'which Loka export (the .realm backup vs. the daily JSON export) should feed a live "today" figure is unresolved ' +
        '(Implementation Backlog BL-007).',
    });
  }

  // 2. Gross Profit — PAID-only, sum(invoiceProfit), matching the exact
  // methodology already confirmed in the reconciliation audit. Labeled
  // per Business Rules Catalog FIN-009: never "achieved" against a net
  // target.
  {
    const latestInvoiceDate = latestDate(invoices, 'date');
    const grossProfit = paidInvoices.reduce((sum, i) => sum + (typeof i.invoiceProfit === 'number' ? i.invoiceProfit : 0), 0);
    cards.push({
      ...baseCard({ id: 'gross-profit', name: 'Gross Profit (laba kotor)', sourceEntity: 'Invoice', businessService: 'Finance Service' }),
      value: paidInvoices.length > 0 ? grossProfit : null,
      status: paidInvoices.length > 0 ? STATUS.OK : STATUS.UNAVAILABLE,
      lastUpdated,
      dataFreshness: dataFreshnessFor(latestInvoiceDate, ingestedAt, now),
      confidence: paidInvoices.length > 0 ? CONFIDENCE.HIGH : CONFIDENCE.NONE,
      caveat: 'Sum of Invoice.invoiceProfit across PAID invoices only, per the methodology already verified in reports/dashboard-reconciliation-audit.md. Never to be labeled as an achievement against a Net Profit target (Business Rules Catalog FIN-009).',
    });
  }

  // 3. Transaction Count — the inclusion rule (whether CANCELLED/PENDING
  // count) is UNKNOWN per Business Rules Catalog SAL-004. The raw count
  // itself is not unknown; the ambiguity is which count is "correct".
  // Reported as total, with the ambiguity surfaced rather than hidden.
  {
    const latestInvoiceDate = latestDate(invoices, 'date');
    const byStatus = invoices.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});
    cards.push({
      ...baseCard({ id: 'transaction-count', name: 'Transaction Count', sourceEntity: 'Invoice', businessService: 'Sales Service' }),
      value: invoices.length,
      status: STATUS.OK,
      lastUpdated,
      dataFreshness: dataFreshnessFor(latestInvoiceDate, ingestedAt, now),
      confidence: CONFIDENCE.MEDIUM,
      caveat: `Total across all statuses (${JSON.stringify(byStatus)}). Whether CANCELLED/PENDING invoices should be included is UNKNOWN (Business Rules Catalog SAL-004) — this value is the raw total, not a business-defined "completed sales" count.`,
    });
  }

  // 4. Cash in Hand — no canonical entity exists at all
  // (implementation/dashboard-v2-implementation-plan.md §3.4). Buku
  // Toko's Tutup Shift sheet is the only source, and the Reporting
  // Service consumes canonical data only — this value is UNKNOWN by
  // construction, not by omission.
  cards.push({
    ...baseCard({ id: 'cash-in-hand', name: 'Cash in Hand (Kas Kasir)', sourceEntity: 'N/A — no canonical equivalent', businessService: 'Finance Service' }),
    value: 'UNKNOWN',
    status: STATUS.UNAVAILABLE,
    lastUpdated,
    dataFreshness: { latestDataDate: null, ingestedAt: null, ageInDays: null },
    confidence: CONFIDENCE.NONE,
    caveat: 'No canonical source exists — this figure lives only in Buku Toko\'s Tutup Shift sheet, which the Reporting Service does not and must not read directly.',
  });

  // 5. Safe Cash — identical reasoning to Cash in Hand.
  cards.push({
    ...baseCard({ id: 'safe-cash', name: 'Safe Cash (Saldo Brankas)', sourceEntity: 'N/A — no canonical equivalent', businessService: 'Finance Service' }),
    value: 'UNKNOWN',
    status: STATUS.UNAVAILABLE,
    lastUpdated,
    dataFreshness: { latestDataDate: null, ingestedAt: null, ageInDays: null },
    confidence: CONFIDENCE.NONE,
    caveat: 'No canonical source exists — same reasoning as Cash in Hand. Loka\'s own Shift.cashInHand is a different, unreconciled concept and must not be substituted (Canonical Data Contract §4).',
  });

  // 6. Inventory Value — computable directly from canonical Product
  // (stock x capitalPrice), matching the Loka-side figure already
  // independently verified in the reconciliation audit.
  {
    // Canonical Product carries no date field (createdTime is not mapped
    // through by entities/Product.js) — freshness for this card is
    // therefore expressed via the connector's own ingestedAt only.
    const value = products.reduce((sum, p) => {
      const stock = typeof p.stock === 'number' ? p.stock : 0;
      const capitalPrice = typeof p.capitalPrice === 'number' ? p.capitalPrice : 0;
      return sum + stock * capitalPrice;
    }, 0);
    cards.push({
      ...baseCard({ id: 'inventory-value', name: 'Inventory Value', sourceEntity: 'Product', businessService: 'Inventory Service' }),
      value: products.length > 0 ? value : null,
      status: products.length > 0 ? STATUS.OK : STATUS.UNAVAILABLE,
      lastUpdated,
      dataFreshness: dataFreshnessFor(ingestedAt, ingestedAt, now),
      confidence: products.length > 0 ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE,
      caveat: 'Sum of stock x capitalPrice across all canonical Product records (Loka-derived). Differs from the Financial Baseline\'s physical-count figure by design (Business Rules Catalog INV-005) — the Baseline figure is not canonical data and is not read here.',
    });
  }

  // 7. Goods Out — no canonical entity exists (dashboard-v2-implementation-plan.md §3.7).
  cards.push({
    ...baseCard({ id: 'goods-out', name: 'Goods Out', sourceEntity: 'N/A — no canonical entity', businessService: 'None — not covered by any Business Service' }),
    value: 'UNKNOWN',
    status: STATUS.UNAVAILABLE,
    lastUpdated,
    dataFreshness: { latestDataDate: null, ingestedAt: null, ageInDays: null },
    confidence: CONFIDENCE.NONE,
    caveat: 'No canonical entity models inter-branch goods distribution yet (Implementation Backlog BL-013) — genuinely unmodeled, not merely unread.',
  });

  // 8. Outstanding Receivables — InvoiceDebt is read by the connector's
  // discovery layer for classification purposes ONLY (see
  // src/connector/backupDiscovery.js) and is deliberately excluded from
  // the canonical dataset itself (Implementation Backlog BL-006). The
  // Reporting Service consumes canonical data only, so this stays UNKNOWN.
  cards.push({
    ...baseCard({ id: 'outstanding-receivables', name: 'Outstanding Receivables', sourceEntity: 'InvoiceDebt — not in canonical output', businessService: 'Finance Service' }),
    value: 'UNKNOWN',
    status: STATUS.UNAVAILABLE,
    lastUpdated,
    dataFreshness: { latestDataDate: null, ingestedAt: null, ageInDays: null },
    confidence: CONFIDENCE.NONE,
    caveat: 'InvoiceDebt is not part of the canonical dataset (Implementation Backlog BL-006) — extending it would be extending connector functionality, out of scope for this sprint.',
  });

  // 9. Expenses — computable: canonical Expense.items[].price is raw
  // (unparsed by design, per entities/Expense.js), parsed here with the
  // SAME parseNumeric function the canonical pipeline itself uses — not
  // a reimplementation. Scoped to the latest calendar month present in
  // the data, matching the existing "beban BULAN ini" concept
  // (_bebanBulan(), per the Dashboard Lineage Audit).
  {
    const latestExpenseDate = latestDate(expenses, 'date');
    const latestMonth = calendarMonth(latestExpenseDate);
    const monthExpenses = latestMonth ? expenses.filter((e) => calendarMonth(e.date) === latestMonth) : [];
    let unparseableItemCount = 0;
    const value = monthExpenses.reduce((sum, e) => {
      const items = Array.isArray(e.items) ? e.items : [];
      return sum + items.reduce((itemSum, item) => {
        const parsed = parseNumeric(item.price);
        if (!parsed.valid) unparseableItemCount++;
        return itemSum + (parsed.value || 0);
      }, 0);
    }, 0);
    cards.push({
      ...baseCard({ id: 'expenses', name: 'Expenses (beban bulan ini)', sourceEntity: 'Expense', businessService: 'Finance Service' }),
      value: latestMonth ? value : null,
      status: latestMonth ? STATUS.OK : STATUS.UNAVAILABLE,
      lastUpdated,
      dataFreshness: dataFreshnessFor(latestExpenseDate, ingestedAt, now),
      confidence: latestMonth && unparseableItemCount === 0 ? CONFIDENCE.HIGH : latestMonth ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE,
      caveat: `Sum of Expense.items[].price for calendar month ${latestMonth || 'N/A'}, parsed via the same parseNumeric() the canonical pipeline uses. ${unparseableItemCount} item(s) failed to parse and were excluded.`,
    });
  }

  // 10. Net Profit — deliberately UNKNOWN. See module header comment.
  cards.push({
    ...baseCard({ id: 'net-profit', name: 'Net Profit (laba bersih)', sourceEntity: 'Invoice + Expense', businessService: 'Finance Service' }),
    value: 'UNKNOWN',
    status: STATUS.BLOCKED,
    lastUpdated,
    dataFreshness: { latestDataDate: null, ingestedAt: null, ageInDays: null },
    confidence: CONFIDENCE.NONE,
    caveat: 'Gross Profit minus Expenses is NOT a confirmed, adopted formula anywhere in this repository (Business Rules Catalog FIN-008; reports/dashboard-reconciliation-audit.md explicitly declines to compute it). Computing it here would be inventing a business rule, which this task forbids.',
  });

  // 11. Stock Alerts — canonical Product does not carry stockAlert /
  // expiryAlert fields (Implementation Backlog BL-012).
  cards.push({
    ...baseCard({ id: 'stock-alerts', name: 'Stock Alerts', sourceEntity: 'Product — stockAlert field not extracted', businessService: 'Inventory Service' }),
    value: 'UNKNOWN',
    status: STATUS.UNAVAILABLE,
    lastUpdated,
    dataFreshness: { latestDataDate: null, ingestedAt: null, ageInDays: null },
    confidence: CONFIDENCE.NONE,
    caveat: 'normalize.js\'s Product mapping does not carry stockAlert/expiryAlert through yet (Implementation Backlog BL-012) — extending it is a canonical-mapping change, out of scope for this sprint.',
  });

  return cards;
}

module.exports = { buildDashboardCards, CONFIDENCE, STATUS };
