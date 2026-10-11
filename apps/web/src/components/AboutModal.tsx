import React from 'react';
import { X, Sparkles, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[#fcfbf7] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-[#e8e6dc] text-neutral-800 animate-in fade-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e8e6dc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-xs">
              墨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-neutral-900 tracking-tight">墨卷 InkRoll</h3>
                <span className="text-[10px] bg-neutral-100 border border-neutral-200 text-neutral-600 px-1.5 py-0.2 rounded-full font-mono">
                  v1.0.0
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

        {/* Core Value Proposition (Empowerment) */}
        <div className="py-4 space-y-4 text-xs leading-relaxed text-neutral-600">
          <p className="text-neutral-700 text-[13px] leading-relaxed">
            专为长文随笔、读书笔记与知识干货打造的 Markdown 出版级排版长图引擎。告别生硬死板的系统截图，让每一段文字自带纸质印刷美感，优雅嵌入<strong>小红书、微信与即刻</strong>。
          </p>

          <div className="space-y-2 p-3 bg-white/70 border border-[#e8e6dc] rounded-xl text-[11.5px] text-neutral-600">
            <div className="flex items-center gap-2 text-neutral-800 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
              <span>视网膜级 3x PNG 导出 · 文字纤毫毕现</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
              <span>全离线 KaTeX 公式与 Mermaid 图表 · 零外部网络依赖</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
              <span>分包开源保护 · Core (MPL-2.0) + Web (AGPL-3.0)</span>
            </div>
          </div>

          {/* Subordinate Kami Tribute */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pt-1">
            <Heart className="w-3 h-3 text-neutral-400 shrink-0" />
            <span>特别致敬：松墨黛绿主题受 <a href="https://github.com/tw93/kami" target="_blank" rel="noreferrer" className="underline hover:text-black">tw93/Kami</a> 的克制纸质排版启发</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#e8e6dc] flex items-center justify-between text-xs font-medium">
          <a
            href="https://github.com/iroha3/inkroll"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-neutral-700 hover:text-black transition-colors"
          >
            <span>GitHub 仓库</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs rounded-lg transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
