import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { browser } from '#imports';
import { coinColor, mentionedCoins } from '@/core/coins';
import { formatClock, formatDate } from '@/core/format';
import { ask } from '@/core/messages';
import { feedsFor, NEWS_SOURCES } from '@/core/news';
import type { NewsSourceId } from '@/core/settings';
import { marketsItem, newsItem } from '@/core/store';
import type { Language } from '@/i18n';
import { TabBar } from '../components/ui';
import { usePopup } from '../context';
import { useNow, useStorageItem } from '../hooks';
import { NewsIcon } from '../icons';

type Permission = 'checking' | 'none' | 'granted' | 'denied';

export function sourceName(id: NewsSourceId, lang: Language): string {
  return id === 'odaily' && lang === 'zh' ? 'Odaily 星球日报' : NEWS_SOURCES[id].name;
}

export function NewsView() {
  const { t, lang, settings, go } = usePopup();
  const news = useStorageItem(newsItem);
  const markets = useStorageItem(marketsItem);
  const now = useNow(60_000);
  const [permission, setPermission] = useState<Permission>('checking');
  const [filter, setFilter] = useState<string>('all');
  const feeds = useMemo(() => feedsFor(lang, settings.newsSources), [lang, settings.newsSources]);
  const origins = useMemo(() => feeds.map((f) => f.source.origin), [feeds]);

  useEffect(() => {
    if (origins.length === 0) return;
    let alive = true;
    void Promise.all(origins.map((o) => browser.permissions.contains({ origins: [o] }))).then((granted) => {
      if (!alive) return;
      const any = granted.some(Boolean);
      setPermission(any ? 'granted' : 'none');
      if (any) void ask('news', { force: false });
    });
    return () => {
      alive = false;
    };
  }, [origins]);

  const allow = async () => {
    // 必须在点击事件里直接调用，Chrome 才会弹出确认框
    const granted = await browser.permissions.request({ origins }).catch(() => false);
    setPermission(granted ? 'granted' : 'denied');
    if (granted) void ask('news', { force: true });
  };

  const coins = useMemo(
    () =>
      settings.coins.flatMap((id) => {
        const c = markets?.coins[id];
        return c ? [{ id, symbol: c.symbol, name: c.name }] : [];
      }),
    [settings.coins, markets],
  );

  const items = useMemo(() => {
    if (!news || news.lang !== lang) return [];
    return news.items.map((n) => ({ ...n, coins: mentionedCoins(n.title, coins) }));
  }, [news, lang, coins]);

  const shown =
    filter === 'all'
      ? items
      : filter === 'mine'
        ? items.filter((n) => n.coins.length)
        : items.filter((n) => n.coins.includes(filter));

  const dayOf = (t0: number) => {
    const today = new Date(now).toDateString();
    const yesterday = new Date(now - 86_400_000).toDateString();
    const day = new Date(t0).toDateString();
    return day === today ? t('news.today') : day === yesterday ? t('news.yesterday') : formatDate(t0, lang, false);
  };

  let body: ReactNode;
  if (feeds.length === 0) {
    body = (
      <div className="c-perm">
        <p className="c-perm-text">{t('news.noSources')}</p>
        <button type="button" className="c-btn" onClick={() => go({ name: 'sources' })}>
          {t('news.openSettings')}
        </button>
      </div>
    );
  } else if (permission === 'checking') {
    body = null;
  } else if (permission === 'none' || permission === 'denied') {
    body = (
      <div className="c-perm">
        <div className="c-perm-icon">
          <NewsIcon size={26} />
        </div>
        <p className="c-perm-title">{t('perm.title')}</p>
        <p className="c-perm-text">{t('perm.text')}</p>
        <ul className="c-perm-sites">
          {feeds.map(({ source, lang: feedLang }) => (
            <li key={source.id}>
              <b>
                {sourceName(source.id, lang)}
                {feedLang !== lang && <em>{t('news.english')}</em>}
              </b>
              <span>{new URL(source.origin.replace('/*', '/')).host}</span>
            </li>
          ))}
        </ul>
        {permission === 'denied' && <p className="c-perm-error">{t('perm.denied')}</p>}
        <button type="button" className="c-btn" onClick={allow}>
          {t('perm.allow')}
        </button>
        <button type="button" className="c-btn c-btn--ghost" onClick={() => go({ name: 'market' })}>
          {t('perm.later')}
        </button>
        <p className="c-perm-note">{t('perm.note')}</p>
      </div>
    );
  } else {
    const groups: { day: string; list: typeof shown }[] = [];
    for (const n of shown) {
      const day = dayOf(n.publishedAt);
      const last = groups.at(-1);
      if (last?.day === day) last.list.push(n);
      else groups.push({ day, list: [n] });
    }
    const failed = news && news.lang === lang ? news.failed.map((id) => sourceName(id, lang)) : [];
    body = (
      <>
        <div className="c-chips" role="radiogroup" aria-label={t('news.filter')}>
          {[
            { key: 'all', label: t('news.all') },
            { key: 'mine', label: t('news.mine') },
            ...coins.map((c) => ({ key: c.id, label: c.symbol })),
          ].map((chip) => (
            // biome-ignore lint/a11y/useSemanticElements: 分段按钮
            <button
              key={chip.key}
              type="button"
              role="radio"
              aria-checked={filter === chip.key}
              className={chip.key !== 'all' && chip.key !== 'mine' ? 'is-coin' : undefined}
              style={
                chip.key !== 'all' && chip.key !== 'mine'
                  ? ({ '--coin': coinColor(chip.key) } as CSSProperties)
                  : undefined
              }
              onClick={() => setFilter(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="c-feed">
          {failed.length > 0 && <p className="c-feed-note">{t('news.failed', { sources: failed.join(', ') })}</p>}
          {!news || news.lang !== lang ? (
            <p className="c-empty">{t('news.loading')}</p>
          ) : shown.length === 0 ? (
            <p className="c-empty">{filter === 'all' ? t('news.empty') : t('news.emptyFilter')}</p>
          ) : (
            groups.map((g) => (
              <section key={g.day}>
                <h2 className="c-day">{g.day}</h2>
                {g.list.map((n) => (
                  <a
                    key={n.id}
                    className="c-item"
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ '--coin': n.coins[0] ? coinColor(n.coins[0]) : 'var(--c-line)' } as CSSProperties}
                  >
                    <span className="c-item-meta">
                      {formatClock(n.publishedAt, lang)}
                      <span>{sourceName(n.source, lang)}</span>
                      {NEWS_SOURCES[n.source].languages.includes(lang) ? null : <em>{t('news.english')}</em>}
                    </span>
                    <b>{n.title}</b>
                  </a>
                ))}
              </section>
            ))
          )}
        </div>
      </>
    );
  }

  return (
    <div className="c-screen">
      <header className="c-head">
        <h1>{t('tab.news')}</h1>
      </header>
      {body}
      <TabBar current="news" />
    </div>
  );
}
