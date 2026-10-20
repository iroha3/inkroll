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
  resetScrollTrigger?: number;
  onPageCountChange?: (count: number) => void;
  isMobile?: boolean;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  content,
  config,
  cardRef,
  zoomLevel,
  renderMode,
  resetScrollTrigger = 0,
  onPageCountChange,
  isMobile = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [pagesTotal, setPagesTotal] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 800;
  });

  // 监听容器宽度，用于移动端自适应等比缩放
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };

    updateWidth();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 引用变量用于闭包中获取最新状态与防抖冷却锁
  const activePageRef = useRef<number>(activePage);
  activePageRef.current = activePage;
  const pagesTotalRef = useRef<number>(pagesTotal);
  pagesTotalRef.current = pagesTotal;
  const isWheelLockedRef = useRef<boolean>(false);
  const wheelLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 场景与渲染模式切换追踪：切换场景或模式时强制复位到第 1 张卡片
  const prevSceneRef = useRef<string | undefined>(config.scene);
  const prevRenderModeRef = useRef<RenderMode>(renderMode);
  const prevTriggerRef = useRef<number>(resetScrollTrigger);
  const shouldResetScrollRef = useRef<boolean>(false);

  const resetToFirstPage = () => {
    setActivePage(1);
    activePageRef.current = 1;
    if (scrollRef.current) {
      const el = scrollRef.current;
      const originalBehavior = el.style.scrollBehavior;
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = 0;
      el.scrollTop = 0;
      requestAnimationFrame(() => {
        if (el) {
          el.style.scrollBehavior = originalBehavior;
        }
      });
    }
  };

  useEffect(() => {
    if (
      config.scene !== prevSceneRef.current ||
      renderMode !== prevRenderModeRef.current ||
      resetScrollTrigger !== prevTriggerRef.current
    ) {
      prevSceneRef.current = config.scene;
      prevRenderModeRef.current = renderMode;
      prevTriggerRef.current = resetScrollTrigger;
      shouldResetScrollRef.current = true;
      resetToFirstPage();
    }
  }, [config.scene, renderMode, resetScrollTrigger]);

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
      const isResetting = shouldResetScrollRef.current;

      if (renderMode === 'paged') {
        try {
          const pages = await InkrollCore.buildPages(content, config, { mermaidRenderer });
          if (cancelled || !hostRef.current) return;

          hostRef.current.innerHTML = '';
          const total = pages.length;
          setPagesTotal(total);

          if (isResetting) {
            setActivePage(1);
            activePageRef.current = 1;
          } else {
            setActivePage((prev) => Math.min(prev, Math.max(1, total)));
          }

          // 横向滑轨容器：卡片一字排开，移动端触控 snap 吸附
          const container = document.createElement('div');
          container.className =
            'flex flex-row items-center gap-6 sm:gap-10 py-4 sm:py-6 px-4 sm:px-8 md:px-16 snap-x snap-mandatory select-none';

          pages.forEach((pageEl, idx) => {
            const pageWrapper = document.createElement('div');
            pageWrapper.className =
              'flex flex-col items-center group relative shrink-0 snap-center transition-transform hover:-translate-y-1 duration-200';
            pageWrapper.setAttribute('data-page-index', String(idx + 1));

            pageWrapper.appendChild(pageEl);
            container.appendChild(pageWrapper);
          });

          hostRef.current.appendChild(container);

          if (cardRef) {
            (cardRef as any).current = pages[0] || null;
          }

          if (isResetting) {
            shouldResetScrollRef.current = false;
            resetToFirstPage();
            requestAnimationFrame(() => {
              resetToFirstPage();
            });
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

        if (isResetting) {
          shouldResetScrollRef.current = false;
          resetToFirstPage();
          requestAnimationFrame(() => {
            resetToFirstPage();
          });
        }

        onPageCountChange?.(1);
      }
    };

    void renderCanvas();

    return () => {
      cancelled = true;
    };
  }, [content, config, renderMode, cardRef, onPageCountChange]);

  // 2. 精确平滑导航到指定卡片（视口居中吸附对齐）
  const goToPage = (targetIndex: number) => {
    if (!scrollRef.current || !hostRef.current || renderMode !== 'paged') return;
    const clampedIndex = Math.min(pagesTotalRef.current, Math.max(1, targetIndex));
    if (clampedIndex === 1) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActivePage(1);
      return;
    }
    const targetEl = hostRef.current.querySelector(
      `[data-page-index="${clampedIndex}"]`
    ) as HTMLElement | null;

    if (targetEl) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // 精确计算视口几何中心对齐位移
      const targetCenter = targetRect.left + targetRect.width / 2;
      const containerCenter = containerRect.left + containerRect.width / 2;
      const offsetDiff = targetCenter - containerCenter;

      scrollRef.current.scrollBy({ left: offsetDiff, behavior: 'smooth' });
      setActivePage(clampedIndex);
    }
  };

  // 3. 逐卡单步滚轮交互
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (renderMode !== 'paged') return;
      if (e.ctrlKey || e.metaKey) return;

      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 18) return;

      e.preventDefault();

      if (isWheelLockedRef.current) return;
      isWheelLockedRef.current = true;

      if (wheelLockTimerRef.current) clearTimeout(wheelLockTimerRef.current);
      wheelLockTimerRef.current = setTimeout(() => {
        isWheelLockedRef.current = false;
      }, 380);

      const current = activePageRef.current;
      const total = pagesTotalRef.current;

      if (delta > 0 && current < total) {
        goToPage(current + 1);
      } else if (delta < 0 && current > 1) {
        goToPage(current - 1);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelLockTimerRef.current) clearTimeout(wheelLockTimerRef.current);
    };
  }, [renderMode]);

  // 4. 实时动态计算当前视口中央聚焦的卡片编号
  const handleScroll = () => {
    if (!scrollRef.current || !hostRef.current || renderMode !== 'paged' || pagesTotal <= 1) return;
    const el = scrollRef.current;

    if (el.scrollLeft <= 60) {
      if (activePage !== 1) setActivePage(1);
      return;
    }

    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 60) {
      if (activePage !== pagesTotal) setActivePage(pagesTotal);
      return;
    }

    const containerRect = el.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    const cards = hostRef.current.querySelectorAll('[data-page-index]');
    let closestIndex = activePage;
    let minDistance = Infinity;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(cardCenter - containerCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = Number(card.getAttribute('data-page-index')) || 1;
      }
    });

    if (closestIndex !== activePage) {
      setActivePage(closestIndex);
    }
  };

  // 5. 键盘左右方向键支持
  useEffect(() => {
    if (renderMode !== 'paged' || pagesTotal <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPage(activePageRef.current - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToPage(activePageRef.current + 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [renderMode, pagesTotal]);

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

  const getCanvasBgColor = () => {
    switch (config.canvasBg) {
      case 'light-slate':
        return '#f1f5f9';
      case 'pure-white':
        return '#ffffff';
      case 'dark-mode':
        return '#171717';
      case 'grid-pattern':
        return '#f4f4f6';
      case 'neutral-gray':
      default:
        return '#f5f5f7';
    }
  };

  // 智能计算自适应缩放比：在移动端或窄屏视口下，等比收拢使卡片刚好舒展贴合视口且保留雅致留白
  const targetCardWidth =
    renderMode === 'continuous'
      ? config.cardWidth || 460
      : 414;

  const isNarrowScreen = containerWidth > 0 && containerWidth < targetCardWidth + 32;
  const mobileAutoFitScale = isNarrowScreen
    ? Math.max(0.35, Math.min(1, (containerWidth - 32) / targetCardWidth))
    : 1;

  const effectiveScale = (isMobile ? mobileAutoFitScale : 1) * zoomLevel;

  const transformOrigin =
    renderMode === 'continuous'
      ? 'top center'
      : renderMode === 'paged' && pagesTotal > 1
      ? 'left center'
      : 'center center';

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ backgroundColor: getCanvasBgColor() }}
    >
      {/* 画布滚动容器 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ backgroundColor: getCanvasBgColor() }}
        className={`w-full h-full overflow-auto overscroll-contain scroll-smooth transition-colors duration-200 ${getCanvasBgClass()}`}
      >
        <div
          className={`min-w-full min-h-full flex items-center ${
            renderMode === 'paged' && pagesTotal > 1
              ? 'justify-start w-max px-4 sm:px-8 py-4 sm:py-6 pb-28 sm:pb-8'
              : 'justify-center flex-col px-3 sm:px-6 md:px-10 pb-28 sm:pb-10 pt-3 sm:pt-6'
          }`}
          style={{ minHeight: '100%' }}
        >
          <div
            style={{
              transform: `scale(${effectiveScale})`,
              transformOrigin,
            }}
            className="transition-transform duration-200 my-auto flex flex-col items-center justify-center"
          >
            <div ref={hostRef} className="box-border" />
          </div>
        </div>
      </div>

      {/* 分页模式专属：底部浮动悬浮卡片导航指示器（移动端避让底部操作栏） */}
      {renderMode === 'paged' && pagesTotal > 1 && (
        <div className="absolute bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-neutral-200/80 text-xs select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => goToPage(activePage - 1)}
            disabled={activePage === 1}
            className="p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer text-neutral-600 hover:text-black"
            title="上一张 (← 或 滚轮向上)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-semibold text-neutral-800 text-[11px] px-1 tracking-wider">
            {activePage} / {pagesTotal}
          </span>
          <button
            onClick={() => goToPage(activePage + 1)}
            disabled={activePage === pagesTotal}
            className="p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer text-neutral-600 hover:text-black"
            title="下一张 (→ 或 滚轮向下)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
