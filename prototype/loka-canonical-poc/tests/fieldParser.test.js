const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNumeric, parseDate, parsedField, parsedOptionalField } = require('../src/shared/fieldParser');

test('parseNumeric', async (t) => {
  await t.test('parses a numeric string', () => {
    assert.deepEqual(parseNumeric('325000'), { value: 325000, valid: true });
  });
  await t.test('passes through a real number unchanged', () => {
    assert.deepEqual(parseNumeric(42), { value: 42, valid: true });
  });
  await t.test('treats null/undefined/empty string as absent, not invalid', () => {
    assert.deepEqual(parseNumeric(null), { value: null, valid: true });
    assert.deepEqual(parseNumeric(undefined), { value: null, valid: true });
    assert.deepEqual(parseNumeric(''), { value: null, valid: true });
  });
  await t.test('flags a genuinely unparseable value as invalid, never coerces to 0', () => {
    const result = parseNumeric('not-a-number');
    assert.equal(result.value, null);
    assert.equal(result.valid, false);
  });
  await t.test('negative numbers parse as valid (negativity is a validation rule, not a parse failure)', () => {
    assert.deepEqual(parseNumeric('-5000'), { value: -5000, valid: true });
  });
});

test('parseDate', async (t) => {
  await t.test('parses an epoch-millis string', () => {
    const result = parseDate('1783159351490');
    assert.equal(result.valid, true);
    assert.ok(result.value.startsWith('2026-'));
  });
  await t.test('parses an ISO date string', () => {
    const result = parseDate('2026-07-04T09:13:13.404Z');
    assert.deepEqual(result, { value: '2026-07-04T09:13:13.404Z', valid: true });
  });
  await t.test('treats null/undefined/empty string as absent, not invalid', () => {
    assert.deepEqual(parseDate(null), { value: null, valid: true });
    assert.deepEqual(parseDate(''), { value: null, valid: true });
  });
  await t.test('flags a genuinely unparseable date as invalid', () => {
    const result = parseDate('not-a-date');
    assert.equal(result.value, null);
    assert.equal(result.valid, false);
  });
});

test('parsedField', async (t) => {
  await t.test('spreads value and a same-named ParseFailed flag', () => {
    const out = parsedField({ price: '2000' }, 'price', parseNumeric);
    assert.deepEqual(out, { price: 2000, _priceParseFailed: false });
  });
  await t.test('flags failure even when the field is present but unparseable', () => {
    const out = parsedField({ price: 'bad' }, 'price', parseNumeric);
    assert.deepEqual(out, { price: null, _priceParseFailed: true });
  });
});

test('parsedOptionalField', async (t) => {
  await t.test('does not flag absence as a failure', () => {
    const out = parsedOptionalField({}, 'discount', parseNumeric);
    assert.deepEqual(out, { discount: null, _discountParseFailed: false });
  });
  await t.test('does flag a present-but-unparseable value', () => {
    const out = parsedOptionalField({ discount: 'bad' }, 'discount', parseNumeric);
    assert.deepEqual(out, { discount: null, _discountParseFailed: true });
  });
});
