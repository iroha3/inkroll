import React from 'react';
import {
  FileText,
  Download,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  Eye,
} from 'lucide-react';

interface NavbarProps {
  onExportClick: () => void;
  onAboutClick: () => void;
  viewMode: 'split' | 'preview-only' | 'editor-only';
  setViewMode: (mode: 'split' | 'preview-only' | 'editor-only') => void;
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

      {/* Middle: View Mode Controls & Zoom */}
      <div className="hidden md:flex items-center gap-2 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/60">
        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            viewMode === 'split' ? 'bg-white text-black shadow-sm font-semibold' : 'text-neutral-600 hover:text-black'
          }`}
          title="双栏：编辑器 + 实时长图"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>分栏模式</span>
        </button>

        <button
          onClick={() => setViewMode('preview-only')}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            viewMode === 'preview-only' ? 'bg-white text-black shadow-sm font-semibold' : 'text-neutral-600 hover:text-black'
          }`}
          title="纯渲染预览"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>长图预览</span>
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
            className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors cursor-pointer"
            title="缩小预览"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] w-9 text-center font-medium">
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
          title="导出长图"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出</span>
        </button>
      </div>
    </header>
  );
};
