import katex from 'katex';
import { createMarkdownParser, parseMarkdown, type MathBlock } from './parser';
import { normalizeConfig, THEMES, THEME_VARS } from './themes';
import type { CoreExtensions, InkrollOptions } from './types';

function renderMathString(raw: string, display: boolean): string {
  const katexLib = typeof katex !== 'undefined' ? katex : (window as any).katex;
  if (!katexLib || !katexLib.renderToString) return raw;

  let tex = raw;
  if (raw.startsWith('$$') && raw.endsWith('$$')) {
    tex = raw.slice(2, -2);
    display = true;
  } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
    tex = raw.slice(2, -2);
    display = true;
  } else if (raw.startsWith('$') && raw.endsWith('$')) {
    tex = raw.slice(1, -1);
  } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
    tex = raw.slice(2, -2);
  }

  try {
    return katexLib.renderToString(tex, { throwOnError: false, displayMode: display });
  } catch {
    return raw;
  }
}

export function processMath(root: HTMLElement, mathBlocks: MathBlock[]): void {
  if (!root.querySelectorAll) return;
  const spans = root.querySelectorAll('span');
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const names = span.getAttributeNames ? span.getAttributeNames() : [];
    let hit: RegExpExecArray | null = null;
    for (let k = 0; k < names.length; k++) {
      const mm = /^data-(m|md)(\d+)$/.exec(names[k]);
      if (mm) {
        hit = mm;
        break;
      }
    }
    if (!hit) continue;
    const block = mathBlocks[Number(hit[2])];
    if (!block) continue;
    const holder = document.createElement('span');
    holder.innerHTML = renderMathString(block.raw, block.display);
    span.replaceWith(holder);
  }
}

export function processImages(root: HTMLElement): void {
  const imgs = root.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const wrap = document.createElement('span');
    wrap.className = 'md-img-wrap';
    if (img.parentNode) {
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      if (img.alt) {
        const cap = document.createElement('span');
        cap.className = 'md-img-cap';
        cap.textContent = img.alt;
        wrap.appendChild(cap);
      }
    }
  }
}

export function processTables(root: HTMLElement): void {
  const tables = root.querySelectorAll('table');
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    const w = document.createElement('div');
    w.className = 'md-table-wrap';
    if (t.parentNode) {
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    }
  }
}

export async function processMermaid(root: HTMLElement, extensions?: CoreExtensions): Promise<void> {
  if (!extensions?.mermaidRenderer) return;
  const blocks = root.querySelectorAll<HTMLElement>('.md-mermaid-block');
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const code = decodeURIComponent(b.getAttribute('data-mermaid-code') || '');
    if (code) {
      try {
        const svg = await extensions.mermaidRenderer(code);
        b.innerHTML = svg;
      } catch (err) {
        console.warn('Mermaid rendering failed', err);
      }
    }
  }
}

const sharedMd = createMarkdownParser();

export function buildCard(
  markdown: string,
  options?: InkrollOptions,
  extensions?: CoreExtensions
): HTMLElement {
  const cfg = normalizeConfig(options);
  const theme = THEMES[cfg.theme] || THEMES['classic-white'];
  const vars = THEME_VARS[cfg.theme] || THEME_VARS['classic-white'];

  const card = document.createElement('div');
  card.className = `inkroll-card pad-${cfg.padding}`;
  card.setAttribute('data-inkroll-card', 'true');
  card.style.width = `${cfg.cardWidth}px`;
  card.style.backgroundColor = cfg.customBgColor || theme.bg;
  card.style.color = cfg.customTextColor || theme.text;
  card.style.borderRadius = `${cfg.borderRadius}px`;
  card.style.borderColor = theme.border;
  card.style.boxShadow = theme.shadow;

  for (const k in vars) {
    card.style.setProperty(k, vars[k]);
  }

  if (cfg.showTitle && cfg.titleText) {
    const titleBox = document.createElement('div');
    titleBox.className = 'card-title';
    const titleH = document.createElement('h1');
    titleH.textContent = cfg.titleText;
    titleBox.appendChild(titleH);
    card.appendChild(titleBox);
  }

  const body = document.createElement('div');
  const isCustomSize = typeof cfg.fontSize === 'number' && isFinite(cfg.fontSize);
  const legacySizeClass = typeof cfg.fontSize === 'string' && cfg.fontSize !== 'base' ? ` fs-${cfg.fontSize}` : '';
  body.className = `md-body md-font-${cfg.fontFamily}${legacySizeClass}${cfg.lineHeight !== 'relaxed' ? ` lh-${cfg.lineHeight}` : ''}`;
  if (isCustomSize) {
    body.style.fontSize = `${cfg.fontSize}px`;
  }

  const { html, mathBlocks } = parseMarkdown(markdown, sharedMd);
  body.innerHTML = html;

  processMath(body, mathBlocks);
  processImages(body);
  processTables(body);
  if (extensions?.mermaidRenderer) {
    void processMermaid(body, extensions);
  }

  card.appendChild(body);

  if (cfg.showWatermark && cfg.watermarkText) {
    const footer = document.createElement('div');
    footer.className = `card-footer ${cfg.watermarkPosition === 'bottom-center' ? 'center' : 'right'}`;
    const span = document.createElement('span');
    span.textContent = cfg.watermarkText;
    footer.appendChild(span);
    card.appendChild(footer);
  }

  return card;
}
