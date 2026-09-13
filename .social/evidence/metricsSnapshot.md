# Measurement Snapshot

Generated 2026-09-13T19:55:17.807Z by `.social/harness/runAllMeasurements.cjs`. Do not hand-edit.

Every inline figure in a draft must appear here. Anything absent is a `[DATA]` placeholder.

Figures marked **volatile** grow with ordinary development and must be re-measured before
the post quoting them publishes. Hours figures cover a frozen window and must never be
written as though they describe the present.

## Post 0 — Start Here

Scope anchor only. Quote each figure once and keep the hub short.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Logged hours (prose form) | 156 | derived: grand total rounded to whole hours, the form prose should use | stable |
| Coverage window start | 2026-01-01 | parsed from the export filename TogglTrack_Report_Summary_report_(from_01_01_2026_to_07_12_2026).csv | stable |
| Coverage window end | 2026-07-12 | parsed from the export filename TogglTrack_Report_Summary_report_(from_01_01_2026_to_07_12_2026).csv | stable |
| Source files in src/ | 571 | file set "src" | stable |
| Physical lines in src/ | 136,391 | file set "src" | stable |
| Completed design documents | 138 | file set "spec-corpus" | **volatile** |
| Design corpus size (MB) | 1.71 | derived: total bytes / 1048576, the form prose quotes | **volatile** |
| Top-level plan version arc | label game vision v1 relativePath .spec/deprecated/game-vision-v1.md status superseded bytes 7,909 kilobytes 8; label game vision v2 relativePath docs/game-vision-v2.md status current bytes 16,592 kilobytes 16; label development plan v1 relativePath .spec/deprecated/development-plan-v1.md status superseded bytes 37,228 kilobytes 36; label development plan v2 relativePath .spec/deprecated/development-plan-v2.md status superseded bytes 47,889 kilobytes 47; label development plan v3.3 relativePath docs/devleopment-plan-v3.3.md status current bytes 75,118 kilobytes 73 | named superseded and current top-level plans; superseded in .spec/deprecated, current in docs/ | stable |

## Post 1 — 156 Hours, Zero Hand-Written Lines

The provenance claim, the scale, and the hours distribution. State the coverage window wherever the total appears. No intervention figures here; those belong to Post 6.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Logged hours (prose form) | 156 | derived: grand total rounded to whole hours, the form prose should use | stable |
| Logged hours (exact) | 155.87 | derived: total seconds / 3600 | stable |
| Work-weeks at 40h | 3.9 | derived: grand total hours / 40 | stable |
| Development and test hours | 141.42 | derived: development seconds / 3600 | stable |
| Development buckets | 15 | time-log export TogglTrack_Report_Summary_report_(from_01_01_2026_to_07_12_2026).csv, covering 2026-01-01 to 2026-07-12, rows categorised "Dev & Test" | stable |
| Non-development categories | Fixes (M2.4) 5 Planning 2.94 Promotion 6.51 | time-log export TogglTrack_Report_Summary_report_(from_01_01_2026_to_07_12_2026).csv, covering 2026-01-01 to 2026-07-12, non-development rows | stable |
| Milestone hours ranked | milestone M2.3 hours 21.4; milestone M1.2 hours 19.9; milestone M1.7 hours 14.7; milestone M2.4 hours 13.6; milestone M0.5, DevOps hours 13; milestone M1.6 hours 12.9; milestone M1.4 hours 12; milestone M2.1 hours 8.3; milestone M0.1-0.4 hours 7.4; milestone M2.2 hours 5.8; milestone M1.3 hours 3; milestone M1.1 hours 2.8; milestone M1.5 hours 2.5; milestone M0.6 hours 2.2; milestone M0.7 hours 2 | derived: development buckets sorted by seconds, descending | stable |
| Source files in src/ | 571 | file set "src" | stable |
| Physical lines in src/ | 136,391 | file set "src" | stable |
| src lines per logged hour | 875 | derived: src physical lines / hours | stable |
| Bounded src product lines per hour | 532.2 | derived: product lines at cutoff / logged hours | stable |
| Bounded-rate cutoff commit | 2fa9ccc | last HEAD commit on or before 2026-07-12 | stable |
| Bounded-rate cutoff date | 2026-07-12 | effort.coverageWindow.to | stable |
| Project-owned files | 663 | file set "project-owned" | stable |
| Project-owned lines | 148,603 | file set "project-owned" | stable |

