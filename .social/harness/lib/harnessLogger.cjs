'use strict';

/**
 * Levelled logging for the blog measurement harness.
 *
 * The harness deliberately does not reuse the application's logger under
 * `src/main/logger.ts`: that module carries product concerns (a debug log file path,
 * Electron-aware behaviour) that a measurement script has no business inheriting, and
 * importing it would couple documentation tooling to the shipped runtime.
 *
 * Verbosity comes from the `AGENT_WARS_HARNESS_LOG_LEVEL` environment variable so a run
 * can be made chatty without editing code. The default is quiet on purpose, because the
 * normal use of these scripts is to read their measured output rather than their trace.
 */

/**
 * Ordered severity ranks. A message is emitted when its own rank is less than or equal
 * to the configured level's rank, so raising the configured level widens output.
 * Exported for the tests, which assert the ordering rather than hard-coding numbers.
 */
const LOG_LEVEL_RANKS = Object.freeze({
  silent: 0,
  error: 1,
  warn: 2,
  debug: 3,
  trace: 4,
});

/** Level used when the environment variable is unset or unrecognised. */
const DEFAULT_LOG_LEVEL = 'warn';

/** Environment variable read once per process to decide verbosity. */
const LOG_LEVEL_ENV_VAR = 'AGENT_WARS_HARNESS_LOG_LEVEL';

/**
 * Resolves the active level from the environment, falling back to the default when the
 * variable is absent or names a level that does not exist. Read on every call rather
 * than cached so a test can change the variable and see the effect without reloading
 * the module; the cost is a property lookup, which is irrelevant at this scale.
 */
function resolveConfiguredLevel() {
  const raw = String(process.env[LOG_LEVEL_ENV_VAR] ?? '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVEL_RANKS, raw) ? raw : DEFAULT_LOG_LEVEL;
}

/**
 * Reports whether messages at `level` would currently be emitted. Callers generally do
 * not need this — the log functions check for themselves — but it is worth using to
 * guard genuinely expensive detail that cannot be expressed as a thunk.
 */
function isLevelEnabled(level) {
  const wanted = LOG_LEVEL_RANKS[level];
  if (wanted === undefined) return false;
  return wanted <= LOG_LEVEL_RANKS[resolveConfiguredLevel()];
}

/**
 * Renders a detail payload for output. A function is invoked so callers can defer
 * building large strings until the level check has already passed; anything else is
 * JSON-encoded, with a fallback for values JSON cannot represent (circular structures,
 * BigInt) so that logging can never itself throw.
 */
function renderDetail(detail) {
  if (detail === undefined) return '';
  const value = typeof detail === 'function' ? detail() : detail;
  if (value === undefined) return '';
  if (typeof value === 'string') return ` ${value}`;
  try {
    return ` ${JSON.stringify(value)}`;
  } catch {
    return ` ${String(value)}`;
  }
}

/**
 * Emits one line if the level allows it. Every public log function funnels through here
 * so the level check and the detail rendering exist in exactly one place. Errors and
 * warnings go to stderr so a caller can redirect measured output on stdout without
 * losing diagnostics.
 */
function emit(level, message, detail) {
  if (!isLevelEnabled(level)) return;
  const line = `[harness:${level}] ${message}${renderDetail(detail)}`;
  if (level === 'error' || level === 'warn') {
    process.stderr.write(`${line}\n`);
    return;
  }
  process.stdout.write(`${line}\n`);
}

/**
 * Records a caught exception. Always call this from a `catch` block before rethrowing or
 * recovering, and pass the path or identifier being processed so a failure can be traced
 * to the artifact that caused it rather than only to a stack.
 */
function logError(message, detail) {
  emit('error', message, detail);
}

/**
 * Records a condition that did not stop the run but that a reader should know about — a
 * stale input, a skipped file, a figure that could not be derived.
 */
function logWarn(message, detail) {
  emit('warn', message, detail);
}

/**
 * Records the invocation of a public harness function together with its arguments. Every
 * exported function in this harness calls this on entry, which is what makes a failed
 * measurement diagnosable after the fact.
 */
function logDebug(message, detail) {
  emit('debug', message, detail);
}

/**
 * Records fine-grained progress that does not modify state: per-file reads, per-row
 * parses, accessor calls. Off by default because a whole-repository scan would otherwise
 * emit thousands of lines.
 */
function logTrace(message, detail) {
  emit('trace', message, detail);
}

module.exports = {
  LOG_LEVEL_RANKS,
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL_ENV_VAR,
  isLevelEnabled,
  logError,
  logWarn,
  logDebug,
  logTrace,
};
