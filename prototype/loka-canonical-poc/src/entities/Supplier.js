// Supplier entity definition.

const { provenance } = require('../shared/provenance');

module.exports = {
  name: 'Supplier',
  isTopLevel: true,
  requiredFields: ['id', 'name', 'phoneNumber'],

  normalize(raw, meta) {
    return {
      id: raw.id ?? null,
      name: raw.name ?? null,
      phoneNumber: raw.phoneNumber ?? null,
      email: raw.email ?? null,
      address: raw.address ?? null,
      contactPerson: raw.contactPerson ?? null,
      _provenance: provenance(meta),
    };
  },

  validate() {
    return [];
  },
};
