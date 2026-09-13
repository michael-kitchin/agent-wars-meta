# Companion Inventory

This tree carries the evidence and method the series points at, not the game. A clone
can audit prompt discipline, the documents a post names, and measured figures. It
cannot rebuild the application or re-run every harness module.

Artifacts under `.social/` and `.spec/` are unmodified copies. `docs/` is the private
folder in full; [docs/COMPANION.md](docs/COMPANION.md) and a few headers and outbound
links were written or adjusted for this companion. `LICENSE`, `.gitignore`,
`.gitattributes`, this file, and the root `README.md` were written for this
repository.

## Included

| Path | Purpose |
|---|---|
| `.social/harness/` (entire) | Measurement method. The root README states which modules need the private tree. |
| `.social/evidence/metrics.json` | Every quoted figure with source, stability, and timestamp. |
| `.social/evidence/metricsSnapshot.md` | Same figures grouped by consuming post. |
| `.social/evidence/gitHistoryFindings.md` | Git-history findings the later posts cite. |
| `.social/evidence/planFigureReconciliation.md` | Which series-plan figures survived measurement. |
| `.social/evidence/README.md` | How the frozen captures were taken. |
| `.social/evidence/strategicSystemPromptCapture.txt` | Frozen strategic prompt dump. |
| `.social/evidence/tacticalSystemPromptCapture.txt` | Frozen tactical prompt dump. |
| `.social/evidence/userPromptCapture.txt` | Frozen user-prompt dump. |
| `docs/` (entire) | Living game docs. Cited versus context: [docs/COMPANION.md](docs/COMPANION.md). |
| `.spec/completed/mcp-tools-spec.md` | Named in the documentation-corpus figures. |
| `.spec/completed/ascii-hex-map.md` | Named in the documentation-corpus figures. |
| `.spec/completed/maintainability-consolidation-execution-plan-v6.md` | Largest consolidation plan; Post 7. |
| `.spec/completed/naming-conventions-execution-plan-v1.md` | The naming campaign Post 6 describes. |

## Excluded, and Why

| Path | Reason |
|---|---|
| `src/` entire, scenario data, terrain data | The game. |
| Full `.spec/completed` corpus | Only the four files a post names by size or role are here. Outbound links from `docs/` to other specs were converted to plain text. |
| `scripts/terrain_pipeline/README.md` | Regeneration runbook; mentions credentials. `terrain-pipeline.md` still describes what the app loads. |
| Blog drafts | Editorial material; the checker is here, the drafts are not. |
| `.spec/git-history-summary.md` | A stale snapshot that fights the harness as the source of git figures. |
| `.social/TogglTrack_Report_Summary_report_(from_01_01_2026_to_07_12_2026).csv` | Personal time data. Hours already live in `metrics.json`. |

## Companion Edits in `docs/`

Unmodified copies except:

- [docs/README.md](docs/README.md): companion header, citation column, `src/` traceability note.
- [docs/COMPANION.md](docs/COMPANION.md): cited-versus-context split (new).
- [docs/market-research.md](docs/market-research.md): provenance header.
- [docs/ai-commander-prompts/README.md](docs/ai-commander-prompts/README.md): `src/` note; related docs that exist here are links; `.spec` paths are plain text.
- [docs/hybrid-ai.md](docs/hybrid-ai.md), [docs/ai-tools.md](docs/ai-tools.md), [docs/combat-rules-v3.md](docs/combat-rules-v3.md): one-line `src/` traceability notes.
- [docs/naming-conventions.md](docs/naming-conventions.md), [docs/terrain-pipeline.md](docs/terrain-pipeline.md), [docs/devleopment-plan-v3.3.md](docs/devleopment-plan-v3.3.md): outbound links to unpublished targets converted to plain text.

## What a Clone Can Reproduce

A clone can reproduce prompt figures from the frozen captures, and can read the
already-written snapshot. It cannot re-run codebase, tool-surface, circular-deps, or
module-history measurements without private `src/` and `dist/main`. Git-history
analysis needs the private game history, which is not in this tree.
