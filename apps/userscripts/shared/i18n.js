/* ============================================================
 * 共享 i18n：自动检测语言（zh → 中文，其他 → English）
 * 暴露 window.InkrollI18n = { t(key), isZh }
 * ============================================================ */
(function () {
  'use strict';

  const zh = (navigator.language || '').toLowerCase().startsWith('zh');
  const T = {
    // 按钮
    exportAll: zh ? '导出当前对话为图片' : 'Export all chats as PNG',
    // 引擎
    exporting: zh ? '正在导出 PNG…' : 'Exporting PNG…',
    exported: zh ? 'PNG 已导出' : 'PNG exported',
    exportFailed: zh ? '导出失败：' : 'Export failed: ',
    nothingToExport: zh ? '没有可导出的内容' : 'Nothing to export',
    // 平台错误（ai-studio adapter）
    noConvId: zh ? '无法从 URL 获取对话 ID' : 'Cannot get conversation ID from URL',
    noSession: zh ? 'SAPISID cookie 不可用（未登录？）' : 'SAPISID cookie unavailable (not logged in?)',
    noApiKey: zh ? '未找到页面 API key' : 'Page API key not found',
    parseFail: zh ? '响应解析失败' : 'Failed to parse response',
    apiNetwork: zh ? 'API 网络错误' : 'API network error',
    noMessages: zh ? 'RPC 返回中没有消息' : 'No messages in RPC response',
    noLite: zh ? 'InkrollLite 未加载' : 'InkrollLite not loaded',
    noTurn: zh ? '找不到当前消息，请重试' : 'Current message not found, please retry',
    listChanged: zh ? '消息列表已变化，请重试' : 'Message list changed, please retry',
  };

  window.InkrollI18n = {
    t: (k) => (k in T ? T[k] : k),
    isZh: zh,
  };
})();
