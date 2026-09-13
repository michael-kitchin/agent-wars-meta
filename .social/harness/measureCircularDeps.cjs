'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { repoPath } = require('./lib/fileScan.cjs');
const { figure } = require('./lib/metricsWriter.cjs');
const { logDebug, logError } = require('./lib/harnessLogger.cjs');
const {
  findRuntimeImportCycles,
  findTypeOnlyInflatedImportCycles,
} = require('../../scripts/lib/importGraph.cjs');

/**
 * Measures the committed circular-dependency baseline and whether the checker still passes.
 *
 * The interesting figure is not the raw cycle count but its stability: a flat or shrinking
 * count across months of agent-driven development is the finding, because it means the gate
 * held rather than that the code happened to stay clean.
 *
 * This module never rewrites the baseline. Refreshing it to silence a finding is exactly the
 * practice the series holds up as never allowed, and a measurement script quietly doing it
 * would be worse than a developer doing it deliberately.
 */

/** The committed baseline of known, accepted cycles. */
const BASELINE_RELATIVE_PATH = 'scripts/circular-deps-baseline.json';

/** The checker script, which reads src/ directly and needs no build. */
const CHECKER_RELATIVE_PATH = 'scripts/check-circular-deps.cjs';

/** Compiled main-process output, used to corroborate the source-level result independently. */
const COMPILED_MAIN_RELATIVE_PATH = 'dist/main';

/**
 * Counts real `require` edges and cycles in the compiled main-process output.
 *
 * This exists because the source-level checker reads text and decides for itself which imports
 * survive compilation. That decision is the whole basis of the gate, so it needs a check that does
 * not depend on it: the emitted JavaScript has already had type-only imports removed by the
 * compiler, and its `require` calls are the edges that actually exist at run time.
 *
 * Returns null when `dist/main` is absent, because an unbuilt tree is a missing corroboration
 * rather than a finding of zero cycles.
 */
function measureCompiledRequireGraph() {
  logDebug('measureCompiledRequireGraph');
  const root = repoPath(COMPILED_MAIN_RELATIVE_PATH);
  if (!fs.existsSync(root)) {
    logError('measureCompiledRequireGraph: compiled output missing', { path: COMPILED_MAIN_RELATIVE_PATH });
    return null;
  }

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
        files.push(abs);
      }
    }
  };
  walk(root);

  const known = new Set(files);
  const graph = new Map(files.map((file) => [file, []]));
  let edgeCount = 0;
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      const base = path.resolve(path.dirname(file), match[1]);
      const resolved = [base, `${base}.js`, path.join(base, 'index.js')].find(
        (candidate) => known.has(candidate),
      );
      if (resolved !== undefined) {
        graph.get(file).push(resolved);
        edgeCount += 1;
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = new Set();
  const visit = (node) => {
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (visiting.has(next)) {
        cycles.add(
          stack
            .slice(stack.indexOf(next))
            .concat(next)
            .map((abs) => path.relative(repoPath('.'), abs).replace(/\\/g, '/'))
            .join(' -> '),
        );
        continue;
      }
      visit(next);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };
  for (const node of graph.keys()) visit(node);

  return { files: files.length, edges: edgeCount, cycles: [...cycles] };
}

/**
 * Reads the baseline and returns its cycle count.
 *
 * The baseline is a JSON array of cycles, so the count is its length. Throws on a missing or
 * unparseable baseline, since a zero would misrepresent the gate as trivially satisfied.
 */
function readBaselineCycleCount() {
  logDebug('readBaselineCycleCount');
  const absolute = repoPath(BASELINE_RELATIVE_PATH);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Circular-dependency baseline missing at ${BASELINE_RELATIVE_PATH}`);
  }
  const parsed = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected ${BASELINE_RELATIVE_PATH} to hold an array of cycles`);
  }
  return parsed.length;
}

