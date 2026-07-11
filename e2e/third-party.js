/**
 * The webmention widget's injected region.
 *
 * Article pages load `cutting-edge.js` from the webmention endpoint. When the
 * mentions arrive it REPLACES our authored `<a class="u-responses">` with its own
 * `<div class="webmention-container">` subtree — including avatar `<img>` elements
 * that carry no `alt`, which axe correctly reports as a critical `image-alt`
 * violation.
 *
 * That markup is not produced by this repository and cannot be fixed from here; it
 * is fixed where the widget is built. Worse, whether a scan sees it at all is a
 * race: the script takes ~3.7s to fetch, so a fast CI runner gets the injected DOM
 * and a slower local machine usually does not. Left alone, the a11y gate reports a
 * defect it cannot fix, non-deterministically.
 *
 * So the site's own accessibility gate scans the site's own markup. Excluding the
 * region by selector is deterministic whether or not the injection wins the race —
 * an absent selector excludes nothing and changes nothing.
 *
 * This is a scoping decision, NOT a silencing one: the missing `alt` is a real
 * defect on the live site, tracked against the widget itself.
 */
export const WEBMENTION_INJECTED_REGION = '.webmention-container';
