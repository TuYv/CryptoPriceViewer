import type { CSSProperties } from 'react';
import { coinColor } from '@/core/coins';
import { formatChange, formatPrice } from '@/core/format';
import { usePopup } from '../context';
import { MoreIcon, PinIcon } from '../icons';
import { CoinIcon } from './CoinIcon';
import { Sparkline } from './Sparkline';
import type { TileProps } from './Tile';

const sign = (v: number | null | undefined) => ((v ?? 0) >= 0 ? 'up' : 'down');

/** 列表显示方式下的一行：图标、代码和名字、价格和涨跌幅，7 天走势铺满整行垫在文字下面。参数和色块一样 */
export function CoinRow(props: TileProps) {
  const { t, lang, settings } = usePopup();
  const { id, coin, pinned, loading, stale, menuOpen, dragging } = props;
  const name = coin?.name ?? id;
  const classes = [
    'c-row',
    pinned && 'is-pinned',
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
      <button type="button" className="c-row-open" onClick={() => props.onOpen(id)} aria-label={name} />
      {!loading && (
        <span className="c-row-spark">
          <Sparkline values={coin?.spark ?? []} height={48} fade />
        </span>
      )}
      <CoinIcon src={coin?.image} symbol={coin?.symbol} size={28} />
      <span className="c-row-name">
        <b>
          {coin?.symbol || id}
          {pinned && (
            <span className="c-row-pin" title={t('tile.onToolbar')}>
              <PinIcon filled size={12} />
              <span className="sr-only">{t('tile.onToolbar')}</span>
            </span>
          )}
        </b>
        <small>{name}</small>
      </span>
      {loading ? (
        <span className="c-row-q">
          <span className="c-skel" style={{ width: 64, height: 16 }} />
          <span className="c-skel" style={{ width: 40, height: 12 }} />
        </span>
      ) : coin ? (
        <span className="c-row-q">
          <b>{formatPrice(coin.price, settings.currency, lang)}</b>
          <span className={sign(coin.change24h)}>{formatChange(coin.change24h)}</span>
        </span>
      ) : (
        <span className="c-row-q">
          <span className="c-row-nodata">{t('tile.noData')}</span>
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
  );
}
