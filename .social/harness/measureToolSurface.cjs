'use strict';

const fs = require('fs');
const path = require('path');
const { repoPath, collectFiles } = require('./lib/fileScan.cjs');
const { figure } = require('./lib/metricsWriter.cjs');
const { logDebug, logTrace, logError } = require('./lib/harnessLogger.cjs');

/**
 * Measures the LLM tool surface and callback vocabulary from the application's own
 * compiled modules.
 *
 * This module calls the real functions and reads the real constants rather than parsing
 * TypeScript source. That choice matters: a regex over source silently returns an empty
 * list when a declaration is reformatted, and an empty list downstream reads like a
 * measurement of zero. Calling `buildToolDefinitions` cannot be wrong about how many tools
 * reach the model, because it is the same code path that builds the request.
 *
 * The trade-off is a build prerequisite. `dist/` is gitignored, so `npm run build:main`
 * must have run, and the module refuses to report against compiled output older than the
 * sources it came from.
 */

/**
 * Compiled modules this measurement requires, relative to `dist/main`.
 *
 * This list is deliberately minimal and was verified to load under plain Node with no
 * Electron present. Do NOT extend it casually: several neighbouring modules — notably
 * `openRouter/openRouter.js` — import Electron `app` and `safeStorage` at module top level
 * and will throw outside an Electron process.
 */
const REQUIRED_COMPILED_MODULES = Object.freeze({
  toolGroups: 'openRouter/openRouterToolGroups.js',
  toolCatalog: 'openRouter/openRouterToolCatalog.js',
  assessment: 'tools/assessment.js',
  combatEstimation: 'tools/combatEstimation.js',
  orderResponseParsing: 'openRouter/orderResponseParsing.js',
  callbackVocabularyText: 'openRouter/promptSpec/callbackVocabularyText.js',
});

/** Instructions surfaced when compiled output is missing or stale. */
const BUILD_INSTRUCTIONS =
  'Compiled output under dist/main is missing or older than src/main. Run `npm run build:main` and re-measure.';

/**
 * Normalises a collection of tool or event names to a sorted array.
 *
 * The application uses a mix of shapes for these lists — `CALLBACK_EVENT_VOCAB` is a Set,
 * `TAUGHT_CALLBACK_EVENTS` is an array of objects carrying an `event` field, and the tool
 * name constants are plain arrays. Handling all three here keeps the shape knowledge in one
 * place instead of at every call site.
 */
function toSortedNames(collection) {
  logTrace('toSortedNames', () => ({ type: collection === null ? 'null' : typeof collection }));
  if (collection instanceof Set) return [...collection].sort();
  if (Array.isArray(collection)) {
    return collection
      .map((entry) => (typeof entry === 'string' ? entry : entry?.event ?? entry?.name))
      .filter((name) => typeof name === 'string')
      .sort();
  }
  return [];
}

/**
 * Returns the newest modification time under a directory, or null when it does not exist.
 *
 * Used for the staleness comparison. Walks only the extensions that matter to avoid
 * treating an unrelated artifact as evidence of a fresh build.
 */
function newestModificationTime(directory, extensions) {
  logTrace('newestModificationTime', directory);
  if (!fs.existsSync(directory)) return null;
  let newest = 0;
  for (const filePath of collectFiles(directory, extensions)) {
    const modified = fs.statSync(filePath).mtimeMs;
    if (modified > newest) newest = modified;
  }
  return newest === 0 ? null : newest;
}

/**
 * Verifies compiled output exists and is not older than its sources.
 *
 * Throws with build instructions rather than reporting figures from stale output, because a
 * tool count measured against last week's build is worse than no measurement: it looks
 * authoritative and is wrong.
 */
function assertCompiledOutputFresh() {
  logDebug('assertCompiledOutputFresh');
  const distMain = repoPath('dist', 'main');
  const srcMain = repoPath('src', 'main');
  if (!fs.existsSync(distMain)) throw new Error(BUILD_INSTRUCTIONS);

  const newestSource = newestModificationTime(srcMain, ['.ts']);
  const newestCompiled = newestModificationTime(distMain, ['.js']);
  if (newestCompiled === null) throw new Error(BUILD_INSTRUCTIONS);
  if (newestSource !== null && newestSource > newestCompiled) {
    throw new Error(
      `${BUILD_INSTRUCTIONS} Newest source is ${new Date(newestSource).toISOString()}, newest compiled is ${new Date(newestCompiled).toISOString()}.`,
    );
  }
  return { newestSource, newestCompiled };
}

/**
 * Loads the six required compiled modules.
 *
 * A failure here is reported with the module that failed, because the usual cause is a
 * newly added Electron import in something this list depends on, and knowing which module
 * broke is the whole diagnosis.
 */
function loadCompiledModules() {
  logDebug('loadCompiledModules');
  const loaded = {};
  for (const [key, relative] of Object.entries(REQUIRED_COMPILED_MODULES)) {
    const absolute = path.join(repoPath('dist', 'main'), relative);
    try {
      loaded[key] = require(absolute);
    } catch (error) {
      logError('loadCompiledModules failed', { module: relative, message: error.message });
      throw new Error(`Could not load ${relative}: ${error.message}`);
    }
  }
  return loaded;
}

