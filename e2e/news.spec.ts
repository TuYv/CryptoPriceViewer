import type { Page } from '@playwright/test';
import { expect, syncSettings, test } from './fixtures';

const MINUTE = 60_000;

/** 自动化测试里没法点 Chrome 的权限确认框，所以在弹窗页面里把“检查权限”换成总是有权限 */
async function pretendGranted(page: Page) {
  await page.evaluate(() => {
    const g = globalThis as unknown as { chrome?: typeof chrome; browser?: typeof chrome };
    for (const ns of [g.chrome, g.browser]) {
      if (ns?.permissions)
        Object.defineProperty(ns.permissions, 'contains', { value: async () => true, configurable: true });
    }
  });
}

async function seedNews(page: Page) {
  const now = Date.now();
  await page.evaluate(
    (items) => chrome.storage.local.set({ news: { lang: 'zh', fetchedAt: Date.now(), failed: ['decrypt'], items } }),
    [
      {
        id: 'a',
        url: 'https://www.panewslab.com/zh/articles/a',
        title: '比特币现货 ETF 本周净流入 3.2 亿美元',
        source: 'panews',
        publishedAt: now - 5 * MINUTE,
      },
      {
        id: 'b',
        url: 'https://www.odaily.news/zh-CN/newsflash/b',
        title: '交易平台宣布上线SOL永续合约',
        source: 'odaily',
        publishedAt: now - 18 * MINUTE,
      },
      {
        id: 'c',
        url: 'https://www.odaily.news/zh-CN/newsflash/c',
        title: '某国央行发布数字货币白皮书',
        source: 'odaily',
        publishedAt: now - 40 * MINUTE,
      },
    ],
  );
}

test('中文界面：打开资讯页之前不访问新闻网站；打开后不用授权直接显示 PANews 和 Odaily；Decrypt 单独询问，可以不要', async ({
  openPopup,
  worker,
  net,
}) => {
  const page = await openPopup();
  await expect(page.locator('.c-tile').first()).toBeVisible();
  await page.waitForTimeout(500);
  expect(net.newsCalls).toEqual([]);

  await page.getByRole('button', { name: '资讯' }).click();
  await expect(page.getByText('比特币现货 ETF 本周净流入 3.2 亿美元')).toBeVisible();
  // Odaily 的“上线 SOL 永续合约”和 PANews 说的是同一件事，只留更早的那条，所以这里看 Odaily 的另一条
  await expect(page.getByText('XRP 现货 ETF 获批进入最后审核阶段')).toBeVisible();
  await expect(page.getByText('显示新闻需要你同意一次')).toHaveCount(0);
  expect(net.newsCalls).not.toContain('decrypt.co');

  const ask = page.locator('.c-ask');
  await expect(ask).toContainText('Decrypt（英文）');
  await expect(ask).toContainText('decrypt.co');
  await ask.getByRole('button', { name: '不用了' }).click();
  await expect(ask).toHaveCount(0);
  await expect.poll(async () => (await syncSettings(worker)).newsSources).toEqual(['panews', 'odaily']);
});

test('英文界面只有 Decrypt：先说明要访问哪个网站；点“以后再说”回到行情', async ({ openPopup, net }) => {
  const page = await openPopup({ settings: { language: 'en', coins: ['bitcoin'] } });
  await page.getByRole('button', { name: 'News' }).click();
  await expect(page.getByText('News needs your permission')).toBeVisible();
  const sites = page.locator('.c-perm-sites li');
  await expect(sites).toHaveCount(1);
  await expect(sites).toContainText('decrypt.co');
  expect(net.newsCalls).toEqual([]);
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('heading', { name: 'Markets' })).toBeVisible();
});

test('PANews 不再允许直接读取时，提示用户同意访问；Odaily 照常显示', async ({ openPopup, net }) => {
  net.panewsOpen = false;
  const page = await openPopup({ settings: { language: 'zh', coins: ['bitcoin'], newsSources: ['panews', 'odaily'] } });
  await page.getByRole('button', { name: '资讯' }).click();
  await expect(page.getByText('交易平台宣布上线SOL永续合约')).toBeVisible();
  await expect(page.locator('.c-ask')).toContainText('PANews 现在要先同意扩展访问，才能读取新闻', { timeout: 10_000 });
  await expect(page.locator('.c-ask').getByRole('button', { name: '允许' })).toBeVisible();
  await expect(page.locator('.c-feed-note')).toHaveCount(0);
});

test('有新闻时按时间显示，可以只看提到某个币的；没抓到的来源有提示', async ({ openPopup }) => {
  const page = await openPopup();
  await expect(page.locator('.c-tile').first()).toBeVisible();
  await page.waitForTimeout(500);
  await pretendGranted(page);
  await seedNews(page);
  await page.getByRole('button', { name: '资讯' }).click();
  await expect(page.locator('.c-item')).toHaveCount(3);
  await expect(page.locator('.c-feed-note')).toContainText('Decrypt');
  await page.getByRole('radio', { name: 'BTC' }).click();
  await expect(page.locator('.c-item')).toHaveCount(1);
  await expect(page.locator('.c-item b')).toHaveText('比特币现货 ETF 本周净流入 3.2 亿美元');
  await page.getByRole('radio', { name: '我的自选' }).click();
  await expect(page.locator('.c-item')).toHaveCount(2);
  await expect(page.locator('.c-item').first()).toHaveAttribute('href', 'https://www.panewslab.com/zh/articles/a');
});

