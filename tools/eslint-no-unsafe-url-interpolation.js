/** @import { Rule } from 'eslint' */
/** @import { Expression, MemberExpression, Node, Super } from 'estree' */

// Custom rule: prevent unsafe URL interpolation in `html` tagged templates.
// async-htm-to-string's `html` tag auto-escapes <>"'& but NOT URL schemes,
// so `javascript:alert(1)` survives in href positions unless gated by
// safePostUrl(). This rule walks every interpolation in `html` tagged
// templates and rejects URL-attribute positions whose expression is not
// a known-safe form. See CLAUDE.md and src/lib/safe-url.js.
const URL_ATTR_RE = /\b(href|src|action|formaction|poster|cite|manifest)=$/;

const ALLOWED_CALLEES = new Set([
  // The actual safety gates
  'safePostUrl', 'safeHref',
  // Passthrough wrappers (recurse into args)
  'String',
  // Slug/path producers — emit URL-safe substrings inside template literals
  // building same-origin paths like /tags/<slug>/ or /til/topics/<slug>/
  'encodeURIComponent', 'slugifyTopic',
]);

const ALLOWED_IDENTIFIERS = new Set([
  // DomStack-provided URL identifiers (build-time computed paths)
  'pageUrl', 'mentionsUrl', 'wmEndpoint', 'canonicalUrl',
  // Map-callback params over DomStack-provided arrays (styles[], scripts[])
  'href', 'src',
  // Locally-bound to safePostUrl(...) results — convention is name carries safety:
  // `const safeX = safePostUrl(rawX)` or `const xSafe = safePostUrl(...)`.
  'safeUrl', 'safeBookmarkUrl', 'viaSafe',
  // post.pageUrl-derived locals (DomStack-controlled filesystem path)
  'postUrl',
]);

const ALLOWED_MEMBER_PATHS = new Set([
  'page.path', 'page.pageUrl',
  'post.pageUrl', 'prevPost.pageUrl', 'nextPost.pageUrl',
  'item.href',
]);

const PASSTHROUGH_CALLEES = new Set(['String']);

/**
 * @param {MemberExpression} node
 * @returns {string | undefined}
 */
function memberPath (node) {
  /** @type {string[]} */
  const parts = [];

  /** @type {Expression | Super} */
  let cur = node;

  while (cur.type === 'MemberExpression' && !cur.computed) {
    if (cur.property.type !== 'Identifier') return;
    parts.unshift(cur.property.name);
    cur = cur.object;
  }

  if (cur.type === 'Identifier') {
    parts.unshift(cur.name);
    return parts.join('.');
  }
}

/**
 * @param {Node | null | undefined} node
 * @returns {boolean}
 */
function isAllowedExpr (node) {
  if (!node) return false;

  switch (node.type) {
    case 'Literal':
      return typeof node.value === 'string' || node.value === null || node.value === false;

    case 'TemplateLiteral':
      return node.expressions.every(e => isAllowedExpr(e));

    case 'CallExpression':
      if (node.callee.type !== 'Identifier') return false;
      if (!ALLOWED_CALLEES.has(node.callee.name)) return false;
      // Passthrough wrappers (e.g. String()) keep us walking the inner expr;
      // the actual gates (safePostUrl/safeHref) and slug producers
      // (encodeURIComponent/slugifyTopic) self-vouch for any argument shape.
      if (PASSTHROUGH_CALLEES.has(node.callee.name)) {
        return node.arguments.every(a => isAllowedExpr(a));
      }
      return true;

    case 'Identifier':
      return ALLOWED_IDENTIFIERS.has(node.name);

    case 'MemberExpression': {
      const path = memberPath(node);
      return path !== undefined && ALLOWED_MEMBER_PATHS.has(path);
    }

    case 'ConditionalExpression':
      return isAllowedExpr(node.consequent) && isAllowedExpr(node.alternate);

    case 'LogicalExpression':
      return isAllowedExpr(node.left) && isAllowedExpr(node.right);

    default:
      return false;
  }
}

export const noUnsafeUrlInterpolation = /** @satisfies {Rule.RuleModule} */ (/** @type {const} */({
  meta: {
    type: 'problem',
    docs: { description: 'Require safePostUrl/safeHref for URL attribute interpolations in html`` tagged templates' },
    schema: [],
    messages: {
      unsafe: '{{attr}} attribute interpolation must be wrapped in safePostUrl() (or safeHref() for raw-string concat). async-htm-to-string does not block javascript:/data: schemes. Got: {{expr}}. See CLAUDE.md and src/lib/safe-url.js.',
    },
  },
  create (context) {
    return {
      TaggedTemplateExpression (node) {
        if (node.tag.type !== 'Identifier' || node.tag.name !== 'html') {
          return;
        }

        const {
          expressions,
          quasis,
        } = node.quasi;

        for (const [i, expr] of expressions.entries()) {
          const quasi = quasis[i];
          const attributeMatches = quasi && URL_ATTR_RE.exec(quasi.value.raw);
          const attr = attributeMatches && attributeMatches[1];

          if (!attr || isAllowedExpr(expr)) continue;

          context.report({
            node: expr,
            messageId: 'unsafe',
            data: {
              attr,
              expr: context.sourceCode.getText(expr),
            },
          });
        }
      },
    };
  },
}));
