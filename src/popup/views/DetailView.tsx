import { type CSSProperties, useEffect, useState } from 'react';
import { CHART_DAYS, type ChartDays, type ChartPoint } from '@/core/coingecko';
import { coinColor, KNOWN_COINS, mentionedCoins } from '@/core/coins';
import { formatChange, formatClock, formatCompactMoney, formatCompactNumber, formatPrice } from '@/core/format';
import { ask, type Problem } from '@/core/messages';
import { coinMetaItem, marketsItem, newsItem } from '@/core/store';
import type { MessageKey } from '@/i18n';
import { CoinIcon } from '../components/CoinIcon';
import { PriceChart } from '../components/PriceChart';
import { usePopup } from '../context';
import { useStorageItem } from '../hooks';
import { BackIcon, ExternalIcon, PinIcon } from '../icons';

/** 取回来的图表带着 key（币、时间范围、货币、第几次重试），用来认出是不是当前这一次请求的结果 */
type ChartState =
  | { kind: 'loading' }
  | { kind: 'ok'; key: string; points: ChartPoint[] }
  | { kind: 'failed'; key: string; problem: Problem };

const COINGECKO_LANG = { zh: 'zh', en: 'en', ja: 'ja', ko: 'ko' } as const;
const sign = (v: number | null | undefined) => ((v ?? 0) >= 0 ? 'up' : 'down');

