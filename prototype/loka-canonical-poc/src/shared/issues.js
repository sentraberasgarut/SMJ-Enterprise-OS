// Shared shape for a validation issue, used by both the generic checks in
// validate.js and every entity's own custom validate() function, so every
// issue in validation-report.json has the same fields regardless of which
// rule produced it.

function makeIssue(entity, id, rule, message, severity = 'warning') {
  return { entity, id: id ?? null, rule, message, severity };
}

module.exports = { makeIssue };
