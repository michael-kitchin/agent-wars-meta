# Git History Findings

Figures in this document come from `.social/harness/measureGitHistory.cjs`, written into
`metrics.json`. They are not transcribed from `.spec/git-history-summary.md`. Re-run the
module to refresh them. Commit hashes are short forms as git printed them.

## 1. Scope and Provenance

The module reads the ancestry of HEAD with `git log --name-status --find-renames`, plus
tag and trailer scans. It does not walk other branches except for the all-refs commit
count.

Stated limitations, from the measurement:

- Clusters are found by subject pattern and may miss a commit whose subject does not
  describe its content.
- Tag alignment is inferred from subject text and is evidence rather than proof.
- Per-commit file-status sums are not net change: a file touched in several commits counts
  in each.
- The unbounded rate of current lines over logged hours is not sound, because the
  repository continues past the time-log window.

Current shape: 274 commits on HEAD, 281 across all refs, 16 tags. First commit
2026-03-11, last 2026-09-13. Per-commit sums: 985 added, 3,004 updated, 328 renamed, 22
deleted.

## 2. The Effort Window Does Not Cover the Code Window

The time log ends 2026-07-12. The last milestone tag (`milestone-2.4`) is 2026-06-07.
Commits on HEAD run to 2026-09-13.

Dividing current `src/` volume by logged hours attributes post-July work to pre-July hours.
That unbounded rate remains in `metrics.json` so a draft can name it while calling it
unsound. It must not be asserted as a fact about the project.

The bounded rate uses product TypeScript under `src/` (excluding `*.test.ts`) at the last
commit on or before 2026-07-12, which is `2fa9ccc` (2026-07-05), 82,947 lines, over 155.87
logged hours: **532.2 lines per hour**.

## 3. Tag Semantics

All sixteen tags are lightweight. Most do not sit on the commit whose subject names that
milestone. Checking out a tag still gives end-of-milestone state, which is what replay
wants; the subject lines mislead an auditor who takes the tagged comment as the milestone
commit.

| Tag | Tagged commit | Date | Tagged subject | Nearest milestone-named commit | On it? |
| --- | --- | --- | --- | --- | --- |
| `milestone-0.2` | `5c8c935` | 2026-03-11 | Milestone 0.2 (Initial commit). | `5c8c935` | yes |
| `milestone-0.3` | `0a77d9a` | 2026-03-11 | Milestone 0.3 (OpenRouter integration). | `0a77d9a` | yes |
| `milestone-0.4` | `827f0ba` | 2026-03-13 | MCP spec fixes. | `4742730` Milestone 0.4: Combat and Victory. | no |
| `milestone-0.5` | `e382781` | 2026-03-16 | Added POC analysis. | none found | no |
| `milestone-0.6` | `70cdb89` | 2026-03-19 | Toast fix. | `5777603` Milestone 0.6 implementation, document reorg. | no |
| `milestone-0.7` | `c4b437d` | 2026-03-19 | Prompt & UI tweaks. | `4d58c82` Milestone 0.7 initial commit. | no |
| `milestone-1.1` | `7c0418c` | 2026-03-21 | Milestone 1.1 initial commit. | `7c0418c` | yes |
| `milestone-1.2` | `0e0bbeb` | 2026-03-29 | Unit startup and UI fixes. | `d5af0cb` Milestone 1.2 initial commit. | no |
| `milestone-1.4` | `c8adb82` | 2026-04-03 | Spec updates, combat fixes. | `f2c7c2f` Milestone 1.4 initial commit. | no |
| `milestone-1.5` | `b39a2dc` | 2026-04-03 | Added sealift phase. | `0f48e8e` Milestone 1.5 Initial commit. | no |
| `milestone-1.6` | `765d111` | 2026-04-07 | Database sync changes. | `4bc1c64` Milestone 1.6 - Initial commit. | no |
| `milestone-1.7` | `3c2dbfe` | 2026-04-11 | Updated development plan and combat rules. | `bb1ec44` Milestone 1.7 - Initial commit. | no |
| `milestone-2.1` | `bc98f8e` | 2026-04-12 | More tactical / strategic parity work. | `7877849` Milestone 2.1 - Initial commit. | no |
| `milestone-2.2` | `5fc99ca` | 2026-04-15 | Added slower tooltip. | `fe252f2` Milestone 2.2 - Initial commit. | no |
| `milestone-2.3` | `4887362` | 2026-04-30 | Updated terrain labels. | `c84fc25` Milestone 2.3 - Initial commit. Added road/rail vector layers and related. | no |
| `milestone-2.4` | `5177688` | 2026-06-07 | More border alpha and thickness changes. | none found | no |

