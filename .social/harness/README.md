# Blog Measurement Harness

Derives every figure the blog series quotes from the repository, its compiled modules, and
the frozen evidence set — so a draft never contains a number whose origin cannot be
re-established.

## Running it

```powershell
node .social/harness/runAllMeasurements.cjs
```

Writes two files into `.social/evidence/`:

- `metrics.json` — every figure with its source, stability, and measurement timestamp
- `metricsSnapshot.md` — the same figures grouped by consuming post, for draft writers

Exits non-zero if any measurement section failed. A failed section is reported in both
outputs rather than silently omitted, so a hole shows up as a hole.

| Flag | Effect |
|---|---|
| `--skip-history` | Skips the module-peak scan and the git-history scan (the slow parts) |

`--skip-history` carries the previous run's history figures forward rather than blanking them, so a
fast run cannot quietly degrade the evidence file. Carried figures keep their original measurement
timestamp and their source note says they were not re-measured. Run without the flag before
publishing anything that quotes a module peak or a git-history figure.

Set `AGENT_WARS_HARNESS_LOG_LEVEL` to `error`, `warn`, `debug`, or `trace` for more output.
The default is `warn`.

### Prerequisite

`measureToolSurface.cjs` reads the application's **compiled** modules, so `npm run build:main`
must have run. It compares the newest modification time under `src/main` against `dist/main`
and refuses to report against stale output — a tool count measured from last week's build
looks authoritative and is wrong, which is worse than no measurement.

Every other module reads source, markdown, CSV, or git directly and needs no build.

## Tests

```powershell
node .social/harness/tests/runHarnessTests.cjs
```

Covers the two line-counting definitions, duration parsing, file-set resolution, snapshot
cell formatting for structured values, and the failure cases that would otherwise corrupt a
published figure. Trivial accessors are not tested.

## Modules

| Module | Measures | Consumed by |
|---|---|---|
| `measureCodebase.cjs` | File and line counts by area, product/test split, substantive-line share, project-owned totals, per-hour rates | Posts 0, 1, 5, 7 |
| `measureEffort.cjs` | Logged hours per milestone, group subtotals, ranking, hours by problem domain | Posts 0, 1, 2, 6 |
| `measureSpecCorpus.cjs` | Completed design documents, sizes, largest, version arc, consolidation campaigns | Posts 0, 4, 7 |
| `measurePrompts.cjs` | Prompt size, length, and section structure from the frozen captures | Posts 3, 10, 12 |
| `measureToolSurface.cjs` | Tools built, withheld, and exposed; callback events parsed versus taught | Posts 8, 9, 11, 12 |
| `measureCircularDeps.cjs` | Baselined cycle count and whether the gate currently passes | Post 7 |
| `measureModuleHistory.cjs` | Historical peak line count per module, with the commit that held it | Post 7 |
| `measureGitHistory.cjs` | Repository shape, tag alignment, commit clusters, named commits, provenance, bounded effort rate | Posts 1, 6, 7, 12, 17 |

Shared code lives in `lib/`: `harnessLogger.cjs` (levelled logging), `fileScan.cjs` (file-set
definitions), `lineCounting.cjs` (the counting definitions), `togglParsing.cjs` (CSV and
durations), `metricsWriter.cjs` (output), `snapshotLayout.cjs` (which post gets which figure),
`draftParsing.cjs` (front matter and placeholders, used by the draft checker), and
`gitHistoryClusters.cjs` (subject-matched commit runs).

## Things to know before trusting a figure

**Substantive lines come from a heuristic, not a parser.** `lineCounting.cjs` skips blank
lines, `//` comments, and `/* */` blocks, and it will miscount a template-literal line
beginning with `*`. The resulting percentage is a proxy and any prose quoting it must say so.
The definition is frozen because it reproduces the figures the series already states.

**Hours cover a frozen window.** The time-log export is not re-pulled. Every hours figure
carries its coverage window, and prose must state that window rather than implying the total
describes the present.

**Git records the committer, not the typist.** `measureGitHistory.cjs` can count commits,
trailers, and authors. It cannot prove that no application code was hand-written.

## Draft checker

```powershell
node .social/harness/checkDrafts.cjs .social/drafts
```

Verifies front matter, word and character bands, banned words, placeholder-to-manifest
parity, and that every inline figure traces to `metrics.json`. Run it while drafting, not
only at the end, and before every publication.

A post with `status: stub` is checked against a different contract: it must carry `## Outline`
and `## Blockers` sections instead of the two platform sections, and the length bands do not
apply. Everything else -- front matter, slugs, figures, banned phrases, leak patterns -- is
checked identically, because a stub that quotes an unsourced number is exactly as wrong as a
draft that does.

What the checker cannot do is tell whether a sentence is true. The figure check confirms that a
number resembles something measured, not that the claim built around it holds. A clean run is the
floor, not editorial approval.

## Boundaries

The harness only ever writes `metrics.json` and `metricsSnapshot.md`. It never deletes files,
never cleans directories — `.social/evidence/` holds hand-written documents alongside
generated ones — and never refreshes the circular-dependency baseline, since refreshing a
baseline to silence a finding is the practice the series holds up as never allowed.

It performs no model runs. Every quality, cost, latency, token, and subscription figure the
series needs remains a placeholder until the evaluation apparatus exists.
