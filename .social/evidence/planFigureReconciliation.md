# Plan Figure Reconciliation

<!--
Companion copy. Paths that say evidence/ or harness/ refer to this folder and
.social/harness/ here. completed/blog-series-plan-7.md lives in the series tree, not
in this repository.
-->

Compares every figure asserted in `completed/blog-series-plan-7.md` against what the harness
measures. Written by hand from `metrics.json`; refresh metrics in the series tree before
trusting it. Do not re-run full measurements against this companion.

**Measured against:** `metrics.json` regenerated after the circular-dependency checker was
corrected to ignore type-only imports. Re-run the harness before treating any volatile figure
as current.
**Time-log coverage:** 01/01/2026 to 09/14/2026, frozen. This is the final extension of the
window. Never write hours as current.

## How to read the verdicts

| Verdict | Meaning for a draft |
|---|---|
| **Confirmed** | Quote it. The harness reproduces it. |
| **Clarified** | Quote it, but the plan's wording needs one adjustment noted below. |
| **Drifted** | Do not quote the plan's number. Use the measured one; the plan is stale. |
| **Contradicted** | Do not quote it at all. The claim is wrong about the code. |
| **Not measurable** | Placeholder only. No apparatus exists to produce it. |

## 1. Effort

Every hours figure in the plan should reproduce from the frozen export. The 160 / 155.87 /
3.9-as-work-weeks figures are **superseded**. Replacements: 170 prose (build total rounded
down), 172.3 exact build total, 178.82 grand total including Promotion, 4.3 measured work-weeks
at forty hours with licensed prose still "about four." Reason: the window was extended once
to close a stage the old window cut in half, and the prose basis now excludes promotion time.

| Plan asserts | Measured | Verdict |
|---|---|---|
| ~170 hours logged (prose form) | 172.3 exact build total; licensed prose form 170 | Clarified |
| About four work-weeks | 4.3 at forty hours; prose stays "about four" | Confirmed |
| ~141 hours development and test | 141.42 | Confirmed |
| Across 15 milestone buckets | 15 | Confirmed |
| ~28 h Fixes (M2.4) | 27.94 | Confirmed, with caveat |
| ~3 hours planning | 2.94 | Confirmed |
| ~6.5 hours promotion | 6.51; excluded from 170 | Confirmed |
| Costliest development: M2.3 ~21 h | 21.42 | Confirmed |
| M1.2 ~20 h | 19.94 | Confirmed |
| Largest line item: Fixes (M2.4) | 27.94, about 16% of build time | Confirmed, with caveat |
| M1.7 ~15 h | 14.65 | Confirmed |
| M2.4 ~14 h | 13.59 | Confirmed |
| M1.6 ~13 h | 12.88 | Confirmed |
| M0.5/DevOps ~13 h | 12.97 | Confirmed |
| M1.4 ~12 h | 12.00 exactly | Confirmed |
| Cheapest: M0.7 ~2 h | 1.95 | Confirmed |
| M0.6 ~2 h | 2.18 | Confirmed |
| M1.5 ~2.5 h | 2.47 | Confirmed |
| M1.1 ~3 h behind a 33 KB spec | 2.83 hours; spec is 33 KB | Confirmed |
| M1.3 ~3 h | 3.00 exactly | Confirmed |

**Superseded — 155.87, 160, and 3.9 work-weeks.** Those correctly measured a window that ended
2026-07-12. They are not current.

**Clarified — the Fixes bucket.** The export's row is `AgentWars: Fixes (M2.4)` at 27.94
hours. The label is milestone association, not work type. An unknown share is feature work.
Drafts that quote 27.94 or the two-to-one comparison with 13.59 must carry that caveat. It is
the largest single line item in the log, larger than M2.3 (21.42) and M1.2 (19.94).

**Clarified — the date range.** The export covers 01/01/2026 to 09/14/2026. Live copy treats
the work as about six months through mid-September. The harness confirms the total, not a
calendar smear of logged hours.

