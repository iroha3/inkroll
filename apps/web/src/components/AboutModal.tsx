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
        className="bg-white rounded-2xl w-full max-w-[480px] p-6 shadow-2xl border border-neutral-200/80 text-neutral-800 animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-900 tracking-tight">墨卷 InkRoll</h3>
                <span className="text-[11px] bg-neutral-100 border border-neutral-200/80 text-neutral-600 px-2 py-0.5 rounded-full font-mono">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-neutral-400">墨下生花，一卷成图</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 开发者寄语与说明 */}
        <div className="py-4 space-y-3.5 text-[13px] leading-relaxed text-neutral-600">
          <p>
            将 Markdown 随笔、读书笔记、公式与图表沉淀为优雅的图文卡片。
          </p>
          <p>
            推荐安装「<a href="https://github.com/tw93/Kami/tree/main/assets/fonts" target="_blank" rel="noreferrer" className="underline hover:text-black">霞鹜文楷 / 思源宋体</a>」，以获得更佳的衬线字体排版效果。
          </p>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 pt-0.5">
            <Heart className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>黛绿主题致敬 <a href="https://github.com/tw93/kami" target="_blank" rel="noreferrer" className="underline hover:text-black">tw93/Kami</a> 的纸质克制排版</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/iroha3/inkroll"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-neutral-600 hover:text-black font-medium transition-colors"
            >
              <span>GitHub 仓库</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-400 font-mono">
              MPL-2.0 / AGPL-3.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs rounded-lg transition-colors cursor-pointer font-medium shadow-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
