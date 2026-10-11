import React from 'react';
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
  Tv,
  Smartphone,
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
  return (
    <header className="h-14 bg-white border-b border-neutral-200/80 px-4 flex items-center justify-between select-none z-20 shrink-0">
      {/* Left: App Logo & Branding (Clickable for About & Tribute) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAboutClick}
          className="group flex items-center gap-2.5 p-1 -ml-1 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer text-left"
          title="关于墨卷"
        >
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-neutral-900 group-hover:text-black">墨卷 InkRoll</h1>
              <span className="text-[10px] bg-neutral-100 group-hover:bg-neutral-200/80 border border-neutral-200/80 text-neutral-600 px-1.5 py-0.5 rounded-full font-mono font-medium transition-colors">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">墨下生花，一卷成图</p>
          </div>
        </button>
      </div>

      {/* Middle: Render Mode (Continuous Roll vs Purpose-built Social Scenes) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-neutral-100/90 p-0.5 rounded-xl border border-neutral-200/70">
          {/* 长图模式 */}
          <button
            onClick={() => setRenderMode('continuous')}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'continuous'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="卷轴长图模式：单张连贯长图（高度随内容延展）"
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span>长图</span>
          </button>

          <div className="w-[1px] h-3.5 bg-neutral-200 mx-0.5" />

          {/* 场景 1：小红书 (3:4 · 1242×1660) */}
          <button
            onClick={() => {
              setRenderMode('paged');
              onSelectScene('xiaohongshu');
            }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'paged' && scene === 'xiaohongshu'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="小红书 / 微博 3:4 黄金图文规格 (1242×1660)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>小红书</span>
            {renderMode === 'paged' && scene === 'xiaohongshu' && pageCount > 1 && (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded font-mono font-medium">
                {pageCount}P
              </span>
            )}
          </button>

          {/* 场景 2：朋友圈 / 方形 (1:1 · 1242×1242) */}
          <button
            onClick={() => {
              setRenderMode('paged');
              onSelectScene('square');
            }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'paged' && scene === 'square'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="朋友圈 / 微博九宫格 / 社交媒体 1:1 方形画幅 (1242×1242)"
          >
            <Square className="w-3.5 h-3.5" />
            <span>朋友圈</span>
            {renderMode === 'paged' && scene === 'square' && pageCount > 1 && (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded font-mono font-medium">
                {pageCount}P
              </span>
            )}
          </button>

          {/* 场景 3：幻灯片 / X / Bluesky (16:9 · 1920×1080) */}
          <button
            onClick={() => {
              setRenderMode('paged');
              onSelectScene('slide');
            }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'paged' && scene === 'slide'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="X (Twitter) / Bluesky / 公众号 / 幻灯片 16:9 (1920×1080)"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>幻灯片</span>
            {renderMode === 'paged' && scene === 'slide' && pageCount > 1 && (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded font-mono font-medium">
                {pageCount}P
              </span>
            )}
          </button>

          {/* 场景 4：竖屏海报 (9:16 · 1080×1920) */}
          <button
            onClick={() => {
              setRenderMode('paged');
              onSelectScene('story');
            }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'paged' && scene === 'story'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-black'
            }`}
            title="竖屏海报 / 故事 / 手机满屏 9:16 (1080×1920)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>海报</span>
            {renderMode === 'paged' && scene === 'story' && pageCount > 1 && (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded font-mono font-medium">
                {pageCount}P
              </span>
            )}
          </button>
        </div>

        {/* 辅助工具：分栏模式切换与画布缩放 */}
        <div className="hidden lg:flex items-center gap-1 bg-neutral-100/80 p-0.5 rounded-xl border border-neutral-200/60">
          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'preview-only' : 'split')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'split' ? 'bg-white text-black shadow-xs font-semibold' : 'text-neutral-600 hover:text-black'
            }`}
            title={viewMode === 'split' ? '当前：双栏模式（点击切换纯预览）' : '当前：纯预览（点击恢复双栏）'}
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
      <div className="flex items-center gap-2">
        {/* Settings Toggle: 开启时浅灰质感底色，绝不抢占主导出按钮的纯黑主强调视觉 */}
        <button
          onClick={() => setShowSettings((s) => !s)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border rounded-xl transition-all cursor-pointer ${
            showSettings
              ? 'bg-neutral-100 text-neutral-900 border-neutral-300 font-semibold shadow-inner'
              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-black'
          }`}
          title="设置与排版参数"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>设置</span>
        </button>

        {/* Main Export Long Image Button: 全局唯一主行动点强调色 */}
        <button
          onClick={onExportClick}
          className="flex items-center gap-1.5 text-xs font-semibold bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          title={renderMode === 'paged' ? `批量导出 ${pageCount} 张 3:4 社交卡片` : '导出单张长图'}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{renderMode === 'paged' && pageCount > 1 ? `导出 (${pageCount}张)` : '导出'}</span>
        </button>
      </div>
    </header>
  );
};