## Post 2 — Why I Picked a Stack I Already Knew

The control-variables argument. The domain grouping is a proxy for where effort pooled, not a defect count, and its method must be stated in the post.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Hours by problem domain | mixed-foundation hours 7.4 milestones M0.1-0.4 llm-systems hours 17.1 milestones M0.5, DevOps, M0.6, M0.7 platform hours 2.8 milestones M1.1 geospatial hours 43.4 milestones M1.2, M1.3, M1.7, M2.2 game-systems hours 70.7 milestones M1.4, M1.5, M1.6, M2.1, M2.3, M2.4 | derived: development buckets grouped by the domain named in each milestone execution-plan title | stable |
| Domain assignment method | M0.1-0.4 domain mixed-foundation evidence Combined bucket: Hello Hex World, Game State and Turns, The LLM Opponent, Combat and Victory M0.5, DevOps domain llm-systems evidence Milestone 0.5 First MCP Tool, Tool 2 Threat and Situation Assessment, Tool 3 Combat Outcome Estimation M0.6 domain llm-systems evidence Milestone 0.6 - Pre-Computation and Briefing Format M0.7 domain llm-systems evidence Milestone 0.7 - Callback System and Event-Driven Consultation M1.1 domain platform evidence Milestone 1.1 - Transition from 0.7 Prototype to Production Baseline M1.2 domain geospatial evidence Milestone 1.2 - EarthEnv to H3 Terrain Pipeline M1.3 domain geospatial evidence Milestone 1.3 - Fog of War and Subjective Views M1.4 domain game-systems evidence Milestone 1.4 - Hex Control and Production Queues M1.5 domain game-systems evidence Milestone 1.5 - Air Units, Strikes, and Infrastructure Effects M1.6 domain game-systems evidence Milestone 1.6 - Naval Transport Sealift M1.7 domain geospatial evidence Milestone 1.7 - Region-vs-Region Scenario M2.1 domain game-systems evidence Milestone 2.1 - Tactical Battle Entry M2.2 domain geospatial evidence Milestone 2.2 - Terrain-Blocked Tactical Movement M2.3 domain game-systems evidence Milestone 2.3 - Bail-Out Resolution and AI Tactical Play M2.4 domain game-systems evidence Milestone 2.4 - Tactical Integration and Balance | domain assignment with the milestone title that justifies it; state this method wherever the grouping is used | stable |
| Time-log limitations | This export is a summary by task. It carries no phase breakdown, so design, generation, review, and debugging hours cannot be separated., Any claim about debug hours specifically is therefore not derivable from this artifact and must remain a placeholder., The M0.1-0.4 bucket combines four milestones across three domains and is grouped as mixed rather than attributed. | stated limitations of the summary export | stable |
| Logged hours (prose form) | 156 | derived: grand total rounded to whole hours, the form prose should use | stable |
| Completed design documents | 138 | file set "spec-corpus" | **volatile** |
| Python files (the second language) | 43 | file set "scripts-python" | stable |
| Python physical lines | 7,219 | file set "scripts-python" | stable |
| Python share of project-owned lines | 4.9 | derived: Python physical lines / project-owned physical lines | stable |

## Post 3 — Four Coordinate Formats

Prompt figures come from the frozen captures. Never state a specific token-reduction percentage; the estimated minimum of 20%, varying by game state, is the required form.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Strategic prompt bytes | 44,047 | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, UTF-8 byte length — this is the figure the series plan quotes as a character count | stable |
| Strategic prompt characters | 43,839 | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, UTF-8 code-unit count | stable |
| Strategic prompt lines | 420 | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, physical-line definition | stable |
| Strategic section count | 19 | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, ATX headings | stable |
| Prompt measurement limitations | These are captures of one game state (turn 7, planning) and not a size bound across all states., The series plan states 419 and 171 lines; those are newline counts. The files hold 420 and 172 physical lines., The series plan states 44,047 and 20,060 characters; those are byte lengths. Character counts are 43,839 and 20,014, the difference being non-ASCII punctuation. Prose saying "about 44,000 characters" is correct either way., Token counts are not measured. A characters-per-token heuristic is an estimate, not a figure, and must stay a placeholder. | stated limitations of the prompt measurement | stable |

