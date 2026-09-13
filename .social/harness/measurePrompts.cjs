'use strict';

const fs = require('fs');
const { repoPath } = require('./lib/fileScan.cjs');
const {
  countPhysicalLines,
  countNewlines,
  splitPhysicalLines,
} = require('./lib/lineCounting.cjs');
const { figure } = require('./lib/metricsWriter.cjs');
const { logDebug, logTrace } = require('./lib/harnessLogger.cjs');

/**
 * Measures the frozen prompt captures: size, length, and section structure.
 *
 * Measured from the frozen copies in `.social/evidence/` rather than from the live
 * `debug-last-*.txt` dumps, because those are gitignored and would make every prompt
 * figure irreproducible from a clean checkout. Refreshing the captures is a deliberate,
 * documented act rather than a side effect of running the app.
 */

/** Directory holding the frozen captures, relative to the repository root. */
const EVIDENCE_DIRECTORY = '.social/evidence';

/** Matches an ATX markdown heading and captures its level and text. */
const ATX_HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;

/**
 * The captures to measure, with the role each plays in the consultation.
 *
 * Keyed by the name the drafts refer to them by. Adding a capture means adding an entry
 * here and freezing the file; nothing else changes.
 */
const PROMPT_CAPTURES = Object.freeze([
  {
    key: 'strategic',
    fileName: 'strategicSystemPromptCapture.txt',
    role: 'Strategic system prompt: the world-map decision context',
  },
  {
    key: 'tactical',
    fileName: 'tacticalSystemPromptCapture.txt',
    role: 'Tactical system prompt: the single-battle decision context',
  },
  {
    key: 'user',
    fileName: 'userPromptCapture.txt',
    role: 'User turn instruction accompanying the system prompt',
  },
]);

/**
 * Instructions surfaced when a capture is missing.
 *
 * Kept as a constant so the failure message is identical everywhere and stays in step with
 * the evidence README. A missing capture must be loud: silently reporting zero characters
 * would put a plausible-looking wrong number into a draft.
 */
const RECAPTURE_INSTRUCTIONS = [
  'A frozen prompt capture is missing.',
  'To restore it: set AGENT_WARS_LOG_FULL_PROMPTS=1, run npm start, take one strategic turn',
  'and one tactical beat, then copy the resulting debug-last-*-prompt.txt files into',
  '.social/evidence/ under their frozen names. See .social/evidence/README.md.',
].join(' ');

/**
 * Counts characters outside the ASCII range.
 *
 * Exists to make the byte-versus-character discrepancy explainable rather than merely reported:
 * en dashes, em dashes, and comparison symbols each cost three UTF-8 bytes, so this count times
 * two accounts for the gap precisely. A draft claiming a character count needs this to know
 * whether the figure it inherited was really a byte length.
 */
function countNonAscii(content) {
  logTrace('countNonAscii');
  let count = 0;
  for (const character of String(content)) {
    if (character.codePointAt(0) > 127) count += 1;
  }
  return count;
}

/**
 * Extracts the ordered ATX heading list from capture text.
 *
 * Headings are how prompt sections are counted, and the count is quotable (the series
 * describes the strategic prompt as carrying nineteen sections). Returns level and text so
 * a draft can name sections rather than only count them.
 */
function extractHeadings(content) {
  logTrace('extractHeadings', () => ({ chars: content.length }));
  const headings = [];
  for (const line of splitPhysicalLines(content)) {
    const match = line.match(ATX_HEADING_PATTERN);
    if (match !== null) {
      headings.push({ level: match[1].length, text: match[2].trim() });
    }
  }
  return headings;
}

/**
 * Measures one capture.
 *
 * Reports physical line count and newline count separately because they differ by one on
 * these files, and the series plan's stated line figures are newline counts. Publishing
 * both is what lets the reconciliation report explain the gap instead of silently choosing.
 */
