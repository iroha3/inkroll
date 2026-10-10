/* ============================================================
 * 共享 UI：toast + 右下角「导出全部」按钮
 *   - 36×36 圆形按钮 + SVG 图标 + hover 气泡 + 进度环 + 三态机
 *   - 视觉规范对齐 AfterChat（docs/DESIGN.md：小、克制、不打扰）
 *   - AfterChat 按钮（#m365-export-btn）存在时自动避让到其左侧
 * 暴露 window.InkrollExportUI = { showToast, createButton }
 * ============================================================ */
(function () {
  'use strict';

  const BTN_ID = 'inkroll-export-all-btn';
  const AC_BTN_ID = 'm365-export-btn';

  /* ---------- toast（菜单/按钮共用反馈） ---------- */
  let toastTimer = null;
  function showToast(msg, duration = 2500) {
    const old = document.getElementById('inkroll-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.id = 'inkroll-toast';
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', left: '50%', bottom: '28px', transform: 'translateX(-50%)',
      background: '#323232', color: '#fff', padding: '10px 20px', borderRadius: '6px',
      fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.3)', zIndex: '2147483647',
      fontFamily: 'Segoe UI, "Helvetica Neue", sans-serif', opacity: '0',
      transition: 'opacity .2s ease', pointerEvents: 'none', whiteSpace: 'nowrap',
    });
    document.body.appendChild(t);
    void t.offsetWidth; // 强制 reflow，确保淡入过渡生效
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 250);
    }, duration);
  }

  /* ---------- SVG 图标（对齐 AC：18×18 / stroke 2 / round） ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function iconSvg(kind) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    if (kind === 'image') {
      // 图片/长图图标：矩形 + 太阳 + 山（导出 PNG 长图）
      svg.innerHTML = '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
        '<circle cx="8.5" cy="10" r="1.5"/>' +
        '<path d="M5 17l4-5 3.5 4 2.5-3 4 4"/>';
    } else if (kind === 'check') {
      svg.innerHTML = '<path d="M4 12l5 5L20 6"/>';
    }
    return svg;
  }

  /* ---------- 右下角按钮 ---------- */
  function createButton(opts) {
    const tooltipText = opts.tooltip || window.InkrollI18n.t('exportAll');

    const container = document.createElement('div');
    container.style.cssText =
      'position:fixed;bottom:20px;right:20px;z-index:999999;' +
      'display:flex;flex-direction:column;align-items:center;';

    const tooltip = document.createElement('div');
    tooltip.textContent = tooltipText;
    tooltip.style.cssText =
      'position:absolute;bottom:44px;right:0;' + // 右对齐按钮（与 AC 一致）
      'background:#ffffff;border:1px solid #e8e8e8;' +
      'border-radius:7px;padding:5px 10px;font:12px "Segoe UI",sans-serif;color:#242424;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.08);display:none;pointer-events:none;white-space:nowrap;';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;width:36px;height:36px;';

    // 进度环（与按钮同尺寸，紧贴边缘）
    const ring = document.createElementNS(SVG_NS, 'svg');
    ring.setAttribute('width', '36');
    ring.setAttribute('height', '36');
    ring.setAttribute('viewBox', '0 0 36 36');
    ring.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
    const track = document.createElementNS(SVG_NS, 'circle');
    track.setAttribute('cx', '18'); track.setAttribute('cy', '18'); track.setAttribute('r', '16');
    track.setAttribute('fill', 'none'); track.setAttribute('stroke', '#e8e8e8'); track.setAttribute('stroke-width', '2');
    const bar = document.createElementNS(SVG_NS, 'circle');
    bar.setAttribute('cx', '18'); bar.setAttribute('cy', '18'); bar.setAttribute('r', '16');
    bar.setAttribute('fill', 'none'); bar.setAttribute('stroke', '#242424'); bar.setAttribute('stroke-width', '2');
    bar.setAttribute('stroke-linecap', 'round');
    bar.setAttribute('stroke-dasharray', '100.5'); // 2πr ≈ 100.5
    bar.setAttribute('stroke-dashoffset', '0');
    bar.style.transform = 'rotate(-90deg)';
    bar.style.transformOrigin = 'center';
    ring.appendChild(track);
    ring.appendChild(bar);

    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.style.cssText =
      'width:36px;height:36px;border-radius:50%;background:#ffffff;border:1px solid #e0e0e0;' +
      'cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 1px 3px rgba(0,0,0,0.06);color:#242424;padding:0;' +
      'transition:background 0.15s, border-color 0.15s;';

    let icon = iconSvg('image');
    btn.appendChild(icon);

    // tooltip 控制：hover 显示功能名；导出中/错误时强制显示状态文字（对齐 AC：无系统 title、无独立 toast）
    let hovering = false;
    let forcedTip = null;
    let forcedTimer = null;
    function updateTooltip() {
      if (forcedTip) {
        tooltip.textContent = forcedTip;
        tooltip.style.display = '';
      } else if (hovering) {
        tooltip.textContent = tooltipText;
        tooltip.style.display = '';
      } else {
        tooltip.style.display = 'none';
      }
    }
    function setForcedTip(text, ms) {
      clearTimeout(forcedTimer);
      forcedTip = text;
      updateTooltip();
      if (ms) forcedTimer = setTimeout(() => { forcedTip = null; updateTooltip(); }, ms);
    }

    btn.onmouseenter = () => {
      btn.style.background = '#f5f5f5';
      btn.style.borderColor = '#d0d0d0';
      hovering = true;
      updateTooltip();
    };
    btn.onmouseleave = () => {
      btn.style.background = '#ffffff';
      btn.style.borderColor = '#e0e0e0';
      hovering = false;
      updateTooltip();
    };

    // 旋转动画（不定态：导出中）
    if (!document.getElementById('inkroll-btn-anim')) {
      const s = document.createElement('style');
      s.id = 'inkroll-btn-anim';
      s.textContent = '@keyframes inkroll-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }

    // ---------- 三态机：IDLE → EXPORTING → DONE → IDLE ----------
    let state = 'IDLE';
    let resetTimer = null;
    function setIcon(kind) {
      icon.remove();
      icon = iconSvg(kind);
      btn.appendChild(icon);
    }
    function setState(s) {
      state = s;
      clearTimeout(resetTimer);
      if (s === 'EXPORTING') {
        setIcon('image');
        ring.style.display = '';
        bar.style.animation = 'inkroll-spin 1.2s linear infinite';
        setForcedTip(window.InkrollI18n.t('exporting'));
      } else if (s === 'DONE') {
        ring.style.display = 'none';
        bar.style.animation = '';
        setIcon('check');
        setForcedTip(null);
        resetTimer = setTimeout(() => { setIcon('image'); }, 2000);
      } else { // IDLE
        ring.style.display = 'none';
        bar.style.animation = '';
        setIcon('image');
        setForcedTip(null);
      }
    }

    btn.onclick = async () => {
      if (state !== 'IDLE') return;
      setState('EXPORTING');
      try {
        await opts.onClick();
        setState('DONE');
      } catch (err) {
        console.error('[inkroll-export]', err);
        setState('IDLE');
        setForcedTip(window.InkrollI18n.t('exportFailed') + (err && err.message ? err.message : err), 4000);
      }
    };

    wrapper.appendChild(ring);
    wrapper.appendChild(btn);
    container.appendChild(tooltip);
    container.appendChild(wrapper);
    document.body.appendChild(container);

    // ---------- AfterChat 避让：AC 按钮存在时，我们的按钮移到它正上方 ----------
    function applyAvoidance() {
      if (document.getElementById(AC_BTN_ID)) {
        container.style.bottom = '64px'; // 20 + 36 + 8 间距
        container.style.right = '20px';
      } else {
        container.style.bottom = '20px';
        container.style.right = '20px';
      }
    }
    applyAvoidance();
    // AC 按钮可能是 SPA 加载后才注入的，观察一段时间内的变化
    const observer = new MutationObserver(() => applyAvoidance());
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000); // 30s 后停止观察，避免长期开销

    return { container, btn };
  }

  window.InkrollExportUI = { showToast, createButton };
})();
