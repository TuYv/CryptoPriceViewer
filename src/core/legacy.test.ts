import { describe, expect, it } from 'vitest';
import { convertLegacySettings, mergeLegacyInto } from './legacy';
import { DEFAULT_SETTINGS } from './settings';

describe('convertLegacySettings：0.1.x 的设置转成新格式', () => {
  it('转换一份典型的旧设置', () => {
    const s = convertLegacySettings({
      selectedCoins: ['BTC', 'ETH', 'BNB', 'SOL', 'PEPE'],
      coinNames: { PEPE: 'Pepe' },
      coinGeckoIds: { PEPE: 'pepe', BTC: 'bitcoin' },
      pinnedCoin: 'ETH',
      currency: 'CNY',
      refreshInterval: '300',
      language: 'zh',
    });
    expect(s.coins).toEqual(['bitcoin', 'ethereum', 'binancecoin', 'solana', 'pepe']);
    expect(s.pinned).toBe('ethereum');
    expect(s.currency).toBe('cny');
    expect(s.refreshInterval).toBe(300);
    expect(s.language).toBe('zh');
    expect(s.upDown).toBeNull();
  });

  it('刷新间隔是字符串 "0" 时表示关闭', () => {
    expect(convertLegacySettings({ selectedCoins: ['BTC'], refreshInterval: '0' }).refreshInterval).toBe(0);
  });

  it('不认识的刷新间隔用默认值', () => {
    expect(convertLegacySettings({ selectedCoins: ['BTC'], refreshInterval: '45' }).refreshInterval).toBe(60);
  });

  it('固定的币不在列表里时不固定', () => {
    expect(convertLegacySettings({ selectedCoins: ['BTC'], pinnedCoin: 'ETH' }).pinned).toBeNull();
  });

  it('没有对应关系的代码按小写当 id，和 0.1.x 的做法一样', () => {
    expect(convertLegacySettings({ selectedCoins: ['DOGE'] }).coins).toEqual(['doge']);
  });

  it('旧数据坏掉时用默认设置', () => {
    expect(convertLegacySettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(convertLegacySettings({ selectedCoins: 'BTC' }).coins).toEqual(DEFAULT_SETTINGS.coins);
  });

  it('旧列表为空时保持为空', () => {
    expect(convertLegacySettings({ selectedCoins: [] }).coins).toEqual([]);
  });
});

describe('mergeLegacyInto', () => {
  it('已有新设置时，只把旧列表里多出来的币接在后面，其他设置不变', () => {
    const current = {
      ...DEFAULT_SETTINGS,
      coins: ['bitcoin', 'ethereum'],
      pinned: 'bitcoin',
      currency: 'eur' as const,
    };
    const legacy = convertLegacySettings({ selectedCoins: ['ETH', 'SOL'], pinnedCoin: 'SOL', currency: 'CNY' });
    const merged = mergeLegacyInto(current, legacy);
    expect(merged.coins).toEqual(['bitcoin', 'ethereum', 'solana']);
    expect(merged.pinned).toBe('bitcoin');
    expect(merged.currency).toBe('eur');
  });
});
