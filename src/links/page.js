import { renderPost } from '../lib/render-post.js';

export const vars = {
  layout: 'root',
  title: 'Links',
  category: 'links',
  hfeed: true,
};

/** @param {{ vars: Record<string, unknown> }} options */
export default function linksPage ({ vars: pageVars }) {
  const linkPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.linkPosts) || [];
  const recentLinks = linkPosts.slice(0, 5);

  const postsHtml = recentLinks.map(post =>
    renderPost({
      post,
      content: /** @type {string} */ (post.content) || '',
      indieactions: true,
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n');

  return `<h2>Links</h2>

${postsHtml}

${linkPosts.length > 5 ? `<ul class="posts-extras">
  <li><a href="/archive/full/">Archive</a></li>
</ul>` : ''}

<script defer src="https://webmention.herokuapp.com/js/cutting-edge.js"></script>

<section>
  <h2>Subscribe to all links</h2>
  <p>There's a <a href="/links/all.xml" type="application/atom+xml">links feed</a> where you can get all the links I recommend here.</p>
  <p class="subtome"><input class="btn" type="button" onclick="(function(){var z=document.createElement('script');z.src='https://www.subtome.com/load.js';document.body.appendChild(z);})()" value="Subscribe to links"></p>
</section>`;
}
