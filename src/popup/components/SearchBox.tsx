import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { SearchCoin } from '@/core/coingecko';
import { ask, type Problem } from '@/core/messages';
import { MAX_COINS } from '@/core/settings';
import { usePopup } from '../context';
import { CheckIcon, SearchIcon } from '../icons';

type State =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; coins: SearchCoin[] }
  | { kind: 'failed'; problem: Problem };

/** 搜索框：输入后停顿 300 毫秒再搜；上下键选择，回车添加，Esc 关闭 */
export function SearchBox({ onAdd }: { onAdd: (coin: SearchCoin) => void }) {
  const { t, settings } = usePopup();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const full = settings.coins.length >= MAX_COINS;

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setState({ kind: 'idle' });
      return;
    }
    setState({ kind: 'searching' });
    let alive = true;
    const timer = setTimeout(async () => {
      const res = await ask('search', { query: q });
      if (!alive) return;
      setActive(0);
      setState(res.ok ? { kind: 'results', coins: res.data } : { kind: 'failed', problem: res.problem });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (state.kind === 'idle') return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setState({ kind: 'idle' });
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [state.kind]);

  const results = state.kind === 'results' ? state.coins : [];
  const add = (coin: SearchCoin | undefined) => {
    if (!coin || settings.coins.includes(coin.id) || full) return;
    onAdd(coin);
    setQuery('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((i) => (i + results.length - 1) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      add(results[active]);
    }
  };

  const open = state.kind !== 'idle';
  const listId = 'search-results';

  return (
    <div className="c-searchwrap" ref={boxRef}>
      <label className={`c-search${open ? ' is-focused' : ''}`}>
        <SearchIcon />
        <input
          type="text"
          role="combobox"
          aria-label={t('search.label')}
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={results[active] ? `search-${results[active].id}` : undefined}
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </label>
      {open && (
        <div className="c-results" id={listId} role="listbox" aria-label={t('search.label')}>
          {state.kind === 'searching' && <p className="c-results-msg">{t('search.searching')}</p>}
          {state.kind === 'failed' && (
            <p className="c-results-msg">
              {state.problem === 'rate-limited' ? t('common.limited') : t('search.failed')}
            </p>
          )}
          {state.kind === 'results' && results.length === 0 && (
            <p className="c-results-msg">{t('search.noResults', { query: query.trim() })}</p>
          )}
          {results.map((coin, i) => {
            const added = settings.coins.includes(coin.id);
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: 键盘用上下键和回车在输入框里操作
              <div
                key={coin.id}
                id={`search-${coin.id}`}
                role="option"
                tabIndex={-1}
                aria-selected={i === active}
                className={`c-result${i === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => add(coin)}
              >
                {coin.image ? <img src={coin.image} alt="" /> : <span className="c-tile-ph" />}
                <span className="c-result-name">
                  <b>{coin.name}</b>
                  <small>
                    {coin.symbol}
                    {coin.rank != null && <span>{t('search.rank', { rank: coin.rank })}</span>}
                  </small>
                </span>
                {added ? (
                  <span className="c-result-added">
                    <CheckIcon />
                    {t('search.added')}
                  </span>
                ) : (
                  <span className="c-result-add">{t('search.add')}</span>
                )}
              </div>
            );
          })}
          {full && results.length > 0 && <p className="c-results-msg">{t('search.full', { max: MAX_COINS })}</p>}
          {results.length > 0 && <p className="c-results-hint">{t('search.hint')}</p>}
        </div>
      )}
    </div>
  );
}
