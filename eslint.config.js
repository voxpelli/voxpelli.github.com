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
];
