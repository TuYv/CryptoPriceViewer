import { useState } from 'react';
import {
  type MarketEvent,
  newsAbout,
  OFFICIAL_SCHEDULES,
  OFFICIAL_URL,
  recentEvents,
  upcomingEvents,
} from '@/core/events';
import { formatClock, formatEventTime, formatUntil } from '@/core/format';
import { eventNewsItem } from '@/core/store';
import { usePopup } from '../context';
import { useNow, useStorageItem } from '../hooks';
import { ChevronIcon, ExternalIcon } from '../icons';

/** “接下来”最多列几件 */
const LATER_MAX = 4;

/** 一件事的大白话说明。下一件大事的卡片上已经写了“是什么”，展开时不再重复 */
function Explain({ event, withWhat }: { event: MarketEvent; withWhat: boolean }) {
  const { t } = usePopup();
  const { kind } = event;
  return (
    <div className="c-ev-explain">
      <dl>
        {withWhat && (
          <>
            <dt>{t('events.what')}</dt>
            <dd>{t(`event.${kind}.what`)}</dd>
          </>
        )}
        <dt>{t('events.why')}</dt>
        <dd>{t(`event.${kind}.why`)}</dd>
        <dt>{t('events.how')}</dt>
        <dd>{t(`event.${kind}.how`)}</dd>
      </dl>
      <p className="c-ev-note">{t('events.note')}</p>
      <a className="c-ev-link" href={OFFICIAL_URL[kind]} target="_blank" rel="noreferrer">
        {t('events.official')}
        <ExternalIcon />
      </a>
    </div>
  );
}

/** 一行：时间和事件名，点一下展开说明 */
function EventRow({ event, open, onToggle }: { event: MarketEvent; open: boolean; onToggle: () => void }) {
  const { t, lang } = usePopup();
  return (
    <>
      <button type="button" className="c-ev-row" aria-expanded={open} onClick={onToggle}>
        <span className="c-ev-row-when">{formatEventTime(event.at, lang)}</span>
        <b>{t(`event.${event.kind}.name`)}</b>
        <ChevronIcon />
      </button>
      {open && <Explain event={event} withWhat />}
    </>
  );
}

/** 资讯页的大事日程：下一件大事、接下来几件、最近一周已经公布的和相关快讯 */
export function EventsPane() {
  const { t, lang } = usePopup();
  const now = useNow(60_000);
  const kept = useStorageItem(eventNewsItem);
  /** 展开了说明的那件事 */
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen((current) => (current === id ? null : id));

  const [next, ...rest] = upcomingEvents(now);
  const later = rest.slice(0, LATER_MAX);
  const recent = recentEvents(now);
  const items = kept && kept.lang === lang ? kept.items : [];

  return (
    <div className="c-feed">
      {next ? (
        <>
          <h2 className="c-day">{t('events.next')}</h2>
          <article className="c-ev-card">
            <h3>{t(`event.${next.kind}.name`)}</h3>
            <p className="c-ev-when">
              {formatEventTime(next.at, lang)} · {formatUntil(next.at, now, lang)}
            </p>
            <p className="c-ev-what">{t(`event.${next.kind}.what`)}</p>
            {open === next.id && <Explain event={next} withWhat={false} />}
            <button
              type="button"
              className="c-ev-toggle"
              aria-expanded={open === next.id}
              onClick={() => toggle(next.id)}
            >
              {open === next.id ? t('events.hide') : t('events.how')}
              <ChevronIcon />
            </button>
          </article>
        </>
      ) : (
        <article className="c-ev-card">
          <h3>{t('events.ended')}</h3>
          <p className="c-ev-what">{t('events.endedText')}</p>
          <div className="c-ev-links">
            {(
              [
                ['fed', t('events.scheduleFed')],
                ['bls', t('events.scheduleBls')],
                ['bea', t('events.scheduleBea')],
              ] as const
            ).map(([key, label]) => (
              <a key={key} className="c-ev-link" href={OFFICIAL_SCHEDULES[key]} target="_blank" rel="noreferrer">
                {label}
                <ExternalIcon />
              </a>
            ))}
          </div>
        </article>
      )}

      {later.length > 0 && (
        <section>
          <h2 className="c-day">{t('events.later')}</h2>
          {later.map((e) => (
            <EventRow key={e.id} event={e} open={open === e.id} onToggle={() => toggle(e.id)} />
          ))}
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="c-day">{t('events.recent')}</h2>
          {recent.map((e) => {
            const news = newsAbout(e, items);
            return (
              <div key={e.id} className="c-ev-done">
                <EventRow event={e} open={open === e.id} onToggle={() => toggle(e.id)} />
                {news.length > 0 ? (
                  news.map((n) => (
                    <a key={n.id} className="c-item" href={n.url} target="_blank" rel="noreferrer">
                      <span className="c-item-meta">{formatClock(n.publishedAt, lang)}</span>
                      <b>{n.title}</b>
                    </a>
                  ))
                ) : (
                  <p className="c-ev-empty">
                    {t('events.noNews')}
                    <a className="c-ev-link" href={OFFICIAL_URL[e.kind]} target="_blank" rel="noreferrer">
                      {t('events.official')}
                      <ExternalIcon />
                    </a>
                  </p>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
