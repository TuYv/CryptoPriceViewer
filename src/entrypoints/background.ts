import { browser } from '#imports';
import { updateBadge } from '@/background/badge';
import { handleMessage, isMessage } from '@/background/handlers';
import { refreshMarkets } from '@/background/markets';
import { pruneNews, refreshNews } from '@/background/news';
import { normalizeSettings, type Settings } from '@/core/settings';
import { getSettings, migrateLegacySettings, settingsItem } from '@/core/store';

const PRICES_ALARM = 'refresh-prices';
const NEWS_ALARM = 'refresh-news';

/** 刷新失败的原因已经记在存储里，弹窗会显示，这里不用再处理 */
const quiet = (p: Promise<unknown>) => p.catch(() => undefined);

async function schedule(): Promise<void> {
  const { refreshInterval } = await getSettings();
  await browser.alarms.clear(PRICES_ALARM);
  if (refreshInterval > 0) await browser.alarms.create(PRICES_ALARM, { periodInMinutes: refreshInterval / 60 });
  if (!(await browser.alarms.get(NEWS_ALARM))) await browser.alarms.create(NEWS_ALARM, { periodInMinutes: 30 });
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

async function onSettingsChanged(next: Settings, prev: Settings): Promise<void> {
  if (!same(next.coins, prev.coins) || next.currency !== prev.currency) await quiet(refreshMarkets({ force: false }));
  if (next.refreshInterval !== prev.refreshInterval) await schedule();
  await updateBadge();
  if (next.language !== prev.language || !same(next.newsSources, prev.newsSources)) {
    await pruneNews();
    await quiet(refreshNews({ force: true }));
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    await migrateLegacySettings();
    await schedule();
    await quiet(refreshMarkets({ force: true }));
  });

  browser.runtime.onStartup.addListener(async () => {
    await schedule();
    await quiet(refreshMarkets({ force: false }));
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === PRICES_ALARM) void quiet(refreshMarkets({ force: false }));
    if (alarm.name === NEWS_ALARM) void quiet(refreshNews({ force: false }));
  });

  browser.runtime.onMessage.addListener((msg, sender) => {
    if (sender.id !== browser.runtime.id || !isMessage(msg)) return undefined;
    return handleMessage(msg);
  });

  settingsItem.watch((next, prev) => {
    void onSettingsChanged(normalizeSettings(next), normalizeSettings(prev));
  });

  browser.permissions.onAdded.addListener(() => void quiet(refreshNews({ force: true })));
  browser.permissions.onRemoved.addListener(() => void pruneNews());

  // 每次后台启动都检查一次 0.1.x 的旧数据。没有旧数据时什么也不做
  void migrateLegacySettings();
});
