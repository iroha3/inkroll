import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = import.meta.dir;
const DIST = resolve(ROOT, 'dist');
mkdirSync(DIST, { recursive: true });

// 0) 预先将核心排版 CSS 与 KaTeX 内嵌字体编译为嵌入式 TS 常量，供 export.ts 零宿主污染导出使用
console.log('Generating embedded core css...');
const inkrollCss = readFileSync(resolve(ROOT, 'src/styles/inkroll.css'), 'utf-8').replace(/\r\n/g, '\n');
const katexCss = readFileSync(resolve(ROOT, 'src/styles/katex-embedded.css'), 'utf-8').replace(/\r\n/g, '\n');
const combinedCss = inkrollCss + '\n' + katexCss;

writeFileSync(
  resolve(ROOT, 'src/styles/embedded-css.ts'),
  `// 该文件由 build.ts 自动生成，请勿手动编辑\nexport const CORE_EMBEDDED_CSS = ${JSON.stringify(combinedCss)};\n`
);

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
