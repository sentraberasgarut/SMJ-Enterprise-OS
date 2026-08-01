// Customer entity definition.

const { provenance } = require('../shared/provenance');

module.exports = {
  name: 'Customer',
  isTopLevel: true,
  requiredFields: ['id', 'name', 'phoneNumber'],

  normalize(raw, meta) {
    return {
      id: raw.id ?? null,
      name: raw.name ?? null,
      phoneNumber: raw.phoneNumber ?? null,
      address: raw.address ?? null,
      email: raw.email ?? null,
      loyaltyPoints: raw.loyaltyPoints ?? null,
      // TODO: Branch-as-Customer detection. loka-schema-analysis.md observed
      // that at least one Customer record is actually a Sederhana Jaya
      // branch, identifiable by its phone number matching a known branch
      // line. No document establishes a formal rule or registry for this
      // detection, and this prototype does not invent one by hardcoding a
      // specific phone number as a rule. Left as an explicit TODO rather
      // than a guessed heuristic.
      _isPossibleBranch: null, // TODO: populate once a branch registry exists
      _provenance: provenance(meta),
    };
  },

  // No entity-specific validation rules beyond the generic ones
  // (duplicate id, empty required value) — nothing here yet.
  validate() {
    return [];
  },
};
