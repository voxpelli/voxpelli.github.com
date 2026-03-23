import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = join(import.meta.dirname, '..', '_posts');
const SRC_DIR = join(import.meta.dirname, '..', 'src');

// Legacy redirect directories
const LEGACY_DIRS = ['2008', '2009', '2010', '2011'];

/**
 * Parse date from various Jekyll formats
 *
 * @param {Record<string, unknown>} data - Frontmatter data
 * @param {string} filename - Post filename for date extraction
 * @returns {Date}
 */
function parseDate (data, filename) {
  if (data.date) {
    return new Date(/** @type {string} */ (data.date));
  }
  if (data.created) {
    return new Date(Number(data.created) * 1000);
  }
  // Extract date from filename: YYYY-MM-DD-slug.md
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  }
  return new Date();
}

/**
 * Extract slug from filename and frontmatter
 *
 * @param {Record<string, unknown>} data - Frontmatter data
 * @param {string} filename - Post filename
 * @returns {string}
 */
function getSlug (data, filename) {
  if (data.slug) return String(data.slug);
  // Remove date prefix and extension from filename
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.(md|html)$/, '');
}

/**
 * Build the target path for a post based on Jekyll permalink /:categories/:year/:month/:title/
 *
 * @param {Record<string, unknown>} data
 * @param {Date} date
 * @param {string} slug
 * @returns {string}
 */
function getTargetPath (data, date, slug) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  if (data.category === 'social') {
    return join('social', year, month, slug);
  }
  if (data.category === 'links') {
    return join('links', year, month, slug);
  }
  return join(year, month, slug);
}

/**
 * Transform frontmatter for DomStack
 *
 * @param {Record<string, unknown>} data
 * @param {Date} date
 * @returns {Record<string, unknown>}
 */
function transformFrontmatter (data, date) {
  /** @type {Record<string, unknown>} */
  const result = {
    layout: 'article',
  };

  if (data.title) result.title = data.title;
  result.date = date.toISOString();
  if (data.lang) result.lang = data.lang;
  if (data.category) result.category = data.category;

  // Preserve all mf-* fields
  for (const key of Object.keys(data)) {
    if (key.startsWith('mf-')) {
      result[key] = data[key];
    }
  }

  // Preserve other IndieWeb fields
  if (data.persontags) result.persontags = data.persontags;
  if (data.submitto) result.submitto = data.submitto;
  if (data.tags) result.tags = data.tags;

  return result;
}

function migratePosts () {
  const files = readdirSync(POSTS_DIR);
  let count = 0;

  for (const file of files) {
    const filePath = join(POSTS_DIR, file);
    const raw = readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    const date = parseDate(data, file);
    const slug = getSlug(data, file);
    const targetPath = getTargetPath(data, date, slug);

    const ext = extname(file);
    const pageFile = ext === '.html' ? 'page.html' : 'page.md';
    const destDir = join(SRC_DIR, targetPath);
    const destFile = join(destDir, pageFile);

    const newFrontmatter = transformFrontmatter(data, date);

    // Replace Jekyll variables in content
    let processedContent = content.replace(/\{\{\s*site\.url\s*\}\}/g, 'https://voxpelli.com');

    // Build new file content
    const output = matter.stringify(processedContent, newFrontmatter);

    mkdirSync(destDir, { recursive: true });
    writeFileSync(destFile, output, 'utf8');
    count++;

    console.log(`Migrated: ${file} -> ${targetPath}/${pageFile}`);
  }

  console.log(`\nMigrated ${count} posts.`);
}

/**
 * Migrate legacy redirect files (2008-2011 year directories)
 */
function migrateRedirects () {
  const rootDir = join(import.meta.dirname, '..');
  let count = 0;

  for (const year of LEGACY_DIRS) {
    const yearDir = join(rootDir, year);
    try {
      findRedirects(yearDir, join(SRC_DIR));
    } catch {
      // Directory may not exist
    }
  }

  /**
   * @param {string} dir
   * @param {string} destBase
   */
  function findRedirects (dir, destBase) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findRedirects(fullPath, destBase);
      } else if (entry.name === 'index.md') {
        const raw = readFileSync(fullPath, 'utf8');
        const { data } = matter(raw);

        if (data.layout === 'refresh' && data.refresh_to_post_id) {
          // Get relative path from root
          const relPath = fullPath.replace(join(import.meta.dirname, '..') + '/', '').replace('/index.md', '');
          const destDir = join(destBase, relPath);
          const destFile = join(destDir, 'page.html');

          const redirectUrl = String(data.refresh_to_post_id).endsWith('/')
            ? data.refresh_to_post_id
            : data.refresh_to_post_id + '/';

          const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
  <link rel="canonical" href="${redirectUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">${redirectUrl}</a></p>
</body>
</html>`;

          mkdirSync(destDir, { recursive: true });
          writeFileSync(destFile, html, 'utf8');
          count++;
          console.log(`Redirect: ${relPath} -> ${data.refresh_to_post_id}`);
        }
      }
    }
  }

  console.log(`\nMigrated ${count} redirects.`);
}

migratePosts();
migrateRedirects();
