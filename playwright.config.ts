import { defineConfig } from '@playwright/test';

// 先 wxt build，再把 .output/chrome-mv3 装进 Playwright 自带的 Chromium 测试（npm run e2e）
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
});
