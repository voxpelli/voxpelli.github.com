import { escapeXml } from './lib/escape.js';
import { getSiteVars } from './lib/get-site-vars.js';
import { renderRssEntry } from './lib/render-rss-entry.js';

/** @import { PageData } from './global-types.d.ts' */
/** @import { TemplateOutputOverride } from '@domstack/static' */

/**
 * Generate multiple Atom feeds using async generator pattern.
 *
 * Templates receive { vars, pages } where vars is global.vars only — but the
 * PageData.vars getter merges globalDataVars, so global.data.js collections
 * are reachable via pages[0].vars (the documented workaround; `@domstack/static`
 * PR #240, merged upstream but unreleased, passes them in template vars
 * directly). Consuming the shared collections keeps ONE executable definition
 * of every feed's membership (global.data.js + lib/categories.js): the
 * selectors were previously re-derived here "kept in sync by convention",
 * which is exactly how the til-superset rule grew three drifting copies. It
 * also reuses the content global.data.js already rendered instead of
 * re-rendering every feed post.
 *
 * @param {{ vars: Record<string, unknown>, pages: PageData[] }} options
 * @returns {AsyncIterable<TemplateOutputOverride>}
 */
export default async function * feedsTemplate ({ pages, vars }) {
  const { authorEmail, authorName, blogName, feedUidBase, pushHub, siteUrl } = getSiteVars(vars);
  const now = new Date().toISOString();

  const globalDataVars = pages[0]?.vars ?? {};

  /**
   * @param {string} key
   * @returns {Array<Record<string, unknown>>}
   */
  function collection (key) {
    const value = globalDataVars[key];
    if (!Array.isArray(value)) {
      // Loud, not lenient: a missing collection would otherwise ship a valid
      // but EMPTY feed — which readers treat as "everything was deleted".
      throw new TypeError(`feeds.template.js: global.data collection "${key}" not reachable via pages[0].vars`);
    }
    return value;
  }

  /**
   * @param {object} options
   * @param {string} options.selfUrl
   * @param {string} [options.htmlUrl]
   * @param {string} [options.feedId] - path for the feed-level <id>; defaults to
   *   selfUrl. RFC 4287 requires feed ids to be universally unique — deriving
   *   them from htmlUrl collided all.xml/english.xml/stream.xml on the same id.
   *   Like entry ids, a feed id is permanent once served: all.xml keeps its
   *   historical `/` explicitly; every other feed identifies as its self URL.
   * @param {string} [options.subtitle]
   * @param {Array<Record<string, unknown>>} options.posts
   * @returns {string}
   */
  function buildFeed ({ feedId, htmlUrl, posts, selfUrl, subtitle }) {
    const entries = posts.map(post => {
      // global.data.js pre-renders content onto every blog + til-superset
      // post — the members of every feed below.
      const html = typeof post.content === 'string' ? post.content : '';
      return renderRssEntry({ content: html, post, siteUrl, uidBase: feedUidBase });
    });

    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">

 <title>${escapeXml(blogName)}${subtitle ? ` \u2013 ${escapeXml(subtitle)}` : ''}</title>
 <link href="${escapeXml(siteUrl + selfUrl)}" rel="self" type="application/atom+xml" />
 ${pushHub ? `<link href="${escapeXml(pushHub)}" rel="hub" />` : ''}
 ${htmlUrl ? `<link href="${escapeXml(siteUrl + htmlUrl)}" type="text/html" />` : ''}
 <updated>${now}</updated>
 <id>${escapeXml(siteUrl + (feedId || selfUrl))}</id>
 <author>
   <name>${escapeXml(authorName)}</name>
   <email>${escapeXml(authorEmail)}</email>
 </author>

${entries.join('\n')}

</feed>`;
  }

  yield {
    outputName: 'all.xml',
    content: buildFeed({
      selfUrl: '/all.xml',
      htmlUrl: '/',
      // Historical exception: all.xml has identified as the site root since
      // the Jekyll era — keep it for subscriber continuity.
      feedId: '/',
      posts: collection('recentPosts'),
    }),
  };

  yield {
    outputName: 'english.xml',
    content: buildFeed({
      selfUrl: '/english.xml',
      htmlUrl: '/',
      subtitle: 'English posts',
      posts: collection('recentEnglishPosts'),
    }),
  };

  yield {
    outputName: 'links/all.xml',
    content: buildFeed({
      selfUrl: '/links/all.xml',
      htmlUrl: '/links/',
      subtitle: 'Links',
      posts: collection('recentLinks'),
    }),
  };

  yield {
    outputName: 'til/feed.atom',
    content: buildFeed({
      selfUrl: '/til/feed.atom',
      htmlUrl: '/til/',
      subtitle: 'TIL',
      posts: collection('recentTils'),
    }),
  };

  yield {
    outputName: 'releases/feed.atom',
    content: buildFeed({
      selfUrl: '/releases/feed.atom',
      htmlUrl: '/releases/',
      subtitle: 'Releases',
      posts: collection('recentReleases'),
    }),
  };

  // Firehose: everything except social posts — the unified stream.
  yield {
    outputName: 'stream.xml',
    content: buildFeed({
      selfUrl: '/stream.xml',
      htmlUrl: '/',
      subtitle: 'Stream',
      posts: collection('recentStream'),
    }),
  };
}
