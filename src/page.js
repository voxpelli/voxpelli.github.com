import { renderPost } from './lib/render-post.js';

export const vars = {
  layout: 'root',
  title: 'Pelle Wessman',
  frontpage: true,
  webmentionable: true,
  hfeed: true,
};

/**
 * @param {{ vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function homePage ({ vars: pageVars }) {
  const recentPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.recentPosts) || [];

  const postListItems = recentPosts.map(post =>
    renderPost({
      post,
      content: /** @type {string} */ (post.content) || '',
      container: 'li',
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n    ');

  return `<nav>
  <h2>Blog Posts</h2>

  <ul class="posts">
    ${postListItems}
  </ul>

  <ul class="posts-extras">
    <li><a href="/archive/">Archive</a></li>
    <li><a rel="feed" type="text/html" href="/links/">Links</a></li>
    <li><a rel="feed" type="text/html" title="Social Interactions" href="/social/">Social</a></li>
  </ul>
</nav>

<section class="p-author h-card full-card">
  <img class="u-photo" src="/avatar.jpg" alt="" width="97" height="97" />
  <p>
    Hi, I'm <a class="p-name u-url" rel="me" href="/">Pelle Wessman</a> and this is my blog.<br />
    Here I post whatever stuff I'm currently interested in, may it be coding, knitting, cooking – the future will tell.
  </p>
</section>

<section>
  <h2>Subscribe</h2>
  <p>If you want to follow my blog in a feed reader then I've an <a href="/english.xml" type="application/atom+xml">english only</a> version of my feed as well as a feed with <a href="/all.xml" type="application/atom+xml">all posts</a>.</p>
  <p class="subtome"><input class="btn" type="button" onclick="(function(){var z=document.createElement('script');z.src='https://www.subtome.com/load.js';document.body.appendChild(z);})()" value="Subscribe to posts"></p>
</section>`;
}
