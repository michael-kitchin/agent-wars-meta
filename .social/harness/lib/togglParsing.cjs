'use strict';

const { logDebug, logTrace, logError } = require('./harnessLogger.cjs');

/**
 * Parsing for the exported time-log summary.
 *
 * The export is a small quoted CSV, so this module carries a minimal field-aware parser
 * rather than a dependency. It deliberately reads only the task name and duration
 * columns: the export also contains a member name and email address, and none of the
 * harness's outputs should carry personal data into version control.
 */

/** Prefix every task name in this export shares, stripped before categorising. */
const TASK_NAME_PREFIX = 'AgentWars: ';

/** Category assigned to rows that record development and test work against a milestone. */
const DEVELOPMENT_CATEGORY = 'Dev & Test';

/**
 * Splits one CSV line into fields, honouring double quotes.
 *
 * Handles the doubled-quote escape (`""`) even though the current export does not use it,
 * because a task name containing a quote would otherwise shift every later column and
 * corrupt the durations silently.
 */
function splitCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  fields.push(current);
  return fields;
}

/**
 * Converts an `H:MM:SS` duration to whole seconds.
 *
 * Hours are unbounded and routinely exceed 24 in this export, so this must not be treated
 * as a clock time. Aggregate in seconds and convert to hours only for presentation;
 * summing rounded hours across eighteen rows loses enough to move a published total.
 */
function parseDurationSeconds(text) {
  logTrace('parseDurationSeconds', text);
  const parts = String(text).trim().split(':');
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) {
    throw new Error(`Unparseable duration "${text}"; expected H:MM:SS`);
  }
  const [hours, minutes, seconds] = parts.map((part) => Number.parseInt(part, 10));
  if (minutes > 59 || seconds > 59) {
    throw new Error(`Duration "${text}" has an out-of-range minute or second component`);
  }
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Splits a task name into its category and optional milestone label.
 *
 * Task names take the form `AgentWars: <category> (<milestone>)`, with the parenthesised
 * milestone absent on non-milestone work such as planning and promotion. Returns a null
 * milestone in that case rather than inventing a bucket.
 */
function parseTaskName(rawTask) {
  logTrace('parseTaskName', rawTask);
  const withoutPrefix = String(rawTask).startsWith(TASK_NAME_PREFIX)
    ? String(rawTask).slice(TASK_NAME_PREFIX.length)
    : String(rawTask);
  const match = withoutPrefix.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match === null) {
    return { category: withoutPrefix.trim(), milestone: null };
  }
  return { category: match[1].trim(), milestone: match[2].trim() };
}

/**
 * Parses the coverage window out of the export's filename.
 *
 * The window matters because the series freezes it: every hours-derived figure is stated
 * as covering this range rather than the present. Returns nulls if the filename does not
 * carry a recognisable range, which the caller must surface rather than ignore.
 */
function parseCoverageWindow(fileName) {
  logDebug('parseCoverageWindow', fileName);
  const match = String(fileName).match(/from_(\d{2})_(\d{2})_(\d{4})_to_(\d{2})_(\d{2})_(\d{4})/);
  if (match === null) return { from: null, to: null };
  const [, fromMonth, fromDay, fromYear, toMonth, toDay, toYear] = match;
  return {
    from: `${fromYear}-${fromMonth}-${fromDay}`,
    to: `${toYear}-${toMonth}-${toDay}`,
  };
}

/**
 * Parses the whole export into rows carrying category, milestone, and seconds.
 *
 * Skips the header and any blank trailing line. Throws on a row whose duration cannot be
 * parsed, because a dropped row would understate the project total that leads the series.
 */
function parseTogglCsv(content) {
  logDebug('parseTogglCsv', () => ({ chars: content.length }));
  const lines = String(content)
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('Time-log export has no data rows');

  const header = splitCsvLine(lines[0]).map((field) => field.trim());
  const taskIndex = header.indexOf('Task');
  const durationIndex = header.indexOf('Duration');
  if (taskIndex === -1 || durationIndex === -1) {
    throw new Error(`Time-log export lacks Task or Duration columns; header was ${header.join('|')}`);
  }

  const rows = [];
  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);
    const rawTask = fields[taskIndex];
    try {
      const { category, milestone } = parseTaskName(rawTask);
      rows.push({
        task: rawTask,
        category,
        milestone,
        seconds: parseDurationSeconds(fields[durationIndex]),
      });
    } catch (error) {
      logError('parseTogglCsv row failed', { task: rawTask, message: error.message });
      throw error;
    }
  }
  return rows;
}

/**
 * Converts seconds to hours, rounded to two decimals.
 *
 * Two decimals is enough for the series, which states hours approximately, while keeping
 * enough precision that a reader summing the buckets lands on the stated total.
 */
function secondsToHours(seconds) {
  return Math.round((seconds / 3600) * 100) / 100;
}

module.exports = {
  TASK_NAME_PREFIX,
  DEVELOPMENT_CATEGORY,
  splitCsvLine,
  parseDurationSeconds,
  parseTaskName,
  parseCoverageWindow,
  parseTogglCsv,
  secondsToHours,
};
