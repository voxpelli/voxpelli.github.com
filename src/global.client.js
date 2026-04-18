/* eslint-disable n/no-unsupported-features/node-builtins -- Browser-only client bundle */
/* global HTMLElement, localStorage, customElements */
document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/, 'js');
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }

// eslint-disable-next-line no-console -- intentional Easter egg for curious developers
console.log('%cVoxPelli %c— Built with DomStack, async-htm-to-string, and a lot of opinions about the open web. Source: https://github.com/voxpelli/voxpelli.github.com', 'font-weight:bold;font-size:14px', 'font-size:12px;color:#8c2121');

// --- Theme Toggle ---

const STORAGE_KEY = 'theme';

// Each swatch previews its mode's canvas — hardcoded so they render identically regardless of current theme.
const SWATCH_LIGHT = '#f4f1eb';
const SWATCH_DARK = '#1e1d1b';
const ICON_SYSTEM = `<span class="swatch" style="background:linear-gradient(135deg, ${SWATCH_LIGHT} 50%, ${SWATCH_DARK} 50%)"></span>`;
const ICON_SUN = `<span class="swatch" style="background:${SWATCH_LIGHT}"></span>`;
const ICON_MOON = `<span class="swatch" style="background:${SWATCH_DARK}"></span>`;

/** @type {Array<{ mode: string, icon: string, label: string }>} */
const MODES = [
  { icon: ICON_SYSTEM, label: 'System', mode: 'system' },
  { icon: ICON_SUN, label: 'Light', mode: 'light' },
  { icon: ICON_MOON, label: 'Dark', mode: 'dark' },
];

const TOGGLE_STYLES = `
  :host {
    display: none;
    flex-direction: row;
    gap: 6px;
    background: transparent;
    padding: 0;
    align-self: flex-start;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: 44px;
    min-height: 44px;
    border: 1px solid var(--color-stone, #d1ccc5);
    border-radius: 4px;
    background: var(--color-canvas-alt, #e9e5de);
    color: inherit;
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s, box-shadow 0.12s;
  }

  button:hover {
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 var(--color-ink, #2c2a28);
  }

  button[aria-pressed="true"] {
    border-width: 2px;
    border-color: var(--color-ink, #2c2a28);
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--color-ink, #2c2a28);
  }

  .swatch {
    display: block;
    box-sizing: border-box;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid var(--color-ink, #2c2a28);
  }

  /* Shadow DOM is isolated from outer @media blocks — inner rule is the only path */
  @media (prefers-reduced-motion: reduce) {
    button { transition: none; }
    button:hover,
    button[aria-pressed="true"] { transform: none; }
  }
`;

/**
 * Apply a theme mode to the document and sync all toggle instances.
 *
 * @param {string} mode - 'system', 'light', or 'dark'
 */
function applyTheme (mode) {
  if (mode === 'system') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }

  for (const toggle of document.querySelectorAll('theme-toggle')) {
    const root = toggle.shadowRoot;
    if (!root) continue;
    for (const btn of root.querySelectorAll('button')) {
      btn.setAttribute('aria-pressed', btn.dataset.theme === mode ? 'true' : 'false');
    }
  }
}

/**
 * <theme-toggle> — three-button theme switcher web component.
 *
 * Renders System / Light / Dark buttons inside Shadow DOM.
 * Manages state via localStorage + data-theme on <html>.
 * Progressive enhancement: hidden until JS runs (display:none in :host,
 * set to flex in connectedCallback).
 */
class ThemeToggle extends HTMLElement {
  connectedCallback () {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: 'open' });
    const current = localStorage.getItem(STORAGE_KEY) || 'system';

    shadow.innerHTML = `<style>${TOGGLE_STYLES}</style>` +
      MODES.map(({ icon, label, mode }) =>
        `<button data-theme="${mode}" aria-pressed="${mode === current}" title="${label}">${icon}</button>`
      ).join('');

    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', 'Theme');
    this.style.display = 'flex';

    shadow.addEventListener('click', (e) => {
      const btn = /** @type {HTMLElement | null} */ (e.target)?.closest('button');
      if (!btn?.dataset.theme) return;
      localStorage.setItem(STORAGE_KEY, btn.dataset.theme);
      applyTheme(btn.dataset.theme);
    });
  }
}

// Apply saved theme on module load (reduces FOWT when JS loads quickly)
applyTheme(localStorage.getItem(STORAGE_KEY) || 'system');

// Cross-tab sync via storage event
globalThis.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY && typeof e.newValue === 'string') {
    applyTheme(e.newValue);
  }
});

// --- Relative Time ---

/**
 * <relative-time> — HTML web component
 * Wraps a <time> element and appends a relative label like "(2 days ago)".
 * Without JS: the original formatted date is shown as-is.
 */
class RelativeTime extends HTMLElement {
  connectedCallback () {
    const time = this.querySelector('time[datetime]');
    if (!time) return;

    const date = new Date(/** @type {string} */ (time.getAttribute('datetime')));
    if (Number.isNaN(date.getTime())) return;

    const label = RelativeTime.#format(date);
    if (!label) return;

    const span = document.createElement('span');
    span.className = 'relative-label';
    span.textContent = ` (${label})`;
    time.append(span);
  }

  /**
   * @param {Date} date
   * @returns {string}
   */
  static #format (date) {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  }
}

customElements.define('theme-toggle', ThemeToggle);
customElements.define('relative-time', RelativeTime);

// --- Subtome RSS Subscribe ---
const subtomeBtn = document.querySelector('[data-subtome]');
if (subtomeBtn) {
  subtomeBtn.addEventListener('click', () => {
    const script = document.createElement('script');
    script.src = 'https://www.subtome.com/load.js';
    document.body.append(script);
  });
}

// --- Mobile Nav: button/drawer toggle ---
const hamburgerBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.hamburger-btn'));
const navDrawer = document.querySelector('#nav-drawer');

if (hamburgerBtn && navDrawer) {
  const isMobile = () => globalThis.matchMedia('(max-width: 767px)').matches;

  /** @param {boolean} open */
  const setNavOpen = (open) => {
    navDrawer.classList.toggle('is-open', open);
    hamburgerBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = (open && isMobile()) ? 'hidden' : '';
  };

  hamburgerBtn.addEventListener('click', () => {
    setNavOpen(hamburgerBtn.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburgerBtn.getAttribute('aria-expanded') === 'true') {
      setNavOpen(false);
      hamburgerBtn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (
      hamburgerBtn.getAttribute('aria-expanded') === 'true' &&
      !navDrawer.contains(/** @type {Node} */ (e.target)) &&
      !hamburgerBtn.contains(/** @type {Node} */ (e.target))
    ) {
      setNavOpen(false);
    }
  });

  globalThis.matchMedia('(max-width: 767px)').addEventListener('change', (e) => {
    if (!e.matches) setNavOpen(false);
  });
}
