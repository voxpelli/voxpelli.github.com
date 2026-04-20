/** @import { PostVars, TilPostVars } from './render-post.js' */

import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { PostTags } from './components/post-metadata.js';
import { extractExcerpt } from './excerpt.js';
import { renderPostContent } from './render-post-content.js';
import { safeHref, safePostUrl } from './safe-url.js';
import { slugifyTopic } from './slugify-topic.js';
import { extractFullDomain, parseDateSafe } from './utils.js';

/**
 * Render a TIL (Today I Learned) post.
 *
 * TILs are short, date-stamped notes with a required title (distinguishing
 * them from IndieWeb-style notes). This dispatcher renders a compact summary
 * in listings and delegates to renderPostContent for standalone article pages.
 *
 * Listing variant surfaces:
 * - title (linked to permalink)
 * - date (dt-published)
 * - topic badge (optional)
 * - via-link (optional source citation, jvns-style)
 * - excerpt / first paragraphs of content
 * - tags
 *
 * @param {object} options
 * @param {PostVars} options.post - renderPost only dispatches here when category==='til', so post is narrowed to TilPostVars
 * @param {string} [options.content] - Rendered markdown content
 * @param {boolean} [options.standalone]
 * @param {boolean} [options.compact] - When true, suppress author attribution and webmention link (standalone only)
 * @param {boolean} [options.swedish]
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @param {string} [options.webmentionEndpoint]
 * @returns {string}
 */
export function renderTil ({ authorName, compact, content, nonenglish, post: rawPost, siteUrl, standalone, swedish, webmentionEndpoint }) {
  // renderTil is only reachable from the renderPost dispatcher's TIL branch,
  // so this cast is safe and removes the Record<string, unknown> bracket-access
  // escape hatch for topic/via. Narrowing by category check would also work but
  // cost a useless runtime branch on every render.
  const post = /** @type {TilPostVars} */ (rawPost);
  // Accept either `via:` (TIL soft citation) or `mf-bookmark-of` (release /
  // bookmark target). Release posts shipped in SWARM-13 use mf-bookmark-of to
  // point at the GitHub release URL; surfacing it as "via github.com" in the
  // compact card gives readers a direct source link without a dedicated
  // release-card variant.
  const bookmarkOf = Array.isArray(rawPost['mf-bookmark-of']) ? rawPost['mf-bookmark-of'] : undefined;
  const bookmarkOfFirst = typeof bookmarkOf?.[0] === 'string' ? bookmarkOf[0] : undefined;
  const via = post.via || bookmarkOfFirst;
  const viaSafe = via ? safePostUrl(via) : '';
  const topic = post.topic;

  if (standalone) {
    // Standalone article page: delegate to the generic renderPostContent (for
    // header, microformats, footer, webmention link), then prepend TIL-specific
    // affordances (topic badge, via citation) that aren't surfaced by the
    // generic renderer. article.layout.js routes TIL pages through renderPost,
    // which dispatches here.
    const body = renderPostContent({
      authorName,
      compact,
      content,
      nonenglish,
      post,
      siteUrl,
      standalone,
      swedish,
      webmentionEndpoint,
    });

    const tilMetaParts = [];
    if (topic) {
      tilMetaParts.push(renderToStringSync(html`
        <a class="til-topic" href=${`/til/topics/${slugifyTopic(topic)}/`}>${topic}</a>
      `));
    }
    if (via && viaSafe) {
      tilMetaParts.push(renderToStringSync(html`
        <p class="til-via">via <a class="u-bookmark-of" href=${viaSafe}>${extractFullDomain(via)}</a></p>
      `));
    }
    if (tilMetaParts.length === 0) return body;

    const tilMeta = `<div class="til-standalone-meta">${tilMetaParts.join('\n')}</div>`;
    // Inject TIL meta right after the opening <article ...> tag so it sits
    // above the content but inside the h-entry root.
    return body.replace(/(<article[^>]*>)/, `$1\n${tilMeta}`);
  }

  const dateObj = parseDateSafe(post.date);
  const isoDate = dateObj.toISOString();
  const isoDateShort = isoDate.slice(0, 10).replaceAll('-', '.');

  const postUrl = post.pageUrl || '';
  const safeUrl = safePostUrl(postUrl);

  const tags = Array.isArray(post.tags) ? post.tags : undefined;

  const lang = swedish ? 'sv' : (nonenglish ? /** @type {string} */ (post.lang) : false);

  const isRelease = rawPost.category === 'release';

  const excerptResult = content ? extractExcerpt(content) : undefined;
  const excerpt = excerptResult
    ? renderTilExcerpt(excerptResult, postUrl, isRelease ? { readMoreLabel: 'My full release notes' } : {})
    : { excerptHtml: '', readMoreHtml: '' };

  // Density pass: header row (pill + title), body (excerpt), footer rail
  // containing read-more + right-aligned meta (date + topic + via-domain +
  // tags) on the same row at desktop widths. Flex-wrap lets meta drop below
  // read-more at narrow widths. Footer links need position:relative +
  // z-index:1 so they escape the .post-title a::after card-cover-link overlay.
  return renderToStringSync(html`
    <article class=${isRelease ? 'h-entry til-card til-card--release' : 'h-entry til-card'} lang=${lang}>
        <div class="til-card-header">
          ${isRelease
            ? html`<a class="post-type-badge post-type-badge--release" href="/releases/">RELEASE</a>`
            : html`<a class="post-type-badge post-type-badge--til" href="/til/">TIL</a>`}
          <h3 class="post-title p-name"><a class="u-url u-uid" href=${safeUrl}>${post.title || ''}</a></h3>
        </div>
        <span class="p-category" hidden>til</span>
        ${rawHtml(excerpt.excerptHtml)}
        <div class="til-card-footer">
          ${rawHtml(excerpt.readMoreHtml)}
          <div class="til-card-meta">
            <relative-time><time class="dt-published" datetime=${isoDate}>${isoDateShort}</time></relative-time>
            ${topic ? html`<a class="til-topic" href=${`/til/topics/${slugifyTopic(topic)}/`}>${topic}</a>` : ''}
            ${via && viaSafe
              ? html`<a class="domain-badge u-bookmark-of" href=${viaSafe}>${extractFullDomain(via)}</a>`
              : ''}
            ${PostTags({ headingLang: false, swedish: swedish || false, tags })}
          </div>
        </div>
      </article>
  `);
}

/**
 * Render TIL excerpt HTML, split from the read-more link so callers can place
 * each piece independently (excerpt in card body, read-more in card footer).
 *
 * @param {import('./excerpt.js').ExcerptResult} result
 * @param {string} postUrl
 * @param {object} [options]
 * @param {string} [options.readMoreLabel] - Label for the read-more link (default: 'Read full TIL')
 * @returns {{ excerptHtml: string, readMoreHtml: string }}
 */
function renderTilExcerpt (result, postUrl, options = {}) {
  const { readMoreLabel = 'Read full TIL' } = options;
  const mfClass = result.truncated ? 'p-summary' : 'e-content';
  const fade = result.truncated
    ? '<div class="post-excerpt-fade" aria-hidden="true"></div>'
    : '';
  const href = safeHref(postUrl);
  const excerptHtml = `<div class="post-excerpt ${mfClass}">${result.html}${fade}</div>`;
  const readMoreHtml = result.truncated && href
    ? `<a class="post-read-more" href="${href}">${readMoreLabel} \u2192</a>`
    : '';
  return { excerptHtml, readMoreHtml };
}
