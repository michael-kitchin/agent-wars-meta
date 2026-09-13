'use strict';

const { execFileSync } = require('child_process');
const { repoPath } = require('./lib/fileScan.cjs');
const { countPhysicalLines } = require('./lib/lineCounting.cjs');
const { figure, round, volatileFigure } = require('./lib/metricsWriter.cjs');
const { logDebug, logTrace, logError } = require('./lib/harnessLogger.cjs');
const { findCommitRuns } = require('./lib/gitHistoryClusters.cjs');
const { measureEffort } = require('./measureEffort.cjs');

/**
 * Measures git-history figures the blog series quotes: repository shape, tag alignment,
 * subject-matched commit clusters, named consolidation commits, provenance trailers,
 * and a lines-per-hour rate bounded to the time-log window.
 *
 * These numbers cannot live in prose. The draft checker only licenses inline figures that
 * appear in metrics.json, so a rename count or a cluster length has to be measured here
 * or it will fail the check. Pass `options.enabled = false` to skip the git work; a full
 * scan shells out many times and iterating on drafts should not pay for it every run.
 */

/** Short hashes whose add/update/rename/delete counts drafts name specifically. */
const NAMED_COMMIT_HASHES = Object.freeze([
  'ed388c7',
  '89e453a',
  'ca373e7',
  '81f19cf',
  'cad4a26',
  'c3cfcb9',
]);

/** Subjects that belong to the build-and-CI cluster detector, case-insensitive. */
const CI_SUBJECT_PATTERN = /build|\bci\b|workflow|electron-builder|github actions/i;

/** Subjects that belong to the prompt-governance cluster detector, case-insensitive. */
const PROMPT_SUBJECT_PATTERN = /prompt/i;

/**
 * Runs a git command in the repository and returns stdout.
 *
 * Uses `execFileSync` without a shell so paths containing spaces cannot be misinterpreted.
 * A large `maxBuffer` is set because a name-status log of the whole history exceeds the
 * default and would otherwise fail mid-scan.
 */
function git(args, options = {}) {
  logTrace('git', args.join(' '));
  return execFileSync('git', args, {
    cwd: repoPath('.'),
    encoding: 'utf8',
    maxBuffer: 80 * 1024 * 1024,
    stdio: options.input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
    input: options.input,
  });
}

/**
 * Classifies one `git log --name-status --find-renames` status letter into the four
 * counts the series quotes. Unknown letters are ignored rather than thrown, because a
 * copy or type-change must not abort a scan of the full history.
 */
function statusKind(status) {
  if (status === 'A') return 'added';
  if (status === 'M') return 'updated';
  if (status === 'D') return 'deleted';
  if (status.startsWith('R')) return 'renamed';
  return null;
}

/**
 * Parses a `git log --name-status` stream whose commit headers start with `COMMIT\t`.
 *
 * Returns commits oldest-first with per-commit file-status totals. Merge commits that
 * list no files contribute zeros, which is Git's combined-diff behaviour, not a parser bug.
 */
function parseNameStatusLog(output) {
  logDebug('parseNameStatusLog', () => ({ chars: String(output).length }));
  const commits = [];
  let current = null;
  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith('COMMIT\t')) {
      const [, hash, fullHash, timestamp, author, ...subjectParts] = line.split('\t');
      current = {
        hash,
        fullHash,
        timestamp,
        author,
        subject: subjectParts.join('\t'),
        added: 0,
        updated: 0,
        renamed: 0,
        deleted: 0,
      };
      commits.push(current);
      continue;
    }
    if (current === null || line === '') continue;
    const kind = statusKind(line.split('\t', 1)[0]);
    if (kind !== null) current[kind] += 1;
  }
  return commits;
}

/**
 * Loads every commit on HEAD with per-commit file-status counts.
 *
 * `--find-renames` is required so a restructuring pass is counted as renames rather than
 * as a matching number of deletes and adds, which would silently inflate both totals.
 */
function loadHeadCommits() {
  logDebug('loadHeadCommits');
  const output = git([
    'log',
    '--reverse',
    '--name-status',
    '--find-renames',
    '--pretty=format:COMMIT\t%h\t%H\t%cI\t%an\t%s',
    'HEAD',
  ]);
  return parseNameStatusLog(output);
}