Tagged milestone numbers: 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1.1, 1.2, 1.4, 1.5, 1.6, 1.7,
2.1, 2.2, 2.3, 2.4. Missing from that list: 0.1, 1.0, 1.3. A commit `d6c780e` "Milestone
1.3 initial commit" exists and is untagged.

## 4. The CI Feedback Cluster

Subject-matched build/CI runs, with at most two non-matching commits between matches and a
two-hour cap between consecutive matches:

| Start | End | Date | Span | Matching | Interleaved | File touches |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `d8edf37` | `b251eb8` | 2026-03-14 | 54 min | 12 | 2 | 14 |
| `59be79a` | `47729fe` | 2026-04-01 | 58 min | 6 | 1 | 14 |
| `5091dda` | `a54abfb` | 2026-04-10 | 28 min | 4 | 0 | 5 |

The 2026-03-14 evening span is fourteen commits, `d8edf37` 22:33:53 through `b251eb8`
23:27:32. Twelve match the build/CI subject pattern. Two do not: `1380a02` and
`bcc3a5b`, both "Switching to node 24." Matching subjects include "Updated build
workflow," "Fix build," "Add publish to electron-builder.ci.json," and "Update GitHub
Actions to v5" / "v6." `04d70f1` adds publish to the CI config; `b251eb8` removes it.
`89fff86` and `0def21a` are consecutive Actions version bumps.

The next morning, `c3eac93` "Build fixes" (2026-03-15 08:45) is a further matching
commit outside that evening run.

The April 10 run is four consecutive "Build fixes" commits in 28 minutes.

The project's verification bar is a command the agent runs locally and reads. CI results
live on a remote server the agent cannot read. The loop the commits show is push, wait,
fail, guess. This document does not assert what the agent perceived or intended.

## 5. The Comment and Lint Retrofit

`ed388c7` (2026-04-10), subject "Comments and lint settings.": 18 files added, 170 updated.
The orienting-comment convention was introduced mid-project and back-applied in one pass.
The substantive-line gap reported for Post 5 is the residue of that dated intervention, not
an emergent property of how the files grew.

## 6. Consolidation as Discrete Events

Named commits, re-derived:

| Commit | Date | Subject | Add | Update | Rename | Delete |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `89e453a` | 2026-04-04 | Refactored to smaller files for easier maintenance. | 53 | 8 | 9 | 0 |
| `ed388c7` | 2026-04-10 | Comments and lint settings. | 18 | 170 | 0 | 0 |
| `ca373e7` | 2026-08-29 | First round of renames. | 21 | 2 | 0 | 1 |
| `81f19cf` | 2026-08-29 | In-progress rename. | 0 | 0 | 200 | 0 |
| `cad4a26` | 2026-08-29 | In progress rename. | 3 | 187 | 0 | 0 |
| `c3cfcb9` | 2026-08-29 | Consolidation pass. | 18 | 23 | 0 | 0 |

The 2026-08-29 commits are a single-day campaign. Project-wide, 328 renames over 985 adds
is a ratio of 0.333. Renaming is nearly free when an agent performs it, so structural churn
a human team would defer happens in single sittings.

## 7. The Prompt-Governance Campaign

One subject-matched prompt run, 2026-08-22 09:13 (`4ecc2d9`) through 2026-08-26 16:02
(`7319cfa`): 13 matching commits, 3 interleaved, 305 file-touches on the matching
commits, 6,169 minutes.

The run is not strictly consecutive. Interleaved commits include `7f0190f` ("Spec
updates"), `ec2a5ad` ("Added another traffic sort strategy"), and `233fab4` ("More tatical
fixes."). Matching subjects run "Prompt fixes," "Strategic prompt fixes," "Tactical prompt
fixes," and close variants.

The campaign falls entirely outside the time-log window and contributes no hours to the
logged total.

## 8. Human-Authored Artifacts

11 of 274 commits have a `Made-with:` trailer in the body. Authors: 273 as
Michael J. Kitchin, 1 as michael-kitchin.

Subject lines are terse and repetitive. Several carry typographical errors: `Tacitcal`,
`tatical`, `tactial`, `Toaste`, `Lunux`, `regon`, `docuiment`.

In a project where agents authored the application code, the commit message is among the
few artifacts authored directly by a human, and it received none of the specification, audit,
or verification discipline applied to everything the agents touched.

## 9. What This Evidence Does Not Show

The git history does not prove that no application code was hand-written. Git records the
committer, not who typed the characters. Every commit is authored under one of two name
strings, and the `Made-with:` trailer appears on 11 of 274. The case is circumstantial and
rests on the specification corpus, the consolidation patterns, and the retrofit commits.
A draft that cites the repository as proof of the zero-hand-written-lines claim is
overstating what git can show.
