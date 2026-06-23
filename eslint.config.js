import { voxpelli } from '@voxpelli/eslint-config';
import { defineConfig } from 'eslint/config';

import { noUnsafeUrlInterpolation } from './tools/eslint-no-unsafe-url-interpolation.js';

export default defineConfig([
  ...voxpelli({
    ignores: ['sw.js'],
    noMocha: true,
  }),
  {
    plugins: {
      local: { rules: { 'no-unsafe-url-interpolation': noUnsafeUrlInterpolation } },
    },
    rules: {
      'n/no-sync': 'off',
      'local/no-unsafe-url-interpolation': 'error',
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
    files: ['playwright.config.js', 'e2e/**/*.test.js'],
    rules: {
      'n/no-process-env': 'off',
    },
  },
]);
