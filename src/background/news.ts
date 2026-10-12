import { browser } from '#imports';
import { feedsFor, mergeNews, type NewsItem, type NewsSource } from '@/core/news';
import type { NewsSourceId } from '@/core/settings';
import { getSettings, newsItem } from '@/core/store';
import { languageOf } from './context';

/** 20 分钟内抓过就不再抓 */
export const NEWS_FRESH_MS = 20 * 60_000;
/** 只保留 3 天以内的新闻 */
const KEEP_MS = 3 * 86_400_000;

export async function hasPermission(source: NewsSource): Promise<boolean> {
  return browser.permissions.contains({ origins: [source.origin] });
}

async function fetchText(url: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: 'application/rss+xml, application/json, */*' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      // 有些来源第一次连接经常失败，隔两秒再试一次
      if (attempt >= 1) throw e;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * 抓用户打开、并且已经同意访问的新闻来源，和缓存里同一种语言的新闻合并后写回缓存。
 * 某个来源没抓到时，它之前的新闻还留着。
 */
export async function refreshNews({ force }: { force: boolean }): Promise<void> {
  const settings = await getSettings();
  const lang = languageOf(settings);
  const feeds = [];
  for (const feed of feedsFor(lang, settings.newsSources)) {
    if (await hasPermission(feed.source)) feeds.push(feed);
  }
  if (feeds.length === 0) return;
  const cache = await newsItem.getValue();
  const now = Date.now();
  if (!force && cache && cache.lang === lang && now - cache.fetchedAt < NEWS_FRESH_MS) return;

  const failed: NewsSourceId[] = [];
  const lists = await Promise.all(
    feeds.map(async ({ source, lang: feedLang }) => {
      try {
        return source.parse(await fetchText(source.feedUrl(feedLang)), feedLang);
      } catch {
        failed.push(source.id);
        return [];
      }
    }),
  );
  const enabled = new Set(feeds.map((f) => f.source.id));
  const previous: NewsItem[] =
    cache && cache.lang === lang
      ? cache.items.filter((n) => enabled.has(n.source) && now - n.publishedAt < KEEP_MS)
      : [];
  await newsItem.setValue({ lang, fetchedAt: now, items: mergeNews([...lists, previous]), failed });
}

/** 用户关掉某个来源或者收回权限后，把它的新闻从缓存里去掉 */
export async function pruneNews(): Promise<void> {
  const cache = await newsItem.getValue();
  if (!cache) return;
  const settings = await getSettings();
  const allowed = new Set<NewsSourceId>();
  for (const { source } of feedsFor(cache.lang, settings.newsSources)) {
    if (await hasPermission(source)) allowed.add(source.id);
  }
  await newsItem.setValue({ ...cache, items: cache.items.filter((n) => allowed.has(n.source)) });
}