**New — hours by problem domain.** Not in the plan, and the strongest single finding available:

| Domain | Hours | Share of development time |
|---|---|---|
| Game systems | 70.69 | 50% |
| Geospatial and terrain | 43.38 | 31% |
| LLM systems | 17.10 | 12% |
| Foundation, spanning domains | 7.43 | 5% |
| Platform | 2.83 | 2% |

The grouping comes from milestone execution-plan titles, and each assignment records the title
that justifies it, so a reader can audit it. `M0.1-0.4` is one export row spanning three
domains and is therefore excluded from attribution rather than guessed at. The geospatial
figure is the useful one: the least familiar domain took nearly a third of development time
while the LLM integration — the part the series is nominally about — took an eighth.

**Not measurable as a phase split — debug-only hours.** The export is a summary with no phase
breakdown. The licensed 27.94 figure is the Fixes (M2.4) category, not a debug-hours split.
Drafts may quote it only with the milestone-association caveat. Do not estimate a pure
maintenance share.

## 2. Codebase

Every count reproduces exactly.

| Plan asserts | Measured | Verdict |
|---|---|---|
| 571 TypeScript files under `src/` | 571 | Confirmed |
| 136,391 physical lines under `src/` | 136,391 | Confirmed |
| 395 product files | 395 | Confirmed |
| 98,496 product lines | 98,496 | Confirmed |
| 176 test files | 176 | Confirmed |
| 37,895 test lines | 37,895 | Confirmed |
| Product substantive share ~53.6% | 53.6% | Confirmed |
| Test substantive share ~72.6% | 72.6% | Confirmed |
| 387 files in `main` | 387 | Confirmed |
| 92 files each in `renderer` and `shared` | 92 and 92 | Confirmed |
| 148,603 project-owned lines | 148,603 | Confirmed |
| 663 project-owned files | 663 | Confirmed |

**Derived rates — one figure.** Product TypeScript under `src/` (excluding `*.test.ts`) at
`3f82967` (2026-09-14), the last HEAD commit on or before the time-log end date, is 98,496
lines over 172.3 build-total hours: **571.7 lines per hour**. The effort window now covers the
code window, so the current-HEAD product rate agrees. See `gitHistoryFindings.md` section 2.
The old 532.2 / `2fa9ccc` / 155.87 figure, and the claim that unbounded rates were unsound, are
superseded.

**Contradicted — repository as proof of zero hand-written lines.** Git records the
committer, not who typed the characters. 11 of 288 commits carry a `Made-with:` trailer.
The claim is circumstantial (specification corpus, retrofit commits, consolidation patterns)
and must be written that way. See `gitHistoryFindings.md` section 9.

**Clarified — the substantive-line definition.** The 53.6% and 72.6% figures come from a
line-classifying heuristic, not a TypeScript parser. It skips blank lines, `//` comments, and
`/* */` blocks, and it miscounts a template-literal continuation line that begins with `*`.
The definition is frozen because it reproduces the plan's percentages, but any prose quoting
them must present them as a proxy. A test documents the known miscount deliberately.

All four counts are **volatile**: they grow with ordinary development. Re-measure before any
post quoting them publishes.

**Contradicted — "the constraints held."** The series plan concludes from the 249-line average
that the project's file-size rules were respected. The average does comply. The tail does not:

| Measure | Value |
|---|---|
| Product files over the 600-line desirable limit | 32 |
| Product files over the 1000-line hard ceiling | 7 |
| Largest product file | 3,272 lines, the renderer entry point |

Seven breaches of a stated hard ceiling is not compliance, and the largest file is still more
than three times the desirable limit after six consolidation campaigns. Post 5 must not claim
the constraints held. The accurate and more interesting claim is that the average complied while
the tail did not, which says the rule shaped ordinary work and failed to contain the outliers --
and that is Post 7's subject.

