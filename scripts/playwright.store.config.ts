import { defineConfig } from '@playwright/test';

// 只用来生成商店截图（npm run store:screenshots），不属于测试
export default defineConfig({
  testDir: '.',
  testMatch: 'store-screenshots.spec.ts',
  timeout: 120_000,
  reporter: 'list',
});
