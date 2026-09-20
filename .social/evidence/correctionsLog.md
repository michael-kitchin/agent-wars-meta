# Corrections Log

<!--
Companion copy. Paths below that say evidence/ mean this folder (.social/evidence/).
Do not treat completed/ as present in this repository.
-->

Maintained as the series runs. Post 18 draws its "what I got wrong" section from this
document rather than from a writer's note. Every entry below was checked against the
repository or against `planFigureReconciliation.md` /
`metrics.json` in this folder before it was recorded. Entries that could not be confirmed
are marked **unverifiable** with what was checked.

Do not hand-edit measured figures here without refreshing the series measurement tree and
updating `planFigureReconciliation.md`. Do not re-run the companion harness against this
tree to "fix" numbers.

---

## Documentation corpus count stale by 39 documents

| Field | Detail |
|---|---|
| **Claimed** | 99 completed design documents (series plan) |
| **Measured** | 138 at reconciliation time (grew by 39); corpus remains volatile (`metricsSnapshot.md` later shows 141) |
| **Carried by** | `completed/blog-series-plan-7.md` (Numbers That Are Real); corrected in drafts that quote the live count |
| **How found** | `measureSpecCorpus.cjs` / `planFigureReconciliation.md` §3 |
| **Status** | Verified |

## Character count that was a byte count

| Field | Detail |
|---|---|
| **Claimed** | Strategic prompt 44,047 characters; tactical 20,060 characters |
| **Measured** | Those figures are UTF-8 byte lengths. Characters are 43,839 and 20,014. Gap is non-ASCII punctuation. |
| **Carried by** | Series plan prompt artifacts; evidence README notes the capture sizes |
| **How found** | Frozen captures in this folder vs character counts in `planFigureReconciliation.md` §4 |
| **Status** | Verified |

## Two line counts off by one

| Field | Detail |
|---|---|
| **Claimed** | Strategic prompt 419 lines; tactical 171 lines |
| **Measured** | 419 / 171 newlines; 420 / 172 physical lines (last line lacks a trailing newline) |
| **Carried by** | Series plan prompt artifacts |
| **How found** | `planFigureReconciliation.md` §4 |
| **Status** | Verified |

## File-size constraints claimed held; seven files breach the hard ceiling

| Field | Detail |
|---|---|
| **Claimed** | Project file-size rules were respected (inferred from ~249-line average) |
| **Measured** | 32 product files over the 600-line desirable limit; **7** over the 1000-line hard ceiling; largest 3,272 lines |
| **Carried by** | Series plan codebase discussion; Post 5 / Post 8 material |
| **How found** | `planFigureReconciliation.md` §2 "Contradicted: the constraints held"; `metricsSnapshot.md` hard-ceiling rows |
| **Status** | Verified |

## Specified H3 leak guard never implemented as specified

| Field | Detail |
|---|---|
| **Claimed** | H3 indices enforced by an automated leak check scanning assembled prompts and tool payloads for forbidden keys, validating candidates through `h3-js` |
| **Measured** | Narrower guard: regex over the system prompt for bracketed lat/lng; runtime redaction of tool results; callback sanitizer. No `h3-js` in prompt auditing |
| **Carried by** | Series plan / milestone 1.1 design intent; Post 3 must describe what exists |
| **How found** | `planFigureReconciliation.md` §8 |
| **Status** | Verified |

## Tool behavior: hex assessments target

| Field | Detail |
|---|---|
| **Claimed** | Hex assessments target observed enemy positions (fog-of-war-aware framing) |
| **Measured** | Routine assesses hexes containing human-player units |
| **Carried by** | Series plan tool / assessment framing |
| **How found** | `planFigureReconciliation.md` §8 against compiled modules |
| **Status** | Verified |

## Tool behavior: combat-estimation withhold condition

| Field | Detail |
|---|---|
| **Claimed** | Combat estimation withheld because a briefing is attached |
| **Measured** | Withheld when the pre-computation path is active |
| **Carried by** | Series plan tool framing; Post 9 mechanism material |
| **How found** | `planFigureReconciliation.md` §8 against compiled modules |
| **Status** | Verified |

## Best Options ranking in the series plan is not the ranking the code uses

| Field | Detail |
|---|---|
| **Claimed** | Action-efficiency ranking as "highest-value target within range; ties by force advantage" (series plan Appendix B) |
| **Measured** | Table ranked by `compareTableRowsForUnitPriority`: enemy count, tempo, urban count (with approach exception), distance, action type, lat/lng, hex id; capped at five rows per unit |
| **Carried by** | `completed/blog-series-plan-7.md` Appendix B; corrected in `drafts/post-14-how-i-scored-it.md` outline |
| **How found** | Post 14 stub records the contradiction; ranking function named in outline. Spot-check: search `compareTableRowsForUnitPriority` in `src/` when refreshing this entry |
| **Status** | Verified (against Post 14's recorded correction and plan wording; re-confirm function body if the ranking module moves) |

## Non-LLM opponent described as deciding from Best Options; application fallback does not

| Field | Detail |
|---|---|
| **Claimed** | Heuristic / non-LLM opponent drives off the same Best Options table |
| **Measured** | Evaluation opponent that reads Best Options is specified and unbuilt. Existing path (`buildUnconsultedOpponentOrders`) executes standing orders and free tempo attacks (near-passivity, not Best Options) |
| **Carried by** | Series plan Appendix B / Post 14 framing; corrected in Post 14 outline |
| **How found** | `drafts/post-14-how-i-scored-it.md` outline points 6–7 and blockers; plan vs stub |
| **Status** | Verified (against Post 14 and plan; re-confirm `buildUnconsultedOpponentOrders` if the fallback moves) |

## Circular-dependency baseline of 53 cycles were type-only imports

| Field | Detail |
|---|---|
| **Claimed** | 53-cycle circular-dependency baseline |
| **Measured** | Checker counted `import type` as runtime edges. After ignoring type-only imports: **0** cycles; baseline emptied; gate passes |
| **Carried by** | Earlier series plan / Post 8 sprawl material |
| **How found** | `planFigureReconciliation.md` §6; `metricsSnapshot.md` baselined cycle count 0 |
| **Status** | Verified |

## Frozen hours window ended mid-stage

| Field | Detail |
|---|---|
| **Claimed** | About 160 logged hours (grand total 155.87, rounded up), four work-weeks (3.9 at forty hours), window through 2026-07-12, ~5 h Fixes (M2.4) |
| **Measured** | Window extended once to 2026-09-14. Build total 172.3 (excludes Promotion 6.51); licensed prose 170, rounded down. Grand total 178.82. Work-weeks 4.3 measured; prose stays "about four." Fixes (M2.4) 27.94 hours, largest line item, labeled by milestone association not work type |
| **Carried by** | Earlier drafts, series plan, and this reconciliation; corrected in live copy |
| **How found** | Re-export covering 2026-01-01 to 2026-09-14; `measureEffort.cjs` |
| **Status** | Verified. The old figure was not arithmetically wrong. It correctly measured a window that ended mid-stage, which made the Fixes stretch look like five hours of tidying when it was the single most expensive line item. This is the final window extension. Later work is reported as outside the window. |

---

## Related note (not a separate list item)

Unit assessments run against opponent units, not "every AI unit" (`planFigureReconciliation.md` §8). Fold into tool-behavior corrections in Post 18 prose if needed; not duplicated as a tenth named entry above because Post 18's writer notes enumerated nine items and this sits beside the two named tool claims.
