/**
 * 生成 Chrome 商店用的图片，输出到 store-assets/：
 * - screenshots/<语言>/：截图（1280×800），中文、英文、日文、韩文各 5 张
 * - promo/：小宣传图（440×280，商店要求必须有）和大宣传图（1400×560，可选）
 * 运行：npm run store:images（需要联网，用来加载真实的币种图标）
 */
import fs from 'node:fs';
import path from 'node:path';
import { type Browser, chromium, type Page, test } from '@playwright/test';
import { mockNetwork } from '../e2e/mock-api';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');
const OUT = path.resolve('store-assets');
const dataUrl = (file: string, type: string) =>
  `data:${type};base64,${fs.readFileSync(path.resolve(file)).toString('base64')}`;
const ICON = dataUrl('public/icon/48.png', 'image/png');

type Lang = 'zh' | 'en' | 'ja' | 'ko';
type Shot = 'market' | 'detail' | 'news' | 'toolbar' | 'list';

const COPY: Record<Lang, Record<Shot, readonly [string, string]>> = {
  zh: {
    market: ['一眼看清自选币', '每个币用自己的颜色，7 天走势画在下面'],
    detail: ['1 天到 1 年的价格走势', '鼠标移上去看每个时间点的价格'],
    news: ['币圈新闻时间线', '按天分组，可以只看提到自选币的'],
    toolbar: ['价格挂在工具栏上', '固定一个币，不用打开也能看到价格'],
    list: ['列表显示和深色模式', '色块和列表随时切换；外观跟随系统，也可以在设置里固定'],
  },
  en: {
    market: ['Your coins at a glance', 'Each coin in its own color, with a 7-day trend'],
    detail: ['Price history from 1 day to 1 year', 'Hover to see the price at any point'],
    news: ['A crypto news timeline', 'Grouped by day, filtered to your coins'],
    toolbar: ['A price on your toolbar', 'Pin a coin and see its price without opening anything'],
    list: ['List view and dark mode', 'Switch between tiles and a list; the theme follows your system or your choice'],
  },
  ja: {
    market: ['登録したコインをひと目で', 'コインごとの色で表示し、下に7日間の値動き'],
    detail: ['1日から1年までの値動き', 'マウスを乗せると、その時点の価格がわかります'],
    news: ['暗号資産ニュースのタイムライン', '日付ごとに表示。登録したコインの話題だけにも絞れます'],
    toolbar: ['ツールバーに価格を表示', 'コインを1つ固定すれば、開かなくても価格がわかります'],
    list: ['リスト表示とダークモード', 'タイルとリストを切り替え可能。外観はシステムに合わせるか、設定で固定'],
  },
  ko: {
    market: ['관심 코인을 한눈에', '코인마다 고유 색상으로 보여 주고, 아래에 7일 추이를 그립니다'],
    detail: ['1일부터 1년까지의 가격 추이', '마우스를 올리면 그 시점의 가격이 보입니다'],
    news: ['암호화폐 뉴스 타임라인', '날짜별로 묶어 보여 주고, 내 코인 소식만 볼 수도 있습니다'],
    toolbar: ['툴바에 가격 표시', '코인 하나를 고정하면 열지 않아도 가격이 보입니다'],
    list: ['목록 보기와 다크 모드', '타일과 목록을 바꿀 수 있고, 화면 모드는 시스템을 따르거나 설정에서 고정'],
  },
};

/** 截图里的新闻标题是示例文字 */
const NEWS: Record<Lang, [string, string, number][]> = {
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
  ja: [
    ['ビットコイン現物ETF、今週3.2億ドルの純流入', 'panews', 5],
    ['取引所がSOL無期限先物の取り扱いを開始', 'odaily', 18],
    ['XRP現物ETF、最終審査の段階へ', 'odaily', 40],
    ['イーサリアム財団、新たな助成先を発表', 'panews', 75],
    ['Bitcoin miners expand into AI data centers', 'decrypt', 120],
  ],
  ko: [
    ['비트코인 현물 ETF, 이번 주 3.2억 달러 순유입', 'panews', 5],
    ['거래소, SOL 무기한 선물 상장 발표', 'odaily', 18],
    ['XRP 현물 ETF, 최종 심사 단계 진입', 'odaily', 40],
    ['이더리움 재단, 새 지원금 대상 발표', 'panews', 75],
    ['Bitcoin miners expand into AI data centers', 'decrypt', 120],
  ],
};

/** 断行：日文按词组断开（不会把“ダークモード”拆开），韩文只在空格处断开 */
const BREAK: Record<Lang, string> = { zh: 'normal', en: 'normal', ja: 'auto-phrase', ko: 'keep-all' };