/**
 * Produces the full tool-surface measurement.
 *
 * The exposed set is computed the way the application computes it — all tool names from the
 * enabled groups, minus the assessment and combat-estimation names that pre-computation
 * withholds — and then confirmed by asking `buildToolDefinitions` how many definitions it
 * actually emits for that set.
 */
function measureToolSurface() {
  logDebug('measureToolSurface');
  const freshness = assertCompiledOutputFresh();
  const modules = loadCompiledModules();

  const groupIds = modules.toolGroups.TOOL_GROUP_REGISTRY.map((group) => group.id);
  const allToolNames = toSortedNames(modules.toolGroups.getToolNamesForEnabledGroups(groupIds));
  const assessmentNames = toSortedNames(modules.assessment.ASSESSMENT_TOOL_NAMES);
  const estimationNames = toSortedNames(modules.combatEstimation.COMBAT_ESTIMATION_TOOL_NAMES);
  const withheldNames = [...assessmentNames, ...estimationNames].sort();
  const exposedNames = allToolNames.filter((name) => !withheldNames.includes(name));
  const emittedDefinitionCount = modules.toolCatalog.buildToolDefinitions(exposedNames).length;

  const parsedEvents = toSortedNames(modules.orderResponseParsing.CALLBACK_EVENT_VOCAB);
  const taughtEvents = toSortedNames(modules.callbackVocabularyText.TAUGHT_CALLBACK_EVENTS);
  const parsedButNotTaught = parsedEvents.filter((event) => !taughtEvents.includes(event));

  const sourceNote = 'compiled modules under dist/main, called directly';

  return {
    source: sourceNote,
    build: {
      newestSourceAt: figure(
        freshness.newestSource === null ? null : new Date(freshness.newestSource).toISOString(),
        'newest mtime under src/main',
      ),
      newestCompiledAt: figure(
        freshness.newestCompiled === null ? null : new Date(freshness.newestCompiled).toISOString(),
        'newest mtime under dist/main',
      ),
    },
    tools: {
      groupCount: figure(groupIds.length, 'TOOL_GROUP_REGISTRY in openRouterToolGroups'),
      groupIds: figure(groupIds, 'TOOL_GROUP_REGISTRY in openRouterToolGroups'),
      builtCount: figure(allToolNames.length, 'getToolNamesForEnabledGroups across every group'),
      builtNames: figure(allToolNames, 'getToolNamesForEnabledGroups across every group'),
      withheldCount: figure(
        withheldNames.length,
        'ASSESSMENT_TOOL_NAMES plus COMBAT_ESTIMATION_TOOL_NAMES, the set pre-computation withholds',
      ),
      withheldNames: figure(
        withheldNames,
        'ASSESSMENT_TOOL_NAMES plus COMBAT_ESTIMATION_TOOL_NAMES',
      ),
      exposedCount: figure(exposedNames.length, 'derived: built names minus withheld names'),
      exposedNames: figure(exposedNames, 'derived: built names minus withheld names'),
      emittedDefinitionCount: figure(
        emittedDefinitionCount,
        'buildToolDefinitions(exposed).length, the count actually sent to the model',
      ),
      exposedCountAgrees: figure(
        emittedDefinitionCount === exposedNames.length,
        'derived: cross-check that the computed exposed set matches what the catalog emits',
      ),
    },
    callbacks: {
      parsedCount: figure(parsedEvents.length, 'CALLBACK_EVENT_VOCAB in orderResponseParsing'),
      parsedEvents: figure(parsedEvents, 'CALLBACK_EVENT_VOCAB in orderResponseParsing'),
      taughtCount: figure(taughtEvents.length, 'TAUGHT_CALLBACK_EVENTS in callbackVocabularyText'),
      taughtEvents: figure(taughtEvents, 'TAUGHT_CALLBACK_EVENTS in callbackVocabularyText'),
      parsedButNotTaught: figure(
        parsedButNotTaught,
        'derived: accepted by the parser but deliberately not taught to the model',
      ),
    },
    limitations: figure(
      [
        'The exposed count reflects every tool group being enabled, which is the default state. A run with groups disabled would expose fewer.',
        'Withholding is driven by the pre-computation flag; a consult with pre-computation off would expose all nine.',
      ],
      'stated limitations of the tool-surface measurement',
    ),
  };
}

/** Prints the measurement when run directly, for checking against expected values. */
if (require.main === module) {
  process.stdout.write(`${JSON.stringify(measureToolSurface(), null, 2)}\n`);
}

module.exports = {
  REQUIRED_COMPILED_MODULES,
  BUILD_INSTRUCTIONS,
  toSortedNames,
  newestModificationTime,
  assertCompiledOutputFresh,
  loadCompiledModules,
  measureToolSurface,
};
