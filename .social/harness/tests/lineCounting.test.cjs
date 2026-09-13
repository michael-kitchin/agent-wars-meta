'use strict';

const {
  countPhysicalLines,
  countNewlines,
  countSubstantiveLines,
} = require('../lib/lineCounting.cjs');

/**
 * Tests for the two counting definitions the series publishes numbers from.
 *
 * These are the harness's highest-value tests. Both definitions were reverse-engineered
 * from figures already asserted in the series plan, so an undetected change here would
 * quietly alter a published claim rather than break anything visibly.
 */
module.exports = function lineCountingSuite({ test, assertEqual }) {
  test('physical lines: trailing newline does not add a phantom line', () => {
    assertEqual(countPhysicalLines('a\nb\nc\n'), 3, 'three lines with trailing newline');
  });

  test('physical lines: missing trailing newline still counts the last line', () => {
    assertEqual(countPhysicalLines('a\nb\nc'), 3, 'three lines without trailing newline');
  });

  test('physical lines: CRLF endings count the same as LF', () => {
    assertEqual(countPhysicalLines('a\r\nb\r\nc\r\n'), 3, 'CRLF must match LF');
  });

  test('physical lines: empty content is zero, not one', () => {
    assertEqual(countPhysicalLines(''), 0, 'empty file has no lines');
  });

  test('physical lines: blank lines are counted as lines', () => {
    assertEqual(countPhysicalLines('a\n\n\nb\n'), 4, 'blanks are physical lines');
  });

  test('newline count is one less than physical lines when a trailing newline exists', () => {
    const content = 'a\nb\nc\n';
    assertEqual(countNewlines(content), 3, 'three terminators');
    assertEqual(countPhysicalLines(content), 3, 'three lines');
  });

  test('newline count trails physical lines when the final newline is absent', () => {
    const content = 'a\nb\nc';
    assertEqual(countNewlines(content), 2, 'two terminators');
    assertEqual(countPhysicalLines(content), 3, 'three lines');
  });

  test('substantive lines: blanks and line comments are excluded', () => {
    const content = ['const a = 1;', '', '// a comment', 'const b = 2;', ''].join('\n');
    assertEqual(countSubstantiveLines(content), 2, 'only the two statements count');
  });

  test('substantive lines: a whole-file block comment counts as nothing', () => {
    const content = ['/**', ' * Orienting comment.', ' * More of it.', ' */'].join('\n');
    assertEqual(countSubstantiveLines(content), 0, 'block comment is not substantive');
  });

  test('substantive lines: a single-line block comment does not open a block', () => {
    const content = ['/* inline */', 'const a = 1;'].join('\n');
    assertEqual(countSubstantiveLines(content), 1, 'the statement after must still count');
  });

  test('substantive lines: code after a closing block delimiter resumes counting', () => {
    const content = ['/*', ' * hidden', ' */', 'const a = 1;', 'const b = 2;'].join('\n');
    assertEqual(countSubstantiveLines(content), 2, 'both statements count');
  });

  test('substantive lines: JSDoc continuation lines are excluded', () => {
    const content = ['/**', ' * @param x thing', ' */', 'function f(x) {', '  return x;', '}'].join('\n');
    assertEqual(countSubstantiveLines(content), 3, 'signature, body, and brace');
  });

  test('substantive lines: known heuristic limitation is a documented miscount', () => {
    // A template-literal line beginning with an asterisk is skipped even though it is
    // content. Asserted so the limitation stays visible rather than being discovered
    // later by someone auditing a published percentage.
    const content = ['const s = `', '* not a comment', '`;'].join('\n');
    assertEqual(countSubstantiveLines(content), 2, 'heuristic drops the asterisk line');
  });
};