function measureCapture(capture) {
  logDebug('measureCapture', capture.fileName);
  const absolute = repoPath(EVIDENCE_DIRECTORY, capture.fileName);
  if (!fs.existsSync(absolute)) {
    throw new Error(`${RECAPTURE_INSTRUCTIONS} Missing: ${capture.fileName}`);
  }
  const content = fs.readFileSync(absolute, 'utf8');
  const headings = extractHeadings(content);
  return {
    role: capture.role,
    characters: content.length,
    bytes: Buffer.byteLength(content, 'utf8'),
    // Explains the byte-versus-character gap exactly: each of these costs more than one byte in
    // UTF-8, and the series plan quotes byte lengths as though they were character counts.
    nonAsciiCharacters: countNonAscii(content),
    physicalLines: countPhysicalLines(content),
    newlines: countNewlines(content),
    headingCount: headings.length,
    headings,
  };
}

/**
 * Produces the full prompt measurement, plus the strategic-versus-tactical comparison the
 * series draws on when arguing that two small contracts beat one large one.
 */
function measurePrompts() {
  logDebug('measurePrompts');
  const measured = {};
  for (const capture of PROMPT_CAPTURES) {
    measured[capture.key] = measureCapture(capture);
  }

  const sourceNote = 'frozen captures in .social/evidence/, character counts and ATX heading counts';
  const result = {
    source: sourceNote,
    captures: {},
    comparison: {},
    limitations: figure(
      [
        'These are captures of one game state (turn 7, planning) and not a size bound across all states.',
        'The series plan states 419 and 171 lines; those are newline counts. The files hold 420 and 172 physical lines.',
        'The series plan states 44,047 and 20,060 characters; those are byte lengths. Character counts are 43,839 and 20,014, the difference being non-ASCII punctuation. Prose saying "about 44,000 characters" is correct either way.',
        'Token counts are not measured. A characters-per-token heuristic is an estimate, not a figure, and must stay a placeholder.',
      ],
      'stated limitations of the prompt measurement',
    ),
  };

  for (const [key, capture] of Object.entries(measured)) {
    result.captures[key] = {
      role: figure(capture.role, sourceNote),
      characters: figure(capture.characters, `${sourceNote}: ${key}, UTF-8 code-unit count`),
      nonAsciiCharacters: figure(
        capture.nonAsciiCharacters,
        `${sourceNote}: ${key}, characters outside ASCII — the whole of the byte-to-character gap`,
      ),
      bytes: figure(
        capture.bytes,
        `${sourceNote}: ${key}, UTF-8 byte length — this is the figure the series plan quotes as a character count`,
      ),
      physicalLines: figure(capture.physicalLines, `${sourceNote}: ${key}, physical-line definition`),
      newlines: figure(capture.newlines, `${sourceNote}: ${key}, newline count`),
      headingCount: figure(capture.headingCount, `${sourceNote}: ${key}, ATX headings`),
      headings: figure(capture.headings, `${sourceNote}: ${key}, ordered heading list with levels`),
    };
  }

  const strategic = measured.strategic;
  const tactical = measured.tactical;
  result.comparison = {
    tacticalShareOfStrategicCharacters: figure(
      Math.round((100 * tactical.characters) / strategic.characters),
      'derived: tactical characters / strategic characters, as a percentage',
    ),
    sectionsDroppedInTactical: figure(
      strategic.headings
        .map((heading) => heading.text)
        .filter((text) => !tactical.headings.some((heading) => heading.text === text)),
      'derived: strategic heading texts with no tactical counterpart',
    ),
  };

  return result;
}

/** Prints the measurement when run directly, for checking against expected values. */
if (require.main === module) {
  process.stdout.write(`${JSON.stringify(measurePrompts(), null, 2)}\n`);
}

module.exports = {
  EVIDENCE_DIRECTORY,
  ATX_HEADING_PATTERN,
  PROMPT_CAPTURES,
  countNonAscii,
  RECAPTURE_INSTRUCTIONS,
  extractHeadings,
  measureCapture,
  measurePrompts,
};
