// 纯环境适配层：优先读取全局注入的 markdownit / katex（油猴脚本、原生打样或页面已注入的 vendor）
export function getMarkdownIt(): any {
  if (typeof window !== 'undefined' && (window as any).markdownit) {
    return (window as any).markdownit;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).markdownit) {
    return (globalThis as any).markdownit;
  }
  return null;
}

export function getKatex(): any {
  if (typeof window !== 'undefined' && (window as any).katex) {
    return (window as any).katex;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).katex) {
    return (globalThis as any).katex;
  }
  return null;
}
