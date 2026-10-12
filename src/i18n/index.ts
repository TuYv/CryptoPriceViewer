import { en } from './messages/en';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import { zh } from './messages/zh';
import type { MessageKey, Messages } from './types';

export type { MessageKey, Messages };

export const LANGUAGES = ['zh', 'en', 'ja', 'ko'] as const;
export type Language = (typeof LANGUAGES)[number];

export const MESSAGES: Record<Language, Messages> = { zh, en, ja, ko };

/** 取一条界面文字，{name} 形式的占位符用 params 里的值替换 */
export function t(lang: Language, key: MessageKey, params?: Record<string, string | number>): string {
  const text = MESSAGES[lang][key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

/** 把浏览器语言（比如 zh-CN、ja、ko-KR、en-GB）换成扩展支持的四种语言之一，其余一律用英文 */
export function languageFromLocale(locale: string): Language {
  const lower = locale.toLowerCase();
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('ko')) return 'ko';
  return 'en';
}
