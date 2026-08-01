// Every canonical record carries the same provenance block. Extracted here
// so every entity module builds it identically, per the Provenance
// requirement in the Data Governance Framework (§7) and the minimum
// metadata findings in research/loka-ingestion-poc.md.

function provenance(meta) {
  return {
    sourceFile: meta.sourceFile,
    sourceChecksum: meta.sourceChecksum,
    connectorVersion: meta.connectorVersion,
    ingestedAt: meta.extractedAt,
  };
}

module.exports = { provenance };
