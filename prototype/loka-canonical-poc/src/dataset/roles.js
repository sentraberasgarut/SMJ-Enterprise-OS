// User Role schema preparation for Dashboard Dataset v1.
//
// Visibility METADATA ONLY — no authentication, no enforcement. Where a
// role's visibility scope is genuinely grounded in an existing document,
// that grounding is cited. Where it is not, visibilityScope is UNKNOWN
// rather than invented — most of these roles are named in this sprint's
// instructions directly, not defined anywhere in the repository read for
// this implementation.

const USER_ROLES = Object.freeze([
  {
    id: 'ceo',
    name: 'CEO',
    visibilityScope: 'all-business-units,all-cards',
    groundedIn: 'Data Governance Framework §2 (Ownership Matrix) — CEO is the named Business Owner for nearly every canonical entity.',
  },
  {
    id: 'owner-ibu',
    name: 'Owner (Ibu)',
    visibilityScope: 'central-kitchen,finance-cash-cosign',
    groundedIn:
      'ADR-0002 (Cash co-signatory); Canonical Data Contract §4/§6 (Ibu & Teh Nurul named Business Owner for Central Kitchen-scoped Product/Supplier/Inventory). ' +
      'Scope beyond Central Kitchen and Cash co-signature is UNKNOWN — no document defines a full visibility boundary for this role.',
  },
  {
    id: 'store-manager',
    name: 'Store Manager',
    visibilityScope: 'UNKNOWN',
    groundedIn: 'Not defined in any document read for this implementation. Named directly in this sprint\'s instructions.',
  },
  {
    id: 'central-kitchen-manager',
    name: 'Central Kitchen Manager',
    visibilityScope: 'UNKNOWN',
    groundedIn:
      'Not defined in any document read for this implementation. Canonical Data Contract §4/§6 name "Ibu & Teh Nurul" jointly as ' +
      'Central Kitchen\'s authority, without distinguishing an independent "Central Kitchen Manager" role from the Owner (Ibu) role above — ' +
      'this sprint\'s instructions treat them as separate roles, so this entry is kept separate, with its own scope UNKNOWN.',
  },
  {
    id: 'cashier',
    name: 'Cashier',
    visibilityScope: 'UNKNOWN',
    groundedIn: 'Not defined in any document read for this implementation. The canonical Shift/Employee entities record cashier activity, but no document defines what a Cashier-role user should be able to see on a dashboard.',
  },
  {
    id: 'driver',
    name: 'Driver',
    visibilityScope: 'UNKNOWN',
    groundedIn: 'Not defined in any document read for this implementation. No canonical entity or role definition for "Driver" exists anywhere in this repository\'s documents.',
  },
  {
    id: 'future-admin',
    name: 'Future Admin',
    visibilityScope: 'UNKNOWN',
    groundedIn: 'Explicitly named as a placeholder for a not-yet-defined future role. No document establishes its scope.',
  },
]);

module.exports = { USER_ROLES };
