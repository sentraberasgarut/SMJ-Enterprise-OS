// Snapshot classification for the Loka Connector, per
// implementation/loka-connector-v1-spec.md §5.
//
// Exactly the four statuses that document defines, assigned by exactly the
// rules it states — nothing here extends or reinterprets that logic.
// COMPLETE_DAY and MID_SHIFT are, per the spec's own text, defined
// categories that have not yet been directly observed in this repository's
// data; this module implements the rule for when they WOULD apply, without
// claiming either has been confirmed to occur.

const STATUSES = Object.freeze({
  COMPLETE_DAY: 'COMPLETE_DAY',
  PARTIAL_DAY: 'PARTIAL_DAY',
  MID_SHIFT: 'MID_SHIFT',
  UNKNOWN: 'UNKNOWN',
});

function calendarDay(iso) {
  return iso ? iso.slice(0, 10) : null;
}

/**
 * @param {object} profile a backup profile from backupDiscovery.inspectBackup()
 * @returns {string} one of STATUSES
 */
function classifySnapshot(profile) {
  if (!profile || !profile.dateRanges) {
    return STATUSES.UNKNOWN;
  }

  // MID_SHIFT: an open, not-yet-closed shift at backup time — signalled by
  // an absent/unparseable closeTime on at least one Shift record. Checked
  // first because it is the most specific available signal; per the spec,
  // this has not been observed in any backup examined so far, but the rule
  // itself is unconditional on that history.
  if (typeof profile.shiftsWithUnresolvedCloseTime === 'number' && profile.shiftsWithUnresolvedCloseTime > 0) {
    return STATUSES.MID_SHIFT;
  }

  const invoiceMax = profile.dateRanges.Invoice && profile.dateRanges.Invoice.max;
  const debtMax = profile.dateRanges.InvoiceDebt && profile.dateRanges.InvoiceDebt.max;
  const shiftCloseMax = profile.dateRanges['Shift.closeTime'] && profile.dateRanges['Shift.closeTime'].max;

  // No business activity to anchor a classification against at all.
  if (!invoiceMax && !debtMax) {
    return STATUSES.UNKNOWN;
  }

  const latestActivity = [invoiceMax, debtMax].filter(Boolean).sort().pop();
  const latestActivityDay = calendarDay(latestActivity);

  // COMPLETE_DAY: a Shift has closed on or after the same calendar day as
  // the latest Invoice/InvoiceDebt activity — the business day was wound
  // down before the backup was taken.
  if (shiftCloseMax && calendarDay(shiftCloseMax) >= latestActivityDay) {
    return STATUSES.COMPLETE_DAY;
  }

  // PARTIAL_DAY: activity exists for the latest day, but no Shift has
  // closed for it yet. This is the status both backups examined for the
  // spec (30 July, 1 August) actually received.
  return STATUSES.PARTIAL_DAY;
}

module.exports = { STATUSES, classifySnapshot };
