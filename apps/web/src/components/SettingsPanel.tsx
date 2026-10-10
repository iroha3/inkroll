import React, { useRef } from 'react';
import { Sliders, Type, Layout, Palette, Stamp, Monitor } from 'lucide-react';
import { CardConfig, ThemeStyle, FontStyle } from '../types';

interface SettingsPanelProps {
  config: CardConfig;
  onChange: (newConfig: CardConfig) => void;
  onReset: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange, onReset }) => {
  const updateConfig = <K extends keyof CardConfig>(key: K, value: CardConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={panelRef} className="h-full overflow-y-auto overscroll-contain">
      <div className="min-h-full flex flex-col bg-white border-l border-neutral-200 text-neutral-800 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-neutral-600" />
          <span className="font-semibold text-sm text-neutral-800">参数设置</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-neutral-500 hover:text-black hover:underline transition-colors cursor-pointer"
        >
          重置默认
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 divide-y divide-neutral-100">
        {/* 1. Header & Title Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
            <Type className="w-3.5 h-3.5" />
            <span>顶栏与标题</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">显示卡片大标题</span>
            <input
              type="checkbox"
              checked={config.showTitle}
              onChange={(e) => updateConfig('showTitle', e.target.checked)}
              className="w-4 h-4 accent-black cursor-pointer rounded"
            />
          </div>

          {config.showTitle && (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">标题文字</label>
              <input
                type="text"
                value={config.titleText}
                onChange={(e) => updateConfig('titleText', e.target.value)}
                placeholder="..."
                className="w-full text-sm px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          )}
        </div>

        {/* 2. Dimensions & Spacing */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
            <Layout className="w-3.5 h-3.5" />
            <span>尺寸与边距</span>
          </div>

          {/* Card Width */}
          <div>
            <div className="flex justify-between items-center text-xs text-neutral-600 mb-1.5">
              <span>长图卡片宽度</span>
              <span className="font-mono font-semibold">{config.cardWidth}px</span>
            </div>
            <input
              type="range"
              min="380"
              max="720"
              step="10"
              value={config.cardWidth}
              onChange={(e) => updateConfig('cardWidth', Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex gap-1.5 mt-2">
              {[460, 500, 540, 600].map((w) => (
                <button
                  key={w}
                  onClick={() => updateConfig('cardWidth', w)}
                  className={`flex-1 text-[11px] py-1 border rounded font-mono ${
                    config.cardWidth === w
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">卡片内边距</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'compact', label: '紧凑 (20px)' },
                { id: 'normal', label: '标准 (32px)' },
                { id: 'spacious', label: '宽松 (40px)' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateConfig('padding', p.id as CardConfig['padding'])}
                  className={`text-xs py-1.5 px-2 border rounded-lg transition-colors ${
                    config.padding === p.id
                      ? 'bg-black text-white border-black font-medium'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <div className="flex justify-between items-center text-xs text-neutral-600 mb-1">
              <span>圆角大小</span>
              <span className="font-mono">{config.borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="2"
              value={config.borderRadius}
              onChange={(e) => updateConfig('borderRadius', Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>
        </div>

        {/* 3. Theme & Colors */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5" />
            <span>风格与主题</span>
          </div>

          {/* Theme Presets */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'classic-white', name: '经典纯白', bg: 'bg-white border-neutral-200' },
              { id: 'warm-paper', name: '暖调纸张', bg: 'bg-[#fcfaf6] border-[#e7e3d8]' },
              { id: 'kami-paper', name: 'Kami 和纸', bg: 'bg-[#f5f4ed] border-[#e8e6dc] text-[#141413]' },
              { id: 'forest-paper', name: '松墨黛绿', bg: 'bg-[#f4f0e6] border-[#e0dbd1] text-[#1b382b]' },
              { id: 'soft-blue', name: '柔蓝印记', bg: 'bg-[#f8fafc] border-blue-200' },
              { id: 'lavender', name: '淡雅薰衣草', bg: 'bg-[#faf5ff] border-purple-200 text-[#2e1065]' },
              { id: 'minimal-dark', name: '极简暗黑', bg: 'bg-[#0d1117] text-white border-neutral-700' },
              { id: 'emerald-dark', name: '翡翠深邃', bg: 'bg-[#0e1713] text-[#d8e6e0] border-[#26362f]' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => updateConfig('theme', t.id as ThemeStyle)}
                className={`p-2 border rounded-lg text-left text-xs transition-all flex items-center justify-between ${t.bg} ${
                  config.theme === t.id ? 'ring-2 ring-black font-semibold' : 'hover:opacity-90'
                }`}
              >
                <span>{t.name}</span>
                {config.theme === t.id && <span className="text-xs">✓</span>}
              </button>
            ))}
          </div>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">字体族</label>
              <select
                value={config.fontFamily}
                onChange={(e) => updateConfig('fontFamily', e.target.value as FontStyle)}
                className="w-full text-xs p-1.5 border border-neutral-200 rounded-lg bg-white"
              >
                <option value="sans">无衬线 (Sans-serif)</option>
                <option value="serif">衬线体 (Serif)</option>
                <option value="mono">等宽体 (Monospace)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-500 mb-1">字号大小</label>
              <select
                value={config.fontSize}
                onChange={(e) => updateConfig('fontSize', e.target.value as CardConfig['fontSize'])}
                className="w-full text-xs p-1.5 border border-neutral-200 rounded-lg bg-white"
              >
                <option value="sm">偏小 (14px)</option>
                <option value="base">标准 (15px)</option>
                <option value="lg">偏大 (16.5px)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Stage Canvas Background */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
            <Monitor className="w-3.5 h-3.5" />
            <span>预览台背景</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'neutral-gray', name: '默认浅灰' },
              { id: 'grid-pattern', name: '网点图阵' },
              { id: 'light-slate', name: '冷调蓝灰' },
              { id: 'pure-white', name: '纯白背景' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => updateConfig('canvasBg', c.id as CardConfig['canvasBg'])}
                className={`text-xs py-1.5 px-2 border rounded-lg transition-colors ${
                  config.canvasBg === c.id
                    ? 'bg-neutral-800 text-white border-neutral-800 font-medium'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Watermark / Footer */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
            <Stamp className="w-3.5 h-3.5" />
            <span>落款与水印</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">显示底部水印/落款</span>
            <input
              type="checkbox"
              checked={config.showWatermark}
              onChange={(e) => updateConfig('showWatermark', e.target.checked)}
              className="w-4 h-4 accent-black cursor-pointer rounded"
            />
          </div>

          {config.showWatermark && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">落款文字</label>
                <input
                  type="text"
                  value={config.watermarkText}
                  onChange={(e) => updateConfig('watermarkText', e.target.value)}
                  placeholder="例如: BY Me"
                  className="w-full text-sm px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">对齐方式</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => updateConfig('watermarkPosition', 'bottom-center')}
                    className={`text-xs py-1 border rounded-lg ${
                      config.watermarkPosition === 'bottom-center'
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    居中对齐
                  </button>
                  <button
                    onClick={() => updateConfig('watermarkPosition', 'bottom-right')}
                    className={`text-xs py-1 border rounded-lg ${
                      config.watermarkPosition === 'bottom-right'
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    居右对齐 (原图)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};
