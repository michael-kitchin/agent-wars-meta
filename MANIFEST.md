# Companion Inventory

This tree carries the evidence and method the Agent Wars series on *Standing Orders*
points at, not the game. A clone can audit prompt discipline, the documents a post
names, and measured figures. It can't rebuild the application or re-run every harness
module.

The harness under `.social/harness/` and the four files under `.spec/completed/` are
copies from the private tree, with the companion edits listed below. Evidence snapshots
under `.social/evidence/` were refreshed from the series measurement tree so hours and
session figures match the posts. `doc/` is the private folder in full;
[doc/COMPANION.md](doc/COMPANION.md) and a few headers and outbound links were written
or adjusted for this companion. `cursor-rules/` is a citation copy of the private
`.cursor/rules/` set. `LICENSE`, `.gitignore`, `.gitattributes`, this file, and the root
`README.md` were written for this repository.

## Included

| Path | Purpose |
|---|---|
| `.social/harness/` (entire) | Measurement method. The root README states which modules need the private tree. |
| `.social/evidence/metrics.json` | Every quoted figure with source, stability, and timestamp. |
| `.social/evidence/metricsSnapshot.md` | Same figures grouped by consuming post. |
| `.social/evidence/session-data.json` | Frozen session-dump aggregates (no prompt text). |
| `.social/evidence/gitHistoryFindings.md` | Git-history findings the later posts cite. |
| `.social/evidence/planFigureReconciliation.md` | Which series-plan figures survived measurement. |
| `.social/evidence/correctionsLog.md` | Claims measurement corrected; Post 18. |
| `.social/evidence/README.md` | How the frozen captures were taken. |
| `.social/evidence/strategicSystemPromptCapture.txt` | Frozen strategic prompt dump. |
| `.social/evidence/tacticalSystemPromptCapture.txt` | Frozen tactical prompt dump. |
| `.social/evidence/userPromptCapture.txt` | Frozen user-prompt dump. |
| `doc/` (entire) | Living game docs. Cited versus context: [doc/COMPANION.md](doc/COMPANION.md). |
| `doc/coding-prompts-1.md` | Invoked prompt library; Post 4. Daily drivers first; experiments after. |
| `doc/project-instructions.md` | Advisor-project configuration; Post 2. Provenance header on this copy. |
| `cursor-rules/` | Fourteen always-on `.mdc` files; Posts 4 and 6. Bodies match live `.cursor/rules/`. |
| `.spec/completed/mcp-tools-spec.md` | Named in the documentation-corpus figures. |
| `.spec/completed/ascii-hex-map.md` | Named in the documentation-corpus figures. |
| `.spec/completed/maintainability-consolidation-execution-plan-v6.md` | Largest consolidation plan; Post 8. |
| `.spec/completed/naming-conventions-execution-plan-v1.md` | The naming campaign Post 7 describes. |

## Excluded, and Why

| Path | Reason |
|---|---|
| `src/` entire, scenario data, terrain data | The game. |
| Full `.spec/completed` corpus | Only the four files a post names by size or role are here. Outbound links from `doc/` to other specs were converted to plain text. |
| `scripts/terrain_pipeline/README.md` | Regeneration runbook; mentions credentials. `terrain-pipeline.md` still describes what the app loads. |
| Series drafts | Editorial material; the checker is here, the drafts aren't. |
| `.spec/git-history-summary.md` | A stale snapshot that fights the harness as the source of git figures. |
| `TogglTrack_Report*.csv` | Personal time data (member name and email in the export). Hours already live in `metrics.json`. |
| `analysis/cursor-sessions/` and raw session dumps | Prompt text. Never publish. |
| `usage-events*.csv` | Cursor usage export; personal account data. Aggregates live in `session-data.json`. |
| `michael-kitchin-resume-1.md` | Personal background seeded into the advisor project. Posts describe its function; the file isn't published. |
| `pNN-*.json` writer sidecars | Per-post chart inputs; not required to audit the snapshot. |

## Companion Edits

Unmodified copies except:

