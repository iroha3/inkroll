import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = import.meta.dir;
const DIST = resolve(ROOT, 'dist');
mkdirSync(DIST, { recursive: true });

console.log('Building @inkroll/core (ESM)...');
const esmResult = await Bun.build({
  entrypoints: [resolve(ROOT, 'src/index.ts')],
  outdir: DIST,
  target: 'browser',
  format: 'esm',
  naming: 'index.js',
  external: ['katex', 'markdown-it'],
});

if (!esmResult.success) {
  console.error('ESM build failed:', esmResult.logs);
  process.exit(1);
}

console.log('Building @inkroll/core (IIFE standalone for userscripts)...');
const iifeResult = await Bun.build({
  entrypoints: [resolve(ROOT, 'src/index.iife.ts')],
  outdir: DIST,
  target: 'browser',
  format: 'iife',
  naming: 'inkroll-core.iife.js',
});

if (!iifeResult.success) {
  console.error('IIFE build failed:', iifeResult.logs);
  process.exit(1);
}

console.log('✓ @inkroll/core built successfully.');