## Post 4 — Design Documents as Operational Artifacts

Use the measured corpus figures, not any previously stated ones. Do not quote a docs-to-code ratio; the two corpora are not comparable units.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Completed design documents | 138 | file set "spec-corpus" | **volatile** |
| Design corpus size (MB) | 1.71 | derived: total bytes / 1048576, the form prose quotes | **volatile** |
| Mean document size (KB) | 12.7 | derived: total bytes / document count / 1024 | **volatile** |
| Largest documents | name maintainability-consolidation-execution-plan-v6.md bytes 67,150 kilobytes 66; name ascii-hex-map.md bytes 61,915 kilobytes 60; name mcp-tools-spec.md bytes 59,548 kilobytes 58; name mcp-tool5-standing-orders-execution-plan.md bytes 56,503 kilobytes 55; name ai-commander-prompt-implementation-plan.md bytes 49,336 kilobytes 48; name naming-conventions-execution-plan-v1.md bytes 43,639 kilobytes 43; name milestone-0.7-execution-plan.md bytes 42,763 kilobytes 42; name unit-id-format-execution-plan-v1.md bytes 37,991 kilobytes 37; name maintainability-consolidation-execution-plan-v5.md bytes 34,227 kilobytes 33; name milestone-1.1-execution-plan.md bytes 33,812 kilobytes 33 | file set "spec-corpus", 10 largest by byte size | **volatile** |
| Top-level plan version arc | label game vision v1 relativePath .spec/deprecated/game-vision-v1.md status superseded bytes 7,909 kilobytes 8; label game vision v2 relativePath docs/game-vision-v2.md status current bytes 16,592 kilobytes 16; label development plan v1 relativePath .spec/deprecated/development-plan-v1.md status superseded bytes 37,228 kilobytes 36; label development plan v2 relativePath .spec/deprecated/development-plan-v2.md status superseded bytes 47,889 kilobytes 47; label development plan v3.3 relativePath docs/devleopment-plan-v3.3.md status current bytes 75,118 kilobytes 73 | named superseded and current top-level plans; superseded in .spec/deprecated, current in docs/ | stable |
| Superseded plans retained | development-plan-v1.md, development-plan-v2.md, game-vision-v1.md | file set "spec-deprecated" | stable |
| Corpus limitations | Filesystem timestamps do not reliably track authoring order, so dates from this corpus are usable only as a relative arc., Corpus size and code size are each quotable alone; a byte-for-byte docs-to-code ratio is not published because the two corpora are not comparable units. | stated limitations of the corpus measurement | stable |

## Post 5 — Rules for a Weak Agent

The substantive-line gap is the measurable rule. It comes from a heuristic, not a parser, so present it as a proxy and state the counting definition in the post.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Product substantive share (%) | 53.6 | derived: substantive / physical, a proxy rather than an exact figure | stable |
| Test substantive share (%) | 72.6 | derived: substantive / physical, a proxy rather than an exact figure | stable |
| Gap in percentage points | 19 | derived: test substantive share minus product substantive share, in percentage points | stable |
| Mean product file lines | 249.4 | derived: product physical lines / product files | stable |
| Product files | 395 | file set "src" excluding *.test.ts | stable |
| Test-to-product by line | 0.385 | derived: test physical lines / product physical lines | stable |
| Test-to-product by file | 0.446 | derived: test files / product files | stable |
| Stated desirable line limit | 600 | the project's stated desirable file-size limit | stable |
| Stated hard line ceiling | 1,000 | the project's stated hard file-size ceiling | stable |
| Product files over the desirable limit | 32 | product files whose physical line count exceeds the desirable limit | stable |
| Product files over the hard ceiling | 7 | product files whose physical line count exceeds the hard ceiling | stable |

## Post 6 — Where the Tools Broke Down

