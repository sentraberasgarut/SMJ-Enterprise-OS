const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');
const IMPORTER_NAME = 'sjs-operational-data-hub-dummy-importer';
const IMPORTER_VERSION = '0.1.0';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function makeId(...parts) {
  return parts.filter(Boolean).join(':').replace(/\s+/g, '-').toLowerCase();
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function loadState(statePath) {
  if (!fs.existsSync(statePath)) return { checksums: [] };
  return readJson(statePath);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function baseCanonical() {
  return {
    sourceFiles: [],
    importJobs: [],
    businessUnits: [
      { id: 'unit:tss', code: 'TSS', name: 'Toko Sembako Sejahtera', unitType: 'store' }
    ],
    products: [],
    productAliases: [],
    customers: [],
    salesOrders: [],
    salesOrderLines: [],
    payments: [],
    expenses: [],
    transfers: [],
    transferLines: [],
    inventoryMovements: [],
    shiftClosings: [],
    validationIssues: []
  };
}

function addIssue(canonical, importJobId, severity, rule, entityType, entityId, message) {
  canonical.validationIssues.push({
    id: makeId('issue', importJobId, rule, entityType, entityId, canonical.validationIssues.length + 1),
    importJobId,
    severity,
    rule,
    entityType,
    entityId,
    message
  });
}

function upsertBusinessUnit(canonical, unit) {
  const id = makeId('unit', unit.code);
  if (!canonical.businessUnits.some((item) => item.id === id)) {
    canonical.businessUnits.push({ id, code: unit.code, name: unit.name, unitType: unit.type });
  }
  return id;
}

function normalizeLoka(source, canonical, importJobId) {
  for (const product of source.products || []) {
    const productId = makeId('product', product.id);
    canonical.products.push({
      id: productId,
      canonicalSku: productId,
      name: product.name,
      category: product.category,
      baseUom: product.uom,
      active: true
    });
    canonical.productAliases.push({
      id: makeId('alias', 'loka', product.id),
      productId,
      sourceSystem: 'LOKA',
      sourceProductId: product.id,
      sourceName: product.name,
      sourceUom: product.uom,
      confidence: 'source_id'
    });
  }

  for (const customer of source.customers || []) {
    canonical.customers.push({
      id: makeId('customer', customer.id),
      sourceSystem: 'LOKA',
      sourceCustomerId: customer.id,
      name: customer.name,
      customerType: customer.type
    });
  }

  for (const sale of source.sales || []) {
    const orderId = makeId('sale', sale.id);
    const lineTotal = (sale.items || []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    canonical.salesOrders.push({
      id: orderId,
      sourceSystem: 'LOKA',
      sourceOrderId: sale.id,
      businessUnitId: 'unit:tss',
      customerId: makeId('customer', sale.customerId),
      orderDate: sale.date,
      subtotalAmount: lineTotal,
      totalAmount: lineTotal,
      status: sale.status
    });

    for (const item of sale.items || []) {
      const alias = canonical.productAliases.find((entry) => entry.sourceSystem === 'LOKA' && entry.sourceProductId === item.productId);
      if (!alias) {
        addIssue(canonical, importJobId, 'warning', 'missing-product-alias', 'salesOrderLine', sale.id, `No product alias for ${item.name}`);
      }
      if (item.quantity <= 0) {
        addIssue(canonical, importJobId, 'error', 'invalid-quantity', 'salesOrderLine', sale.id, `Quantity must be positive for ${item.name}`);
      }
      canonical.salesOrderLines.push({
        id: makeId('sale-line', sale.id, item.productId || item.name),
        salesOrderId: orderId,
        productId: alias ? alias.productId : null,
        sourceProductName: item.name,
        quantity: item.quantity,
        uom: item.uom,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice
      });
    }

    for (const payment of sale.payments || []) {
      canonical.payments.push({
        id: makeId('payment', sale.id, payment.method),
        salesOrderId: orderId,
        method: payment.method,
        amount: payment.amount
      });
    }
  }

  for (const expense of source.expenses || []) {
    canonical.expenses.push({
      id: makeId('expense', expense.id),
      sourceSystem: 'LOKA',
      sourceExpenseId: expense.id,
      businessUnitId: 'unit:tss',
      expenseDate: expense.date,
      name: expense.name,
      amount: expense.amount
    });
  }
}

function normalizeBukuToko(source, canonical, importJobId) {
  for (const unit of source.businessUnits || []) {
    upsertBusinessUnit(canonical, unit);
  }

  for (const transfer of source.transfers || []) {
    const transferId = makeId('transfer', transfer.id);
    canonical.transfers.push({
      id: transferId,
      sourceSystem: 'BUKU_TOKO',
      sourceTransferId: transfer.id,
      fromUnitId: makeId('unit', transfer.fromUnit),
      toUnitId: makeId('unit', transfer.toUnit),
      transferDate: transfer.date,
      status: transfer.status
    });

    for (const line of transfer.lines || []) {
      if (line.quantitySent <= 0) {
        addIssue(canonical, importJobId, 'error', 'invalid-transfer-quantity', 'transferLine', transfer.id, `Quantity sent must be positive for ${line.name}`);
      }
      if (line.transferPrice == null) {
        addIssue(canonical, importJobId, 'warning', 'missing-transfer-price', 'transferLine', transfer.id, `Transfer price not set for ${line.name}`);
      }
      canonical.transferLines.push({
        id: makeId('transfer-line', transfer.id, line.name),
        transferId,
        productId: null,
        sourceProductName: line.name,
        quantitySent: line.quantitySent,
        quantityReceived: line.quantityReceived,
        uom: line.uom,
        transferPrice: line.transferPrice,
        lineValue: line.transferPrice == null ? null : line.quantitySent * line.transferPrice
      });
    }
  }

  for (const shift of source.shiftClosings || []) {
    canonical.shiftClosings.push({
      id: makeId('shift', shift.id),
      sourceSystem: 'BUKU_TOKO',
      sourceShiftId: shift.id,
      businessUnitId: makeId('unit', shift.unit),
      shiftDate: shift.date,
      cashierName: shift.cashierName,
      expectedCash: shift.expectedCash,
      actualCash: shift.actualCash,
      varianceAmount: shift.actualCash - shift.expectedCash
    });
  }
}

function importSource(filePath, canonical, state) {
  const content = fs.readFileSync(filePath, 'utf8');
  const checksum = sha256(content);
  const source = JSON.parse(content);
  const sourceFileId = makeId('source-file', checksum.slice(0, 12));
  const importJobId = makeId('import-job', checksum.slice(0, 12));
  const startedAt = new Date().toISOString();

  canonical.sourceFiles.push({
    id: sourceFileId,
    sourceSystem: source.sourceSystem,
    sourceType: source.sourceType,
    fileName: source.fileName,
    checksumSha256: checksum,
    observedAt: startedAt,
    sourcePeriodStart: source.period?.start || null,
    sourcePeriodEnd: source.period?.end || null
  });

  if (state.checksums.includes(checksum)) {
    canonical.importJobs.push({
      id: importJobId,
      sourceFileId,
      importerName: IMPORTER_NAME,
      importerVersion: IMPORTER_VERSION,
      status: 'duplicate_skipped',
      startedAt,
      finishedAt: new Date().toISOString(),
      recordsRead: 0,
      recordsPublished: 0,
      issuesCount: 0
    });
    return;
  }

  const beforeIssues = canonical.validationIssues.length;
  if (source.sourceSystem === 'LOKA') normalizeLoka(source, canonical, importJobId);
  else if (source.sourceSystem === 'BUKU_TOKO') normalizeBukuToko(source, canonical, importJobId);
  else addIssue(canonical, importJobId, 'error', 'unsupported-source-system', 'sourceFile', sourceFileId, source.sourceSystem);

  state.checksums.push(checksum);
  const issuesCount = canonical.validationIssues.length - beforeIssues;
  canonical.importJobs.push({
    id: importJobId,
    sourceFileId,
    importerName: IMPORTER_NAME,
    importerVersion: IMPORTER_VERSION,
    status: issuesCount > 0 ? 'published_with_issues' : 'published',
    startedAt,
    finishedAt: new Date().toISOString(),
    recordsRead: content.length,
    recordsPublished: canonical.salesOrders.length + canonical.transfers.length + canonical.expenses.length + canonical.shiftClosings.length,
    issuesCount
  });
}

function run(options = {}) {
  const dataDir = options.dataDir || path.join(ROOT, 'data');
  const outputDir = options.outputDir || OUTPUT_DIR;
  const files = options.files || [
    path.join(dataDir, 'dummy-loka-export.json'),
    path.join(dataDir, 'dummy-buku-toko-export.json')
  ];
  const statePath = options.statePath || path.join(outputDir, 'import-state.json');
  fs.mkdirSync(outputDir, { recursive: true });
  const state = loadState(statePath);
  const canonical = baseCanonical();

  for (const file of files) importSource(file, canonical, state);

  writeJson(path.join(outputDir, 'canonical.json'), canonical);
  writeJson(path.join(outputDir, 'import-jobs.json'), canonical.importJobs);
  writeJson(path.join(outputDir, 'validation-issues.json'), canonical.validationIssues);
  writeJson(statePath, state);

  return canonical;
}

if (require.main === module) {
  ensureOutputDir();
  const canonical = run();
  console.log(`Imported ${canonical.importJobs.length} source file(s).`);
  console.log(`Validation issues: ${canonical.validationIssues.length}`);
}

module.exports = { run, sha256, makeId };
