import { Config } from './config.js';
import { storage } from './lib/storage.js';
import coinGeckoClient from './clients/CoinGeckoClient.js';
import { updateBadge } from './badge-updater.js';

const ALARM_NAME = 'refreshPriceAlarm';

chrome.runtime.onStartup.addListener(async () => { await scheduleNextRefresh(); });
chrome.runtime.onInstalled.addListener(async () => { await scheduleNextRefresh(); });

// 设置存在 Config.STORAGE_KEY 下；刷新间隔或置顶币种变化时重新安排定时刷新
chrome.storage.onChanged.addListener(async (changes, area) => {
  const change = changes[Config.STORAGE_KEY];
  if (area !== 'local' || !change) return;
  const oldSettings = change.oldValue || {};
  const newSettings = change.newValue || {};
  if (newSettings.refreshInterval !== oldSettings.refreshInterval || newSettings.pinnedCoin !== oldSettings.pinnedCoin) {
    await scheduleNextRefresh();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await refreshBadgePrice();
  }
});

async function scheduleNextRefresh() {
  await chrome.alarms.clear(ALARM_NAME);
  const settings = await storage.get(Config.STORAGE_KEY);
  if (!settings) return;
  const interval = parseInt(settings.refreshInterval, 10);
  const pinnedCoin = settings.pinnedCoin;
  if (interval > 0 && pinnedCoin) {
    const periodInMinutes = Math.max(1, Math.ceil(interval / 60));
    chrome.alarms.create(ALARM_NAME, { periodInMinutes });
    console.log(`Alarm re-scheduled for '${pinnedCoin}' every ${periodInMinutes} minute(s).`);
  }
}

// 刷新扩展图标徽章上的置顶币种价格
async function refreshBadgePrice() {
  try {
    const settings = await storage.get(Config.STORAGE_KEY);

    if (!settings) {
        console.error('[Background] Failed to get settings from storage.');
        return;
    }

    const pinnedCoinSymbol = settings.pinnedCoin;

    const currency = settings.currency || 'USD';

    if (!pinnedCoinSymbol) {
      await updateBadge(null);
      return;
    }

    const geckoId = getCoinGeckoId(settings, pinnedCoinSymbol);
    if (!geckoId) {
      console.error(`[Background] No Gecko ID found for symbol '${pinnedCoinSymbol}'.`);
      return;
    }

    const data = await coinGeckoClient.getMarkets([geckoId], currency);

    if (!data || (data && data.error)) {
      if (data && data.error === 'API_LOCKED') {
        console.warn('[Background] API is locked. Gracefully skipping badge update.');
      } else {
        console.warn('[Background] API returned no or invalid data. Skipping badge update.');
      }
      return;
    }

    if (data && data[0]) {
      const coinData = {
        price: data[0].current_price,
        change24h: data[0].price_change_percentage_24h,
      };
      await updateBadge(coinData);
    } else {
      console.warn('[Background] API returned no data for the requested coin. Clearing badge.');
      await updateBadge(null);
    }
  } catch (error) {
    console.error('[Background] refreshBadgePrice failed:', error);
    await updateBadge(null, true); // 在出错时显示错误徽章
  }
}

function getCoinGeckoId(settings, coin) {
    if (!coin || typeof coin !== 'string') return null;
    const upperCoin = coin.toUpperCase();
    if (settings && settings.coinGeckoIds && settings.coinGeckoIds[upperCoin]) {
      return settings.coinGeckoIds[upperCoin];
    }
    if (Config.COIN_GECKO_IDS && Config.COIN_GECKO_IDS[upperCoin]) {
      return Config.COIN_GECKO_IDS[upperCoin];
    }
    return coin.toLowerCase();
}
