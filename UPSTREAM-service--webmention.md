Tracks the webmention service this site embeds — the endpoint at
`webmention.herokuapp.com` and its client script `cutting-edge.js`, both
voxpelli's own. A rewrite is planned; these are the defects this site sees today.

## Feature Requests

_No entries yet._

## Bugs

- **Injected mention avatars carry no `alt`** (2026-07-11) [degraded] — `cutting-edge.js` replaces the authored `<a class="u-responses">` with its own `<div class="webmention-container">` subtree, in which each mention's avatar renders as `<img loading="lazy" src="https://…/avatar.jpg">` with no `alt` attribute, no `aria-label` and no `title`. axe reports it as a **critical `image-alt`** violation on every article page that has received a mention. A decorative avatar wants `alt=""`; an avatar that is the only representation of the mentioner wants the author's name. Either is fine — absent is not. Fixing it upstream fixes it for every site embedding the widget, and would let this repo drop the axe exclusion it currently needs.
  Severity: degraded · Ownership: upstream · Workaround: partial — the site's a11y gate excludes `.webmention-container` (see `e2e/third-party.js`), which keeps CI honest about the markup this repo produces but does nothing for real users

- **Widget injection races any page-load assertion** (2026-07-11) [minor] — The script is fetched from the endpoint on every article view and took ~3.7s to return when measured. Because it *replaces* `.u-responses` rather than filling it, anything observing that element sees a different DOM depending on who wins the race — a fast CI runner gets the injected subtree, a slower local machine usually does not. That is what made the missing `alt` above show up as a CI-only failure. A container that is filled rather than swapped, or a stable wrapper element that survives injection, would make the widget's presence observable without a race.
  Severity: minor · Ownership: upstream · Workaround: full — tests block the script or exclude the injected region by selector

## Upstream Opportunities

_No entries yet._
