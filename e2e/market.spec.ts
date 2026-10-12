import { badge, expect, syncSettings, test } from './fixtures';
import { GREEN, openMenu, RED, tile } from './helpers';

const SIX = { language: 'zh', coins: ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'dogecoin'] };

test('第一次打开：显示默认的 4 个币和价格，只请求一次，没固定币时图标上没有价格', async ({
  openPopup,
  worker,
  net,
}) => {
  const page = await openPopup();
  await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('$83,698');
  await expect(page.locator('.c-tile')).toHaveCount(4);
  await expect(page.locator('.c-status')).toContainText('更新');
  expect(net.calls.filter((c) => c.startsWith('/coins/markets'))).toHaveLength(1);
  expect((await badge(worker)).text).toBe('');
});

test('搜索：已经在列表里的显示“已添加”；回车添加选中的币，马上有价格', async ({ openPopup, worker }) => {
  const page = await openPopup();
  const search = page.getByRole('combobox', { name: '搜索币种' });
  await search.fill('sol');
  await expect(page.getByRole('option', { name: /Solana/ })).toContainText('已添加');
  await search.fill('xrp');
  await expect(page.getByRole('option', { name: /XRP/ })).toBeVisible();
  await search.press('Enter');
  await expect(tile(page, 'XRP').locator('.c-tile-q b')).toHaveText('$1.41');
  await expect(search).toHaveValue('');
  expect((await syncSettings(worker)).coins).toEqual(['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple']);
});

test('“⋯”菜单：固定到工具栏后变成整行，图标显示价格，中文红涨', async ({ openPopup, worker }) => {
  const page = await openPopup();
  await expect(tile(page, 'ETH').locator('.c-tile-q b')).toHaveText('$2,552.85');
  await openMenu(page, 'ETH');
  await page.getByRole('menuitem', { name: '显示在工具栏图标上' }).click();
  await expect(page.locator('.c-tile--wide .c-tile-name b')).toHaveText('ETH');
  await expect.poll(() => badge(worker)).toEqual({ text: '2.55k', color: RED });
});

test('删除和撤销：删掉固定的币时图标清空；撤销后恢复原位和固定', async ({ openPopup, worker }) => {
  const page = await openPopup({ settings: { ...SIX, pinned: 'bitcoin' } });
  await expect.poll(() => badge(worker)).toEqual({ text: '83.7k', color: RED });
  await openMenu(page, 'BTC');
  await page.getByRole('menuitem', { name: '从自选里删除' }).click();
  await expect(page.getByRole('status').filter({ hasText: '已删除 Bitcoin' })).toBeVisible();
  await expect(page.locator('.c-tile')).toHaveCount(5);
  await expect.poll(async () => (await badge(worker)).text).toBe('');
  await page.getByRole('button', { name: '撤销' }).click();
  await expect(page.locator('.c-tile--wide .c-tile-name b')).toHaveText('BTC');
  expect((await syncSettings(worker)).coins).toEqual(SIX.coins);
  await expect.poll(async () => (await badge(worker)).text).toBe('83.7k');
});

test('不点撤销：5 秒后提示消失，币真的删掉了', async ({ openPopup, worker }) => {
  const page = await openPopup({ settings: SIX });
  await openMenu(page, 'DOGE');
  await page.getByRole('menuitem', { name: '从自选里删除' }).click();
  await expect(page.getByText('已删除 Dogecoin')).toBeVisible();
  await expect(page.getByText('已删除 Dogecoin')).toBeHidden({ timeout: 7000 });
  expect((await syncSettings(worker)).coins).not.toContain('dogecoin');
});

test('移到最前面', async ({ openPopup, worker }) => {
  const page = await openPopup({ settings: SIX });
  await openMenu(page, 'XRP');
  await page.getByRole('menuitem', { name: '移到最前面' }).click();
  await expect
    .poll(async () => (await syncSettings(worker)).coins)
    .toEqual(['ripple', 'bitcoin', 'ethereum', 'solana', 'binancecoin', 'dogecoin']);
  await expect(page.locator('.c-grid .c-tile').first().locator('.c-tile-name b')).toHaveText('XRP');
});

test('拖动排序', async ({ openPopup, worker }) => {
  const page = await openPopup({ settings: SIX });
  await expect(tile(page, 'DOGE').locator('.c-tile-q b')).toBeVisible();
  await tile(page, 'DOGE').dragTo(tile(page, 'BTC'));
  await expect
    .poll(async () => (await syncSettings(worker)).coins)
    .toEqual(['dogecoin', 'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple']);
});

test('被 CoinGecko 限速：继续显示旧价格，提示写明是几点的价格', async ({ openPopup, net }) => {
  const page = await openPopup({ settings: SIX });
  await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('$83,698');
  net.markets = 'rate-limited';
  await page.getByRole('button', { name: '刷新价格' }).click();
  const banner = page.locator('.c-banner');
  await expect(banner).toContainText('CoinGecko 暂时限制了请求次数');
  await expect(banner).toContainText('自动重试');
  await expect(page.locator('.c-status')).toContainText('的价格');
  await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('$83,698');
  await expect(page.locator('.c-tile.is-stale').first()).toBeVisible();
});

test('断网：显示旧价格并说明网络恢复后会自动更新', async ({ openPopup, net }) => {
  const page = await openPopup({ settings: SIX });
  await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('$83,698');
  net.markets = 'offline';
  await page.getByRole('button', { name: '刷新价格' }).click();
  await expect(page.locator('.c-banner')).toContainText('连不上网络');
});

test('自选为空：一键添加常见的币', async ({ openPopup, worker }) => {
  const page = await openPopup({ settings: { language: 'zh', coins: [] } });
  await expect(page.getByText('自选列表是空的')).toBeVisible();
  await page.getByRole('button', { name: '添加 SOL' }).click();
  await expect(tile(page, 'SOL').locator('.c-tile-q b')).toHaveText('$112.07');
  expect((await syncSettings(worker)).coins).toEqual(['solana']);
});

test('英文界面默认绿涨红跌', async ({ openPopup, worker }) => {
  const page = await openPopup({ settings: { language: 'en', coins: ['bitcoin'], pinned: 'bitcoin' } });
  await expect(page.getByRole('heading', { name: 'Markets' })).toBeVisible();
  await expect.poll(() => badge(worker)).toEqual({ text: '83.7k', color: GREEN });
});

test('币种图标加载失败时显示代码首字母', async ({ context, openPopup }) => {
  await context.route('https://coin-images.coingecko.com/**', (route) => route.fulfill({ status: 404, body: '' }));
  const page = await openPopup();
  await expect(tile(page, 'BTC').locator('.c-icon-ph')).toHaveText('B');
  await expect(tile(page, 'BTC').locator('img')).toHaveCount(0);
});
