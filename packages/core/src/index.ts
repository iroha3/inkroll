import MarkdownIt from 'markdown-it';
import katex from 'katex';
import { buildCard } from './render';
import { exportElement, renderToImage, downloadCardImage, downloadDataUrl } from './export';
import type { InkrollAPI, InkrollOptions, CoreExtensions } from './types';

// ESM 环境下自动补齐全局注入，确保无缝兼容
if (typeof window !== 'undefined') {
  const w = window as any;
  if (!w.markdownit) w.markdownit = MarkdownIt;
  if (!w.katex) w.katex = katex;
}
if (typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  if (!g.markdownit) g.markdownit = MarkdownIt;
  if (!g.katex) g.katex = katex;
}

export * from './types';
export * from './themes';
export * from './parser';
export * from './render';
export * from './export';

export function createInkrollCore(): InkrollAPI {
  return {
    version: '1.0.0',
    render: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) =>
      buildCard(markdown, options, extensions),
    toImage: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) =>
      renderToImage(markdown, options, extensions),
    download: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) =>
      downloadCardImage(markdown, options, extensions),
    exportElement: (element: HTMLElement, scale = 3, format: 'png' | 'jpeg' = 'png') =>
      exportElement(element, scale, format),
    downloadDataUrl,
  };
}

export const InkrollCore: InkrollAPI = createInkrollCore();

if (typeof window !== 'undefined') {
  const win = window as any;
  win.InkrollCore = InkrollCore;
  win.InkrollLite = InkrollCore;
  win.Inkroll = InkrollCore;
}

export default InkrollCore;