/**
 * Runs the checker and reports whether it passes.
 *
 * Invoked with Node directly rather than through npm to avoid a shell and the script-running
 * overhead. A non-zero exit means new or reshaped cycles exist relative to the baseline,
 * which is reported as a finding rather than thrown: the measurement of the baseline is
 * still valid and useful even when the working tree has drifted.
 */
function runChecker() {
  logDebug('runChecker');
  try {
    const output = execFileSync(process.execPath, [repoPath(CHECKER_RELATIVE_PATH)], {
      cwd: repoPath('.'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { passes: true, output: output.trim() };
  } catch (error) {
    logError('runChecker reported failure', { message: error.message });
    const combined = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    return { passes: false, output: combined === '' ? error.message : combined };
  }
}

/**
 * Produces the circular-dependency measurement.
 *
 * Set `options.runChecker` to false to skip invoking the checker, which is useful when the
 * working tree is mid-refactor and the run is only after the baseline figure.
 */
function measureCircularDeps(options = {}) {
  logDebug('measureCircularDeps', options);
  const shouldRun = options.runChecker !== false;
  const baselineCount = readBaselineCycleCount();
  const checkerResult = shouldRun ? runChecker() : null;
  const compiled = measureCompiledRequireGraph();
  const runtimeSourceCycles = findRuntimeImportCycles(repoPath('.'));
  const typeOnlyInflatedCycles = findTypeOnlyInflatedImportCycles(repoPath('.'));

  return {
    source: `${BASELINE_RELATIVE_PATH} and ${CHECKER_RELATIVE_PATH}`,
    compiledMainModules: figure(
      compiled === null ? null : compiled.files,
      `${COMPILED_MAIN_RELATIVE_PATH} JavaScript modules, tests excluded`,
    ),
    compiledRequireEdges: figure(
      compiled === null ? null : compiled.edges,
      `relative require() calls between ${COMPILED_MAIN_RELATIVE_PATH} modules`,
    ),
    compiledCycleCount: figure(
      compiled === null ? null : compiled.cycles.length,
      'cycles in the compiled require graph, which is the run-time truth the source checker approximates',
    ),
    compiledCycles: figure(
      compiled === null ? null : compiled.cycles,
      'each compiled cycle, so a non-zero count can be acted on rather than only reported',
    ),
    runtimeSourceCycleCount: figure(
      runtimeSourceCycles.length,
      'source-level cycles counting only imports that survive compilation',
    ),
    typeOnlyInflatedCycleCount: figure(
      typeOnlyInflatedCycles.length,
      'source-level cycles when type-only imports are counted as edges -- the definition the gate used to apply',
    ),
    baselineCycleCount: figure(
      baselineCount,
      `${BASELINE_RELATIVE_PATH}, array length`,
    ),
    checkerRun: figure(shouldRun, 'whether the checker was invoked during this measurement'),
    checkerPasses: figure(
      checkerResult === null ? null : checkerResult.passes,
      'exit status of check-circular-deps.cjs: passing means no new or reshaped cycles beyond the baseline',
    ),
    checkerOutput: figure(
      checkerResult === null ? null : checkerResult.output,
      'checker stdout and stderr, retained for diagnosis',
    ),
    notes: figure(
      [
        'The gate counts only imports that survive compilation; type-only imports are erased and cannot cause the initialisation-order bug it exists to catch.',
        'The gate fails only on new or reshaped cycles, not on the baselined ones.',
        'The baseline is never refreshed to silence a finding; the correct fix is to change the import direction.',
        'The checker parses src/ directly and needs no build step.',
      ],
      'how the gate is meant to be read',
    ),
  };
}

/** Prints the measurement when run directly, for checking against expected values. */
if (require.main === module) {
  process.stdout.write(`${JSON.stringify(measureCircularDeps(), null, 2)}\n`);
}

module.exports = {
  BASELINE_RELATIVE_PATH,
  CHECKER_RELATIVE_PATH,
  COMPILED_MAIN_RELATIVE_PATH,
  readBaselineCycleCount,
  runChecker,
  measureCompiledRequireGraph,
  measureCircularDeps,
};
