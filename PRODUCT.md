# Product

## Register

brand

## Users

Developers, IndieWeb practitioners, and people who care about web standards, arriving at a personal
blog via RSS, search, or a social link. They come to **read** — articles on Node.js, open source,
IndieWeb, and Swedish tech culture — and their context is focused reading. They want clear content,
fast loading, and well-structured pages. A meaningful slice of them will *view source*: this audience
notices whether the markup is honest.

## Product Purpose

An independent home for one person's writing and work. Three things at once, and it has to be all
three:

1. **An IndieWeb home you own.** The canonical copy of the writing lives here, syndicated outward but
   never dependent on a silo. Success is that the site is alive and publishing again — the archive
   backfill exists to make that possible, not as an end in itself.
2. **A professional calling card.** Where peers and prospects land to understand who Pelle is and what
   he builds: open source stewardship, standards work, credibility.
3. **A standards-craft showcase.** The site *is* the argument. Microformats, webmentions, feeds,
   progressive enhancement, and accessibility are not features bolted on — they are the demonstration.
   Success means the markup and behaviour hold up when someone inspects them.

The three reinforce each other: owning the content is what makes the craft demonstrable, and the craft
is what makes the calling card credible.

## Brand Personality

**Thoughtful, Technical, Warm.** A senior developer who cares deeply about web standards, open source
stewardship, and building things properly — but who communicates with Nordic approachability rather
than cold precision. The warmth is not decoration; it is the differentiator from every other
standards-serious dev site.

## Anti-references

What this must never become:

- **Siloed blog platforms** (Medium, Substack) — rented chrome, paywall interstitials, newsletter
  modals over the content, "claps". Your words held in someone else's system. The direct antithesis of
  the IndieWeb purpose above.
- **The corporate dev-marketing blog** — stock hero illustration, gradient CTA, "Book a demo", a card
  grid of unrelated posts, tracking on every element. Content as funnel.
- **The AI-slop content farm** — SEO filler, listicle padding, generated prose, stock imagery. The
  [notbyai.fyi](https://notbyai.fyi/) badge in the sidebar is a stand against exactly this, and it is a
  commitment rather than a graphic.
- **The brutalist/terminal dev blog** — monospace-everything, harsh black-on-white, no warmth. This is
  the *near miss*: it shares the standards-seriousness but throws away the personality. "Warm" is the
  word that keeps this site out of that lane.

## Design Principles

1. **Content sovereignty.** The content is the product. Design serves readability and structure and
   never competes with it. Article text is serif at a 65ch measure because that is what reading wants.

2. **Warm technical.** Engineering precision (mono metadata, grid background, structured borders)
   held together with warmth (parchment tones, serif typography, organic colour names). Never cold,
   never clinical — that is the anti-reference, not the goal.

3. **IndieWeb native.** Microformats (h-card, h-entry, h-feed) are structural, not decorative.
   Webmentions and feeds are first-class. **The markup is the API** — so it has to be right even when
   nothing visibly depends on it.

4. **Human-authored, and it says so.** AI does not write prose that ships here. Placeholder copy is
   quarantined behind the draft convention and marked as such until a human rewrites it. The badge is
   a promise the codebase is expected to keep.

5. **Progressive layers.** Works without JavaScript. Works without custom fonts. Works in dark mode.
   Each layer enhances the one below without breaking it.

6. **Restrained motion.** Subtle transforms and opacity only, with spring/out easing. No animation for
   its own sake. `prefers-reduced-motion` is honoured — and, because this is a standards showcase, it
   is honoured *properly*, including in shadow DOM and view transitions where a global rule cannot reach.

## Accessibility & Inclusion

**WCAG 2.1 AA is the enforced floor.** The CI gate runs axe across the site in light, dark, and
OS-dark themes **on desktop Chromium** and fails on any critical or serious violation. The Pixel 5
mobile project runs locally (`npm run e2e`) and currently carries a known failure baseline (tracked
in beads) — it is not yet CI-gated, so the enforced floor is desktop-scoped until that baseline is
burned down. Reduced motion is honoured, dark mode is fully supported, and interactive targets meet
the 44px minimum.

**Article text aims beyond AA, at AAA (7:1)** — reading is the entire job, so the text ramp goes
further than the floor requires.

Current state of that goal (measured):

| Text | Light | Dark |
|---|---|---|
| Body ink on canvas | 12.68:1 ✅ AAA | 10.42:1 ✅ AAA |
| Muted secondary (`--color-ink-light`) | **6.88:1 — 0.12 short of AAA** | 8.27:1 ✅ AAA |

So the AAA aspiration is met everywhere except light-mode muted text, which misses by a hair. Closing
that is a single-token nudge, not a redesign.

Non-negotiables that future work must not regress:

- The sidebar is a navigation landmark and **must never scroll**. If its content overflows, the fix is
  to reduce the content or let the page scroll — never an inner scrollbar.
- Colour is never the only carrier of meaning (links in prose take a non-colour cue).
- Contrast invariants are enforced by tests, not by comments — a comment cannot fail CI.
