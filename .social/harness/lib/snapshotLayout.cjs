'use strict';

const { logTrace } = require('./harnessLogger.cjs');

/**
 * Declares which measured figures each post is allowed to quote.
 *
 * The snapshot is organised by consuming post rather than by measurement module because a
 * writer working on one post needs the figures available to them and nothing else. Seeing a
 * figure that belongs to a different post is how numbers leak forward into posts that have
 * not earned them yet, which the series plan warns about repeatedly.
 *
 * Each row names a dotted path into the merged metrics object. A path that does not resolve
 * is rendered as unavailable rather than omitted, so a missing measurement is visible to the
 * writer instead of looking like a figure that was never needed.
 */

/**
 * Resolves a dotted path into the metrics object and returns the figure at that location.
 *
 * Returns null rather than throwing on a missing path, because a failed measurement section
 * legitimately leaves holes and the snapshot's job is to show them.
 */
function resolveFigure(metrics, dottedPath) {
  logTrace('resolveFigure', dottedPath);
  let current = metrics;
  for (const segment of dottedPath.split('.')) {
    if (current === null || current === undefined || typeof current !== 'object') return null;
    current = current[segment];
  }
  if (current === null || current === undefined) return null;
  return Object.prototype.hasOwnProperty.call(current, 'value') ? current : null;
}

/**
 * The post-by-post layout.
 *
 * Post numbers and titles follow the canonical series plan. Posts with no measurable figures
 * of their own are still listed with an explanatory note, so a writer can confirm at a glance
 * that a post is genuinely placeholder-driven rather than wonder whether the harness forgot it.
 */