test('所有来源都关掉时提示去设置里打开', async ({ openPopup }) => {
  const page = await openPopup({ settings: { language: 'zh', newsSources: [] } });
  await page.getByRole('button', { name: '资讯' }).click();
  await expect(page.getByText('所有资讯来源都关掉了')).toBeVisible();
  await page.getByRole('button', { name: '去设置' }).click();
  await expect(page.getByRole('heading', { name: '资讯来源' })).toBeVisible();
});

/** 把弹窗里的时间拨到某一刻再重新打开（后台用的还是真实时间） */
async function setTime(page: Page, time: number) {
  await page.clock.install({ time });
  await page.reload();
}

/** 和 9 月 CPI 有关的快讯（美国东部时间 10 月 14 日 8:30 公布），标题是编的 */
async function seedEventNews(page: Page) {
  const cpiAt = Date.UTC(2026, 9, 14, 12, 30);
  const item = (id: string, title: string, minutesAfter: number) => ({
    id,
    title,
    url: `https://www.odaily.news/zh-CN/newsflash/${id}`,
    source: 'odaily',
    publishedAt: cpiAt + minutesAfter * MINUTE,
  });
  await page.evaluate(
    (items) => chrome.storage.local.set({ eventNews: { lang: 'zh', items } }),
    [
      item('e1', '美国9月CPI同比上涨3.7%，高于预期', 0),
      item('e2', '市场加大美联储加息押注', 2),
      item('e3', '美国核心CPI年率创新高', 1),
    ],
  );
}

test('大事日程：下一件大事可以展开说明；列出接下来几件；最近公布的下面挂着相关快讯；下次打开还是大事日程', async ({
  openPopup,
}) => {
  const page = await openPopup();
  await setTime(page, Date.UTC(2026, 9, 15, 3, 0));
  await page.getByRole('button', { name: '资讯' }).click();
  // 等后台这次抓完新闻，再放进和大事有关的快讯，免得被后台按真实时间清掉
  await expect(page.getByText('比特币现货 ETF 本周净流入 3.2 亿美元')).toBeVisible();
  await page.getByRole('radio', { name: '大事日程' }).click();
  await seedEventNews(page);

  const card = page.locator('.c-ev-card');
  await expect(card.getByRole('heading', { name: '美联储利率决议' })).toBeVisible();
  await expect(card).toContainText('美联储开会决定美元的基础利息');
  await card.getByRole('button', { name: '怎么看结果' }).click();
  await expect(card).toContainText('关键看结果和大家预想的一不一样');
  await expect(card.getByRole('link', { name: '官方公布页面' })).toHaveAttribute(
    'href',
    'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  );
  await card.getByRole('button', { name: '收起' }).click();
  await expect(card).not.toContainText('关键看结果');

  const later = page.locator('section', { has: page.getByRole('heading', { name: '接下来' }) });
  await expect(later.locator('.c-ev-row b')).toHaveText(['PCE 物价', 'GDP 经济增长', '非农就业', 'CPI 物价']);
  await later.getByRole('button', { name: /非农就业/ }).click();
  await expect(later).toContainText('美国上个月新增了多少个工作');

  const done = page.locator('.c-ev-done');
  await expect(done.locator('.c-ev-row b')).toHaveText(['CPI 物价']);
  // 只挂说到 CPI 的，按时间从早到晚
  await expect(done.locator('.c-item b')).toHaveText(['美国9月CPI同比上涨3.7%，高于预期', '美国核心CPI年率创新高']);

  await page.reload();
  await page.getByRole('button', { name: '资讯' }).click();
  await expect(page.getByRole('radio', { name: '大事日程' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { name: '美联储利率决议' })).toBeVisible();
});

test('英文界面没收集到快讯时，给出官方公布页面；还没同意访问 Decrypt 也能看大事日程', async ({ openPopup }) => {
  const page = await openPopup({ settings: { language: 'en', coins: ['bitcoin'] } });
  await setTime(page, Date.UTC(2026, 9, 15, 3, 0));
  await page.getByRole('button', { name: 'News' }).click();
  await expect(page.getByText('News needs your permission')).toBeVisible();
  await page.getByRole('radio', { name: 'Key dates' }).click();
  await expect(page.getByRole('heading', { name: 'Fed rate decision' })).toBeVisible();
  const done = page.locator('.c-ev-done');
  await expect(done).toContainText('No related headlines were collected.');
  await expect(done.getByRole('link', { name: 'Official release' })).toHaveAttribute(
    'href',
    'https://www.bls.gov/news.release/cpi.nr0.htm',
  );
});

test('写好的日期都过去以后，提示日程待更新，并给出三个官网的日程', async ({ openPopup }) => {
  const page = await openPopup();
  await setTime(page, Date.UTC(2028, 0, 5));
  await page.getByRole('button', { name: '资讯' }).click();
  await page.getByRole('radio', { name: '大事日程' }).click();
  await expect(page.getByRole('heading', { name: '日程待更新' })).toBeVisible();
  await expect(page.locator('.c-ev-card a')).toHaveText(['美联储', '美国劳工统计局', '美国经济分析局']);
  await expect(page.locator('.c-ev-row')).toHaveCount(0);
});
