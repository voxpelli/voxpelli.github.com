/* eslint-disable n/no-unsupported-features/node-builtins -- Browser-only client bundle */
/* global HTMLElement, localStorage, customElements, matchMedia */
document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/, 'js');
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }

// eslint-disable-next-line no-console -- intentional Easter egg for curious developers
console.log('%cVoxPelli %c— Built with DomStack, async-htm-to-string, and a lot of opinions about the open web. Source: https://github.com/voxpelli/voxpelli.github.com', 'font-weight:bold;font-size:14px', 'font-size:12px;color:#8c2121');

/**
 * <theme-toggle> — HTML web component
 * Wraps a <button> and cycles through light/dark/system themes.
 * Sets data-theme on <html> and persists to localStorage.
 * Without JS: button is inert, CSS prefers-color-scheme handles it.
 */
class ThemeToggle extends HTMLElement {
  static #THEMES = ['system', 'light', 'dark'];
  static #ICONS = { system: '\u2600\uFE0F', light: '\u2600\uFE0F', dark: '\uD83C\uDF19' };

  connectedCallback () {
    const stored = localStorage.getItem('theme');
    this._theme = ThemeToggle.#THEMES.includes(stored) ? stored : 'system';
    this._apply();

    const btn = this.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => {
        const idx = ThemeToggle.#THEMES.indexOf(this._theme);
        this._theme = ThemeToggle.#THEMES[(idx + 1) % ThemeToggle.#THEMES.length];
        localStorage.setItem('theme', this._theme);
        this._apply();
      });
    }

    // Cross-tab sync: update when another tab changes the theme
    globalThis.addEventListener('storage', (e) => {
      if (e.key === 'theme' && typeof e.newValue === 'string') {
        this._theme = ThemeToggle.#THEMES.includes(e.newValue) ? e.newValue : 'system';
        this._apply();
      }
    });
  }

  _apply () {
    const root = document.documentElement;
    const isDark = this._theme === 'dark' ||
      (this._theme === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
    root.dataset.theme = isDark ? 'dark' : 'light';

    const btn = this.querySelector('button');

    if (btn) {
      btn.textContent = ThemeToggle.#ICONS[this._theme];
      btn.setAttribute('aria-label', `Theme: ${this._theme} (click to change)`);
    }
  }
}

/**
 * <relative-time> — HTML web component
 * Wraps a <time> element and appends a relative label like "(2 days ago)".
 * Without JS: the original formatted date is shown as-is.
 */
class RelativeTime extends HTMLElement {
  connectedCallback () {
    const time = this.querySelector('time[datetime]');
    if (!time) return;

    const date = new Date(time.getAttribute('datetime'));
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
