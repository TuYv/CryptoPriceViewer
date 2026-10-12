import { checkApiKey, type SearchCoin, searchCoins } from '@/core/coingecko';
import { type Message, type RequestType, type Result, toFailure } from '@/core/messages';
import { getChartCached } from './charts';
import { gate, requestOptions } from './context';
import { refreshMarkets } from './markets';
import { refreshNews } from './news';

const SEARCH_TTL = 10 * 60_000;
const searchCache = new Map<string, { at: number; results: SearchCoin[] }>();

const TYPES: RequestType[] = ['refresh', 'search', 'chart', 'news', 'checkApiKey'];

export function isMessage(msg: unknown): msg is Message {
  return !!msg && typeof msg === 'object' && TYPES.includes((msg as { type: RequestType }).type);
}

async function search(query: string): Promise<SearchCoin[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hit = searchCache.get(q);
  if (hit && Date.now() - hit.at < SEARCH_TTL) return hit.results;
  const results = await gate.run(async () => searchCoins(q, await requestOptions()), 4000);
  searchCache.set(q, { at: Date.now(), results });
  if (searchCache.size > 50) searchCache.delete(searchCache.keys().next().value as string);
  return results;
}

export async function handleMessage(msg: Message): Promise<Result<unknown>> {
  try {
    switch (msg.type) {
      case 'refresh':
        await refreshMarkets({ force: msg.force });
        return { ok: true, data: null };
      case 'search':
        return { ok: true, data: await search(msg.query) };
      case 'chart':
        return { ok: true, data: await getChartCached(msg.id, msg.days) };
      case 'news':
        await refreshNews({ force: msg.force });
        return { ok: true, data: null };
      case 'checkApiKey':
        return { ok: true, data: await checkApiKey(msg.key) };
    }
  } catch (e) {
    return toFailure(e);
  }
}
