/**
 * Dark-mode sync test.
 *
 * src/global.css has two dark-mode blocks that MUST stay in sync:
 *   1. \@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ... } }
 *      — OS auto-follow when JS has not set data-theme
 *   2. [data-theme="dark"] { ... }
 *      — explicit user override
 *
 * Both must declare identical custom-property values. This duplication is
 * structural (distinct cascade semantics, cannot be collapsed via nesting).
 * A future palette revision that updates one block but not the other would
 * cause silent drift between OS-mode dark users and explicit-toggle users.
 * This test catches that drift.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const EXPECTED_DECLARATION_COUNT = 21;

/**
 * Normalize a CSS block body: strip comments, trim each line, drop blanks.
 *
 * @param {string} body
 * @returns {string[]}
 */
function normalize (body) {
  return body
    .replaceAll(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Extract the content (between { and matching }) starting at a given index.
 *
 * @param {string} source
 * @param {number} openBraceIndex
 * @returns {{ body: string, endIndex: number }}
 */
function extractBraceBody (source, openBraceIndex) {
  let depth = 0;
  let start = -1;
  for (let i = openBraceIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { body: source.slice(start, i), endIndex: i };
      }
    }
  }
  throw new Error('Unbalanced braces in CSS source');
}

test('dark-mode blocks in global.css stay in sync', async () => {
  const css = await readFile('src/global.css', 'utf8');

  // Find the @media (prefers-color-scheme: dark) { :root:not([data-theme]) { ... } } block.
  const mediaMatch = css.match(/@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{\s*:root:not\(\[data-theme\]\)\s*\{/);
  assert.ok(mediaMatch, 'could not locate @media (prefers-color-scheme: dark) :root:not([data-theme]) block');
  const mediaInnerOpen = /** @type {number} */ (mediaMatch.index) + mediaMatch[0].length - 1;
  const mediaExtract = extractBraceBody(css, mediaInnerOpen);

  // Find the [data-theme="dark"] { ... } block (non-.sidebar form).
  const attrMatch = css.match(/\[data-theme="dark"\]\s*\{/);
  assert.ok(attrMatch, 'could not locate [data-theme="dark"] block');
  const attrOpenIndex = /** @type {number} */ (attrMatch.index) + attrMatch[0].length - 1;
  const attrExtract = extractBraceBody(css, attrOpenIndex);

  const mediaLines = normalize(mediaExtract.body);
  const attrLines = normalize(attrExtract.body);

  // Find the first divergence and report it clearly.
  const maxLen = Math.max(mediaLines.length, attrLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (mediaLines[i] !== attrLines[i]) {
      assert.fail(
        `Dark-mode blocks diverge at line ${i + 1}:\n` +
        `  @media branch: ${JSON.stringify(mediaLines[i])}\n` +
        `  [data-theme]:  ${JSON.stringify(attrLines[i])}\n` +
        'Both blocks must declare identical values. Update both together.'
      );
    }
  }

  assert.equal(
    mediaLines.length,
    attrLines.length,
    `Dark-mode blocks have different line counts (${mediaLines.length} vs ${attrLines.length})`
  );

  // Also assert the declaration count is stable. Count lines ending with ';'
  // that contain a ':' (i.e. CSS declarations — includes both --custom-props
  // and bare declarations like `color-scheme: dark;`).
  const declCount = mediaLines.filter(line => line.endsWith(';') && line.includes(':')).length;
  assert.equal(
    declCount,
    EXPECTED_DECLARATION_COUNT,
    `Dark-mode block declaration count drifted: expected ${EXPECTED_DECLARATION_COUNT}, got ${declCount}. ` +
    'If this is intentional, update EXPECTED_DECLARATION_COUNT in test/dark-mode-sync.spec.js.'
  );
});