The boundaries taxonomy is the post; the intervention rate is support. That rate is a manual tally and is not measured here, so it stays a placeholder.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Milestone hours ranked | milestone M2.3 hours 21.4; milestone M1.2 hours 19.9; milestone M1.7 hours 14.7; milestone M2.4 hours 13.6; milestone M0.5, DevOps hours 13; milestone M1.6 hours 12.9; milestone M1.4 hours 12; milestone M2.1 hours 8.3; milestone M0.1-0.4 hours 7.4; milestone M2.2 hours 5.8; milestone M1.3 hours 3; milestone M1.1 hours 2.8; milestone M1.5 hours 2.5; milestone M0.6 hours 2.2; milestone M0.7 hours 2 | derived: development buckets sorted by seconds, descending | stable |
| Hours by problem domain | mixed-foundation hours 7.4 milestones M0.1-0.4 llm-systems hours 17.1 milestones M0.5, DevOps, M0.6, M0.7 platform hours 2.8 milestones M1.1 geospatial hours 43.4 milestones M1.2, M1.3, M1.7, M2.2 game-systems hours 70.7 milestones M1.4, M1.5, M1.6, M2.1, M2.3, M2.4 | derived: development buckets grouped by the domain named in each milestone execution-plan title | stable |
| Time-log limitations | This export is a summary by task. It carries no phase breakdown, so design, generation, review, and debugging hours cannot be separated., Any claim about debug hours specifically is therefore not derivable from this artifact and must remain a placeholder., The M0.1-0.4 bucket combines four milestones across three domains and is grouped as mixed rather than attributed. | stated limitations of the summary export | stable |
| CI commit clusters | startHash d8edf37 endHash b251eb8 startTimestamp 2026-03-14T22:33:53-06:00 endTimestamp 2026-03-14T23:27:32-06:00 spanMinutes 54 matchingCount 12 interleavedCount 2 fileTouches 14 matchingHashes d8edf37, fc7605a, d7eebfc, 2096530, 1284c48, 48757d5, 04d70f1, 89fff86, 0def21a, 394eaaa, 211cb21, b251eb8; startHash 59be79a endHash 47729fe startTimestamp 2026-04-01T10:27:20-06:00 endTimestamp 2026-04-01T11:25:43-06:00 spanMinutes 58 matchingCount 6 interleavedCount 1 fileTouches 14 matchingHashes 59be79a, cc532df, d06e5d3, 79fb8ec, 9269a17, 47729fe; startHash 5091dda endHash a54abfb startTimestamp 2026-04-10T22:59:21-06:00 endTimestamp 2026-04-10T23:27:22-06:00 spanMinutes 28 matchingCount 4 interleavedCount 0 fileTouches 5 matchingHashes 5091dda, 1eae025, b1b2a9f, a54abfb | subject-matched build/CI runs, maxInterleaved 2, maxGapMinutes 120, minLength 4 | stable |

## Post 7 — The Sprawl Problem

