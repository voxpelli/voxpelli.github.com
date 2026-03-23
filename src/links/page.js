import { renderPost } from '../lib/render-post.js';

export const vars = {
  layout: 'root',
  title: 'Links',
  category: 'links',
  hfeed: true,
};

/**
 * @param {{ vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function linksPage ({ vars: pageVars }) {
  const linkPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.linkPosts) || [];
  const recentLinks = linkPosts.slice(0, 5);

  const postsHtml = recentLinks.map(post =>
    renderPost({
      post,
      content: /** @type {string} */ (post.content) || '',
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n');

  return `<div class="content-header">
  <h2>Links // Recommendations</h2>
</div>

${postsHtml}

${linkPosts.length > 5
? `<ul class="posts-extras">
  <li><a href="/archive/full/">Archive</a></li>
</ul>`
: ''}

<script defer src="https://webmention.herokuapp.com/js/cutting-edge.js"></script>`;
}
