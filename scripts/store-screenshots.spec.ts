/**
 * 生成 Chrome 商店用的截图（1280×800），中文和英文各一套，输出到 store-assets/screenshots/。
 * 运行：npm run store:screenshots（需要联网，用来加载真实的币种图标）
 */
import fs from 'node:fs';
import path from 'node:path';
import { type Browser, chromium, type Page, test } from '@playwright/test';
import { mockNetwork } from '../e2e/mock-api';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');
const OUT = path.resolve('store-assets/screenshots');
const ICON = `data:image/png;base64,${fs.readFileSync(path.resolve('public/icon/48.png')).toString('base64')}`;

const COPY = {
  zh: {
    market: ['一眼看清自选币', '每个币用自己的颜色，7 天走势画在下面'],
    detail: ['1 天到 1 年的价格走势', '鼠标移上去看每个时间点的价格'],
    news: ['币圈新闻时间线', '按天分组，可以只看提到自选币的'],
    toolbar: ['价格挂在工具栏上', '固定一个币，不用打开也能看到价格'],
    dark: ['深色模式', '跟随系统，也可以在设置里固定'],
  },
  en: {
    market: ['Your coins at a glance', 'Each coin in its own color, with a 7-day trend'],
    detail: ['Price history from 1 day to 1 year', 'Hover to see the price at any point'],
    news: ['A crypto news timeline', 'Grouped by day, filtered to your coins'],
    toolbar: ['A price on your toolbar', 'Pin a coin and see its price without opening anything'],
    dark: ['Dark mode', 'Follows your system, or pick it in Settings'],
  },
} as const;

const NEWS = {
  zh: [
    ['比特币现货 ETF 本周净流入 3.2 亿美元', 'panews', 5],
    ['交易平台宣布上线 SOL 永续合约', 'odaily', 18],
    ['XRP 现货 ETF 进入最后审核阶段', 'odaily', 40],
    ['以太坊基金会公布新一轮生态资助名单', 'panews', 75],
    ['Bitcoin miners expand into AI data centers', 'decrypt', 120],
  ],
  en: [
    ['Bitcoin spot ETFs see $320M of inflows this week', 'decrypt', 5],
    ['Solana developers ship a faster validator client', 'decrypt', 25],
    ['XRP ETF moves into final review', 'decrypt', 50],
    ['Ethereum Foundation announces a new grants round', 'decrypt', 90],
  ],
} as const;

