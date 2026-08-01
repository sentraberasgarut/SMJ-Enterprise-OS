// ============================================================================
// Dataset Publisher Interface — Enterprise Integration Layer
// ============================================================================
//
// Decouples "a connector produced new canonical data" from "how that
// becomes a published dataset" (today: dashboard-dataset.json copied to
// Drive by hand; tomorrow: possibly automatic, possibly a different
// dataset entirely for a different connector). This file does not know
// about Drive, dashboard-dataset.json, or datasetBuilder.js — it defines
// the seam a publisher implementation plugs into.
//
// publish() itself is a stub — a real publish target (e.g. Drive) is
// environment-specific and out of scope for this layer. The hook
// registry around it is real, working code.
// ============================================================================

const { PublishError } = require('./errorContract');

let _publishImpl = null;
const _beforePublish = [];
const _afterPublish = [];

/**
 * A concrete environment (Apps Script, a future server, a test) supplies
 * the actual write. Nothing in this file assumes what that looks like.
 * @param {function(string, *, Object): Promise<Object>} impl (datasetName, payload, metadata) -> result
 */
function setPublishImplementation(impl) {
  if (typeof impl !== 'function') throw new PublishError('setPublishImplementation requires a function.', { stage: 'publish' });
  _publishImpl = impl;
}

function onBeforePublish(fn) { _beforePublish.push(_asFn(fn)); }
function onAfterPublish(fn) { _afterPublish.push(_asFn(fn)); }
function _asFn(fn) {
  if (typeof fn !== 'function') throw new PublishError('Hook must be a function.', { stage: 'publish' });
  return fn;
}

/**
 * @param {string} datasetName e.g. "dashboard-dataset" — connector-agnostic label
 * @param {*} payload
 * @param {Object} [metadata]
 * @returns {Promise<Object>}
 */
async function publish(datasetName, payload, metadata = {}) {
  for (const hook of _beforePublish) await hook(datasetName, payload, metadata);

  if (!_publishImpl) {
    throw new PublishError(
      `No publish implementation registered for dataset "${datasetName}" — call setPublishImplementation() first.`,
      { stage: 'publish', details: { datasetName } }
    );
  }

  const result = await _publishImpl(datasetName, payload, metadata);
  for (const hook of _afterPublish) await hook(datasetName, result, metadata);
  return result;
}

/** Test/reset helper. */
function _reset() {
  _publishImpl = null;
  _beforePublish.length = 0;
  _afterPublish.length = 0;
}

module.exports = { setPublishImplementation, onBeforePublish, onAfterPublish, publish, _reset };
