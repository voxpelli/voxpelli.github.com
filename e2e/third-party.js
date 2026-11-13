/**
 * The one thing in the webmention widget's output that this repo cannot fix.
 *
 * Article pages load `cutting-edge.js` from the webmention endpoint. When the
 * mentions arrive it REPLACES our authored `<a class="u-responses">` with its
 * own `<div class="webmention-container">` subtree, in which each avatar is an
 * `<img>` with no alt — a genuine critical `image-alt` violation on the live
 * site. It is fixed where the widget is built, not here (see
 * UPSTREAM-service--webmention.md), so the gate would otherwise report a defect
 * it cannot act on. Worse, whether a scan sees it at all is a race: the script
 * takes ~3.7s, so CI usually gets the injected DOM and a dev machine usually
 * does not.
 *
 * Excluding by selector is deterministic either way — an absent selector
 * excludes nothing.
 *
 * Exclude the IMAGES, not the container. The markup is theirs but roughly
 * fifteen rules in global.css style that subtree (`.webmention-mention`,
 * `.webmention-author img`, `.webmention-footer a`, a muted
 * `--color-ink-light` link…), so excluding the whole region would permanently
 * stop measuring OUR OWN CSS inside it — in light, dark, forced-colors and
 * increased-contrast alike. Measured: excluding the container leaves 4 axe
 * checks running inside it; excluding only the images leaves 7, with the same
 * green result.
 */
export const WEBMENTION_INJECTED_IMAGES = '.webmention-container img';
