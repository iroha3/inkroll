import type { CardConfig as CoreCardConfig, ThemeStyle } from '@inkroll/core';

export type { ThemeStyle };
export type FontStyle = 'sans' | 'serif' | 'mono';
export type RenderMode = 'continuous' | 'paged';

export interface CardConfig extends CoreCardConfig {
  showRoleBadges: boolean;
  userBadgeText: string;
  userBadgeIcon: string;
  assistantBadgeText: string;
  assistantBadgeIcon: string;
  canvasBg: 'neutral-gray' | 'light-slate' | 'pure-white' | 'dark-mode' | 'grid-pattern';
  exportScale: 2 | 3;
}

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  content: string;
  config: Partial<CardConfig>;
}
