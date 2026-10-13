/**
 * 把 store-assets/logo/ 里的两个 SVG 画成扩展用的 PNG 图标和商店图标。
 * 运行：npm run icons
 * - 16、32 像素（工具栏）用 logo-small.svg，铺满整张图
 * - 48 像素（扩展管理页）用 logo.svg，铺满整张图
 * - 128 像素（安装提示、商店）用 logo.svg，按 Chrome 的要求画在中间 96×96，四周留 16 像素透明边
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const svg = (name) =>
  `data:image/svg+xml;base64,${fs.readFileSync(path.join(root, 'store-assets/logo', name)).toString('base64')}`;

const outputs = [
  { file: 'public/icon/16.png', size: 16, src: 'logo-small.svg', pad: 0 },
  { file: 'public/icon/32.png', size: 32, src: 'logo-small.svg', pad: 0 },
  { file: 'public/icon/48.png', size: 48, src: 'logo.svg', pad: 0 },
  { file: 'public/icon/128.png', size: 128, src: 'logo.svg', pad: 16 },
  { file: 'store-assets/icon128-store.png', size: 128, src: 'logo.svg', pad: 16 },
];

const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { file, size, src, pad } of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:transparent"><img src="${svg(src)}" style="display:block;margin:${pad}px;width:${size - pad * 2}px;height:${size - pad * 2}px"></body>`,
  );
  await page.locator('img').evaluate((img) => img.decode());
  await page.screenshot({ path: path.join(root, file), omitBackground: true });
  console.log(`${file}  ${size}×${size}`);
}
await browser.close();
