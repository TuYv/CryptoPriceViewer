import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from '#imports';
import { DEFAULT_SETTINGS } from './settings';
import { getSettings, migrateLegacySettings, settingsItem, updateSettings } from './store';

beforeEach(() => {
  fakeBrowser.reset();
});

describe('migrateLegacySettings：老用户升级', () => {
  it('转换 0.1.x 的设置，写进同步存储，删掉旧数据', async () => {
    await fakeBrowser.storage.local.set({
      cryptoAppSetting: {
        selectedCoins: ['BTC', 'SOL'],
        pinnedCoin: 'SOL',
        currency: 'EUR',
        refreshInterval: 30,
        language: 'ja',
      },
      cryptoPriceViewerState: { appStatus: {} },
      lastFeedbackTime: 123,
    });
    expect(await migrateLegacySettings()).toBe(true);
    expect(await getSettings()).toMatchObject({
      coins: ['bitcoin', 'solana'],
      pinned: 'solana',
      currency: 'eur',
      refreshInterval: 30,
      language: 'ja',
    });
    expect(await fakeBrowser.storage.local.get(null)).toEqual({});
  });

  it('另一台电脑已经同步过来新设置时，只补上这台电脑多出来的币', async () => {
    await settingsItem.setValue({ ...DEFAULT_SETTINGS, coins: ['bitcoin'], pinned: 'bitcoin' });
    await fakeBrowser.storage.local.set({ cryptoAppSetting: { selectedCoins: ['BTC', 'ETH'], pinnedCoin: 'ETH' } });
    await migrateLegacySettings();
    expect(await getSettings()).toMatchObject({ coins: ['bitcoin', 'ethereum'], pinned: 'bitcoin' });
  });

  it('没有旧数据时什么都不做', async () => {
    expect(await migrateLegacySettings()).toBe(false);
    expect(await fakeBrowser.storage.sync.get(null)).toEqual({});
  });
});

describe('设置读写', () => {
  it('第一次读到默认设置', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('更新时会顺便修正不合法的值', async () => {
    const next = await updateSettings((s) => ({ ...s, coins: ['bitcoin'], pinned: 'ethereum' }));
    expect(next.pinned).toBeNull();
    expect((await getSettings()).coins).toEqual(['bitcoin']);
  });
});
