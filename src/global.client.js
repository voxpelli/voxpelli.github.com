/* eslint-disable n/no-unsupported-features/node-builtins -- Browser-only client bundle */
/* global HTMLElement, localStorage, customElements, matchMedia */
document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/, 'js');
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }

// eslint-disable-next-line no-console -- intentional Easter egg for curious developers
console.log('%cVoxPelli %c— Built with DomStack, async-htm-to-string, and a lot of opinions about the open web. Source: https://github.com/voxpelli/voxpelli.github.com', 'font-weight:bold;font-size:14px', 'font-size:12px;color:#8c2121');

// --- Theme Toggle ---

const STORAGE_KEY = 'theme';

const ICON_SYSTEM = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
const ICON_SUN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
const ICON_MOON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

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
    gap: 2px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    padding: 2px;
    align-self: flex-start;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s, background 0.15s;
    padding: 0;
    font-size: 14px;
    line-height: 1;
  }

  button:hover {
    opacity: 0.8;
  }

  button[aria-pressed="true"] {
    opacity: 1;
    background: rgba(0, 0, 0, 0.08);
  }
`;

/**
 * Apply a theme mode to the document and sync all toggle instances.
 *
 * @param {string} mode - 'system', 'light', or 'dark'
 */
function applyTheme (mode) {
  const isDark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';

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
