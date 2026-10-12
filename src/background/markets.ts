import { getMarkets, NetworkError, RateLimitedError } from '@/core/coingecko';
import type { Settings } from '@/core/settings';
import { getSettings, type MarketsCache, marketsItem, marketsProblemItem } from '@/core/store';
import { updateBadge } from './badge';
import { gate, requestOptions } from './context';

/** 缓存多久以内算新鲜：刷新间隔的九成，至少 15 秒；自动刷新关掉时按 1 分钟算 */
export function freshFor(settings: Settings): number {
  const interval = settings.refreshInterval || 60;
  return Math.max(15_000, interval * 900);
}

export function isFresh(cache: MarketsCache | null, settings: Settings, now: number): boolean {
  return (
    !!cache &&
    cache.currency === settings.currency &&
    settings.coins.every((id) => cache.ids.includes(id)) &&
    now - cache.fetchedAt < freshFor(settings)
  );
}

let inflight: Promise<void> | null = null;

const requestKey = (s: Settings) => `${s.currency}:${s.coins.join(',')}`;

/**
 * 刷新自选币的行情，写进缓存，再更新工具栏图标。
 * 失败时把原因记下来（弹窗会显示“正在显示几分钟前的价格”），缓存里的旧价格保留，然后把错误抛给调用的地方。
 * 弹窗打开、定时器、设置变化可能同时要求刷新，正在请求时直接共用那一次；
 * 请求期间自选列表或货币变了，请求成功后按新设置再补一次。
 */
export function refreshMarkets({ force }: { force: boolean }): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const used = await doRefresh(force);
    if (used !== null && requestKey(await getSettings()) !== used) await doRefresh(false);
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** 返回这次请求用的设置；缓存新鲜、没有请求时返回 null */
async function doRefresh(force: boolean): Promise<string | null> {
  const settings = await getSettings();
  const cache = await marketsItem.getValue();
  if (!force && isFresh(cache, settings, Date.now())) return null;
  try {
    const coins =
      settings.coins.length === 0
        ? []
        : await gate.run(async () => getMarkets(settings.coins, settings.currency, await requestOptions()));
    await marketsItem.setValue({
      currency: settings.currency,
      fetchedAt: Date.now(),
      ids: settings.coins,
      coins: Object.fromEntries(coins.map((c) => [c.id, c])),
    });
    await marketsProblemItem.setValue(null);
    return requestKey(settings);
  } catch (e) {
    const at = Date.now();
    await marketsProblemItem.setValue(
      e instanceof RateLimitedError
        ? { kind: 'rate-limited', at, retryAt: e.retryAt }
        : e instanceof NetworkError
          ? { kind: 'offline', at }
          : { kind: 'failed', at },
    );
    throw e;
  } finally {
    await updateBadge();
  }
}
