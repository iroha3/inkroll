import { buildCard, buildCardPages } from './render';
import { exportElement, renderToImage, renderToMultiImages, downloadCardImage, downloadDataUrl } from './export';
import type { InkrollAPI, InkrollOptions, CoreExtensions } from './types';

export * from './types';
export * from './themes';
export * from './parser';
export * from './render';
export * from './export';

export function createInkrollCore(): InkrollAPI {
  return {
    version: '1.1.0',
    render: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) =>
      buildCard(markdown, options, extensions),
    buildPages: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) =>
      buildCardPages(markdown, options, extensions),
    toImage: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) =>
      renderToImage(markdown, options, extensions),
    toMultiImages: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) =>
      renderToMultiImages(markdown, options, extensions),
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
