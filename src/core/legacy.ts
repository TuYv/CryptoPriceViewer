import { normalizeSettings, type Settings } from './settings';

/** 0.1.x 存设置用的键（在 chrome.storage.local 里） */
export const LEGACY_SETTINGS_KEY = 'cryptoAppSetting';

/** 0.1.x 留下的其他键，转换完成后一起删掉 */
export const LEGACY_KEYS = [
  LEGACY_SETTINGS_KEY,
  'cryptoPriceViewerState',
  'crypto_tracker_settings',
  'coinGeckoApiLockState',
  'lastFeedbackTime',
  'notionToken',
  'notionDatabaseId',
];

/** 0.1.x 内置的代码到 CoinGecko id 的对应 */
const LEGACY_DEFAULT_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
};

/**
 * 把 0.1.x 的设置转成新格式。
 * 旧格式：{ selectedCoins: ['BTC', ...], coinGeckoIds: { BTC: 'bitcoin' }, pinnedCoin: 'BTC',
 *          currency: 'USD', refreshInterval: '30' 或 30, language: 'zh' }
 */
export function convertLegacySettings(old: unknown): Settings {
  const o = (old && typeof old === 'object' ? old : {}) as Record<string, unknown>;
  const ids = (o.coinGeckoIds && typeof o.coinGeckoIds === 'object' ? o.coinGeckoIds : {}) as Record<string, unknown>;
  const toId = (symbol: unknown): string | null => {
    if (typeof symbol !== 'string' || !symbol.trim()) return null;
    const upper = symbol.trim().toUpperCase();
    const mapped = ids[upper];
    if (typeof mapped === 'string' && mapped) return mapped.toLowerCase();
    return LEGACY_DEFAULT_IDS[upper] ?? upper.toLowerCase();
  };
  const coins = Array.isArray(o.selectedCoins)
    ? o.selectedCoins.map(toId).filter((id): id is string => id !== null)
    : undefined;
  return normalizeSettings({
    coins,
    pinned: toId(o.pinnedCoin),
    currency: typeof o.currency === 'string' ? o.currency.toLowerCase() : undefined,
    refreshInterval: Number(o.refreshInterval),
    language: o.language,
  });
}

/** 已经有新格式的设置时（比如另一台电脑升级后同步过来了），把这台电脑旧列表里多出来的币接在后面 */
export function mergeLegacyInto(current: Settings, legacy: Settings): Settings {
  const extra = legacy.coins.filter((id) => !current.coins.includes(id));
  return normalizeSettings({ ...current, coins: [...current.coins, ...extra] });
}
