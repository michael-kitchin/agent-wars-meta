'use strict';

const path = require('node:path');

const { REPO_ROOT, resolveFileSet, partitionProductAndTests } = require('./lib/fileScan.cjs');
const { measureFile, measureFileSet } = require('./lib/lineCounting.cjs');
const { figure, round } = require('./lib/metricsWriter.cjs');
const { logDebug } = require('./lib/harnessLogger.cjs');

/**
 * Measures the codebase figures the series quotes: file and line counts by area, the
 * product-versus-test split, the substantive-line share, the project-owned totals, and
 * the per-hour rates derived from them.
 *
 * Every ratio here is computed from measured operands. None is transcribed, because a
 * transcribed ratio silently stops matching its own inputs the moment either moves — the
 * exact failure this harness exists to prevent.
 */

/** Areas reported separately, matching how the series describes the codebase's shape. */
const CODEBASE_AREAS = Object.freeze(['main', 'renderer', 'shared']);

/**
 * Computes the substantive share of a measured group as a percentage.
 *
 * Substantive lines come from a heuristic rather than a parser (see `lib/lineCounting`),
 * so any prose quoting this must present it as a proxy. Returns 0 for an empty group
 * rather than NaN so downstream formatting cannot produce a nonsense figure.
 */
function substantiveSharePercent(totals) {
  if (totals.physicalLines === 0) return 0;
  return round((100 * totals.substantiveLines) / totals.physicalLines, 1);
}

/**
 * Measures one area of `src/` and returns its file and line totals.
 *
 * Areas are measured from their own file sets rather than by filtering the whole-`src`
 * list, so an area total is independently verifiable against a directory listing.
 */
function measureArea(area) {
  logDebug('measureArea', area);
  const totals = measureFileSet(resolveFileSet(`src-${area}`));
  return { files: totals.files, physicalLines: totals.physicalLines };
}

/**
 * Produces the full codebase measurement.
 *
 * `loggedHours` is supplied by the caller rather than read here, because the hours come
 * from the time log and this module has no business parsing a CSV. Pass the grand total
 * so the per-hour rates can be derived; omit it and the rates are reported as null rather
 * than as a fabricated value.
 */
/**
 * The project's own stated file-size limits, from its standing rules.
 *
 * These are process constraints rather than lint-enforced constants -- no `max-lines` rule exists
 * in the ESLint configuration -- so they are recorded here as the thresholds compliance is
 * measured against. Change them only if the project's rules change.
 */
const DESIRABLE_LINE_LIMIT = 600;

/** The hard ceiling in the same rule set. */
const HARD_LINE_LIMIT = 1000;

/**
 * Counts how many files in a measured set exceed the project's stated size limits.
 *
 * Exists so a post claiming "the constraints held" can be checked rather than asserted. Reports
 * the largest file alongside the counts, because a single outlier is the interesting case and an
 * average hides it.
 */
function measureLimitCompliance(measurements) {
  logDebug('measureLimitCompliance', () => ({ fileCount: measurements.length }));
  const overDesirable = measurements.filter((file) => file.physicalLines > DESIRABLE_LINE_LIMIT);
  const overHard = measurements.filter((file) => file.physicalLines > HARD_LINE_LIMIT);
  const largest = measurements.reduce(
    (worst, file) => (worst === null || file.physicalLines > worst.physicalLines ? file : worst),
    null,
  );
  return {
    overDesirableCount: overDesirable.length,
    overHardCount: overHard.length,
    largestLines: largest === null ? null : largest.physicalLines,
    largestPath: largest === null ? null : path.relative(REPO_ROOT, largest.path).replace(/\\/g, '/'),
  };
}

