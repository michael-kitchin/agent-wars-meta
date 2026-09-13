'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { repoPath } = require('./lib/fileScan.cjs');
const { logDebug, logError } = require('./lib/harnessLogger.cjs');
const {
  REQUIRED_FRONT_MATTER_KEYS,
  ALLOWED_THREADS,
  parseFrontMatter,
  extractSections,
  countWords,
  countRenderedCharacters,
  extractPlaceholders,
  extractNumberTokens,
} = require('./lib/draftParsing.cjs');

/**
 * Audits blog drafts against the conventions in `.social/drafts/_conventions.md`.
 *
 * Usage:
 *   node .social/harness/checkDrafts.cjs                 (checks .social/drafts)
 *   node .social/harness/checkDrafts.cjs <directory>
 *
 * Exits non-zero when any error-severity finding exists. Warnings are printed and do not fail the
 * run, because a draft mid-revision is legitimately outside its word band.
 *
 * What this cannot do: it cannot tell whether a sentence is true. The figure check confirms that
 * a number resembles something the harness measured, not that the claim built around it is sound.
 * Treat a clean run as the floor, not as editorial approval.
 */

/** Default directory to audit. */
const DEFAULT_DRAFT_DIRECTORY = '.social/drafts';

/** Where measured figures come from. */
const METRICS_PATH = '.social/evidence/metrics.json';

/**
 * Prefix marking a file in the draft directory as a support document rather than a post.
 *
 * The draft directory holds both posts and the documents describing how to write them, and the
 * two obey different rules. Matching on the prefix rather than on a list of known filenames means
 * adding a support document cannot make the checker start auditing it as a malformed post.
 */
const SUPPORT_DOCUMENT_PREFIX = '_';

/** Section headings a finished draft must carry. */
const REQUIRED_SECTIONS = Object.freeze(['Substack (Canonical)', 'LinkedIn (Native)']);

/**
 * Section headings a stub must carry instead.
 *
 * A stub is a real deliverable rather than an empty file: it holds the editorial intent, the
 * corrections that apply to it, and the reason it cannot be written yet. Requiring these two
 * sections is what stops a stub from degrading into a title and a shrug.
 */
const REQUIRED_STUB_SECTIONS = Object.freeze(['Outline', 'Blockers']);

/** The `status` value marking a post as an outline rather than a finished draft. */
const STUB_STATUS = 'stub';

/** Heading for the optional channel-hook section. */
const CROSS_POST_SECTION = 'Cross-Post Hooks';

/** Posts the series plan gives no cross-post targets for; the section must be absent. */
const POSTS_WITHOUT_CROSS_POSTS = Object.freeze(['00', '17']);

/** Substack word band for a normal post, and the hard floor below which a draft fails. */
const WORD_BAND = Object.freeze({ low: 2300, high: 2600, floor: 1500 });

/** Post 0 is a hub rather than an essay and has its own band. */
const HUB_WORD_BAND = Object.freeze({ low: 500, high: 900, floor: 400 });

/** LinkedIn character band. */
const LINKEDIN_BAND = Object.freeze({ low: 1500, high: 3000 });

/** Relative tolerance when matching a written figure to a measured one. */
const FIGURE_TOLERANCE = 0.02;

/** Words and phrases the voice guide bans outright. */
const BANNED_PHRASES = Object.freeze([
  'delve',
  'tapestry',
  'testament',
  'realm',
  'robust',
  'seamless',
  'unlock',
  'elevate',
  'at the end of the day',
  'when it comes to',
  'needless to say',
  "it's worth noting",
  'it is worth noting',
  'in the realm of',
  'game-changer',
  'in conclusion',
  "let's dive in",
  'buckle up',
  'in the world of',
  'fast-paced',
  'revolutionary',
  'cutting-edge',
  "it's not just",
  'it is not just',
]);