Note also that no `max-lines` rule exists in the ESLint configuration, so these limits are
process rules rather than enforced constants. Two custom lint plugins do exist and do enforce
orienting comments and naming conventions, which is why the substantive-line gap is real; the
size limits have no such enforcement, which is plausibly why they leak.

## 3. Documentation corpus

This is where the plan is most out of date.

| Plan asserts | Measured | Verdict |
|---|---|---|
| 99 completed design documents | 138 | **Drifted** |
| ~1.3 MB of specifications | 1.71 MB | **Drifted** |
| Largest is the ASCII hex map at ~60 KB | 60 KB, but now second | **Drifted** |
| MCP tools spec ~58 KB | 58 KB | Confirmed |
| Standing-orders plan ~55 KB | 55 KB | Confirmed |

The corpus grew by 39 documents and roughly 400 KB since the plan was written, and the largest
document is now the sixth maintainability consolidation plan at 66 KB — which is itself the
point Post 4 wants to make, so the drift is usable material rather than an inconvenience.

**Confirmed — six consolidation campaigns.** The plan says "v1 through v6" and the harness
counts six matching documents. This is the figure Post 7 turns on.

**Clarified — the version arc.** The sizes reproduce, but two documents are not where the plan
implies. Measured: game vision 8 KB superseded, 16 KB current; development plan 36 KB and 47 KB
superseded, 73 KB current. The plan says ~37 KB and ~48 KB; those round differently at the
kilobyte boundary and 36 and 47 are correct. Version 2 of the development plan and version 3.3
live in `docs/`, not in `.spec/deprecated/`. The current path is
`docs/devleopment-plan-v3.3.md`, misspelled in the repository; do not quote the filename.

## 4. Prompt artifacts

| Plan asserts | Measured | Verdict |
|---|---|---|
| Strategic prompt 44,047 characters | 44,047 bytes; 43,839 characters | **Clarified** |
| Strategic prompt 419 lines | 419 newlines; 420 physical lines | **Clarified** |
| Strategic prompt 19 headed sections | 19 | Confirmed |
| Tactical prompt 20,060 characters | 20,060 bytes; 20,014 characters | **Clarified** |
| Tactical prompt 171 lines | 171 newlines; 172 physical lines | **Clarified** |
| Tactical prompt 8 headed sections | 8 | Confirmed |
| Nine tools built, six exposed | 9 and 6, read from compiled modules | Confirmed |
| Token counts | Not measured | Not measurable |

**The character-versus-byte finding.** The plan's figures are byte lengths. The gap is exactly
the non-ASCII content: 104 characters in the strategic prompt and 23 in the tactical one are
en dashes, em dashes, and `≤`, each costing three UTF-8 bytes instead of one. 104 × 2 = 208 and
23 × 2 = 46, which accounts for both differences precisely. Prose saying "about 44,000
characters" is correct either way; a draft stating 44,047 characters is not. Say bytes, or
round.

**Both line figures are off by one** for the same reason: the plan counted newlines, and a file
whose last line lacks a trailing newline has one more line than it has newlines. Prefer "about
420 lines."

**Confirmed — the captures are one game state.** Turn 7, planning phase. They are not a size
bound across all game states, and no draft should imply they are. The strategic capture also
omits an operational map section that only reaches disk, noted in this folder's `README.md`.

**New — what the tactical prompt drops.** The tactical prompt is 46% of the strategic prompt's
size and omits eleven sections, including every one the plan names. This is a measured
structural comparison and stronger material than the raw sizes.

## 5. Module history

The plan's Post 7 figures are vindicated by a full-history scan. An earlier check that sampled
only milestone tags missed the peaks, which is worth knowing: sampling tags finds 3,132 lines
for the renderer and would have wrongly declared the plan unreproducible.

