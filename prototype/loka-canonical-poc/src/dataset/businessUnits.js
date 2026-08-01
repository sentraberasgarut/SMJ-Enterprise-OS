// Business Unit schema preparation for Dashboard Dataset v1.
//
// This is SCHEMA ONLY — no multi-business logic. Today's canonical
// pipeline covers exactly one business unit (Toko Sembako Sejahtera, via
// its one connected source, Loka). Every other entry below is a prepared
// placeholder for future onboarding, not an active data path.
//
// Grounding, entry by entry:
//   - Toko Sembako Sejahtera: ADR-0003 §3 (Loka POS + Buku Toko named
//     Authoritative Sources for this unit specifically); this is the only
//     unit the connector and canonical pipeline actually cover today.
//   - Central Kitchen: named in ADR-0004's Purpose and ADR-0003's scope
//     (CK catalog, CK pricing authority under Ibu & Teh Nurul, Canonical
//     Data Contract §4/§6); its own Authoritative Source is explicitly
//     unresolved (Production Architecture §10, Open Decisions).
//   - Sederhana Jaya 1 / Sederhana Jaya 4: named in the Enterprise OS
//     Blueprint's Enterprise Context diagram ("Central Kitchen (supplies
//     SJ1, SJ4)") and present today only as Customer records in Loka
//     (Canonical Data Contract §4's Branch/Customer overlap, an
//     unresolved open item) — not as an independent data source.
//   - Warung Makan Padang: named directly by the CEO in this sprint's
//     instructions. Not described in any repository document read for
//     this implementation — included here because it was explicitly
//     requested, with that fact stated plainly rather than implied to be
//     already-documented.

const BUSINESS_UNITS = Object.freeze([
  {
    id: 'tss',
    name: 'Toko Sembako Sejahtera',
    status: 'active',
    dataConnected: true,
    authoritativeSources: ['Loka POS', 'Buku Toko'],
    businessOwner: 'CEO',
    groundedIn: 'ADR-0003 §3',
    note: 'The only business unit the connector, canonical pipeline, and Reporting Service actually cover today.',
  },
  {
    id: 'central-kitchen',
    name: 'Central Kitchen',
    status: 'not-onboarded',
    dataConnected: false,
    authoritativeSources: 'UNKNOWN — unresolved (Production Architecture §10, Open Decisions)',
    businessOwner: 'Ibu & Teh Nurul',
    groundedIn: 'ADR-0003 §1–§2, §5; ADR-0004 Purpose; Canonical Data Contract §4/§6',
    note: 'Catalog pricing gap already documented (130+ items at Rp0, ADR-0003 §2) — a known data-quality issue in the source system, independent of onboarding status.',
  },
  {
    id: 'sj1',
    name: 'Sederhana Jaya 1',
    status: 'not-onboarded',
    dataConnected: false,
    authoritativeSources: 'UNKNOWN — currently exists only as a Customer record in Loka, not an independent source',
    businessOwner: 'CEO',
    groundedIn: 'Enterprise OS Blueprint §1 (Enterprise Context diagram); Canonical Data Contract §4 (Branch/Customer overlap, unresolved)',
    note: 'Branch-as-Customer overlap (Business Rules Catalog CUS-001) means this unit\'s own transactions are not currently separable from TSS retail sales.',
  },
  {
    id: 'sj4',
    name: 'Sederhana Jaya 4',
    status: 'not-onboarded',
    dataConnected: false,
    authoritativeSources: 'UNKNOWN — same reasoning as Sederhana Jaya 1',
    businessOwner: 'CEO',
    groundedIn: 'Enterprise OS Blueprint §1 (Enterprise Context diagram); Canonical Data Contract §4 (Branch/Customer overlap, unresolved)',
    note: 'Same reasoning as Sederhana Jaya 1.',
  },
  {
    id: 'warung-makan-padang',
    name: 'Warung Makan Padang',
    status: 'not-onboarded',
    dataConnected: false,
    authoritativeSources: 'UNKNOWN — not described in any repository document',
    businessOwner: 'UNKNOWN',
    groundedIn: 'Named directly in this sprint\'s instructions, not in any prior document',
    note: 'Included because explicitly requested. No document establishes this unit\'s data sources, ownership, or relationship to the other business units.',
  },
]);

module.exports = { BUSINESS_UNITS };
