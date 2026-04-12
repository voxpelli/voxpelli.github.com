import { voxpelli } from '@voxpelli/eslint-config';

export default [
  ...voxpelli({
    ignores: ['sw.js'],
    noMocha: true,
  }),
  {
    rules: {
      'n/no-sync': 'off',
    },
  },
  {
    files: ['e2e/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        getComputedStyle: 'readonly',
        localStorage: 'readonly',
        matchMedia: 'readonly',
        MutationObserver: 'readonly',
        navigator: 'readonly',
        sessionStorage: 'readonly',
        StorageEvent: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['playwright.config.js'],
    rules: {
      'n/no-process-env': 'off',
    },
  },
];
