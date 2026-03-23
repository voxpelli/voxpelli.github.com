/**
 * Render indie-action buttons for a post
 *
 * @param {string} postUrl
 * @returns {string}
 */
export function renderIndieActions (postUrl) {
  return `<div class="indie-actions">
  <indie-action do="like" with="${postUrl}">
    <a class="action like" target="_blank" href="https://plus.google.com/share?url={url}">Like</a>
  </indie-action>
  <indie-action do="repost" with="${postUrl}">
    <a class="action repost" target="_blank" href="https://twitter.com/intent/tweet?url={url}">Share</a>
  </indie-action>
  <indie-action do="reply" with="${postUrl}">
    <a class="action reply" target="_blank" href="https://twitter.com/intent/tweet?url={url}">Reply</a>
  </indie-action>
</div>`;
}
