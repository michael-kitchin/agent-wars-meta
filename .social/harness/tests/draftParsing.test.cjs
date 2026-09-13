'use strict';

const {
  parseFrontMatter,
  stripCodeFences,
  stripPlaceholderBlocks,
  extractSections,
  countWords,
  countRenderedCharacters,
  extractPlaceholders,
  extractNumberTokens,
} = require('../lib/draftParsing.cjs');
const { readPostIdentifier, matchesMeasuredNumber } = require('../checkDrafts.cjs');

/**
 * Contract tests for draft parsing and the two figure-checking decisions.
 *
 * Covers the happy path for each parser plus the failure cases that would let a bad draft through
 * or block a good one. Formatting helpers and the printing path are not tested.
 */
module.exports = ({ test, assertEqual, assertDeepEqual }) => {
  const draft = [
    '---',
    'title: A Post',
    'post: 04 of 17',
    'thread: Agentic Development',
    '---',
    '# A Post',
    '',
    '## Substack (Canonical)',
    '',
    'One two three four five.',
    '',
    '> **[IMAGE: p04-corpus-growth]**',
    '> Capture: something',
    '',
    '## LinkedIn (Native)',
    '',
    'Short version.',
  ].join('\n');

  test('parseFrontMatter reads fields and locates the body', () => {
    const parsed = parseFrontMatter(draft);
    assertEqual(parsed.present, true);
    assertEqual(parsed.fields.post, '04 of 17');
    assertEqual(parsed.fields.thread, 'Agentic Development');
    assertEqual(parsed.fieldLines.post, 3);
    assertEqual(parsed.bodyStartLine, 6);
    assertEqual(parsed.body.startsWith('# A Post'), true);
  });

  test('parseFrontMatter reports absence instead of throwing', () => {
    const parsed = parseFrontMatter('# No front matter here\n');
    assertEqual(parsed.present, false);
    assertDeepEqual(parsed.fields, {});
    assertEqual(parsed.bodyStartLine, 1);
  });

  test('parseFrontMatter treats an unterminated block as absent', () => {
    const parsed = parseFrontMatter('---\ntitle: Broken\n# body\n');
    assertEqual(parsed.present, false);
  });

  test('extractSections keys sections by heading with real line numbers', () => {
    const parsed = parseFrontMatter(draft);
    const sections = extractSections(parsed.body, parsed.bodyStartLine);
    assertEqual(sections['Substack (Canonical)'].line, 8);
    assertEqual(sections['LinkedIn (Native)'].line, 15);
    assertEqual('Cross-Post Hooks' in sections, false);
  });

  test('extractSections ignores headings inside code fences', () => {
    const body = ['## Outline', '', '```markdown', '## Blockers', '```', '', 'text'].join('\n');
    const sections = extractSections(body);
    assertDeepEqual(Object.keys(sections), ['Outline']);
  });

  test('extractSections does not split Substack on a body heading', () => {
    const body = [
      '## Substack (Canonical)',
      '',
      '## The Controls',
      '',
      'prose here',
      '',
      '## LinkedIn (Native)',
      '',
      'short',
    ].join('\n');
    const sections = extractSections(body);
    assertEqual(sections['Substack (Canonical)'].text.includes('## The Controls'), true);
    assertEqual(sections['Substack (Canonical)'].text.includes('prose here'), true);
    assertEqual('The Controls' in sections, false);
  });

  test('stripCodeFences blanks fenced content but keeps line count', () => {
    const text = ['before', '```js', 'const a = 1;', '```', 'after'].join('\n');
    const stripped = stripCodeFences(text).split('\n');
    assertEqual(stripped.length, 5);
    assertEqual(stripped[2], '');
    assertEqual(stripped[4], 'after');
  });

  test('stripPlaceholderBlocks removes the whole block and stops at the first non-quote line', () => {
    const text = [
      'prose',
      '> **[DATA: p03-tokens-by-format]**',
      '> Needed: 12345 tokens',
      '',
      'more prose',
    ].join('\n');
    const stripped = stripPlaceholderBlocks(text).split('\n');
    assertEqual(stripped[1], '');
    assertEqual(stripped[2], '');
    assertEqual(stripped[4], 'more prose');
  });

  test('countWords excludes tables, blockquotes, and code', () => {
    const text = [
      'One two three.',
      '',
      '| a | b |',
      '|---|---|',
      '| 1 | 2 |',
      '',
      '> quoted line here',
      '',
      '```',
      'ignored code words',
      '```',
    ].join('\n');
    assertEqual(countWords(text), 3);
  });

  test('countRenderedCharacters ignores markdown syntax', () => {
    assertEqual(countRenderedCharacters('**bold** and `code`'), 'bold and code'.length);
  });

  test('extractPlaceholders returns kind, slug, and offset line', () => {
    const parsed = parseFrontMatter(draft);
    const found = extractPlaceholders(parsed.body, parsed.bodyStartLine);
    assertEqual(found.length, 1);
    assertEqual(found[0].kind, 'IMAGE');
    assertEqual(found[0].slug, 'p04-corpus-growth');
    assertEqual(found[0].line, 12);
  });

  test('extractNumberTokens skips small integers, tables, code spans, and placeholders', () => {
    const text = [
      'I logged 156 hours across 4 milestones.',
      'An identifier like `81283ffffffffff` is not a figure.',
      '| 99999 | row |',
      '> **[DATA: p03-tokens-by-format]**',
      '> Needed: 88888',
    ].join('\n');
    assertDeepEqual(
      extractNumberTokens(text).map((token) => token.token),
      ['156'],
    );
  });

  test('readPostIdentifier accepts both documented forms and rejects the old one', () => {
    assertEqual(readPostIdentifier('04 of 17'), '04');
    assertEqual(readPostIdentifier('00 (Start Here hub)'), '00');
    assertEqual(readPostIdentifier('04 of 12'), null);
    assertEqual(readPostIdentifier('support page'), null);
    assertEqual(readPostIdentifier(undefined), null);
  });

  test('matchesMeasuredNumber accepts roundings and thousands-scaled prose', () => {
    const measured = new Set([155.87, 136391, 53.6, 148496]);
    assertEqual(matchesMeasuredNumber('156', measured), true);
    assertEqual(matchesMeasuredNumber('136', measured), true);
    assertEqual(matchesMeasuredNumber('54%', measured), true);
    assertEqual(matchesMeasuredNumber('148,500', measured), true);
  });

  test('matchesMeasuredNumber rejects an invented figure', () => {
    const measured = new Set([155.87, 136391]);
    assertEqual(matchesMeasuredNumber('42,000', measured), false);
    assertEqual(matchesMeasuredNumber('1,200', measured), false);
  });
};
