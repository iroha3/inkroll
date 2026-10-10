/* ============================================================
 * 共享导出引擎：单条（消息菜单）/ 全部（右下角按钮）导出流程
 * 平台无关，只依赖 PlatformAdapter 接口 + window.InkrollLite + InkrollExportUI：
 *   adapter.fetchConversationData()        → Promise<{ messages[], modelName }>
 *   adapter.messagesToMarkdown(data, sel)  → string（sel: { idx } 或 { all }）
 *   adapter.watermarkFor(modelName)        → 水印文案
 * 暴露 window.InkrollExport = { exportSingle, exportAll }
 * ============================================================ */
(function () {
  'use strict';

  async function downloadData(adapter, data, sel) {
    const md = adapter.messagesToMarkdown(data, sel);
    if (!md) throw new Error(window.InkrollI18n.t('nothingToExport'));
    const opts = { watermarkText: adapter.watermarkFor(data.modelName) };
    // 文件名：inkroll-<模型slug>[-all]-<时间>.png（时间精确到秒）
    if (data.modelName) opts.fileName = data.modelName + (sel && sel.all ? '-all' : '');
    // 平台可定制导出选项（如 width/theme/scale 等，可选钩子）
    if (typeof adapter.exportOptions === 'function') {
      Object.assign(opts, adapter.exportOptions());
    }
    await window.InkrollLite.download(md, opts);
  }

  /** 菜单「Download as PNG」：导出当前消息 */
  async function exportSingle(adapter, idx) {
    const ui = window.InkrollExportUI;
    const t = window.InkrollI18n.t;
    ui.showToast(t('exporting'), 60000);
    try {
      const data = await adapter.fetchConversationData();
      await downloadData(adapter, data, { idx });
      ui.showToast(t('exported'), 3000);
    } catch (err) {
      console.error('[inkroll-export]', err);
      ui.showToast(t('exportFailed') + (err && err.message ? err.message : err), 5000);
      throw err; // 让菜单按钮的调用方知道失败（不弹未捕获错误）
    }
  }

  /** 右下角按钮：导出当前对话全部消息为一张 PNG 长图 */
  async function exportAll(adapter) {
    const data = await adapter.fetchConversationData();
    await downloadData(adapter, data, { all: true });
  }

  window.InkrollExport = { exportSingle, exportAll };
})();
