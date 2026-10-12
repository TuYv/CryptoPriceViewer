import { type ChartDays, type ChartPoint, getChart } from '@/core/coingecko';
import { chartsItem, getSettings } from '@/core/store';
import { gate, requestOptions } from './context';

/** 各个时间范围的图表缓存多久：1 天的 5 分钟，1 年的 6 小时 */
const TTL: Record<ChartDays, number> = {
  '1': 5 * 60_000,
  '7': 15 * 60_000,
  '30': 60 * 60_000,
  '90': 3 * 3600_000,
  '365': 6 * 3600_000,
};
const MAX_ENTRIES = 40;

/** 取图表数据：缓存新鲜就用缓存；请求失败但有旧缓存时先用旧的 */
export async function getChartCached(id: string, days: ChartDays): Promise<ChartPoint[]> {
  const { currency } = await getSettings();
  const key = `${id}:${currency}:${days}`;
  const cache = await chartsItem.getValue();
  const hit = cache[key];
  if (hit && Date.now() - hit.fetchedAt < TTL[days]) return hit.points;
  try {
    const points = await gate.run(async () => getChart(id, currency, days, await requestOptions()), 4000);
    const next = { ...(await chartsItem.getValue()), [key]: { fetchedAt: Date.now(), points } };
    const newest = Object.entries(next)
      .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
      .slice(0, MAX_ENTRIES);
    await chartsItem.setValue(Object.fromEntries(newest));
    return points;
  } catch (e) {
    if (hit) return hit.points;
    throw e;
  }
}