function measureCodebase(options = {}) {
  logDebug('measureCodebase', options);
  const loggedHours = options.loggedHours ?? null;

  const srcPaths = resolveFileSet('src');
  const { product, tests } = partitionProductAndTests(srcPaths);
  const srcTotals = measureFileSet(srcPaths);
  const productTotals = measureFileSet(product);
  const testTotals = measureFileSet(tests);
  const projectOwnedTotals = measureFileSet(resolveFileSet('project-owned'));
  const pythonTotals = measureFileSet(resolveFileSet('scripts-python'));
  const productCompliance = measureLimitCompliance(product.map(measureFile));

  const areas = {};
  for (const area of CODEBASE_AREAS) {
    areas[area] = measureArea(area);
  }

  const perHour = (lines) =>
    loggedHours === null || loggedHours === 0 ? null : round(lines / loggedHours, 1);

  return {
    source: 'src/**/*.ts and the project-owned file set, counted by physical lines',
    all: {
      files: figure(srcTotals.files, 'file set "src"'),
      physicalLines: figure(srcTotals.physicalLines, 'file set "src"'),
    },
    product: {
      files: figure(productTotals.files, 'file set "src" excluding *.test.ts'),
      physicalLines: figure(productTotals.physicalLines, 'file set "src" excluding *.test.ts'),
      substantiveLines: figure(
        productTotals.substantiveLines,
        'substantive-line heuristic in lib/lineCounting.cjs',
      ),
      substantiveSharePercent: figure(
        substantiveSharePercent(productTotals),
        'derived: substantive / physical, a proxy rather than an exact figure',
      ),
      meanLinesPerFile: figure(
        round(productTotals.physicalLines / productTotals.files, 1),
        'derived: product physical lines / product files',
      ),
    },
    tests: {
      files: figure(testTotals.files, 'file set "src" restricted to *.test.ts'),
      physicalLines: figure(testTotals.physicalLines, 'file set "src" restricted to *.test.ts'),
      substantiveLines: figure(
        testTotals.substantiveLines,
        'substantive-line heuristic in lib/lineCounting.cjs',
      ),
      substantiveSharePercent: figure(
        substantiveSharePercent(testTotals),
        'derived: substantive / physical, a proxy rather than an exact figure',
      ),
    },
    areas: {
      main: {
        files: figure(areas.main.files, 'file set "src-main"'),
        physicalLines: figure(areas.main.physicalLines, 'file set "src-main"'),
      },
      renderer: {
        files: figure(areas.renderer.files, 'file set "src-renderer"'),
        physicalLines: figure(areas.renderer.physicalLines, 'file set "src-renderer"'),
      },
      shared: {
        files: figure(areas.shared.files, 'file set "src-shared"'),
        physicalLines: figure(areas.shared.physicalLines, 'file set "src-shared"'),
      },
    },
    projectOwned: {
      files: figure(projectOwnedTotals.files, 'file set "project-owned"'),
      physicalLines: figure(projectOwnedTotals.physicalLines, 'file set "project-owned"'),
    },
    limitCompliance: {
      desirableLimit: figure(DESIRABLE_LINE_LIMIT, "the project's stated desirable file-size limit"),
      hardLimit: figure(HARD_LINE_LIMIT, "the project's stated hard file-size ceiling"),
      productFilesOverDesirable: figure(
        productCompliance.overDesirableCount,
        'product files whose physical line count exceeds the desirable limit',
      ),
      productFilesOverHard: figure(
        productCompliance.overHardCount,
        'product files whose physical line count exceeds the hard ceiling',
      ),
      largestProductFileLines: figure(
        productCompliance.largestLines,
        'largest product file by physical lines',
      ),
      largestProductFilePath: figure(
        productCompliance.largestPath,
        'path of the largest product file',
      ),
    },
    python: {
      // No substantive-line figure appears here on purpose: the counting heuristic recognises
      // TypeScript comment syntax only, so it would classify Python `#` comments as code and
      // report a share that looks precise and is wrong.
      files: figure(pythonTotals.files, 'file set "scripts-python"'),
      physicalLines: figure(pythonTotals.physicalLines, 'file set "scripts-python"'),
      shareOfProjectOwnedLinesPercent: figure(
        round((pythonTotals.physicalLines / projectOwnedTotals.physicalLines) * 100, 1),
        'derived: Python physical lines / project-owned physical lines',
      ),
    },
    ratios: {
      testToProductByLine: figure(
        round(testTotals.physicalLines / productTotals.physicalLines, 3),
        'derived: test physical lines / product physical lines',
      ),
      testToProductByFile: figure(
        round(testTotals.files / productTotals.files, 3),
        'derived: test files / product files',
      ),
      substantiveGapPoints: figure(
        round(substantiveSharePercent(testTotals) - substantiveSharePercent(productTotals), 1),
        'derived: test substantive share minus product substantive share, in percentage points',
      ),
    },
    perLoggedHour: {
      loggedHoursUsed: figure(
        loggedHours,
        'supplied by the caller from the time log; null when not supplied',
      ),
      srcLines: figure(perHour(srcTotals.physicalLines), 'derived: src physical lines / hours'),
      projectOwnedLines: figure(
        perHour(projectOwnedTotals.physicalLines),
        'derived: project-owned physical lines / hours',
      ),
      productLines: figure(
        perHour(productTotals.physicalLines),
        'derived: product physical lines / hours',
      ),
    },
  };
}

/**
 * Prints the measurement when the module is run directly, so a developer can check it
 * against the expected values without wiring up the orchestrator.
 */
function reportToStdout() {
  const measured = measureCodebase({ loggedHours: 155.87 });
  process.stdout.write(`${JSON.stringify(measured, null, 2)}\n`);
}

if (require.main === module) {
  reportToStdout();
}

module.exports = {
  CODEBASE_AREAS,
  substantiveSharePercent,
  measureArea,
  measureCodebase,
};
