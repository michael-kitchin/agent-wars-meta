'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Minimal test runner for the harness.
 *
 * The harness cannot use the project's own test runner: `scripts/run-main-node-tests.cjs`
 * discovers compiled `*.test.js` under `dist/`, and these are plain CommonJS files that
 * are never built. This runner therefore loads every `*.test.cjs` beside it, gives each
 * a shared assertion helper, and reports a single pass or fail summary.
 *
 * Tests cover happy paths and the failures that would silently corrupt a published
 * figure, including snapshot cell formatting for structured values. Trivial accessors
 * are still untested.
 */

/** Accumulated results, keyed so the summary can name the failing case. */
const results = { passed: 0, failed: [] };

/**
 * Registers and immediately runs one named check.
 *
 * Exported to the test modules as `test`. A throwing body is recorded as a failure rather
 * than aborting the run, so one broken definition does not hide the state of the rest.
 */
function test(name, body) {
  try {
    body();
    results.passed += 1;
  } catch (error) {
    results.failed.push({ name, message: error.message });
  }
}

/**
 * Asserts deep equality between an actual and expected value.
 *
 * Compares by JSON encoding, which is sufficient for the plain data these modules return
 * and gives a readable diff in the failure message. Use `assertEqual` for scalars and
 * this for objects and arrays.
 */
function assertDeepEqual(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\n  expected: ${expectedJson}\n  actual:   ${actualJson}`);
  }
}

/**
 * Asserts strict equality, reporting both values on failure.
 *
 * Prefer this over a bare `if` in tests so every failure message names what was expected,
 * which is what makes a golden-value mismatch diagnosable.
 */
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

/**
 * Asserts that `body` throws, optionally requiring the message to contain `fragment`.
 *
 * Used for the failure cases that matter: an unknown file set, a missing capture, stale
 * compiled output. Each of those must be loud, because the quiet version is a zero that
 * reads like a measurement.
 */
function assertThrows(body, fragment, message) {
  let threw = false;
  try {
    body();
  } catch (error) {
    threw = true;
    if (fragment !== undefined && !String(error.message).includes(fragment)) {
      throw new Error(`${message}\n  expected message containing: ${fragment}\n  actual: ${error.message}`);
    }
  }
  if (!threw) throw new Error(`${message}\n  expected a throw, got none`);
}

/**
 * Loads and runs every sibling `*.test.cjs`, then exits non-zero if anything failed.
 *
 * Test modules export a single function taking the assertion helpers, which keeps them
 * free of their own runner wiring.
 */
function main() {
  const here = __dirname;
  const testFiles = fs
    .readdirSync(here)
    .filter((name) => name.endsWith('.test.cjs'))
    .sort();

  const helpers = { test, assertEqual, assertDeepEqual, assertThrows };
  for (const name of testFiles) {
    const suite = require(path.join(here, name));
    if (typeof suite !== 'function') {
      results.failed.push({ name, message: 'test module does not export a function' });
      continue;
    }
    suite(helpers);
  }

  process.stdout.write(`\nharness tests: ${results.passed} passed, ${results.failed.length} failed\n`);
  for (const failure of results.failed) {
    process.stdout.write(`  FAIL ${failure.name}: ${failure.message}\n`);
  }
  process.exit(results.failed.length === 0 ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { test, assertEqual, assertDeepEqual, assertThrows };
