// This is the ONE place a new entity gets wired in. Adding entity #9 means:
//   1. Create src/entities/NewEntity.js exporting a definition object
//      (or an array of definitions, if it derives more than one entity —
//      see Invoice.js for the pattern).
//   2. Add one require() line below.
// Nothing in config.js, normalize.js, or validate.js needs to change —
// that three-places problem is exactly what this registry replaces.

const Product = require('./Product');
const Customer = require('./Customer');
const Supplier = require('./Supplier');
const Shift = require('./Shift');
const Expense = require('./Expense');
const Invoice = require('./Invoice'); // exports [Invoice, InvoiceItem, Payment]

// Flatten: a module may export one definition or an array of definitions.
const modules = [Product, Customer, Supplier, Shift, Expense, Invoice];
const definitions = modules.flat();

module.exports = { definitions };
