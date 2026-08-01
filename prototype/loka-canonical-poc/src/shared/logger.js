// Structured logging. Replaces plain console.log/console.error calls with
// leveled, run-tagged, timestamped log lines — still written to stdout
// (no new infrastructure decision made here; where logs are ultimately
// stored is an infrastructure/deployment decision, out of scope for this
// refactor per implementation/production-readiness-checklist.md).

const crypto = require('crypto');

const LEVELS = ['debug', 'info', 'warn', 'error'];

class Logger {
  constructor(runId) {
    this.runId = runId || crypto.randomUUID();
    this.startedAt = new Date();
  }

  _emit(level, message, meta) {
    const line = {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta ? { meta } : {}),
    };
    const text = JSON.stringify(line);
    if (level === 'error') {
      console.error(text);
    } else {
      console.log(text);
    }
  }

  debug(message, meta) {
    this._emit('debug', message, meta);
  }

  info(message, meta) {
    this._emit('info', message, meta);
  }

  warn(message, meta) {
    this._emit('warn', message, meta);
  }

  error(message, meta) {
    this._emit('error', message, meta);
  }

  /** Milliseconds since this logger (and therefore this run) started. */
  elapsedMs() {
    return Date.now() - this.startedAt.getTime();
  }

  /**
   * Emits the final structured run summary: run ID, timestamps, duration,
   * entity counts, validation summary, and export summary — the exact set
   * this refactor was asked to guarantee every run reports.
   */
  runSummary({ entityCounts, canonicalCounts, validationSummary, exportSummary }) {
    const finishedAt = new Date();
    const summary = {
      runId: this.runId,
      startedAt: this.startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - this.startedAt.getTime(),
      entityCounts,
      canonicalCounts,
      validationSummary,
      exportSummary,
    };
    this.info('run summary', summary);
    return summary;
  }
}

module.exports = { Logger, LEVELS };
