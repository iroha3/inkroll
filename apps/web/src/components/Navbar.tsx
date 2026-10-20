import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  Layers,
  AlignJustify,
  Square,
  ChevronDown,
} from 'lucide-react';
import { RenderMode, ScenePreset } from '../types';

interface NavbarProps {
  onExportClick: () => void;
  onAboutClick: () => void;
  viewMode: 'split' | 'preview-only' | 'editor-only';
  setViewMode: (mode: 'split' | 'preview-only' | 'editor-only') => void;
  renderMode: RenderMode;
  setRenderMode: (mode: RenderMode) => void;
  scene: ScenePreset;
  onSelectScene: (scene: ScenePreset) => void;
  pageCount: number;
  zoomLevel: number;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
}

const SCENE_ITEMS = [
  {
    mode: 'continuous' as RenderMode,
    sceneKey: 'continuous' as const,
    name: '长图',
    ratio: '自由高度',
    title: '卷轴长图模式：单张连贯长图（高度随内容延展）',
    icon: AlignJustify,
  },
  {
    mode: 'paged' as RenderMode,
    sceneKey: 'xiaohongshu' as ScenePreset,
    name: '小红书',
    ratio: '3:4',
    title: '小红书 / 微博 3:4 黄金图文规格 (1242×1660)',
    icon: Layers,
  },
  {
    mode: 'paged' as RenderMode,
    sceneKey: 'square' as ScenePreset,
    name: '朋友圈',
    ratio: '1:1',
    title: '朋友圈 / 微博九宫格 / 社交媒体 1:1 方形画幅 (1242×1242)',
    icon: Square,
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  onExportClick,
  onAboutClick,
  viewMode,
  setViewMode,
  renderMode,
  setRenderMode,
  scene,
  onSelectScene,
  pageCount,
  zoomLevel,
  setZoomLevel,
  showSettings,
  setShowSettings,
}) => {
  const [isMobileSceneOpen, setIsMobileSceneOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMobileSceneOpen(false);
      }
    };
    if (isMobileSceneOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileSceneOpen]);

  const currentActiveItem =
    renderMode === 'continuous'
      ? SCENE_ITEMS[0]
      : SCENE_ITEMS.find((item) => item.sceneKey === scene) || SCENE_ITEMS[1];
  const ActiveIcon = currentActiveItem.icon;

  return (
    <header
      className="relative h-14 bg-white border-b border-neutral-200/80 px-3 sm:px-4 flex items-center justify-between select-none shrink-0"
      style={{ position: 'relative', zIndex: 100 }}
    >
      {/* Left: App Logo & Branding */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onAboutClick}
          className="group flex items-center gap-2 p-1 -ml-1 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer text-left"
          title="关于墨卷"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-neutral-900 group-hover:text-black whitespace-nowrap">
                <span>墨卷</span>
                <span className="hidden sm:inline"> InkRoll</span>
              </h1>
              <span className="text-[10px] bg-neutral-100 group-hover:bg-neutral-200/80 border border-neutral-200/80 text-neutral-600 px-1.5 py-0.5 rounded-full font-mono font-medium transition-colors hidden sm:inline-block">
                v1.1
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden xl:block">墨下生花，一卷成图</p>
          </div>
        </button>
      </div>

      {/* Middle: Render Mode & Scene Picker */}
      <div className="flex items-center gap-2">
        {/* 1. Desktop Scene Switcher (Screens >= 1024px) */}
        <div className="hidden lg:flex items-center gap-0.5 bg-neutral-100/90 p-0.5 rounded-xl border border-neutral-200/70">
          {SCENE_ITEMS.map((item, idx) => {
            const isSelected =
              item.mode === 'continuous'
                ? renderMode === 'continuous'
                : renderMode === 'paged' && scene === item.sceneKey;
            const ItemIcon = item.icon;

            return (
              <React.Fragment key={item.name}>
                {idx === 1 && <div className="w-[1px] h-3.5 bg-neutral-200 mx-0.5" />}
                <button
                  onClick={() => {
                    if (item.mode === 'continuous') {
                      setRenderMode('continuous');
                    } else {
                      setRenderMode('paged');
                      onSelectScene(item.sceneKey as ScenePreset);
                    }
                  }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                  title={item.title}
                >
                  <ItemIcon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                  {isSelected && item.mode === 'paged' && pageCount > 1 && (
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded font-mono font-medium">
                      {pageCount}P
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* 2. Mobile Scene Selector Dropdown (Screens < 1024px) */}
        <div className="relative lg:hidden shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsMobileSceneOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200/70 text-neutral-800 rounded-xl border border-neutral-200/80 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
            title="切换排版画幅场景"
          >
            <ActiveIcon className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
            <span className="font-semibold text-neutral-900 whitespace-nowrap">{currentActiveItem.name}</span>
            <span className="text-[10px] text-neutral-500 font-mono hidden md:inline whitespace-nowrap">
              {currentActiveItem.ratio}
            </span>
            {renderMode === 'paged' && pageCount > 1 && (
              <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-full font-mono font-semibold whitespace-nowrap shrink-0">
                {pageCount}P
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 shrink-0 ${
                isMobileSceneOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Mobile Scene Dropdown Popover */}
          {isMobileSceneOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 999,
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                }}
                onClick={() => setIsMobileSceneOpen(false)}
              />
              <div
                style={{
                  position: 'fixed',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                }}
                className="w-56 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 py-2 select-none animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  选择画幅场景
                </div>
                {SCENE_ITEMS.map((item) => {
                  const isSelected =
                    item.mode === 'continuous'
                      ? renderMode === 'continuous'
                      : renderMode === 'paged' && scene === item.sceneKey;
                  const ItemIcon = item.icon;

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (item.mode === 'continuous') {
                          setRenderMode('continuous');
                        } else {
                          setRenderMode('paged');
                          onSelectScene(item.sceneKey as ScenePreset);
                        }
                        setIsMobileSceneOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-neutral-100 text-black font-semibold'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ItemIcon className="w-4 h-4 text-neutral-700" />
                        <span className="text-[13px]">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {item.ratio}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 3. Desktop Column & Zoom Controls */}
        <div className="hidden lg:flex items-center gap-1 bg-neutral-100/80 p-0.5 rounded-xl border border-neutral-200/60">
          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'preview-only' : 'split')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-black shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
            title={
              viewMode === 'split'
                ? '当前：双栏模式（点击切换纯预览）'
                : '当前：纯预览（点击恢复双栏）'
            }
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{viewMode === 'split' ? '分栏' : '单栏'}</span>
          </button>

          <div className="w-[1px] h-3.5 bg-neutral-200 mx-0.5" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 text-xs text-neutral-600 px-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
              className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors cursor-pointer"
              title="缩小预览"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[11px] w-8 text-center font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors cursor-pointer"
              title="放大预览"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors cursor-pointer"
              title="重置 100%"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Settings Toggle Button */}
        <button
          onClick={() => setShowSettings((s) => !s)}
          className={`flex items-center gap-1 sm:gap-1.5 text-xs font-medium px-2.5 sm:px-3 py-1.5 border rounded-xl transition-all cursor-pointer ${
            showSettings
              ? 'bg-neutral-100 text-neutral-900 border-neutral-300 font-semibold shadow-inner'
              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-black'
          }`}
          title="设置与排版参数"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">设置</span>
        </button>

        {/* Main Export Long Image Button */}
        <button
          onClick={onExportClick}
          className="flex items-center gap-1.5 text-xs font-semibold bg-black hover:bg-neutral-800 text-white px-3 sm:px-3.5 py-1.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
          title={
            renderMode === 'paged'
              ? `批量导出 ${pageCount} 张卡片`
              : '导出单张长图'
          }
        >
          <Download className="w-3.5 h-3.5" />
          <span>
            {renderMode === 'paged' && pageCount > 1
              ? `导出 (${pageCount}P)`
              : '导出'}
          </span>
        </button>
      </div>
    </header>
  );
};
