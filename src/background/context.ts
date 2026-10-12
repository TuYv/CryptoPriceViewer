import { browser } from '#imports';
import { LIMIT_WITH_KEY, LIMIT_WITHOUT_KEY, RequestGate } from '@/core/gate';
import type { Settings } from '@/core/settings';
import { apiKeyItem, gateItem } from '@/core/store';
import { type Language, languageFromLocale } from '@/i18n';

/** 后台里所有对 CoinGecko 的请求共用这一个排队器 */
export const gate = new RequestGate(
  { load: () => gateItem.getValue(), save: (state) => gateItem.setValue(state) },
  async () => ((await apiKeyItem.getValue()) ? LIMIT_WITH_KEY : LIMIT_WITHOUT_KEY),
);

export async function requestOptions() {
  const apiKey = await apiKeyItem.getValue();
  return apiKey ? { apiKey } : {};
}

export function languageOf(settings: Settings): Language {
  return settings.language ?? languageFromLocale(browser.i18n.getUILanguage());
}
