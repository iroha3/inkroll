import '@inkroll/core/styles';
import '@inkroll/core/katex-embedded';
import { InkrollCore, THEMES, type ThemeStyle, type InkrollOptions } from '@inkroll/core';

const THEME_NAMES: Record<ThemeStyle, string> = {
  'classic-white': '经典纯白 (Classic White)',
  'warm-paper': '暖调纸张 (Warm Paper)',
  'forest-paper': '松墨黛绿 (Forest Paper)',
  'kami-paper': 'Kami 和纸 (Kami Paper)',
  'soft-blue': '柔蓝印记 (Soft Blue)',
  'lavender': '淡雅薰衣草 (Lavender)',
  'minimal-dark': '极简暗黑 (Minimal Dark)',
  'emerald-dark': '翡翠深邃 (Emerald Dark)',
};

function $(id: string) {
  return document.getElementById(id);
}

const themeSelect = $('opt-theme') as HTMLSelectElement;
for (const key in THEME_NAMES) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = THEME_NAMES[key as ThemeStyle];
  themeSelect.appendChild(opt);
}

const mdInput = $('md-input') as HTMLTextAreaElement;
const testDoc = $('test-doc');
if (testDoc && mdInput) {
  mdInput.value = testDoc.textContent?.trim() || '';
}

function getOptions(): InkrollOptions {
  return {
    theme: ($('opt-theme') as HTMLSelectElement).value as ThemeStyle,
    cardWidth: parseInt(($('opt-width') as HTMLInputElement).value, 10) || 500,
    fontFamily: ($('opt-font') as HTMLSelectElement).value as any,
    fontSize: parseFloat(($('opt-fontsize') as HTMLInputElement).value) || 15,
    lineHeight: ($('opt-lineheight') as HTMLSelectElement).value as any,
    padding: ($('opt-padding') as HTMLSelectElement).value as any,
    borderRadius: parseInt(($('opt-radius') as HTMLInputElement).value, 10) || 12,
    exportScale: (parseInt(($('opt-scale') as HTMLSelectElement).value, 10) || 3) as 2 | 3,
    showWatermark: ($('opt-watermark') as HTMLInputElement).checked,
    watermarkText: ($('opt-watermark-text') as HTMLInputElement).value,
    showTitle: false,
  };
}

function renderPreview() {
  const host = $('card-host');
  if (!host) return;
  host.innerHTML = '';
  try {
    const card = InkrollCore.render(mdInput.value, getOptions());
    host.appendChild(card);
  } catch (err: any) {
    const p = document.createElement('p');
    p.textContent = `渲染失败：${err.message}`;
    p.style.color = '#b91c1c';
    host.appendChild(p);
  }
}

$('btn-render')?.addEventListener('click', renderPreview);

$('btn-export')?.addEventListener('click', async () => {
  const info = $('img-info');
  const host = $('img-host');
  if (!info || !host) return;

  info.textContent = 'SVG foreignObject 光栅化导出中…';
  const startTime = performance.now();
  try {
    const dataUrl = await InkrollCore.toImage(mdInput.value, getOptions());
    const duration = Math.round(performance.now() - startTime);
    const img = new Image();
    img.onload = () => {
      info.textContent = `导出成功！分辨率 ${img.naturalWidth} × ${img.naturalHeight} px (耗时 ${duration}ms)`;
    };
    img.src = dataUrl;
    host.innerHTML = '';
    host.appendChild(img);
  } catch (err: any) {
    info.textContent = `导出失败：${err.message}`;
  }
});

$('btn-download')?.addEventListener('click', async () => {
  const info = $('img-info');
  if (info) info.textContent = '生成下载文件中…';
  try {
    await InkrollCore.download(mdInput.value, {
      ...getOptions(),
      fileName: 'inkroll-lite-demo',
    });
    if (info) info.textContent = '下载已触发！';
  } catch (err: any) {
    if (info) info.textContent = `下载失败：${err.message}`;
  }
});

// 初始渲染一次
renderPreview();
