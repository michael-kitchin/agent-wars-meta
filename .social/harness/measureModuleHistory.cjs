'use strict';

const { execFileSync } = require('child_process');
const { repoPath } = require('./lib/fileScan.cjs');
const { countPhysicalLines } = require('./lib/lineCounting.cjs');
const { figure } = require('./lib/metricsWriter.cjs');
const { logDebug, logTrace, logWarn } = require('./lib/harnessLogger.cjs');

/**
 * Finds the historical high-water line count for the modules the series describes as having
 * sprawled before consolidation.
 *
 * This exists because those figures are not reproducible from the milestone tags. At every
 * tag, the largest `renderer.ts` is well under the size the series plan claims, which means
 * the peaks occurred at intermediate commits. So this walks every commit that touched each
 * path rather than sampling tags.
 *
 * It reports what it finds and nothing more. If a scan disagrees with a previously stated
 * figure, that disagreement is the result — the search must not be reshaped until it produces
 * an expected number.
 *
 * Cost note: the scan runs one `git show` per commit per path, roughly 250 invocations on
 * this repository, taking some tens of seconds. Pass `options.enabled = false` to skip it.
 */

/**
 * Modules whose growth the series discusses, each with every path it has occupied.
 *
 * Multiple paths per module are necessary because consolidation moved several of these:
 * `src/main/openRouter.ts` became a directory, and `gameActions.ts` was split into a barrel
 * plus modules. Scanning only the current path would report a peak of zero for a module the
 * series specifically calls out.
 */
const MODULES_OF_INTEREST = Object.freeze([
  {
    label: 'renderer entry point',
    paths: ['src/renderer/renderer.ts'],
  },
  {
    label: 'OpenRouter client',
    paths: ['src/main/openRouter.ts', 'src/main/openRouter/openRouter.ts'],
  },
  {
    label: 'game actions',
    paths: ['src/main/gameActions.ts', 'src/main/gameActions/gameActionsCore.ts'],
  },
  {
    label: 'game database',
    paths: ['src/main/gameDb.ts'],
  },
]);

/**
 * Runs a git command in the repository and returns stdout.
 *
 * Uses `execFileSync` without a shell so paths containing spaces cannot be misinterpreted.
 * A large `maxBuffer` is set because `git show` on a five-thousand-line module exceeds the
 * default and would otherwise fail mid-scan.
 */
function git(args) {
  logTrace('git', args.join(' '));
  return execFileSync('git', args, {
    cwd: repoPath('.'),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * Lists every commit that touched a path, across all refs.
 *
 * Returns an empty list when the path never existed, which is a legitimate result and is
 * reported as such rather than treated as an error.
 */
function listCommitsTouching(relativePath) {
  logDebug('listCommitsTouching', relativePath);
  try {
    const output = git(['rev-list', '--all', '--', relativePath]);
    return output.split(/\r?\n/).filter((line) => line.trim() !== '');
  } catch (error) {
    logWarn('listCommitsTouching failed', { path: relativePath, message: error.message });
    return [];
  }
}

/**
 * Counts physical lines of a path at one commit.
 *
 * Returns null when the path does not exist in that commit, which happens routinely since
 * `rev-list` includes the commit that deleted a file.
 */
function lineCountAtCommit(commitSha, relativePath) {
  try {
    return countPhysicalLines(git(['show', `${commitSha}:${relativePath}`]));
  } catch {
    return null;
  }
}

/**
 * Finds the maximum line count a path ever reached, with the commit that held it.
 *
 * Reports the commit's short hash and date alongside the peak so the finding can be checked
 * by hand rather than taken on trust.
 */
function findPeakForPath(relativePath) {
  logDebug('findPeakForPath', relativePath);
  const commits = listCommitsTouching(relativePath);
  if (commits.length === 0) {
    return { path: relativePath, existed: false, commitsTouching: 0, peakLines: null, peakCommit: null };
  }
  let peakLines = 0;
  let peakCommit = null;
  for (const commitSha of commits) {
    const lines = lineCountAtCommit(commitSha, relativePath);
    if (lines !== null && lines > peakLines) {
      peakLines = lines;
      peakCommit = commitSha;
    }
  }
  const peakDate =
    peakCommit === null ? null : git(['show', '-s', '--format=%cs', peakCommit]).trim();
  return {
    path: relativePath,
    existed: peakCommit !== null,
    commitsTouching: commits.length,
    peakLines: peakCommit === null ? null : peakLines,
    peakCommit: peakCommit === null ? null : peakCommit.slice(0, 8),
    peakDate,
  };
}

/**
 * Produces the module-history measurement.
 *
 * Each module's peak is the largest across all the paths it has occupied, so a module that
 * was moved still reports its true high-water mark.
 */
function measureModuleHistory(options = {}) {
  logDebug('measureModuleHistory', options);
  if (options.enabled === false) {
    return {
      source: 'skipped by caller',
      skipped: figure(true, 'options.enabled was false'),
      modules: figure([], 'not scanned'),
    };
  }

  const modules = MODULES_OF_INTEREST.map((module) => {
    const perPath = module.paths.map((relativePath) => findPeakForPath(relativePath));
    const found = perPath.filter((entry) => entry.existed);
    const peak = found.reduce(
      (best, entry) => (best === null || entry.peakLines > best.peakLines ? entry : best),
      null,
    );
    return {
      label: module.label,
      peakLines: peak === null ? null : peak.peakLines,
      peakPath: peak === null ? null : peak.path,
      peakCommit: peak === null ? null : peak.peakCommit,
      peakDate: peak === null ? null : peak.peakDate,
      pathsScanned: perPath,
    };
  });

  return {
    source: 'git rev-list --all per path, with a physical line count of the blob at each commit',
    modules: figure(
      modules,
      'peak physical line count each module ever reached, across every path it has occupied',
    ),
    method: figure(
      [
        'Every commit touching each path is examined, across all refs, not only tagged milestones.',
        'Milestone tags alone understate these peaks substantially, which is why the tag-sampling approach was abandoned.',
        'A path that never existed is reported as such rather than as a zero.',
      ],
      'how the scan works and why',
    ),
  };
}

/** Prints the measurement when run directly, for checking against expected values. */
if (require.main === module) {
  process.stdout.write(`${JSON.stringify(measureModuleHistory(), null, 2)}\n`);
}

module.exports = {
  MODULES_OF_INTEREST,
  listCommitsTouching,
  lineCountAtCommit,
  findPeakForPath,
  measureModuleHistory,
};
