import { voxpelli } from '@voxpelli/eslint-config';

export default voxpelli({
  ignores: ['demo/', 'js/', 'static/', 'scripts/', 'src/sw.js'],
  noMocha: true,
});
