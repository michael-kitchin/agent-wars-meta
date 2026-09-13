'use strict';

const fs = require('fs');
const path = require('path');
const { resolveFileSet, repoPath } = require('./lib/fileScan.cjs');
const { measureFile } = require('./lib/lineCounting.cjs');
const { figure, volatileFigure, round } = require('./lib/metricsWriter.cjs');
const { logDebug, logWarn } = require('./lib/harnessLogger.cjs');

/**
 * Measures the design-document corpus: how many completed plans exist, how large they are,
 * which are biggest, and how the top-level plans were versioned rather than patched.
 *
 * Everything here is marked volatile. The corpus grows with every completed milestone, and
 * the series plan's own stated figures are already out of date against it — which is
 * precisely why these numbers are measured at publish time rather than transcribed.
 */

/** How many of the largest documents to report, enough to source a "largest plans" claim. */
const LARGEST_DOCUMENT_COUNT = 10;

/**
 * Top-level design documents whose version history is the evidence that even the highest
 * level of design was regenerated rather than patched.
 *
 * Superseded versions live in `.spec/deprecated/` while current ones live in `docs/`, so
 * both locations are named here. The filename typo in the current development plan is
 * reproduced deliberately: it is the real path on disk and correcting it here would make
 * the lookup fail.
 */
const TOP_LEVEL_PLAN_VERSIONS = Object.freeze([
  { label: 'game vision v1', relativePath: '.spec/deprecated/game-vision-v1.md', status: 'superseded' },
  { label: 'game vision v2', relativePath: 'docs/game-vision-v2.md', status: 'current' },
  { label: 'development plan v1', relativePath: '.spec/deprecated/development-plan-v1.md', status: 'superseded' },
  { label: 'development plan v2', relativePath: '.spec/deprecated/development-plan-v2.md', status: 'superseded' },
  { label: 'development plan v3.3', relativePath: 'docs/devleopment-plan-v3.3.md', status: 'current' },
]);

/** Filename pattern identifying the repeated maintainability consolidation campaigns. */
const CONSOLIDATION_PLAN_PATTERN = /^maintainability-consolidation-execution-plan(-v(\d+))?\.md$/;

/** Bytes per kilobyte used when reporting document sizes in the form prose uses. */
const BYTES_PER_KB = 1024;

/** Rounds a byte count to whole kilobytes, the granularity the drafts quote sizes at. */
function toKilobytes(bytes) {
  return Math.round(bytes / BYTES_PER_KB);
}

/**
 * Measures every completed spec and returns per-file sizes sorted largest first.
 *
 * Sizes are byte counts rather than line counts, because a design document's weight is
 * better represented by its prose volume than by how its author wrapped lines.
 */
function measureCompletedSpecs() {
  logDebug('measureCompletedSpecs');
  return resolveFileSet('spec-corpus')
    .map((filePath) => {
      const measured = measureFile(filePath);
      return {
        name: path.basename(filePath),
        bytes: measured.bytes,
        kilobytes: toKilobytes(measured.bytes),
      };
    })
    .sort((left, right) => right.bytes - left.bytes);
}

/**
 * Counts the maintainability consolidation campaigns.
 *
 * The unversioned filename is the first campaign and the `-vN` suffixed ones follow, so
 * the campaign count is the number of matching files. Reported because the series treats
 * repeated consolidation as the least-reported cost of agent-generated code.
 */
function measureConsolidationCampaigns() {
  logDebug('measureConsolidationCampaigns');
  const directory = repoPath('.spec', 'completed');
  const matches = fs
    .readdirSync(directory)
    .filter((name) => CONSOLIDATION_PLAN_PATTERN.test(name))
    .sort();
  return {
    count: matches.length,
    files: matches,
  };
}

/**
 * Measures the top-level plan version arc.
 *
 * A missing entry is warned about and reported with a null size rather than throwing,
 * because these paths are documentation that may legitimately be reorganised, and the rest
 * of the corpus measurement should still succeed.
 */
function measureTopLevelPlans() {
  logDebug('measureTopLevelPlans');
  return TOP_LEVEL_PLAN_VERSIONS.map((entry) => {
    const absolute = repoPath(entry.relativePath);
    if (!fs.existsSync(absolute)) {
      logWarn('measureTopLevelPlans: path absent', entry.relativePath);
      return { ...entry, bytes: null, kilobytes: null };
    }
    const bytes = measureFile(absolute).bytes;
    return { ...entry, bytes, kilobytes: toKilobytes(bytes) };
  });
}

/**
 * Produces the full corpus measurement.
 *
 * Reports total bytes in three forms — raw, kilobytes, and megabytes — because the drafts
 * quote the corpus in megabytes while the reconciliation report needs the exact figure to
 * compare against the series plan's stated value.
 */
function measureSpecCorpus() {
  logDebug('measureSpecCorpus');
  const specs = measureCompletedSpecs();
  const totalBytes = specs.reduce((total, spec) => total + spec.bytes, 0);
  const deprecated = resolveFileSet('spec-deprecated').map((filePath) => path.basename(filePath));
  const campaigns = measureConsolidationCampaigns();

  return {
    source: '.spec/completed/**/*.md and .spec/deprecated, measured by byte size',
    completed: {
      documentCount: volatileFigure(specs.length, 'file set "spec-corpus"'),
      totalBytes: volatileFigure(totalBytes, 'file set "spec-corpus", summed byte length'),
      totalKilobytes: volatileFigure(toKilobytes(totalBytes), 'derived: total bytes / 1024'),
      totalMegabytes: volatileFigure(
        round(totalBytes / (BYTES_PER_KB * BYTES_PER_KB), 2),
        'derived: total bytes / 1048576, the form prose quotes',
      ),
      meanKilobytes: volatileFigure(
        round(totalBytes / specs.length / BYTES_PER_KB, 1),
        'derived: total bytes / document count / 1024',
      ),
      largest: volatileFigure(
        specs.slice(0, LARGEST_DOCUMENT_COUNT),
        `file set "spec-corpus", ${LARGEST_DOCUMENT_COUNT} largest by byte size`,
      ),
    },
    deprecated: {
      documentCount: figure(deprecated.length, 'file set "spec-deprecated"'),
      files: figure(deprecated, 'file set "spec-deprecated"'),
    },
    topLevelPlanVersions: figure(
      measureTopLevelPlans(),
      'named superseded and current top-level plans; superseded in .spec/deprecated, current in docs/',
    ),
    consolidationCampaigns: volatileFigure(
      campaigns,
      'filenames in .spec/completed matching the maintainability consolidation plan pattern',
    ),
    limitations: figure(
      [
        'Filesystem timestamps do not reliably track authoring order, so dates from this corpus are usable only as a relative arc.',
        'Corpus size and code size are each quotable alone; a byte-for-byte docs-to-code ratio is not published because the two corpora are not comparable units.',
      ],
      'stated limitations of the corpus measurement',
    ),
  };
}

/** Prints the measurement when run directly, for checking against expected values. */
if (require.main === module) {
  process.stdout.write(`${JSON.stringify(measureSpecCorpus(), null, 2)}\n`);
}

module.exports = {
  LARGEST_DOCUMENT_COUNT,
  TOP_LEVEL_PLAN_VERSIONS,
  CONSOLIDATION_PLAN_PATTERN,
  toKilobytes,
  measureCompletedSpecs,
  measureConsolidationCampaigns,
  measureTopLevelPlans,
  measureSpecCorpus,
};
