import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from '#imports';
import { type MarketCoin, NetworkError, RateLimitedError } from '@/core/coingecko';
import { DEFAULT_SETTINGS, type Settings } from '@/core/settings';
import {
  chartsItem,
  type MarketsCache,
  marketsItem,
  marketsProblemItem,
  newsActivatedItem,
  newsItem,
  settingsItem,
  updateSettings,
} from '@/core/store';
import { badgeFor } from './badge';
import { getChartCached } from './charts';
import { handleMessage, isMessage } from './handlers';
import { refreshMarkets } from './markets';
import { refreshNews } from './news';

const T0 = Date.UTC(2026, 9, 12, 8, 0, 0);

const coin = (id: string, price: number, change24h: number): MarketCoin => ({
  id,
  symbol: id.slice(0, 3).toUpperCase(),
  name: id[0]?.toUpperCase() + id.slice(1),
  image: '',
  price,
  change24h,
  change7d: null,
  marketCap: null,
  volume: null,
  circulating: null,
  totalSupply: null,
  high24h: null,
  low24h: null,
  ath: null,
  athDate: null,
  rank: null,
  spark: [],
});

const apiCoin = (id: string, price: number) => ({ id, symbol: id.slice(0, 3), name: id, current_price: price });

const respond = (body: unknown, status = 200) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fakeBrowser.reset();
  // 假浏览器没有实现这两个接口
  vi.spyOn(fakeBrowser.i18n, 'getUILanguage').mockReturnValue('en-US');
  vi.spyOn(fakeBrowser.i18n, 'getMessage').mockReturnValue('Crypto Price Viewer');
  vi.useFakeTimers({ now: T0, toFake: ['Date'] });
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** 假浏览器没有实现权限接口，按网站决定有没有权限 */
const grantOnly = (allowed: (origin: string) => boolean) =>
  vi
    .spyOn(fakeBrowser.permissions, 'contains')
    .mockImplementation((async (p: { origins?: string[] }) => allowed(p.origins?.[0] ?? '')) as never);

const setSettings = (patch: Partial<Settings>) => settingsItem.setValue({ ...DEFAULT_SETTINGS, ...patch });
const marketsUrl = (call: number) => new URL(fetchMock.mock.calls[call]?.[0]);

describe('badgeFor：工具栏图标', () => {
  const cache: MarketsCache = {
    currency: 'usd',
    fetchedAt: T0,
    ids: ['bitcoin', 'ethereum'],
    coins: { bitcoin: coin('bitcoin', 83698, 0.88), ethereum: coin('ethereum', 2552.85, -2.05) },
  };

  it('没固定币时不显示', () => {
    expect(badgeFor(DEFAULT_SETTINGS, cache, 'en')).toBeNull();
  });

  it('按语言的习惯上色：中文上涨是红色，英文上涨是绿色，韩文下跌是蓝色', () => {
    const btc = { ...DEFAULT_SETTINGS, coins: ['bitcoin', 'ethereum'], pinned: 'bitcoin' };
    expect(badgeFor(btc, cache, 'zh')).toMatchObject({ text: '83.7k', color: '#C42B2E' });
    expect(badgeFor(btc, cache, 'en')?.color).toBe('#0A7049');
    expect(badgeFor({ ...btc, pinned: 'ethereum' }, cache, 'ko')?.color).toBe('#0F5FC4');
  });

  it('用户选的涨跌颜色优先，显示涨跌幅模式', () => {
    const s = {
      ...DEFAULT_SETTINGS,
      coins: ['bitcoin'],
      pinned: 'bitcoin',
      upDown: 'green-red' as const,
      badge: 'change' as const,
    };
    expect(badgeFor(s, cache, 'zh')).toMatchObject({ text: '+0.9%', color: '#0A7049' });
  });

  it('鼠标停在图标上显示币名、价格和涨跌幅', () => {
    const s = { ...DEFAULT_SETTINGS, coins: ['bitcoin'], pinned: 'bitcoin' };
    expect(badgeFor(s, cache, 'en')?.title).toBe('Bitcoin  $83,698  +0.88%');
  });
});

