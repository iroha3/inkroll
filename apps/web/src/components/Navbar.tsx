import React from 'react';
import {
  FileText,
  Download,
  Copy,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Columns,
  Eye,
} from 'lucide-react';

interface NavbarProps {
  onExportClick: () => void;
  onCopyClick: () => void;
  copiedSuccess: boolean;
  viewMode: 'split' | 'preview-only' | 'editor-only';
  setViewMode: (mode: 'split' | 'preview-only' | 'editor-only') => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onExportClick,
  onCopyClick,
  copiedSuccess,
  viewMode,
  setViewMode,
  zoomLevel,
  setZoomLevel,
  showSettings,
  setShowSettings,
}) => {
  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between select-none z-20 shrink-0">
      {/* Left: App Logo & Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-sm">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-tight text-neutral-900">墨卷 Inkroll</h1>
            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono font-medium">
              卷卷
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 hidden sm:block">墨下生花，一卷成图</p>
        </div>
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
        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings((s) => !s)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border rounded-xl transition-all cursor-pointer ${
            showSettings
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
          title="外观与排版参数设置"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">外观参数</span>
        </button>

        {/* Quick Copy Image */}
        <button
          onClick={onCopyClick}
          className="hidden lg:flex items-center gap-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          title="快速复制长图到剪贴板"
        >
          {copiedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span>已复制图片</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制长图</span>
            </>
          )}
        </button>

        {/* Main Export Long Image Button */}
        <button
          onClick={onExportClick}
          className="flex items-center gap-1.5 text-xs font-semibold bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出长图</span>
        </button>
      </div>
    </header>
  );
};
