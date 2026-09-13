'use strict';

const fs = require('node:fs');

const { repoPath } = require('./lib/fileScan.cjs');
const { writeMetricsJson, writeSnapshotMarkdown } = require('./lib/metricsWriter.cjs');
const { SNAPSHOT_LAYOUT, resolveFigure } = require('./lib/snapshotLayout.cjs');
const { logDebug, logError, logWarn } = require('./lib/harnessLogger.cjs');
const { measureCodebase } = require('./measureCodebase.cjs');
const { measureEffort } = require('./measureEffort.cjs');
const { measureSpecCorpus } = require('./measureSpecCorpus.cjs');
const { measurePrompts } = require('./measurePrompts.cjs');
const { measureToolSurface } = require('./measureToolSurface.cjs');
const { measureCircularDeps } = require('./measureCircularDeps.cjs');
const { measureModuleHistory } = require('./measureModuleHistory.cjs');
const { measureGitHistory } = require('./measureGitHistory.cjs');

/**
 * Runs every measurement and writes the two evidence outputs.
 *
 * A failing section is recorded and reported rather than aborting the run, because the posts
 * consume these figures independently: a stale build breaking the tool-surface measurement
 * should not stop someone from drafting the post about logged hours. The process still exits
 * non-zero so a failure cannot pass unnoticed in a scripted context.
 *
 * Usage:
 *   node .social/harness/runAllMeasurements.cjs
 *   node .social/harness/runAllMeasurements.cjs --skip-history   (faster; skips the git scan)
 *
 * Set AGENT_WARS_HARNESS_LOG_LEVEL=debug to see each step.
 */

/** Where the machine-readable output goes. */
const METRICS_JSON_PATH = '.social/evidence/metrics.json';

/** Where the writer-facing output goes. */
const SNAPSHOT_MARKDOWN_PATH = '.social/evidence/metricsSnapshot.md';

/**
 * Reads the previously written metrics document, or null when there isn't one.
 *
 * Used only to carry a deliberately skipped section forward. Any read or parse problem is
 * treated as "no previous document" rather than as an error, because this is an optimisation
 * and a corrupt earlier file must not stop a fresh measurement.
 */
function readPreviousMetrics() {
  logDebug('readPreviousMetrics');
  try {
    return JSON.parse(fs.readFileSync(repoPath(METRICS_JSON_PATH), 'utf8'));
  } catch (error) {
    logDebug('readPreviousMetrics: no usable previous document', error.message);
    return null;
  }
}

/**
 * Carries a skipped section forward from the previous run so a fast run doesn't degrade the
 * evidence file.
 *
 * Skipping the commit-history scan is a convenience for iterating, and without this the skipped
 * run would overwrite good figures with empty ones -- which then makes every draft quoting them
 * fail the draft checker for no real reason. Each carried figure keeps its original measurement
 * timestamp and gains a note saying it was not re-measured, so a stale value can never pass as
 * fresh.
 */
function carryForwardSection(previous, sectionName) {
  logDebug('carryForwardSection', sectionName);
  const carried = previous?.[sectionName];
  if (carried === null || carried === undefined || typeof carried !== 'object') {
    logWarn('carryForwardSection: nothing to carry', sectionName);
    return null;
  }
  return {
    ...carried,
    source: `carried forward from the previous run without re-measuring (${carried.source ?? 'unknown source'})`,
  };
}

/**
 * Runs one measurement, converting a throw into a recorded failure.
 *
 * The section name doubles as the key in the merged metrics object and as the label in the
 * failure list, so a reader of either output can tell exactly which measurement is missing.
 */
function runSection(name, measure, failures) {
  logDebug('runSection', name);
  try {
    return measure();
  } catch (error) {
    logError('runSection failed', { section: name, message: error.message });
    failures.push({ section: name, message: error.message });
    return { source: 'measurement failed', error: error.message };
  }
}

/**
 * Builds the writer-facing snapshot model from merged metrics.
 *
 * Rows whose path does not resolve are rendered as unavailable, which is how a failed section
 * becomes visible to a draft writer as a hole to place a placeholder in rather than as a
 * silently absent line.
 */
