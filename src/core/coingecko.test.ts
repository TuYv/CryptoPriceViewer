import { describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  checkApiKey,
  downsample,
  getChart,
  getMarkets,
  NetworkError,
  parseMarkets,
  RateLimitedError,
  searchCoins,
} from './coingecko';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });

const MARKET = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  current_price: 83698,
  market_cap: 1.68e12,
  market_cap_rank: 1,
  total_volume: 1.86e10,
  high_24h: 84163,
  low_24h: 82894,
  price_change_percentage_24h: 0.88,
  circulating_supply: 19_930_000,
  total_supply: 19_930_000,
  ath: 126080,
  ath_date: '2025-10-06T18:57:42.558Z',
  sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 80000 + i) },
  price_change_percentage_24h_in_currency: 0.884,
  price_change_percentage_7d_in_currency: -1.97,
};

describe('parseMarkets', () => {
  it('转换成内部格式，7 天走势压缩到 84 个点', () => {
    const [btc] = parseMarkets([MARKET]);
    expect(btc).toMatchObject({
      id: 'bitcoin',
      symbol: 'BTC',
      price: 83698,
      change24h: 0.884,
      change7d: -1.97,
      rank: 1,
    });
    expect(btc?.athDate).toBe(Date.parse('2025-10-06T18:57:42.558Z'));
    expect(btc?.spark).toHaveLength(84);
    expect(btc?.spark[0]).toBe(80000);
    expect(btc?.spark.at(-1)).toBe(80167);
  });

  it('缺字段时填 null，坏数据跳过', () => {
    const [coin] = parseMarkets([{ id: 'x' }, null, { name: '没有 id' }]);
    expect(parseMarkets([{ id: 'x' }, null])).toHaveLength(1);
    expect(coin).toMatchObject({ id: 'x', symbol: '', name: 'x', price: null, spark: [] });
    expect(parseMarkets({ error: 'x' })).toEqual([]);
  });
});

describe('请求', () => {
  it('getMarkets 带上币种、货币和 7 天走势参数', async () => {
    const fetch = vi.fn().mockResolvedValue(json([MARKET]));
    await getMarkets(['bitcoin', 'ethereum'], 'cny', { fetch });
    const url = new URL(fetch.mock.calls[0]?.[0]);
    expect(url.origin + url.pathname).toBe('https://api.coingecko.com/api/v3/coins/markets');
    expect(url.searchParams.get('ids')).toBe('bitcoin,ethereum');
    expect(url.searchParams.get('vs_currency')).toBe('cny');
    expect(url.searchParams.get('sparkline')).toBe('true');
  });

  it('列表为空时不发请求', async () => {
    const fetch = vi.fn();
    expect(await getMarkets([], 'usd', { fetch })).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('有密钥时放在请求头里', async () => {
    const fetch = vi.fn().mockResolvedValue(json([]));
    await getMarkets(['bitcoin'], 'usd', { fetch, apiKey: 'CG-abc' });
    expect(fetch.mock.calls[0]?.[1].headers['x-cg-demo-api-key']).toBe('CG-abc');
  });

  it('429 抛出限速错误，按 Retry-After 算出可以重试的时间', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 429, headers: { 'retry-after': '30' } }));
    const err = await getMarkets(['bitcoin'], 'usd', { fetch, now: () => 1000 }).catch((e) => e);
    expect(err).toBeInstanceOf(RateLimitedError);
    expect(err.retryAt).toBe(31_000);
  });

  it('没有 Retry-After 时等 1 分钟', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    const err = await getMarkets(['bitcoin'], 'usd', { fetch, now: () => 0 }).catch((e) => e);
    expect(err.retryAt).toBe(60_000);
  });

  it('连不上网抛出网络错误，其他状态码抛出接口错误', async () => {
    await expect(
      getMarkets(['bitcoin'], 'usd', { fetch: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) }),
    ).rejects.toBeInstanceOf(NetworkError);
    await expect(
      getMarkets(['bitcoin'], 'usd', { fetch: vi.fn().mockResolvedValue(new Response('', { status: 500 })) }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('搜索：空关键词不发请求，结果最多 8 个', async () => {
    const fetch = vi.fn().mockResolvedValue(
      json({
        coins: Array.from({ length: 12 }, (_, i) => ({
          id: `c${i}`,
          symbol: `s${i}`,
          name: `N${i}`,
          large: 'x.png',
          market_cap_rank: i,
        })),
      }),
    );
    expect(await searchCoins('  ', { fetch })).toEqual([]);
    const results = await searchCoins('sol', { fetch });
    expect(results).toHaveLength(8);
    expect(results[0]).toEqual({ id: 'c0', symbol: 'S0', name: 'N0', image: 'x.png', rank: 0 });
  });

  it('图表最多 200 个点', async () => {
    const prices = Array.from({ length: 721 }, (_, i) => [i * 3600_000, 80000 + i]);
    const points = await getChart('bitcoin', 'usd', '30', { fetch: vi.fn().mockResolvedValue(json({ prices })) });
    expect(points).toHaveLength(200);
    expect(points[0]).toEqual([0, 80000]);
    expect(points.at(-1)).toEqual([720 * 3600_000, 80720]);
  });

  it('checkApiKey：401 表示密钥无效，网络问题照常抛出', async () => {
    expect(
      await checkApiKey('ok', { fetch: vi.fn().mockResolvedValue(json({ gecko_says: '(V3) To the Moon!' })) }),
    ).toBe(true);
    expect(await checkApiKey('bad', { fetch: vi.fn().mockResolvedValue(new Response('', { status: 401 })) })).toBe(
      false,
    );
    await expect(
      checkApiKey('x', { fetch: vi.fn().mockRejectedValue(new TypeError('offline')) }),
    ).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('downsample', () => {
  it('点数不多时原样返回', () => {
    expect(downsample([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });
});
