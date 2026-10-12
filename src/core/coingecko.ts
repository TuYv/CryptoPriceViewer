import type { Currency } from './settings';

export const API_BASE = 'https://api.coingecko.com/api/v3';

/** CoinGecko 拒绝了请求（429），retryAt 之前不要再请求 */
export class RateLimitedError extends Error {
  constructor(readonly retryAt: number) {
    super(`CoinGecko rate limit, retry at ${new Date(retryAt).toISOString()}`);
    this.name = 'RateLimitedError';
  }
}

/** 连不上网络或者请求超时 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`CoinGecko HTTP ${status}`);
    this.name = 'ApiError';
  }
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number | null;
  change24h: number | null;
  change7d: number | null;
  marketCap: number | null;
  volume: number | null;
  circulating: number | null;
  totalSupply: number | null;
  high24h: number | null;
  low24h: number | null;
  ath: number | null;
  athDate: number | null;
  rank: number | null;
  /** 近 7 天的价格，大约每 2 小时一个点 */
  spark: number[];
}

export interface SearchCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number | null;
}

export const CHART_DAYS = ['1', '7', '30', '90', '365'] as const;
export type ChartDays = (typeof CHART_DAYS)[number];
export type ChartPoint = [time: number, price: number];

export interface RequestOptions {
  apiKey?: string;
  fetch?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}

const DEFAULT_RETRY_MS = 60_000;

async function request<T>(path: string, params: Record<string, string>, o: RequestOptions): Promise<T> {
  const url = new URL(API_BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers: Record<string, string> = { accept: 'application/json' };
  if (o.apiKey) headers['x-cg-demo-api-key'] = o.apiKey;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), o.timeoutMs ?? 15_000);
  let res: Response;
  try {
    res = await (o.fetch ?? fetch)(url, { headers, signal: controller.signal });
  } catch (e) {
    throw new NetworkError(e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : DEFAULT_RETRY_MS;
    throw new RateLimitedError((o.now ?? Date.now)() + wait);
  }
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as T;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const time = (v: unknown): number | null => {
  const t = typeof v === 'string' ? Date.parse(v) : Number.NaN;
  return Number.isFinite(t) ? t : null;
};

/** 均匀抽取最多 n 个点，保留第一个和最后一个 */
export function downsample<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, i) => items[Math.round((i * (items.length - 1)) / (n - 1))] as T);
}

export function parseMarkets(json: unknown): MarketCoin[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((c) => c && typeof c === 'object' && typeof c.id === 'string')
    .map((c) => {
      const spark = Array.isArray(c.sparkline_in_7d?.price)
        ? (c.sparkline_in_7d.price as unknown[]).filter((p): p is number => typeof p === 'number' && Number.isFinite(p))
        : [];
      return {
        id: c.id,
        symbol: str(c.symbol).toUpperCase(),
        name: str(c.name) || c.id,
        image: str(c.image),
        price: num(c.current_price),
        change24h: num(c.price_change_percentage_24h_in_currency) ?? num(c.price_change_percentage_24h),
        change7d: num(c.price_change_percentage_7d_in_currency),
        marketCap: num(c.market_cap),
        volume: num(c.total_volume),
        circulating: num(c.circulating_supply),
        totalSupply: num(c.total_supply),
        high24h: num(c.high_24h),
        low24h: num(c.low_24h),
        ath: num(c.ath),
        athDate: time(c.ath_date),
        rank: num(c.market_cap_rank),
        spark: downsample(spark, 84).map((p) => Number(p.toPrecision(6))),
      };
    });
}

export async function getMarkets(ids: string[], currency: Currency, o: RequestOptions = {}): Promise<MarketCoin[]> {
  if (ids.length === 0) return [];
  const json = await request<unknown>(
    '/coins/markets',
    {
      vs_currency: currency,
      ids: ids.join(','),
      order: 'market_cap_desc',
      per_page: '250',
      page: '1',
      sparkline: 'true',
      price_change_percentage: '24h,7d',
    },
    o,
  );
  return parseMarkets(json);
}

export function parseSearch(json: unknown): SearchCoin[] {
  const coins = (json as { coins?: unknown })?.coins;
  if (!Array.isArray(coins)) return [];
  return coins
    .filter((c) => c && typeof c === 'object' && typeof c.id === 'string')
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      symbol: str(c.symbol).toUpperCase(),
      name: str(c.name) || c.id,
      image: str(c.large) || str(c.thumb),
      rank: num(c.market_cap_rank),
    }));
}

export async function searchCoins(query: string, o: RequestOptions = {}): Promise<SearchCoin[]> {
  const q = query.trim();
  if (!q) return [];
  return parseSearch(await request<unknown>('/search', { query: q }, o));
}

export function parseChart(json: unknown): ChartPoint[] {
  const prices = (json as { prices?: unknown })?.prices;
  if (!Array.isArray(prices)) return [];
  const points = prices.filter(
    (p): p is ChartPoint =>
      Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' && Number.isFinite(p[1]),
  );
  return downsample(points, 200).map(([t, p]) => [Math.round(t), Number(p.toPrecision(8))]);
}

export async function getChart(id: string, currency: Currency, days: ChartDays, o: RequestOptions = {}) {
  return parseChart(
    await request<unknown>(`/coins/${encodeURIComponent(id)}/market_chart`, { vs_currency: currency, days }, o),
  );
}

/** 检查用户填的免费密钥能不能用：能用返回 true，CoinGecko 明确拒绝返回 false */
export async function checkApiKey(apiKey: string, o: RequestOptions = {}): Promise<boolean> {
  try {
    await request<unknown>('/ping', {}, { ...o, apiKey });
    return true;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 400 || e.status === 401 || e.status === 403)) return false;
    throw e;
  }
}
