import { describe, expect, it } from 'vitest';
import { RateLimitedError } from './coingecko';
import { EMPTY_GATE, type GateState, RequestGate, reserve } from './gate';

describe('reserve', () => {
  it('没满时立刻放行，并记下这次请求', () => {
    const r = reserve(EMPTY_GATE, 1000, 3, 0);
    expect(r).toEqual({ ok: true, waitMs: 0, state: { lockedUntil: 0, stamps: [1000] } });
  });

  it('一分钟前的记录不算数', () => {
    const r = reserve({ stamps: [0, 1, 2], lockedUntil: 0 }, 60_500, 3, 0);
    expect(r.ok && r.waitMs).toBe(0);
  });

  it('满了但很快有空位时，算出要等多久', () => {
    const r = reserve({ stamps: [0, 10_000, 20_000], lockedUntil: 0 }, 55_000, 3, 8000);
    expect(r).toMatchObject({ ok: true, waitMs: 5000 });
  });

  it('要等太久时拒绝，并告诉什么时候能再试', () => {
    const r = reserve({ stamps: [30_000, 40_000, 50_000], lockedUntil: 0 }, 55_000, 3, 8000);
    expect(r).toEqual({ ok: false, retryAt: 90_000 });
  });

  it('被限速期间一律拒绝', () => {
    expect(reserve({ stamps: [], lockedUntil: 70_000 }, 10_000, 3, 8000)).toEqual({ ok: false, retryAt: 70_000 });
  });
});

describe('RequestGate', () => {
  const memoryStore = (initial: GateState = EMPTY_GATE) => {
    let state = initial;
    return {
      load: async () => state,
      save: async (s: GateState) => {
        state = s;
      },
      get: () => state,
    };
  };

  it('同时发起的请求也按顺序预约，不会超过限额', async () => {
    const store = memoryStore();
    const gate = new RequestGate(
      store,
      async () => 2,
      () => 1000,
    );
    const results = await Promise.allSettled([1, 2, 3].map((n) => gate.run(async () => n, 0)));
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled', 'rejected']);
    expect((results[2] as PromiseRejectedResult).reason).toBeInstanceOf(RateLimitedError);
    expect(store.get().stamps).toEqual([1000, 1000]);
  });

  it('CoinGecko 返回限速后，记下解锁时间，之后的请求直接拒绝', async () => {
    const store = memoryStore();
    const gate = new RequestGate(
      store,
      async () => 10,
      () => 1000,
    );
    await expect(gate.run(() => Promise.reject(new RateLimitedError(61_000)))).rejects.toBeInstanceOf(RateLimitedError);
    expect(store.get().lockedUntil).toBe(61_000);
    let called = false;
    await expect(
      gate.run(async () => {
        called = true;
      }),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(called).toBe(false);
  });

  it('一次失败不影响后面的请求排队', async () => {
    const gate = new RequestGate(
      memoryStore(),
      async () => 10,
      () => 1000,
    );
    await expect(gate.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(gate.run(async () => 'ok')).resolves.toBe('ok');
  });
});