/**
 * Walks backwards from a tagged commit for the nearest subject that names that
 * milestone number. Returns null when none exists, which is itself a finding: the tag
 * then has no identifiable milestone commit to sit on or beside.
 */
function findNearestMilestoneCommit(tagHash, milestoneNumber) {
  logDebug('findNearestMilestoneCommit', { tagHash, milestoneNumber });
  const escaped = milestoneNumber.replace(/\./g, '\\.');
  const pattern = new RegExp(`milestone\\s+${escaped}\\b`, 'i');
  const log = git(['log', '--format=%h\t%s', tagHash]);
  for (const line of log.split(/\r?\n/)) {
    if (line === '') continue;
    const tab = line.indexOf('\t');
    const hash = line.slice(0, tab);
    const subject = line.slice(tab + 1);
    if (pattern.test(subject)) return { hash, subject };
  }
  return null;
}

/**
 * Lists every lightweight tag with the nearest preceding milestone-named commit.
 *
 * Alignment is inferred from subject text and is evidence rather than proof, which is
 * why each row carries both the tagged subject and the inferred milestone subject.
 */
function loadTags() {
  logDebug('loadTags');
  const raw = git([
    'for-each-ref',
    '--sort=creatordate',
    'refs/tags',
    '--format=%(refname:short)\t%(objectname:short)\t%(creatordate:iso-strict)\t%(contents:subject)',
  ]);
  const tags = [];
  for (const line of raw.split(/\r?\n/).filter((entry) => entry !== '')) {
    const [name, hash, date, ...subjectParts] = line.split('\t');
    const milestoneMatch = /^milestone-(.+)$/.exec(name);
    const milestoneNumber = milestoneMatch === null ? null : milestoneMatch[1];
    const nearest =
      milestoneNumber === null ? null : findNearestMilestoneCommit(hash, milestoneNumber);
    tags.push({
      name,
      hash,
      date,
      subject: subjectParts.join('\t'),
      milestoneNumber,
      nearestMilestoneHash: nearest === null ? null : nearest.hash,
      nearestMilestoneSubject: nearest === null ? null : nearest.subject,
      sitsOnMilestoneCommit: nearest !== null && nearest.hash === hash,
    });
  }
  return tags;
}

/**
 * Re-derives add/update/rename/delete counts for one named commit from git.
 *
 * Used so a draft quoting "200 renames" is quoting a measurement, not a transcribed
 * figure from the history summary. Throws if the hash does not resolve, because a missing
 * named commit is an error in the configured list, not a zero.
 */
function measureNamedCommit(hash) {
  logDebug('measureNamedCommit', hash);
  try {
    git(['cat-file', '-e', `${hash}^{commit}`]);
  } catch (error) {
    logError('measureNamedCommit: hash does not resolve', { hash, message: error.message });
    throw new Error(`Named commit ${hash} does not resolve`);
  }
  const output = git([
    'log',
    '-1',
    '--name-status',
    '--find-renames',
    '--pretty=format:COMMIT\t%h\t%H\t%cI\t%an\t%s',
    hash,
  ]);
  const parsed = parseNameStatusLog(output);
  if (parsed.length !== 1) {
    throw new Error(`Named commit ${hash} produced ${parsed.length} log records`);
  }
  const commit = parsed[0];
  return {
    hash: commit.hash,
    date: commit.timestamp.slice(0, 10),
    subject: commit.subject,
    added: commit.added,
    updated: commit.updated,
    renamed: commit.renamed,
    deleted: commit.deleted,
  };
}

/**
 * Collects short hashes whose commit body contains a `Made-with:` trailer.
 *
 * Grep is over the body, not the subject, because the trailer lives below the blank line
 * that Git uses to separate the two.
 */
function listMadeWithHashes() {
  logDebug('listMadeWithHashes');
  const output = git(['log', '--grep=Made-with:', '--pretty=format:%h', 'HEAD']);
  return output.split(/\r?\n/).filter((line) => line !== '');
}

/**
 * Counts product TypeScript lines under `src/` at one commit, excluding `*.test.ts`.
 *
 * Uses git blobs rather than the working tree so the count is the code as of the
 * time-log cutoff, not as of HEAD. `cat-file --batch` keeps this to one spawn.
 */
