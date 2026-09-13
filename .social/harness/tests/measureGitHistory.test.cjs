'use strict';

const { findCommitRuns } = require('../lib/gitHistoryClusters.cjs');
const { measureGitHistory, parseNameStatusLog } = require('../measureGitHistory.cjs');

/**
 * Contract tests for the subject-matched commit-run detector.
 *
 * Drafts describe these runs as campaigns, so the detector must distinguish a strictly
 * consecutive match sequence from a span that has a non-matching commit in the middle.
 */
module.exports = ({ test, assertEqual, assertThrows }) => {
  const commits = [
    { hash: 'a', subject: 'Build fix', timestamp: '2026-03-14T22:00:00', added: 1, updated: 0, renamed: 0, deleted: 0 },
    { hash: 'b', subject: 'Build fix', timestamp: '2026-03-14T22:10:00', added: 1, updated: 1, renamed: 0, deleted: 0 },
    { hash: 'c', subject: 'Build fix', timestamp: '2026-03-14T22:20:00', added: 0, updated: 1, renamed: 0, deleted: 0 },
    { hash: 'd', subject: 'Unrelated', timestamp: '2026-03-14T22:25:00', added: 2, updated: 0, renamed: 0, deleted: 0 },
    { hash: 'e', subject: 'Build fix', timestamp: '2026-03-14T22:30:00', added: 1, updated: 0, renamed: 0, deleted: 0 },
    { hash: 'f', subject: 'Prompt fixes', timestamp: '2026-08-23T10:00:00', added: 3, updated: 4, renamed: 0, deleted: 0 },
    { hash: 'g', subject: 'Prompt fixes', timestamp: '2026-08-24T10:00:00', added: 1, updated: 2, renamed: 0, deleted: 0 },
    { hash: 'h', subject: 'Spec updates', timestamp: '2026-08-24T12:00:00', added: 11, updated: 0, renamed: 0, deleted: 0 },
    { hash: 'i', subject: 'Tactical prompt fixes', timestamp: '2026-08-24T18:00:00', added: 0, updated: 5, renamed: 0, deleted: 0 },
  ];

  const buildMatch = (commit) => /build/i.test(commit.subject);
  const promptMatch = (commit) => /prompt/i.test(commit.subject);

  test('findCommitRuns reports a strictly consecutive run with zero interleaved', () => {
    const runs = findCommitRuns(commits, buildMatch, { maxInterleaved: 0, minLength: 2 });
    assertEqual(runs.length, 1, 'one consecutive build run');
    assertEqual(runs[0].matchingCount, 3, 'three consecutive builds');
    assertEqual(runs[0].interleavedCount, 0, 'no interleaved when gap is zero');
    assertEqual(runs[0].startHash, 'a', 'start hash');
    assertEqual(runs[0].endHash, 'c', 'end hash');
    assertEqual(runs[0].fileTouches, 4, 'matching file-touches only');
  });

  test('findCommitRuns counts a non-matching commit inside a prompt span', () => {
    const runs = findCommitRuns(commits, promptMatch, { maxInterleaved: 1, minLength: 2 });
    assertEqual(runs.length, 1, 'one prompt run');
    assertEqual(runs[0].matchingCount, 3, 'three prompt commits');
    assertEqual(runs[0].interleavedCount, 1, 'Spec updates is interleaved');
    assertEqual(runs[0].startHash, 'f', 'prompt start');
    assertEqual(runs[0].endHash, 'i', 'prompt end');
    assertEqual(runs[0].fileTouches, 15, 'matching file-touches, not the interleaved 11');
  });

  test('findCommitRuns splits matching commits that exceed maxGapMinutes', () => {
    const overnight = [
      { hash: 'x', subject: 'Build fix', timestamp: '2026-03-14T23:00:00', added: 1, updated: 0, renamed: 0, deleted: 0 },
      { hash: 'y', subject: 'Build fixes', timestamp: '2026-03-15T08:45:00', added: 1, updated: 0, renamed: 0, deleted: 0 },
    ];
    const runs = findCommitRuns(overnight, buildMatch, {
      maxInterleaved: 0,
      minLength: 1,
      maxGapMinutes: 120,
    });
    assertEqual(runs.length, 2, 'overnight gap splits the run');
    assertEqual(runs[0].startHash, 'x', 'evening run');
    assertEqual(runs[1].startHash, 'y', 'morning run');
  });

  test('findCommitRuns does not glue matches when timestamps are unparseable', () => {
    const broken = [
      { hash: 'p', subject: 'Build fix', timestamp: 'not-a-date', added: 1, updated: 0, renamed: 0, deleted: 0 },
      { hash: 'q', subject: 'Build fix', timestamp: 'also-bad', added: 1, updated: 0, renamed: 0, deleted: 0 },
    ];
    const runs = findCommitRuns(broken, buildMatch, {
      maxInterleaved: 0,
      minLength: 1,
      maxGapMinutes: 120,
    });
    assertEqual(runs.length, 2, 'unparseable timestamps refuse the glue');
  });

  test('findCommitRuns splits when non-matching commits exceed maxInterleaved', () => {
    const runs = findCommitRuns(commits, buildMatch, { maxInterleaved: 0, minLength: 1 });
    assertEqual(runs.length, 2, 'unrelated commit splits the build sequence');
    assertEqual(runs[0].endHash, 'c', 'first run ends before the gap');
    assertEqual(runs[1].startHash, 'e', 'second run is the later match');
  });

  test('findCommitRuns omits a match sequence shorter than minLength', () => {
    const runs = findCommitRuns(commits, buildMatch, { maxInterleaved: 0, minLength: 4 });
    assertEqual(runs.length, 0, 'three consecutive builds do not meet minLength 4');
  });

  test('parseNameStatusLog counts a rename status rather than ignoring it', () => {
    const parsed = parseNameStatusLog(
      ['COMMIT\tabc\tFULL\t2026-08-29T12:00:00\tAuthor\tIn-progress rename.', 'R100\told.ts\tnew.ts', ''].join(
        '\n',
      ),
    );
    assertEqual(parsed.length, 1, 'one commit');
    assertEqual(parsed[0].renamed, 1, 'R100 counts as renamed');
    assertEqual(parsed[0].added, 0, 'rename is not an add');
    assertEqual(parsed[0].deleted, 0, 'rename is not a delete');
  });

  test('findCommitRuns throws when required options are missing', () => {
    assertThrows(
      () => findCommitRuns(commits, buildMatch, {}),
      'maxInterleaved',
      'missing options are loud',
    );
  });

  test('measureGitHistory skip path returns figure shells without throwing', () => {
    const skipped = measureGitHistory({ enabled: false });
    assertEqual(skipped.skipped.value, true, 'skipped flag');
    assertEqual(skipped.commitsOnHead, undefined, 'no scan results when skipped');
  });
};