- [doc/README.md](doc/README.md): companion header, citation column, `src/` traceability note.
- [doc/COMPANION.md](doc/COMPANION.md): cited-versus-context split (new).
- [doc/market-research.md](doc/market-research.md): provenance header.
- [doc/coding-prompts-1.md](doc/coding-prompts-1.md): companion provenance header; daily drivers first.
- [doc/project-instructions.md](doc/project-instructions.md): companion provenance header; resume file excluded.
- [doc/ai-commander-prompts/README.md](doc/ai-commander-prompts/README.md): `src/` note; related docs that exist here are links; `.spec` paths are plain text.
- [doc/hybrid-ai.md](doc/hybrid-ai.md), [doc/ai-tools.md](doc/ai-tools.md), [doc/combat-rules-v3.md](doc/combat-rules-v3.md): one-line `src/` traceability notes.
- [doc/ux-specification.md](doc/ux-specification.md): one-line `src/` and `static/` traceability note covering the Code Entry Points in `doc/ux/`.
- [doc/naming-conventions.md](doc/naming-conventions.md), [doc/terrain-pipeline.md](doc/terrain-pipeline.md), [doc/devleopment-plan-v3.3.md](doc/devleopment-plan-v3.3.md): outbound links to unpublished targets converted to plain text.
- [`.social/evidence/README.md`](.social/evidence/README.md): companion paths; notes that frozen source strings may say `evidence/` / `harness/` for the series tree.
- [`.social/evidence/correctionsLog.md`](.social/evidence/correctionsLog.md), [`.social/evidence/gitHistoryFindings.md`](.social/evidence/gitHistoryFindings.md), [`.social/evidence/planFigureReconciliation.md`](.social/evidence/planFigureReconciliation.md): companion path notes; git-history author/trailer counts aligned to `metrics.json`.
- [`.social/harness/lib/snapshotLayout.cjs`](.social/harness/lib/snapshotLayout.cjs): Post 1 heading updated from the retired 156-hour title to 170.
- [`.social/harness/lib/lineCounting.cjs`](.social/harness/lib/lineCounting.cjs), [`.social/harness/measureGitHistory.cjs`](.social/harness/measureGitHistory.cjs): "blog series" in orienting comments retitled to Agent Wars series.
- [`.social/harness/README.md`](.social/harness/README.md): companion warning not to re-run full measurements here; "blog series" retitled.

## Author Decisions Already Taken

- **Full `doc/` publish.** Context files (market research, development plan, vision, combat rules, and the rest) stay. Cited-versus-context is documented in [doc/COMPANION.md](doc/COMPANION.md).
- **`doc/poc-analysis.md`.** Included with the full `doc/` publish decision.
- **UX specification suite.** [doc/ux-specification.md](doc/ux-specification.md) and [doc/ux/](doc/ux/) are context. Code entry points name private `src/` and `static/` paths.
- **Companion license.** MIT. See `LICENSE`.

## Prerequisites Before Making the Repository Public

Do not tick these from a staging pass. Each is an author sign-off.

- [ ] Rewrite the existing commit author email away from a work address while the GitHub
  repository is still private, then force-push that one commit. Confirm the current value
  with `git log -1 --format="%an %ae"` (do not paste that address into published files).
  Example (GitHub noreply or a personal address you accept on a public commit):

  ```powershell
  git log -1 --format="%an %ae"
  git commit --amend --author="Michael J. Kitchin <YOUR_GITHUB_ID+YOUR_GITHUB_ID@users.noreply.github.com>" --no-edit
  git log -1 --format="%an %ae"
  # Only while the GitHub repo is still private:
  git push --force-with-lease origin main
  ```

  Prefer an explicit `--author=` over `--reset-author`, so a local `user.email` can't
  silently reintroduce a work address. Leave your global git config alone.

- [ ] Re-scan the working tree and full commit history for API keys, emails, and user-profile
  paths after the rewrite (and after committing the shareability updates in this working tree).

- [ ] Confirm Natural Earth (public domain) and EarthEnv licensing for the terrain pipeline
  the private tree consumes. Those datasets aren't in this companion; the checkbox is still
  required before claiming the companion is publication-ready.

## What a Clone Can Reproduce

A clone can reproduce prompt figures from the frozen captures, and can read the
already-written snapshot and session aggregates. It can't re-run codebase, tool-surface,
circular-deps, or module-history measurements without private `src/` and `dist/main`.
Git-history analysis needs the private game history, which isn't in this tree.
