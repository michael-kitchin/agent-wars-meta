'use strict';

const fs = require('fs');
const path = require('path');
const { logDebug, logTrace, logError } = require('./harnessLogger.cjs');

/**
 * Resolves the named file sets the blog measurements are defined over.
 *
 * Sets are declared as data rather than as code branches so that adding or adjusting one
 * is a data edit with an obvious diff. Every set here corresponds to a figure the series
 * quotes, and the composition of `project-owned` in particular is exact: it is the
 * definition that yields the file and line totals Post 1 quotes, and dropping any
 * part of it silently changes a published number.
 */

/** Repository root, resolved from this file's location so scripts work from any cwd. */
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * Directories never walked, regardless of the set being resolved. `dist` is excluded
 * because it holds compiled copies of `src` that would double-count every line;
 * the rest are dependencies, build output, or virtual environments.
 */
const ALWAYS_EXCLUDED_DIRECTORIES = Object.freeze([
  'node_modules',
  'dist',
  'release',
  '.venv',
  '.git',
  '__pycache__',
  '.pytest_cache',
]);

/**
 * Declarative definitions of every measurable file set.
 *
 * `roots` are directories walked recursively for the listed extensions. `files` are
 * individual paths included verbatim, which is how the three root configuration files
 * join `project-owned` without dragging in the rest of the repository root.
 */
const FILE_SET_DEFINITIONS = Object.freeze({
  src: {
    description: 'All TypeScript under src/, product and test alike',
    roots: [{ dir: 'src', extensions: ['.ts'] }],
    files: [],
  },
  'src-main': {
    description: 'TypeScript under src/main/',
    roots: [{ dir: 'src/main', extensions: ['.ts'] }],
    files: [],
  },
  'src-renderer': {
    description: 'TypeScript under src/renderer/',
    roots: [{ dir: 'src/renderer', extensions: ['.ts'] }],
    files: [],
  },
  'src-shared': {
    description: 'TypeScript under src/shared/',
    roots: [{ dir: 'src/shared', extensions: ['.ts'] }],
    files: [],
  },
  'project-owned': {
    description:
      'Everything hand-owned by the project: src TypeScript, scripts, custom lint rules, and the three root build configs',
    roots: [
      { dir: 'src', extensions: ['.ts'] },
      { dir: 'scripts', extensions: ['.ts', '.cjs', '.js', '.py', '.mjs'] },
      { dir: 'eslint-rules', extensions: ['.ts', '.cjs', '.js'] },
    ],
    files: ['eslint.config.js', 'electron-builder.config.cjs', 'electron-builder.ci.cjs'],
  },
  'scripts-python': {
    description:
      'The Python terrain pipeline under scripts/, which is the project\'s second language',
    roots: [{ dir: 'scripts', extensions: ['.py'] }],
    files: [],
  },
  'spec-corpus': {
    description: 'Completed design and execution plans in .spec/completed/',
    roots: [{ dir: '.spec/completed', extensions: ['.md'] }],
    files: [],
  },
  'spec-deprecated': {
    description: 'Superseded top-level plans retained in .spec/deprecated/',
    roots: [{ dir: '.spec/deprecated', extensions: ['.md'] }],
    files: [],
  },
});

/**
 * True when a path segment names a directory the harness must never descend into.
 * Kept separate from the walk so the exclusion list stays the single source of truth.
 */
function isExcludedDirectory(name) {
  return ALWAYS_EXCLUDED_DIRECTORIES.includes(name);
}

/**
 * Recursively collects files under `absoluteDir` whose extension is in `extensions`.
 *
 * Returns an empty list for a missing directory rather than throwing, because several
 * sets name optional locations, and logs a warning path through `logTrace` so a silent
 * empty result is still visible at trace level. Results are sorted for deterministic
 * output, which matters when a figure is compared between runs.
 */
function collectFiles(absoluteDir, extensions) {
  logTrace('collectFiles', { dir: absoluteDir, extensions });
  if (!fs.existsSync(absoluteDir)) {
    logTrace('collectFiles: directory absent', absoluteDir);
    return [];
  }
  const collected = [];
  const pending = [absoluteDir];
  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      logError('collectFiles could not read directory', { dir: current, message: error.message });
      throw error;
    }
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!isExcludedDirectory(entry.name)) pending.push(entryPath);
        continue;
      }
      if (extensions.includes(path.extname(entry.name))) collected.push(entryPath);
    }
  }
  return collected.sort();
}

/**
 * Resolves a named set from `FILE_SET_DEFINITIONS` to a sorted list of absolute paths.
 *
 * Throws on an unknown set name rather than returning an empty list, because an empty
 * list would flow downstream as a zero total and read as a real measurement. Individually
 * listed files that do not exist are also fatal, since each one is part of a published
 * composition.
 */
function resolveFileSet(setName) {
  logDebug('resolveFileSet', setName);
  const definition = FILE_SET_DEFINITIONS[setName];
  if (definition === undefined) {
    const known = Object.keys(FILE_SET_DEFINITIONS).join(', ');
    throw new Error(`Unknown file set "${setName}". Known sets: ${known}`);
  }
  const resolved = [];
  for (const root of definition.roots) {
    resolved.push(...collectFiles(path.join(REPO_ROOT, root.dir), root.extensions));
  }
  for (const relative of definition.files) {
    const absolute = path.join(REPO_ROOT, relative);
    if (!fs.existsSync(absolute)) {
      throw new Error(
        `File set "${setName}" names ${relative}, which is missing. Published totals depend on it.`,
      );
    }
    resolved.push(absolute);
  }
  return resolved.sort();
}

/**
 * Partitions a resolved TypeScript list into product and test files.
 *
 * The `*.test.ts` suffix is the project's own convention and is what
 * `scripts/run-main-node-tests.cjs` discovers on, so using it here keeps the blog's
 * test-to-product ratio consistent with how the project actually treats these files.
 */
function partitionProductAndTests(filePaths) {
  logDebug('partitionProductAndTests', () => ({ fileCount: filePaths.length }));
  const product = [];
  const tests = [];
  for (const filePath of filePaths) {
    if (filePath.endsWith('.test.ts')) tests.push(filePath);
    else product.push(filePath);
  }
  return { product, tests };
}

/**
 * Absolute path to a repository-relative location. Use this rather than joining against
 * `process.cwd()`, so a script behaves the same whether run from the repository root or
 * from the harness directory.
 */
function repoPath(...segments) {
  return path.join(REPO_ROOT, ...segments);
}

module.exports = {
  REPO_ROOT,
  ALWAYS_EXCLUDED_DIRECTORIES,
  FILE_SET_DEFINITIONS,
  isExcludedDirectory,
  collectFiles,
  resolveFileSet,
  partitionProductAndTests,
  repoPath,
};