Module peaks come from a full commit-history scan, not from milestone tags, which understate them substantially. Each peak carries its commit so the figure can be checked by hand.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Historical module peaks | label renderer entry point peakLines 5,543 peakPath src/renderer/renderer.ts peakCommit fc55b613 peakDate 2026-04-03 pathsScanned path src/renderer/renderer.ts existed true commitsTouching 100 peakLines 5,543 peakCommit fc55b613 peakDate 2026-04-03; label OpenRouter client peakLines 2,374 peakPath src/main/openRouter.ts peakCommit fc55b613 peakDate 2026-04-03 pathsScanned path src/main/openRouter.ts existed true commitsTouching 43 peakLines 2,374 peakCommit fc55b613 peakDate 2026-04-03; path src/main/openRouter/openRouter.ts existed true commitsTouching 3 peakLines 472 peakCommit cad4a26a peakDate 2026-08-29; label game actions peakLines 2,092 peakPath src/main/gameActions.ts peakCommit fc55b613 peakDate 2026-04-03 pathsScanned path src/main/gameActions.ts existed true commitsTouching 54 peakLines 2,092 peakCommit fc55b613 peakDate 2026-04-03; path src/main/gameActions/gameActionsCore.ts existed true commitsTouching 4 peakLines 1,804 peakCommit 943d02ca peakDate 2026-08-29; label game database peakLines 2,085 peakPath src/main/gameDb.ts peakCommit 0f48e8ea peakDate 2026-04-03 pathsScanned path src/main/gameDb.ts existed true commitsTouching 44 peakLines 2,085 peakCommit 0f48e8ea peakDate 2026-04-03 | peak physical line count each module ever reached, across every path it has occupied | stable |
| Scan method | Every commit touching each path is examined, across all refs, not only tagged milestones., Milestone tags alone understate these peaks substantially, which is why the tag-sampling approach was abandoned., A path that never existed is reported as such rather than as a zero. | how the scan works and why | stable |
| Baselined cycle count | 0 | scripts/circular-deps-baseline.json, array length | stable |
| Checker currently passes | true | exit status of check-circular-deps.cjs: passing means no new or reshaped cycles beyond the baseline | stable |
| Cycles counting type-only imports | 54 | source-level cycles when type-only imports are counted as edges -- the definition the gate used to apply | stable |
| Runtime source cycles | 0 | source-level cycles counting only imports that survive compilation | stable |
| Compiled main-process modules | 227 | dist/main JavaScript modules, tests excluded | stable |
| Compiled require edges | 778 | relative require() calls between dist/main modules | stable |
| Cycles in the compiled graph | 0 | cycles in the compiled require graph, which is the run-time truth the source checker approximates | stable |
| How the gate reads | The gate counts only imports that survive compilation; type-only imports are erased and cannot cause the initialisation-order bug it exists to catch., The gate fails only on new or reshaped cycles, not on the baselined ones., The baseline is never refreshed to silence a finding; the correct fix is to change the import direction., The checker parses src/ directly and needs no build step. | how the gate is meant to be read | stable |
| Mean product file lines | 249.4 | derived: product physical lines / product files | stable |
| Product files | 395 | file set "src" excluding *.test.ts | stable |
| Product files still over the hard ceiling | 7 | product files whose physical line count exceeds the hard ceiling | stable |
| Largest product file today (lines) | 3,272 | largest product file by physical lines | stable |
| Largest product file today (path) | src/renderer/renderer.ts | path of the largest product file | stable |
| Consolidation campaigns | count 6 files maintainability-consolidation-execution-plan-v2.md, maintainability-consolidation-execution-plan-v3.md, maintainability-consolidation-execution-plan-v4.md, maintainability-consolidation-execution-plan-v5.md, maintainability-consolidation-execution-plan-v6.md, maintainability-consolidation-execution-plan.md | filenames in .spec/completed matching the maintainability consolidation plan pattern | **volatile** |
| Named consolidation commits | hash ed388c7 date 2026-04-10 subject Comments and lint settings. added 18 updated 170 renamed 0 deleted 0; hash 89e453a date 2026-04-04 subject Refactored to smaller files for easier maintenance. added 53 updated 8 renamed 9 deleted 0; hash ca373e7 date 2026-08-29 subject First round of renames. added 21 updated 2 renamed 0 deleted 1; hash 81f19cf date 2026-08-29 subject In-progress rename. added 0 updated 0 renamed 200 deleted 0; hash cad4a26 date 2026-08-29 subject In progress rename. added 3 updated 187 renamed 0 deleted 0; hash c3cfcb9 date 2026-08-29 subject Consolidation pass. added 18 updated 23 renamed 0 deleted 0 | configured hashes re-derived from git log --name-status | stable |
| Rename ratio (renames / adds) | 0.333 | derived: filesRenamed / filesAdded | **volatile** |
| Files renamed (per-commit sum) | 328 | sum of per-commit R statuses on HEAD | **volatile** |
| Files added (per-commit sum) | 985 | sum of per-commit A statuses on HEAD | **volatile** |

## Post 8 — Nine Tools, and the Ones I Took Away

Every count here is derived by calling the application code, not by reading a document.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Tools built | 9 | getToolNamesForEnabledGroups across every group | stable |
| Tool names | assess_hex, assess_unit, check_distance, estimate_combat, memory_read, plan_route, query_orders, query_production, set_build_queue | getToolNamesForEnabledGroups across every group | stable |
| Tools withheld | 3 | ASSESSMENT_TOOL_NAMES plus COMBAT_ESTIMATION_TOOL_NAMES, the set pre-computation withholds | stable |
| Withheld names | assess_hex, assess_unit, estimate_combat | ASSESSMENT_TOOL_NAMES plus COMBAT_ESTIMATION_TOOL_NAMES | stable |
| Tools exposed | 6 | derived: built names minus withheld names | stable |
| Exposed names | check_distance, memory_read, plan_route, query_orders, query_production, set_build_queue | derived: built names minus withheld names | stable |
| Definitions actually emitted | 6 | buildToolDefinitions(exposed).length, the count actually sent to the model | stable |
| Tool surface limitations | The exposed count reflects every tool group being enabled, which is the default state. A run with groups disabled would expose fewer., Withholding is driven by the pre-computation flag; a consult with pre-computation off would expose all nine. | stated limitations of the tool-surface measurement | stable |

