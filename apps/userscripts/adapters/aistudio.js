/* ============================================================
 * ADAPTER[ai-studio] — Google AI Studio
 * 平台逻辑：菜单注入（Download as PNG）+ 对话数据（ResolveDriveResource RPC）
 * 接口契约见 shared/export-engine.js 的 PlatformAdapter：
 *   fetchConversationData() → { messages[], modelName }
 *   messagesToMarkdown(data, sel) → string
 *   watermarkFor(modelName) → 水印文案
 * ============================================================ */
(function () {
  'use strict';

  const MENU_SELECTOR = '.mat-mdc-menu-content';
  const REMOVE_LABEL = 'Make this an app';
  const INSERT_AFTER_LABEL = 'Branch from here';
  const NEW_LABEL = 'Download as PNG';
  const NEW_ICON = 'download';
  const MARKER = 'data-ms-png-added';

  // ---------- 记录打开菜单时所在的消息 turn ----------
  // 菜单是 Angular Material overlay（teleport 到 body），按钮 DOM 不在 turn 内，
  // 所以在捕获阶段监听点击，记下触发菜单的 turn 元素。
  let pendingTurnEl = null;
  document.addEventListener('click', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('.chat-turn-container') : null;
    if (t) pendingTurnEl = t;
  }, true);

  // 模型思考过程检测（照抄 AfterChat ADAPTER[aistudio] _parseConversation 的定义）：
  //   模型消息以 ** 开头 → 去 **、首词小写 → 前缀匹配分析关键词（^ 锚定）
  function isThought(text) {
    if (!/^\s*\*\*/.test(text)) return false;
    const firstLine = text.split('\n')[0].replace(/\*\*/g, '').trim().toLowerCase();
    return /^(assess|evaluat|analyz|consider|classify|identif|defin|determin|reflect|break down|dissect|categoriz|think|thought|构思|评估|分析|思考|拆解)/.test(firstLine);
  }

  // 通用清理：去掉 ChatFormat 输出里的思考过程块（#### 🤔 Thought Process → 下一标题/结尾）
  // 注意：\u{...} 码点语法需要 u flag，否则正则里不生效
  function stripThinking(md) {
    return md
      .replace(/#### \u{1F914} Thought Process[\s\S]*?(?=### |$)/gu, '')
      .replace(/\n{3,}/g, '\n\n');
  }

  const ADAPTER = {
    id: 'ai-studio',
    name: 'Google AI Studio',
    detect: () => window.location.hostname === 'aistudio.google.com',

    getCurrentConversationId() {
      const m1 = window.location.pathname.match(/^\/u\/\d+\/prompts\/([^\/?]+)/);
      const m2 = window.location.pathname.match(/^\/prompts\/([^\/?]+)/);
      const match = m1 || m2;
      if (!match || match[1] === 'new_chat') return null;
      return match[1];
    },

    // ---------- RPC：拉取当前对话全部消息原文 ----------
    async fetchConversationData() {
      const convId = this.getCurrentConversationId();
      if (!convId) throw new Error(window.InkrollI18n.t('noConvId'));
      const authUser = (window.location.pathname.match(/^\/u\/(\d+)\//) || [])[1] || '0';

      // SAPISIDHASH：SAPISID cookie + 时间戳 + origin 的 SHA-1
      const sapisid = (document.cookie.match(/(?:^|; )SAPISID=([^;]+)/) || [])[1] || '';
      if (!sapisid) throw new Error(window.InkrollI18n.t('noSession'));
      const ts = Math.floor(Date.now() / 1000);
      const buf = await crypto.subtle.digest(
        'SHA-1',
        new TextEncoder().encode(ts + ' ' + sapisid + ' https://aistudio.google.com')
      );
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

      // API key 从页面 JSON config 提取（不硬编码）
      let apiKey = '';
      for (const s of document.scripts) {
        if (s.type === 'application/json') {
          try {
            const d = JSON.parse(s.textContent);
            if (d.WIu0Nc) { apiKey = d.WIu0Nc; break; }
          } catch (e) { /* 跳过非 JSON */ }
        }
      }
      if (!apiKey) throw new Error(window.InkrollI18n.t('noApiKey'));

      const resp = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST',
          'https://alkalimakersuite-pa.clients6.google.com/'
          + '$rpc/google.internal.alkali.applications.makersuite.v1.MakerSuiteService/'
          + 'ResolveDriveResource'
        );
        xhr.withCredentials = true;
        xhr.setRequestHeader('Content-Type', 'application/json+protobuf');
        xhr.setRequestHeader('X-Goog-Api-Key', apiKey);
        xhr.setRequestHeader('X-Goog-AuthUser', authUser);
        xhr.setRequestHeader('Authorization', 'SAPISIDHASH ' + ts + '_' + hash);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch (e) { reject(new Error(window.InkrollI18n.t('parseFail'))); }
          } else {
            reject(new Error('API ' + xhr.status + ': ' + xhr.responseText.substring(0, 120)));
          }
        };
        xhr.onerror = () => reject(new Error(window.InkrollI18n.t('apiNetwork')));
        xhr.send(JSON.stringify([convId]));
      });

      // 响应结构：外层可能包一层；arr[13] 是 turn groups，
      // 每条消息 msgArr[0] 是原文、msgArr[8] 是角色（"user"/"model"），
      // 跳过 < 2 字符的空 shell 后顺序与 DOM .chat-turn-container 一致。
      // arr[3][2] 是模型名（如 "models/gemini-3.7-flash"），供水印使用。
      let arr = Array.isArray(resp) ? resp : [];
      if (arr.length === 1 && Array.isArray(arr[0])) arr = arr[0];
      const turnGroups = Array.isArray(arr[13]) ? arr[13] : [];
      const messages = [];
      for (const group of turnGroups) {
        if (!Array.isArray(group)) continue;
        for (const ma of group) {
          if (!Array.isArray(ma)) continue;
          const text = typeof ma[0] === 'string' ? ma[0] : '';
          if (!text || text.length < 2) continue;
          const role = ma[8] === 'user' ? 'user' : 'assistant';
          // 保留思考过程（type 标记）——与 DOM .chat-turn-container 一一对应，
          // 单条导出的 idx 才能对齐；导出时由 messagesToMarkdown 统一剔除（约定：不导出 thinking）
          messages.push({
            text: text.trim(),
            role: role,
            type: role === 'assistant' && isThought(text) ? 'thought' : 'text',
          });
        }
      }
      if (messages.length === 0) throw new Error(window.InkrollI18n.t('noMessages'));
      // 解析到的模型名：去 models/ 前缀；解析失败时留空（水印回退默认）
      let modelName = '';
      if (Array.isArray(arr[3]) && typeof arr[3][2] === 'string') {
        const raw = arr[3][2];
        modelName = raw.indexOf('models/') === 0 ? raw.slice(7) : raw;
      }
      return { messages, modelName };
    },

    // ---------- 导出内容 ----------
    // 单条 = 当前消息原文；全部 = AC 风格拼接后统一清理（去 metadata/thinking）
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

    // ---------- 水印：模型 slug → 可读名 ----------
    // API 返回 "models/gemini-3.7-flash" 这类 slug；映射表精确控制常用模型，
    // 未知的新模型走通用回退（gemini-x.y-xxx → Gemini X.Y Xxx）。
    // 保留：Model selection 面板（2026-08 实况）的对话模型 + 仍常用的 2.5 系列；
    // 已下线的 1.5/2.0、图像模型（Nano Banana）、Robotics 等一律不列。
    MODEL_NAMES: {
      'gemini-3.7-flash': 'Gemini 3.7 Flash',
      'gemini-3.5-flash': 'Gemini 3.5 Flash',
      'gemini-3.5-flash-lite': 'Gemini 3.5 Flash Lite',
      'gemini-3.5-live-translate-preview': 'Gemini 3.5 Live Translate Preview',
      'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview',
      'gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite',
      'gemini-3-flash-preview': 'Gemini 3 Flash Preview',
      'gemini-pro-latest': 'Gemini Pro Latest',
      'gemini-flash-latest': 'Gemini Flash Latest',
      'gemini-flash-lite-latest': 'Gemini Flash-Lite Latest',
      'gemini-omni-flash-preview': 'Gemini Omni Flash Preview',
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    },
    displayModelName(slug) {
      if (!slug) return '';
      if (this.MODEL_NAMES[slug]) return this.MODEL_NAMES[slug];
      // 通用回退：按连字符拆词，词首大写（数字/版本号不受影响）
      return slug.split('-').map(function (w) {
        return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      }).join(' ');
    },
    watermarkFor(modelName) {
      return 'Awesome answer by ' + (this.displayModelName(modelName) || 'Gemini');
    },

    // ---------- 菜单注入（AI Studio 特有 DOM） ----------
    buildButton() {
      const btn = document.createElement('button');
      btn.setAttribute('mat-menu-item', '');
      btn.className = 'mat-mdc-menu-item mat-focus-indicator ng-star-inserted';
      btn.setAttribute('role', 'menuitem');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-disabled', 'false');
      btn.setAttribute(MARKER, 'true');

      // 页面启用 TrustedHTML，不能用 innerHTML，用纯 DOM API 构建
      const textSpan = document.createElement('span');
      textSpan.className = 'mat-mdc-menu-item-text';

      const iconSpan = document.createElement('span');
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.className = 'start-icon material-symbols-outlined notranslate';
      iconSpan.textContent = NEW_ICON;

      const labelSpan = document.createElement('span');
      labelSpan.textContent = NEW_LABEL;

      textSpan.appendChild(iconSpan);
      textSpan.appendChild(labelSpan);
      btn.appendChild(textSpan);

      const ripple = document.createElement('div');
      ripple.setAttribute('matripple', '');
      ripple.className = 'mat-ripple mat-mdc-menu-ripple';
      btn.appendChild(ripple);

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 点击 backdrop 让 Angular Material 关闭菜单（合成 Escape 事件无效）
        const backdrop = document.querySelector('.cdk-overlay-backdrop');
        if (backdrop) backdrop.click();

        try {
          if (!window.InkrollLite) throw new Error(window.InkrollI18n.t('noLite'));
          const turnEl = pendingTurnEl;
          if (!turnEl) throw new Error(window.InkrollI18n.t('noTurn'));
          let idx = -1;
          const turns = document.querySelectorAll('.chat-turn-container');
          for (let i = 0; i < turns.length; i++) {
            if (turns[i] === turnEl) { idx = i; break; }
          }
          if (idx < 0) throw new Error(window.InkrollI18n.t('listChanged'));
          await window.InkrollExport.exportSingle(ADAPTER, idx);
        } catch (err) {
          console.error('[ms-png]', err);
        }
      });
      return btn;
    },

    processMenu(content) {
      if (content.querySelector('[' + MARKER + ']')) return; // 已处理过

      // 1. 干掉 "Make this an app"
      [...content.querySelectorAll('.mat-mdc-menu-item')].forEach((btn) => {
        const t = (btn.innerText || '').trim().replace(/\s+/g, ' ');
        if (t.includes(REMOVE_LABEL)) btn.remove();
      });

      // 2. 在 "Branch from here" 下面插入 Download as PNG（所有菜单一致，含 thinking turn）
      const branch = [...content.querySelectorAll('.mat-mdc-menu-item')].find((btn) =>
        (btn.innerText || '').trim().replace(/\s+/g, ' ').includes(INSERT_AFTER_LABEL)
      );
      if (branch && branch.parentElement) {
        branch.insertAdjacentElement('afterend', this.buildButton());
      }
    },

    // ---------- MutationObserver: 菜单每次打开都会重建 ----------
    initMenu() {
      let timer = null;
      const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          document.querySelectorAll(MENU_SELECTOR).forEach((c) => this.processMenu(c));
        }, 80);
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

  window.AiStudioAdapter = ADAPTER; // 调试用
})();
