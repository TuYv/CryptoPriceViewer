import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

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

test('没有权限时，先说明会访问哪些网站；点“以后再说”回到行情', async ({ openPopup }) => {
  const page = await openPopup();
  await page.getByRole('button', { name: '资讯' }).click();
  await expect(page.getByText('显示新闻需要你同意一次')).toBeVisible();
  const sites = page.locator('.c-perm-sites');
  await expect(sites).toContainText('www.panewslab.com');
  await expect(sites).toContainText('api.odaily.news');
  await expect(sites).toContainText('decrypt.co');
  await page.getByRole('button', { name: '以后再说' }).click();
  await expect(page.getByRole('heading', { name: '行情' })).toBeVisible();
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
