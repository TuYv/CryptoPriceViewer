import { expect, test } from './fixtures';

test('manifest：名称来自 _locales；必需权限只有存储、定时器和 CoinGecko，新闻网站是可选权限', async ({ worker }) => {
  const { manifest, name } = await worker.evaluate(() => ({
    manifest: chrome.runtime.getManifest(),
    name: chrome.i18n.getMessage('extName'),
  }));
  expect(name).toBe('Crypto Price Viewer');
  expect(manifest.permissions).toEqual(['storage', 'alarms']);
  expect(manifest.host_permissions).toEqual(['https://api.coingecko.com/*']);
  expect(manifest.optional_host_permissions).toEqual([
    'https://www.panewslab.com/*',
    'https://api.odaily.news/*',
    'https://decrypt.co/*',
  ]);
});
