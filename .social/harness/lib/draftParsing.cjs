'use strict';

const { logTrace } = require('./harnessLogger.cjs');

/**
 * Parsing primitives for blog drafts, shared by the draft checker and available to any later
 * tooling that needs to read a draft structurally rather than by regex from scratch.
 *
 * These functions are deliberately small and total: they never throw on malformed input, they
 * return empty results instead. A draft under construction is malformed most of the time, and a
 * checker that crashes on the input it exists to inspect is useless.
 */

/** The line that opens and closes YAML front matter. */
const FRONT_MATTER_DELIMITER = '---';

/** Front-matter keys every draft must carry. */
const REQUIRED_FRONT_MATTER_KEYS = Object.freeze([
  'title',
  'post',
  'thread',
  'status',
  'platforms',
  'substack_target_words',
  'linkedin_target_chars',
  'depends_on',
]);

/** The only permitted values for the `thread` key. */
const ALLOWED_THREADS = Object.freeze([
  'Agentic Development',
  'Spatial Reasoning',
  'LLM Systems Engineering',
  'Synthesis',
]);

/** Matches a placeholder opener such as `> **[IMAGE: sh-strategic-map]**`. */
const PLACEHOLDER_PATTERN = /^>\s*\*\*\[(IMAGE|VIDEO|DATA):\s*([^\]]+)\]\*\*/;

