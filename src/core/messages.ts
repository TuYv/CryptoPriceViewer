import { browser } from '#imports';
import { type ChartDays, type ChartPoint, NetworkError, RateLimitedError, type SearchCoin } from './coingecko';

/** 请求没成功的原因：被 CoinGecko 限速、连不上网、其他错误 */
export type Problem = 'rate-limited' | 'offline' | 'failed';

export type Failure = { ok: false; problem: Problem; retryAt?: number };
export type Result<T> = { ok: true; data: T } | Failure;

/** 弹窗可以向后台发的请求，以及各自的返回内容 */
export interface RequestMap {
  /** 刷新自选币的行情。force 为 false 时，缓存还新鲜就不请求 */
  refresh: { req: { force: boolean }; res: null };
  search: { req: { query: string }; res: SearchCoin[] };
  chart: { req: { id: string; days: ChartDays }; res: ChartPoint[] };
  /** 刷新新闻。结果写进缓存，弹窗从缓存读 */
  news: { req: { force: boolean }; res: null };
  checkApiKey: { req: { key: string }; res: boolean };
}

export type RequestType = keyof RequestMap;
export type Message = { [K in RequestType]: { type: K } & RequestMap[K]['req'] }[RequestType];

export function toFailure(e: unknown): Failure {
  if (e instanceof RateLimitedError) return { ok: false, problem: 'rate-limited', retryAt: e.retryAt };
  if (e instanceof NetworkError) return { ok: false, problem: 'offline' };
  return { ok: false, problem: 'failed' };
}

/** 从弹窗向后台发请求 */
export async function ask<K extends RequestType>(
  type: K,
  req: RequestMap[K]['req'],
): Promise<Result<RequestMap[K]['res']>> {
  try {
    const res = (await browser.runtime.sendMessage({ type, ...req })) as Result<RequestMap[K]['res']> | undefined;
    return res ?? { ok: false, problem: 'failed' };
  } catch {
    return { ok: false, problem: 'failed' };
  }
}
