'use strict';

const { resolveFileSet, isExcludedDirectory, partitionProductAndTests } = require('../lib/fileScan.cjs');

/**
 * Tests for file-set resolution.
 *
 * The essential failure case is the one covered last: an unknown set name must throw
 * rather than resolve to an empty list, because an empty list flows downstream as a zero
 * total and reads exactly like a real measurement.
 */
module.exports = function fileScanSuite({ test, assertEqual, assertThrows }) {
  test('src set resolves to the expected file count', () => {
    assertEqual(resolveFileSet('src').length, 571, 'src TypeScript file count');
  });

  test('src set partitions into product and test files', () => {
    const { product, tests } = partitionProductAndTests(resolveFileSet('src'));
    assertEqual(product.length, 395, 'product file count');
    assertEqual(tests.length, 176, 'test file count');
  });

  test('project-owned set includes the three root configuration files and excludes JSON', () => {
    const resolved = resolveFileSet('project-owned');

    // Composition is asserted exactly and the total only within a band. The total legitimately moves
    // whenever anyone adds a script or a lint rule, so pinning it turns ordinary development into a
    // test failure and teaches whoever hits it to edit the number without reading why. What actually
    // needs guarding is the definition: the three root configuration files in and all JSON out. A
    // wide miss on the total still fails, because that means the set composition broke rather than
    // that the project grew.
    const rootConfigs = resolved.filter((p) =>
      /(?:eslint\.config\.js|electron-builder\.config\.cjs|electron-builder\.ci\.cjs)$/.test(p),
    );
    assertEqual(rootConfigs.length, 3, 'all three root configs present');
    assertEqual(
      resolved.filter((p) => p.endsWith('.json')).length,
      0,
      'no JSON files in the project-owned set',
    );
    assertEqual(
      resolved.length > 600 && resolved.length < 750,
      true,
      `project-owned file count out of band: ${resolved.length}`,
    );
  });

  test('compiled output is never walked', () => {
    assertEqual(isExcludedDirectory('dist'), true, 'dist must be excluded');
    assertEqual(isExcludedDirectory('node_modules'), true, 'node_modules must be excluded');
    const resolved = resolveFileSet('src');
    const leaked = resolved.filter((p) => p.includes(`${require('path').sep}dist${require('path').sep}`));
    assertEqual(leaked.length, 0, 'no compiled copies in the src set');
  });

  test('an unknown set name throws rather than resolving empty', () => {
    assertThrows(
      () => resolveFileSet('not-a-real-set'),
      'Unknown file set',
      'unknown set must be fatal',
    );
  });
};
