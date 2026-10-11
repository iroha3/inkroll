import React from 'react';
import { X, ExternalLink, Heart, FileText } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-neutral-200/80 text-neutral-800 animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-neutral-900 tracking-tight">墨卷 InkRoll</h3>
                <span className="text-[10px] bg-neutral-100 border border-neutral-200 text-neutral-600 px-1.5 py-0.2 rounded-full font-mono">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">墨下生花，一卷成图</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 提炼核心定位与三大要素 */}
        <div className="py-4 space-y-3">
          <p className="text-neutral-600 text-xs leading-relaxed">
            专注将 Markdown 随笔与笔记，排版为温润有质感的社交图文卡片。
          </p>

          <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium text-neutral-900">多画幅适配</span>
              <span className="text-neutral-400 text-[11px] ml-auto">小红书 · 朋友圈 · 幻灯片 · 长图</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="font-medium text-neutral-900">专业表达</span>
              <span className="text-neutral-400 text-[11px] ml-auto">公式 · 图表 · 代码高亮 · 脚注</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 shrink-0" />
              <span className="font-medium text-neutral-900">离线隐私</span>
              <span className="text-neutral-400 text-[11px] ml-auto">浏览器纯本地渲染，绝不上云</span>
            </div>
          </div>

          {/* 本地字体提示 */}
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 text-[11px] leading-relaxed text-neutral-500 flex items-start gap-2">
            <span className="text-neutral-400 shrink-0 select-none">💡</span>
            <div>
              <span className="text-neutral-800 font-medium">字体质感提示：</span>
              若系统本地已安装<strong>「霞鹜文楷」</strong>或<strong>「思源宋体」</strong>，排版引擎将自动优先调用，导出更具印刷级温润质感的卡片。
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-0.5">
            <Heart className="w-3 h-3 text-neutral-400 shrink-0" />
            <span>致敬 <a href="https://github.com/tw93/kami" target="_blank" rel="noreferrer" className="underline hover:text-black">tw93/Kami</a> 的纸质克制排版</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/iroha3/inkroll"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-neutral-600 hover:text-black font-medium transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-neutral-300">·</span>
            <span className="text-[11px] text-neutral-400 font-mono">
              MPL-2.0 / AGPL-3.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs rounded-lg transition-colors cursor-pointer font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
