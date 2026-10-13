import { defineConfig } from '@playwright/test';

// 只用来生成商店截图和宣传图（npm run store:images），不属于测试
export default defineConfig({
  testDir: '.',
  testMatch: 'store-images.spec.ts',
  timeout: 120_000,
  reporter: 'list',
});
