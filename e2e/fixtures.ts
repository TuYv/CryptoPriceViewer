/// <reference types="chrome" />
import path from 'node:path';
import { type BrowserContext, test as base, chromium, type Page, type Worker } from '@playwright/test';
import { type MockNetwork, mockNetwork } from './mock-api';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');

export interface Seed {
  /** 写进 chrome.storage.sync 的设置（会自动带上 WXT 的版本号） */
  settings?: Record<string, unknown>;
  /** 直接写进 chrome.storage.local 的内容 */
  local?: Record<string, unknown>;
}

interface Fixtures {
  context: BrowserContext;
  net: MockNetwork;
  worker: Worker;
  extensionId: string;
  /** 清空扩展的数据，按 seed 写入设置，然后打开弹窗 */
  openPopup: (seed?: Seed) => Promise<Page>;
}

export const DEFAULT_TEST_SETTINGS = { language: 'zh', coins: ['bitcoin', 'ethereum', 'solana', 'binancecoin'] };

export async function resetStorage(worker: Worker, seed: Seed = {}) {
  await worker.evaluate(async (s) => {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    await chrome.storage.session.clear();
    await chrome.action.setBadgeText({ text: '' });
    if (s.settings) await chrome.storage.sync.set({ settings: s.settings, settings$: { v: 1 } });
    if (s.local) await chrome.storage.local.set(s.local);
  }, seed);
}

/**
 * 扩展装好时后台会先取一次行情。等它取完再清空数据，
 * 免得机器忙的时候这次请求晚到，被算进测试自己的请求里
 */
async function waitForInstallRefresh(worker: Worker) {
  for (let waited = 0; waited < 10_000; waited += 100) {
    if (await worker.evaluate(async () => !!(await chrome.storage.local.get('markets')).markets)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export const test = base.extend<Fixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright 的 fixture 写法要求第一个参数是对象解构
  context: async ({}, use) => {
    // 第一个参数传空字符串：每次用一个临时的浏览器资料目录，测完自动删除
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      viewport: { width: 380, height: 580 },
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        // 没被拦截的请求一律解析失败，保证测试不会访问外网
        '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost',
      ],
    });
    await use(context);
    await context.close();
  },
  net: async ({ context }, use) => {
    await use(await mockNetwork(context));
  },
  worker: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    await use(worker);
  },
  extensionId: async ({ worker }, use) => {
    await use(new URL(worker.url()).host);
  },
  openPopup: async ({ context, worker, extensionId, net }, use) => {
    await use(async (seed = { settings: DEFAULT_TEST_SETTINGS }) => {
      await waitForInstallRefresh(worker);
      await resetStorage(worker, seed);
      net.calls.length = 0;
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      return page;
    });
  },
});

export const expect = test.expect;

export async function badge(worker: Worker) {
  return worker.evaluate(async () => ({
    text: await chrome.action.getBadgeText({}),
    color: await chrome.action.getBadgeBackgroundColor({}),
  }));
}

export async function syncSettings(worker: Worker): Promise<Record<string, unknown>> {
  return worker.evaluate(async () => (await chrome.storage.sync.get('settings')).settings as Record<string, unknown>);
}
