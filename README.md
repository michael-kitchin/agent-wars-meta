# Hybrid AI Field Notes: Evidence Companion

This repository is the audit trail behind *Hybrid AI Field Notes*: the measurement
harness, the figures it produced, the frozen prompt captures, the `docs/` tree a
post cites or that shows the process, and the few specifications a post names by
size or role.

The game source stays private. A clone of this companion cannot rebuild the application,
cannot replay a turn, and cannot re-run every measurement. What it can do is let a
reader audit the method and the numbers the posts quote.

Files under `.social/` and `.spec/` are unmodified copies from the private tree.
`docs/` is that folder in full: most files are unmodified copies; a few carry a
companion header, a citation column, or outbound links converted to plain text
where the target is not published here. Nested harness READMEs still describe the
private tree (`npm start`, `src/`, `dist/main`). Those paths are not here. This
root README is the guide for what a clone of *this* repository can actually do.

Do not run `node .social/harness/runAllMeasurements.cjs` in this tree. That script
overwrites `.social/evidence/metrics.json` and `metricsSnapshot.md`. Against this
companion it would replace measured figures with failed sections.

## What Git Cannot Prove

The series claims that no application code was hand-written. The git history of the
private game repository still would not prove that claim. Git records the committer,
not who typed the characters. Every commit in that repository is under one of two name
strings, and a `Made-with:` trailer appears on a measured minority of commits. The case
is circumstantial: the specification corpus, the retrofit commits, and the consolidation
patterns. A draft that cites a repository as proof of the zero-hand-written-lines claim
is overstating what git can show.

This companion does not include that git history. The figures live in
`.social/evidence/metrics.json` and `.social/evidence/gitHistoryFindings.md`.

## What a Clone Can Re-Run

From this tree, with Node available:

```powershell
node .social/harness/measurePrompts.cjs
```

That reads the frozen captures under `.social/evidence/`. The snapshot files
`metrics.json` and `metricsSnapshot.md` are already here and should be treated as
evidence, not regenerated.

`measureGitHistory.cjs` can parse a git log, but the files here are not the game
repository's history. `checkDrafts.cjs` is included so the checker itself is auditable;
the drafts it would check are not in this tree.

These modules need the private tree (`src/`, `dist/main`, and scripts that stay
private) and will fail or lie if run against this companion alone:

- `measureCodebase.cjs`
- `measureToolSurface.cjs`
- `measureCircularDeps.cjs`
- `measureModuleHistory.cjs`

`measureEffort.cjs` reads a personal time-log CSV that is excluded on purpose; hours
already live in `metrics.json`. `measureSpecCorpus.cjs` walks `.spec/completed` and would
see only the four files copied here, not the full corpus.

Harness tests:

```powershell
node .social/harness/tests/runHarnessTests.cjs
```

Three tests in `fileScan.test.cjs` expect the private `src/` tree and the three root
build-config files. They fail here on purpose. The other tests do not need that tree.

## Cited Versus Context

Every file that lived in the private `docs/` folder is here. They are not equal
evidence. **Cited** documents are ones a post points at; they carry the argument.
**Context** documents show how the project specified itself; no post depends on
them. [market-research.md](docs/market-research.md) is context, and the only file
whose figures are third-party as-reported. The series does not rest on it.

The split, with a table for each side, is [docs/COMPANION.md](docs/COMPANION.md).
The same column appears in [docs/README.md](docs/README.md).

| Cited | Context |
| --- | --- |
| [docs/README.md](docs/README.md) (Post 4) | [game-vision-v2.md](docs/game-vision-v2.md) |
| [devleopment-plan-v3.3.md](docs/devleopment-plan-v3.3.md) (Post 4) | [combat-rules-v3.md](docs/combat-rules-v3.md) |
| [naming-conventions.md](docs/naming-conventions.md) (Posts 5, 7) | [game-size-unit-caps.md](docs/game-size-unit-caps.md) |
| [naming-conventions-contract-v1.md](docs/naming-conventions-contract-v1.md) (Posts 5, 7) | [region-vs-region.md](docs/region-vs-region.md) |
| [ai-tools.md](docs/ai-tools.md) (Post 8) | [terrain-pipeline.md](docs/terrain-pipeline.md) |
| [hybrid-ai.md](docs/hybrid-ai.md) (Posts 9, 11) | [ui-style-guide.md](docs/ui-style-guide.md) |
| [poc-analysis.md](docs/poc-analysis.md) (Post 9) | [market-research.md](docs/market-research.md) |
| [ai-commander-prompts/](docs/ai-commander-prompts/README.md) (Post 12) | [COMPANION.md](docs/COMPANION.md) (orientation) |

## Layout

| Path | Why it is here |
|---|---|
| `.social/harness/` | The measurement method. |
| `.social/evidence/` | Figures, findings, frozen prompt dumps. |
| `docs/` | Living game docs. Cited versus context: [docs/COMPANION.md](docs/COMPANION.md). |
| `.spec/completed/` (four files) | Specs a post names by size or role. |

See `MANIFEST.md` for the include list and the exclusions.

## License

MIT. See `LICENSE`.
