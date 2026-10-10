/* ============================================================
 * ADAPTER[qwen] — Qwen（chat.qwen.ai）
 * 平台逻辑：消息操作栏注入（Download as PNG）+ 对话数据（/api/v2/chats/<id>）
 * 接口契约见 shared/export-engine.js 的 PlatformAdapter：
 *   fetchConversationData() → { messages[], modelName }
 *   messagesToMarkdown(data, sel) → string
 *   watermarkFor(modelName) → 水印文案
 *
 * 数据对齐（关键）：
 *   DOM .qwen-chat-message 与 API messages[] 一一对应（user/assistant 交替），
 *   所以数据层每条 = 一个 .qwen-chat-message，idx 天然对齐，不需要拆 thought。
 *   Qwen 的 thinking 是 assistant 消息内部的卡片（content_list 里 thinking 相位），
 *   不是独立 turn → 保留在消息的 thought 字段，导出时不用（约定：不导出思考过程）。
 * ============================================================ */
(function () {
  'use strict';

  const ICONS_SELECTOR = '.qwen-chat-package-comp-new-action-control-icons';
  const NEW_LABEL = 'Download as PNG';
  const MARKER = 'data-inkroll-png-added';
  const BTN_CLASS = 'qwen-chat-v2-btn qwen-chat-v2-btn-text qwen-chat-v2-btn-m qwen-chat-v2-btn-icon-only';

  // ---------- 消息按钮：从 content_list 提取回答/思考 ----------
  // assistant 消息的 content_list 条目按 phase 区分：
  //   'thinking_summary' / 'thinking' 等 → 思考内容
  //   其他（'answer' / 无 phase 的正文条目）→ 回答文本
  function isThinkingPhase(phase) {
    return /^thinking/i.test(String(phase || ''));
  }

  // 从 assistant 消息提取回答文本（不含思考）
  function assistantText(msg) {
    const parts = [];
    for (const item of msg.content_list || []) {
      const phase = item && item.phase;
      if (isThinkingPhase(phase)) continue;
      const c = item && typeof item.content === 'string' ? item.content : '';
      if (c) parts.push(c);
    }
    // 没有 content_list 或全为空 → 兜底用 content 字段
    if (!parts.length && typeof msg.content === 'string' && msg.content) parts.push(msg.content);
    return parts.join('\n\n').trim();
  }

  // 从 assistant 消息提取思考内容（不导出，仅数据层保留）
  function assistantThought(msg) {
    const parts = [];
    // 1) content_list 里 thinking 相位条目（含 extra.summary_thought 摘要形态）
    for (const item of msg.content_list || []) {
      const phase = item && item.phase;
      if (!isThinkingPhase(phase)) continue;
      const c = item && typeof item.content === 'string' ? item.content : '';
      if (c) parts.push(c);
      // thinking_summary 的正文在 extra.summary_thought.content（数组）
      const extra = item && item.extra;
      if (extra && extra.summary_thought) {
        const arr = Array.isArray(extra.summary_thought.content)
          ? extra.summary_thought.content
          : [extra.summary_thought.content];
        for (const t of arr) if (typeof t === 'string' && t) parts.push(t);
      }
    }
    // 2) reasoning_content（完整思考链形态）
    if (typeof msg.reasoning_content === 'string' && msg.reasoning_content) {
      parts.push(msg.reasoning_content);
    }
    return parts.join('\n\n').trim();
  }

  // 通用清理：去掉思考过程块 + 压缩多余空行（与 aistudio.js 一致）
  function stripThinking(md) {
    return md
      .replace(/#### \u{1F914} Thought Process[\s\S]*?(?=### |$)/gu, '')
      .replace(/\n{3,}/g, '\n\n');
  }

  const ADAPTER = {
    id: 'qwen',
    name: 'Qwen',
    detect: () => window.location.hostname === 'chat.qwen.ai',

    getCurrentConversationId() {
      // 两种 URL 形态：/c/<uuid> 与 /a/chat/s/<uuid>
      const m1 = window.location.pathname.match(/^\/c\/([^\/?]+)/);
      if (m1) return m1[1];
      const m2 = window.location.pathname.match(/^\/a\/chat\/s\/([^\/?]+)/);
      if (m2) return m2[1];
      return null;
    },

    // ---------- API：拉取当前对话全部消息原文 ----------
    async fetchConversationData() {
      const convId = this.getCurrentConversationId();
      if (!convId) throw new Error(window.InkrollI18n.t('noConvId'));

      const resp = await fetch('/api/v2/chats/' + convId, {
        headers: { 'source': 'web' },
      });
      if (!resp.ok) throw new Error('API ' + resp.status);
      let body;
      try {
        body = await resp.json();
      } catch (e) {
        throw new Error(window.InkrollI18n.t('parseFail'));
      }
      const messages = body?.data?.chat?.messages || [];
      if (!messages.length) throw new Error(window.InkrollI18n.t('noMessages'));

      // 数据层：每条 = 一个 DOM .qwen-chat-message（user/assistant 交替，idx 对齐）
      // thought 不拆独立条目，保留在消息的 thought 字段（约定：导出不包含思考过程）
      // 对齐约定：每条 API 消息 → 一条数据（与 DOM .qwen-chat-message 一一对应），
      // 不跳过任何条目，否则单条导出 idx 错位（AI Studio 教训，见 ChatFormat.md）
      const out = [];
      let modelName = '';
      for (const m of messages) {
        const role = m.role;
        if (role === 'user') {
          out.push({
            text: typeof m.content === 'string' ? m.content.trim() : '',
            role: 'user',
            type: 'text',
          });
        } else if (role === 'assistant') {
          const text = assistantText(m);
          const thought = assistantThought(m);
          if (!text && thought) {
            // 极少数只有思考没有正文（如被截断）——保留思考作为本条内容，
            // 但标记 type: 'thought'，全部导出时按思考清理
            out.push({ text: thought, role: 'assistant', type: 'thought' });
          } else {
            out.push({ text, role: 'assistant', type: 'text', thought: thought || '' });
          }
          if (!modelName) {
            modelName = m.modelName || m.model || '';
          }
        }
      }
      if (!out.length) throw new Error(window.InkrollI18n.t('noMessages'));
      return { messages: out, modelName };
    },

    // ---------- 导出内容 ----------
    // 单条 = 当前消息原文（assistant 只含回答，无思考）；全部 = 角色拼接后统一清理
    messagesToMarkdown(data, sel) {
      if (sel && sel.all) {
        const md = data.messages.map(function (m) {
          if (m.role === 'user') return '### \u{1F9D1}\u200d\u{1F4BB} User\n\n' + m.text;
          if (m.type === 'thought') return '#### \u{1F914} Thought Process\n\n' + m.text;
          return '### \u{1F916} Assistant\n\n' + m.text;
        }).join('\n\n');
        return stripThinking(md);
      }
      const m = data.messages[sel && sel.idx >= 0 ? sel.idx : 0];
      return m ? m.text : '';
    },

    // ---------- 水印：模型名（API 已给可读名，slug 走映射表兜底） ----------
    MODEL_NAMES: {
      // Qwen 模型 slug → 可读名（API 通常已返回可读 modelName，这里兜底）
      // 模型清单对齐模型选择面板（2026-08 实况）：
      //   Qwen3.8-Max / Qwen3.7-Plus / Qwen3.7-Max / Qwen3.6-Plus / Qwen3.6-Max-Preview /
      //   Qwen3.6-27B / Qwen3.6-35B-A3B / Qwen3.5-Plus / Qwen3.5-Omni-Plus / Qwen3.5-Flash /
      //   Qwen3.5-397B-A17B / Qwen3.5-Omni-Flash / Qwen3-Max / Qwen3-235B-A22B-2507 /
      //   Qwen3-Coder / Qwen3-VL-235B-A22B / Qwen3-Omni-Flash
      'qwen3.8-max': 'Qwen3.8-Max',
      'qwen3.7-plus': 'Qwen3.7-Plus',
      'qwen3.7-max': 'Qwen3.7-Max',
      'qwen3.6-plus': 'Qwen3.6-Plus',
      'qwen3.6-max-preview': 'Qwen3.6-Max-Preview',
      'qwen3.6-27b': 'Qwen3.6-27B',
      'qwen3.6-35b-a3b': 'Qwen3.6-35B-A3B',
      'qwen3.5-plus': 'Qwen3.5-Plus',
      'qwen3.5-omni-plus': 'Qwen3.5-Omni-Plus',
      'qwen3.5-flash': 'Qwen3.5-Flash',
      'qwen3.5-397b-a17b': 'Qwen3.5-397B-A17B',
      'qwen3.5-omni-flash': 'Qwen3.5-Omni-Flash',
      'qwen3-max': 'Qwen3-Max',
      'qwen3-max-preview': 'Qwen3 Max Preview',
      'qwen3-plus': 'Qwen3 Plus',
      'qwen3-turbo': 'Qwen3 Turbo',
      'qwen3-235b-a22b-2507': 'Qwen3-235B-A22B-2507',
      'qwen3-235b-a22b': 'Qwen3-235B-A22B',
      'qwen3-coder': 'Qwen3-Coder',
      'qwen3-vl-235b-a22b': 'Qwen3-VL-235B-A22B',
      'qwen3-omni-flash': 'Qwen3-Omni-Flash',
      'qwen2.5-72b-instruct': 'Qwen2.5-72B-Instruct',
      'qwen2.5-32b-instruct': 'Qwen2.5-32B-Instruct',
      'qwen2.5-14b-instruct': 'Qwen2.5-14B-Instruct',
      'qwen2.5-7b-instruct': 'Qwen2.5-7B-Instruct',
      'qwen2.5-coder-32b-instruct': 'Qwen2.5-Coder-32B-Instruct',
      'qwen2.5-coder-7b-instruct': 'Qwen2.5-Coder-7B-Instruct',
      'qwen-max': 'Qwen Max',
      'qwen-plus': 'Qwen Plus',
      'qwen-turbo': 'Qwen Turbo',
    },
    displayModelName(name) {
      if (!name) return '';
      if (this.MODEL_NAMES[name]) return this.MODEL_NAMES[name];
      return name;
    },
    watermarkFor(modelName) {
      return 'Awesome answer by ' + (this.displayModelName(modelName) || 'Qwen');
    },

    // ---------- 消息操作栏注入（Qwen 特有 DOM） ----------
    // 每条消息（user + assistant）footer 都有 .qwen-chat-package-comp-new-action-control-icons
    // （Copy / Edit / Good / Bad / Share / Regenerate / More），把我们的按钮插到最前，
    // 复用 qwen-chat-v2-btn 风格 + qwpcicon-download 图标，hover 显示逻辑自动继承。
    buildButton() {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = BTN_CLASS;
      btn.setAttribute('aria-label', NEW_LABEL);
      btn.setAttribute(MARKER, 'true');

      const span = document.createElement('span');
      span.className = 'qwen-chat-v2-btn-icon';
      // 与右下角「导出全部」按钮同款图标（shared/export-button.js iconSvg('image')）：
      // 矩形 + 太阳 + 山（导出 PNG 长图）；尺寸对齐 Qwen 自家按钮图标（16px），
      // 描边减到 1.5 使线条更纤细（与右邻按钮协调）
      span.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
        '<circle cx="8.5" cy="10" r="1.5"/>' +
        '<path d="M5 17l4-5 3.5 4 2.5-3 4 4"/></svg>';

      btn.appendChild(span);

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (!window.InkrollLite) throw new Error(window.InkrollI18n.t('noLite'));
          // 找到所属 .qwen-chat-message → 在列表中的索引 = 数据层 idx
          const msgEl = e.target.closest ? e.target.closest('.qwen-chat-message') : null;
          if (!msgEl) throw new Error(window.InkrollI18n.t('noTurn'));
          let idx = -1;
          const all = document.querySelectorAll('.qwen-chat-message');
          for (let i = 0; i < all.length; i++) {
            if (all[i] === msgEl) { idx = i; break; }
          }
          if (idx < 0) throw new Error(window.InkrollI18n.t('listChanged'));
          await window.InkrollExport.exportSingle(ADAPTER, idx);
        } catch (err) {
          console.error('[inkroll-qwen]', err);
        }
      });
      return btn;
    },

    processIcons(icons) {
      const mine = icons.querySelector('[' + MARKER + ']');
      const official = [...icons.querySelectorAll('button')].filter((b) => !b.hasAttribute(MARKER));
      if (!official.length) {
        // 流式生成中（官方操作栏尚未渲染，消息带 qwen-chat-message-awaiting-response）
        // 或没有官方操作按钮的消息：移除我们的按钮，跟随官方行为
        if (mine) mine.remove();
        return;
      }
      if (!mine) icons.insertBefore(this.buildButton(), icons.firstChild);
    },

    // ---------- MutationObserver: React 重建消息时保持注入 ----------
    initMenu() {
      let timer = null;
      const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          document.querySelectorAll(ICONS_SELECTOR).forEach((c) => this.processIcons(c));
        }, 100);
      };
      const observer = new MutationObserver(schedule);
      observer.observe(document.documentElement, { childList: true, subtree: true });
      schedule();
    },
  };

  // ---------- 启动 ----------
  if (ADAPTER.detect()) {
    ADAPTER.initMenu();
    if (window.InkrollExportUI && window.InkrollExport) {
      // 右下角「导出全部」按钮：仅对话页显示（URL 含真实对话 ID），SPA 导航时自动更新
      const { container } = window.InkrollExportUI.createButton({
        onClick: () => window.InkrollExport.exportAll(ADAPTER),
      });
      container.setAttribute('data-inkroll-export-host', '');
      function syncButton() {
        const show = !!ADAPTER.getCurrentConversationId();
        container.style.display = show ? '' : 'none';
      }
      syncButton();
      const wrap = (fn) => function () {
        const r = fn.apply(this, arguments);
        setTimeout(syncButton, 100);
        return r;
      };
      history.pushState = wrap(history.pushState);
      history.replaceState = wrap(history.replaceState);
      window.addEventListener('popstate', () => setTimeout(syncButton, 100));
      setInterval(syncButton, 2000); // 轮询兜底
    }
  }

  window.QwenAdapter = ADAPTER; // 调试用
})();
