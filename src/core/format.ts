import type { Language } from '@/i18n';
import type { Currency } from './settings';

export const LOCALES: Record<Language, string> = { zh: 'zh-CN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' };

const MINUS = '−';

/** 价格：一万以上不带小数，1 以上两位小数，小于 1 保留 4 位有效数字 */
export function formatPrice(value: number | null | undefined, currency: Currency, lang: Language): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const base = { style: 'currency', currency: currency.toUpperCase(), currencyDisplay: 'narrowSymbol' } as const;
  const digits: Intl.NumberFormatOptions =
    value >= 10_000
      ? { maximumFractionDigits: 0 }
      : value >= 1
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { maximumSignificantDigits: 4 };
  return new Intl.NumberFormat(LOCALES[lang], { ...base, ...digits }).format(value);
}

/** 涨跌幅：+0.88%、−2.05%（用真正的减号） */
export function formatChange(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? MINUS : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

/** 市值、成交量这类大金额：中文 1.68万亿、日文 1.68兆、韩文 1.68조、英文 1.68T */
export function formatCompactMoney(value: number | null | undefined, currency: Currency, lang: Language): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '—';
  return new Intl.NumberFormat(LOCALES[lang], {
    style: 'currency',
    currency: currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number | null | undefined, lang: Language): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '—';
  return new Intl.NumberFormat(LOCALES[lang], { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

/** 工具栏图标上的文字，最多 5 个字符左右 */
export function formatBadge(value: number, mode: 'price' | 'change'): string {
  if (!Number.isFinite(value)) return '';
  if (mode === 'change') {
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    const abs = Math.abs(value);
    return `${sign}${abs >= 10 ? Math.round(abs) : abs.toFixed(1)}%`;
  }
  if (value >= 100_000) return `${Math.round(value / 1000)}k`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}k`;
  if (value >= 100) return String(Math.round(value));
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(2);
}

/** 32 秒前、5 分钟前、2 小时前 */
export function formatAgo(timestamp: number, now: number, lang: Language): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: 'auto' });
  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86_400) return rtf.format(-Math.floor(seconds / 3600), 'hour');
  return rtf.format(-Math.floor(seconds / 86_400), 'day');
}

/** 1 分钟后、30 秒后 */
export function formatIn(timestamp: number, now: number, lang: Language): string {
  const seconds = Math.max(1, Math.round((timestamp - now) / 1000));
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: 'auto' });
  if (seconds < 60) return rtf.format(seconds, 'second');
  if (seconds < 3600) return rtf.format(Math.ceil(seconds / 60), 'minute');
  return rtf.format(Math.ceil(seconds / 3600), 'hour');
}

export function formatClock(timestamp: number, lang: Language): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    timestamp,
  );
}

export function formatDate(timestamp: number, lang: Language, withYear = true): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    year: withYear ? 'numeric' : undefined,
    month: 'short',
    day: 'numeric',
  }).format(timestamp);
}

export function formatDateTime(timestamp: number, lang: Language): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp);
}
