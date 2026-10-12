import { RateLimitedError } from './coingecko';

/** 每分钟最多请求几次。CoinGecko 不用密钥时大约每分钟十来次，用免费密钥是 30 次，这里都留一点余量 */
export const LIMIT_WITHOUT_KEY = 8;
export const LIMIT_WITH_KEY = 25;

export interface GateState {
  /** 最近一分钟内每次请求的时间 */
  stamps: number[];
  /** 被 CoinGecko 限速后，这个时间之前不再请求 */
  lockedUntil: number;
}

export const EMPTY_GATE: GateState = { stamps: [], lockedUntil: 0 };

const WINDOW_MS = 60_000;

export type Reservation = { ok: true; state: GateState; waitMs: number } | { ok: false; retryAt: number };

/**
 * 给下一次请求预约一个位置。
 * 还没满就立刻放行；满了但只需要等一小会儿（不超过 maxWaitMs）就等着；要等太久或者正被限速就直接拒绝。
 */
export function reserve(state: GateState, now: number, limit: number, maxWaitMs: number): Reservation {
  if (state.lockedUntil > now) return { ok: false, retryAt: state.lockedUntil };
  const stamps = state.stamps.filter((t) => now - t < WINDOW_MS).sort((a, b) => a - b);
  let waitMs = 0;
  if (stamps.length >= limit) {
    const oldest = stamps[stamps.length - limit] ?? now;
    waitMs = oldest + WINDOW_MS - now;
    if (waitMs > maxWaitMs) return { ok: false, retryAt: now + waitMs };
  }
  return { ok: true, waitMs, state: { lockedUntil: 0, stamps: [...stamps, now + waitMs] } };
}

export interface GateStore {
  load(): Promise<GateState>;
  save(state: GateState): Promise<void>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 所有对 CoinGecko 的请求都从这里过。预约是一个接一个进行的，所以同时发起的请求不会挤爆限额 */
export class RequestGate {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: GateStore,
    private readonly limit: () => Promise<number>,
    private readonly now: () => number = Date.now,
  ) {}

  run<T>(fn: () => Promise<T>, maxWaitMs = 8000): Promise<T> {
    const slot = this.queue.then(async () => {
      const result = reserve(await this.store.load(), this.now(), await this.limit(), maxWaitMs);
      if (!result.ok) throw new RateLimitedError(result.retryAt);
      await this.store.save(result.state);
      if (result.waitMs > 0) await sleep(result.waitMs);
    });
    this.queue = slot.catch(() => undefined);
    return slot.then(async () => {
      try {
        return await fn();
      } catch (e) {
        if (e instanceof RateLimitedError) {
          const state = await this.store.load();
          await this.store.save({ ...state, lockedUntil: Math.max(state.lockedUntil, e.retryAt) });
        }
        throw e;
      }
    });
  }
}