/**
 * Words the voice guide bans only in their figurative sense.
 *
 * These are warnings rather than errors because each has a legitimate literal use in this
 * subject matter: a measurement harness, a leverage ratio, a code underscore, a terrain
 * landscape. The checker cannot tell the senses apart, so it points and a human decides.
 */
const CONTEXT_SENSITIVE_PHRASES = Object.freeze([
  'leverage',
  'leveraging',
  'underscore',
  'underscores',
  'harness',
  'harnessing',
  'landscape',
  'powerful',
]);

/** Patterns for numeric tokens that are never measured figures. */
const NON_FIGURE_TOKEN_PATTERNS = Object.freeze([
  /^(19|20)\d{2}$/, // calendar years
  /^\d{1,2}\.\d{1,2}(\.\d+)?$/, // milestone and version numbers, and small ratios
  /^\d{1,2}:\d{2}$/, // clock times
]);

/** Strings that must never appear in a draft. */
const LEAK_PATTERNS = Object.freeze([
  { label: 'API key prefix', pattern: /\bsk-[A-Za-z0-9]/ },
  { label: 'API key variable', pattern: /OPENROUTER_API_KEY/ },
  { label: 'bearer token', pattern: /Bearer\s+[A-Za-z0-9._-]{8}/ },
  { label: 'email address', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { label: 'Windows user-profile path', pattern: /[A-Za-z]:\\Users\\/i },
  { label: 'POSIX user-profile path', pattern: /\/(?:home|Users)\/[A-Za-z0-9._-]+\// },
]);

/**
 * Records one finding. Severity `error` fails the run; `warning` is advisory.
 */
function addFinding(findings, severity, file, line, message) {
  findings.push({ severity, file, line, message });
}

/**
 * Collects every numeric value reachable in the metrics document.
 *
 * Walks the whole structure rather than only the top level of each figure, because measured
 * values include nested maps such as hours per milestone and arrays such as the largest
 * documents, and a draft may legitimately quote any of them.
 */
function collectMeasuredNumbers(node, into = new Set()) {
  if (typeof node === 'number' && Number.isFinite(node)) {
    into.add(node);
    return into;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectMeasuredNumbers(item, into);
    return into;
  }
  if (node !== null && typeof node === 'object') {
    for (const value of Object.values(node)) collectMeasuredNumbers(value, into);
  }
  return into;
}

/**
 * Decides whether a written token plausibly refers to a measured value.
 *
 * Accepts an exact match, a rounding within the tolerance, and a thousands-scaled form so prose
 * saying "136 K lines" matches a measured 136,391. Percent signs are dropped before comparison
 * because a share written as `54%` and measured as `53.6` are the same claim.
 */
function matchesMeasuredNumber(token, measured) {
  const numeric = Number(token.replace(/[,%]/g, ''));
  if (!Number.isFinite(numeric)) return true;

  const candidates = [numeric, numeric * 1000];
  for (const candidate of candidates) {
    for (const value of measured) {
      const scale = Math.max(1, Math.abs(value));
      if (Math.abs(candidate - value) / scale <= FIGURE_TOLERANCE) return true;
    }
  }
  return false;
}

/**
 * Reads the manifest and returns its slug set.
 *
 * Slugs are taken from the leading cell of every table row that looks like a slug, which keeps
 * the manifest human-editable rather than forcing it into a machine format.
 */
function readManifestSlugs(directory) {
  logDebug('readManifestSlugs', directory);
  const manifestPath = path.join(directory, '_media-manifest.md');
  if (!fs.existsSync(manifestPath)) return null;

  const slugs = new Set();
  for (const line of fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/)) {
    const match = /^\|\s*`([a-z0-9]+-[a-z0-9-]+)`\s*\|/.exec(line);
    if (match !== null) slugs.add(match[1]);
  }
  return slugs;
}

/**
 * Returns the post identifier from a `post:` front-matter value, or null.
 *
 * Accepts both the numbered form (`04 of 17`) and Post 0's documented hub form.
 */
function readPostIdentifier(value) {
  if (typeof value !== 'string') return null;
  const numbered = /^(\d{2})\s+of\s+17$/.exec(value.trim());
  if (numbered !== null) return numbered[1];
  return /^00\s*\(Start Here hub\)$/.test(value.trim()) ? '00' : null;
}

/**
 * Checks front matter: presence, required keys, thread membership, and the `post` form.
 */
function checkFrontMatter(file, parsed, findings) {
  logDebug('checkFrontMatter', file);
  if (!parsed.present) {
    addFinding(findings, 'error', file, 1, 'No front matter. Every draft opens with a --- block.');
    return null;
  }

  for (const key of REQUIRED_FRONT_MATTER_KEYS) {
    if (!(key in parsed.fields)) {
      addFinding(findings, 'error', file, 1, `Front matter is missing the ${key} key.`);
    }
  }

  const thread = parsed.fields.thread;
  if (thread !== undefined && !ALLOWED_THREADS.includes(thread)) {
    addFinding(
      findings,
      'error',
      file,
      parsed.fieldLines.thread ?? 1,
      `Thread "${thread}" is not one of the four: ${ALLOWED_THREADS.join(', ')}.`,
    );
  }

  const identifier = readPostIdentifier(parsed.fields.post);
  if (identifier === null) {
    addFinding(
      findings,
      'error',
      file,
      parsed.fieldLines.post ?? 1,
      `post: "${parsed.fields.post}" must read "NN of 17" (Post 0 may use "00 (Start Here hub)").`,
    );
  }
  return identifier;
}

/**
 * Checks that the required sections exist and that the cross-post section matches the plan.
 *
 * An empty cross-post section on a post with no targets reads as an oversight, so its absence is
 * required rather than merely allowed.
 */
function checkSections(file, sections, identifier, isStub, findings) {
  logDebug('checkSections', file);
  for (const heading of isStub ? REQUIRED_STUB_SECTIONS : REQUIRED_SECTIONS) {
    if (!(heading in sections)) {
      addFinding(findings, 'error', file, 1, `Missing required section "## ${heading}".`);
    }
  }

  if (isStub) return;

  const hasCrossPost = CROSS_POST_SECTION in sections;
  const shouldOmit = identifier !== null && POSTS_WITHOUT_CROSS_POSTS.includes(identifier);
  if (hasCrossPost && shouldOmit) {
    addFinding(
      findings,
      'error',
      file,
      sections[CROSS_POST_SECTION].line,
      'This post has no cross-post targets; omit the section rather than stubbing it.',
    );
  }
}

/**
 * Checks the Substack word count and the LinkedIn character count against their bands.
 *
 * Falling below the hard floor is an error because a short post fails the series' own contract;
 * being outside the target band without breaching the floor is a warning, since that is the
 * normal state of a draft being revised.
 */
function checkLengths(file, sections, identifier, findings) {
  logDebug('checkLengths', file);
  const substack = sections['Substack (Canonical)'];
  if (substack !== undefined) {
    const band = identifier === '00' ? HUB_WORD_BAND : WORD_BAND;
    const words = countWords(substack.text);
    if (words < band.floor) {
      addFinding(
        findings,
        'error',
        file,
        substack.line,
        `Substack section is ${words} prose words, below the ${band.floor}-word floor.`,
      );
    } else if (words < band.low || words > band.high) {
      addFinding(
        findings,
        'warning',
        file,
        substack.line,
        `Substack section is ${words} prose words, outside the ${band.low}-${band.high} target.`,
      );
    }
  }

  const linkedin = sections['LinkedIn (Native)'];
  if (linkedin !== undefined) {
    const characters = countRenderedCharacters(linkedin.text);
    if (characters < LINKEDIN_BAND.low || characters > LINKEDIN_BAND.high) {
      addFinding(
        findings,
        'error',
        file,
        linkedin.line,
        `LinkedIn section renders to ${characters} characters, outside ${LINKEDIN_BAND.low}-${LINKEDIN_BAND.high}.`,
      );
    }
  }
}

/**
 * Checks banned phrases and leak patterns line by line.
 *
 * Banned phrases are matched case-insensitively on word boundaries so that "realm" is caught
 * while a legitimate compound containing it is not mangled.
 */
function checkProhibitedText(file, content, findings) {
  logDebug('checkProhibitedText', file);
  content.split(/\r?\n/).forEach((line, offset) => {
    const lower = line.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      const boundary = new RegExp(`(^|[^a-z])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`);
      if (boundary.test(lower)) {
        addFinding(findings, 'error', file, offset + 1, `Banned phrase "${phrase}".`);
      }
    }
    for (const phrase of CONTEXT_SENSITIVE_PHRASES) {
      if (new RegExp(`(^|[^a-z])${phrase}([^a-z]|$)`).test(lower)) {
        addFinding(
          findings,
          'warning',
          file,
          offset + 1,
          `"${phrase}" is banned in its figurative sense. Confirm this use is literal.`,
        );
      }
    }
    for (const leak of LEAK_PATTERNS) {
      if (leak.pattern.test(line)) {
        addFinding(findings, 'error', file, offset + 1, `Possible ${leak.label} in a draft.`);
      }
    }
  });
}