function buildSnapshotModel(metrics, failures) {
  logDebug('buildSnapshotModel');
  const sections = SNAPSHOT_LAYOUT.map((section) => ({
    heading: section.heading,
    intro: section.intro,
    rows: section.rows.map((row) => {
      const resolved = resolveFigure(metrics, row.path);
      if (resolved === null) {
        logWarn('buildSnapshotModel: unresolved figure', row.path);
        return {
          label: row.label,
          value: 'unavailable — use a placeholder',
          source: row.path,
          stability: 'stable',
        };
      }
      return {
        label: row.label,
        value: resolved.value,
        source: resolved.source,
        stability: resolved.stability,
      };
    }),
  }));

  return {
    generatedAt: new Date().toISOString(),
    intro: [
      'Every inline figure in a draft must appear here. Anything absent is a `[DATA]` placeholder.',
      '',
      'Figures marked **volatile** grow with ordinary development and must be re-measured before',
      'the post quoting them publishes. Hours figures cover a frozen window and must never be',
      'written as though they describe the present.',
    ].join('\n'),
    failures,
    sections,
  };
}

/**
 * Runs everything and writes both outputs.
 *
 * `options.skipHistory` disables the module-peak scan and the git-history scan, which are
 * the slow parts; the rest of the run completes in about a second. Both sections are
 * carried forward from the previous evidence file rather than blanked.
 */
function runAllMeasurements(options = {}) {
  logDebug('runAllMeasurements', options);
  const failures = [];
  const skipHistory = options.skipHistory === true;
  const previous = skipHistory ? readPreviousMetrics() : null;
  const carriedHistory = skipHistory ? carryForwardSection(previous, 'moduleHistory') : null;
  const carriedGitHistory = skipHistory ? carryForwardSection(previous, 'gitHistory') : null;

  const effort = runSection('effort', measureEffort, failures);
  const loggedHours = effort?.totals?.grandTotalHours?.value ?? null;

  const metrics = {
    generatedAt: new Date().toISOString(),
    note: 'Generated by .social/harness/runAllMeasurements.cjs. Do not hand-edit.',
    effort,
    codebase: runSection('codebase', () => measureCodebase({ loggedHours }), failures),
    specCorpus: runSection('specCorpus', measureSpecCorpus, failures),
    prompts: runSection('prompts', measurePrompts, failures),
    toolSurface: runSection('toolSurface', measureToolSurface, failures),
    circularDeps: runSection('circularDeps', measureCircularDeps, failures),
    moduleHistory:
      carriedHistory ??
      runSection('moduleHistory', () => measureModuleHistory({ enabled: !skipHistory }), failures),
    gitHistory:
      carriedGitHistory ??
      runSection('gitHistory', () => measureGitHistory({ enabled: !skipHistory }), failures),
  };

  writeMetricsJson(metrics, repoPath(METRICS_JSON_PATH));
  writeSnapshotMarkdown(buildSnapshotModel(metrics, failures), repoPath(SNAPSHOT_MARKDOWN_PATH));

  return { metrics, failures };
}

/**
 * Entry point when run directly. Prints a short summary and exits non-zero if any section
 * failed, so a scripted caller can gate on the result.
 */
function main() {
  const skipHistory = process.argv.includes('--skip-history');
  const { failures } = runAllMeasurements({ skipHistory });

  process.stdout.write(`\nwrote ${METRICS_JSON_PATH}\nwrote ${SNAPSHOT_MARKDOWN_PATH}\n`);
  if (failures.length === 0) {
    process.stdout.write('all measurement sections succeeded\n');
    return;
  }
  process.stdout.write(`\n${failures.length} section(s) failed:\n`);
  for (const failure of failures) {
    process.stdout.write(`  ${failure.section}: ${failure.message}\n`);
  }
  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  METRICS_JSON_PATH,
  SNAPSHOT_MARKDOWN_PATH,
  runSection,
  readPreviousMetrics,
  carryForwardSection,
  buildSnapshotModel,
  runAllMeasurements,
};
