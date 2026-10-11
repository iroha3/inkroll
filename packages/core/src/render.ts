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
  if (children.length === 0) {
    formatPagedCard(fullCard);
    return [fullCard];
  }

  // 1. 细粒度行级/条目级流元素模型（行驱动拆解）
  type FlowItem =
    | {
        type: 'block';
        element: HTMLElement;
      }
    | {
        type: 'list-item';
        element: HTMLLIElement;
        listTag: 'ul' | 'ol';
        listClass: string;
        index: number;
      };

  const flowItems: FlowItem[] = [];
  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    if (tag === 'ul' || tag === 'ol') {
      const listTag = tag as 'ul' | 'ol';
      const listClass = child.className || '';
      const lis = Array.from(child.children) as HTMLLIElement[];
      lis.forEach((li, idx) => {
        flowItems.push({
          type: 'list-item',
          element: li,
          listTag,
          listClass,
          index: idx + 1,
        });
      });
    } else {
      flowItems.push({
        type: 'block',
        element: child,
      });
    }
  }

  // 2. 临时挂载到离屏容器中精确度量实际像素高度
  const measureHost = document.createElement('div');
  measureHost.className = fullCard.className;
  measureHost.style.cssText =
    `position:fixed;left:-99999px;top:0;width:${targetWidth}px;overflow:hidden;pointer-events:none;opacity:0;z-index:-1;`;
  const measureBody = createBodyContainer(cfg);
  measureHost.appendChild(measureBody);
  document.body.appendChild(measureHost);

  const measureElement = (el: HTMLElement): number => {
    measureBody.appendChild(el);
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    const mt = parseFloat(computed.marginTop) || 0;
    const mb = parseFloat(computed.marginBottom) || 0;
    const h = Math.ceil((rect.height || 24) + mt + mb);
    measureBody.removeChild(el);
    return h;
  };

  const measureFlowItem = (item: FlowItem): number => {
    if (item.type === 'list-item') {
      const tempList = document.createElement(item.listTag);
      if (item.listClass) tempList.className = item.listClass;
      tempList.appendChild(item.element);
      measureBody.appendChild(tempList);

      const rect = item.element.getBoundingClientRect();
      const computed = window.getComputedStyle(item.element);
      const mt = parseFloat(computed.marginTop) || 0;
      const mb = parseFloat(computed.marginBottom) || 0;
      const h = Math.ceil((rect.height || 24) + mt + mb);

      tempList.removeChild(item.element);
      measureBody.removeChild(tempList);
      return h;
    }
    return measureElement(item.element);
  };

  // 段落句级/行级安全拆分器：当长段落跨页时，拆出当前页能容纳的最大句段
  const trySplitParagraph = (
    p: HTMLElement,
    availableHeight: number
  ): { fitPart: HTMLElement; remainPart: HTMLElement } | null => {
    if (availableHeight < 32) return null;
    if (p.querySelector('img, pre, svg, table, canvas')) return null;

    const rawHtml = p.innerHTML;
    let chunks = rawHtml.split(/(?<=[。！？；\n])/);
    if (chunks.length <= 1) {
      chunks = rawHtml.split(/(?<=[，,、])/);
      if (chunks.length <= 1) return null;
    }

    let bestFitIndex = -1;
    for (let i = 1; i < chunks.length; i++) {
      const testP = p.cloneNode(false) as HTMLElement;
      testP.innerHTML = chunks.slice(0, i).join('');
      const h = measureElement(testP);
      if (h <= availableHeight) {
        bestFitIndex = i;
      } else {
        break;
      }
    }

    if (bestFitIndex <= 0) return null;

    const fitP = p.cloneNode(false) as HTMLElement;
    fitP.innerHTML = chunks.slice(0, bestFitIndex).join('');

    const remainP = p.cloneNode(false) as HTMLElement;
    remainP.innerHTML = chunks.slice(bestFitIndex).join('');

    return { fitPart: fitP, remainPart: remainP };
  };

  const isIntroOrHeading = (el: HTMLElement): boolean => {
    const tag = el.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return true;
    const text = (el.textContent || '').trim();
    if (text.endsWith('：') || text.endsWith(':')) return true;
    return false;
  };

  // 3. 计算单页净正文容积
  const paddingMap: Record<string, number> = { compact: 40, normal: 56, spacious: 72 };
  const padH = paddingMap[cfg.padding] || 56;
  const footerH = 44; // 恒定预留页脚槽位
  const titleH = cfg.showTitle && cfg.titleText ? 64 : 0;

  const pageCapacity = Math.max(200, targetHeight - padH - footerH);
  const firstPageCapacity = Math.max(150, pageCapacity - titleH);

  // 预判整篇总高：若单页即可完整容纳，直接保持单张卡片
  const totalContentHeight = flowItems.reduce((acc, it) => acc + measureFlowItem(it), 0);
  if (totalContentHeight <= firstPageCapacity) {
    document.body.removeChild(measureHost);
    formatPagedCard(fullCard);
    return [fullCard];
  }

  // 4. 行驱动充盈贪心排版引擎（消除底部大面积悬空）
  const pageGroups: FlowItem[][] = [];
  let currentPageItems: FlowItem[] = [];
  let currentHeight = 0;

  const queue: FlowItem[] = [...flowItems];

  while (queue.length > 0) {
    const item = queue.shift()!;
    const isFirst = pageGroups.length === 0;
    const maxLimit = isFirst ? firstPageCapacity : pageCapacity;
    const itemH = measureFlowItem(item);

    // 4.1 当前项能直接放入本页
    if (currentHeight + itemH <= maxLimit) {
      currentPageItems.push(item);
      currentHeight += itemH;
      continue;
    }

    // 4.2 放不下时，尝试行级拆分段落
    const remainingSpace = maxLimit - currentHeight;
    if (item.type === 'block' && item.element.tagName.toLowerCase() === 'p') {
      const splitRes = trySplitParagraph(item.element, remainingSpace);
      if (splitRes) {
        currentPageItems.push({ type: 'block', element: splitRes.fitPart });
        queue.unshift({ type: 'block', element: splitRes.remainPart });

        pageGroups.push(currentPageItems);
        currentPageItems = [];
        currentHeight = 0;
        continue;
      }
    }

    // 4.3 无法拆分或剩余空间不足
    if (currentPageItems.length > 0) {
      // 孤行标题/冒号引言保护：避免小标题独自孤悬在页面最底端
      const last = currentPageItems[currentPageItems.length - 1];
      if (isIntroOrHeading(last.element) && currentPageItems.length > 1) {
        const orphan = currentPageItems.pop()!;
        queue.unshift(item);
        queue.unshift(orphan);
        pageGroups.push(currentPageItems);
        currentPageItems = [];
        currentHeight = 0;
        continue;
      }

      queue.unshift(item);
      pageGroups.push(currentPageItems);
      currentPageItems = [];
      currentHeight = 0;
    } else {
      // 单项本身极高（如特大图表或代码块），本页为空时强制承接
      currentPageItems.push(item);
      pageGroups.push(currentPageItems);
      currentPageItems = [];
      currentHeight = 0;
    }
  }

  if (currentPageItems.length > 0) {
    pageGroups.push(currentPageItems);
  }

  document.body.removeChild(measureHost);

  // 5. 清理各页首尾无意义的孤悬分割线
  for (const group of pageGroups) {
    while (
      group.length > 0 &&
      group[group.length - 1].type === 'block' &&
      group[group.length - 1].element.tagName.toLowerCase() === 'hr'
    ) {
      group.pop();
    }
    while (
      group.length > 0 &&
      group[0].type === 'block' &&
      group[0].element.tagName.toLowerCase() === 'hr'
    ) {
      group.shift();
    }
  }

  if (pageGroups.length <= 1) {
    formatPagedCard(fullCard);
    return [fullCard];
  }

  // 6. 装配各切片页 DOM
  const appendItemsToBody = (body: HTMLElement, items: FlowItem[]) => {
    let currentList: { tag: 'ul' | 'ol'; listClass: string; el: HTMLElement } | null = null;

    for (const item of items) {
      if (item.type === 'list-item') {
        if (
          !currentList ||
          currentList.tag !== item.listTag ||
          currentList.listClass !== item.listClass
        ) {
          currentList = {
            tag: item.listTag,
            listClass: item.listClass,
            el: document.createElement(item.listTag),
          };
          if (item.listClass) currentList.el.className = item.listClass;
          if (item.listTag === 'ol' && item.index > 1) {
            currentList.el.setAttribute('start', String(item.index));
          }
          body.appendChild(currentList.el);
        }
        currentList.el.appendChild(item.element.cloneNode(true));
      } else {
        currentList = null;
        body.appendChild(item.element.cloneNode(true));
      }
    }
  };

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
    appendItemsToBody(body, pageGroups[i]);
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