describe('refreshMarkets：刷新行情', () => {
  it('请求自选币，写进缓存，更新工具栏图标', async () => {
    await setSettings({ coins: ['bitcoin', 'ethereum'], pinned: 'bitcoin', language: 'en' });
    fetchMock.mockResolvedValue(respond([apiCoin('bitcoin', 83698), apiCoin('ethereum', 2552)]));
    await refreshMarkets({ force: false });
    expect(marketsUrl(0).searchParams.get('ids')).toBe('bitcoin,ethereum');
    const cache = await marketsItem.getValue();
    expect(cache?.ids).toEqual(['bitcoin', 'ethereum']);
    expect(cache?.coins.bitcoin?.price).toBe(83698);
    expect(await marketsProblemItem.getValue()).toBeNull();
    expect(await fakeBrowser.action.getBadgeText({})).toBe('83.7k');
  });

  it('缓存还新鲜时不请求，强制刷新时请求', async () => {
    await setSettings({ coins: ['bitcoin'] });
    fetchMock.mockImplementation(async () => respond([apiCoin('bitcoin', 1)]));
    await refreshMarkets({ force: false });
    vi.setSystemTime(T0 + 30_000);
    await refreshMarkets({ force: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await refreshMarkets({ force: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('CoinGecko 不认识的币不会让缓存一直算“不完整”', async () => {
    await setSettings({ coins: ['bitcoin', 'doge'] });
    fetchMock.mockImplementation(async () => respond([apiCoin('bitcoin', 1)]));
    await refreshMarkets({ force: false });
    await refreshMarkets({ force: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('被限速：记下原因和解锁时间，旧价格保留；解锁前不再请求', async () => {
    await setSettings({ coins: ['bitcoin'] });
    await marketsItem.setValue({
      currency: 'usd',
      fetchedAt: T0 - 600_000,
      ids: ['bitcoin'],
      coins: { bitcoin: coin('bitcoin', 80000, 1) },
    });
    fetchMock.mockResolvedValue(respond('', 429));
    await expect(refreshMarkets({ force: false })).rejects.toBeInstanceOf(RateLimitedError);
    expect(await marketsProblemItem.getValue()).toEqual({ kind: 'rate-limited', at: T0, retryAt: T0 + 60_000 });
    expect((await marketsItem.getValue())?.coins.bitcoin?.price).toBe(80000);
    await expect(refreshMarkets({ force: true })).rejects.toBeInstanceOf(RateLimitedError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('断网：记下原因', async () => {
    await setSettings({ coins: ['bitcoin'] });
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(refreshMarkets({ force: true })).rejects.toBeInstanceOf(NetworkError);
    expect((await marketsProblemItem.getValue())?.kind).toBe('offline');
  });

  it('请求期间加了新币：请求成功后按新列表再补一次', async () => {
    await setSettings({ coins: ['bitcoin'] });
    fetchMock.mockImplementationOnce(async () => {
      await updateSettings((s) => ({ ...s, coins: [...s.coins, 'solana'] }));
      return respond([apiCoin('bitcoin', 1)]);
    });
    fetchMock.mockImplementationOnce(async () => respond([apiCoin('bitcoin', 1), apiCoin('solana', 2)]));
    await refreshMarkets({ force: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(marketsUrl(1).searchParams.get('ids')).toBe('bitcoin,solana');
    expect((await marketsItem.getValue())?.coins.solana?.price).toBe(2);
  });

  it('同时要求刷新时只请求一次', async () => {
    await setSettings({ coins: ['bitcoin'] });
    fetchMock.mockImplementation(async () => respond([apiCoin('bitcoin', 1)]));
    await Promise.all([
      refreshMarkets({ force: true }),
      refreshMarkets({ force: true }),
      refreshMarkets({ force: false }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('自选列表为空时不请求，图标清空', async () => {
    await setSettings({ coins: [] });
    await fakeBrowser.action.setBadgeText({ text: 'old' });
    await refreshMarkets({ force: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await fakeBrowser.action.getBadgeText({})).toBe('');
  });
});

describe('getChartCached：图表', () => {
  it('缓存新鲜时直接用缓存', async () => {
    await chartsItem.setValue({ 'bitcoin:usd:7': { fetchedAt: T0 - 60_000, points: [[1, 2]] } });
    expect(await getChartCached('bitcoin', '7')).toEqual([[1, 2]]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('请求失败但有旧缓存时先用旧的', async () => {
    await chartsItem.setValue({ 'bitcoin:usd:1': { fetchedAt: T0 - 3600_000, points: [[1, 2]] } });
    fetchMock.mockResolvedValue(respond('', 500));
    expect(await getChartCached('bitcoin', '1')).toEqual([[1, 2]]);
  });

  it('请求成功后写进缓存', async () => {
    fetchMock.mockResolvedValue(
      respond({
        prices: [
          [1000, 5],
          [2000, 6],
        ],
      }),
    );
    expect(await getChartCached('ethereum', '30')).toEqual([
      [1000, 5],
      [2000, 6],
    ]);
    expect(Object.keys(await chartsItem.getValue())).toEqual(['ethereum:usd:30']);
  });
});

const RSS = (title: string, url: string, minutesAgo: number) =>
  `<rss><channel><item><title>${title}</title><link>${url}</link><pubDate>${new Date(T0 - minutesAgo * 60_000).toUTCString()}</pubDate></item></channel></rss>`;

const ODAILY = (title: string, minutesAgo: number) => ({
  code: 0,
  data: {
    list: [
      { id: 1, title, link: 'https://www.odaily.news/zh-CN/newsflash/1', publishTimestamp: T0 - minutesAgo * 60_000 },
    ],
  },
});

describe('refreshNews：新闻', () => {
  it('用户打开资讯页之前，一个新闻网站都不访问', async () => {
    await setSettings({ language: 'zh' });
    grantOnly(() => true);
    await refreshNews({ force: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await newsItem.getValue()).toBeNull();
  });

  it('打开过资讯页以后，PANews 和 Odaily 不用权限就抓；Decrypt 要同意访问才抓', async () => {
    await setSettings({ language: 'zh' });
    await newsActivatedItem.setValue(true);
    grantOnly(() => false);
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes('panewslab')
        ? respond(RSS('某交易平台将上线永续合约', 'https://www.panewslab.com/zh/articles/1', 5))
        : respond(ODAILY('比特币现货 ETF 本周净流入', 10)),
    );
    await refreshNews({ force: false });
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls).toHaveLength(2);
    expect(urls.some((u) => u.includes('panewslab.com/rss.xml?lang=zh'))).toBe(true);
    expect(urls.some((u) => u.includes('api.odaily.news'))).toBe(true);
    expect(urls.some((u) => u.includes('decrypt.co'))).toBe(false);
    const cache = await newsItem.getValue();
    expect(cache?.items.map((n) => n.title)).toEqual(['某交易平台将上线永续合约', '比特币现货 ETF 本周净流入']);
    expect(cache?.lang).toBe('zh');
    expect(cache?.blocked).toEqual([]);
  });

  it('英文界面只有 Decrypt，没同意访问时不请求', async () => {
    await setSettings({ language: 'en' });
    await newsActivatedItem.setValue(true);
    grantOnly(() => false);
    await refreshNews({ force: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('网站不再允许直接读取时记下来，请用户同意访问；网络断了只算这次没抓到', async () => {
    await setSettings({ language: 'zh', newsSources: ['panews', 'odaily'] });
    await newsActivatedItem.setValue(true);
    grantOnly(() => false);
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      // PANews：网络通，但不再允许直接读取（不读内容的请求能成功）。Odaily：网络不通
      if (String(url).includes('panewslab') && init?.mode === 'no-cors') return respond('');
      throw new TypeError('Failed to fetch');
    });
    await refreshNews({ force: true });
    const cache = await newsItem.getValue();
    expect(cache?.failed.sort()).toEqual(['odaily', 'panews']);
    expect(cache?.blocked).toEqual(['panews']);
  }, 15_000);

  it('20 分钟内不重复抓；某个来源失败时记下来，其他来源照常', async () => {
    await setSettings({ language: 'en' });
    await newsActivatedItem.setValue(true);
    grantOnly(() => true);
    fetchMock.mockResolvedValue(respond(RSS('Bitcoin climbs', 'https://decrypt.co/1', 1)));
    await refreshNews({ force: false });
    await refreshNews({ force: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(respond('', 503));
    vi.setSystemTime(T0 + 21 * 60_000);
    await refreshNews({ force: false });
    const cache = await newsItem.getValue();
    expect(cache?.failed).toEqual(['decrypt']);
    expect(cache?.blocked).toEqual([]);
    expect(cache?.items.map((n) => n.title)).toEqual(['Bitcoin climbs']);
  }, 10_000);
});

describe('消息', () => {
  it('只处理认识的请求', () => {
    expect(isMessage({ type: 'refresh', force: true })).toBe(true);
    expect(isMessage({ type: 'deleteEverything' })).toBe(false);
    expect(isMessage(null)).toBe(false);
  });

  it('搜索结果缓存 10 分钟', async () => {
    fetchMock.mockImplementation(async () => respond({ coins: [{ id: 'solana', symbol: 'sol', name: 'Solana' }] }));
    const first = await handleMessage({ type: 'search', query: 'SOL ' });
    const second = await handleMessage({ type: 'search', query: 'sol' });
    expect(first).toEqual({ ok: true, data: [{ id: 'solana', symbol: 'SOL', name: 'Solana', image: '', rank: null }] });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('请求失败时返回原因，不抛错', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));
    expect(await handleMessage({ type: 'chart', id: 'bitcoin', days: '7' })).toEqual({ ok: false, problem: 'offline' });
  });
});
