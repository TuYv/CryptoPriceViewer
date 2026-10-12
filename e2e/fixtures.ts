import path from 'node:path';
import { type BrowserContext, test as base, chromium } from '@playwright/test';

const EXTENSION_PATH = path.resolve('.output/chrome-mv3');

export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright 的 fixture 写法要求第一个参数是对象解构
  context: async ({}, use) => {
    // 第一个参数传空字符串：每次用一个临时的浏览器资料目录，测完自动删除
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    await use(new URL(worker.url()).host);
  },
});

export const expect = test.expect;
