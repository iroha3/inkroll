#!/usr/bin/env bun
/**
 * apps/userscripts 构建脚本：
 *   @inkroll/core 统一核心样式 + @inkroll/core IIFE 引擎 + shared/ (UI+流程) + adapters/<id>.js
 *   → dist/<out>.user.js（自包含：内嵌 CSS/KaTeX 字体/Vendor，安装零依赖）
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = import.meta.dir;
const CORE_DIR = resolve(ROOT, '../../packages/core');
const VENDOR = resolve(ROOT, 'vendor');
const OUT_DIR = resolve(ROOT, 'dist');

function readText(p: string): string {
  return readFileSync(p, 'utf-8').replace(/\r\n/g, '\n');
}

// 1) 读取单一事实源的核心排版样式和内嵌 KaTeX 字体
const coreCss = readText(resolve(CORE_DIR, 'src/styles/inkroll.css'));
const katexFontCss = readText(resolve(CORE_DIR, 'src/styles/katex-embedded.css'));
const cssString = JSON.stringify(coreCss + '\n' + katexFontCss);

// 2) Vendor
const mdJs = readText(resolve(VENDOR, 'markdown-it.min.js'));
const katexJs = readText(resolve(VENDOR, 'katex.min.js'));

// 3) Core 引擎产物
const coreJs = readText(resolve(CORE_DIR, 'dist/inkroll-core.iife.js'));

// 平台配置
const PLATFORMS = [
  {
    id: 'ai-studio',
    name: 'Google AI Studio 对话导出 PNG',
    namespace: 'local.ai-studio-export-png',
    version: '1.0.0',
    description: '把 AI Studio 当前对话导出为 PNG 长图',
    match: ['https://aistudio.google.com/*'],
    out: 'ai-studio-export-png.user.js',
    adapter: resolve(ROOT, 'adapters', 'aistudio.js'),
  },
  {
    id: 'qwen',
    name: 'Qwen 对话导出 PNG',
    namespace: 'local.qwen-export-png',
    version: '1.0.0',
    description: '把 Qwen 当前对话导出为 PNG 长图',
    match: ['https://chat.qwen.ai/*'],
    out: 'qwen-export-png.user.js',
    adapter: resolve(ROOT, 'adapters', 'qwen.js'),
  },
];

const SHELL = `
/* ========== 1) 排版与字体样式注入 ========== */
(function injectInkrollCss() {
  if (document.getElementById('inkroll-style')) return;
  var s = document.createElement('style');
  s.id = 'inkroll-style';
  s.textContent = __INKROLL_CSS__;
  (document.head || document.documentElement).appendChild(s);
})();

/* ========== 2) TrustedTypes 兜底 ========== */
(function shimTrustedTypes() {
  try {
    if (window.trustedTypes && trustedTypes.createPolicy && !trustedTypes.defaultPolicy) {
      trustedTypes.createPolicy('default', {
        createHTML: function (s) { return s; },
        createScriptURL: function (s) { return s; },
        createScript: function (s) { return s; },
      });
    }
  } catch (e) { /* 已有默认 policy 则跳过 */ }
})();
`;

function buildBanner(p: (typeof PLATFORMS)[number]): string {
  const lines = [
    '// ==UserScript==',
    `// @name         ${p.name}`,
    `// @namespace    ${p.namespace}`,
    `// @version      ${p.version}`,
    `// @description  ${p.description}`,
    ...p.match.map((m) => `// @match        ${m}`),
    '// @run-at       document-idle',
    '// @grant        none',
    '// ==/UserScript==',
    '',
    `/* 构建产物（bun run build.ts ${p.id} 生成，请勿手改；统一底座：@inkroll/core） */`,
    '',
  ];
  return lines.join('\n');
}

function buildPlatform(p: (typeof PLATFORMS)[number]) {
  const parts = [
    buildBanner(p),
    SHELL.replace('__INKROLL_CSS__', cssString),
    '/* ========== 3) markdown-it (Vendor) ========== */',
    mdJs,
    '/* ========== 4) KaTeX (Vendor) ========== */',
    katexJs,
    '/* ========== 5) @inkroll/core 统一核心引擎 ========== */',
    coreJs,
    '/* ========== 6) 共享 i18n ========== */',
    readText(resolve(ROOT, 'shared', 'i18n.js')),
    '/* ========== 7) 共享导出引擎 ========== */',
    readText(resolve(ROOT, 'shared', 'export-engine.js')),
    '/* ========== 8) 共享导出按钮 UI ========== */',
    readText(resolve(ROOT, 'shared', 'export-button.js')),
    `/* ========== 9) 平台适配器（${p.id}） ========== */`,
    readText(p.adapter),
    '',
  ];

  const out = parts.join('\n');
  const outPath = resolve(OUT_DIR, p.out);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(outPath, out, 'utf-8');

  // 语法自检
  try {
    new Function(out);
  } catch (e: any) {
    console.error(`语法自检失败 (${p.out}):`, e.message);
    process.exit(1);
  }

  const kb = (Buffer.byteLength(out, 'utf-8') / 1024).toFixed(1);
  console.log(`✓ dist/${p.out} (${kb} KB) - 语法校验通过`);
}

const only = process.argv[2];
const targets = only ? PLATFORMS.filter((p) => p.id === only) : PLATFORMS;
if (only && targets.length === 0) {
  console.error(`未知平台 id: ${only}（可用: ${PLATFORMS.map((p) => p.id).join(', ')}）`);
  process.exit(1);
}

for (const p of targets) {
  buildPlatform(p);
}
