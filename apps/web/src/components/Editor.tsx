import React, { useRef, useMemo } from 'react';
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
  FileText,
  Highlighter,
  Divide,
  List,
  ListOrdered,
  CheckSquare,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { CardConfig } from '../types';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetDefault: () => void;
  config: CardConfig;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 轻量级方案 A：零依赖高性能 Markdown 语法高亮染色器
function highlightMarkdown(text: string): string {
  const lines = text.split('\n');
  const highlightedLines = lines.map((line) => {
    const escaped = escapeHtml(line);

    // H1
    if (/^#\s+/.test(line)) {
      return `<span class="text-neutral-900 font-bold">${escaped}</span>`;
    }
    // H2
    if (/^##\s+/.test(line)) {
      return `<span class="text-neutral-900 font-bold">${escaped}</span>`;
    }
    // H3-H6
    if (/^#{3,6}\s+/.test(line)) {
      return `<span class="text-neutral-800 font-semibold">${escaped}</span>`;
    }
    // 引用块 >
    if (/^>\s*/.test(line)) {
      return `<span class="text-emerald-700 italic">${escaped}</span>`;
    }
    // 分割线 ---
    if (/^---$|^===$/.test(line.trim())) {
      return `<span class="text-neutral-400 font-bold">${escaped}</span>`;
    }

    let formatted = escaped;

    // 列表项标记
    if (/^(\s*[-*+]|\s*\d+\.)\s+/.test(line)) {
      formatted = formatted.replace(
        /^(\s*[-*+]|\s*\d+\.)(\s+)/,
        '<span class="text-neutral-400 font-semibold">$1</span>$2'
      );
    }

    // 行内代码 `code`
    formatted = formatted.replace(
      /(`[^`]+`)/g,
      '<span class="text-rose-600 bg-neutral-100 px-1 rounded font-mono font-medium">$1</span>'
    );
    // 加粗 **text**
    formatted = formatted.replace(
      /(\*\*[^*]+\*\*)/g,
      '<span class="font-bold text-neutral-900">$1</span>'
    );
    // 斜体 *text*
    formatted = formatted.replace(
      /(?<!\*)\*([^*]+)\*(?!\*)/g,
      '<span class="italic text-neutral-700">*$1*</span>'
    );
    // 高亮 ==text==
    formatted = formatted.replace(
      /(==[^=]+==)/g,
      '<span class="bg-amber-100 text-amber-900 px-0.5 rounded font-medium">$1</span>'
    );
    // 链接 [text](url)
    formatted = formatted.replace(
      /(\[[^\]]+\]\([^)]+\))/g,
      '<span class="text-blue-600 underline">$1</span>'
    );

    return formatted;
  });

  return highlightedLines.join('\n') + (text.endsWith('\n') ? ' ' : '');
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  onUndo,
  onRedo,
  onResetDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  // 语法高亮缓存
  const highlightedHtml = useMemo(() => highlightMarkdown(content), [content]);

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

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length + (selectedText ? 0 : 2)
      );
    }, 10);
  };

  // Upload local file handler (.md, .txt)
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

  // Keyboard shortcuts: Ctrl/Cmd+Z undo, +Shift+Z or Ctrl+Y redo
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

  return (
    <div className="h-full flex flex-col bg-white border-r border-neutral-200/80 text-neutral-800 select-none">
      {/* 统一单行工具栏（整合排版工具 + 文档操作，垂直高度极致精简） */}
      <div className="px-3 py-1.5 border-b border-neutral-200/80 bg-neutral-50/70 flex items-center justify-between gap-1 text-neutral-600 text-xs shrink-0 overflow-x-auto">
        {/* 左侧：Markdown 格式化排版工具 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => insertFormatting('**', '**')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="加粗 **bold**"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="斜体 *italic*"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('==', '==')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="高亮标记 ==text=="
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('# ')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="一级标题 # "
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('> ')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="引用块 > "
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('`', '`')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="行内代码 `code`"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-neutral-300/80 mx-1" />

          <button
            onClick={() => insertFormatting('- ')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="无序列表"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('1. ')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="有序列表"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- [ ] ')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="任务列表"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-neutral-300/80 mx-1" />

          <button
            onClick={() => insertFormatting('[', '](https://example.com)')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="插入链接"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('\n| 标题1 | 标题2 |\n| --- | --- |\n| 内容1 | 内容2 |\n')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="插入表格"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('\n---\n')}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="插入分割线 ---"
          >
            <Divide className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 右侧：文档操作 (撤销/重做/导入/示例/清空/字数) */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
          <button
            onClick={onUndo}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="撤销 (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-500 hover:text-black transition-colors cursor-pointer"
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
            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="导入文件"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetDefault}
            className="px-1.5 py-0.5 hover:bg-neutral-200/60 rounded text-[11px] text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="恢复默认金句示例"
          >
            示例
          </button>

          <button
            onClick={() => onChange('')}
            className="p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
            title="清空"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-neutral-300/80 mx-0.5" />

          <span className="text-[11px] font-mono text-neutral-400 pl-0.5 select-none" title="字数统计">
            {content.length}
          </span>
        </div>
      </div>

      {/* 方案 A：双层结构轻量 Markdown 语法高亮文本区（字体放大至 15px，极度清晰） */}
      <div className="flex-1 relative overflow-hidden bg-white">
        {/* 底层染色遮罩层 */}
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="absolute inset-0 p-4 m-0 font-mono text-[15px] leading-[1.75] whitespace-pre-wrap break-words pointer-events-none select-none text-neutral-800 overflow-hidden box-border"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />

        {/* 顶层透明原生交互 Textarea（字体与底层严格像素级对齐） */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleTextareaKeyDown}
          placeholder="在此输入或粘贴 Markdown 内容..."
          spellCheck={false}
          className="absolute inset-0 p-4 m-0 font-mono text-[15px] leading-[1.75] whitespace-pre-wrap break-words resize-none border-none outline-none bg-transparent text-transparent caret-neutral-900 selection:bg-blue-200/60 selection:text-transparent overflow-auto box-border select-text"
        />
      </div>
    </div>
  );
};
