'use strict';

const fs = require('fs');
const path = require('path');
const { logDebug, logTrace, logError } = require('./harnessLogger.cjs');

/**
 * Builds and writes the harness's two outputs: a machine-readable metrics file and a
 * human-readable snapshot organised for the people writing the posts.
 *
 * Every figure carries its provenance rather than travelling as a bare number. That is
 * the whole point of the harness: a draft should never contain a figure whose origin and
 * freshness cannot be established, and a figure that grows with development should be
 * visibly marked so nobody quotes it as permanent.
 */

/** Marks a figure that will not change unless the thing it measures changes. */
const STABILITY_STABLE = 'stable';

/** Marks a figure that grows with ordinary development and needs re-checking at publish. */
const STABILITY_VOLATILE = 'volatile';

/**
 * Wraps a measured value with its provenance.
 *
 * Use this for every figure a draft could quote. `source` should name the artifact or
 * symbol the number came from concretely enough to re-derive it — a path, a constant
 * name, a command — rather than a vague category.
 */
function figure(value, source, stability = STABILITY_STABLE) {
  logTrace('figure', () => ({ value, source, stability }));
  return {
    value,
    source,
    stability,
    measuredAt: new Date().toISOString(),
  };
}

/**
 * Convenience wrapper for a figure that grows with development. Reads better at call
 * sites than passing the stability constant positionally.
 */
function volatileFigure(value, source) {
  return figure(value, source, STABILITY_VOLATILE);
}

/**
 * Rounds to a fixed number of decimals and returns a number rather than a string.
 *
 * Derived ratios are computed from measured operands and then rounded here, never
 * transcribed. Returning a number keeps the JSON output usable by other tools.
 */
function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Ensures the directory for `filePath` exists.
 *
 * Creates only; this module never removes anything. `.social/evidence/` holds
 * hand-written documents alongside generated ones, and a cleaning step there would
 * destroy authored work.
 */
function ensureDirectory(filePath) {
  const directory = path.dirname(filePath);
  logTrace('ensureDirectory', directory);
  fs.mkdirSync(directory, { recursive: true });
}

/**
 * Writes the merged metrics object as formatted JSON.
 *
 * Formatted rather than minified because the file is read by humans during drafting and
 * diffed between runs to see what moved.
 */
function writeMetricsJson(metrics, filePath) {
  logDebug('writeMetricsJson', filePath);
  try {
    ensureDirectory(filePath);
    fs.writeFileSync(filePath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  } catch (error) {
    logError('writeMetricsJson failed', { path: filePath, message: error.message });
    throw error;
  }
}

/**
 * True when `value` can sit in a snapshot cell without flattening.
 *
 * Used to choose comma versus semicolon joining for arrays: a list of tool names should
 * stay comma-separated, while a list of ranked-hour objects has to flatten each item.
 */
function isPrimitiveSnapshotValue(value) {
  return value === null || ['number', 'string', 'boolean'].includes(typeof value);
}

/**
 * Escapes pipe characters so a rendered value cannot break a markdown table cell.
 *
 * Snapshot rows are pipe-delimited; an unescaped pipe in a subject line or method note
 * would add a phantom column. Called on every leaf so nested flattening cannot skip it.
 */
function escapePipes(text) {
  return String(text).replace(/\|/g, '\\|');
}

/**
 * Formats a value for the markdown snapshot.
 *
 * A table cell must be a single line. Structured values (arrays of objects, nested maps)
 * are flattened rather than coerced, because default coercion put `[object Object]` into
 * published evidence. Hour-named keys round to one decimal so ranked hours stay readable;
 * other numbers keep thousands separators. Pipes are escaped. `key` is the enclosing
 * property name when flattening an object, and is omitted at the top-level call.
 */
function formatSnapshotValue(value, key) {
  logTrace('formatSnapshotValue', () => ({ type: typeof value, key }));
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    const rendered = typeof key === 'string' && /hour/i.test(key) ? round(value, 1) : value;
    return escapePipes(rendered.toLocaleString('en-US'));
  }
  if (typeof value === 'boolean' || typeof value === 'string') return escapePipes(String(value));
  if (Array.isArray(value)) {
    const separator = value.every(isPrimitiveSnapshotValue) ? ', ' : '; ';
    return value.map((item) => formatSnapshotValue(item, key)).join(separator);
  }
  if (typeof value === 'object') {
    return Object.keys(value)
      .map((childKey) => `${childKey} ${formatSnapshotValue(value[childKey], childKey)}`)
      .join(' ');
  }
  return escapePipes(String(value));
}

/**
 * Renders one snapshot section as a markdown table.
 *
 * Volatile rows are marked in their own column rather than by a footnote, so a writer
 * scanning for a number sees its stability at the same moment they see its value.
 */
function renderSnapshotSection(section) {
  logTrace('renderSnapshotSection', section.heading);
  const lines = [`## ${section.heading}`, ''];
  if (section.intro) {
    lines.push(section.intro, '');
  }
  if (section.rows.length === 0) {
    lines.push('No figures measured for this section.', '');
    return lines;
  }
  lines.push('| Figure | Value | Source | Stability |', '|---|---|---|---|');
  for (const row of section.rows) {
    const stability = row.stability === STABILITY_VOLATILE ? '**volatile**' : 'stable';
    lines.push(
      `| ${row.label} | ${formatSnapshotValue(row.value)} | ${row.source} | ${stability} |`,
    );
  }
  lines.push('');
  return lines;
}

/**
 * Writes the post-oriented snapshot.
 *
 * `model` carries a `generatedAt` stamp, an optional `intro`, an optional list of
 * `failures`, and `sections` each holding a heading and rows. Sections are ordered by
 * consuming post rather than by measurement module, because a writer working on one post
 * needs to see exactly the figures available to them and nothing else.
 */
function writeSnapshotMarkdown(model, filePath) {
  logDebug('writeSnapshotMarkdown', () => ({ path: filePath, sections: model.sections.length }));
  try {
    ensureDirectory(filePath);
    const lines = ['# Measurement Snapshot', ''];
    lines.push(
      `Generated ${model.generatedAt} by \`.social/harness/runAllMeasurements.cjs\`. Do not hand-edit.`,
      '',
    );
    if (model.intro) lines.push(model.intro, '');
    if (model.failures && model.failures.length > 0) {
      lines.push('## Failed measurements', '');
      lines.push(
        'These sections did not produce figures. Any draft depending on them must use a placeholder.',
        '',
      );
      for (const failure of model.failures) {
        lines.push(`- **${failure.section}**: ${failure.message}`);
      }
      lines.push('');
    }
    for (const section of model.sections) {
      lines.push(...renderSnapshotSection(section));
    }
    fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
  } catch (error) {
    logError('writeSnapshotMarkdown failed', { path: filePath, message: error.message });
    throw error;
  }
}

module.exports = {
  STABILITY_STABLE,
  STABILITY_VOLATILE,
  figure,
  volatileFigure,
  round,
  ensureDirectory,
  writeMetricsJson,
  formatSnapshotValue,
  renderSnapshotSection,
  writeSnapshotMarkdown,
};