## Post 9 — Pre-Computation, Episodic Consultation, Persistent Orders

Avoid any three-layer framing. Cost figures require live runs and are not measured here.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Tools withheld to pre-computation | assess_hex, assess_unit, estimate_combat | ASSESSMENT_TOOL_NAMES plus COMBAT_ESTIMATION_TOOL_NAMES | stable |
| Callback events taught | infrastructure_destroyed, threat_escalation, turns, unit_arrived, unit_destroyed, unit_engaged | TAUGHT_CALLBACK_EVENTS in callbackVocabularyText | stable |
| Callback events parsed | infrastructure_destroyed, territory_changed, threat_escalation, turns, unit_arrived, unit_destroyed, unit_engaged | CALLBACK_EVENT_VOCAB in orderResponseParsing | stable |

## Post 10 — Two Commanders, Two Maps

The section lists and the dropped-section list are derived from the frozen captures.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Strategic sections | 19 | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, ATX headings | stable |
| Strategic section list | level 1 text Commander's Briefing; level 2 text Unit Status and Threats; level 2 text Attention Flags; level 1 text Operational Map; level 3 text Best Options This Turn; level 2 text Supplemental Hex Intelligence; level 2 text Recent Turn Notes; level 1 text Production Status; level 2 text Controlled Hex Queues; level 1 text Your Strategic Memory; level 2 text Persistent (Active Strategic Context); level 2 text Reminders Triggered This Turn; level 1 text Standing Order Status; level 2 text Units Without Standing Orders; level 2 text Active Callbacks; level 1 text Scenario Objective (Required); level 1 text Air Operations Status; level 1 text Naval Transport Status; level 1 text Available Tools | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, ordered heading list with levels | stable |
| Tactical sections | 8 | frozen captures in .social/evidence/, character counts and ATX heading counts: tactical, ATX headings | stable |
| Tactical section list | level 1 text Commander's Briefing; level 2 text Unit Status and Threats; level 2 text Attention Flags; level 1 text Operational Map; level 3 text Best Options This Turn; level 2 text Recent Turn Notes; level 2 text Active Callbacks; level 1 text Available Tools | frozen captures in .social/evidence/, character counts and ATX heading counts: tactical, ordered heading list with levels | stable |
| Sections tactical drops | Supplemental Hex Intelligence, Production Status, Controlled Hex Queues, Your Strategic Memory, Persistent (Active Strategic Context), Reminders Triggered This Turn, Standing Order Status, Units Without Standing Orders, Scenario Objective (Required), Air Operations Status, Naval Transport Status | derived: strategic heading texts with no tactical counterpart | stable |
| Tactical share of strategic size (%) | 46 | derived: tactical characters / strategic characters, as a percentage | stable |
| Strategic prompt bytes | 44,047 | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, UTF-8 byte length — this is the figure the series plan quotes as a character count | stable |
| Tactical prompt bytes | 20,060 | frozen captures in .social/evidence/, character counts and ATX heading counts: tactical, UTF-8 byte length — this is the figure the series plan quotes as a character count | stable |

## Post 11 — Keeping an LLM Coherent

Persistence and subscription-pattern figures require live runs and stay placeholders.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Callback events taught | infrastructure_destroyed, threat_escalation, turns, unit_arrived, unit_destroyed, unit_engaged | TAUGHT_CALLBACK_EVENTS in callbackVocabularyText | stable |
| Callback events parsed | infrastructure_destroyed, territory_changed, threat_escalation, turns, unit_arrived, unit_destroyed, unit_engaged | CALLBACK_EVENT_VOCAB in orderResponseParsing | stable |
| Parsed but not taught | territory_changed | derived: accepted by the parser but deliberately not taught to the model | stable |

## Post 12 — Governing a Prompt Like Code

