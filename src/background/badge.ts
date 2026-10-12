import { browser } from '#imports';
import { formatBadge, formatChange, formatPrice } from '@/core/format';
import { effectiveUpDown, type Settings, type UpDownStyle } from '@/core/settings';
import { getSettings, type MarketsCache, marketsItem } from '@/core/store';
import type { Language } from '@/i18n';
import { languageOf } from './context';

const RED = '#C42B2E';
const GREEN = '#0A7049';
const BLUE = '#0F5FC4';

export const BADGE_COLORS: Record<UpDownStyle, { up: string; down: string }> = {
  'red-green': { up: RED, down: GREEN },
  'green-red': { up: GREEN, down: RED },
  'red-blue': { up: RED, down: BLUE },
};

export interface Badge {
  text: string;
  color: string;
  /** 鼠标停在图标上时显示的文字 */
  title: string;
}

/** 算出工具栏图标上要显示什么。没有固定的币或者还没拿到价格时返回 null */
export function badgeFor(settings: Settings, cache: MarketsCache | null, lang: Language): Badge | null {
  const coin = settings.pinned ? cache?.coins[settings.pinned] : undefined;
  if (!coin || coin.price == null || !cache) return null;
  const change = coin.change24h ?? 0;
  const colors = BADGE_COLORS[effectiveUpDown(settings, lang)];
  const value = settings.badge === 'change' ? change : coin.price;
  return {
    text: formatBadge(value, settings.badge),
    color: change >= 0 ? colors.up : colors.down,
    title: `${coin.name}  ${formatPrice(coin.price, cache.currency, lang)}  ${formatChange(coin.change24h)}`,
  };
}

export async function updateBadge(): Promise<void> {
  const settings = await getSettings();
  const badge = badgeFor(settings, await marketsItem.getValue(), languageOf(settings));
  await browser.action.setBadgeText({ text: badge?.text ?? '' });
  await browser.action.setTitle({ title: badge?.title ?? browser.i18n.getMessage('extName') });
  if (badge) {
    await browser.action.setBadgeBackgroundColor({ color: badge.color });
    await browser.action.setBadgeTextColor?.({ color: '#FFFFFF' });
  }
}
