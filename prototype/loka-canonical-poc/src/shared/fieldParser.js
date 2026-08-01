// Shared field-parsing logic, extracted from what used to be duplicated by
// hand across every normalizeX function in normalize.js. Behavior is
// unchanged from the original — this is a structural move, not a logic
// change. Every call site that used to write:
//
//   const price = parseNumeric(raw.price);
//   ...
//   price: price.value,
//   _priceParseFailed: !price.valid,
//
// now writes:
//
//   ...parsedField(raw, 'price', parseNumeric),
//
// and gets back { price: <value>, _priceParseFailed: <bool> } — identical
// keys, identical values, one call site instead of three lines repeated
// per field.

/**
 * Loka stores several numeric-looking fields (Invoice totals, InvoiceItem
 * price/quantity, Shift cash figures) as strings rather than native
 * numbers — confirmed directly during research/loka-schema-analysis.md.
 * Returns { value, valid }. A failed parse is reported by the caller as a
 * validation issue, never silently coerced to 0 — a silent 0 would
 * misrepresent a data problem as a real value.
 */
function parseNumeric(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return { value: null, valid: true }; // absence is handled by the
    // Empty Required Value check, not this parser
  }
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(num)) {
    return { value: null, valid: false };
  }
  return { value: num, valid: true };
}

/**
 * Loka dates appear in two observed shapes: an ISO string (Shift.openTime)
 * and a millisecond-epoch string (Invoice.date). This tries both and
 * reports validity explicitly rather than defaulting to "now" on failure.
 */
function parseDate(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return { value: null, valid: true };
  }
  // Try epoch-millis-as-string first (e.g. "1783159351490").
  if (/^\d+$/.test(String(raw))) {
    const asEpoch = new Date(Number(raw));
    if (!Number.isNaN(asEpoch.getTime())) {
      return { value: asEpoch.toISOString(), valid: true };
    }
  }
  const asIso = new Date(raw);
  if (!Number.isNaN(asIso.getTime())) {
    return { value: asIso.toISOString(), valid: true };
  }
  return { value: null, valid: false };
}

/**
 * Parses one field of `raw` using `parser` (parseNumeric or parseDate) and
 * returns an object with exactly the two keys every normalizeX function
 * used to write by hand: `<fieldName>` and `_<fieldName>ParseFailed`.
 * Spread this directly into a canonical record literal.
 */
function parsedField(raw, fieldName, parser) {
  const result = parser(raw[fieldName]);
  return {
    [fieldName]: result.value,
    [`_${fieldName}ParseFailed`]: !result.valid,
  };
}

/**
 * Same as parsedField, but for values that are only "failed" when present
 * and invalid — never flags absence as a failure. This matches the
 * original hand-written pattern used for optional fields like
 * Invoice.discount and Shift.actualCash (`raw.x != null && !x.valid`).
 */
function parsedOptionalField(raw, fieldName, parser) {
  const result = parser(raw[fieldName]);
  return {
    [fieldName]: result.value,
    [`_${fieldName}ParseFailed`]: raw[fieldName] != null && !result.valid,
  };
}

module.exports = { parseNumeric, parseDate, parsedField, parsedOptionalField };
