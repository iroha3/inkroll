export type ThemeStyle =
  | 'classic-white'
  | 'warm-paper'
  | 'forest-paper'
  | 'kami-paper'
  | 'soft-blue'
  | 'lavender'
  | 'minimal-dark'
  | 'emerald-dark';

export interface CardConfig {
  /** 卡片宽度 px（默认 500） */
  cardWidth: number;
  /** 主题样式名 */
  theme: ThemeStyle;
  /** 内边距 */
  padding: 'compact' | 'normal' | 'spacious';
  /** 圆角 px */
  borderRadius: number;
  /** 字体族 */
  fontFamily: 'sans' | 'serif' | 'mono';
  /** 字号：预设或像素数值 */
  fontSize: 'sm' | 'base' | 'lg' | number;
  /** 行高 */
  lineHeight: 'normal' | 'relaxed' | 'loose';
  /** 是否显示卡片大标题 */
  showTitle: boolean;
  /** 标题文字 */
  titleText: string;
  /** 是否显示底部水印 */
  showWatermark: boolean;
  /** 水印文字 */
  watermarkText: string;
  /** 水印对齐 */
  watermarkPosition: 'bottom-right' | 'bottom-center';
  /** 导出倍率（默认 3） */
  exportScale: 2 | 3;
  /** 导出格式 */
  exportFormat: 'png' | 'jpeg';
  /** 自定义背景色（覆盖主题） */
  customBgColor?: string;
  /** 自定义文字色（覆盖主题） */
  customTextColor?: string;
}

export type InkrollOptions = Partial<CardConfig> & {
  width?: number;
  scale?: 2 | 3;
  format?: 'png' | 'jpeg';
  fileName?: string;
};

export interface ThemeColors {
  bg: string;
  text: string;
  border: string;
  shadow: string;
}

export type ThemeVars = Record<string, string>;

export interface ExportOptions {
  scale?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
  fileName?: string;
}

export type MermaidRenderer = (code: string) => Promise<string> | string;

export interface CoreExtensions {
  mermaidRenderer?: MermaidRenderer;
}

export interface InkrollAPI {
  version: string;
  /** 渲染卡片 DOM 节点 */
  render: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) => HTMLElement;
  /** 渲染并导出为图片 Data URL */
  toImage: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) => Promise<string>;
  /** 渲染并下载图片 */
  download: (markdown: string, options?: InkrollOptions, extensions?: CoreExtensions) => Promise<void>;
  /** 直接将某个元素导出为图片 Data URL */
  exportElement: (element: HTMLElement, scale?: number, format?: 'png' | 'jpeg') => Promise<string>;
  /** 下载给定的 Data URL */
  downloadDataUrl: (dataUrl: string, filename: string) => void;
}
