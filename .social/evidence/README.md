# Evidence Set

Frozen artifacts the blog drafts draw their prompt figures from, plus the measurement
outputs derived from the whole repository.

Everything here is committed on purpose. The application writes its prompt dumps to
files matching `debug-last-*.txt`, and `.gitignore` excludes that pattern with no
leading slash, so it matches at any depth — a copy kept under the original name would
be silently untracked and the figures would stop being reproducible. Hence the renames.

## Frozen captures

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

### Re-capturing

Needed whenever prompt assembly changes, because every prompt figure in the drafts
(character counts, line counts, section counts) is measured from these files rather than
from live code.

```powershell
$env:AGENT_WARS_LOG_FULL_PROMPTS = '1'
npm start
```

Take one strategic turn so the AI is consulted, then enter a tactical battle and let one
beat resolve. That writes all three `debug-last-*.txt` files to the repository root.
Copy them over the three files above under their frozen names, then re-run the harness
and regenerate `planFigureReconciliation.md`.

Note that the strategic dump is not byte-identical to what the model receives: when the
assembled system prompt lacks an operational map section, the logging path appends a
supplement to the file only. Treat the capture as an accurate record of prompt structure
and near-exact record of size.

## Generated files

Written by `.social/harness/runAllMeasurements.cjs`. Do not hand-edit; they are
overwritten on every run.

| File | Contents |
|---|---|
| `metrics.json` | Every measured figure with its source, stability, and timestamp |
| `metricsSnapshot.md` | The same figures organised by consuming post, for draft writers |

## Hand-written files

`README.md` and `planFigureReconciliation.md` are authored, not generated. The harness
never deletes files or cleans this directory, so they survive a run untouched.