/**
 * Checks that every placeholder slug exists in the manifest and records the slugs a draft uses.
 */
function checkPlaceholders(file, body, bodyStartLine, manifestSlugs, usedSlugs, findings) {
  logDebug('checkPlaceholders', file);
  for (const placeholder of extractPlaceholders(body, bodyStartLine)) {
    usedSlugs.add(placeholder.slug);
    if (manifestSlugs !== null && !manifestSlugs.has(placeholder.slug)) {
      addFinding(
        findings,
        'error',
        file,
        placeholder.line,
        `Placeholder slug "${placeholder.slug}" has no row in _media-manifest.md.`,
      );
    }
  }
}

/**
 * Checks that every substantial number in prose resembles a measured figure.
 *
 * Tokens matching a non-figure pattern are skipped. Everything else must fall within tolerance of
 * something in `metrics.json`; anything that does not is reported as an error, since an
 * unsourced number is the failure this whole apparatus exists to prevent.
 */
function checkFigures(file, body, bodyStartLine, measured, findings) {
  logDebug('checkFigures', file);
  for (const token of extractNumberTokens(body, bodyStartLine)) {
    if (NON_FIGURE_TOKEN_PATTERNS.some((pattern) => pattern.test(token.token))) continue;
    if (matchesMeasuredNumber(token.token, measured)) continue;
    addFinding(
      findings,
      'error',
      file,
      token.line,
      `Figure "${token.token}" does not match anything measured. Source it or make it a placeholder.`,
    );
  }
}