export function DetailView({ id }: { id: string }) {
  const { t, lang, settings, update, go } = usePopup();
  const markets = useStorageItem(marketsItem);
  const meta = useStorageItem(coinMetaItem);
  const news = useStorageItem(newsItem);
  const [days, setDays] = useState<ChartDays>('7');
  const [loaded, setChart] = useState<ChartState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const currency = settings.currency;
  const chartKey = `${id}|${days}|${currency}|${attempt}`;

  // biome-ignore lint/correctness/useExhaustiveDependencies: chartKey 已经包含了币、时间范围、货币和重试次数
  useEffect(() => {
    let alive = true;
    setChart({ kind: 'loading' });
    void ask('chart', { id, days }).then((res) => {
      if (!alive) return;
      setChart(
        res.ok
          ? { kind: 'ok', key: chartKey, points: res.data }
          : { kind: 'failed', key: chartKey, problem: res.problem },
      );
    });
    return () => {
      alive = false;
    };
  }, [chartKey]);
  // 刚换了时间范围或货币、新的请求还没发出去时，手上还是上一次的结果，当作正在加载，免得把 7 天的涨跌幅标成 30 天
  const chart: ChartState = loaded.kind !== 'loading' && loaded.key !== chartKey ? { kind: 'loading' } : loaded;

  const coin = markets?.currency === currency ? markets.coins[id] : undefined;
  const info = coin ?? meta?.[id] ?? KNOWN_COINS[id];
  const name = info?.name ?? id;
  const pinned = settings.pinned === id;
  const rangeLabel = t(`range.label.${days}` as MessageKey);
  const points = chart.kind === 'ok' ? chart.points : [];
  const rangeChange = points.length > 1 ? ((points.at(-1)?.[1] ?? 0) / (points[0]?.[1] ?? 1) - 1) * 100 : null;
  const fromAth = coin?.price && coin.ath ? (coin.price / coin.ath - 1) * 100 : null;

  const related =
    news && news.lang === lang && info
      ? news.items
          .filter((n) => mentionedCoins(n.title, [{ id, symbol: info.symbol, name: info.name }]).length)
          .slice(0, 3)
      : [];

  return (
    <div className="c-screen c-detail" style={{ '--coin': coinColor(id) } as CSSProperties}>
      <header className="c-dhead">
        <button type="button" className="c-round" aria-label={t('common.back')} onClick={() => go({ name: 'market' })}>
          <BackIcon />
        </button>
        <span className="c-dtitle">
          <CoinIcon src={info?.image} symbol={info?.symbol} size={30} />
          <span>
            <b>{name}</b>
            <small>{info?.symbol}</small>
          </span>
        </span>
        <button
          type="button"
          className={`c-chip${pinned ? ' c-chip--on' : ''}`}
          aria-pressed={pinned}
          onClick={() => void update((s) => ({ ...s, pinned: pinned ? null : id }))}
        >
          <PinIcon filled={pinned} />
          {pinned ? t('detail.pinned') : t('detail.pin')}
        </button>
      </header>

      <div className="c-detail-scroll">
        <div className="c-dprice">
          <b>{formatPrice(coin?.price, currency, lang)}</b>
          {coin && <span className={`c-change ${sign(coin.change24h)}`}>{formatChange(coin.change24h)}</span>}
          <small>{t('detail.24h')}</small>
        </div>
        {markets?.ids.includes(id) && !coin && <p className="c-detail-note">{t('detail.notFound')}</p>}

        <div className="c-range-row">
          <div className="c-range" role="radiogroup" aria-label={rangeLabel}>
            {CHART_DAYS.map((d) => (
              // biome-ignore lint/a11y/useSemanticElements: 分段按钮
              <button key={d} type="button" role="radio" aria-checked={d === days} onClick={() => setDays(d)}>
                {t(`range.${d}` as MessageKey)}
              </button>
            ))}
          </div>
          {/* 紧挨着时间范围按钮，只显示涨跌幅；“近 7 天”这几个字留给读屏软件 */}
          {rangeChange != null && (
            <p className={`c-range-pct ${sign(rangeChange)}`}>
              <span className="sr-only">{rangeLabel} </span>
              {formatChange(rangeChange)}
            </p>
          )}
        </div>

        {chart.kind === 'ok' && points.length > 1 ? (
          <PriceChart
            points={points}
            days={days}
            currency={currency}
            lang={lang}
            label={t('chart.aria', { name, range: rangeLabel })}
            highLabel={t('chart.high')}
            lowLabel={t('chart.low')}
          />
        ) : (
          <div className="c-chart c-chart--msg">
            {chart.kind === 'loading' ? (
              <>
                <span className="c-skel c-skel--chart" />
                <span className="sr-only">{t('chart.loading')}</span>
              </>
            ) : (
              <p>
                {chart.kind === 'failed' && chart.problem === 'rate-limited' ? t('common.limited') : t('chart.failed')}
                <button type="button" className="c-link-btn" onClick={() => setAttempt((n) => n + 1)}>
                  {t('common.retry')}
                </button>
              </p>
            )}
          </div>
        )}

        <dl className="c-stats">
          <div>
            <dt>{t('stats.marketCap')}</dt>
            <dd>{formatCompactMoney(coin?.marketCap, currency, lang)}</dd>
          </div>
          <div>
            <dt>{t('stats.volume')}</dt>
            <dd>{formatCompactMoney(coin?.volume, currency, lang)}</dd>
          </div>
          <div>
            <dt>{t('stats.circulating')}</dt>
            <dd>
              {formatCompactNumber(coin?.circulating, lang)} {coin?.circulating ? coin.symbol : ''}
            </dd>
          </div>
          <div>
            <dt>{t('stats.ath')}</dt>
            <dd>
              {formatPrice(coin?.ath, currency, lang)}
              {fromAth != null && fromAth < 0 && (
                <small>{t('stats.belowAth', { pct: `${Math.abs(fromAth).toFixed(1)}%` })}</small>
              )}
            </dd>
          </div>
          {coin?.rank != null && (
            <div>
              <dt>{t('stats.rank')}</dt>
              <dd>{t('stats.rankValue', { rank: coin.rank })}</dd>
            </div>
          )}
        </dl>

        {related.length > 0 && (
          <section className="c-related">
            <h2>{t('detail.relatedNews')}</h2>
            {related.map((n) => (
              <a key={n.id} className="c-item" href={n.url} target="_blank" rel="noreferrer">
                <span className="c-item-meta">{formatClock(n.publishedAt, lang)}</span>
                <b>{n.title}</b>
              </a>
            ))}
          </section>
        )}

        <a
          className="c-link"
          href={`https://www.coingecko.com/${COINGECKO_LANG[lang]}/coins/${encodeURIComponent(id)}`}
          target="_blank"
          rel="noreferrer"
        >
          {t('detail.openCoinGecko')}
          <ExternalIcon />
        </a>
      </div>
    </div>
  );
}
