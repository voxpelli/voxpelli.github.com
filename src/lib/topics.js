import { slugifyTopic } from './slugify-topic.js';

/**
 * @param {Array<Record<string, unknown>>} posts
 * @returns {Map<string, { display: string, posts: Array<Record<string, unknown>> }>}
 */
export function groupTopics (posts) {
  /** @type {Map<string, { display: string, posts: Array<Record<string, unknown>> }>} */
  const topics = new Map();
  for (const post of posts) {
    const rawTopic = post.topic;
    const topic = typeof rawTopic === 'string' ? rawTopic.trim() : '';
    const slug = topic && slugifyTopic(topic);
    if (!slug) continue;
    const existing = topics.get(slug);
    if (existing) {
      existing.posts.push(post);
    } else {
      topics.set(slug, { display: topic, posts: [post] });
    }
  }
  return topics;
}
