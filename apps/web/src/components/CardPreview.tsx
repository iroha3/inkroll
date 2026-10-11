import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: config.theme.includes('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
    });
  }, [config.theme]);

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
          const container = document.createElement('div');
          container.className = 'flex flex-col items-center gap-8 py-2';

          pages.forEach((pageEl, idx) => {
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'flex flex-col items-center group relative';

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
                P.${String(idx + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}
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
          onPageCountChange?.(pages.length);
        } catch (err) {
          console.error('Failed to build pages:', err);
        }
      } else {
        hostRef.current.innerHTML = '';
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
    <div
      ref={scrollRef}
      className={`w-full h-full overflow-auto overscroll-contain transition-colors duration-200 ${getCanvasBgClass()}`}
    >
      <div className="min-w-full min-h-full flex flex-col items-center justify-center p-6 md:p-10">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          className="transition-transform duration-200 my-auto py-2"
        >
          <div ref={hostRef} className="box-border" />
        </div>
      </div>
    </div>
  );
};
