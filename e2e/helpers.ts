import type { Page } from '@playwright/test';

/** 按代码找到色块，比如 tile(page, 'BTC') */
export const tile = (page: Page, symbol: string) =>
  page.locator('.c-tile', { has: page.locator('.c-tile-name b', { hasText: new RegExp(`^${symbol}$`) }) });

/** 打开某个色块的“⋯”菜单 */
export async function openMenu(page: Page, symbol: string) {
  const t = tile(page, symbol);
  await t.hover();
  await t.locator('.c-more').click();
}

export const RED = [196, 43, 46, 255];
export const GREEN = [10, 112, 73, 255];