/** Matches a fenced code block boundary, with or without a language tag. */
const CODE_FENCE_PATTERN = /^\s*```/;

/**
 * Splits a draft into its front matter and its body.
 *
 * Returns `fields` as a flat string map with values left exactly as written, because the checker
 * needs to complain about the written form rather than about a normalized one. `bodyStartLine` is
 * one-based so findings can cite line numbers a person can jump to.
 *
 * A file with no front matter comes back with an empty `fields` map and the whole file as body,
 * which the checker reports as a missing-front-matter finding.
 */
function parseFrontMatter(content) {
  logTrace('parseFrontMatter');
  const lines = String(content).split(/\r?\n/);
  if (lines[0]?.trim() !== FRONT_MATTER_DELIMITER) {
    return { fields: {}, fieldLines: {}, body: String(content), bodyStartLine: 1, present: false };
  }

  const fields = {};
  const fieldLines = {};
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === FRONT_MATTER_DELIMITER) {
      return {
        fields,
        fieldLines,
        body: lines.slice(index + 1).join('\n'),
        bodyStartLine: index + 2,
        present: true,
      };
    }
    const separator = lines[index].indexOf(':');
    if (separator > 0) {
      const key = lines[index].slice(0, separator).trim();
      fields[key] = lines[index].slice(separator + 1).trim();
      fieldLines[key] = index + 1;
    }
  }

  return { fields, fieldLines, body: String(content), bodyStartLine: 1, present: false };
}

/**
 * Replaces the contents of fenced code blocks with blank lines, preserving line numbering.
 *
 * Word counts, banned-word checks, and figure checks all need to ignore code and mermaid blocks:
 * a mermaid diagram is not prose, and a source excerpt legitimately contains numbers that are
 * not measured figures. Blanking rather than deleting keeps every later line number correct.
 */
function stripCodeFences(text) {
  logTrace('stripCodeFences');
  let inside = false;
  return String(text)
    .split(/\r?\n/)
    .map((line) => {
      if (CODE_FENCE_PATTERN.test(line)) {
        inside = !inside;
        return '';
      }
      return inside ? '' : line;
    })
    .join('\n');
}

/**
 * Replaces placeholder blockquotes with blank lines, preserving line numbering.
 *
 * A placeholder's `Needed:` and `Prose slot:` fields describe numbers that do not exist yet, so
 * they must not be checked against the measured figures. Only lines belonging to a placeholder
 * block are removed: the block runs from its `**[KIND: slug]**` opener to the first line that is
 * not a blockquote continuation.
 */
function stripPlaceholderBlocks(text) {
  logTrace('stripPlaceholderBlocks');
  let inside = false;
  return String(text)
    .split(/\r?\n/)
    .map((line) => {
      if (PLACEHOLDER_PATTERN.test(line)) {
        inside = true;
        return '';
      }
      if (inside) {
        if (line.trimStart().startsWith('>')) return '';
        inside = false;
      }
      return line;
    })
    .join('\n');
}

/**
 * Named H2 headings that bound a draft region. Body section titles are also H2 after
 * promotion, so the parser splits only on these names rather than on every level-two line.
 */
const STRUCTURAL_HEADINGS = Object.freeze([
  'Substack (Canonical)',
  'LinkedIn (Native)',
  'Cross-Post Hooks',
  'Outline',
  'Blockers',
  'Notes for the Writer',
  'Corrections That Apply Here',
]);

/**
 * Extracts the named regions of a draft body, keyed by heading text.
 *
 * Used to find the Substack, LinkedIn, and cross-post sections without assuming they appear in
 * any particular order. A body with no structural headings yields an empty map, and the checker
 * reports the missing required sections.
 */
function extractSections(body, bodyStartLine = 1) {
  logTrace('extractSections');
  const sections = {};
  let current = null;
  let inFence = false;

  String(body)
    .split(/\r?\n/)
    .forEach((line, offset) => {
      if (CODE_FENCE_PATTERN.test(line)) inFence = !inFence;
      const heading = inFence ? null : /^##\s+(.+?)\s*$/.exec(line);
      if (heading && STRUCTURAL_HEADINGS.includes(heading[1])) {
        current = heading[1];
        sections[current] = { heading: current, line: bodyStartLine + offset, lines: [] };
        return;
      }
      if (current !== null) sections[current].lines.push(line);
    });

  for (const section of Object.values(sections)) {
    section.text = section.lines.join('\n');
  }
  return sections;
}

/**
 * Counts prose words, ignoring code blocks, placeholder blocks, markdown table rows, and
 * blockquotes.
 *
 * Tables and placeholders are apparatus rather than prose, and counting them inflates a draft
 * past its target without the reader gaining a sentence. The result is therefore always somewhat
 * lower than a naive word count, which is the intent: the band applies to writing.
 */
function countWords(text) {
  logTrace('countWords');
  const prose = stripPlaceholderBlocks(stripCodeFences(text))
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed === '') return false;
      if (trimmed.startsWith('>')) return false;
      if (trimmed.startsWith('|')) return false;
      if (trimmed.startsWith('<!--')) return false;
      return true;
    })
    .join(' ');

  const words = prose.match(/[A-Za-z0-9][A-Za-z0-9'’\-/.]*/g);
  return words === null ? 0 : words.length;
}

/**
 * Counts characters the way a social platform would: rendered text, not markdown source.
 *
 * Strips emphasis markers, heading marks, and link syntax so a draft is not judged over the
 * character limit because of formatting the platform will not display.
 */
function countRenderedCharacters(text) {
  logTrace('countRenderedCharacters');
  const rendered = stripCodeFences(text)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#]/g, '')
    .replace(/^>\s?/gm, '')
    .trim();
  return rendered.length;
}

/**
 * Finds every media placeholder in a body, with its kind, slug, and line number.
 *
 * The checker uses this for both directions of the manifest correspondence: unknown slugs in a
 * draft, and manifest rows no draft references.
 */
function extractPlaceholders(body, bodyStartLine = 1) {
  logTrace('extractPlaceholders');
  const found = [];
  String(body)
    .split(/\r?\n/)
    .forEach((line, offset) => {
      const match = PLACEHOLDER_PATTERN.exec(line);
      if (match !== null) {
        found.push({ kind: match[1], slug: match[2].trim(), line: bodyStartLine + offset });
      }
    });
  return found;
}

/**
 * Finds numeric tokens in prose that look like they assert a measured quantity.
 *
 * Matches integers of three or more digits, comma-grouped numbers, decimals, and percentages,
 * which is where a wrong figure does real damage. Deliberately ignores one- and two-digit
 * numbers: they are overwhelmingly counts in sentences ("four formats," "two formats") and
 * flagging them would bury the findings that matter in noise.
 */
function extractNumberTokens(text, startLine = 1) {
  logTrace('extractNumberTokens');
  const tokens = [];
  const pattern = /\d[\d,]*(?:\.\d+)?%?/g;

  stripPlaceholderBlocks(stripCodeFences(text))
    .split(/\r?\n/)
    .forEach((rawLine, offset) => {
      // Inline code spans hold identifiers, patterns, and literals rather than claims about
      // quantity, so an example key such as `81283ffffffffff` is not a figure to source.
      const line = rawLine.replace(/`[^`]*`/g, '``');
      if (line.trim().startsWith('|')) return;
      for (const match of line.matchAll(pattern)) {
        // A sentence comma sits inside the digit-group class, so trim it before judging the token.
        const token = match[0].replace(/,+$/, '');
        const digits = token.replace(/[^\d]/g, '');
        const isSmallInteger = digits.length < 3 && !token.includes('.') && !token.includes('%');
        if (isSmallInteger) continue;
        tokens.push({ token, line: startLine + offset, context: rawLine.trim() });
      }
    });
  return tokens;
}

module.exports = {
  FRONT_MATTER_DELIMITER,
  REQUIRED_FRONT_MATTER_KEYS,
  ALLOWED_THREADS,
  PLACEHOLDER_PATTERN,
  STRUCTURAL_HEADINGS,
  parseFrontMatter,
  stripCodeFences,
  stripPlaceholderBlocks,
  extractSections,
  countWords,
  countRenderedCharacters,
  extractPlaceholders,
  extractNumberTokens,
};
