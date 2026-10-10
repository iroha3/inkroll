import { getMarkdownIt } from './deps';

export interface MathBlock {
  raw: string;
  display: boolean;
}

export interface ParseResult {
  html: string;
  mathBlocks: MathBlock[];
}

export function preprocessMarkdown(source: string): { text: string; mathBlocks: MathBlock[] } {
  const mathBlocks: MathBlock[] = [];
  let text = source.replace(
    /(\$\$[\s\S]*?\$\$|\$[^$\n]*\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g,
    (match) => {
      const display = match.startsWith('$$') || match.startsWith('\\[');
      const idx = mathBlocks.length;
      mathBlocks.push({ raw: match, display });
      return display ? `<span data-md${idx}></span>` : `<span data-m${idx}></span>`;
    }
  );

  // ==高亮==
  text = text.replace(/==([^=]+)==/g, '<mark class="highlight-text">$1</mark>');
  // ~下标~
  text = text.replace(/~([^~\n]+)~/g, '<sub>$1</sub>');
  // ^上标^（单行、短内容）
  text = text.replace(/\^([^\s^][^^\r\n]{0,20})\^/g, '<sup>$1</sup>');

  return { text, mathBlocks };
}

interface FootnoteDef {
  index: number;
  content: string;
}

export function extractFootnotes(source: string): { text: string; defs: Map<string, FootnoteDef> } {
  const defs = new Map<string, FootnoteDef>();
  const lines = source.split('\n');
  const out: string[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
    }
    if (!inFence) {
      const m = /^\[\^([^\]]+)\]:\s*(.*)$/.exec(line);
      if (m) {
        const label = m[1];
        let content = m[2];
        while (i + 1 < lines.length && /^( {4}|\t)/.test(lines[i + 1])) {
          content += ' ' + lines[++i].trim();
        }
        if (!defs.has(label)) {
          defs.set(label, { index: defs.size + 1, content });
        }
        continue;
      }
    }
    out.push(line);
  }

  return { text: out.join('\n'), defs };
}

function splitInlineChildren(children: any[]) {
  const groups: any[][] = [[]];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'softbreak' || child.type === 'hardbreak') {
      groups.push([]);
    } else if (child.type === 'text' && child.content.includes('\n')) {
      const parts = child.content.split('\n');
      for (let j = 0; j < parts.length; j++) {
        if (j > 0) groups.push([]);
        if (parts[j]) {
          groups[groups.length - 1].push({ ...child, content: parts[j] });
        }
      }
    } else {
      groups[groups.length - 1].push(child);
    }
  }
  return groups.filter((g) => g.length > 0);
}

export function createMarkdownParser(): any {
  const mdFactory = getMarkdownIt();
  if (!mdFactory) {
    throw new Error('InkrollCore: 未找到 markdown-it 实例，请确保已加载 markdown-it');
  }

  const md = mdFactory({
    html: true,
    linkify: false,
    breaks: false,
    typographer: false,
  });

  // 插件：软换行升级为独立段落
  md.core.ruler.after('inline', 'split_soft_breaks', (state: any) => {
    const newTokens: any[] = [];
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      const isParagraph =
        token.type === 'paragraph_open' &&
        i + 2 < state.tokens.length &&
        state.tokens[i + 1].type === 'inline' &&
        state.tokens[i + 2].type === 'paragraph_close';

      if (isParagraph) {
        const groups = splitInlineChildren(state.tokens[i + 1].children);
        if (groups.length > 1) {
          for (let g = 0; g < groups.length; g++) {
            const open = new state.Token('paragraph_open', 'p', 1);
            const inline = new state.Token('inline', '', 0);
            inline.content = '';
            inline.children = groups[g];
            const close = new state.Token('paragraph_close', 'p', -1);
            newTokens.push(open, inline, close);
          }
          i += 2;
          continue;
        }
      }
      newTokens.push(token);
    }
    state.tokens = newTokens;
  });

  // 插件：任务列表 [ ] 和 [x]
  md.core.ruler.after('inline', 'task_lists', (state: any) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type !== 'inline') continue;
      let liIdx = -1;
      if (i > 0 && tokens[i - 1].type === 'list_item_open') liIdx = i - 1;
      else if (i > 1 && tokens[i - 1].type === 'paragraph_open' && tokens[i - 2].type === 'list_item_open') {
        liIdx = i - 2;
      }
      if (liIdx < 0) continue;

      const children = token.children || [];
      const first = children[0];
      if (!first || first.type !== 'text') continue;
      const m = /^\[([ xX])\]\s+/.exec(first.content);
      if (!m) continue;

      first.content = first.content.slice(m[0].length);
      if (first.content === '') children.shift();
      tokens[liIdx].attrJoin('class', 'task-list-item');

      const input = new state.Token('html_inline', '', 0);
      input.content = '<input type="checkbox" disabled' + (m[1] !== ' ' ? ' checked' : '') + '>';
      children.unshift(input);
    }
  });

  // 代码块规则
  md.renderer.rules.fence = (tokens: any[], idx: number) => {
    const token = tokens[idx];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    const lang = info.split(/\s+/g)[0] || '';
    const content = md.utils.escapeHtml(token.content);

    // 如果是 mermaid 代码块，做标记方便后续后处理
    if (lang === 'mermaid') {
      return (
        `<div class="md-mermaid-block" data-mermaid-code="${encodeURIComponent(token.content)}">` +
        `<pre class="mermaid">${content}</pre></div>`
      );
    }

    const head = lang ? `<div class="md-code-head">${md.utils.escapeHtml(lang)}</div>` : '';
    return (
      `<div class="md-code-block">${head}` +
      `<pre><code class="language-${md.utils.escapeHtml(lang)}">${content}</code></pre></div>`
    );
  };

  md.renderer.rules.code_block = (tokens: any[], idx: number) => {
    const token = tokens[idx];
    return (
      '<div class="md-code-block"><pre><code>' +
      md.utils.escapeHtml(token.content) +
      '</code></pre></div>'
    );
  };

  return md;
}

export function parseMarkdown(source: string, md: any): ParseResult {
  const { text: cleanText, defs } = extractFootnotes(source);
  const { text: preprocessed, mathBlocks } = preprocessMarkdown(cleanText);

  // 临时注入 footnote_ref inline 规则
  const originalInline = md.inline.ruler;
  const footnoteHandler = (state: any, silent: boolean) => {
    const src = state.src;
    const pos = state.pos;
    if (src.charCodeAt(pos) !== 0x5b || src.charCodeAt(pos + 1) !== 0x5e) return false;
    const end = src.indexOf(']', pos + 2);
    if (end < 0) return false;
    const label = src.slice(pos + 2, end);
    const def = defs.get(label);
    if (!def) return false;
    if (!silent) {
      const token = state.push('html_inline', '', 0);
      token.content = `<sup class="footnote-ref"><a href="#fn-${def.index}" id="fnref-${def.index}">${def.index}</a></sup>`;
    }
    state.pos = end + 1;
    return true;
  };

  try {
    originalInline.after('escape', 'footnote_ref', footnoteHandler);
  } catch {
    // 忽略重复注册
  }

  let html = md.render(preprocessed);

  // 脚注列表
  if (defs.size) {
    let list = '';
    defs.forEach((def) => {
      list += `<li id="fn-${def.index}">${md.renderInline(def.content)} <a href="#fnref-${def.index}" class="data-footnote-backref">↩</a></li>`;
    });
    html += `<section class="footnotes" data-footnotes><ol>${list}</ol></section>`;
  }

  return { html, mathBlocks };
}
