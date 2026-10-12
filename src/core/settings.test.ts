import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, defaultUpDown, effectiveUpDown, MAX_COINS, normalizeSettings } from './settings';

describe('normalizeSettings', () => {
  it('什么都没有时用默认设置', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('乱七八糟')).toEqual(DEFAULT_SETTINGS);
  });

  it('去掉重复和不合法的币种 id，最多保留上限个', () => {
    const s = normalizeSettings({ coins: ['bitcoin', 'bitcoin', 'Bad ID', 42, 'ethereum'] });
    expect(s.coins).toEqual(['bitcoin', 'ethereum']);
    const many = normalizeSettings({ coins: Array.from({ length: 80 }, (_, i) => `coin-${i}`) });
    expect(many.coins).toHaveLength(MAX_COINS);
  });

  it('固定的币不在列表里时清空', () => {
    expect(normalizeSettings({ coins: ['bitcoin'], pinned: 'ethereum' }).pinned).toBeNull();
    expect(normalizeSettings({ coins: ['bitcoin'], pinned: 'bitcoin' }).pinned).toBe('bitcoin');
  });

  it('不认识的选项换回默认值', () => {
    const s = normalizeSettings({
      currency: 'jpy',
      theme: 'pink',
      layout: 'cards',
      refreshInterval: 45,
      badge: 'x',
      upDown: 'purple',
    });
    expect(s.currency).toBe('usd');
    expect(s.theme).toBe('auto');
    expect(s.layout).toBe('tiles');
    expect(s.refreshInterval).toBe(60);
    expect(s.badge).toBe('price');
    expect(s.upDown).toBeNull();
  });

  it('保留合法的选项', () => {
    const s = normalizeSettings({
      currency: 'eur',
      language: 'ko',
      upDown: 'red-blue',
      layout: 'list',
      refreshInterval: 0,
      newsSources: ['decrypt'],
    });
    expect(s).toMatchObject({
      currency: 'eur',
      language: 'ko',
      upDown: 'red-blue',
      layout: 'list',
      refreshInterval: 0,
      newsSources: ['decrypt'],
    });
  });

  it('列表可以是空的', () => {
    expect(normalizeSettings({ coins: [] }).coins).toEqual([]);
  });
});

describe('涨跌颜色', () => {
  it('各语言默认：中文红涨绿跌，韩文红涨蓝跌，日文和英文绿涨红跌', () => {
    expect(defaultUpDown('zh')).toBe('red-green');
    expect(defaultUpDown('ko')).toBe('red-blue');
    expect(defaultUpDown('ja')).toBe('green-red');
    expect(defaultUpDown('en')).toBe('green-red');
  });

  it('用户选过就用用户选的', () => {
    expect(effectiveUpDown({ ...DEFAULT_SETTINGS, upDown: 'green-red' }, 'zh')).toBe('green-red');
    expect(effectiveUpDown(DEFAULT_SETTINGS, 'zh')).toBe('red-green');
  });
});
