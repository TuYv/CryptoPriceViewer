import type { NewsItem } from './news';
import { EVENT_KINDS, type EventKind, easternToUtc, RELEASE_TIME, SCHEDULE } from './schedule';

export type { EventKind } from './schedule';

/** 日程上的一件事：什么事、什么时候公布 */
export interface MarketEvent {
  id: string;
  kind: EventKind;
  at: number;
}

export const EVENTS: MarketEvent[] = EVENT_KINDS.flatMap((kind) =>
  SCHEDULE[kind].map((date) => ({ id: `${kind}-${date}`, kind, at: easternToUtc(date, RELEASE_TIME[kind]) })),
).sort((a, b) => a.at - b.at);

const DAY_MS = 86_400_000;

/** 还没公布的，从近到远 */
export function upcomingEvents(now: number, events = EVENTS): MarketEvent[] {
  return events.filter((e) => e.at > now);
}

/** 最近几天已经公布的，从近到远。同一时间公布的几件事，顺序和还没公布时一样 */
export function recentEvents(now: number, days = 7, events = EVENTS): MarketEvent[] {
  return events.filter((e) => e.at <= now && now - e.at < days * DAY_MS).sort((a, b) => b.at - a.at);
}

/** 官方公布结果的页面 */
export const OFFICIAL_URL: Record<EventKind, string> = {
  fed: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  cpi: 'https://www.bls.gov/news.release/cpi.nr0.htm',
  jobs: 'https://www.bls.gov/news.release/empsit.nr0.htm',
  pce: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index',
  gdp: 'https://www.bea.gov/data/gdp/gross-domestic-product',
};

/** 日期用完时给用户看的官方日程 */
export const OFFICIAL_SCHEDULES = {
  fed: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  bls: 'https://www.bls.gov/schedule/news_release/',
  bea: 'https://www.bea.gov/news/schedule',
} as const;

/**
 * 标题里有这些词，就算在说这件事。快讯有中日韩三种语言，Decrypt 是英文。
 * 只看公布后一天之内的快讯，所以“通胀”“就业”这种宽一点的词也不容易认错
 */
const KEYWORDS: Record<EventKind, RegExp> = {
  fed: /美联储|联储|FOMC|议息|FRB|連銀|연준|\bFed\b|Federal Reserve/i,
  cpi: /CPI|消费者物价|消費者物価|소비자물가|通胀|インフレ|인플레이션|consumer price|inflation/i,
  jobs: /非农|失业率|就业|雇用統計|非農業|失業率|비농업|고용|실업률|payroll|jobs report|unemployment/i,
  pce: /PCE/i,
  gdp: /GDP|国内生产总值|国内総生産|국내총생산/i,
};

/** 公布前 5 分钟（快讯网站的时间可能差一点）到公布后一天 */
const BEFORE_MS = 5 * 60_000;
const AFTER_MS = DAY_MS;

export function isAbout(item: NewsItem, event: MarketEvent): boolean {
  return (
    item.publishedAt >= event.at - BEFORE_MS &&
    item.publishedAt <= event.at + AFTER_MS &&
    KEYWORDS[event.kind].test(item.title)
  );
}

/** 公布后最早的几条相关快讯：最早的通常是实际数字和预期，后面是市场的反应 */
export function newsAbout(event: MarketEvent, items: NewsItem[], max = 4): NewsItem[] {
  return items
    .filter((n) => isAbout(n, event))
    .sort((a, b) => a.publishedAt - b.publishedAt)
    .slice(0, max);
}

/** 从新闻里挑出和日程上某件事有关的，后台另外存起来，免得被新的新闻挤掉 */
export function pickEventNews(items: NewsItem[], events = EVENTS): NewsItem[] {
  return items.filter((n) => events.some((e) => isAbout(n, e)));
}
