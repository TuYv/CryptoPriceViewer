import { badge, expect, test } from './fixtures';
import { RED, tile } from './helpers';

test('点色块打开详情：价格、涨跌、各项数据', async ({ openPopup }) => {
  const page = await openPopup();
  await tile(page, 'BTC').locator('.c-tile-open').click();
  await expect(page.locator('.c-dprice b')).toHaveText('$83,698');
  await expect(page.locator('.c-change')).toHaveText('+0.88%');
  const stats = page.locator('.c-stats');
  await expect(stats).toContainText('$1.68万亿');
  await expect(stats).toContainText('$126,080');
  await expect(stats).toContainText('现在低 33.6%');
  await expect(page.locator('.chart-svg')).toBeVisible();
  await expect(page.locator('.c-range-pct')).toContainText('近 7 天');
});

test('切换时间范围会请求对应的图表；鼠标移到图表上显示价格', async ({ openPopup, net }) => {
  const page = await openPopup();
  await tile(page, 'BTC').locator('.c-tile-open').click();
  await expect(page.locator('.chart-svg')).toBeVisible();
  await page.getByRole('radio', { name: '30天' }).click();
  await expect(page.locator('.c-range-pct')).toContainText('近 30 天');
  expect(net.calls.some((c) => c.includes('/coins/bitcoin/market_chart') && c.includes('days=30'))).toBe(true);
  const box = await page.locator('.chart-svg').boundingBox();
  if (!box) throw new Error('图表没有显示');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('.tip')).toContainText('$');
});

test('在详情页固定到工具栏，返回后变成整行', async ({ openPopup, worker }) => {
  const page = await openPopup();
  await tile(page, 'SOL').locator('.c-tile-open').click();
  await page.getByRole('button', { name: '显示在工具栏' }).click();
  await expect(page.getByRole('button', { name: '工具栏显示中' })).toBeVisible();
  await expect.poll(() => badge(worker)).toEqual({ text: '112', color: RED });
  await page.getByRole('button', { name: '返回' }).click();
  await expect(page.locator('.c-tile--wide .c-tile-name b')).toHaveText('SOL');
});

test('人民币：按人民币请求和显示', async ({ openPopup, net }) => {
  const page = await openPopup({ settings: { language: 'zh', coins: ['bitcoin'], currency: 'cny' } });
  await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('¥594,256');
  expect(net.calls.some((c) => c.startsWith('/coins/markets') && c.includes('vs_currency=cny'))).toBe(true);
});
