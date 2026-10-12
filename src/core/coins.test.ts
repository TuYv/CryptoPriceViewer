import { describe, expect, it } from 'vitest';
import { coinColor, mentionedCoins } from './coins';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
];

describe('mentionedCoins', () => {
  it.each([
    ['BTC跌破80000美元，日内跌幅0.5%', ['bitcoin']],
    ['分析师：比特币周线收于8万美元上方', ['bitcoin']],
    ['某交易平台将上线第二只现货Solana ETF', ['solana']],
    ['SOL生态某代币市值创新高', ['solana']],
    ['Bitcoin and Ethereum ETFs see outflows', ['bitcoin', 'ethereum']],
    ['XRP现货ETF上周净流入', ['ripple']],
    ['イーサリアムの大口送金を確認', ['ethereum']],
  ])('%s', (title, ids) => {
    expect(mentionedCoins(title, COINS)).toEqual(ids);
  });

  it('不会把更长的代码或单词误认成币', () => {
    expect(mentionedCoins('Solv Protocol 推出新产品', COINS)).toEqual([]);
    expect(mentionedCoins('ETHW 社区投票', COINS)).toEqual([]);
    expect(mentionedCoins('Solstice 获得融资', COINS)).toEqual([]);
  });
});

describe('coinColor', () => {
  it('常见币用品牌色，其他币按 id 算出固定的颜色', () => {
    expect(coinColor('bitcoin')).toBe('#F7931A');
    expect(coinColor('some-new-coin')).toBe(coinColor('some-new-coin'));
    expect(coinColor('some-new-coin')).toMatch(/^hsl\(\d+ 62% 48%\)$/);
  });
});
