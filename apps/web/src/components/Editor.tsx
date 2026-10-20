import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Code,
  Quote,
  Link,
  Table,
  Upload,
  Trash2,
  Highlighter,
  Divide,
  List,
  ListOrdered,
  CheckSquare,
  RotateCcw,
  RotateCw,
  Eye,
} from 'lucide-react';
import { CardConfig } from '../types';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetDefault: () => void;
  config: CardConfig;
  onGoToPreview?: () => void;
  isMobile?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 零依赖高性能 Markdown 语法高亮染色器
function highlightMarkdown(text: string): string {
  const lines = text.split('\n');
  const highlightedLines = lines.map((line) => {
    const escaped = escapeHtml(line);

    if (/^#+\s+/.test(line)) {
      const match = line.match(/^(#+)(\s+)(.*)$/);
      if (match) {
        return `<span class="text-neutral-400 font-normal">${escapeHtml(match[1])}</span><span class="text-neutral-400 font-normal">${escapeHtml(match[2])}</span><span class="text-neutral-900 font-normal">${escapeHtml(match[3])}</span>`;
      }
    }
    if (/^>\s*/.test(line)) {
      const match = line.match(/^(>\s*)(.*)$/);
      if (match) {
        return `<span class="text-emerald-500 font-normal">${escapeHtml(match[1])}</span><span class="text-emerald-700 font-normal">${escapeHtml(match[2])}</span>`;
      }
    }
    if (/^---$|^===$/.test(line.trim())) {
      return `<span class="text-neutral-400 font-normal">${escaped}</span>`;
    }

    let formatted = escaped;

    if (/^(\s*[-*+]|\s*\d+\.)\s+/.test(line)) {
      formatted = formatted.replace(
        /^(\s*[-*+]|\s*\d+\.)(\s+)/,
        '<span class="text-neutral-400 font-normal">$1</span>$2'
      );
    }

    formatted = formatted.replace(
      /(`)([^`]+)(`)/g,
      '<span class="text-neutral-400 font-normal">$1</span><span class="text-rose-600 bg-rose-50/80 font-normal">$2</span><span class="text-neutral-400 font-normal">$3</span>'
    );

    formatted = formatted.replace(
      /(\*\*)([^*]+)(\*\*)/g,
      '<span class="text-neutral-400 font-normal">$1</span><span class="text-neutral-900 bg-neutral-100/70 font-normal">$2</span><span class="text-neutral-400 font-normal">$3</span>'
    );

    formatted = formatted.replace(
      /(?<!\*)\*([^*]+)\*(?!\*)/g,
      '<span class="text-neutral-400 font-normal">*</span><span class="text-neutral-700 font-normal">$1</span><span class="text-neutral-400 font-normal">*</span>'
    );

    formatted = formatted.replace(
      /(==)([^=]+)(==)/g,
      '<span class="text-amber-500/70 font-normal">$1</span><span class="bg-amber-100 text-amber-900 font-normal">$2</span><span class="text-amber-500/70 font-normal">$3</span>'
    );

    formatted = formatted.replace(
      /(\[[^\]]+\])(\([^)]+\))/g,
      '<span class="text-blue-600 underline decoration-blue-300 font-normal">$1</span><span class="text-neutral-400 font-normal">$2</span>'
    );

    return formatted;
  });

  return highlightedLines.join('\n') + (text.endsWith('\n') ? ' ' : '');
}

const editorSharedStyle: React.CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Monaco, Consolas, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", monospace',
  fontSize: '15px',
  lineHeight: '26px',
  fontWeight: 400,
  letterSpacing: '0px',
  tabSize: 2,
  boxSizing: 'border-box',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
};

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  onUndo,
  onRedo,
  onResetDefault,
  onGoToPreview,
  isMobile = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  // 移动端强制关闭透明叠加模式，使用 100% 原生文本输入，彻底杜绝手机白框与光标错位
  const [enableHighlight, setEnableHighlight] = useState<boolean>(!isMobile);

  useEffect(() => {
    if (isMobile) {
      setEnableHighlight(false);
    }
  }, [isMobile]);

  // 语法高亮缓存
  const highlightedHtml = useMemo(() => {
    if (!enableHighlight || isMobile) return '';
    return highlightMarkdown(content);
  }, [content, enableHighlight, isMobile]);

  // 滚动同步
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Helper to insert markdown tags at current cursor position
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || '文本'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length + (selectedText ? 0 : 2)
      );
    }, 10);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onChange(text);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'z') {
      e.preventDefault();
      if (e.shiftKey) onRedo();
      else onUndo();
    } else if (key === 'y') {
      e.preventDefault();
      onRedo();
    }
  };

  const isTransparentHighlightActive = !isMobile && enableHighlight;

  return (
    <div className="h-full flex flex-col bg-white border-r-0 lg:border-r border-neutral-200/80 text-neutral-800">
      {/* 统一单行工具栏（整合排版工具 + 文档操作） */}
      <div className="px-2.5 sm:px-3 py-1.5 border-b border-neutral-200/80 bg-neutral-50/70 flex items-center justify-between gap-1 text-neutral-600 text-xs shrink-0 overflow-x-auto no-scrollbar select-none">
        {/* 左侧：Markdown 格式化排版工具 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="加粗 **bold**"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="斜体 *italic*"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('==', '==')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="高亮标记 ==text=="
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('# ')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="一级标题 # "
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('> ')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="引用块 > "
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('`', '`')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="行内代码 `code`"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-neutral-300/80 mx-0.5 sm:mx-1" />

          <button
            onClick={() => insertFormatting('- ')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="无序列表"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('1. ')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="有序列表"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- [ ] ')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="任务列表"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-neutral-300/80 mx-0.5 sm:mx-1" />

          <button
            onClick={() => insertFormatting('[', '](https://example.com)')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="插入链接"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('\n| 标题1 | 标题2 |\n| --- | --- |\n| 内容1 | 内容2 |\n')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="插入表格"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('\n---\n')}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="插入分割线 ---"
          >
            <Divide className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 右侧：文档操作 */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
          <button
            onClick={onUndo}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="撤销 (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="重做 (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-neutral-300/80 mx-0.5" />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.txt,.markdown"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:p-1 hover:bg-neutral-200/60 rounded text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="导入文件"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* 仅在桌面端显示高亮切换按钮 */}
          {!isMobile && (
            <button
              onClick={() => setEnableHighlight((prev) => !prev)}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                enableHighlight
                  ? 'bg-neutral-200/60 text-neutral-800 font-medium'
                  : 'text-neutral-400 hover:text-black hover:bg-neutral-200/60'
              }`}
              title={
                enableHighlight
                  ? '语法高亮已开启（点击切换纯净原生文本）'
                  : '纯净原生文本模式（点击开启语法高亮）'
              }
            >
              <span>高亮</span>
            </button>
          )}

          <button
            onClick={onResetDefault}
            className="px-1.5 py-0.5 hover:bg-neutral-200/60 rounded text-[11px] text-neutral-500 hover:text-black transition-colors cursor-pointer hidden xs:inline-block"
            title="恢复默认金句示例"
          >
            示例
          </button>

          <button
            onClick={() => onChange('')}
            className="p-1.5 sm:p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
            title="清空"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-neutral-300/80 mx-0.5" />

          <span className="text-[11px] font-mono text-neutral-400 pl-0.5 select-none" title="字数统计">
            {content.length}
          </span>

          {/* 移动端专属：快捷直达预览按钮 */}
          {onGoToPreview && (
            <button
              onClick={onGoToPreview}
              className="lg:hidden ml-1 flex items-center gap-1 text-[11px] font-semibold bg-black text-white px-2 py-0.5 rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
              title="切换至卡片预览"
            >
              <Eye className="w-3 h-3" />
              <span>预览</span>
            </button>
          )}
        </div>
      </div>

      {/* 文本编辑区 */}
      <div className="flex-1 min-h-0 relative flex flex-col bg-white">
        {isMobile ? (
          /* 移动端专属：100% 原生高对比度 Textarea，绝对无任何高亮层叠/透明色/光标位移 bug */
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="在此输入或粘贴 Markdown 内容..."
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            style={{
              ...editorSharedStyle,
              color: '#171717',
              WebkitTextFillColor: '#171717',
              backgroundColor: '#ffffff',
              caretColor: '#171717',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              WebkitAppearance: 'none',
              appearance: 'none',
              width: '100%',
              height: '100%',
              minHeight: '100%',
              padding: '16px 16px 96px 16px',
              margin: 0,
              border: 'none',
              outline: 'none',
              resize: 'none',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxSizing: 'border-box',
              opacity: 1,
            }}
            className="w-full h-full text-neutral-900 bg-white"
          />
        ) : (
          /* 桌面端：支持双层语法高亮 */
          <>
            {isTransparentHighlightActive && (
              <pre
                ref={highlightRef}
                aria-hidden="true"
                style={{
                  ...editorSharedStyle,
                  scrollbarColor: 'transparent transparent',
                }}
                className="absolute inset-0 px-3.5 sm:pl-4 sm:pr-8 py-3.5 sm:py-4 m-0 border-0 pointer-events-none select-none text-neutral-800 overflow-y-scroll overflow-x-hidden"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            )}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleTextareaKeyDown}
              placeholder="在此输入或粘贴 Markdown 内容..."
              spellCheck={false}
              style={{
                ...editorSharedStyle,
                WebkitAppearance: 'none',
                appearance: 'none',
                color: isTransparentHighlightActive ? 'transparent' : '#171717',
                WebkitTextFillColor: isTransparentHighlightActive ? 'transparent' : '#171717',
              }}
              className={`absolute inset-0 px-3.5 sm:pl-4 sm:pr-8 py-3.5 sm:py-4 pb-20 sm:pb-4 m-0 border-0 outline-none resize-none overflow-y-scroll overflow-x-hidden select-text z-10 ${
                isTransparentHighlightActive
                  ? 'bg-transparent caret-neutral-900 selection:bg-blue-200/60 selection:text-transparent'
                  : 'bg-white text-neutral-900 caret-neutral-900 selection:bg-blue-100 selection:text-neutral-900'
              }`}
            />
          </>
        )}
      </div>
    </div>
  );
};
