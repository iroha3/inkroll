import React from 'react';
import { X, Sparkles, Share2, ShieldCheck, ExternalLink, Heart, FileText } from 'lucide-react';

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
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-4 h-4 text-white" />
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
            专为长文随笔、读书笔记与知识干货打造的 Markdown 长图排版工具。
            <br />
            告别生硬死板的系统截图，让文字自带纸质印刷温润感，优雅分享至<strong>小红书、微信朋友圈与即刻</strong>。
          </p>

          {/* 赋能用户的核心价值 */}
          <div className="space-y-2.5 p-3.5 bg-white/70 border border-[#e8e6dc] rounded-xl text-[11.5px] text-neutral-600">
            <div className="flex items-start gap-2 text-neutral-800">
              <Sparkles className="w-3.5 h-3.5 text-neutral-900 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 font-semibold">随写随排，告别繁重设计：</strong>
                无需学习复杂设计软件，随手粘贴文字或随笔，碎片想法即刻化为高级感阅读卡片。
              </div>
            </div>
            <div className="flex items-start gap-2 text-neutral-800">
              <Share2 className="w-3.5 h-3.5 text-neutral-900 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 font-semibold">专为社交媒体调校：</strong>
                自适应版面比例与呼吸感留白，发小红书、微信、即刻免遭平台劣质压缩与模糊，复制即发。
              </div>
            </div>
            <div className="flex items-start gap-2 text-neutral-800">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 font-semibold">专业表达全支持，纯离线隐私：</strong>
                原生支持数学公式 (KaTeX)、逻辑图表 (Mermaid) 与代码高亮；浏览器纯本地渲染，文字内容绝不上云。
              </div>
            </div>
          </div>

          {/* Subordinate Kami Tribute */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pt-1">
            <Heart className="w-3 h-3 text-neutral-400 shrink-0" />
            <span>特别致敬：黛绿主题受 <a href="https://github.com/tw93/kami" target="_blank" rel="noreferrer" className="underline hover:text-black">tw93/Kami</a> 的克制纸质排版启发</span>
          </div>
        </div>

        {/* Footer Actions with License beside GitHub link */}
        <div className="pt-3 border-t border-[#e8e6dc] flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/iroha3/inkroll"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-neutral-700 hover:text-black transition-colors"
            >
              <span>GitHub 仓库</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-neutral-300">·</span>
            <span className="text-[11px] text-neutral-400 font-mono">
              MPL-2.0 / AGPL-3.0
            </span>
          </div>
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
