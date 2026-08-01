// Responsibility: write canonical.json and validation-report.json to the
// output directory. No business logic, no interpretation — just I/O.

const fs = require('fs');
const path = require('path');
const { ExportError } = require('./shared/errors');

function exportResults(outputDir, canonical, validationReport, logger) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    throw new ExportError(`Failed to create output directory: ${err.message}`, { outputDir, cause: err.message });
  }

  const canonicalPath = path.join(outputDir, 'canonical.json');
  const reportPath = path.join(outputDir, 'validation-report.json');

  try {
    fs.writeFileSync(canonicalPath, JSON.stringify(canonical, null, 2), 'utf-8');
  } catch (err) {
    throw new ExportError(`Failed to write canonical.json: ${err.message}`, { canonicalPath, cause: err.message });
  }

  try {
    fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2), 'utf-8');
  } catch (err) {
    throw new ExportError(`Failed to write validation-report.json: ${err.message}`, { reportPath, cause: err.message });
  }

  if (logger) {
    logger.debug('export complete', { canonicalPath, reportPath });
  }

  return { canonicalPath, reportPath };
}

module.exports = { exportResults };
