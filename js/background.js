import { Config } from './config.js';
import { storage } from './lib/storage.js';
import { http } from './lib/http.js';
import { updateBadge } from './badge-updater.js';

const ALARM_NAME = 'refreshPriceAlarm';

// ... (所有监听器和 scheduleNextRefresh 函数保持不变) ...
chrome.runtime.onStartup.addListener(async () => { await scheduleNextRefresh(); });
chrome.runtime.onInstalled.addListener(async () => { await scheduleNextRefresh(); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.settings?.newValue?.refreshInterval !== changes.settings?.oldValue?.refreshInterval || changes.settings?.newValue?.pinnedCoin !== changes.settings?.oldValue?.pinnedCoin)) {
    scheduleNextRefresh();
  }
});

// 监听闹钟事件，这次将调用完整的刷新函数
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log(`[${new Date().toLocaleTimeString()}] Alarm triggered! Executing refreshBadgePrice...`);
    await refreshBadgePrice();
  }
});

async function scheduleNextRefresh() {
  // ... (之前已验证无问题的代码) ...
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

// 刷新徽章价格的核心函数 - 带有详细的诊断日志
async function refreshBadgePrice() {
  console.log('STEP 1: Entering refreshBadgePrice function.');
  try {
    const settings = await storage.get(Config.STORAGE_KEY);

    if (!settings) {
        console.error('ERROR at STEP 2: Failed to get settings from storage.');
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
      console.error(`ERROR at STEP 4: No Gecko ID found for symbol '${pinnedCoinSymbol}'.`);
      return;
    }

    const url = `${Config.API_BASE_URL}/coins/markets?vs_currency=${currency.toLowerCase()}&ids=${geckoId}&price_change_percentage=24h`;

    const data = await http.getJson(url);

    if (data && data[0]) {
      const coinData = {
        price: data[0].current_price,
        change24h: data[0].price_change_percentage_24h,
      };
      await updateBadge(coinData);
    } else {
      console.warn('WARN at STEP 7: API returned no data for the requested coin. Clearing badge.');
      await updateBadge(null);
    }
  } catch (error) {
    console.error('FATAL ERROR in refreshBadgePrice:', error);
    await updateBadge(null, true); // 在出错时显示错误徽章
  }
}

// 辅助函数 - 保持不变
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
