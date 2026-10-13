/**
 * 把 store-assets/logo/ 里的两个 SVG 画成扩展用的 PNG 图标和商店图标。
 * 运行：npm run icons
 * - 16、32 像素（工具栏）用 logo-small.svg，铺满整张图
 * - 48 像素（扩展管理页）用 logo.svg，铺满整张图
 * - 128 像素（安装提示、商店）用 logo.svg。Chrome 商店建议圆形图标直径约 112 像素，所以四周留 8 像素透明边
 * 画完逐张检查：图标是一整个圆，圆外透明、圆内不透明，不对就报错。
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
  { file: 'public/icon/128.png', size: 128, src: 'logo.svg', pad: 8 },
  { file: 'store-assets/icon128-store.png', size: 128, src: 'logo.svg', pad: 8 },
];

/** 和一个标准的圆比：离圆边 1.5 像素以外的点，圆内必须不透明、圆外必须透明。返回对不上的点占多少 */
function circleMismatch(page, png, size, pad) {
  return page.evaluate(
    async ({ src, size, pad }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, size, size);
      const r = (size - pad * 2) / 2;
      let checked = 0;
      let wrong = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2);
          if (Math.abs(d - r) < 1.5) continue;
          checked++;
          const alpha = data[(y * size + x) * 4 + 3];
          if (d < r ? alpha < 250 : alpha > 5) wrong++;
        }
      }
      return wrong / checked;
    },
    { src: `data:image/png;base64,${png.toString('base64')}`, size, pad },
  );
}

const browser = await chromium.launch({ channel: 'chromium' });
for (const { file, size, src, pad } of outputs) {
  // 每张图用一个新页面，一开始就是目标大小：在同一个页面里改大小再截图，画面可能还没按新大小重画好
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<body style="margin:0;background:transparent"><img src="${svg(src)}" style="display:block;margin:${pad}px;width:${size - pad * 2}px;height:${size - pad * 2}px"></body>`,
  );
  await page.locator('img').evaluate((img) => img.decode());
  const png = await page.screenshot({ omitBackground: true });
  const mismatch = await circleMismatch(page, png, size, pad);
  await page.close();
  if (mismatch > 0.01) throw new Error(`${file} 画出来不是一整个圆（${(mismatch * 100).toFixed(1)}% 的点对不上），没有保存`);
  fs.writeFileSync(path.join(root, file), png);
  console.log(`${file}  ${size}×${size}  检查通过`);
}
await browser.close();
