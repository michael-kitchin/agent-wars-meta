'use strict';

const fs = require('fs');
const path = require('path');
const { repoPath } = require('./lib/fileScan.cjs');
const { figure, round } = require('./lib/metricsWriter.cjs');
const { logDebug, logWarn } = require('./lib/harnessLogger.cjs');
const {
  DEVELOPMENT_CATEGORY,
  parseCoverageWindow,
  parseTogglCsv,
  secondsToHours,
} = require('./lib/togglParsing.cjs');

/**
 * Measures logged effort from the exported time-log summary: per-milestone hours, group
 * subtotals, the grand total, a ranking, and a grouping of milestones by problem domain.
 *
 * The coverage window travels with every figure. The series freezes this export rather
 * than re-pulling it, so a total quoted without its window would read as current when it
 * describes a closed period.
 */

/** Directory the export lives in, relative to the repository root. */
const TIME_LOG_DIRECTORY = '.social';

/**
 * Milestone buckets grouped by the problem domain that dominated them.
 *
 * The assignment is derived from each milestone's own execution-plan title in
 * `.spec/completed/` and the top-level development plan, not from intuition. Those titles
 * are quoted in the `evidence` field so the grouping can be audited rather than taken on
 * trust, which matters because any post using it must state its method openly.
 *
 * `M0.1-0.4` is a single combined bucket spanning four milestones in three different
 * domains, so it is grouped as mixed and excluded from per-domain attribution rather than
 * being arbitrarily assigned.
 */
const MILESTONE_DOMAINS = Object.freeze({
  'M0.1-0.4': { domain: 'mixed-foundation', evidence: 'Combined bucket: Hello Hex World, Game State and Turns, The LLM Opponent, Combat and Victory' },
  'M0.5, DevOps': { domain: 'llm-systems', evidence: 'Milestone 0.5 First MCP Tool, Tool 2 Threat and Situation Assessment, Tool 3 Combat Outcome Estimation' },
  'M0.6': { domain: 'llm-systems', evidence: 'Milestone 0.6 - Pre-Computation and Briefing Format' },
  'M0.7': { domain: 'llm-systems', evidence: 'Milestone 0.7 - Callback System and Event-Driven Consultation' },
  'M1.1': { domain: 'platform', evidence: 'Milestone 1.1 - Transition from 0.7 Prototype to Production Baseline' },
  'M1.2': { domain: 'geospatial', evidence: 'Milestone 1.2 - EarthEnv to H3 Terrain Pipeline' },
  'M1.3': { domain: 'geospatial', evidence: 'Milestone 1.3 - Fog of War and Subjective Views' },
  'M1.4': { domain: 'game-systems', evidence: 'Milestone 1.4 - Hex Control and Production Queues' },
  'M1.5': { domain: 'game-systems', evidence: 'Milestone 1.5 - Air Units, Strikes, and Infrastructure Effects' },
  'M1.6': { domain: 'game-systems', evidence: 'Milestone 1.6 - Naval Transport Sealift' },
  'M1.7': { domain: 'geospatial', evidence: 'Milestone 1.7 - Region-vs-Region Scenario' },
  'M2.1': { domain: 'game-systems', evidence: 'Milestone 2.1 - Tactical Battle Entry' },
  'M2.2': { domain: 'geospatial', evidence: 'Milestone 2.2 - Terrain-Blocked Tactical Movement' },
  'M2.3': { domain: 'game-systems', evidence: 'Milestone 2.3 - Bail-Out Resolution and AI Tactical Play' },
  'M2.4': { domain: 'game-systems', evidence: 'Milestone 2.4 - Tactical Integration and Balance' },
});

/**
 * Locates the time-log export.
 *
 * Matched by pattern rather than by a hard-coded name so a re-export with a different date
 * range is picked up automatically. Throws when none or several are present, since
 * guessing which of two exports is authoritative would silently change the series'
 * headline number.
 */
function findTimeLogFile() {
  logDebug('findTimeLogFile');
  const directory = repoPath(TIME_LOG_DIRECTORY);
  const candidates = fs
    .readdirSync(directory)
    .filter((name) => /^TogglTrack_Report.*\.csv$/i.test(name))
    .sort();
  if (candidates.length === 0) {
    throw new Error(`No TogglTrack export found in ${directory}`);
  }
  if (candidates.length > 1) {
    throw new Error(
      `Multiple TogglTrack exports found in ${directory}: ${candidates.join(', ')}. Keep exactly one so the frozen window is unambiguous.`,
    );
  }
  return { fileName: candidates[0], absolutePath: path.join(directory, candidates[0]) };
}

/**
 * Sums seconds across rows matching a predicate. Kept separate so every subtotal in the
 * measurement is produced the same way rather than by ad-hoc reduction at each call site.
 */
function sumSeconds(rows, predicate) {
  return rows.filter(predicate).reduce((total, row) => total + row.seconds, 0);
}

/**
 * Groups development hours by problem domain.
 *
 * Only development-and-test rows are grouped, because the non-milestone categories
 * (planning, promotion, fixes) do not attach to a domain. Buckets absent from
 * `MILESTONE_DOMAINS` are reported under `unassigned` so a new milestone shows up as a gap
 * rather than vanishing from the total.
 */
