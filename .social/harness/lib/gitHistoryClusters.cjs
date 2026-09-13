'use strict';

const { logDebug, logTrace } = require('./harnessLogger.cjs');

/**
 * Finds subject-matched runs of commits for the git-history measurement.
 *
 * A draft that describes a "campaign" needs to know whether the matching commits were
 * consecutive or had other work interleaved. This detector is the single definition of
 * that, so the measurement and the tests share it.
 */

/**
 * Sums the four per-commit file-status counts. Used so a run's file-touch total is
 * defined in one place and counts matching commits only.
 */
function fileTouches(commit) {
  return (commit.added ?? 0) + (commit.updated ?? 0) + (commit.renamed ?? 0) + (commit.deleted ?? 0);
}

/**
 * Pushes a finished run when it meets `minLength`. Called both when a gap exceeds
 * the configured limits and at the end of the commit list.
 */
function closeRun(current, minLength, runs) {
  if (current === null || current.matches.length < minLength) return;
  const first = current.matches[0];
  const last = current.matches[current.matches.length - 1];
  const startMs = Date.parse(first.timestamp);
  const endMs = Date.parse(last.timestamp);
  runs.push({
    startHash: first.hash,
    endHash: last.hash,
    startTimestamp: first.timestamp,
    endTimestamp: last.timestamp,
    spanMinutes: Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.round((endMs - startMs) / 60000) : null,
    matchingCount: current.matches.length,
    interleavedCount: current.interleaved,
    fileTouches: current.matches.reduce((sum, commit) => sum + fileTouches(commit), 0),
    matchingHashes: current.matches.map((commit) => commit.hash),
  });
}

/**
 * True when the time between two matching commits is within `maxGapMinutes`.
 *
 * A missing `maxGapMinutes` means any gap is allowed. Used so an overnight "Build
 * fixes" commit does not glue itself onto an evening CI run of matching subjects.
 * Unparseable timestamps refuse the glue rather than silently joining the runs.
 */
function gapWithinLimit(previous, next, maxGapMinutes) {
  logTrace('gapWithinLimit');
  if (maxGapMinutes === undefined || maxGapMinutes === null) return true;
  const previousMs = Date.parse(previous.timestamp);
  const nextMs = Date.parse(next.timestamp);
  if (!Number.isFinite(previousMs) || !Number.isFinite(nextMs)) return false;
  return (nextMs - previousMs) / 60000 <= maxGapMinutes;
}

/**
 * Groups matching commits into runs, allowing a bounded number of non-matching commits
 * between consecutive matches.
 *
 * `commits` must already be in committer-date order, oldest first. Each commit needs
 * `hash`, `subject`, `timestamp`, and the four file-touch counts. `matches` is a
 * predicate. `options.maxInterleaved` is the maximum non-matching commits allowed
 * between two matches that still belong to the same run; `options.minLength` is the
 * minimum matching count that qualifies as a run; `options.maxGapMinutes`, when set,
 * is the maximum minutes between consecutive matches.
 *
 * Returns an array of run records. File-touch sums count matching commits only.
 */
function findCommitRuns(commits, matches, options) {
  logDebug('findCommitRuns', () => ({
    commitCount: commits.length,
    maxInterleaved: options?.maxInterleaved,
    minLength: options?.minLength,
  }));
  if (options === undefined || options.maxInterleaved === undefined || options.minLength === undefined) {
    throw new Error('findCommitRuns requires options.maxInterleaved and options.minLength');
  }
  const maxInterleaved = options.maxInterleaved;
  const minLength = options.minLength;
  const maxGapMinutes = options.maxGapMinutes;
  const runs = [];
  let current = null;
  let pending = 0;

  for (const commit of commits) {
    if (matches(commit)) {
      if (current === null) {
        current = { matches: [commit], interleaved: 0 };
        pending = 0;
      } else if (
        pending <= maxInterleaved &&
        gapWithinLimit(current.matches[current.matches.length - 1], commit, maxGapMinutes)
      ) {
        current.interleaved += pending;
        pending = 0;
        current.matches.push(commit);
      } else {
        closeRun(current, minLength, runs);
        current = { matches: [commit], interleaved: 0 };
        pending = 0;
      }
    } else if (current !== null) {
      pending += 1;
    }
  }
  closeRun(current, minLength, runs);
  return runs;
}

module.exports = {
  findCommitRuns,
};
