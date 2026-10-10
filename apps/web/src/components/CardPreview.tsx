import React, { useEffect, useRef } from 'react';
import { CardConfig } from '../types';
import { InkrollCore } from '@inkroll/core';
import mermaid from 'mermaid';

interface CardPreviewProps {
  content: string;
  config: CardConfig;
  cardRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  content,
  config,
  cardRef,
  zoomLevel,
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
    hostRef.current.innerHTML = '';

    const mermaidRenderer = async (code: string) => {
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.render(id, code);
      return svg;
    };

    const card = InkrollCore.render(content, config, { mermaidRenderer });
    hostRef.current.appendChild(card);

    if (cardRef) {
      (cardRef as any).current = card;
    }
  }, [content, config, cardRef]);

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
      className={`w-full h-full min-h-[500px] flex items-center justify-center p-6 md:p-10 overflow-auto overscroll-contain transition-colors duration-200 ${getCanvasBgClass()}`}
    >
      <div
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        className="transition-transform duration-200 my-auto py-4"
      >
        <div ref={hostRef} className="box-border" />
      </div>
    </div>
  );
};