function countProductLinesAtCommit(commitSha) {
  logDebug('countProductLinesAtCommit', commitSha);
  const names = git(['ls-tree', '-r', '--name-only', commitSha, '--', 'src'])
    .split(/\r?\n/)
    .filter((relativePath) => relativePath.endsWith('.ts') && !relativePath.endsWith('.test.ts'));
  if (names.length === 0) return 0;
  const input = Buffer.from(`${names.map((relativePath) => `${commitSha}:${relativePath}`).join('\n')}\n`, 'utf8');
  let output;
  try {
    output = execFileSync('git', ['cat-file', '--batch'], {
      cwd: repoPath('.'),
      encoding: 'buffer',
      maxBuffer: 80 * 1024 * 1024,
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    logError('countProductLinesAtCommit failed', { commitSha, message: error.message });
    throw error;
  }
  return sumPhysicalLinesFromBatch(output);
}

/**
 * Walks a `git cat-file --batch` stream and sums physical lines of each blob.
 *
 * Missing paths (a listed tree entry that is not a blob) are skipped rather than thrown,
 * because a submodule or symlink under `src/` must not abort the rate measurement.
 */
function sumPhysicalLinesFromBatch(output) {
  logTrace('sumPhysicalLinesFromBatch', () => ({ bytes: output.length }));
  let total = 0;
  let index = 0;
  while (index < output.length) {
    const newline = output.indexOf(0x0a, index);
    if (newline === -1) break;
    const header = output.slice(index, newline).toString('utf8');
    if (header.endsWith(' missing')) {
      index = newline + 1;
      continue;
    }
    const size = Number(header.split(' ')[2]);
    const contentStart = newline + 1;
    total += countPhysicalLines(output.slice(contentStart, contentStart + size).toString('utf8'));
    index = contentStart + size;
    if (output[index] === 0x0a) index += 1;
  }
  return total;
}

/**
 * Last commit on HEAD whose committer date is on or before the time-log end date.
 *
 * `--until` is end-of-day on that date so a commit at 23:00 still falls inside the window.
 */
function lastCommitOnOrBefore(date) {
  logDebug('lastCommitOnOrBefore', date);
  const output = git(['log', '-1', '--until', `${date}T23:59:59`, '--format=%H\t%h\t%cI', 'HEAD']).trim();
  if (output === '') {
    throw new Error(`No commit on or before ${date}`);
  }
  const [fullHash, hash, timestamp] = output.split('\t');
  return { fullHash, hash, timestamp };
}

/**
 * Tallies distinct author names from the loaded HEAD commits.
 *
 * The series notes that almost every commit shares one name; the count of exceptions is
 * the figure, so this groups by the author string git itself records.
 */
function countAuthors(commits) {
  logTrace('countAuthors', () => ({ commitCount: commits.length }));
  const counts = new Map();
  for (const commit of commits) {
    counts.set(commit.author, (counts.get(commit.author) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name, count]) => ({ name, count }));
}

/**
 * Produces the git-history measurement, or a skipped shell when the caller opts out.
 *
 * Reports what git currently says. A disagreement with a previously stated figure is a
 * result, not a reason to adjust the scan.
 */
function measureGitHistory(options = {}) {
  logDebug('measureGitHistory', options);
  if (options.enabled === false) {
    return {
      source: 'skipped by caller',
      skipped: figure(true, 'options.enabled was false'),
    };
  }

  const commits = loadHeadCommits();
  const commitsOnHead = commits.length;
  const commitsAllRefs = Number(git(['rev-list', '--all', '--count']).trim());
  const filesAdded = commits.reduce((sum, commit) => sum + commit.added, 0);
  const filesUpdated = commits.reduce((sum, commit) => sum + commit.updated, 0);
  const filesRenamed = commits.reduce((sum, commit) => sum + commit.renamed, 0);
  const filesDeleted = commits.reduce((sum, commit) => sum + commit.deleted, 0);

  const tags = loadTags();
  const taggedMilestoneNumbers = tags
    .map((tag) => tag.milestoneNumber)
    .filter((number) => number !== null)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  const ciRuns = findCommitRuns(commits, (commit) => CI_SUBJECT_PATTERN.test(commit.subject), {
    maxInterleaved: 2,
    minLength: 4,
    maxGapMinutes: 120,
  });
  const promptRuns = findCommitRuns(commits, (commit) => PROMPT_SUBJECT_PATTERN.test(commit.subject), {
    maxInterleaved: 1,
    minLength: 8,
    maxGapMinutes: 7200,
  });

  const namedCommits = NAMED_COMMIT_HASHES.map((hash) => measureNamedCommit(hash));
  const madeWithHashes = listMadeWithHashes();
  const authors = countAuthors(commits);

  const effort = measureEffort();
  const cutoffDate = effort.coverageWindow.to.value;
  const hours = effort.totals.grandTotalHours.value;
  const cutoff = lastCommitOnOrBefore(cutoffDate);
  const productLines = countProductLinesAtCommit(cutoff.fullHash);
  const linesPerHour = hours === null || hours === 0 ? null : round(productLines / hours, 1);

  const firstCommit = commits[0];
  const lastCommit = commits[commits.length - 1];

  return {
    source: 'git log --name-status --find-renames on HEAD, plus tag and trailer scans',
    commitsOnHead: volatileFigure(commitsOnHead, 'git rev-list --count HEAD'),
    commitsAllRefs: volatileFigure(commitsAllRefs, 'git rev-list --all --count'),
    tagCount: figure(tags.length, 'git for-each-ref refs/tags'),
    firstCommitDate: figure(firstCommit.timestamp.slice(0, 10), `first commit ${firstCommit.hash}`),
    lastCommitDate: volatileFigure(lastCommit.timestamp.slice(0, 10), `HEAD ${lastCommit.hash}`),
    filesAdded: volatileFigure(filesAdded, 'sum of per-commit A statuses on HEAD'),
    filesUpdated: volatileFigure(filesUpdated, 'sum of per-commit M statuses on HEAD'),
    filesRenamed: volatileFigure(filesRenamed, 'sum of per-commit R statuses on HEAD'),
    filesDeleted: volatileFigure(filesDeleted, 'sum of per-commit D statuses on HEAD'),
    renameRatio: volatileFigure(
      filesAdded === 0 ? null : round(filesRenamed / filesAdded, 3),
      'derived: filesRenamed / filesAdded',
    ),
    tags: figure(tags, 'each tag with nearest subject-matched milestone commit'),
    taggedMilestoneNumbers: figure(taggedMilestoneNumbers, 'milestone numbers that have tags'),
    clusters: {
      ci: figure(ciRuns, 'subject-matched build/CI runs, maxInterleaved 2, maxGapMinutes 120, minLength 4'),
      prompt: figure(promptRuns, 'subject-matched prompt runs, maxInterleaved 1, maxGapMinutes 7200, minLength 8'),
    },
    namedCommits: figure(namedCommits, 'configured hashes re-derived from git log --name-status'),
    madeWithCount: figure(madeWithHashes.length, 'git log --grep=Made-with: on HEAD'),
    madeWithHashes: figure(madeWithHashes, 'commits whose body contains a Made-with: trailer'),
    authors: figure(authors, 'distinct git author names on HEAD with counts'),
    boundedRate: {
      cutoffDate: figure(cutoffDate, 'effort.coverageWindow.to'),
      cutoffCommit: figure(cutoff.hash, `last HEAD commit on or before ${cutoffDate}`),
      cutoffCommitDate: figure(cutoff.timestamp.slice(0, 10), `committer date of ${cutoff.hash}`),
      productLines: figure(
        productLines,
        `physical lines of src/ TypeScript excluding *.test.ts at ${cutoff.hash}`,
      ),
      hours: figure(hours, 'effort.totals.grandTotalHours'),
      linesPerHour: figure(linesPerHour, 'derived: product lines at cutoff / logged hours'),
    },
    method: figure(
      [
        'Clusters are found by subject pattern and may miss a commit whose subject does not describe its content.',
        'Tag alignment is inferred from subject text and is evidence rather than proof.',
        'Per-commit file-status sums are not net change: a file touched in several commits counts in each.',
        'The unbounded rate of current lines over logged hours is not sound, because the repository continues past the time-log window.',
      ],
      'how the scan works and the limits of what it shows',
    ),
  };
}

/** Prints the measurement when run directly, for checking against expected values. */
if (require.main === module) {
  process.stdout.write(`${JSON.stringify(measureGitHistory(), null, 2)}\n`);
}

module.exports = {
  NAMED_COMMIT_HASHES,
  CI_SUBJECT_PATTERN,
  PROMPT_SUBJECT_PATTERN,
  parseNameStatusLog,
  measureGitHistory,
};