async function popup(lang: 'zh' | 'en', theme: 'light' | 'dark') {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    viewport: { width: 380, height: 580 },
    deviceScaleFactor: 2,
    colorScheme: theme,
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
  });
  await mockNetwork(context);
  // 用真实的币种图标
  await context.unroute('https://coin-images.coingecko.com/**');
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker');
  await worker.evaluate(
    async ({ lang, theme }) => {
      await chrome.storage.local.clear();
      await chrome.storage.sync.set({
        settings: {
          language: lang,
          theme,
          coins: ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'dogecoin'],
          pinned: 'bitcoin',
        },
        settings$: { v: 1 },
      });
    },
    { lang, theme },
  );
  const page = await context.newPage();
  await page.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html`);
  await page.locator('.c-tile--wide .c-tile-q b').waitFor();
  await page.waitForLoadState('networkidle');
  return { context, page };
}

/** 把弹窗截图放进 1280×800 的画面，左边是标题，右边是弹窗（工具栏图标可选） */
async function compose(
  browser: Browser,
  shot: Buffer,
  [title, text]: readonly [string, string],
  file: string,
  dark: boolean,
  badge = false,
) {
  // 单独的浏览器、1 倍尺寸合成，输出正好 1280×800
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const img = `data:image/png;base64,${shot.toString('base64')}`;
  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;width:1280px;height:800px;display:flex;align-items:center;justify-content:center;gap:96px;
      font-family:-apple-system,"PingFang SC","Hiragino Sans GB",sans-serif;
      background:${dark ? '#24272d' : '#eef0f4'};color:${dark ? '#f1f2f5' : '#15171c'}}
    .copy{width:440px} h1{margin:0 0 16px;font-size:44px;line-height:1.2;font-weight:800;letter-spacing:-.01em}
    p{margin:0;font-size:22px;line-height:1.55;color:${dark ? '#b8bdc7' : '#5a6070'}}
    .shot{position:relative} .shot img.popup{width:380px;height:580px;border-radius:14px;display:block;
      box-shadow:0 24px 60px rgba(20,25,35,${dark ? '.55' : '.22'}),0 0 0 1px rgba(20,25,35,.08)}
    .bar{position:absolute;top:-58px;right:0;width:380px;height:40px;border-radius:12px;background:${dark ? '#33373d' : '#dce0e6'};
      display:flex;align-items:center;justify-content:flex-end;padding:0 14px;box-sizing:border-box}
    .bar span{position:relative;width:24px;height:24px;background:url(${ICON}) center/contain no-repeat}
    .bar b{position:absolute;right:-12px;bottom:-8px;padding:1px 5px;border-radius:5px;background:#c42b2e;color:#fff;font:600 11px -apple-system,sans-serif}
  </style></head><body><div class="copy"><h1>${title}</h1><p>${text}</p></div>
  <div class="shot">${badge ? '<div class="bar"><span><b>83.7k</b></span></div>' : ''}<img class="popup" src="${img}"></div></body></html>`);
  await page.screenshot({ path: file });
  await page.close();
}

async function capture(page: Page) {
  return page.screenshot();
}

test.describe.configure({ mode: 'serial' });

for (const lang of ['zh', 'en'] as const) {
  test(`商店截图 ${lang}`, async () => {
    test.setTimeout(120_000);
    const dir = path.join(OUT, lang);
    fs.mkdirSync(dir, { recursive: true });
    const copy = COPY[lang];
    const composer = await chromium.launch();

    const light = await popup(lang, 'light');
    const { page } = light;
    await compose(composer, await capture(page), copy.market, path.join(dir, '1-market.png'), false);
    await compose(composer, await capture(page), copy.toolbar, path.join(dir, '4-toolbar.png'), false, true);

    await page.locator('.c-tile--wide .c-tile-open').click();
    await page.locator('.chart-svg').waitFor();
    const box = await page.locator('.chart-svg').boundingBox();
    if (box) await page.mouse.move(box.x + box.width * 0.62, box.y + box.height / 2);
    await compose(composer, await capture(page), copy.detail, path.join(dir, '2-detail.png'), false);

    await page.getByRole('button', { name: lang === 'zh' ? '返回' : 'Back' }).click();
    await page.evaluate(() => {
      const g = globalThis as unknown as { chrome?: typeof chrome; browser?: typeof chrome };
      for (const ns of [g.chrome, g.browser]) {
        if (ns?.permissions)
          Object.defineProperty(ns.permissions, 'contains', { value: async () => true, configurable: true });
      }
    });
    const now = Date.now();
    await page.evaluate(
      ({ lang, items }) => chrome.storage.local.set({ news: { lang, fetchedAt: Date.now(), failed: [], items } }),
      {
        lang,
        items: NEWS[lang].map(([title, source, minutes], i) => ({
          id: `n${i}`,
          url: `https://example.com/${i}`,
          title,
          source,
          publishedAt: now - minutes * 60_000,
        })),
      },
    );
    await page.getByRole('button', { name: lang === 'zh' ? '资讯' : 'News' }).click();
    await page.locator('.c-item').first().waitFor();
    await compose(composer, await capture(page), copy.news, path.join(dir, '3-news.png'), false);
    await light.context.close();

    const dark = await popup(lang, 'dark');
    await compose(composer, await capture(dark.page), copy.dark, path.join(dir, '5-dark.png'), true);
    await dark.context.close();
    await composer.close();
  });
}
