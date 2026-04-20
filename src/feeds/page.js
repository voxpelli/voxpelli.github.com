// AI-INELIGIBLE: prose descriptions on this page require human rewrite before removing the placeholder notice.

/**
 * @typedef {{
 *   layout: 'root',
 *   title: string,
 *   noFeedAlternates: true,
 * }} FeedsPageVars
 */

export const vars = /** @satisfies {FeedsPageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Feeds',
  noFeedAlternates: true,
}));

/**
 * @returns {string}
 */
export default function feedsPage () {
  return `<div class="content-header">
  <h2>Feeds</h2>
</div>

<div class="ai-placeholder-notice" style="border:2px dashed var(--color-falu-red); padding:var(--space-md); margin-bottom:var(--space-lg);">
  <strong>AI-placeholder content.</strong> The descriptions on this page are AI-generated placeholder text awaiting human rewrite. See <a href="https://notbyai.fyi/">notbyai.fyi</a>.
</div>

<p>Subscribe to this site in a feed reader to follow along without an algorithm in the middle. Any Atom/RSS reader works; pick the stream that matches what you want to follow.</p>

<section>
  <h2>Stream</h2>
  <p>Everything I publish except social posts.</p>
  <ul>
    <li><a href="/stream.xml">/stream.xml</a></li>
  </ul>
</section>

<section>
  <h2>Articles</h2>
  <p>Long-form blog posts. English-only variant available.</p>
  <ul>
    <li><a href="/all.xml">/all.xml</a></li>
    <li><a href="/english.xml">/english.xml</a></li>
  </ul>
</section>

<section>
  <h2>TIL</h2>
  <p>Short-form notes, links, and releases (superset).</p>
  <ul>
    <li><a href="/til/feed.atom">/til/feed.atom</a></li>
  </ul>
</section>

<section>
  <h2>Links</h2>
  <p>Just the bookmarks, for readers who want them separately.</p>
  <ul>
    <li><a href="/links/all.xml">/links/all.xml</a></li>
  </ul>
</section>

<section>
  <h2>Releases</h2>
  <p>OSS release notes.</p>
  <ul>
    <li><a href="/releases/feed.atom">/releases/feed.atom</a></li>
  </ul>
</section>`;
}
