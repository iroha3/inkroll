import { buildCard, processMermaid } from './render';
import { normalizeConfig } from './themes';
import type { CoreExtensions, InkrollOptions } from './types';

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(blob);
  });
}

function inlineComputedStyles(srcEl: Node, dstEl: Node): void {
  if (dstEl.nodeType === 1 && srcEl.nodeType === 1) {
    const src = srcEl as Element;
    const dst = dstEl as HTMLElement;
    const cs = window.getComputedStyle(src);
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      dst.style.setProperty(p, cs.getPropertyValue(p), cs.getPropertyPriority(p));
    }
  }
  let src = srcEl.firstChild;
  let dst = dstEl.firstChild;
  while (src && dst) {
    inlineComputedStyles(src, dst);
    src = src.nextSibling;
    dst = dst.nextSibling;
  }
}

export async function exportElement(
  element: HTMLElement,
  scale = 3,
  format: 'png' | 'jpeg' = 'png'
): Promise<string> {
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 50));

  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);

  // 兜底：隐藏非展开态的 <details> 子内容，防止部分浏览器在 foreignObject 内误展示
  const closedDetails = clone.querySelectorAll('details');
  for (let di = 0; di < closedDetails.length; di++) {
    if (closedDetails[di].hasAttribute('open')) continue;
    const kids = closedDetails[di].children;
    for (let dc = 0; dc < kids.length; dc++) {
      const tag = kids[dc].tagName ? kids[dc].tagName.toLowerCase() : '';
      if (tag !== 'summary') {
        (kids[dc] as HTMLElement).style.display = 'none';
      }
    }
  }

  // 收集样式表
  let cssText = '';
  for (let s = 0; s < document.styleSheets.length; s++) {
    try {
      const rules = document.styleSheets[s].cssRules;
      for (let r = 0; r < rules.length; r++) {
        cssText += rules[r].cssText + '\n';
      }
    } catch {
      // 跨域样式表忽略
    }
  }

  // XML 特殊字符转义（防止样式内 &skey 等导致 XMLSerializer 失败）
  cssText = cssText.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // 外部图片转 dataURL 避免跨域 taint canvas
  const imgs = clone.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i++) {
    const src = imgs[i].getAttribute('src') || '';
    if (/^(data:|blob:)/.test(src)) continue;
    try {
      const res = await fetch(src, { referrerPolicy: 'no-referrer' });
      if (res.ok) {
        const dataUrl = await blobToDataURL(await res.blob());
        imgs[i].setAttribute('src', dataUrl);
      }
    } catch {
      // 无法获取则保留原地址
    }
  }

  const wrap = document.createElement('div');
  wrap.appendChild(clone);
  const xml = new XMLSerializer().serializeToString(wrap);

  const width = element.offsetWidth || 500;
  const height = element.offsetHeight || 300;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"` +
    ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<style>${cssText}</style>` +
    `<foreignObject width="100%" height="100%" x="0" y="0">${xml}</foreignObject></svg>`;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('SVG 光栅化失败'));
    image.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 Canvas 上下文');

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return format === 'jpeg'
    ? canvas.toDataURL('image/jpeg', 0.95)
    : canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

let offscreenHost: HTMLElement | null = null;
function getOffscreenHost(): HTMLElement {
  if (!offscreenHost) {
    offscreenHost = document.createElement('div');
    offscreenHost.setAttribute('data-inkroll-host', '');
    offscreenHost.style.cssText =
      'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0;z-index:-1;';
    document.body.appendChild(offscreenHost);
  }
  return offscreenHost;
}

export async function renderToImage(
  markdown: string,
  options?: InkrollOptions,
  extensions?: CoreExtensions
): Promise<string> {
  const cfg = normalizeConfig(options);
  const card = buildCard(markdown, options, extensions);
  const host = getOffscreenHost();
  host.appendChild(card);

  try {
    if (extensions?.mermaidRenderer) {
      await processMermaid(card, extensions);
    }
    await new Promise((r) => setTimeout(r, 120));
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 50));

    return await exportElement(card, cfg.exportScale, cfg.exportFormat);
  } finally {
    host.removeChild(card);
  }
}

export async function downloadCardImage(
  markdown: string,
  options?: InkrollOptions,
  extensions?: CoreExtensions
): Promise<void> {
  const cfg = normalizeConfig(options);
  const dataUrl = await renderToImage(markdown, options, extensions);

  const now = new Date();
  const stamp =
    `${now.getFullYear()}` +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  const baseName = options?.fileName ? `${options.fileName}-` : 'inkroll-';
  const name = `${baseName}${stamp}.${cfg.exportFormat === 'jpeg' ? 'jpg' : 'png'}`;

  downloadDataUrl(dataUrl, name);
}
