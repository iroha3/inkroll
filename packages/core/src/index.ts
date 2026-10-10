import { buildCard } from './render';
import { exportElement, renderToImage, downloadCardImage, downloadDataUrl } from './export';
import { normalizeConfig, DEFAULT_CONFIG, THEMES, THEME_VARS } from './themes';
import type { InkrollAPI, InkrollOptions, CoreExtensions } from './types';

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

// 挂载到全局，供油猴或原生浏览器环境直接调用
if (typeof window !== 'undefined') {
  const win = window as any;
  win.InkrollCore = InkrollCore;
  win.InkrollLite = InkrollCore;
  win.Inkroll = InkrollCore;
}

export default InkrollCore;
