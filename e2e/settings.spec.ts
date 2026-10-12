import { badge, expect, syncSettings, test } from './fixtures';
import { GREEN, tile } from './helpers';
import { VALID_API_KEY } from './mock-api';

test('换货币：按新货币请求，价格换成人民币', async ({ openPopup, net }) => {
  const page = await openPopup();
  await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('$83,698');
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByRole('combobox', { name: '显示货币' }).selectOption('cny');
  await page.getByRole('button', { name: '行情' }).click();
  await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('¥594,256');
  expect(net.calls.some((c) => c.includes('vs_currency=cny'))).toBe(true);
});

test('换语言：界面马上换成英文', async ({ openPopup }) => {
  const page = await openPopup();
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByRole('combobox', { name: '语言' }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Markets' })).toBeVisible();
});

test('涨跌颜色、外观、图标显示涨跌幅', async ({ openPopup, worker }) => {
  const page = await openPopup({ settings: { language: 'zh', coins: ['bitcoin'], pinned: 'bitcoin' } });
  await expect.poll(async () => (await badge(worker)).text).toBe('83.7k');
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByRole('combobox', { name: '涨跌颜色' }).selectOption('green-red');
  await expect(page.locator('html')).toHaveAttribute('data-updown', 'green-red');
  await expect.poll(async () => (await badge(worker)).color).toEqual(GREEN);
  await page.getByRole('combobox', { name: '涨跌颜色' }).selectOption('red-blue');
  await expect(page.locator('html')).toHaveAttribute('data-updown', 'red-blue');
  await page.getByRole('radio', { name: '深色' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: '涨跌幅' }).click();
  await expect.poll(async () => (await badge(worker)).text).toBe('+0.9%');
});

test('自动刷新间隔改成 5 分钟，后台的定时器跟着改；关掉后定时器取消', async ({ openPopup, worker }) => {
  const page = await openPopup();
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByRole('combobox', { name: '自动刷新' }).selectOption('300');
  await expect
    .poll(() => worker.evaluate(async () => (await chrome.alarms.get('refresh-prices'))?.periodInMinutes ?? null))
    .toBe(5);
  await page.getByRole('combobox', { name: '自动刷新' }).selectOption('0');
  await expect.poll(() => worker.evaluate(async () => (await chrome.alarms.get('refresh-prices')) ?? null)).toBeNull();
});

test('CoinGecko 密钥：能用的才保存，不能用的提示检查', async ({ openPopup, worker }) => {
  const page = await openPopup();
  await page.getByRole('button', { name: '设置' }).click();
  const input = page.getByLabel('CoinGecko 密钥（选填）');
  await input.fill('CG-wrong');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('这个密钥不能用')).toBeVisible();
  expect(await worker.evaluate(async () => (await chrome.storage.local.get('apiKey')).apiKey ?? '')).toBe('');
  await input.fill(VALID_API_KEY);
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('密钥可以用，已保存')).toBeVisible();
  expect(await worker.evaluate(async () => (await chrome.storage.local.get('apiKey')).apiKey)).toBe(VALID_API_KEY);
  await page.getByRole('button', { name: '删除密钥' }).click();
  await expect(page.getByText('密钥已删除')).toBeVisible();
});

test('资讯来源：关掉 PANews', async ({ openPopup, worker }) => {
  const page = await openPopup();
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByRole('button', { name: /资讯来源/ }).click();
  await page.getByRole('switch', { name: 'PANews' }).click();
  await expect(page.getByRole('switch', { name: 'PANews' })).toHaveAttribute('aria-checked', 'false');
  expect((await syncSettings(worker)).newsSources).toEqual(['odaily', 'decrypt']);
});

test('打赏页显示两张二维码', async ({ openPopup }) => {
  const page = await openPopup();
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByRole('button', { name: /打赏支持/ }).click();
  for (const name of ['BNB Chain', 'Solana']) {
    const img = page.getByRole('img', { name });
    await expect(img).toBeVisible();
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(100);
  }
});
