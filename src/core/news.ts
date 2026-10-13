import type { Language } from '@/i18n';
import type { NewsSourceId } from './settings';

export interface NewsItem {
  /** 用原文链接当 id */
  id: string;
  title: string;
  url: string;
  source: NewsSourceId;
  publishedAt: number;
}

export interface NewsSource {
  id: NewsSourceId;
  name: string;
  /** 访问这个网站的权限 */
  origin: string;
  /**
   * 网站允许任何网页直接读取它的新闻（返回了允许所有来源读取的 CORS 头），扩展不用申请权限就能读。
   * 网站以后不再允许时，扩展会发现并改为请用户同意访问
   */
  open: boolean;
  /** 这个来源提供哪些语言的新闻 */
  languages: Language[];
  feedUrl(lang: Language): string;
  parse(body: string, lang: Language): NewsItem[];
}

const ODAILY_LANG: Partial<Record<Language, string>> = { zh: 'zh-cn', ja: 'ja', ko: 'ko' };
const ODAILY_PATH: Partial<Record<Language, string>> = { zh: '/zh-CN/', ja: '/ja/', ko: '/ko/' };

export const NEWS_SOURCES: Record<NewsSourceId, NewsSource> = {
  panews: {
    id: 'panews',
    name: 'PANews',
    origin: 'https://www.panewslab.com/*',
    open: true,
    languages: ['zh', 'ja', 'ko'],
    feedUrl: (lang) => `https://www.panewslab.com/rss.xml?lang=${lang}&type=NEWS`,
    parse: (body) => parseRss(body, 'panews'),
  },
  odaily: {
    id: 'odaily',
    name: 'Odaily',
    origin: 'https://api.odaily.news/*',
    open: true,
    languages: ['zh', 'ja', 'ko'],
    feedUrl: (lang) => `https://api.odaily.news/api/v1/newsflash?page=1&size=30&lang=${ODAILY_LANG[lang] ?? 'zh-cn'}`,
    parse: (body, lang) => parseOdaily(body, lang),
  },
  decrypt: {
    id: 'decrypt',
    name: 'Decrypt',
    origin: 'https://decrypt.co/*',
    open: false,
    languages: ['en'],
    feedUrl: () => 'https://decrypt.co/feed',
    parse: (body) => parseRss(body, 'decrypt'),
  },
};

/**
 * 当前语言要抓哪些来源，以及每个来源用哪种语言抓。
 * 中日韩用户：PANews、Odaily 用当前语言，Decrypt 是英文。英文用户只有 Decrypt。
 */
export function feedsFor(lang: Language, enabled: NewsSourceId[]): { source: NewsSource; lang: Language }[] {
  return enabled
    .map((id) => NEWS_SOURCES[id])
    .flatMap((source) =>
      source.languages.includes(lang)
        ? [{ source, lang }]
        : source.languages.includes('en')
          ? [{ source, lang: 'en' as Language }]
          : [],
    );
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeOnce(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1]?.toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

/** 解码 HTML 实体。有的来源会转义两次（&amp;#039;），所以最多解两遍 */
export function decodeEntities(s: string): string {
  const once = decodeOnce(s);
  return once === s ? once : decodeOnce(once);
}

const cleanText = (s: string) =>
  decodeEntities(s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1'))
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** 只接受 http 和 https 链接，防止新闻里混进 javascript: 之类的地址 */
export function safeUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? (m[1] ?? '') : '';
}

/** 后台脚本里没有 DOMParser，用正则读出 RSS 里每条的标题、链接和时间 */
export function parseRss(xml: string, source: NewsSourceId): NewsItem[] {
  const items: NewsItem[] = [];
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = m[1] ?? '';
    const title = cleanText(tag(block, 'title'));
    const url = safeUrl(cleanText(tag(block, 'link')));
    const publishedAt = Date.parse(cleanText(tag(block, 'pubDate')) || cleanText(tag(block, 'dc:date')));
    if (title && url && Number.isFinite(publishedAt)) items.push({ id: url, title, url, source, publishedAt });
  }
  return items;
}

/** Odaily 快讯接口：{ data: { list: [{ title, link, publishTimestamp }] } }。链接默认是中文页，按语言换路径 */
export function parseOdaily(body: string, lang: Language): NewsItem[] {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return [];
  }
  const list = (json as { data?: { list?: unknown } })?.data?.list;
  if (!Array.isArray(list)) return [];
  const path = ODAILY_PATH[lang] ?? '/zh-CN/';
  return list.flatMap((n) => {
    const title = typeof n?.title === 'string' ? cleanText(n.title) : '';
    const link = typeof n?.link === 'string' ? safeUrl(n.link.replace('/zh-CN/', path)) : null;
    const publishedAt = Number(n?.publishTimestamp);
    return title && link && Number.isFinite(publishedAt) && publishedAt > 0
      ? [{ id: link, title, url: link, source: 'odaily' as const, publishedAt }]
      : [];
  });
}

/** 标题里的词：英文单词和数字整个算一个，中日韩文字每两个相邻的字算一个 */
function tokens(title: string): { words: Set<string>; numbers: Set<string> } {
  const words = new Set<string>();
  const numbers = new Set<string>();
  const lower = title.toLowerCase();
  for (const m of lower.matchAll(/[a-z][a-z0-9]*|\d+(?:\.\d+)?/g)) {
    if (/^\d/.test(m[0])) numbers.add(m[0]);
    else if (m[0].length >= 2) words.add(m[0]);
  }
  for (const m of lower.matchAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu)) {
    const run = [...m[0]];
    for (let i = 0; i + 1 < run.length; i++) words.add(`${run[i]}${run[i + 1]}`);
  }
  return { words, numbers };
}

const SAME_STORY_WINDOW_MS = 3 * 3600_000;

/**
 * 判断两条新闻是不是在说同一件事：发布时间相差 3 小时以内，
 * 都带数字时至少有一个数字相同，而且标题里的词有六成以上重合。
 */
export function isSameStory(a: NewsItem, b: NewsItem): boolean {
  if (a.url === b.url) return true;
  if (Math.abs(a.publishedAt - b.publishedAt) > SAME_STORY_WINDOW_MS) return false;
  const ta = tokens(a.title);
  const tb = tokens(b.title);
  if (ta.numbers.size && tb.numbers.size && ![...ta.numbers].some((n) => tb.numbers.has(n))) return false;
  const all = (t: typeof ta) => new Set([...t.words, ...t.numbers]);
  const wa = all(ta);
  const wb = all(tb);
  const smaller = Math.min(wa.size, wb.size);
  if (smaller === 0) return false;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / smaller >= 0.6;
}

/** 合并几个来源的新闻：去掉重复的（同一件事只留最早发的那条），按时间从新到旧，最多留 max 条 */
export function mergeNews(lists: NewsItem[][], max = 80): NewsItem[] {
  const kept: NewsItem[] = [];
  for (const item of lists.flat().sort((a, b) => a.publishedAt - b.publishedAt)) {
    if (!kept.some((k) => isSameStory(k, item))) kept.push(item);
  }
  return kept.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, max);
}
