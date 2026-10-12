import { type CSSProperties, useState } from 'react';
import { browser } from '#imports';
import { coinColor } from '@/core/coins';
import { NEWS_SOURCES, type NewsSource } from '@/core/news';
import { NEWS_SOURCE_IDS } from '@/core/settings';
import { SubHeader, Switch, TabBar } from '../components/ui';
import { usePopup } from '../context';
import { sourceName } from './NewsView';

const hostOf = (source: NewsSource) => new URL(source.origin.replace('/*', '/')).host.replace(/^www\.|^api\./, '');

/** 设置 › 资讯来源：打开时申请访问权限，关掉时连权限一起收回 */
export function SourcesView() {
  const { t, lang, settings, update, go } = usePopup();
  const [denied, setDenied] = useState<string | null>(null);
  const local = NEWS_SOURCE_IDS.map((id) => NEWS_SOURCES[id]).filter((s) => s.languages.includes(lang));
  const english =
    lang === 'en' ? [] : NEWS_SOURCE_IDS.map((id) => NEWS_SOURCES[id]).filter((s) => s.languages.includes('en'));

  const toggle = async (source: NewsSource, on: boolean) => {
    setDenied(null);
    if (on) {
      const granted = await browser.permissions.request({ origins: [source.origin] }).catch(() => false);
      if (!granted) {
        setDenied(sourceName(source.id, lang));
        return;
      }
      await update((s) => ({ ...s, newsSources: [...s.newsSources, source.id] }));
    } else {
      await update((s) => ({ ...s, newsSources: s.newsSources.filter((id) => id !== source.id) }));
      await browser.permissions.remove({ origins: [source.origin] }).catch(() => false);
    }
  };

  const row = (source: NewsSource) => (
    <div key={source.id} className="c-li c-li--source">
      <span>
        <b>{sourceName(source.id, lang)}</b>
        <small>
          {hostOf(source)}
          {source.id !== 'decrypt' && `, ${t('sources.flash')}`}
        </small>
      </span>
      <Switch
        label={sourceName(source.id, lang)}
        checked={settings.newsSources.includes(source.id)}
        onChange={(on) => void toggle(source, on)}
      />
    </div>
  );

  return (
    <div className="c-screen">
      <SubHeader title={t('sources.title')} onBack={() => go({ name: 'settings' })} />
      <div className="c-set">
        <h2>{t('sources.local')}</h2>
        {local.map(row)}
        {english.length > 0 && (
          <>
            <h2>{t('sources.english')}</h2>
            {english.map(row)}
          </>
        )}
        {denied && (
          <p className="c-set-note is-error" role="status">
            {t('sources.denied', { name: denied })}
          </p>
        )}
        <p className="c-set-note">{t('sources.note')}</p>
      </div>
      <TabBar current="settings" />
    </div>
  );
}

export function DonateView() {
  const { t, go } = usePopup();
  const codes = [
    { coin: 'binancecoin', src: '/donate/bnb-qr.png', label: 'BNB Chain' },
    { coin: 'solana', src: '/donate/sol-qr.png', label: 'Solana' },
  ];
  return (
    <div className="c-screen">
      <SubHeader title={t('donate.title')} onBack={() => go({ name: 'settings' })} />
      <div className="c-set">
        <p className="c-donate-text">{t('donate.text')}</p>
        <div className="c-qrs">
          {codes.map((c) => (
            <figure key={c.coin} style={{ '--coin': coinColor(c.coin) } as CSSProperties}>
              <img src={c.src} alt={c.label} />
              <figcaption>{c.label}</figcaption>
            </figure>
          ))}
        </div>
        <p className="c-set-note">{t('donate.note')}</p>
      </div>
      <TabBar current="settings" />
    </div>
  );
}