/**
 * Audits one draft file.
 */
function checkDraftFile(filePath, relativeName, measured, manifestSlugs, usedSlugs, findings) {
  logDebug('checkDraftFile', relativeName);
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontMatter(content);
  const identifier = checkFrontMatter(relativeName, parsed, findings);
  const sections = extractSections(parsed.body, parsed.bodyStartLine);
  const isStub = parsed.fields.status === STUB_STATUS;

  checkSections(relativeName, sections, identifier, isStub, findings);
  // Length bands describe finished writing, so they do not apply to an outline.
  if (!isStub) checkLengths(relativeName, sections, identifier, findings);
  checkProhibitedText(relativeName, content, findings);
  checkPlaceholders(relativeName, parsed.body, parsed.bodyStartLine, manifestSlugs, usedSlugs, findings);
  checkFigures(relativeName, parsed.body, parsed.bodyStartLine, measured, findings);
  return isStub;
}

/**
 * Audits every post in a directory and returns the findings.
 *
 * Support documents are skipped: they describe the conventions rather than obeying them. A
 * missing metrics file is reported once and figure checking is then skipped, so the structural
 * checks still run.
 */
function checkDrafts(directory) {
  logDebug('checkDrafts', directory);
  const findings = [];
  const absolute = path.isAbsolute(directory) ? directory : repoPath(directory);

  if (!fs.existsSync(absolute)) {
    addFinding(findings, 'error', directory, 1, 'Draft directory does not exist.');
    return { findings, fileCount: 0 };
  }

  let measured = new Set();
  const metricsFile = repoPath(METRICS_PATH);
  if (fs.existsSync(metricsFile)) {
    measured = collectMeasuredNumbers(JSON.parse(fs.readFileSync(metricsFile, 'utf8')));
  } else {
    addFinding(
      findings,
      'warning',
      METRICS_PATH,
      1,
      'Metrics file absent; skipping figure checks. Run runAllMeasurements.cjs first.',
    );
  }

  const manifestSlugs = readManifestSlugs(absolute);
  if (manifestSlugs === null) {
    addFinding(findings, 'error', directory, 1, 'No _media-manifest.md; placeholder slugs cannot be checked.');
  }

  const usedSlugs = new Set();
  const files = fs
    .readdirSync(absolute)
    .filter((name) => name.endsWith('.md') && !name.startsWith(SUPPORT_DOCUMENT_PREFIX))
    .sort();

  let stubCount = 0;
  for (const name of files) {
    const isStub = checkDraftFile(
      path.join(absolute, name),
      name,
      measured,
      manifestSlugs,
      usedSlugs,
      findings,
    );
    if (isStub) stubCount += 1;
  }

  if (manifestSlugs !== null) {
    for (const slug of [...manifestSlugs].sort()) {
      if (!usedSlugs.has(slug)) {
        addFinding(
          findings,
          'warning',
          '_media-manifest.md',
          1,
          `Slug "${slug}" is in the manifest but no drafted post references it.`,
        );
      }
    }
  }

  return { findings, fileCount: files.length, stubCount };
}

