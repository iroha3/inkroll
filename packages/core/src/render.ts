import { getKatex } from './deps';
import { createMarkdownParser, parseMarkdown, type MathBlock } from './parser';
import { normalizeConfig, THEMES, THEME_VARS } from './themes';
import type { CoreExtensions, InkrollOptions, ScenePreset, SceneSpec } from './types';

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
 * 全球通用社交场景画幅规格表（可无限扩展）
 * 小红书标准：1242 × 1660 px（3:4 黄金画幅）
 * 朋友圈标准：1242 × 1242 px（1:1 方形画幅）
 * 幻灯片标准：1920 × 1080 px（16:9 横版画幅）
 * 竖屏海报：1080 × 1920 px（9:16 竖版画幅）
 */
export const SCENE_SPECS: Record<ScenePreset, SceneSpec> = {
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书卡片',
    shortName: '小红书',
    ratioLabel: '3:4',
    width: 414,
    height: 1660 / 3, // ~553.3333333333334
    exportWidth: 1242,
    exportHeight: 1660,
    description: '小红书 3:4 黄金图文规格 (1242×1660)',
  },
  square: {
    id: 'square',
    name: '朋友圈卡片',
    shortName: '朋友圈',
    ratioLabel: '1:1',
    width: 414,
    height: 414,
    exportWidth: 1242,
    exportHeight: 1242,
    description: '朋友圈 / 社交媒体方形卡片 (1242×1242)',
  },
  slide: {
    id: 'slide',
    name: '横版幻灯',
    shortName: '幻灯片',
    ratioLabel: '16:9',
    width: 640,
    height: 360,
    exportWidth: 1920,
    exportHeight: 1080,
    description: '公众号 / 知识图解 / 幻灯片 (1920×1080)',
  },
  story: {
    id: 'story',
    name: '竖屏海报',
    shortName: '海报',
    ratioLabel: '9:16',
    width: 360,
    height: 640,
    exportWidth: 1080,
    exportHeight: 1920,
    description: '快手 / 故事 / 竖屏海报 (1080×1920)',
  },
  custom: {
    id: 'custom',
    name: '自定义卡片',
    shortName: '自定义',
    ratioLabel: '自定义',
    width: 414,
    height: 1660 / 3,
    exportWidth: 1242,
    exportHeight: 1660,
    description: '自定义尺寸与比例',
  },
};

/**
 * 智能场景分页引擎：按照指定场景规格（默认小红书 1242×1660），
 * 在完整段落/块边界处安全断页，绝不断字断行；所有切片卡片统一高度、页脚齐平沉底，
 * 彻底规避多图滑动抖动与平台压缩变形问题。
 */
