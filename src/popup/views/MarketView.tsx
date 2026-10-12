import { type CSSProperties, type DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { MarketCoin, SearchCoin } from '@/core/coingecko';
import { type CoinMeta, coinColor, KNOWN_COINS, POPULAR_COINS } from '@/core/coins';
import { formatAgo, formatClock, formatIn } from '@/core/format';
import { ask } from '@/core/messages';
import { MAX_COINS } from '@/core/settings';
import { apiKeyItem, coinMetaItem, marketsItem, marketsProblemItem } from '@/core/store';
import { CoinIcon } from '../components/CoinIcon';
import { CoinRow } from '../components/CoinRow';
import { SearchBox } from '../components/SearchBox';
import { Tile } from '../components/Tile';
import { type TileAction, TileMenu } from '../components/TileMenu';
import { Segmented, TabBar } from '../components/ui';
import { usePopup } from '../context';
import { useNow, useStorageItem } from '../hooks';
import { AlertIcon, ListIcon, OfflineIcon, PlusIcon, RefreshIcon, TilesIcon } from '../icons';

interface Removed {
  id: string;
  name: string;
  index: number;
  wasPinned: boolean;
}

/** 价格还没回来时，用已知的名字和图标先撑起色块 */
function placeholder(id: string, meta: Record<string, CoinMeta> | undefined): MarketCoin | undefined {
  const m = meta?.[id] ?? KNOWN_COINS[id];
  if (!m) return undefined;
  return {
    id,
    ...m,
    price: null,
    change24h: null,
    change7d: null,
    marketCap: null,
    volume: null,
    circulating: null,
    totalSupply: null,
    high24h: null,
    low24h: null,
    ath: null,
    athDate: null,
    rank: null,
    spark: [],
  };
}

export function MarketView() {
  const { t, lang, settings, update, go } = usePopup();
  const markets = useStorageItem(marketsItem);
  const problem = useStorageItem(marketsProblemItem);
  const apiKey = useStorageItem(apiKeyItem);
  const meta = useStorageItem(coinMetaItem);
  const now = useNow(1000);
  const [refreshing, setRefreshing] = useState(false);
  const [menu, setMenu] = useState<{ id: string; anchor: HTMLButtonElement } | null>(null);
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const dragId = useRef<string | null>(null);

  // 打开弹窗时让后台看一下要不要刷新，缓存还新鲜就不会请求
  useEffect(() => {
    void ask('refresh', { force: false });
  }, []);

  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), 5000);
    return () => clearTimeout(timer);
  }, [removed]);

  const closeMenu = useCallback(() => setMenu(null), []);

  if (markets === undefined || problem === undefined) return <div className="c-screen" />;

  const cache = markets?.currency === settings.currency ? markets : null;
  const order = dragOrder ?? settings.coins;
  const pinned = settings.pinned && order.includes(settings.pinned) ? settings.pinned : null;
  const others = order.filter((id) => id !== pinned);
  const loading = !cache && !problem;
  const stale = !!cache && !!problem && problem.at >= cache.fetchedAt;
  const coinOf = (id: string) => cache?.coins[id] ?? placeholder(id, meta);
  const nameOf = (id: string) => coinOf(id)?.name ?? id;

  const refresh = async () => {
    setRefreshing(true);
    await ask('refresh', { force: true });
    setRefreshing(false);
  };

  const remove = (id: string) => {
    setRemoved({ id, name: nameOf(id), index: settings.coins.indexOf(id), wasPinned: settings.pinned === id });
    void update((s) => ({ ...s, coins: s.coins.filter((c) => c !== id), pinned: s.pinned === id ? null : s.pinned }));
  };

  const undoRemove = () => {
    if (!removed) return;
    const { id, index, wasPinned } = removed;
    setRemoved(null);
    void update((s) => {
      if (s.coins.includes(id)) return s;
      const coins = [...s.coins];
      coins.splice(Math.min(Math.max(index, 0), coins.length), 0, id);
      return { ...s, coins, pinned: wasPinned ? id : s.pinned };
    });
  };

  const onAction = (action: TileAction) => {
    const id = menu?.id;
    setMenu(null);
    if (!id) return;
    if (action === 'pin') void update((s) => ({ ...s, pinned: id }));
    if (action === 'unpin') void update((s) => ({ ...s, pinned: null }));
    if (action === 'detail') go({ name: 'detail', id });
    if (action === 'moveFirst') void update((s) => ({ ...s, coins: [id, ...s.coins.filter((c) => c !== id)] }));
    if (action === 'remove') remove(id);
  };

  const addCoin = (id: string, info?: CoinMeta) => {
    if (info) void coinMetaItem.getValue().then((m) => coinMetaItem.setValue({ ...m, [id]: info }));
    void update((s) => (s.coins.includes(id) || s.coins.length >= MAX_COINS ? s : { ...s, coins: [...s.coins, id] }));
  };
  const onSearchAdd = (coin: SearchCoin) =>
    addCoin(coin.id, { symbol: coin.symbol, name: coin.name, image: coin.image });

  const onDragStart = (id: string, e: DragEvent) => {
    dragId.current = id;
    setDragOrder(settings.coins);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragOver = (overId: string, e: DragEvent) => {
    const from = dragId.current;
    if (!from) return;
    e.preventDefault();
    if (overId === from) return;
    setDragOrder((current) => {
      const list = [...(current ?? settings.coins)];
      const to = list.indexOf(overId);
      list.splice(list.indexOf(from), 1);
      list.splice(to, 0, from);
      return list;
    });
  };
  const onDragEnd = () => {
    const next = dragOrder;
    dragId.current = null;
    setDragOrder(null);
    if (next && next.join() !== settings.coins.join()) void update((s) => ({ ...s, coins: next }));
  };

  const status = loading
    ? t('market.loading')
    : cache
      ? stale
        ? t('market.pricesAt', { time: formatClock(cache.fetchedAt, lang) })
        : now - cache.fetchedAt < 10_000
          ? t('market.updatedJustNow')
          : t('market.updatedAgo', { ago: formatAgo(cache.fetchedAt, now, lang) })
      : '';

  let banner = null;
  if (problem && (stale || !cache) && settings.coins.length > 0) {
    const time = cache ? formatClock(cache.fetchedAt, lang) : '';
    const text = !cache
      ? problem.kind === 'rate-limited'
        ? t('common.limited')
        : t('banner.noData')
      : problem.kind === 'rate-limited'
        ? t('banner.limited', { time, retry: formatIn(problem.retryAt, now, lang) })
        : problem.kind === 'offline'
          ? t('banner.offline', { time })
          : t('banner.failed', { time });
    banner = (
      <div className={`c-banner${problem.kind === 'offline' ? ' c-banner--neutral' : ''}`} role="status">
        {problem.kind === 'offline' ? <OfflineIcon /> : <AlertIcon />}
        <p>
          {text}
          {problem.kind === 'rate-limited' && !apiKey && (
            <button type="button" className="c-banner-link" onClick={() => go({ name: 'settings' })}>
              {t('banner.limitedKey')}
            </button>
          )}
        </p>
      </div>
    );
  }

  const tileProps = (id: string) => ({
    id,
    coin: coinOf(id),
    // 刚加进来、还没请求过的币先显示占位；请求过但 CoinGecko 没有数据的显示破折号
    loading: loading || (!!cache && !cache.ids.includes(id) && !problem),
    stale,
    menuOpen: menu?.id === id,
    onOpen: (coinId: string) => go({ name: 'detail', id: coinId }),
    onMore: (coinId: string, anchor: HTMLButtonElement) =>
      setMenu((m) => (m?.id === coinId ? null : { id: coinId, anchor })),
  });

  const addButton = settings.coins.length < MAX_COINS && (
    <button
      type="button"
      className="c-add"
      onClick={() => document.querySelector<HTMLInputElement>('.c-search input')?.focus()}
    >
      <PlusIcon />
      <span>{t('tile.add')}</span>
    </button>
  );

  return (
    <div className="c-screen">
      <header className="c-head">
        <h1>{t('tab.market')}</h1>
        <span className={`c-status${stale ? ' is-stale' : ''}`} aria-live="polite">
          {settings.coins.length > 0 ? status : ''}
        </span>
        {settings.coins.length > 0 && (
          <Segmented
            label={t('market.layout')}
            value={settings.layout}
            options={[
              { value: 'tiles', label: t('market.layoutTiles'), icon: <TilesIcon /> },
              { value: 'list', label: t('market.layoutList'), icon: <ListIcon /> },
            ]}
            onChange={(layout) => void update((s) => ({ ...s, layout }))}
          />
        )}
        <button
          type="button"
          className={`c-icon-btn${refreshing || loading ? ' is-loading' : ''}`}
          aria-label={t('market.refresh')}
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshIcon />
        </button>
      </header>
      <SearchBox onAdd={onSearchAdd} />
      {banner}
      <div className="c-scroll">
        {settings.coins.length === 0 ? (
          <div className="c-emptybox">
            <p className="c-empty-title">{t('empty.title')}</p>
            <p className="c-empty-text">{t('empty.text')}</p>
            <div className="c-quick">
              {POPULAR_COINS.map((id) => {
                const known = KNOWN_COINS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    style={{ '--coin': coinColor(id) } as CSSProperties}
                    aria-label={t('empty.add', { symbol: known?.symbol ?? id })}
                    onClick={() => addCoin(id)}
                  >
                    <CoinIcon src={known?.image} symbol={known?.symbol} size={24} />
                    {known?.symbol}
                    <PlusIcon width={13} height={13} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : settings.layout === 'list' ? (
          <div className="c-list">
            {pinned && <CoinRow {...tileProps(pinned)} pinned />}
            {others.map((id) => (
              <CoinRow
                key={id}
                {...tileProps(id)}
                dragging={dragId.current === id && !!dragOrder}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
              />
            ))}
            {addButton}
          </div>
        ) : (
          <>
            {pinned && <Tile {...tileProps(pinned)} wide pinned />}
            <div className="c-grid">
              {others.map((id) => (
                <Tile
                  key={id}
                  {...tileProps(id)}
                  dragging={dragId.current === id && !!dragOrder}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragEnd={onDragEnd}
                />
              ))}
              {addButton}
            </div>
          </>
        )}
      </div>
      {menu && (
        <TileMenu
          anchor={menu.anchor}
          pinned={menu.id === settings.pinned}
          first={settings.coins[0] === menu.id}
          onAction={onAction}
          onClose={closeMenu}
        />
      )}
      {removed && (
        <div className="c-toast" role="status">
          <span>{t('toast.removed', { name: removed.name })}</span>
          <button type="button" onClick={undoRemove}>
            {t('toast.undo')}
          </button>
        </div>
      )}
      <TabBar current="market" />
    </div>
  );
}
