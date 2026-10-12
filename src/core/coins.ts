/** 常见币种的品牌色。没列在这里的币按 id 算出一个固定的颜色 */
const BRAND_COLORS: Record<string, string> = {
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  solana: '#9945FF',
  binancecoin: '#F0B90B',
  ripple: '#2F7FD1',
  dogecoin: '#C2A633',
  tether: '#26A17B',
  'usd-coin': '#2775CA',
  cardano: '#2A5ADA',
  tron: '#EB0029',
  'the-open-network': '#0098EA',
  avalanche: '#E84142',
  'avalanche-2': '#E84142',
  chainlink: '#2A5ADA',
  polkadot: '#E6007A',
  litecoin: '#345D9D',
  'shiba-inu': '#E0702B',
  sui: '#4DA2FF',
  near: '#00C08B',
  hyperliquid: '#50D2C1',
};

export interface CoinMeta {
  symbol: string;
  name: string;
  image: string;
}

const IMG = 'https://coin-images.coingecko.com/coins/images';

/** 常见币的名字和图标：第一次打开、价格还没回来时先显示这些 */
export const KNOWN_COINS: Record<string, CoinMeta> = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', image: `${IMG}/1/large/bitcoin.png?1696501400` },
  ethereum: { symbol: 'ETH', name: 'Ethereum', image: `${IMG}/279/large/ethereum.png?1696501628` },
  solana: { symbol: 'SOL', name: 'Solana', image: `${IMG}/4128/large/solana.png?1718769756` },
  binancecoin: { symbol: 'BNB', name: 'BNB', image: `${IMG}/825/large/bnb-icon2_2x.png?1696501970` },
  ripple: { symbol: 'XRP', name: 'XRP', image: `${IMG}/44/large/xrp-symbol-white-128.png?1696501442` },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin', image: `${IMG}/5/large/dogecoin.png?1696501409` },
};

/** 空自选列表时推荐的币 */
export const POPULAR_COINS = Object.keys(KNOWN_COINS);

export function coinColor(id: string): string {
  const brand = BRAND_COLORS[id];
  if (brand) return brand;
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 62% 48%)`;
}

/** 币种在中文、日文、韩文新闻里常见的叫法 */
const LOCAL_NAMES: Record<string, string[]> = {
  bitcoin: ['比特币', 'ビットコイン', '비트코인'],
  ethereum: ['以太坊', 'イーサリアム', '이더리움'],
  solana: ['索拉纳', 'ソラナ', '솔라나'],
  binancecoin: ['币安币'],
  ripple: ['瑞波币', 'リップル', '리플'],
  dogecoin: ['狗狗币', 'ドージコイン', '도지코인'],
  cardano: ['艾达币', 'カルダノ', '카르다노'],
  tron: ['波场', 'トロン', '트론'],
  litecoin: ['莱特币', 'ライトコイン', '라이트코인'],
};

export interface CoinRef {
  id: string;
  symbol: string;
  name: string;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 找出标题里提到了哪些币：代码（至少 3 个字母，区分大小写）、英文名、中日韩常见叫法 */
export function mentionedCoins(title: string, coins: CoinRef[]): string[] {
  return coins
    .filter((coin) => {
      const symbol = coin.symbol.toUpperCase();
      if (symbol.length >= 3 && new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(symbol)}(?![A-Za-z0-9])`).test(title)) {
        return true;
      }
      if (coin.name.length >= 4 && new RegExp(`(?<![A-Za-z])${escapeRegExp(coin.name)}(?![A-Za-z])`, 'i').test(title)) {
        return true;
      }
      return (LOCAL_NAMES[coin.id] ?? []).some((local) => title.includes(local));
    })
    .map((coin) => coin.id);
}
