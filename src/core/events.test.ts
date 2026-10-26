import { describe, expect, it } from 'vitest';
import { EVENTS, isAbout, type MarketEvent, newsAbout, pickEventNews, recentEvents, upcomingEvents } from './events';
import type { NewsItem } from './news';
import { EVENT_KINDS, easternToUtc, SCHEDULE, scheduleEndsAt } from './schedule';

const MINUTE = 60_000;

describe('easternToUtc：美国东部时间换成时间戳', () => {
  it.each([
    ['夏令时：美联储 10 月 28 日下午 2 点', '2026-10-28', '14:00', Date.UTC(2026, 9, 28, 18, 0)],
    ['11 月 1 日换回冬令时以后', '2026-11-06', '08:30', Date.UTC(2026, 10, 6, 13, 30)],
    ['冬令时：美联储 12 月 9 日下午 2 点', '2026-12-09', '14:00', Date.UTC(2026, 11, 9, 19, 0)],
    ['2027 年 3 月 14 日开始夏令时之前', '2027-03-10', '08:30', Date.UTC(2027, 2, 10, 13, 30)],
    ['2027 年 3 月 14 日开始夏令时之后', '2027-03-17', '14:00', Date.UTC(2027, 2, 17, 18, 0)],
  ])('%s', (_, date, time, expected) => {
    expect(easternToUtc(date, time)).toBe(expected);
  });
});

describe('SCHEDULE：抄下来的日期', () => {
  const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

  it.each(EVENT_KINDS)('%s 的日期格式正确、从早到晚、没有重复', (kind) => {
    const dates = SCHEDULE[kind];
    for (const d of dates) expect(Number.isNaN(Date.parse(d)), d).toBe(false);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('美联储都在星期三公布，非农都在星期五公布（防止抄错）', () => {
    for (const d of SCHEDULE.fed) expect(weekday(d), d).toBe(3);
    for (const d of SCHEDULE.jobs) expect(weekday(d), d).toBe(5);
  });

  it('日程写到 2027 年 12 月', () => {
    expect(new Date(scheduleEndsAt()).toISOString().slice(0, 7)).toBe('2027-12');
  });
});

describe('哪些还没公布、哪些最近公布了', () => {
  const now = Date.UTC(2026, 9, 26, 9, 0);

  it('还没公布的从近到远：下一件是 10 月 28 日的美联储决议', () => {
    const next = upcomingEvents(now).slice(0, 4);
    expect(next.map((e) => e.id)).toEqual(['fed-2026-10-28', 'pce-2026-10-29', 'gdp-2026-10-29', 'jobs-2026-11-06']);
  });

  it('最近 7 天已经公布的从近到远；更早的不算', () => {
    expect(recentEvents(now).map((e) => e.id)).toEqual([]);
    expect(recentEvents(Date.UTC(2026, 9, 20)).map((e) => e.id)).toEqual(['cpi-2026-10-14']);
    expect(recentEvents(Date.UTC(2026, 9, 30)).map((e) => e.id)).toEqual([
      'pce-2026-10-29',
      'gdp-2026-10-29',
      'fed-2026-10-28',
    ]);
  });

  it('日程用完以后没有还没公布的', () => {
    expect(upcomingEvents(scheduleEndsAt())).toEqual([]);
  });

  it('每件事都有唯一的 id', () => {
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
  });
});

// 标题是编的，写法照着快讯网站
const cpi: MarketEvent = { id: 'cpi-2026-10-14', kind: 'cpi', at: easternToUtc('2026-10-14', '08:30') };
const item = (title: string, minutesAfter: number, source: NewsItem['source'] = 'odaily'): NewsItem => ({
  id: `${title}-${minutesAfter}`,
  title,
  url: `https://www.odaily.news/zh-CN/newsflash/${minutesAfter}`,
  source,
  publishedAt: cpi.at + minutesAfter * MINUTE,
});

describe('把快讯挂到日程上的事', () => {
  const items = [
    item('机构：美国9月CPI料加速', -5 * 60),
    item('美国9月CPI同比上涨3.7%，高于预期', 0),
    item('美国核心CPI年率创新高', 1),
    item('美国通胀数据高于预期，市场加大加息押注', 2),
    item('某交易平台上线新币', 3),
    item('Bitwise：比特币在通胀数据超预期后仅跌1%', 46),
    item('美国通胀回落', 25 * 60),
  ];

  it('只认公布前 5 分钟到公布后一天之内、标题里说到这件事的', () => {
    expect(items.filter((n) => isAbout(n, cpi)).map((n) => n.title)).toEqual([
      '美国9月CPI同比上涨3.7%，高于预期',
      '美国核心CPI年率创新高',
      '美国通胀数据高于预期，市场加大加息押注',
      'Bitwise：比特币在通胀数据超预期后仅跌1%',
    ]);
  });

  it('按时间从早到晚，最多 4 条', () => {
    const more = [...items, item('美国CPI分项：住房继续上涨', 50)];
    expect(newsAbout(cpi, more).map((n) => n.title)).toEqual([
      '美国9月CPI同比上涨3.7%，高于预期',
      '美国核心CPI年率创新高',
      '美国通胀数据高于预期，市场加大加息押注',
      'Bitwise：比特币在通胀数据超预期后仅跌1%',
    ]);
  });

  it('日文、韩文、英文的标题也认得出', () => {
    expect(isAbout(item('米国の9月CPIは予想を上回った', 0), cpi)).toBe(true);
    expect(isAbout(item('미국 9월 소비자물가 예상 상회', 0), cpi)).toBe(true);
    expect(isAbout(item('Bitcoin dips as US inflation runs hot', 10, 'decrypt'), cpi)).toBe(true);
  });

  it('后台只留下和日程上某件事有关的', () => {
    expect(pickEventNews(items, [cpi]).map((n) => n.title)).toHaveLength(4);
    expect(pickEventNews([item('美联储维持利率不变', 0)], [cpi])).toEqual([]);
  });
});
