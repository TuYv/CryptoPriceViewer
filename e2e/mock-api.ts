import fs from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Route } from '@playwright/test';

interface Snapshot {
  markets: Record<string, unknown>[];
  charts: Record<string, { prices: [number, number][] }>;
  search: { coins: Record<string, unknown>[] };
}

const snapshot: Snapshot = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'data/coingecko.json'), 'utf8'));

/** 1x1 的透明 PNG，代替币种图标 */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export const VALID_API_KEY = 'CG-test-valid-key';

export interface MockNetwork {
  /** 行情接口这一刻怎么回应 */
  markets: 'ok' | 'rate-limited' | 'offline';
  /** 扩展请求过的 CoinGecko 地址（路径加参数） */
  calls: string[];
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

// 新闻标题都是编的，只用来测试
function panewsRss(): string {
  const items = [
    ['比特币现货 ETF 本周净流入 3.2 亿美元', 5],
    ['某交易平台宣布上线 SOL 永续合约', 20],
    ['以太坊基金会公布新一轮生态资助名单', 95],
  ] as const;
  return `<?xml version="1.0"?><rss version="2.0"><channel>${items
    .map(
      ([title, m], i) =>
        `<item><title><![CDATA[${title}]]></title><link>https://www.panewslab.com/zh/articles/test-${i}</link><pubDate>${minutesAgo(m).toUTCString()}</pubDate></item>`,
    )
    .join('')}</channel></rss>`;
}

function odailyJson(): string {
  const list = [
    { id: 1, title: '交易平台宣布上线SOL永续合约', publishTimestamp: minutesAgo(18).getTime() },
    { id: 2, title: 'XRP 现货 ETF 获批进入最后审核阶段', publishTimestamp: minutesAgo(40).getTime() },
  ].map((n) => ({ ...n, link: `https://www.odaily.news/zh-CN/newsflash/${n.id}` }));
  return JSON.stringify({ code: 0, data: { list } });
}

function decryptRss(): string {
  return `<rss><channel><item><title>Bitcoin miners expand into AI data centers</title><link>https://decrypt.co/test-1</link><pubDate>${minutesAgo(60).toUTCString()}</pubDate></item></channel></rss>`;
}

function coingecko(route: Route, net: MockNetwork) {
  const url = new URL(route.request().url());
  net.calls.push(url.pathname.replace('/api/v3', '') + url.search);
  const path = url.pathname.replace('/api/v3', '');

  if (path === '/ping') {
    const key = route.request().headers()['x-cg-demo-api-key'];
    return key === VALID_API_KEY
      ? route.fulfill({ json: { gecko_says: '(V3) To the Moon!' } })
      : route.fulfill({ status: 401, json: {} });
  }
  if (net.markets === 'offline') return route.abort('internetdisconnected');
  if (net.markets === 'rate-limited') return route.fulfill({ status: 429, headers: { 'retry-after': '60' }, json: {} });

  if (path === '/coins/markets') {
    const ids = (url.searchParams.get('ids') ?? '').split(',');
    const rate = { usd: 1, cny: 7.1, eur: 0.86 }[url.searchParams.get('vs_currency') ?? 'usd'] ?? 1;
    const coins = snapshot.markets
      .filter((c) => ids.includes(c.id as string))
      .map((c) => ({
        ...c,
        current_price: (c.current_price as number) * rate,
        market_cap: (c.market_cap as number) * rate,
      }));
    return route.fulfill({ json: coins });
  }
  const chart = path.match(/^\/coins\/([^/]+)\/market_chart$/);
  if (chart) {
    return route.fulfill({ json: snapshot.charts[url.searchParams.get('days') ?? '7'] ?? { prices: [] } });
  }
  if (path === '/search') {
    const q = (url.searchParams.get('query') ?? '').toLowerCase();
    const fromMarkets = snapshot.markets.map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      large: c.image,
      market_cap_rank: c.market_cap_rank,
    }));
    const pool = [...fromMarkets, ...snapshot.search.coins.filter((c) => !fromMarkets.some((m) => m.id === c.id))];
    const coins = pool.filter((c) => `${c.id} ${c.name} ${c.symbol}`.toLowerCase().includes(q));
    return route.fulfill({ json: { coins } });
  }
  return route.fulfill({ status: 404, json: {} });
}

/** 拦截扩展发出的所有网络请求，用固定的数据回应 */
export async function mockNetwork(context: BrowserContext): Promise<MockNetwork> {
  const net: MockNetwork = { markets: 'ok', calls: [] };
  await context.route('https://api.coingecko.com/**', (route) => coingecko(route, net));
  await context.route('https://coin-images.coingecko.com/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: PNG }),
  );
  await context.route('https://www.panewslab.com/**', (route) =>
    route.fulfill({ contentType: 'application/rss+xml', body: panewsRss() }),
  );
  await context.route('https://api.odaily.news/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: odailyJson() }),
  );
  await context.route('https://decrypt.co/**', (route) =>
    route.fulfill({ contentType: 'application/rss+xml', body: decryptRss() }),
  );
  return net;
}
