# Docs

This is the `docs/` folder from a private game repository, published here as evidence
for the Agent Wars series on *Standing Orders*. The game source stays private. Paths
under `src/` are named for traceability; they aren't in this companion. Which
documents carry a series argument, and which are process context, is in
[COMPANION.md](COMPANION.md).

Living documentation for Agent Wars. **The engine under `src/` is first authority.** If a number, phase order, cap, range, or legality rule here disagrees with a symbol in code, the code is correct and this folder should be updated.

Shipping version as of this writing: **2.4.0** (`package.json`). Phase 0 (hybrid AI) and Phase 1 (global strategic game) are complete. Phase 2 tactical battles are complete through milestone **2.4**. Milestone **2.5** (player-facing save/load and session management) is not shipped. Later polish, diplomacy, and async multiplayer remain unbuilt.

## How to Read This Folder

| Document | Role | Status | Cited by |
| --- | --- | --- | --- |
| [COMPANION.md](COMPANION.md) | Cited-versus-context split for this companion | **Companion orientation.** Not a game document. | Orientation |
| [README.md](README.md) | Index of this folder | **Current index.** | Post 4 |
| [combat-rules-v3.md](combat-rules-v3.md) | Combat, movement, production, fog, sealift, and tactical battles | **Current mechanics.** Numbers are taken from engine constants. | Context |
| [game-size-unit-caps.md](game-size-unit-caps.md) | Small / Medium / Large per-side caps | **Current.** Matches `getMaxUnitsPerType`. | Context |
| [region-vs-region.md](region-vs-region.md) | Shipped scenario, home regions, win evaluation | **Current.** Matches `evaluateRegionControlWinnerAtEndOfTurn`. | Context |
| [hybrid-ai.md](hybrid-ai.md) | Hybrid opponent loop, callbacks, consult bounds | **Current engine behavior.** Prompt copy lives in the prompt package. | Posts 10, 12 |
| [ai-tools.md](ai-tools.md) | The six tool groups the model (and host) can invoke | **Current.** Names from `PATHFINDING_TOOL_NAMES` and sibling `*_TOOL_NAMES` consts. | Post 9 |
| [terrain-pipeline.md](terrain-pipeline.md) | What the app loads from `data/generated/` | **Current runtime.** Regeneration runbook stays in `scripts/terrain_pipeline/README.md`. | Context |
| [game-vision-v2.md](game-vision-v2.md) | Product intent and why the game is shaped this way | **Intent, with an implementation-status note.** Where a roster, fog, or phase claim disagrees with the engine, the combat rules (and the code) win. | Context |
| [ui-style-guide.md](ui-style-guide.md) | Map-first UI character, chrome, and interaction | **Target aesthetic plus an implementation-status note.** Unbuilt surfaces (save/load UI, diplomacy, async multiplayer) are marked. | Context |
| [naming-conventions.md](naming-conventions.md) | How files, directories, and exported symbols are named | **Living index.** Points at the contract and the signed rename ledger. | Posts 5, 7 |
| [naming-conventions-contract-v1.md](naming-conventions-contract-v1.md) | Casing, role suffixes, frozen string values, and the reviewer checklist | **Current rules.** When this file and an identifier disagree, fix the identifier. | Posts 5, 7 |
| [coding-prompts-1.md](coding-prompts-1.md) | Invoked prompt library (daily drivers, then experiments) | **Companion copy** of the library Post 4 quotes. | Post 4 |
| [project-instructions.md](project-instructions.md) | Advisor-project configuration before application code existed | **Companion copy** with a provenance header. The resume seeded alongside it isn't published. | Post 2 |
| [ai-commander-prompts/](ai-commander-prompts/README.md) | What the AI opponent's model is told today | **Current emission.** Builders under `src/main/openRouter/` win if this package drifts. Prompt copy is not game-rule authority; the engine is. | Post 13 |
| [devleopment-plan-v3.3.md](devleopment-plan-v3.3.md) | Original phased roadmap (filename keeps the historical spelling) | **Historical plan** with a current-progress header. Milestone writeups inside it are not live rules. | Post 4 |
| [poc-analysis.md](poc-analysis.md) | Phase 0 latency/cost research that justified the hybrid AI | **Historical research.** The hybrid pattern it recommended is now the live architecture. | Post 5 |
| [market-research.md](market-research.md) | 2025–2026 market landscape | **Dated research.** Not a mechanics or shipping-status document. No series claim rests on it. | Context |
| [../cursor-rules/](../cursor-rules/README.md) | Fourteen always-on standing rules | **Citation copy** at the companion root. Not a live Cursor rules folder. | Posts 4, 6 |

## Engine Constants These Docs Must Track

When you change one of these, update `combat-rules-v3.md` (and any table that quotes it) in the same change. The paths below name symbols in the private game tree; they are not present in this companion.

| Topic | Symbol |
| --- | --- |
| Attack / defense / strategic move / strategic range | `src/main/combatConstants.ts`, `src/shared/rangePerimeterModel.ts` |
| Unit costs and build prerequisites | `src/shared/productionConfig.ts`, `src/main/productionRules.ts` |
| Per-side caps by game size | `src/shared/productionConfig.ts` (`MAX_UNITS_PER_TYPE`), `src/shared/gameSize.ts` |
| Fog vision radii | `VISION_RANGE_BY_UNIT_TYPE` in `src/main/visibility.ts` |
| Tactical ranged and movement budgets | `src/shared/tacticalRanges.ts` |
| Tactical terrain enter costs | `tacticalEnterHexMovementCost` in `src/shared/tacticalTerrainMovement.ts` |
| Tactical combat modifiers (LOS, range caps, MP) | `src/shared/tacticalTerrainCombatModifiers.ts` |
| Sub-unit multiplication | `tacticalSubUnitCountForStrategicUnitType` in `src/main/tacticalBattle/computeTacticalBattleSnapshot.ts` |
| Resolution phase order | `executeReadyStrategicTurn`, `buildResolutionOrderRule` |

Prompt-generating code is catalogued in [ai-commander-prompts/](ai-commander-prompts/README.md). That package describes today's emitted prompts and answers to the same engine symbols; it does not invent stats. How the consult is scheduled and which tools exist: [hybrid-ai.md](hybrid-ai.md) and [ai-tools.md](ai-tools.md).