const SNAPSHOT_LAYOUT = Object.freeze([
  {
    heading: 'Post 0 — Start Here',
    intro: 'Scope anchor only. Quote each figure once and keep the hub short.',
    rows: [
      { label: 'Logged hours (prose form)', path: 'effort.totals.approximateHoursForProse' },
      { label: 'Coverage window start', path: 'effort.coverageWindow.from' },
      { label: 'Coverage window end', path: 'effort.coverageWindow.to' },
      { label: 'Source files in src/', path: 'codebase.all.files' },
      { label: 'Physical lines in src/', path: 'codebase.all.physicalLines' },
      { label: 'Completed design documents', path: 'specCorpus.completed.documentCount' },
      { label: 'Design corpus size (MB)', path: 'specCorpus.completed.totalMegabytes' },
      { label: 'Top-level plan version arc', path: 'specCorpus.topLevelPlanVersions' },
    ],
  },
  {
    heading: 'Post 1 — 156 Hours, Zero Hand-Written Lines',
    intro:
      'The provenance claim, the scale, and the hours distribution. State the coverage window wherever the total appears. No intervention figures here; those belong to Post 6.',
    rows: [
      { label: 'Logged hours (prose form)', path: 'effort.totals.approximateHoursForProse' },
      { label: 'Logged hours (exact)', path: 'effort.totals.grandTotalHours' },
      { label: 'Work-weeks at 40h', path: 'effort.totals.workWeeksAtForty' },
      { label: 'Development and test hours', path: 'effort.totals.developmentHours' },
      { label: 'Development buckets', path: 'effort.totals.developmentBucketCount' },
      { label: 'Non-development categories', path: 'effort.otherCategories' },
      { label: 'Milestone hours ranked', path: 'effort.ranking' },
      { label: 'Source files in src/', path: 'codebase.all.files' },
      { label: 'Physical lines in src/', path: 'codebase.all.physicalLines' },
      { label: 'src lines per logged hour', path: 'codebase.perLoggedHour.srcLines' },
      { label: 'Bounded src product lines per hour', path: 'gitHistory.boundedRate.linesPerHour' },
      { label: 'Bounded-rate cutoff commit', path: 'gitHistory.boundedRate.cutoffCommit' },
      { label: 'Bounded-rate cutoff date', path: 'gitHistory.boundedRate.cutoffDate' },
      { label: 'Project-owned files', path: 'codebase.projectOwned.files' },
      { label: 'Project-owned lines', path: 'codebase.projectOwned.physicalLines' },
    ],
  },
  {
    heading: 'Post 2 — Why I Picked a Stack I Already Knew',
    intro:
      'The control-variables argument. The domain grouping is a proxy for where effort pooled, not a defect count, and its method must be stated in the post.',
    rows: [
      { label: 'Hours by problem domain', path: 'effort.byDomain' },
      { label: 'Domain assignment method', path: 'effort.domainMethod' },
      { label: 'Time-log limitations', path: 'effort.limitations' },
      { label: 'Logged hours (prose form)', path: 'effort.totals.approximateHoursForProse' },
      { label: 'Completed design documents', path: 'specCorpus.completed.documentCount' },
      { label: 'Python files (the second language)', path: 'codebase.python.files' },
      { label: 'Python physical lines', path: 'codebase.python.physicalLines' },
      {
        label: 'Python share of project-owned lines',
        path: 'codebase.python.shareOfProjectOwnedLinesPercent',
      },
    ],
  },
  {
    heading: 'Post 3 — Four Coordinate Formats',
    intro:
      'Prompt figures come from the frozen captures. Never state a specific token-reduction percentage; the estimated minimum of 20%, varying by game state, is the required form.',
    rows: [
      { label: 'Strategic prompt bytes', path: 'prompts.captures.strategic.bytes' },
      { label: 'Strategic prompt characters', path: 'prompts.captures.strategic.characters' },
      { label: 'Strategic prompt lines', path: 'prompts.captures.strategic.physicalLines' },
      { label: 'Strategic section count', path: 'prompts.captures.strategic.headingCount' },
      { label: 'Prompt measurement limitations', path: 'prompts.limitations' },
    ],
  },
  {
    heading: 'Post 4 — Design Documents as Operational Artifacts',
    intro:
      'Use the measured corpus figures, not any previously stated ones. Do not quote a docs-to-code ratio; the two corpora are not comparable units.',
    rows: [
      { label: 'Completed design documents', path: 'specCorpus.completed.documentCount' },
      { label: 'Design corpus size (MB)', path: 'specCorpus.completed.totalMegabytes' },
      { label: 'Mean document size (KB)', path: 'specCorpus.completed.meanKilobytes' },
      { label: 'Largest documents', path: 'specCorpus.completed.largest' },
      { label: 'Top-level plan version arc', path: 'specCorpus.topLevelPlanVersions' },
      { label: 'Superseded plans retained', path: 'specCorpus.deprecated.files' },
      { label: 'Corpus limitations', path: 'specCorpus.limitations' },
    ],
  },
  {
    heading: 'Post 5 — Rules for a Weak Agent',
    intro:
      'The substantive-line gap is the measurable rule. It comes from a heuristic, not a parser, so present it as a proxy and state the counting definition in the post.',
    rows: [
      { label: 'Product substantive share (%)', path: 'codebase.product.substantiveSharePercent' },
      { label: 'Test substantive share (%)', path: 'codebase.tests.substantiveSharePercent' },
      { label: 'Gap in percentage points', path: 'codebase.ratios.substantiveGapPoints' },
      { label: 'Mean product file lines', path: 'codebase.product.meanLinesPerFile' },
      { label: 'Product files', path: 'codebase.product.files' },
      { label: 'Test-to-product by line', path: 'codebase.ratios.testToProductByLine' },
      { label: 'Test-to-product by file', path: 'codebase.ratios.testToProductByFile' },
      { label: 'Stated desirable line limit', path: 'codebase.limitCompliance.desirableLimit' },
      { label: 'Stated hard line ceiling', path: 'codebase.limitCompliance.hardLimit' },
      {
        label: 'Product files over the desirable limit',
        path: 'codebase.limitCompliance.productFilesOverDesirable',
      },
      {
        label: 'Product files over the hard ceiling',
        path: 'codebase.limitCompliance.productFilesOverHard',
      },
    ],
  },
  {
    heading: 'Post 6 — Where the Tools Broke Down',
    intro:
      'The boundaries taxonomy is the post; the intervention rate is support. That rate is a manual tally and is not measured here, so it stays a placeholder.',
    rows: [
      { label: 'Milestone hours ranked', path: 'effort.ranking' },
      { label: 'Hours by problem domain', path: 'effort.byDomain' },
      { label: 'Time-log limitations', path: 'effort.limitations' },
      { label: 'CI commit clusters', path: 'gitHistory.clusters.ci' },
    ],
  },
  {
    heading: 'Post 7 — The Sprawl Problem',
    intro:
      'Module peaks come from a full commit-history scan, not from milestone tags, which understate them substantially. Each peak carries its commit so the figure can be checked by hand.',
    rows: [
      { label: 'Historical module peaks', path: 'moduleHistory.modules' },
      { label: 'Scan method', path: 'moduleHistory.method' },
      { label: 'Baselined cycle count', path: 'circularDeps.baselineCycleCount' },
      { label: 'Checker currently passes', path: 'circularDeps.checkerPasses' },
      { label: 'Cycles counting type-only imports', path: 'circularDeps.typeOnlyInflatedCycleCount' },
      { label: 'Runtime source cycles', path: 'circularDeps.runtimeSourceCycleCount' },
      { label: 'Compiled main-process modules', path: 'circularDeps.compiledMainModules' },
      { label: 'Compiled require edges', path: 'circularDeps.compiledRequireEdges' },
      { label: 'Cycles in the compiled graph', path: 'circularDeps.compiledCycleCount' },
      { label: 'How the gate reads', path: 'circularDeps.notes' },
      { label: 'Mean product file lines', path: 'codebase.product.meanLinesPerFile' },
      { label: 'Product files', path: 'codebase.product.files' },
      {
        label: 'Product files still over the hard ceiling',
        path: 'codebase.limitCompliance.productFilesOverHard',
      },
      {
        label: 'Largest product file today (lines)',
        path: 'codebase.limitCompliance.largestProductFileLines',
      },
      {
        label: 'Largest product file today (path)',
        path: 'codebase.limitCompliance.largestProductFilePath',
      },
      { label: 'Consolidation campaigns', path: 'specCorpus.consolidationCampaigns' },
      { label: 'Named consolidation commits', path: 'gitHistory.namedCommits' },
      { label: 'Rename ratio (renames / adds)', path: 'gitHistory.renameRatio' },
      { label: 'Files renamed (per-commit sum)', path: 'gitHistory.filesRenamed' },
      { label: 'Files added (per-commit sum)', path: 'gitHistory.filesAdded' },
    ],
  },
  {
    heading: 'Post 8 — Nine Tools, and the Ones I Took Away',
    intro: 'Every count here is derived by calling the application code, not by reading a document.',
    rows: [
      { label: 'Tools built', path: 'toolSurface.tools.builtCount' },
      { label: 'Tool names', path: 'toolSurface.tools.builtNames' },
      { label: 'Tools withheld', path: 'toolSurface.tools.withheldCount' },
      { label: 'Withheld names', path: 'toolSurface.tools.withheldNames' },
      { label: 'Tools exposed', path: 'toolSurface.tools.exposedCount' },
      { label: 'Exposed names', path: 'toolSurface.tools.exposedNames' },
      { label: 'Definitions actually emitted', path: 'toolSurface.tools.emittedDefinitionCount' },
      { label: 'Tool surface limitations', path: 'toolSurface.limitations' },
    ],
  },
  {
    heading: 'Post 9 — Pre-Computation, Episodic Consultation, Persistent Orders',
    intro:
      'Avoid any three-layer framing. Cost figures require live runs and are not measured here.',
    rows: [
      { label: 'Tools withheld to pre-computation', path: 'toolSurface.tools.withheldNames' },
      { label: 'Callback events taught', path: 'toolSurface.callbacks.taughtEvents' },
      { label: 'Callback events parsed', path: 'toolSurface.callbacks.parsedEvents' },
    ],
  },
  {
    heading: 'Post 10 — Two Commanders, Two Maps',
    intro: 'The section lists and the dropped-section list are derived from the frozen captures.',
    rows: [
      { label: 'Strategic sections', path: 'prompts.captures.strategic.headingCount' },
      { label: 'Strategic section list', path: 'prompts.captures.strategic.headings' },
      { label: 'Tactical sections', path: 'prompts.captures.tactical.headingCount' },
      { label: 'Tactical section list', path: 'prompts.captures.tactical.headings' },
      { label: 'Sections tactical drops', path: 'prompts.comparison.sectionsDroppedInTactical' },
      { label: 'Tactical share of strategic size (%)', path: 'prompts.comparison.tacticalShareOfStrategicCharacters' },
      { label: 'Strategic prompt bytes', path: 'prompts.captures.strategic.bytes' },
      { label: 'Tactical prompt bytes', path: 'prompts.captures.tactical.bytes' },
    ],
  },
  {
    heading: 'Post 11 — Keeping an LLM Coherent',
    intro: 'Persistence and subscription-pattern figures require live runs and stay placeholders.',
    rows: [
      { label: 'Callback events taught', path: 'toolSurface.callbacks.taughtEvents' },
      { label: 'Callback events parsed', path: 'toolSurface.callbacks.parsedEvents' },
      { label: 'Parsed but not taught', path: 'toolSurface.callbacks.parsedButNotTaught' },
    ],
  },
  {
    heading: 'Post 12 — Governing a Prompt Like Code',
    intro:
      'The taught-versus-parsed gap is the documented governance decision with a paper trail.',
    rows: [
      { label: 'Parsed but not taught', path: 'toolSurface.callbacks.parsedButNotTaught' },
      { label: 'Callback events parsed', path: 'toolSurface.callbacks.parsedEvents' },
      { label: 'Callback events taught', path: 'toolSurface.callbacks.taughtEvents' },
      { label: 'Strategic section list', path: 'prompts.captures.strategic.headings' },
      { label: 'Prompt commit cluster', path: 'gitHistory.clusters.prompt' },
    ],
  },
  {
    heading: 'Posts 13 through 17 — Measurement-dependent',
    intro:
      'These posts turn on scored model runs, which this harness does not perform. Every quality, cost, latency, and subscription figure in them is a placeholder until the evaluation apparatus exists.',
    rows: [
      { label: 'Strategic prompt bytes (cost framing)', path: 'prompts.captures.strategic.bytes' },
      { label: 'Historical module peaks (synthesis)', path: 'moduleHistory.modules' },
      { label: 'Logged hours (synthesis)', path: 'effort.totals.approximateHoursForProse' },
      { label: 'HEAD commit count', path: 'gitHistory.commitsOnHead' },
      { label: 'Made-with trailer count', path: 'gitHistory.madeWithCount' },
    ],
  },
]);

module.exports = {
  SNAPSHOT_LAYOUT,
  resolveFigure,
};
