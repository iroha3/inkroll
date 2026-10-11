import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CardConfig, RenderMode } from '../types';
import { InkrollCore } from '@inkroll/core';
import mermaid from 'mermaid';

interface CardPreviewProps {
  content: string;
  config: CardConfig;
  cardRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  renderMode: RenderMode;
  onPageCountChange?: (count: number) => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  content,
  config,
  cardRef,
  zoomLevel,
  renderMode,
  onPageCountChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [pagesTotal, setPagesTotal] = useState<number>(1);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: config.theme.includes('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
    });
  }, [config.theme]);

  // 1. 核心渲染逻辑：长图模式为垂直卷轴，分页模式为横向流画廊
  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;

    const mermaidRenderer = async (code: string) => {
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.render(id, code);
      return svg;
    };

    const renderCanvas = async () => {
      if (renderMode === 'paged') {
        try {
          const pages = await InkrollCore.buildPages(content, config, { mermaidRenderer });
          if (cancelled || !hostRef.current) return;

          hostRef.current.innerHTML = '';
          const total = pages.length;
          setPagesTotal(total);
          setActivePage(1);

          // 横向滑轨容器：卡片一字排开，支持卡片吸附
          const container = document.createElement('div');
          container.className =
            'flex flex-row items-center gap-10 py-6 px-4 md:px-8 snap-x snap-proximity select-none';

          pages.forEach((pageEl, idx) => {
            const pageWrapper = document.createElement('div');
            pageWrapper.className =
              'flex flex-col items-center group relative shrink-0 snap-center transition-transform hover:-translate-y-1 duration-200';
            pageWrapper.setAttribute('data-page-index', String(idx + 1));

            const sceneLabel =
              config.scene === 'square'
                ? '朋友圈 1:1 · 1242×1242'
                : config.scene === 'slide'
                ? '幻灯片 16:9 · 1920×1080'
                : config.scene === 'story'
                ? '竖屏海报 9:16 · 1080×1920'
                : '小红书 3:4 · 1242×1660';

            const badge = document.createElement('div');
            badge.className =
              'w-full flex items-center justify-between text-[11px] font-mono text-neutral-400 select-none mb-2.5 px-1';
            badge.innerHTML = `
              <span class="inline-flex items-center gap-1.5 font-semibold text-neutral-700 bg-black/[0.06] px-2.5 py-0.5 rounded-full shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                P.${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}
              </span>
              <span class="text-[10px] font-medium tracking-wide text-neutral-400">
                ${sceneLabel}
              </span>
            `;

            pageWrapper.appendChild(badge);
            pageWrapper.appendChild(pageEl);
            container.appendChild(pageWrapper);
          });

          hostRef.current.appendChild(container);

          if (cardRef) {
            (cardRef as any).current = pages[0] || null;
          }
          onPageCountChange?.(total);
        } catch (err) {
          console.error('Failed to build pages:', err);
        }
      } else {
        hostRef.current.innerHTML = '';
        setPagesTotal(1);
        setActivePage(1);

        const card = InkrollCore.render(content, config, { mermaidRenderer });
        hostRef.current.appendChild(card);
        if (cardRef) {
          (cardRef as any).current = card;
        }
        onPageCountChange?.(1);
      }
    };

    void renderCanvas();

    return () => {
      cancelled = true;
    };
  }, [content, config, renderMode, cardRef, onPageCountChange]);

  // 2. 分页模式下平滑映射鼠标滚轮（纵向滚轮转横向游走）
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (renderMode !== 'paged') return;
      if (e.ctrlKey || e.metaKey) return; // 允许触控缩放快捷键

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [renderMode]);

  // 3. 动态监测当前可见的卡片索引
  const handleScroll = () => {
    if (!scrollRef.current || renderMode !== 'paged' || pagesTotal <= 1) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const progress = scrollLeft / maxScroll;
    const pageIndex = Math.min(pagesTotal, Math.max(1, Math.round(progress * (pagesTotal - 1)) + 1));
    setActivePage(pageIndex);
  };

  // 4. 辅助滑动翻页
  const scrollPrev = () => {
    if (!scrollRef.current) return;
    const step = 440 * zoomLevel;
    scrollRef.current.scrollBy({ left: -step, behavior: 'smooth' });
  };

  const scrollNext = () => {
    if (!scrollRef.current) return;
    const step = 440 * zoomLevel;
    scrollRef.current.scrollBy({ left: step, behavior: 'smooth' });
  };

  // 5. 键盘左右方向键便捷切换
  useEffect(() => {
    if (renderMode !== 'paged' || pagesTotal <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [renderMode, pagesTotal, zoomLevel]);

  const getCanvasBgClass = () => {
    switch (config.canvasBg) {
      case 'light-slate':
        return 'bg-slate-100';
      case 'pure-white':
        return 'bg-white';
      case 'dark-mode':
        return 'bg-neutral-900';
      case 'grid-pattern':
        return 'bg-[#f4f4f6] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]';
      case 'neutral-gray':
      default:
        return 'bg-[#f5f5f7]';
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 画布滚动容器 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`w-full h-full overflow-auto overscroll-contain transition-colors duration-200 ${getCanvasBgClass()}`}
      >
        <div
          className={`min-w-full min-h-full flex items-center p-6 md:p-10 ${
            renderMode === 'paged' && pagesTotal > 1
              ? 'justify-start w-max'
              : 'justify-center flex-col'
          }`}
        >
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin:
                renderMode === 'paged' && pagesTotal > 1 ? 'left center' : 'top center',
            }}
            className="transition-transform duration-200 my-auto py-2"
          >
            <div ref={hostRef} className="box-border" />
          </div>
        </div>
      </div>

      {/* 分页模式专属：底部浮动悬浮卡片导航指示器 */}
      {renderMode === 'paged' && pagesTotal > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-neutral-200/80 text-xs select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={scrollPrev}
            disabled={activePage === 1}
            className="p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer text-neutral-600 hover:text-black"
            title="上一张 (←)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-semibold text-neutral-800 text-[11px] px-1 tracking-wider">
            {activePage} / {pagesTotal}
          </span>
          <button
            onClick={scrollNext}
            disabled={activePage === pagesTotal}
            className="p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer text-neutral-600 hover:text-black"
            title="下一张 (→)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