export async function buildCardPages(
  markdown: string,
  options?: InkrollOptions,
  extensions?: CoreExtensions
): Promise<HTMLElement[]> {
  const cfg = normalizeConfig(options);
  const theme = THEMES[cfg.theme] || THEMES['classic-white'];
  const vars = THEME_VARS[cfg.theme] || THEME_VARS['classic-white'];

  const sceneKey = options?.scene || cfg.scene || 'xiaohongshu';
  const scene = SCENE_SPECS[sceneKey] || SCENE_SPECS.xiaohongshu;

  // 严格采用场景标准逻辑宽高与导出像素
  const targetWidth = scene.width;
  const targetHeight = scene.height;
  const exportTargetW = scene.exportWidth;
  const exportTargetH = scene.exportHeight;

  // 先构建卡片并等待异步图表完成
  const fullCard = buildCard(markdown, { ...options, cardWidth: targetWidth }, extensions);
  if (extensions?.mermaidRenderer) {
    await processMermaid(fullCard, extensions);
  }

  // 统一卡片为 flex 容器，使得正文与页脚自适应且画幅严格统一
  const formatPagedCard = (card: HTMLElement) => {
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.boxSizing = 'border-box';
    card.style.width = `${targetWidth}px`;
    card.style.height = `${Math.round(targetHeight)}px`;
    card.style.minHeight = `${Math.round(targetHeight)}px`;
    card.style.maxHeight = `${Math.round(targetHeight)}px`;
    card.style.overflow = 'hidden';

    // 绑定高精度光栅化元数据
    card.setAttribute('data-target-width', String(targetWidth));
    card.setAttribute('data-target-height', String(targetHeight));
    card.setAttribute('data-export-width', String(exportTargetW));
    card.setAttribute('data-export-height', String(exportTargetH));

    const body = card.querySelector('.md-body') as HTMLElement | null;
    if (body) {
      body.style.display = 'block';
    }

    const footer = card.querySelector('.card-footer') as HTMLElement | null;
    if (footer) {
      footer.style.marginTop = 'auto';
    }
  };

  // 非浏览器环境安全降级为单卡片
  if (typeof document === 'undefined' || !document.body) {
    formatPagedCard(fullCard);
    return [fullCard];
  }

  const bodyEl = fullCard.querySelector('.md-body');
  if (!bodyEl) {
    formatPagedCard(fullCard);
    return [fullCard];
  }

  const children = Array.from(bodyEl.children) as HTMLElement[];
  if (children.length <= 1) {
    formatPagedCard(fullCard);
    return [fullCard];
  }

  // 临时挂载到离屏容器中测量各块实际像素高度
  const host = document.createElement('div');
  host.style.cssText =
    `position:fixed;left:-99999px;top:0;width:${targetWidth}px;overflow:hidden;pointer-events:none;opacity:0;z-index:-1;`;
  host.appendChild(fullCard);
  document.body.appendChild(host);

  // 计算固定装饰层的高度（padding、title、footer）
  const paddingMap: Record<string, number> = { compact: 40, normal: 56, spacious: 72 };
  const padH = paddingMap[cfg.padding] || 56;
  // 恒定预留标准页脚高度槽位（44px）：确保无论是否启用落款/页脚，单页净正文容积与画幅总高严格恒定
  const footerH = 44;
  const titleH = cfg.showTitle && cfg.titleText ? 64 : 0;

  // 1. 统计所有块元素的真实渲染高度与边距
  const blockHeights: number[] = [];
  let totalContentHeight = 0;

  for (const child of children) {
    const rect = child.getBoundingClientRect();
    const h = rect.height || 36;
    const computed = window.getComputedStyle(child);
    const mt = parseFloat(computed.marginTop) || 0;
    const mb = parseFloat(computed.marginBottom) || 0;
    const blockTotalH = Math.ceil(h + mt + mb);
    blockHeights.push(blockTotalH);
    totalContentHeight += blockTotalH;
  }

  document.body.removeChild(host);

  // 2. 严格基于目标总高度计算单页净正文容量
  const pageCapacity = Math.max(200, targetHeight - padH - footerH);
  const firstPageCapacity = Math.max(150, pageCapacity - titleH);

  // 若整篇内容在单张目标高度内完全容纳，直接保持单张标准黄金比例卡片
  if (totalContentHeight <= firstPageCapacity) {
    formatPagedCard(fullCard);
    return [fullCard];
  }

  // 3. 超出单页容量时，计算目标页数并按块边界安全断页
  const targetPages = Math.max(2, Math.ceil((totalContentHeight + titleH) / pageCapacity));
  const avgTargetCapacity = (totalContentHeight + titleH) / targetPages;

  const pageGroups: HTMLElement[][] = [];
  let currentGroup: HTMLElement[] = [];
  let currentHeight = 0;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const blockH = blockHeights[i];
    const isFirst = pageGroups.length === 0;
    const maxLimit = isFirst ? firstPageCapacity : pageCapacity;
    const remainingPages = targetPages - pageGroups.length;

    // 若已经达到最后一页，剩余所有块全部归入当前页
    if (remainingPages <= 1) {
      currentGroup.push(child);
      currentHeight += blockH;
      continue;
    }

    // 软阈值（尽量均摊）：若已接近均摊期望且后面块足够，或超过当前页硬上限
    const softLimit = isFirst ? Math.max(150, avgTargetCapacity - titleH) : avgTargetCapacity;
    const exceedsHardLimit = currentGroup.length > 0 && currentHeight + blockH > maxLimit;
    const reachesSoftLimit = currentGroup.length > 0 && currentHeight + blockH >= softLimit && (children.length - i) >= remainingPages;

    if (exceedsHardLimit || (reachesSoftLimit && currentHeight >= softLimit * 0.85)) {
      pageGroups.push(currentGroup);
      currentGroup = [child];
      currentHeight = blockH;
    } else {
      currentGroup.push(child);
      currentHeight += blockH;
    }
  }

  if (currentGroup.length > 0) {
    pageGroups.push(currentGroup);
  }

  // 清理各切片页首尾无意义的孤悬水平分割线
  for (const group of pageGroups) {
    while (group.length > 0 && group[group.length - 1].tagName.toLowerCase() === 'hr') {
      group.pop();
    }
    while (group.length > 0 && group[0].tagName.toLowerCase() === 'hr') {
      group.shift();
    }
  }

  if (pageGroups.length <= 1) {
    formatPagedCard(fullCard);
    return [fullCard];
  }

  const totalPages = pageGroups.length;
  const resultCards: HTMLElement[] = [];

  for (let i = 0; i < totalPages; i++) {
    const card = createCardFrame({ ...cfg, cardWidth: targetWidth }, theme, vars);

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

    if (cfg.showWatermark && cfg.watermarkText) {
      const pageWatermark = `${i + 1} / ${totalPages} · ${cfg.watermarkText}`;
      card.appendChild(createFooter(pageWatermark, cfg.watermarkPosition));
    }

    formatPagedCard(card);
    resultCards.push(card);
  }

  return resultCards;
}
