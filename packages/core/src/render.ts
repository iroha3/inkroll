import { getKatex } from './deps';
import { createMarkdownParser, parseMarkdown, type MathBlock } from './parser';
import { normalizeConfig, THEMES, THEME_VARS } from './themes';
import type { CoreExtensions, InkrollOptions } from './types';

function renderMathString(raw: string, display: boolean): string {
  const katexLib = getKatex();
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

let sharedMdInstance: any = null;
function getSharedMd() {
  if (!sharedMdInstance) {
    sharedMdInstance = createMarkdownParser();
  }
  return sharedMdInstance;
}

function createCardFrame(
  cfg: ReturnType<typeof normalizeConfig>,
  theme: (typeof THEMES)[keyof typeof THEMES],
  vars: (typeof THEME_VARS)[keyof typeof THEME_VARS]
): HTMLElement {
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
  return card;
}

function createBodyContainer(cfg: ReturnType<typeof normalizeConfig>): HTMLElement {
  const body = document.createElement('div');
  const isCustomSize = typeof cfg.fontSize === 'number' && isFinite(cfg.fontSize);
  const legacySizeClass = typeof cfg.fontSize === 'string' && cfg.fontSize !== 'base' ? ` fs-${cfg.fontSize}` : '';
  body.className = `md-body md-font-${cfg.fontFamily}${legacySizeClass}${cfg.lineHeight !== 'relaxed' ? ` lh-${cfg.lineHeight}` : ''}`;
  if (isCustomSize) {
    body.style.fontSize = `${cfg.fontSize}px`;
  }
  return body;
}

function createFooter(text: string, position: 'bottom-center' | 'bottom-right' = 'bottom-right'): HTMLElement {
  const footer = document.createElement('div');
  footer.className = `card-footer ${position === 'bottom-center' ? 'center' : 'right'}`;
  const span = document.createElement('span');
  span.textContent = text;
  footer.appendChild(span);
  return footer;
}

export function buildCard(
  markdown: string,
  options?: InkrollOptions,
  extensions?: CoreExtensions
): HTMLElement {
  const cfg = normalizeConfig(options);
  const theme = THEMES[cfg.theme] || THEMES['classic-white'];
  const vars = THEME_VARS[cfg.theme] || THEME_VARS['classic-white'];

  const card = createCardFrame(cfg, theme, vars);

  if (cfg.showTitle && cfg.titleText) {
    const titleBox = document.createElement('div');
    titleBox.className = 'card-title';
    const titleH = document.createElement('h1');
    titleH.textContent = cfg.titleText;
    titleBox.appendChild(titleH);
    card.appendChild(titleBox);
  }

  const body = createBodyContainer(cfg);
  const { html, mathBlocks } = parseMarkdown(markdown, getSharedMd());
  body.innerHTML = html;

  processMath(body, mathBlocks);
  processImages(body);
  processTables(body);
  if (extensions?.mermaidRenderer) {
    void processMermaid(body, extensions);
  }

  card.appendChild(body);

  if (cfg.showWatermark && cfg.watermarkText) {
    card.appendChild(createFooter(cfg.watermarkText, cfg.watermarkPosition));
  }

  return card;
}

/**
 * 智能分页切片：按照社交媒体（小红书 / 微博）黄金比例，在完整段落/块边界处安全断页，
 * 绝不断字断行，并将所有切片卡片的高度严格统一（通过 Flexbox 布局及 Footer 自动沉底），
 * 确保多图滑动切换时稳定无抖动，并在各平台（小红书多图轮播）保持划一的画幅比例。
 */
export async function buildCardPages(
  markdown: string,
  options?: InkrollOptions,
  extensions?: CoreExtensions
): Promise<HTMLElement[]> {
  const cfg = normalizeConfig(options);
  const theme = THEMES[cfg.theme] || THEMES['classic-white'];
  const vars = THEME_VARS[cfg.theme] || THEME_VARS['classic-white'];

  // 先构建完整卡片并等待异步图表完成
  const fullCard = buildCard(markdown, options, extensions);
  if (extensions?.mermaidRenderer) {
    await processMermaid(fullCard, extensions);
  }

  // 社交平台单张图片黄金目标总高度（基于卡片宽度，对应 3:4 ~ 1:1.4 比例，例如 500px 对应 700px）
  const baseTargetHeight = Math.max(680, Math.round(cfg.cardWidth * 1.4));

  // 统一卡片为 flex 容器，使得正文与页脚自适应且高度稳定一致
  const formatPagedCard = (card: HTMLElement, height: number) => {
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.boxSizing = 'border-box';
    card.style.height = `${height}px`;
    card.style.minHeight = `${height}px`;

    const body = card.querySelector('.md-body') as HTMLElement | null;
    if (body) {
      body.style.flex = '1';
      body.style.display = 'flex';
      body.style.flexDirection = 'column';
    }

    const footer = card.querySelector('.card-footer') as HTMLElement | null;
    if (footer) {
      footer.style.marginTop = 'auto';
    }
  };

  // 非浏览器环境安全降级为单卡片
  if (typeof document === 'undefined' || !document.body) {
    formatPagedCard(fullCard, baseTargetHeight);
    return [fullCard];
  }

  const bodyEl = fullCard.querySelector('.md-body');
  if (!bodyEl) {
    formatPagedCard(fullCard, baseTargetHeight);
    return [fullCard];
  }

  const children = Array.from(bodyEl.children) as HTMLElement[];
  if (children.length <= 1) {
    // 即使只有单个块，也统一为标准黄金高度
    formatPagedCard(fullCard, baseTargetHeight);
    return [fullCard];
  }

  // 临时挂载到离屏容器中测量各块实际像素高度
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0;z-index:-1;';
  host.appendChild(fullCard);
  document.body.appendChild(host);

  // 计算每页的正文净高度预算
  const paddingMap: Record<string, number> = { compact: 48, normal: 64, spacious: 80 };
  const padH = paddingMap[cfg.padding] || 64;
  const footerH = cfg.showWatermark ? 60 : 0;
  const titleH = cfg.showTitle && cfg.titleText ? 72 : 0;

  const pageBudgetNormal = Math.max(460, baseTargetHeight - padH - footerH);
  const pageBudgetFirst = Math.max(400, baseTargetHeight - padH - footerH - titleH);

  const pageGroups: HTMLElement[][] = [];
  let currentGroup: HTMLElement[] = [];
  let currentHeight = 0;

  for (const child of children) {
    const rect = child.getBoundingClientRect();
    const h = rect.height || 40;
    const computed = window.getComputedStyle(child);
    const mt = parseFloat(computed.marginTop) || 0;
    const mb = parseFloat(computed.marginBottom) || 0;
    const blockTotalH = h + mt + mb;

    const currentBudget = pageGroups.length === 0 ? pageBudgetFirst : pageBudgetNormal;

    // 当加上当前块会超过单页正文高度预算，且当前页已有至少一个块时，进行块完整边界安全断页
    if (currentGroup.length > 0 && currentHeight + blockTotalH > currentBudget) {
      pageGroups.push(currentGroup);
      currentGroup = [child];
      currentHeight = blockTotalH;
    } else {
      currentGroup.push(child);
      currentHeight += blockTotalH;
    }
  }

  if (currentGroup.length > 0) {
    pageGroups.push(currentGroup);
  }

  document.body.removeChild(host);

  // 若总高度并未超过单张预算且只分了 1 组，直接返回原卡片并应用统一高度
  if (pageGroups.length <= 1) {
    formatPagedCard(fullCard, baseTargetHeight);
    return [fullCard];
  }

  const totalPages = pageGroups.length;
  const resultCards: HTMLElement[] = [];

  for (let i = 0; i < totalPages; i++) {
    const card = createCardFrame(cfg, theme, vars);

    // 第一页保留大标题（若启用）
    if (i === 0 && cfg.showTitle && cfg.titleText) {
      const titleBox = document.createElement('div');
      titleBox.className = 'card-title';
      const titleH = document.createElement('h1');
      titleH.textContent = cfg.titleText;
      titleBox.appendChild(titleH);
      card.appendChild(titleBox);
    }

    const body = createBodyContainer(cfg);
    for (const child of pageGroups[i]) {
      body.appendChild(child.cloneNode(true));
    }
    card.appendChild(body);

    // 页脚增加多图页码与落款：例如 "1 / 3 · By InkRoll"
    if (cfg.showWatermark && cfg.watermarkText) {
      const pageWatermark = `${i + 1} / ${totalPages} · ${cfg.watermarkText}`;
      card.appendChild(createFooter(pageWatermark, cfg.watermarkPosition));
    }

    resultCards.push(card);
  }

  // 离屏测量所有组装后卡片的实际自然高度，寻找最大高度（至少为 baseTargetHeight）
  const measureHost = document.createElement('div');
  measureHost.style.cssText =
    'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0;z-index:-1;';
  for (const card of resultCards) {
    measureHost.appendChild(card);
  }
  document.body.appendChild(measureHost);

  let maxCardHeight = baseTargetHeight;
  for (const card of resultCards) {
    const naturalHeight = card.offsetHeight || card.scrollHeight;
    if (naturalHeight > maxCardHeight) {
      maxCardHeight = naturalHeight;
    }
  }

  document.body.removeChild(measureHost);

  // 将所有卡片的高度严格设定为同一高度，并调整 flex 撑开与 footer 沉底
  for (const card of resultCards) {
    formatPagedCard(card, maxCardHeight);
  }

  return resultCards;
}
