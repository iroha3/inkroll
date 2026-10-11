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
        <div className="p-3 border-b border-neutral-200/80 bg-neutral-50/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-neutral-600" />
            <span className="font-semibold text-xs text-neutral-800">排版参数</span>
          </div>
          <button
            onClick={onReset}
            className="text-[11px] text-neutral-400 hover:text-black hover:underline transition-colors cursor-pointer"
          >
            重置
          </button>
        </div>

        <div className="flex-1 p-3.5 space-y-5 divide-y divide-neutral-100 text-xs">
          {/* 1. Theme Selection: 经典纯白首选，松墨黛绿次之，柔蓝印记，极简暗黑 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-neutral-400 uppercase tracking-wider">
              <Palette className="w-3 h-3" />
              <span>主题风格</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'classic-white', name: '经典纯白', bg: 'bg-white border-neutral-200 text-neutral-800' },
                { id: 'kami-paper', name: '松墨黛绿', bg: 'bg-[#f5f4ed] border-[#e8e6dc] text-[#141413]' },
                { id: 'soft-blue', name: '柔蓝印记', bg: 'bg-[#f8fafc] border-blue-200 text-neutral-800' },
                { id: 'minimal-dark', name: '极简暗黑', bg: 'bg-[#0d1117] text-white border-neutral-700' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateConfig('theme', t.id as ThemeStyle)}
                  className={`p-2 border rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${t.bg} ${
                    config.theme === t.id ? 'ring-2 ring-black font-semibold shadow-xs' : 'hover:opacity-90'
                  }`}
                >
                  <span>{t.name}</span>
                  {config.theme === t.id && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Visual Typography (Firefox Reader Mode style) */}
          <div className="pt-4 space-y-3">
            {/* Font Family: Visualized in their actual typefaces */}
            <div>
              <label className="block text-[11px] text-neutral-400 font-medium mb-1.5">字体风格</label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/50">
                <button
                  onClick={() => updateConfig('fontFamily', 'serif')}
                  className={`py-1.5 text-center rounded-md font-serif text-xs transition-all cursor-pointer ${
                    config.fontFamily === 'serif'
                      ? 'bg-white shadow-xs font-bold text-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                  title="衬线印刷体 (Serif)"
                >
                  衬线 Serif
                </button>
                <button
                  onClick={() => updateConfig('fontFamily', 'sans')}
                  className={`py-1.5 text-center rounded-md font-sans text-xs transition-all cursor-pointer ${
                    config.fontFamily === 'sans'
                      ? 'bg-white shadow-xs font-bold text-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                  title="现代无衬线 (Sans-serif)"
                >
                  黑体 Sans
                </button>
                <button
                  onClick={() => updateConfig('fontFamily', 'mono')}
                  className={`py-1.5 text-center rounded-md font-mono text-xs transition-all cursor-pointer ${
                    config.fontFamily === 'mono'
                      ? 'bg-white shadow-xs font-bold text-black'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                  title="等宽代码体 (Monospace)"
                >
                  等宽 Mono
                </button>
              </div>
            </div>

            {/* Font Size: Visual Stepper (A- / A / A+) like Firefox Reader Mode */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                <span>正文字号</span>
                <span className="font-mono text-neutral-500">
                  {config.fontSize === 'sm' ? '14px' : config.fontSize === 'lg' ? '16.5px' : '15px'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/50">
                <button
                  onClick={() => updateConfig('fontSize', 'sm')}
                  className={`py-1 text-center font-bold text-xs rounded-md transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                    config.fontSize === 'sm'
                      ? 'bg-white shadow-xs text-black'
                      : 'text-neutral-500 hover:text-black'
                  }`}
                  title="偏小 (14px)"
                >
                  <span>A</span>
                  <span className="text-[10px] font-normal">-</span>
                </button>
                <button
                  onClick={() => updateConfig('fontSize', 'base')}
                  className={`py-1 text-center font-bold text-sm rounded-md transition-all cursor-pointer ${
                    config.fontSize === 'base'
                      ? 'bg-white shadow-xs text-black'
                      : 'text-neutral-500 hover:text-black'
                  }`}
                  title="标准 (15px)"
                >
                  A
                </button>
                <button
                  onClick={() => updateConfig('fontSize', 'lg')}
                  className={`py-1 text-center font-bold text-base rounded-md transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                    config.fontSize === 'lg'
                      ? 'bg-white shadow-xs text-black'
                      : 'text-neutral-500 hover:text-black'
                  }`}
                  title="偏大 (16.5px)"
                >
                  <span>A</span>
                  <span className="text-[10px] font-normal">+</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Dimensions & Padding (Minimal Segments, No Sliders) */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-neutral-400 uppercase tracking-wider">
              <Layout className="w-3 h-3" />
              <span>尺寸与版面</span>
            </div>

            {/* Width */}
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">卡片宽度</label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/50">
                {[
                  { width: 380, label: '380 便签' },
                  { width: 460, label: '460 标准' },
                  { width: 540, label: '540 宽幅' },
                ].map((item) => (
                  <button
                    key={item.width}
                    onClick={() => updateConfig('cardWidth', item.width)}
                    className={`py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                      config.cardWidth === item.width
                        ? 'bg-white shadow-xs font-semibold text-black'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Padding */}
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">留白呼吸感</label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/50">
                {[
                  { id: 'compact', label: '紧凑' },
                  { id: 'normal', label: '标准' },
                  { id: 'spacious', label: '宽裕' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateConfig('padding', p.id as CardConfig['padding'])}
                    className={`py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                      config.padding === p.id
                        ? 'bg-white shadow-xs font-semibold text-black'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">卡片圆角</label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/50">
                {[
                  { r: 0, label: '直角' },
                  { r: 12, label: '微圆' },
                  { r: 20, label: '柔润' },
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => updateConfig('borderRadius', item.r)}
                    className={`py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                      config.borderRadius === item.r
                        ? 'bg-white shadow-xs font-semibold text-black'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Signature / Watermark */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-neutral-400 uppercase tracking-wider">
                <Stamp className="w-3 h-3" />
                <span>落款水印</span>
              </div>
              <input
                type="checkbox"
                checked={config.showWatermark}
                onChange={(e) => updateConfig('showWatermark', e.target.checked)}
                className="w-3.5 h-3.5 accent-black cursor-pointer rounded"
              />
            </div>

            {config.showWatermark && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={config.watermarkText}
                  onChange={(e) => updateConfig('watermarkText', e.target.value)}
                  placeholder="落款内容..."
                  className="w-full text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black/20"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