/**
 * Prints findings grouped by file and exits non-zero if any are errors.
 */
function main() {
  const directory = process.argv[2] ?? DEFAULT_DRAFT_DIRECTORY;
  let result;
  try {
    result = checkDrafts(directory);
  } catch (error) {
    logError('checkDrafts failed', error.message);
    process.stderr.write(`checkDrafts: ${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const { findings, fileCount, stubCount } = result;
  const errors = findings.filter((finding) => finding.severity === 'error');
  const warnings = findings.filter((finding) => finding.severity === 'warning');

  const byFile = new Map();
  for (const finding of findings) {
    if (!byFile.has(finding.file)) byFile.set(finding.file, []);
    byFile.get(finding.file).push(finding);
  }

  for (const [file, group] of [...byFile.entries()].sort()) {
    process.stdout.write(`\n${file}\n`);
    for (const finding of group.sort((a, b) => a.line - b.line)) {
      process.stdout.write(`  ${finding.severity === 'error' ? 'ERROR' : ' warn'} ${String(finding.line).padStart(4)}  ${finding.message}\n`);
    }
  }

  process.stdout.write(
    `\nchecked ${fileCount} post(s), ${stubCount} of them stubs: ` +
      `${errors.length} error(s), ${warnings.length} warning(s)\n`,
  );
  if (errors.length > 0) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_DRAFT_DIRECTORY,
  WORD_BAND,
  HUB_WORD_BAND,
  LINKEDIN_BAND,
  REQUIRED_STUB_SECTIONS,
  STUB_STATUS,
  BANNED_PHRASES,
  CONTEXT_SENSITIVE_PHRASES,
  collectMeasuredNumbers,
  matchesMeasuredNumber,
  readManifestSlugs,
  readPostIdentifier,
  checkDrafts,
};
