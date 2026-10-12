import { type KeyboardEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePopup } from '../context';
import { ChartIcon, PinIcon, TopIcon, TrashIcon } from '../icons';

export type TileAction = 'pin' | 'unpin' | 'detail' | 'moveFirst' | 'remove';

interface Props {
  anchor: HTMLButtonElement;
  pinned: boolean;
  first: boolean;
  onAction: (action: TileAction) => void;
  onClose: () => void;
}

/** 色块右上角“⋯”打开的菜单。上下键切换，Esc 或点外面关闭 */
export function TileMenu({ anchor, pinned, first, onAction, onClose }: Props) {
  const { t } = usePopup();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>();

  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const a = anchor.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const top = a.bottom + 6 + height > window.innerHeight - 8 ? a.top - height - 6 : a.bottom + 6;
    setPos({ top, left: Math.max(8, Math.min(a.right - width, window.innerWidth - width - 8)) });
  }, [anchor]);

  // 位置算好、菜单显示出来以后再把焦点放到第一项（隐藏的元素拿不到焦点）
  useEffect(() => {
    if (pos) ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [pos]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onClose();
      anchor.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [anchor, onClose]);

  const onKeyDown = (e: KeyboardEvent) => {
    const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
    }
  };

  const item = (action: TileAction, icon: ReactNode, label: string, danger = false) => (
    <button type="button" role="menuitem" className={danger ? 'is-danger' : undefined} onClick={() => onAction(action)}>
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div
      ref={ref}
      className="c-menu"
      role="menu"
      style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
      onKeyDown={onKeyDown}
    >
      {pinned ? item('unpin', <PinIcon filled />, t('menu.unpin')) : item('pin', <PinIcon />, t('menu.pin'))}
      {item('detail', <ChartIcon />, t('menu.detail'))}
      {!first && item('moveFirst', <TopIcon />, t('menu.moveFirst'))}
      {item('remove', <TrashIcon />, t('menu.remove'), true)}
    </div>
  );
}
