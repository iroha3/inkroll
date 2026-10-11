import React, { useRef } from 'react';
import { Sliders, Layout, Palette, Stamp } from 'lucide-react';
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
            <span className="font-semibold text-sm text-neutral-800">外观参数</span>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-neutral-500 hover:text-black hover:underline transition-colors cursor-pointer"
          >
            恢复默认
          </button>
        </div>

        <div className="flex-1 p-4 space-y-6 divide-y divide-neutral-100">
          {/* 1. Theme & Colors (4 Curated Themes) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5" />
              <span>风格与主题</span>
            </div>

            {/* 4 Themes: 松墨黛绿, 经典纯白, 柔蓝印记, 极简暗黑 */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'kami-paper', name: '松墨黛绿', bg: 'bg-[#f5f4ed] border-[#e8e6dc] text-[#141413]' },
                { id: 'classic-white', name: '经典纯白', bg: 'bg-white border-neutral-200 text-neutral-800' },
                { id: 'soft-blue', name: '柔蓝印记', bg: 'bg-[#f8fafc] border-blue-200 text-neutral-800' },
                { id: 'minimal-dark', name: '极简暗黑', bg: 'bg-[#0d1117] text-white border-neutral-700' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateConfig('theme', t.id as ThemeStyle)}
                  className={`p-2.5 border rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${t.bg} ${
                    config.theme === t.id ? 'ring-2 ring-black font-semibold shadow-xs' : 'hover:opacity-90'
                  }`}
                >
                  <span>{t.name}</span>
                  {config.theme === t.id && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>

            {/* Typography */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">字体风格</label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => updateConfig('fontFamily', e.target.value as FontStyle)}
                  className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-neutral-50/60 font-medium"
                >
                  <option value="serif">衬线印刷体 (Serif)</option>
                  <option value="sans">现代无衬线 (Sans)</option>
                  <option value="mono">等宽代码体 (Mono)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">正文字号</label>
                <select
                  value={config.fontSize}
                  onChange={(e) => updateConfig('fontSize', e.target.value as CardConfig['fontSize'])}
                  className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-neutral-50/60 font-medium"
                >
                  <option value="sm">偏小 (14px)</option>
                  <option value="base">标准 (15px)</option>
                  <option value="lg">偏大 (16.5px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Dimensions & Spacing (Intuitive Presets, No Sliders) */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
              <Layout className="w-3.5 h-3.5" />
              <span>尺寸与留白</span>
            </div>

            {/* Card Width Presets */}
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">卡片宽度</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { width: 380, label: '便签 (380)' },
                  { width: 460, label: '标准 (460)' },
                  { width: 540, label: '宽幅 (540)' },
                ].map((item) => (
                  <button
                    key={item.width}
                    onClick={() => updateConfig('cardWidth', item.width)}
                    className={`py-1.5 text-xs border rounded-lg transition-all cursor-pointer ${
                      config.cardWidth === item.width
                        ? 'bg-black text-white border-black font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Padding Presets */}
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">内边距呼吸感</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'compact', label: '紧凑' },
                  { id: 'normal', label: '标准' },
                  { id: 'spacious', label: '宽松' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateConfig('padding', p.id as CardConfig['padding'])}
                    className={`text-xs py-1.5 border rounded-lg transition-colors cursor-pointer ${
                      config.padding === p.id
                        ? 'bg-black text-white border-black font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius Presets */}
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">卡片圆角</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { r: 0, label: '直角' },
                  { r: 12, label: '微圆' },
                  { r: 20, label: '柔润' },
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => updateConfig('borderRadius', item.r)}
                    className={`py-1.5 text-xs border rounded-lg transition-all cursor-pointer ${
                      config.borderRadius === item.r
                        ? 'bg-black text-white border-black font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Watermark / Signature */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-xs text-neutral-500 uppercase tracking-wider">
              <Stamp className="w-3.5 h-3.5" />
              <span>落款与水印</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-700">显示卡片底部落款</span>
              <input
                type="checkbox"
                checked={config.showWatermark}
                onChange={(e) => updateConfig('showWatermark', e.target.checked)}
                className="w-4 h-4 accent-black cursor-pointer rounded"
              />
            </div>

            {config.showWatermark && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">落款文字</label>
                  <input
                    type="text"
                    value={config.watermarkText}
                    onChange={(e) => updateConfig('watermarkText', e.target.value)}
                    placeholder="例如: By InkRoll"
                    className="w-full text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">对齐方式</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => updateConfig('watermarkPosition', 'bottom-center')}
                      className={`text-xs py-1 border rounded-lg cursor-pointer ${
                        config.watermarkPosition === 'bottom-center'
                          ? 'bg-black text-white border-black font-medium'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      居中对齐
                    </button>
                    <button
                      onClick={() => updateConfig('watermarkPosition', 'bottom-right')}
                      className={`text-xs py-1 border rounded-lg cursor-pointer ${
                        config.watermarkPosition === 'bottom-right'
                          ? 'bg-black text-white border-black font-medium'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      居右对齐
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
