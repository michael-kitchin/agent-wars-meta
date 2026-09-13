'use strict';

const { formatSnapshotValue } = require('../lib/metricsWriter.cjs');

/**
 * Contract tests for snapshot cell formatting.
 *
 * A table cell must stay a single line and must never coerce a structured value to
 * `[object Object]`, which is what default string conversion did to ranked hours and
 * nested domain maps. These cases are the shapes the snapshot actually holds.
 */
module.exports = ({ test, assertEqual }) => {
  test('formatSnapshotValue thousands-separates a primitive number', () => {
    assertEqual(formatSnapshotValue(136391), '136,391', 'primitive number');
  });

  test('formatSnapshotValue comma-joins an array of primitives', () => {
    assertEqual(
      formatSnapshotValue(['assess_hex', 'assess_unit']),
      'assess_hex, assess_unit',
      'array of primitives',
    );
  });

  test('formatSnapshotValue flattens an array of objects', () => {
    const value = [
      { milestone: 'M2.3', hours: 21.42 },
      { milestone: 'M1.2', hours: 19.94 },
    ];
    assertEqual(
      formatSnapshotValue(value),
      'milestone M2.3 hours 21.4; milestone M1.2 hours 19.9',
      'array of objects',
    );
  });

  test('formatSnapshotValue flattens a flat object', () => {
    assertEqual(
      formatSnapshotValue({ planning: 2.94, promotion: 6.51 }),
      'planning 2.94 promotion 6.51',
      'flat object',
    );
  });

  test('formatSnapshotValue recursively flattens a nested domain map', () => {
    const value = {
      geospatial: { hours: 43.38, milestones: ['M1.2', 'M1.7'] },
    };
    assertEqual(
      formatSnapshotValue(value),
      'geospatial hours 43.4 milestones M1.2, M1.7',
      'nested byDomain shape',
    );
  });

  test('formatSnapshotValue escapes a pipe so it cannot break the table', () => {
    assertEqual(formatSnapshotValue('a|b'), 'a\\|b', 'pipe in a string');
  });

  test('formatSnapshotValue renders null and undefined as an empty cell', () => {
    assertEqual(formatSnapshotValue(null), '', 'null');
    assertEqual(formatSnapshotValue(undefined), '', 'undefined');
  });
};
