import type { CardConfig, InkrollOptions, ThemeColors, ThemeStyle, ThemeVars } from './types';

export const THEMES: Record<ThemeStyle, ThemeColors> = {
  'classic-white': {
    bg: '#ffffff',
    text: '#111827',
    border: '#e5e7eb',
    shadow: '0 1px 3px 0 rgb(229 229 229 / 0.5), 0 1px 2px -1px rgb(229 229 229 / 0.5)',
  },
  'warm-paper': {
    bg: '#fcfaf6',
    text: '#1c1917',
    border: '#e7e3d8',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  'forest-paper': {
    bg: '#f4f0e6',
    text: '#1b382b',
    border: '#e0dbd1',
    shadow: '0 1px 3px 0 rgb(214 203 176 / 0.5), 0 1px 2px -1px rgb(214 203 176 / 0.5)',
  },
  'kami-paper': {
    bg: '#f5f4ed',
    text: '#141413',
    border: '#e8e6dc',
    shadow: '0 1px 3px 0 rgba(20, 20, 19, 0.06), 0 1px 2px -1px rgba(20, 20, 19, 0.06)',
  },
  'soft-blue': {
    bg: '#f8fafc',
    text: '#0f172a',
    border: '#dbeafe',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  'lavender': {
    bg: '#faf5ff',
    text: '#2e1065',
    border: '#f3e8ff',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  'minimal-dark': {
    bg: '#0d1117',
    text: '#e6edf3',
    border: '#30363d',
    shadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
  },
  'emerald-dark': {
    bg: '#0e1713',
    text: '#d8e6e0',
    border: '#26362f',
    shadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
  },
};

export const LIGHT_VARS: ThemeVars = {
  '--md-accent': '#2563eb',
  '--md-heading-weight': '700',
  '--md-highlight-bg': 'rgba(254, 240, 138, 0.9)',
  '--md-highlight-text': '#111827',
  '--md-border': '#e5e7eb',
  '--md-code-bg': '#f4f4f5',
  '--md-code-border': '#e5e7eb',
  '--md-code-head-bg': '#e5e7eb',
  '--md-code-head-text': '#52525b',
  '--md-quote-bg': '#fafafa',
  '--md-table-head-bg': '#f5f5f5',
  '--md-muted': '#a1a1aa',
  '--md-check-border': '#d4d4d8',
  '--md-link': '#0066cc',
  '--md-link-hover': '#1e40af',
};

export const FOREST_VARS: ThemeVars = {
  '--md-accent': '#1b4d3e',
  '--md-heading-weight': '700',
  '--md-highlight-bg': 'rgba(214, 203, 176, 0.6)',
  '--md-highlight-text': '#1b382b',
  '--md-border': '#e0dbd1',
  '--md-code-bg': '#ebe4d3',
  '--md-code-border': '#e0dbd1',
  '--md-code-head-bg': '#e3dbca',
  '--md-code-head-text': '#56665a',
  '--md-quote-bg': '#ebe3d1',
  '--md-table-head-bg': '#e6ded0',
  '--md-muted': '#7b877a',
  '--md-check-border': '#a8b5a7',
  '--md-link': '#1b4d3e',
  '--md-link-hover': '#13392e',
};

export const KAMI_VARS: ThemeVars = {
  '--md-accent': '#1b365d',
  '--md-heading-weight': '600',
  '--md-highlight-bg': 'rgba(27, 54, 93, 0.1)',
  '--md-highlight-text': '#1b365d',
  '--md-border': '#e8e6dc',
  '--md-code-bg': '#f0eee6',
  '--md-code-border': '#e8e6dc',
  '--md-code-head-bg': '#eae7dc',
  '--md-code-head-text': '#504e49',
  '--md-quote-bg': '#faf9f5',
  '--md-table-head-bg': '#eae7dc',
  '--md-muted': '#6b6a64',
  '--md-check-border': '#b8b5aa',
  '--md-link': '#1b365d',
  '--md-link-hover': '#2d5a8a',
};

export const DARK_VARS: ThemeVars = {
  '--md-accent': '#58a6ff',
  '--md-heading-weight': '700',
  '--md-highlight-bg': 'rgba(56, 139, 253, 0.25)',
  '--md-highlight-text': '#e6edf3',
  '--md-border': '#30363d',
  '--md-code-bg': '#161b22',
  '--md-code-border': '#30363d',
  '--md-code-head-bg': '#21262d',
  '--md-code-head-text': '#8b949e',
  '--md-quote-bg': '#161b22',
  '--md-table-head-bg': '#21262d',
  '--md-muted': '#8b949e',
  '--md-check-border': '#8b949e',
  '--md-link': '#58a6ff',
  '--md-link-hover': '#79c0ff',
};

export const EMERALD_VARS: ThemeVars = {
  '--md-accent': '#45c9a8',
  '--md-heading-weight': '700',
  '--md-highlight-bg': 'rgba(69, 201, 168, 0.2)',
  '--md-highlight-text': '#d8e6e0',
  '--md-border': '#26362f',
  '--md-code-bg': '#152019',
  '--md-code-border': '#26362f',
  '--md-code-head-bg': '#1b2a23',
  '--md-code-head-text': '#8aa398',
  '--md-quote-bg': '#152019',
  '--md-table-head-bg': '#1b2a23',
  '--md-muted': '#8aa398',
  '--md-check-border': '#4d6259',
  '--md-link': '#45c9a8',
  '--md-link-hover': '#6fddc2',
};

export const THEME_VARS: Record<ThemeStyle, ThemeVars> = {
  'classic-white': LIGHT_VARS,
  'warm-paper': LIGHT_VARS,
  'soft-blue': LIGHT_VARS,
  'lavender': LIGHT_VARS,
  'forest-paper': FOREST_VARS,
  'kami-paper': KAMI_VARS,
  'minimal-dark': DARK_VARS,
  'emerald-dark': EMERALD_VARS,
};

export const DEFAULT_CONFIG: CardConfig = {
  cardWidth: 500,
  theme: 'classic-white',
  padding: 'normal',
  borderRadius: 12,
  fontFamily: 'sans',
  fontSize: 'base',
  lineHeight: 'relaxed',
  showTitle: false,
  titleText: '',
  showWatermark: true,
  watermarkText: 'By InkRoll',
  watermarkPosition: 'bottom-right',
  exportScale: 3,
  exportFormat: 'png',
  customBgColor: '',
  customTextColor: '',
  scene: 'xiaohongshu',
};

export function normalizeConfig(options?: InkrollOptions): CardConfig {
  const cfg: CardConfig = { ...DEFAULT_CONFIG };
  if (!options) return cfg;

  if (options.cardWidth !== undefined) cfg.cardWidth = options.cardWidth;
  if (options.width !== undefined) cfg.cardWidth = options.width;
  if (options.theme) cfg.theme = options.theme;
  if (options.padding) cfg.padding = options.padding;
  if (options.borderRadius !== undefined) cfg.borderRadius = options.borderRadius;
  if (options.fontFamily) cfg.fontFamily = options.fontFamily;
  if (options.fontSize !== undefined) cfg.fontSize = options.fontSize;
  if (options.lineHeight) cfg.lineHeight = options.lineHeight;
  if (options.showTitle !== undefined) cfg.showTitle = options.showTitle;
  if (options.titleText !== undefined) cfg.titleText = options.titleText;
  if (options.showWatermark !== undefined) cfg.showWatermark = options.showWatermark;
  if (options.watermarkText !== undefined) cfg.watermarkText = options.watermarkText;
  if (options.watermarkPosition) cfg.watermarkPosition = options.watermarkPosition;
  if (options.exportScale !== undefined) cfg.exportScale = options.exportScale;
  if (options.scale !== undefined) cfg.exportScale = options.scale;
  if (options.exportFormat) cfg.exportFormat = options.exportFormat;
  if (options.format) cfg.exportFormat = options.format;
  if (options.customBgColor !== undefined) cfg.customBgColor = options.customBgColor;
  if (options.customTextColor !== undefined) cfg.customTextColor = options.customTextColor;
  if (options.scene) cfg.scene = options.scene;

  return cfg;
}
