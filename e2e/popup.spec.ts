/// <reference types="chrome" />
import { expect, test } from './fixtures';

const TITLES = {
  zh: ['行情', '资讯', '设置'],
  en: ['Markets', 'News', 'Settings'],
  ja: ['マーケット', 'ニュース', '設定'],
  ko: ['시세', '뉴스', '설정'],
} as const;

test('弹窗能打开，标题跟着浏览器语言，底部导航可以切换', async ({ page, extensionId }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  // macOS 上 Chromium 的界面语言跟随系统，所以按页面实际用的语言来核对
  const lang = (await page.evaluate(() => document.documentElement.lang)).slice(0, 2) as keyof typeof TITLES;
  const [market, news, settings] = TITLES[lang];

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(market);
  await page.getByRole('button', { name: news }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(news);
  await expect(page.getByRole('button', { name: news })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: settings }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(settings);
  expect(errors).toEqual([]);
});

test('manifest：名称和简介来自 _locales，必需权限只有存储、定时器和 CoinGecko', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const manifest = await page.evaluate(() => chrome.runtime.getManifest());
  const name = await page.evaluate(() => chrome.i18n.getMessage('extName'));
  expect(name).toBe('Crypto Price Viewer');
  expect(manifest.permissions).toEqual(['storage', 'alarms']);
  expect(manifest.host_permissions).toEqual(['https://api.coingecko.com/*']);
  expect(manifest.optional_host_permissions).toEqual([
    'https://www.panewslab.com/*',
    'https://api.odaily.news/*',
    'https://decrypt.co/*',
  ]);
});
