/**
 * @import MarkdownIt from 'markdown-it'
 */

/**
 * Structural wrappers for rich markdown content.
 *
 * Four render-rule overrides apply newsdoc-style semantic containers without
 * touching source markdown or adding dependencies:
 *
 *   - fence        -> `<div class="code-block">` around `<pre><code>` fences
 *   - table_open   -> `<div class="table-wrapper">` around tables
 *   - image        -> `<figure><figcaption>` for images with a title attribute
 *   - html_block   -> `<div class="video-embed">` around bare `<iframe>` blocks
 *
 * Wrappers are purely additive: every unstyled element still renders exactly
 * as the default would, so older published posts don't need any edits.
 *
 * @param {MarkdownIt} md
 * @returns {Promise<MarkdownIt>}
 */
export default async function markdownItSettingsOverride (md) {
  wrapFence(md);
  wrapTable(md);
  wrapFiguredImage(md);
  wrapBareIframe(md);
  return md;
}

/**
 * Wrap fenced code blocks in `<div class="code-block">` for horizontal-scroll
 * and theming hooks without relying on `.e-content pre` descendant selectors.
 *
 * @param {MarkdownIt} md
 */
function wrapFence (md) {
  const defaultFence = md.renderer.rules.fence ?? ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const inner = defaultFence(tokens, idx, options, env, self);
    return `<div class="code-block">${inner}</div>\n`;
  };
}

/**
 * Wrap tables in `<div class="table-wrapper">` so wide tables get an
 * independent horizontal scroll region instead of overflowing the article.
 *
 * @param {MarkdownIt} md
 */
function wrapTable (md) {
  const defaultTableOpen = md.renderer.rules.table_open ?? ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));
  const defaultTableClose = md.renderer.rules.table_close ?? ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    return `<div class="table-wrapper">${defaultTableOpen(tokens, idx, options, env, self)}`;
  };

  md.renderer.rules.table_close = (tokens, idx, options, env, self) => {
    return `${defaultTableClose(tokens, idx, options, env, self)}</div>`;
  };
}

/**
 * Promote titled images (`![alt](url "title")`) to `<figure>/<figcaption>`.
 * Untitled images stay as bare `<img>` — authors opt into a caption by
 * adding a title, matching how markdown's built-in `title` attribute reads.
 *
 * @param {MarkdownIt} md
 */
function wrapFiguredImage (md) {
  const defaultImage = md.renderer.rules.image ?? ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (!token) return defaultImage(tokens, idx, options, env, self);

    const titleAttr = token.attrGet('title');
    const imgHtml = defaultImage(tokens, idx, options, env, self);

    if (!titleAttr) return imgHtml;

    const caption = md.utils.escapeHtml(titleAttr);
    return `<figure>${imgHtml}<figcaption>${caption}</figcaption></figure>`;
  };
}

/**
 * Wrap bare `<iframe>` HTML blocks in `<div class="video-embed">` so the
 * CSS `aspect-ratio: 16/9` wrapper can constrain the embed's size without
 * every post needing boilerplate markup.
 *
 * Other html_block tokens (including any existing author-written wrappers)
 * pass through unchanged.
 *
 * @param {MarkdownIt} md
 */
function wrapBareIframe (md) {
  const defaultHtmlBlock = md.renderer.rules.html_block ?? ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

  md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const raw = token?.content ?? '';
    const trimmed = raw.trim();

    // Only wrap blocks that start with a bare <iframe> and nothing else.
    // `/is` keeps it tolerant of line breaks inside the iframe attributes.
    if (/^<iframe\b[^>]*>\s*(?:<\/iframe>\s*)?$/i.test(trimmed)) {
      return `<div class="video-embed">${raw}</div>\n`;
    }

    return defaultHtmlBlock(tokens, idx, options, env, self);
  };
}