| Plan asserts | Measured peak | Verdict |
|---|---|---|
| Renderer entry point 5,543 lines | 5,543 at `fc55b613`, 2026-04-03 | Confirmed |
| OpenRouter client 2,374 lines | 2,374 at `fc55b613`, 2026-04-03 | Confirmed |
| Game actions 2,092 lines | 2,092 at `fc55b613`, 2026-04-03 | Confirmed |
| Game database 2,084 lines | 2,085 at `0f48e8ea`, 2026-04-03 | Confirmed, off by one |

Every peak lands on the same day, immediately before the first consolidation campaign. The
scan follows each module across the historical paths consolidation moved it through, so the
figures survive the renames.

## 6. Circular dependencies

**Baseline: 0 cycles. The gate currently passes.**

The 53-cycle baseline in the series plan, and the "new" cycle the checker reported against it,
were the same mistake. The checker counted `import type` as a runtime edge. TypeScript erases
those, so they cannot produce the initialisation-order bug the gate exists to catch. Counting
only imports that survive compilation, the project has zero cycles. The compiled main-process
output confirms it independently: 778 `require` edges across 227 modules, and no cycle among
them.

The checker was corrected to ignore type-only imports, and the baseline was emptied. Refreshing
the baseline to silence a finding remains forbidden; emptying it was the opposite of that --
the entries were never cycles.

Post 7 must not claim there were 53 real cycles. The interesting claim is the one the
correction produced: a gate that reports false findings trains you to accept a baseline, and
a baseline you have learned to accept is indistinguishable from no gate.

## 7. Corrections the plan already carries

Verified as still correct: the project is not eight months of work; there is no three-layer
architecture to describe; information symmetry was cut; the stack is not purely Electron and
TypeScript, since the terrain pipeline under `scripts/` is Python; nine tools exist with six
exposed and three pre-computed; consultation is model-gated.

## 8. Claims contradicted by the code

Do not carry these forward. Each was checked against the compiled modules.

**Hex assessments do not target observed enemy positions.** The routine assesses hexes
containing human-player units. The distinction matters because the plan's framing implies a
fog-of-war-aware selection that does not exist.

**Combat estimation is not withheld because a briefing is attached.** It is withheld when the
pre-computation path is active. The outcome looks similar and the mechanism is different, and
Post 8 is a post about mechanisms.

**Unit assessments run against opponent units,** not "every AI unit." Check the direction
before writing the sentence.

**The H3 leak check does not exist as the plan describes it.** The plan says H3 indices are
"enforced by an automated leak check that scans assembled prompts and tool payloads for
forbidden keys and validates candidates through `h3-js`." That is the design in the milestone
1.1 execution plan. It was not built that way. What exists is narrower:

- A regression test that runs a regular expression over the assembled system prompt looking for
  bracketed latitude and longitude pairs. It checks the system prompt only, it looks for
  coordinate pairs rather than H3 strings, and it does not touch tool payloads.
- Runtime redaction of tool results, which strips coordinate pairs and rewrites an H3-valued
  field into its hex-code equivalent before the result reaches the model.
- A callback-parameter sanitizer that converts H3 strings through the coordinate registry.
- A test asserting the callback vocabulary text does not name the H3 field.

Repository-wide search finds `h3-js` validation only in proximity and pathfinding code, never in
prompt auditing. Post 3 must describe the guard that exists, which is a real and defensible
piece of engineering, rather than the stronger one the plan promised. Writing the plan's version
would be publishing a claim the code contradicts.

The design intent is still quotable as intent, and the gap between the specified guard and the
built one is itself usable material: it is a small, concrete instance of an agent implementing
the part of a specification that was easy to verify.

## 9. Figures with no apparatus

Placeholders until the evaluation specification is built: every quality, cost, latency, token,
and subscription figure; scripted multi-model comparison results; the claimed minimum 20%
reduction from the ASCII hex map; and debug-only hours.

A post that depends on these cannot publish on measurement alone. That is the reason Posts 13
through 17 are stubs.
