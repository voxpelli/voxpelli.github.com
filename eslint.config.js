import { voxpelli } from '@voxpelli/eslint-config';

export default [
  { ignores: ['demo/', 'js/', 'static/', 'scripts/', 'src/sw.js'] },
  ...voxpelli({ noMocha: true }),
];
