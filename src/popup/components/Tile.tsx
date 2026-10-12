import type { CSSProperties, DragEvent } from 'react';
import type { MarketCoin } from '@/core/coingecko';
import { coinColor } from '@/core/coins';
import { formatChange, formatPrice } from '@/core/format';
import { usePopup } from '../context';
import { MoreIcon, PinIcon } from '../icons';
import { Sparkline } from './Sparkline';

export interface TileProps {
  id: string;
  coin: MarketCoin | undefined;
  wide?: boolean;
  pinned?: boolean;
  /** 价格还没回来（第一次打开、刚换了货币） */
  loading?: boolean;
  /** 显示的是旧价格（被限速或断网） */
  stale?: boolean;
  menuOpen?: boolean;
  dragging?: boolean;
  onOpen: (id: string) => void;
  onMore: (id: string, button: HTMLButtonElement) => void;
  onDragStart?: (id: string, e: DragEvent) => void;
  onDragOver?: (id: string, e: DragEvent) => void;
  onDragEnd?: () => void;
}

const sign = (v: number | null | undefined) => ((v ?? 0) >= 0 ? 'up' : 'down');

export function Tile(props: TileProps) {
  const { t, lang, settings } = usePopup();
  const { id, coin, wide, pinned, loading, stale, menuOpen, dragging } = props;
  const name = coin?.name ?? id;
  const classes = [
    'c-tile',
    wide && 'c-tile--wide',
    menuOpen && 'is-menu-open',
    stale && 'is-stale',
    dragging && 'is-dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 拖动排序只能放在容器上，打开详情和菜单有各自的按钮
    <div
      className={classes}
      data-id={id}
      style={{ '--coin': coinColor(id) } as CSSProperties}
      draggable={!!props.onDragStart}
      onDragStart={(e) => props.onDragStart?.(id, e)}
      onDragOver={(e) => props.onDragOver?.(id, e)}
      onDragEnd={props.onDragEnd}
    >
      <button type="button" className="c-tile-open" onClick={() => props.onOpen(id)} aria-label={name} />
      <div className="c-tile-top">
        {coin?.image ? <img src={coin.image} alt="" /> : <span className="c-tile-ph" />}
        <span className="c-tile-name">
          <b>{coin?.symbol || id}</b>
          <small>{name}</small>
        </span>
        {pinned && (
          <span className="c-chip c-chip--on">
            <PinIcon filled />
            {t('tile.onToolbar')}
          </span>
        )}
        <button
          type="button"
          className="c-more"
          aria-label={t('tile.more', { name })}
          aria-haspopup="menu"
          aria-expanded={menuOpen ? 'true' : 'false'}
          onClick={(e) => props.onMore(id, e.currentTarget)}
        >
          <MoreIcon />
        </button>
      </div>
      {loading ? (
        <div className="c-tile-q">
          <span className="c-skel" style={{ width: wide ? 120 : 78, height: wide ? 26 : 17 }} />
          <span className="c-skel" style={{ width: 44, height: 12 }} />
        </div>
      ) : coin ? (
        <div className="c-tile-q">
          <b>{formatPrice(coin.price, settings.currency, lang)}</b>
          <span className={sign(coin.change24h)}>{formatChange(coin.change24h)}</span>
        </div>
      ) : (
        <div className="c-tile-q">
          <span className="c-tile-nodata">{t('tile.noData')}</span>
        </div>
      )}
      {loading ? (
        <span className="c-skel c-skel--spark" />
      ) : (
        <Sparkline values={coin?.spark ?? []} height={wide ? 46 : 34} />
      )}
    </div>
  );
}
