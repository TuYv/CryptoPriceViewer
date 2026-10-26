import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { browser } from '#imports';
import { coinColor, mentionedCoins } from '@/core/coins';
import { formatClock, formatDate } from '@/core/format';
import { ask } from '@/core/messages';
import { feedsFor, NEWS_SOURCES } from '@/core/news';
import type { NewsSourceId } from '@/core/settings';
import { marketsItem, newsActivatedItem, newsItem, newsPaneItem } from '@/core/store';
import type { Language } from '@/i18n';
import { Segmented, TabBar } from '../components/ui';
import { usePopup } from '../context';
import { useNow, useStorageItem } from '../hooks';
import { NewsIcon } from '../icons';
import { EventsPane } from './EventsPane';

export function sourceName(id: NewsSourceId, lang: Language): string {
  return id === 'odaily' && lang === 'zh' ? 'Odaily 星球日报' : NEWS_SOURCES[id].name;
}

const hostOf = (origin: string) => new URL(origin.replace('/*', '/')).host;

/** 资讯页顶上请用户同意访问某些来源的提示 */
function Ask(props: { text: string; allow: string; onAllow: () => void; skip?: string; onSkip?: () => void }) {
  return (
    <div className="c-ask">
      <p>{props.text}</p>
      <div className="c-ask-actions">
        <button type="button" className="c-small-btn" onClick={props.onAllow}>
          {props.allow}
        </button>
        {props.skip && (
          <button type="button" className="c-small-btn c-small-btn--ghost" onClick={props.onSkip}>
            {props.skip}
          </button>
        )}
      </div>
    </div>
  );
}

export function NewsView() {
  const { t, lang, settings, update, go } = usePopup();
  const pane = useStorageItem(newsPaneItem);
  const news = useStorageItem(newsItem);
  const markets = useStorageItem(marketsItem);
  const now = useNow(60_000);
  /** 每个来源有没有拿到访问权限；null 表示还在检查 */
  const [granted, setGranted] = useState<Partial<Record<NewsSourceId, boolean>> | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const feeds = useMemo(() => feedsFor(lang, settings.newsSources), [lang, settings.newsSources]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      // 打开资讯页就是要看新闻（大事日程也要用快讯）：从这时起后台才会去访问新闻网站
      await newsActivatedItem.setValue(true);
      const entries = await Promise.all(
        feeds.map(async ({ source }) => [source.id, await browser.permissions.contains({ origins: [source.origin] })]),
      );
      if (!alive) return;
      setGranted(Object.fromEntries(entries));
      void ask('news', { force: false });
    })();
    return () => {
      alive = false;
    };
  }, [feeds]);

  type Feed = (typeof feeds)[number];
  const blockedIds = news && news.lang === lang ? (news.blocked ?? []) : [];
  const isGranted = (f: Feed) => !!granted?.[f.source.id];
  // 能读的：允许直接读取、而且没被网站拒绝的来源，以及已经同意访问的来源
  const readable = feeds.filter((f) => (f.source.open && !blockedIds.includes(f.source.id)) || isGranted(f));
  // 网站不再允许直接读取，要用户同意访问
  const blocked = feeds.filter((f) => f.source.open && blockedIds.includes(f.source.id) && !isGranted(f));
  // 本来就要用户同意访问才能读（比如 Decrypt）
  const needsConsent = feeds.filter((f) => !f.source.open && !isGranted(f));
  const nameOf = (f: Feed) =>
    f.lang === lang ? sourceName(f.source.id, lang) : t('news.withEnglish', { name: sourceName(f.source.id, lang) });

  const allow = async (list: Feed[]) => {
    setDenied(null);
    // 必须在点击事件里直接调用，Chrome 才会弹出确认框
    const ok = await browser.permissions.request({ origins: list.map((f) => f.source.origin) }).catch(() => false);
    if (!ok) {
      setDenied(list.map(nameOf).join(', '));
      return;
    }
    setGranted((g) => ({ ...g, ...Object.fromEntries(list.map((f) => [f.source.id, true])) }));
    void ask('news', { force: true });
  };
  const skip = (list: Feed[]) =>
    void update((s) => ({ ...s, newsSources: s.newsSources.filter((id) => !list.some((f) => f.source.id === id)) }));

  const coins = useMemo(
    () =>
      settings.coins.flatMap((id) => {
        const c = markets?.coins[id];
        return c ? [{ id, symbol: c.symbol, name: c.name }] : [];
      }),
    [settings.coins, markets],
  );

  const symbols = useMemo(() => new Map(coins.map((c) => [c.id, c.symbol])), [coins]);

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
  } else if (granted === null) {
    body = null;
  } else if (readable.length === 0) {
    const asking = [...blocked, ...needsConsent];
    body = (
      <div className="c-perm">
        <div className="c-perm-icon">
          <NewsIcon size={26} />
        </div>
        <p className="c-perm-title">{t('perm.title')}</p>
        <p className="c-perm-text">{t('perm.text')}</p>
        <ul className="c-perm-sites">
          {asking.map(({ source, lang: feedLang }) => (
            <li key={source.id}>
              <b>
                {sourceName(source.id, lang)}
                {feedLang !== lang && <em>{t('news.english')}</em>}
              </b>
              <span>{hostOf(source.origin)}</span>
            </li>
          ))}
        </ul>
        {denied && <p className="c-perm-error">{t('perm.denied')}</p>}
        <button type="button" className="c-btn" onClick={() => void allow(asking)}>
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
    // 被网站拒绝的来源下面单独提示，这里不再重复
    const failed =
      news && news.lang === lang
        ? news.failed.filter((id) => !blockedIds.includes(id)).map((id) => sourceName(id, lang))
        : [];
    const hosts = (list: Feed[]) => list.map((f) => hostOf(f.source.origin)).join(', ');
    const names = (list: Feed[]) => list.map(nameOf).join(', ');
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
          {blocked.length > 0 && (
            <Ask
              text={t('news.blocked', { names: names(blocked) })}
              allow={t('news.allow')}
              onAllow={() => void allow(blocked)}
            />
          )}
          {needsConsent.length > 0 && (
            <Ask
              text={t('news.askMore', { names: names(needsConsent), hosts: hosts(needsConsent) })}
              allow={t('news.allow')}
              onAllow={() => void allow(needsConsent)}
              skip={t('news.skip')}
              onSkip={() => skip(needsConsent)}
            />
          )}
          {denied && <p className="c-feed-note is-error">{t('sources.denied', { name: denied })}</p>}
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
                      {n.coins.slice(0, 3).map((id) => (
                        <span key={id} className="c-item-coin" style={{ '--coin': coinColor(id) } as CSSProperties}>
                          {symbols.get(id)}
                        </span>
                      ))}
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
        {pane && (
          <Segmented
            label={t('news.pane')}
            value={pane}
            options={[
              { value: 'news', label: t('news.paneNews') },
              { value: 'events', label: t('news.paneEvents') },
            ]}
            onChange={(next) => void newsPaneItem.setValue(next)}
          />
        )}
      </header>
      {pane === 'events' ? <EventsPane /> : pane === 'news' ? body : null}
      <TabBar current="news" />
    </div>
  );
}
