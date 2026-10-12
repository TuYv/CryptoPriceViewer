import { describe, expect, it } from 'vitest';
import { formatAgo, formatBadge, formatChange, formatCompactMoney, formatPrice } from './format';

describe('formatPrice', () => {
  it('一万以上不带小数，1 以上两位小数，小于 1 保留 4 位有效数字', () => {
    expect(formatPrice(83698.4, 'usd', 'en')).toBe('$83,698');
    expect(formatPrice(2552.85, 'usd', 'en')).toBe('$2,552.85');
    expect(formatPrice(1.4, 'usd', 'en')).toBe('$1.40');
    expect(formatPrice(0.087135, 'usd', 'en')).toBe('$0.08714');
  });

  it('人民币和欧元用各自的符号', () => {
    expect(formatPrice(83698, 'cny', 'zh')).toBe('¥83,698');
    expect(formatPrice(83698, 'eur', 'en')).toBe('€83,698');
  });

  it('没有价格时显示破折号', () => {
    expect(formatPrice(null, 'usd', 'en')).toBe('—');
  });
});

describe('formatChange', () => {
  it('带正负号，用真正的减号', () => {
    expect(formatChange(0.884)).toBe('+0.88%');
    expect(formatChange(-2.05)).toBe('−2.05%');
    expect(formatChange(0)).toBe('0.00%');
    expect(formatChange(null)).toBe('—');
  });
});

describe('formatCompactMoney', () => {
  it('按语言用万亿、兆、조、T', () => {
    expect(formatCompactMoney(1.68e12, 'usd', 'zh')).toContain('万亿');
    expect(formatCompactMoney(1.68e12, 'usd', 'ja')).toContain('兆');
    expect(formatCompactMoney(1.68e12, 'usd', 'ko')).toContain('조');
    expect(formatCompactMoney(1.68e12, 'usd', 'en')).toBe('$1.68T');
    expect(formatCompactMoney(1.861e10, 'usd', 'zh')).toContain('亿');
  });
});

describe('formatBadge', () => {
  it('价格压缩到工具栏图标放得下', () => {
    expect(formatBadge(123456, 'price')).toBe('123k');
    expect(formatBadge(83698, 'price')).toBe('83.7k');
    expect(formatBadge(2552.85, 'price')).toBe('2.55k');
    expect(formatBadge(751.3, 'price')).toBe('751');
    expect(formatBadge(12.34, 'price')).toBe('12.3');
    expect(formatBadge(1.41, 'price')).toBe('1.41');
    expect(formatBadge(0.08714, 'price')).toBe('0.087');
  });

  it('涨跌幅：10% 以内一位小数，以上取整', () => {
    expect(formatBadge(0.88, 'change')).toBe('+0.9%');
    expect(formatBadge(-12.3, 'change')).toBe('-12%');
    expect(formatBadge(0, 'change')).toBe('0.0%');
  });
});

describe('formatAgo', () => {
  it('按语言显示多久以前', () => {
    const now = Date.UTC(2026, 9, 12, 8, 0, 0);
    expect(formatAgo(now - 32_000, now, 'en')).toBe('32 seconds ago');
    expect(formatAgo(now - 5 * 60_000, now, 'en')).toBe('5 minutes ago');
    expect(formatAgo(now - 32_000, now, 'zh')).toContain('32');
  });
});
