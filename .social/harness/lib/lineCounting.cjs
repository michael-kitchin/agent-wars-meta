'use strict';

const fs = require('fs');
const { logDebug, logTrace, logError } = require('./harnessLogger.cjs');

/**
 * The two line-counting definitions the Agent Wars series quotes numbers from.
 *
 * These definitions are load-bearing and were reverse-engineered from the figures the
 * series plan already asserts, then confirmed against every published file-set total
 * (571 files / 136,391 lines and the five other groups). Changing either definition
 * silently changes published claims, so treat them as frozen and let the tests catch
 * drift.
 */

/**
 * Splits content into lines using the physical-line definition: split on either line
 * ending, then drop a single trailing empty element.
 *
 * The trailing-element rule is what makes the count match a normal editor's idea of file
 * length. A file ending with a newline would otherwise gain a phantom final line, while
 * a file ending without one still counts its last line. Handles CRLF, which matters
 * because this repository is developed on Windows.
 */
function splitPhysicalLines(content) {
  const parts = String(content).split(/\r?\n/);
  if (parts.length > 0 && parts[parts.length - 1] === '') {
    parts.pop();
  }
  return parts;
}

/**
 * Counts physical lines in already-loaded content. This is the definition behind every
 * file and line total the series quotes, so prefer it over any ad-hoc split.
 */
function countPhysicalLines(content) {
  logTrace('countPhysicalLines', () => ({ chars: String(content).length }));
  return splitPhysicalLines(content).length;
}

/**
 * Counts line terminators rather than lines.
 *
 * Reported only for the frozen prompt captures, because the series plan states 419 and
 * 171 lines for prompts that physically hold 420 and 172 — those figures were newline
 * counts. Reporting both is how the reconciliation report explains the discrepancy
 * instead of quietly picking a side.
 */
function countNewlines(content) {
  logTrace('countNewlines', () => ({ chars: String(content).length }));
  const matches = String(content).match(/\r?\n/g);
  return matches === null ? 0 : matches.length;
}

/**
 * Counts substantive lines: those that are neither blank nor comment-only.
 *
 * This is a HEURISTIC, NOT A PARSER, and the distinction matters because the resulting
 * percentage is published. It walks lines in order tracking whether it sits inside a
 * block comment, and it will miscount two known cases: a line inside a template literal
 * that begins with `*`, and a string containing `//`. Both are rare enough not to move
 * the aggregate, but any prose quoting the result must present it as a proxy rather than
 * an exact figure.
 *
 * The definition reproduces 53.6% for product code and 72.6% for tests, matching the
 * series plan's stated 54% and 73%, which is the evidence that it is the definition
 * originally used.
 */
function countSubstantiveLines(content) {
  logTrace('countSubstantiveLines', () => ({ chars: String(content).length }));
  let count = 0;
  let insideBlockComment = false;
  for (const line of splitPhysicalLines(content)) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (insideBlockComment) {
      if (trimmed.includes('*/')) insideBlockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) insideBlockComment = true;
      continue;
    }
    if (trimmed.startsWith('//')) continue;
    if (trimmed.startsWith('*')) continue;
    count += 1;
  }
  return count;
}

/**
 * Reads one file and returns all three counts plus its byte length.
 *
 * Reads as UTF-8 because every counted artifact in this repository is UTF-8 source or
 * markdown. Throws on an unreadable path after logging which path failed, since a
 * measurement built on a silently skipped file would understate a published total.
 */
function measureFile(filePath) {
  logTrace('measureFile', filePath);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      path: filePath,
      bytes: Buffer.byteLength(content, 'utf8'),
      physicalLines: countPhysicalLines(content),
      newlines: countNewlines(content),
      substantiveLines: countSubstantiveLines(content),
    };
  } catch (error) {
    logError('measureFile failed', { path: filePath, message: error.message });
    throw error;
  }
}

/**
 * Aggregates counts across a list of paths.
 *
 * Returns file count alongside the summed totals so a caller never has to trust that the
 * list length and the measured length agree. Use this for every published group total
 * rather than summing by hand at the call site.
 */
function measureFileSet(filePaths) {
  logDebug('measureFileSet', () => ({ fileCount: filePaths.length }));
  const totals = {
    files: 0,
    bytes: 0,
    physicalLines: 0,
    substantiveLines: 0,
  };
  for (const filePath of filePaths) {
    const measured = measureFile(filePath);
    totals.files += 1;
    totals.bytes += measured.bytes;
    totals.physicalLines += measured.physicalLines;
    totals.substantiveLines += measured.substantiveLines;
  }
  return totals;
}

module.exports = {
  splitPhysicalLines,
  countPhysicalLines,
  countNewlines,
  countSubstantiveLines,
  measureFile,
  measureFileSet,
};
