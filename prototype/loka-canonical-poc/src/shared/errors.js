// Typed errors for the pipeline. Each carries a `details` payload so a
// caller can act on structured data, not string-match `.message`.

class PipelineError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

/** Something required to start the pipeline is missing or invalid. */
class ConfigurationError extends PipelineError {}

/** Opening or reading the Realm backup failed. */
class ExtractionError extends PipelineError {}

/**
 * The backup's schema version does not match the configured last-known-good
 * version. Whether this is fatal is a policy decision (see config.js) —
 * this class exists so that policy can be enforced by type, not by string
 * matching a log message.
 */
class SchemaDriftError extends PipelineError {}

/** The validation step itself failed to run (not: a record failed a rule). */
class ValidationError extends PipelineError {}

/** Converting a raw record into its canonical shape failed unexpectedly. */
class NormalizationError extends PipelineError {}

/** Writing canonical.json or validation-report.json failed. */
class ExportError extends PipelineError {}

module.exports = {
  PipelineError,
  ConfigurationError,
  ExtractionError,
  SchemaDriftError,
  ValidationError,
  NormalizationError,
  ExportError,
};