The taught-versus-parsed gap is the documented governance decision with a paper trail.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Parsed but not taught | territory_changed | derived: accepted by the parser but deliberately not taught to the model | stable |
| Callback events parsed | infrastructure_destroyed, territory_changed, threat_escalation, turns, unit_arrived, unit_destroyed, unit_engaged | CALLBACK_EVENT_VOCAB in orderResponseParsing | stable |
| Callback events taught | infrastructure_destroyed, threat_escalation, turns, unit_arrived, unit_destroyed, unit_engaged | TAUGHT_CALLBACK_EVENTS in callbackVocabularyText | stable |
| Strategic section list | level 1 text Commander's Briefing; level 2 text Unit Status and Threats; level 2 text Attention Flags; level 1 text Operational Map; level 3 text Best Options This Turn; level 2 text Supplemental Hex Intelligence; level 2 text Recent Turn Notes; level 1 text Production Status; level 2 text Controlled Hex Queues; level 1 text Your Strategic Memory; level 2 text Persistent (Active Strategic Context); level 2 text Reminders Triggered This Turn; level 1 text Standing Order Status; level 2 text Units Without Standing Orders; level 2 text Active Callbacks; level 1 text Scenario Objective (Required); level 1 text Air Operations Status; level 1 text Naval Transport Status; level 1 text Available Tools | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, ordered heading list with levels | stable |
| Prompt commit cluster | startHash 4ecc2d9 endHash 7319cfa startTimestamp 2026-08-22T09:13:16-06:00 endTimestamp 2026-08-26T16:02:03-06:00 spanMinutes 6,169 matchingCount 13 interleavedCount 3 fileTouches 305 matchingHashes 4ecc2d9, cbf3312, f03f2d8, 0e9caf8, a123ee7, 72ebad6, 50b7c82, 8929ac4, 23ddc98, 5089cbe, e0713fc, 11c56ec, 7319cfa | subject-matched prompt runs, maxInterleaved 1, maxGapMinutes 7200, minLength 8 | stable |

## Posts 13 through 17 — Measurement-dependent

These posts turn on scored model runs, which this harness does not perform. Every quality, cost, latency, and subscription figure in them is a placeholder until the evaluation apparatus exists.

| Figure | Value | Source | Stability |
|---|---|---|---|
| Strategic prompt bytes (cost framing) | 44,047 | frozen captures in .social/evidence/, character counts and ATX heading counts: strategic, UTF-8 byte length — this is the figure the series plan quotes as a character count | stable |
| Historical module peaks (synthesis) | label renderer entry point peakLines 5,543 peakPath src/renderer/renderer.ts peakCommit fc55b613 peakDate 2026-04-03 pathsScanned path src/renderer/renderer.ts existed true commitsTouching 100 peakLines 5,543 peakCommit fc55b613 peakDate 2026-04-03; label OpenRouter client peakLines 2,374 peakPath src/main/openRouter.ts peakCommit fc55b613 peakDate 2026-04-03 pathsScanned path src/main/openRouter.ts existed true commitsTouching 43 peakLines 2,374 peakCommit fc55b613 peakDate 2026-04-03; path src/main/openRouter/openRouter.ts existed true commitsTouching 3 peakLines 472 peakCommit cad4a26a peakDate 2026-08-29; label game actions peakLines 2,092 peakPath src/main/gameActions.ts peakCommit fc55b613 peakDate 2026-04-03 pathsScanned path src/main/gameActions.ts existed true commitsTouching 54 peakLines 2,092 peakCommit fc55b613 peakDate 2026-04-03; path src/main/gameActions/gameActionsCore.ts existed true commitsTouching 4 peakLines 1,804 peakCommit 943d02ca peakDate 2026-08-29; label game database peakLines 2,085 peakPath src/main/gameDb.ts peakCommit 0f48e8ea peakDate 2026-04-03 pathsScanned path src/main/gameDb.ts existed true commitsTouching 44 peakLines 2,085 peakCommit 0f48e8ea peakDate 2026-04-03 | peak physical line count each module ever reached, across every path it has occupied | stable |
| Logged hours (synthesis) | 156 | derived: grand total rounded to whole hours, the form prose should use | stable |
| HEAD commit count | 274 | git rev-list --count HEAD | **volatile** |
| Made-with trailer count | 11 | git log --grep=Made-with: on HEAD | stable |

