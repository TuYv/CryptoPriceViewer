/**
 * 大事日程的日期，照抄三个官网公布的日程。这个文件不引用别的文件，GitHub 上每月的检查脚本直接读它。
 *
 * - 美联储利率决议：https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
 *   写的是两天会议的第二天，美国东部时间下午 2:00 公布
 * - CPI：https://www.bls.gov/schedule/news_release/cpi.htm
 * - 非农（The Employment Situation）：https://www.bls.gov/schedule/news_release/empsit.htm
 * - PCE（Personal Income and Outlays）和 GDP 的第一次估算（Advance Estimate）：
 *   https://www.bea.gov/news/schedule 和 https://www.bea.gov/news/schedule/next-year
 *
 * 官网公布下一年的日程后，把新日期接在后面，发一个新版本。
 * 剩下的日期不到 90 天时，GitHub 上每月的检查会开一个 issue 提醒。
 */

export const EVENT_KINDS = ['fed', 'cpi', 'jobs', 'pce', 'gdp'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** 每种事件在美国东部时间几点公布 */
export const RELEASE_TIME: Record<EventKind, string> = {
  fed: '14:00',
  cpi: '08:30',
  jobs: '08:30',
  pce: '08:30',
  gdp: '08:30',
};

/** 公布日期（美国东部时间），2026 年 10 月起 */
export const SCHEDULE: Record<EventKind, string[]> = {
  fed: [
    '2026-10-28',
    '2026-12-09',
    '2027-01-27',
    '2027-03-17',
    '2027-04-28',
    '2027-06-09',
    '2027-07-28',
    '2027-09-15',
    '2027-10-27',
    '2027-12-08',
  ],
  cpi: [
    '2026-10-14',
    '2026-11-10',
    '2026-12-10',
    '2027-01-13',
    '2027-02-11',
    '2027-03-10',
    '2027-04-13',
    '2027-05-12',
    '2027-06-10',
    '2027-07-14',
    '2027-08-11',
    '2027-09-14',
    '2027-10-14',
    '2027-11-10',
    '2027-12-10',
  ],
  jobs: [
    '2026-10-02',
    '2026-11-06',
    '2026-12-04',
    '2027-01-08',
    '2027-02-05',
    '2027-03-05',
    '2027-04-02',
    '2027-05-07',
    '2027-06-04',
    '2027-07-02',
    '2027-08-06',
    '2027-09-03',
    '2027-10-08',
    '2027-11-05',
    '2027-12-03',
  ],
  pce: [
    '2026-10-29',
    '2026-11-25',
    '2026-12-23',
    '2027-01-28',
    '2027-02-25',
    '2027-03-31',
    '2027-04-29',
    '2027-05-27',
    '2027-06-25',
    '2027-07-29',
    '2027-08-25',
    '2027-09-30',
    '2027-10-28',
    '2027-11-24',
    '2027-12-22',
  ],
  gdp: ['2026-10-29', '2027-01-28', '2027-04-29', '2027-07-29', '2027-10-28'],
};

/** 某年某月（从 0 开始）的第 n 个星期日是几号 */
function nthSunday(year: number, month: number, n: number): number {
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return 1 + ((7 - firstDay) % 7) + (n - 1) * 7;
}

/** 美国东部时间换成时间戳。夏令时从三月第二个星期日凌晨 2 点开始，到十一月第一个星期日凌晨 2 点结束 */
export function easternToUtc(date: string, time: string): number {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  // 先把美东的钟点当成 UTC 算出一个数，再拿它和夏令时起止的钟点比
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const summer =
    wall >= Date.UTC(year, 2, nthSunday(year, 2, 2), 2) && wall < Date.UTC(year, 10, nthSunday(year, 10, 1), 2);
  return wall + (summer ? 4 : 5) * 3_600_000;
}

/** 日程上最后一件事公布的时间 */
export function scheduleEndsAt(): number {
  return Math.max(...EVENT_KINDS.flatMap((kind) => SCHEDULE[kind].map((d) => easternToUtc(d, RELEASE_TIME[kind]))));
}
