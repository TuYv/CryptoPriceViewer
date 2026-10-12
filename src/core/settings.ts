import { LANGUAGES, type Language } from '@/i18n';

export const CURRENCIES = ['usd', 'cny', 'eur'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** 涨跌颜色：前一个是上涨的颜色，后一个是下跌的颜色 */
export const UP_DOWN_STYLES = ['red-green', 'green-red', 'red-blue'] as const;
export type UpDownStyle = (typeof UP_DOWN_STYLES)[number];

export const THEMES = ['auto', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const BADGE_MODES = ['price', 'change'] as const;
export type BadgeMode = (typeof BADGE_MODES)[number];

/** 自动刷新间隔（秒），0 表示关闭 */
export const REFRESH_INTERVALS = [0, 30, 60, 300, 600] as const;
export type RefreshInterval = (typeof REFRESH_INTERVALS)[number];

export const NEWS_SOURCE_IDS = ['panews', 'odaily', 'decrypt'] as const;
export type NewsSourceId = (typeof NEWS_SOURCE_IDS)[number];

/** 自选列表最多放多少个币。设置存在 chrome.storage.sync，单项不能超过 8KB */
export const MAX_COINS = 60;

export interface Settings {
  /** CoinGecko 的币种 id，按显示顺序排列 */
  coins: string[];
  /** 显示在工具栏图标上的币，必须在 coins 里 */
  pinned: string | null;
  currency: Currency;
  /** null 表示跟随浏览器语言 */
  language: Language | null;
  /** null 表示按语言的习惯 */
  upDown: UpDownStyle | null;
  theme: Theme;
  refreshInterval: RefreshInterval;
  badge: BadgeMode;
  /** 打开的资讯来源 */
  newsSources: NewsSourceId[];
}

export const DEFAULT_COINS = ['bitcoin', 'ethereum', 'solana', 'binancecoin'];

export const DEFAULT_SETTINGS: Settings = {
  coins: DEFAULT_COINS,
  pinned: null,
  currency: 'usd',
  language: null,
  upDown: null,
  theme: 'auto',
  refreshInterval: 60,
  badge: 'price',
  newsSources: [...NEWS_SOURCE_IDS],
};

const COIN_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

const oneOf = <T>(list: readonly T[], value: unknown, fallback: T): T =>
  list.includes(value as T) ? (value as T) : fallback;

/** 把从存储里读到的任何东西修正成一份合法的设置。缺的、坏的字段用默认值 */
export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const coins = Array.isArray(r.coins)
    ? [...new Set(r.coins.filter((id): id is string => typeof id === 'string' && COIN_ID.test(id)))].slice(0, MAX_COINS)
    : [...DEFAULT_SETTINGS.coins];
  const pinned = typeof r.pinned === 'string' && coins.includes(r.pinned) ? r.pinned : null;
  const newsSources = Array.isArray(r.newsSources)
    ? NEWS_SOURCE_IDS.filter((id) => (r.newsSources as unknown[]).includes(id))
    : [...DEFAULT_SETTINGS.newsSources];
  return {
    coins,
    pinned,
    currency: oneOf(CURRENCIES, r.currency, DEFAULT_SETTINGS.currency),
    language: r.language === null ? null : oneOf<Language | null>(LANGUAGES, r.language, null),
    upDown: r.upDown === null ? null : oneOf<UpDownStyle | null>(UP_DOWN_STYLES, r.upDown, null),
    theme: oneOf(THEMES, r.theme, DEFAULT_SETTINGS.theme),
    refreshInterval: oneOf(REFRESH_INTERVALS, r.refreshInterval, DEFAULT_SETTINGS.refreshInterval),
    badge: oneOf(BADGE_MODES, r.badge, DEFAULT_SETTINGS.badge),
    newsSources,
  };
}

/** 各语言用户习惯的涨跌颜色：中文红涨绿跌，韩文红涨蓝跌，日文和英文绿涨红跌（日本的币圈交易所都是绿涨红跌） */
export function defaultUpDown(lang: Language): UpDownStyle {
  switch (lang) {
    case 'zh':
      return 'red-green';
    case 'ko':
      return 'red-blue';
    default:
      return 'green-red';
  }
}

export const effectiveUpDown = (settings: Settings, lang: Language): UpDownStyle =>
  settings.upDown ?? defaultUpDown(lang);
