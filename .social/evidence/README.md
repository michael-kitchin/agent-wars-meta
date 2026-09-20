# Evidence Set

Frozen artifacts the series drafts draw their prompt figures from, plus the measurement
outputs derived from the whole repository.

Everything here is committed on purpose. The application writes its prompt dumps to
files matching `debug-last-*.txt`, and `.gitignore` excludes that pattern with no
leading slash, so it matches at any depth — a copy kept under the original name would
be silently untracked and the figures would stop being reproducible. Hence the renames.

**Companion path note.** This folder is `.social/evidence/` in this repository. Source
strings inside `metrics.json` and `metricsSnapshot.md` may still say `evidence/` or
`harness/` because those figures were measured in the series tree. The files themselves
live here under the `.social/` prefix.

## Frozen Captures

| File | Source | Bytes |
|---|---|---|
| `strategicSystemPromptCapture.txt` | `debug-last-strategic-prompt.txt` | 44,047 |
| `tacticalSystemPromptCapture.txt` | `debug-last-tactical-prompt.txt` | 20,060 |
| `userPromptCapture.txt` | `debug-last-user-prompt.txt` | 310 |

Copied byte-for-byte. Not reflowed, re-encoded, or reformatted.

- **Captured from:** agent-wars 2.4.0 (`package.json` at time of capture)
- **Frozen on:** 2026-09-12
- **Game state:** turn 7, planning phase, region-vs-region scenario
- **Checked for:** API keys, `OPENROUTER_API_KEY`, bearer tokens, email addresses, and
  user-profile filesystem paths. None present — the dumps carry only game state.

### Re-Capturing

Needed whenever prompt assembly changes, because every prompt figure in the drafts
(character counts, line counts, section counts) is measured from these files rather than
from live code. Re-capture in the private game tree, then copy into this folder.

```powershell
$env:AGENT_WARS_LOG_FULL_PROMPTS = '1'
npm start
```

Take one strategic turn so the AI is consulted, then enter a tactical battle and let one
beat resolve. That writes all three `debug-last-*.txt` files to the game repository root.
Copy them over the three files above under their frozen names, refresh the series
measurement tree, then copy the updated snapshot files into this companion. Do not run
`.social/harness/runAllMeasurements.cjs` here.

Note that the strategic dump is not byte-identical to what the model receives: when the
assembled system prompt lacks an operational map section, the logging path appends a
supplement to the file only. Treat the capture as an accurate record of prompt structure
and near-exact record of size.

## Snapshot Files

Written by the measurement harness in the series tree, then copied here. Do not hand-edit;
do not re-run `.social/harness/runAllMeasurements.cjs` against this companion (it would
overwrite measured figures with failed sections).

| File | Contents |
|---|---|
| `metrics.json` | Every measured figure with its source, stability, and timestamp |
| `metricsSnapshot.md` | The same figures organised by consuming post, for draft writers |
| `session-data.json` | Frozen session-dump aggregates (token economics, tool mix, overlap). No prompt text. |

## Hand-Written Files

`README.md`, `planFigureReconciliation.md`, `gitHistoryFindings.md`, and `correctionsLog.md`
are authored, not generated. The harness never deletes files or cleans this directory, so
they survive a run untouched. `correctionsLog.md` is the maintained list of claims
measurement corrected; Post 18 draws from it.
