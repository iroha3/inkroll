import React, { useRef } from 'react';
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
  Copy,
  Save,
  FileText,
  Highlighter,
  Divide,
  List,
  ListOrdered,
  CheckSquare,
} from 'lucide-react';
import { TEMPLATE_PRESETS } from '../constants/templates';
import { CardConfig } from '../types';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onApplyPreset: (presetId: string) => void;
  activePresetId: string;
  config: CardConfig;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  onUndo,
  onRedo,
  onApplyPreset,
  activePresetId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Download current markdown as a .md file
  const handleSaveFile = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '-',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');
    a.href = url;
    a.download = `markdown_${stamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="h-full flex flex-col bg-white border-r border-neutral-200 text-neutral-800 select-none">
      {/* Editor Header Toolbar */}
      <div className="p-3 border-b border-neutral-200 bg-neutral-50/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-600" />
          <span className="font-semibold text-sm text-neutral-800">Markdown 编辑器</span>
        </div>

        {/* Template Presets Selector */}
        <div className="flex items-center gap-2">
          <select
            value={activePresetId}
            onChange={(e) => onApplyPreset(e.target.value)}
            className="text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer"
          >
            <option disabled value="">
              选择样例预设...
            </option>
            {TEMPLATE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formatting Tools */}
      <div className="px-3 py-2 border-b border-neutral-100 bg-white flex flex-wrap items-center gap-1 overflow-x-auto text-neutral-600">
        <button
          onClick={() => insertFormatting('**', '**')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="加粗 **bold**"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('*', '*')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="斜体 *italic*"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('==', '==')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="高亮 ==highlight=="
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

        <button
          onClick={() => insertFormatting('# ')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="一级标题 # "
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('> ')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="引用 > "
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('`', '`')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="行内代码 `code`"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

        <button
          onClick={() => insertFormatting('- ')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('1. ')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('- [ ] ')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="任务列表"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

        <button
          onClick={() => insertFormatting('[', '](https://example.com)')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="插入链接"
        >
          <Link className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('\n| 标题1 | 标题2 |\n| --- | --- |\n| 内容1 | 内容2 |\n')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="插入表格"
        >
          <Table className="w-4 h-4" />
        </button>

        <button
          onClick={() => insertFormatting('\n---\n')}
          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black transition-colors"
          title="插入分割线 ---"
        >
          <Divide className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1" />
      </div>

      {/* Textarea Area */}
      <div className="flex-1 relative p-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder="在此粘贴或输入 Markdown 内容..."
          className="w-full h-full p-3 font-mono text-sm leading-relaxed text-neutral-800 resize-none focus:outline-none placeholder:text-neutral-400 select-text"
        />
      </div>

      {/* Bottom Status Bar & Actions */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50/80 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-3">
          <span>{content.length} 字符</span>
          <span>{content.split('\n').length} 行</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.txt,.markdown"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="上传 .md 或 .txt 文件"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>导入文件</span>
          </button>

          {/* Save Markdown File */}
          <button
            onClick={handleSaveFile}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="保存为 .md 文件到本地"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="复制 Markdown 源码"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>复制</span>
          </button>

          {/* Clear Text */}
          <button
            onClick={() => onChange('')}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            title="清空编辑器"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
