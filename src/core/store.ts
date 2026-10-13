import { storage } from '#imports';
import type { Language } from '@/i18n';
import type { ChartPoint, MarketCoin } from './coingecko';
import type { CoinMeta } from './coins';
import { EMPTY_GATE, type GateState } from './gate';
import { convertLegacySettings, LEGACY_KEYS, LEGACY_SETTINGS_KEY, mergeLegacyInto } from './legacy';
import type { NewsItem } from './news';
import { type Currency, DEFAULT_SETTINGS, type NewsSourceId, normalizeSettings, type Settings } from './settings';

/** 设置放在 sync 里：登录同一个 Chrome 账号的电脑之间会同步 */
export const settingsItem = storage.defineItem<Settings>('sync:settings', { fallback: DEFAULT_SETTINGS, version: 1 });

/** CoinGecko 免费密钥只存在这台电脑上，不同步 */
export const apiKeyItem = storage.defineItem<string>('local:apiKey', { fallback: '' });

export interface MarketsCache {
  currency: Currency;
  fetchedAt: number;
  /** 这次请求了哪些币。CoinGecko 不认识的 id 不会出现在 coins 里 */
  ids: string[];
  coins: Record<string, MarketCoin>;
}
export const marketsItem = storage.defineItem<MarketsCache | null>('local:markets', { fallback: null });

/** 最近一次刷新行情没成功的原因。成功后清空 */
export type MarketsProblem =
  | { kind: 'rate-limited'; at: number; retryAt: number }
  | { kind: 'offline'; at: number }
  | { kind: 'failed'; at: number };
export const marketsProblemItem = storage.defineItem<MarketsProblem | null>('local:marketsProblem', {
  fallback: null,
});

export interface ChartCacheEntry {
  fetchedAt: number;
  points: ChartPoint[];
}
export const chartsItem = storage.defineItem<Record<string, ChartCacheEntry>>('local:charts', { fallback: {} });

export interface NewsCache {
  lang: Language;
  fetchedAt: number;
  items: NewsItem[];
  /** 这次没抓到的来源 */
  failed: NewsSourceId[];
  /** 网络正常、但网站不再允许直接读取的来源，要请用户同意访问。旧的缓存里没有这一项 */
  blocked?: NewsSourceId[];
}
export const newsItem = storage.defineItem<NewsCache | null>('local:news', { fallback: null });

/** 用户打开过资讯页。打开之前，后台不会访问任何新闻网站 */
export const newsActivatedItem = storage.defineItem<boolean>('local:newsActivated', { fallback: false });

/** 通过搜索添加的币的名字和图标，价格还没回来时用来显示 */
export const coinMetaItem = storage.defineItem<Record<string, CoinMeta>>('local:coinMeta', { fallback: {} });

/** 请求次数记录放在 session 里：后台脚本被 Chrome 暂停后再启动也还在，关掉浏览器就清空 */
export const gateItem = storage.defineItem<GateState>('session:gate', { fallback: EMPTY_GATE });

export async function getSettings(): Promise<Settings> {
  return normalizeSettings(await settingsItem.getValue());
}

export async function updateSettings(change: (current: Settings) => Settings): Promise<Settings> {
  const next = normalizeSettings(change(await getSettings()));
  await settingsItem.setValue(next);
  return next;
}

/**
 * 把 0.1.x 存在本地的设置转成新格式，然后删掉旧数据。
 * 已经有新设置时（另一台电脑升级后同步过来了），只把这台电脑旧列表里多出来的币接在后面。
 * 没有旧数据时什么也不做，所以每次后台启动都可以放心调用。
 */
export async function migrateLegacySettings(): Promise<boolean> {
  const legacy = await storage.getItem<unknown>(`local:${LEGACY_SETTINGS_KEY}`);
  if (legacy == null) return false;
  const converted = convertLegacySettings(legacy);
  const existing = await storage.getItem<unknown>('sync:settings');
  await settingsItem.setValue(existing ? mergeLegacyInto(normalizeSettings(existing), converted) : converted);
  await storage.removeItems(LEGACY_KEYS.map((key) => `local:${key}` as const));
  return true;
}