function groupByDomain(developmentRows) {
  logDebug('groupByDomain', () => ({ rowCount: developmentRows.length }));
  const byDomain = {};
  for (const row of developmentRows) {
    const mapping = MILESTONE_DOMAINS[row.milestone];
    const domain = mapping === undefined ? 'unassigned' : mapping.domain;
    if (mapping === undefined) {
      logWarn('groupByDomain: unmapped milestone bucket', row.milestone);
    }
    if (byDomain[domain] === undefined) {
      byDomain[domain] = { seconds: 0, milestones: [] };
    }
    byDomain[domain].seconds += row.seconds;
    byDomain[domain].milestones.push(row.milestone);
  }
  const result = {};
  for (const [domain, entry] of Object.entries(byDomain)) {
    result[domain] = {
      hours: secondsToHours(entry.seconds),
      milestones: entry.milestones.sort(),
    };
  }
  return result;
}

/**
 * Produces the full effort measurement.
 *
 * Every hours value derives from a seconds subtotal, never from summing rounded hours.
 * The returned object carries the coverage window at the top level so a consumer cannot
 * pick up a total without also having access to the period it covers.
 */
function measureEffort() {
  logDebug('measureEffort');
  const { fileName, absolutePath } = findTimeLogFile();
  const rows = parseTogglCsv(fs.readFileSync(absolutePath, 'utf8'));
  const window = parseCoverageWindow(fileName);
  if (window.from === null) {
    logWarn('measureEffort: coverage window not parseable from filename', fileName);
  }

  const isDevelopment = (row) => row.category === DEVELOPMENT_CATEGORY;
  const developmentRows = rows.filter(isDevelopment);
  const totalSeconds = sumSeconds(rows, () => true);
  const developmentSeconds = sumSeconds(rows, isDevelopment);

  const milestoneHours = {};
  for (const row of developmentRows) {
    milestoneHours[row.milestone] = secondsToHours(row.seconds);
  }

  const ranked = developmentRows
    .slice()
    .sort((left, right) => right.seconds - left.seconds)
    .map((row) => ({ milestone: row.milestone, hours: secondsToHours(row.seconds) }));

  const otherCategories = {};
  for (const row of rows.filter((candidate) => !isDevelopment(candidate))) {
    const label = row.milestone === null ? row.category : `${row.category} (${row.milestone})`;
    otherCategories[label] = secondsToHours(row.seconds);
  }

  const windowLabel =
    window.from === null ? 'window not parseable' : `${window.from} to ${window.to}`;
  const sourceNote = `time-log export ${fileName}, covering ${windowLabel}`;

  return {
    source: sourceNote,
    coverageWindow: {
      from: figure(window.from, `parsed from the export filename ${fileName}`),
      to: figure(window.to, `parsed from the export filename ${fileName}`),
      frozen: figure(
        true,
        'the series freezes this window rather than re-exporting; quote hours as covering it, never the present',
      ),
    },
    totals: {
      rowCount: figure(rows.length, sourceNote),
      developmentBucketCount: figure(developmentRows.length, `${sourceNote}, rows categorised "${DEVELOPMENT_CATEGORY}"`),
      developmentSeconds: figure(developmentSeconds, sourceNote),
      developmentHours: figure(secondsToHours(developmentSeconds), 'derived: development seconds / 3600'),
      grandTotalSeconds: figure(totalSeconds, sourceNote),
      grandTotalHours: figure(secondsToHours(totalSeconds), 'derived: total seconds / 3600'),
      approximateHoursForProse: figure(
        Math.round(secondsToHours(totalSeconds)),
        'derived: grand total rounded to whole hours, the form prose should use',
      ),
      workWeeksAtForty: figure(
        round(secondsToHours(totalSeconds) / 40, 1),
        'derived: grand total hours / 40',
      ),
    },
    milestoneHours: figure(milestoneHours, `${sourceNote}, per development bucket`),
    ranking: figure(ranked, 'derived: development buckets sorted by seconds, descending'),
    otherCategories: figure(otherCategories, `${sourceNote}, non-development rows`),
    byDomain: figure(
      groupByDomain(developmentRows),
      'derived: development buckets grouped by the domain named in each milestone execution-plan title',
    ),
    domainMethod: figure(
      MILESTONE_DOMAINS,
      'domain assignment with the milestone title that justifies it; state this method wherever the grouping is used',
    ),
    limitations: figure(
      [
        'This export is a summary by task. It carries no phase breakdown, so design, generation, review, and debugging hours cannot be separated.',
        'Any claim about debug hours specifically is therefore not derivable from this artifact and must remain a placeholder.',
        'The M0.1-0.4 bucket combines four milestones across three domains and is grouped as mixed rather than attributed.',
      ],
      'stated limitations of the summary export',
    ),
  };
}

/** Prints the measurement when run directly, for checking against expected values. */
if (require.main === module) {
  process.stdout.write(`${JSON.stringify(measureEffort(), null, 2)}\n`);
}

module.exports = {
  TIME_LOG_DIRECTORY,
  MILESTONE_DOMAINS,
  findTimeLogFile,
  sumSeconds,
  groupByDomain,
  measureEffort,
};
