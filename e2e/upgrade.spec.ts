import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { expect, test } from './fixtures';
import { tile } from './helpers';
import { mockNetwork } from './mock-api';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');

async function launch(userDataDir: string) {
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    viewport: { width: 380, height: 580 },
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost',
    ],
  });
  await mockNetwork(context);
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker');
  return { context, worker, extensionId: new URL(worker.url()).host };
}

test('老用户升级：浏览器里还留着 0.1.x 的设置，后台启动时转换成新格式并删掉旧数据', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpv-upgrade-'));
  try {
    // 第一次启动：写入 0.1.x 留下的数据，然后关掉浏览器
    const first = await launch(userDataDir);
    await first.worker.evaluate(async () => {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      await chrome.storage.local.set({
        cryptoAppSetting: {
          selectedCoins: ['BTC', 'SOL', 'ETH'],
          coinGeckoIds: { SOL: 'solana' },
          pinnedCoin: 'SOL',
          currency: 'EUR',
          refreshInterval: '300',
          language: 'ja',
        },
        lastFeedbackTime: 1700000000000,
      });
    });
    await first.context.close();

    // 再次启动：后台启动时转换
    const { context, worker, extensionId } = await launch(userDataDir);
    await expect
      .poll(() => worker.evaluate(async () => (await chrome.storage.sync.get('settings')).settings ?? null))
      .toMatchObject({
        coins: ['bitcoin', 'solana', 'ethereum'],
        pinned: 'solana',
        currency: 'eur',
        refreshInterval: 300,
        language: 'ja',
      });
    expect(await worker.evaluate(() => chrome.storage.local.get(['cryptoAppSetting', 'lastFeedbackTime']))).toEqual({});

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.getByRole('heading', { name: 'マーケット' })).toBeVisible();
    await expect(page.locator('.c-tile--wide .c-tile-name b')).toHaveText('SOL');
    await expect(tile(page, 'BTC').locator('.c-tile-q b')).toHaveText('€71,980');
    await expect.poll(() => worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('96.4');
    await context.close();
  } finally {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
});