/** 合成截图时标题用的字体：每种语言用自己的字体，日文的汉字不会显示成中文字形 */
const FONTS: Record<Lang, string> = {
  zh: '"PingFang SC","Hiragino Sans GB",sans-serif',
  en: '-apple-system,"Helvetica Neue",sans-serif',
  ja: '"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif',
  ko: '"Apple SD Gothic Neo","Malgun Gothic",sans-serif',
};

async function popup(lang: Lang, theme: 'light' | 'dark', layout: 'tiles' | 'list') {
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
    async ({ lang, theme, layout }) => {
      await chrome.storage.local.clear();
      await chrome.storage.sync.set({
        settings: {
          language: lang,
          theme,
          layout,
          coins: ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'dogecoin'],
          pinned: 'bitcoin',
        },
        settings$: { v: 1 },
      });
    },
    { lang, theme, layout },
  );
  const page = await context.newPage();
  await page.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html`);
  await page
    .locator(layout === 'list' ? '.c-row .c-row-q b' : '.c-tile--wide .c-tile-q b')
    .first()
    .waitFor();
  await page.waitForLoadState('networkidle');
  return { context, page };
}

/** 把弹窗截图放进 1280×800 的画面，左边是标题，右边是弹窗（工具栏图标可选） */
async function compose(
  browser: Browser,
  shot: Buffer,
  [title, text]: readonly [string, string],
  file: string,
  { lang, dark, badge = false }: { lang: Lang; dark: boolean; badge?: boolean },
) {
  // 单独的浏览器、1 倍尺寸合成，输出正好 1280×800
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const img = `data:image/png;base64,${shot.toString('base64')}`;
  await page.setContent(`<!doctype html><html lang="${lang}"><head><style>
    body{margin:0;width:1280px;height:800px;display:flex;align-items:center;justify-content:center;gap:96px;
      font-family:${FONTS[lang]};
      background:${dark ? '#24272d' : '#eef0f4'};color:${dark ? '#f1f2f5' : '#15171c'}}
    .copy{width:440px;word-break:${BREAK[lang]}}
    h1{margin:0 0 16px;font-size:44px;line-height:1.2;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
    p{margin:0;font-size:22px;line-height:1.55;color:${dark ? '#b8bdc7' : '#5a6070'};text-wrap:pretty}
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

async function seedNews(page: Page, lang: Lang) {
  // 自动化测试点不了权限确认框：在弹窗里把“检查权限”换成总是有权限，Decrypt 的询问就不会出现
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
}

test.describe.configure({ mode: 'serial' });

for (const lang of ['zh', 'en', 'ja', 'ko'] as const) {
  test(`商店截图 ${lang}`, async () => {
    test.setTimeout(120_000);
    const dir = path.join(OUT, 'screenshots', lang);
    fs.mkdirSync(dir, { recursive: true });
    const copy = COPY[lang];
    const composer = await chromium.launch();
    const save = (shot: Buffer, key: Shot, name: string, dark = false, badge = false) =>
      compose(composer, shot, copy[key], path.join(dir, name), { lang, dark, badge });
    const back = { zh: '返回', en: 'Back', ja: '戻る', ko: '뒤로' }[lang];
    const newsTab = { zh: '资讯', en: 'News', ja: 'ニュース', ko: '뉴스' }[lang];

    const light = await popup(lang, 'light', 'tiles');
    const { page } = light;
    await save(await page.screenshot(), 'market', '1-market.png');
    await save(await page.screenshot(), 'toolbar', '4-toolbar.png', false, true);

    await page.locator('.c-tile--wide .c-tile-open').click();
    await page.locator('.chart-svg').waitFor();
    const box = await page.locator('.chart-svg').boundingBox();
    if (box) await page.mouse.move(box.x + box.width * 0.62, box.y + box.height / 2);
    await save(await page.screenshot(), 'detail', '2-detail.png');

    await page.getByRole('button', { name: back }).click();
    await seedNews(page, lang);
    await page.getByRole('button', { name: newsTab }).click();
    await page.locator('.c-item').first().waitFor();
    await save(await page.screenshot(), 'news', '3-news.png');
    await light.context.close();

    const dark = await popup(lang, 'dark', 'list');
    await dark.page.mouse.move(0, 0);
    await save(await dark.page.screenshot(), 'list', '5-list-dark.png', true);
    await dark.context.close();
    await composer.close();
  });
}

/* ---------- 宣传图 ---------- */

const COINS = { bitcoin: '#F7931A', ethereum: '#627EEA', solana: '#9945FF', binancecoin: '#F0B90B', ripple: '#2F7FD1' };
type PromoCoin = keyof typeof COINS;
const SPARKS: Record<string, number[]> = Object.fromEntries(
  (
    JSON.parse(fs.readFileSync(path.resolve('e2e/data/coingecko.json'), 'utf8')).markets as {
      id: string;
      sparkline_in_7d: { price: number[] };
    }[]
  ).map((c) => [c.id, c.sparkline_in_7d.price]),
);

function sparkSvg(values: number[], color: string, w: number, h: number) {
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const pad = h * 0.08;
  const pts = values.map(
    (v, i) =>
      `${((i / (values.length - 1)) * w).toFixed(1)} ${(pad + (1 - (v - min) / range) * (h - pad * 2)).toFixed(1)}`,
  );
  const line = `M${pts.join('L')}`;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block">
    <path d="${line}L${w} ${h}L0 ${h}Z" fill="${color}" opacity=".18"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="${Math.max(2, w / 110)}" stroke-linejoin="round"/></svg>`;
}

/** 抽象的色块：币色圆点、代表币名和价格的短条、底部是这个币真实的 7 天走势。不放数字和文字 */
function tile(id: PromoCoin, w: number, h: number, s: number) {
  const c = COINS[id];
  const bar = (left: number, top: number, width: number, height: number, alpha: number) =>
    `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;border-radius:9px;background:rgba(241,243,248,${alpha})"></div>`;
  return `<div style="position:relative;width:${w}px;height:${h}px;border-radius:${18 * s}px;overflow:hidden;background:color-mix(in srgb, ${c} 18%, #1e212c)">
    <div style="position:absolute;left:${12 * s}px;top:${12 * s}px;width:${22 * s}px;height:${22 * s}px;border-radius:50%;background:${c}"></div>
    ${bar(42 * s, 14 * s, 36 * s, 7 * s, 0.85)}${bar(42 * s, 26 * s, 54 * s, 5 * s, 0.35)}${bar(12 * s, 48 * s, w * 0.42, 11 * s, 0.85)}
    <div style="position:absolute;left:0;right:0;bottom:0">${sparkSvg(SPARKS[id] ?? [], c, w, h * 0.38)}</div>
  </div>`;
}

function promoPage(width: number, height: number, body: string) {
  const font = dataUrl('node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2', 'font/woff2');
  return `<!doctype html><html><head><style>
    @font-face{font-family:Figtree;src:url(${font}) format('woff2');font-weight:300 900}
    body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#14171f;color:#f1f3f8;font-family:Figtree,sans-serif}
    .name{font-weight:800;line-height:1.04;letter-spacing:-.01em}
  </style></head><body>${body}</body></html>`;
}

test('商店宣传图', async () => {
  const dir = path.join(OUT, 'promo');
  fs.mkdirSync(dir, { recursive: true });
  const logo = dataUrl('store-assets/logo/logo.svg', 'image/svg+xml');
  const browser = await chromium.launch();
  const render = async (file: string, width: number, height: number, body: string) => {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(promoPage(width, height, body));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dir, file) });
    await page.close();
  };

  // 小宣传图：缩小一半也要看得清，所以只放图标、名字和三块色块
  await render(
    'small-440x280.png',
    440,
    280,
    `<div style="position:absolute;left:30px;top:50%;transform:translateY(-50%)">
      <img src="${logo}" style="width:80px;height:80px;display:block">
      <div class="name" style="margin-top:14px;font-size:28px">Crypto<br>Price Viewer</div>
    </div>
    <div style="position:absolute;right:-24px;top:50%;transform:translateY(-50%);display:grid;grid-template-columns:repeat(2,auto);gap:10px">
      <div style="grid-column:span 2">${tile('bitcoin', 246, 104, 0.72)}</div>
      ${tile('ethereum', 118, 94, 0.62)}${tile('solana', 118, 94, 0.62)}
    </div>`,
  );

  // 大宣传图
  await render(
    'marquee-1400x560.png',
    1400,
    560,
    `<div style="position:absolute;left:112px;top:50%;transform:translateY(-50%)">
      <img src="${logo}" style="width:150px;height:150px;display:block">
      <div class="name" style="margin-top:28px;font-size:68px">Crypto<br>Price Viewer</div>
    </div>
    <div style="position:absolute;right:-60px;top:50%;transform:translateY(-50%);display:grid;grid-template-columns:repeat(3,auto);gap:16px">
      <div style="grid-column:span 2">${tile('bitcoin', 476, 200, 1.5)}</div>
      ${tile('binancecoin', 230, 200, 1.25)}
      ${tile('ethereum', 230, 196, 1.25)}${tile('solana', 230, 196, 1.25)}${tile('ripple', 230, 196, 1.25)}
    </div>`,
  );
  await browser.close();
});
