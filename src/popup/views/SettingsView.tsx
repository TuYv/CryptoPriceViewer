import { useEffect, useRef, useState } from 'react';
import { browser } from '#imports';
import { ask } from '@/core/messages';
import { feedsFor } from '@/core/news';
import {
  CURRENCIES,
  REFRESH_INTERVALS,
  type Settings,
  THEMES,
  UP_DOWN_STYLES,
  type UpDownStyle,
} from '@/core/settings';
import { apiKeyItem } from '@/core/store';
import { LANGUAGES, type Language, type MessageKey } from '@/i18n';
import { Row, Segmented, Select, TabBar } from '../components/ui';
import { usePopup } from '../context';
import { useStorageItem } from '../hooks';
import { ChevronIcon, ExternalIcon } from '../icons';

const LANGUAGE_NAMES: Record<Language, string> = { zh: '简体中文', en: 'English', ja: '日本語', ko: '한국어' };
const FEEDBACK_URL = 'https://github.com/TuYv/CryptoPriceViewer/issues';
const GET_KEY_URL = 'https://www.coingecko.com/en/api/pricing';

type KeyState = 'idle' | 'checking' | 'saved' | 'invalid' | 'offline' | 'removed';

function ApiKeyField() {
  const { t } = usePopup();
  const saved = useStorageItem(apiKeyItem);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState<KeyState>('idle');
  const lastSaved = useRef('');

  // 存储里的密钥读到或者变了时填进输入框；用户已经改过输入框就不覆盖（读取比打字慢时，打的字不会被清掉）
  useEffect(() => {
    if (saved === undefined) return;
    setDraft((d) => (d === lastSaved.current ? saved : d));
    lastSaved.current = saved;
  }, [saved]);

  const save = async () => {
    const key = draft.trim();
    if (!key) return;
    setState('checking');
    const res = await ask('checkApiKey', { key });
    if (res.ok && res.data) {
      await apiKeyItem.setValue(key);
      setState('saved');
    } else {
      setState(res.ok ? 'invalid' : 'offline');
    }
  };

  const remove = async () => {
    await apiKeyItem.setValue('');
    setDraft('');
    setState('removed');
  };

  const message: Partial<Record<KeyState, MessageKey>> = {
    checking: 'set.apiKeyChecking',
    saved: 'set.apiKeySaved',
    invalid: 'set.apiKeyInvalid',
    offline: 'set.apiKeyOffline',
    removed: 'set.apiKeyRemoved',
  };
  const note = message[state];

  return (
    <div className="c-li c-li--key">
      <label htmlFor="api-key">{t('set.apiKey')}</label>
      <div className="c-key-row">
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('set.apiKeyPlaceholder')}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setState('idle');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
          }}
        />
        {draft.trim() && draft.trim() !== saved && (
          <button type="button" className="c-small-btn" onClick={save} disabled={state === 'checking'}>
            {t('set.apiKeySave')}
          </button>
        )}
        {saved && draft.trim() === saved && (
          <button type="button" className="c-small-btn c-small-btn--ghost" onClick={remove}>
            {t('set.apiKeyRemove')}
          </button>
        )}
      </div>
      {note && (
        <small
          className={state === 'invalid' || state === 'offline' ? 'is-error' : state === 'saved' ? 'is-ok' : undefined}
          role="status"
        >
          {t(note)}
        </small>
      )}
      <small>
        {t('set.apiKeyHelp')}{' '}
        <a href={GET_KEY_URL} target="_blank" rel="noreferrer">
          {t('set.apiKeyGet')}
        </a>
      </small>
    </div>
  );
}

export function SettingsView() {
  const { t, lang, settings, update, go } = usePopup();
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => void update((s) => ({ ...s, [key]: value }));
  const enabledFeeds = feedsFor(lang, settings.newsSources).length;

  return (
    <div className="c-screen">
      <header className="c-head">
        <h1>{t('tab.settings')}</h1>
      </header>
      <div className="c-set">
        <h2>{t('set.gDisplay')}</h2>
        <Row label={t('set.currency')}>
          <Select
            label={t('set.currency')}
            value={settings.currency}
            options={CURRENCIES.map((c) => ({ value: c, label: t(`currency.${c}`) }))}
            onChange={(v) => set('currency', v)}
          />
        </Row>
        <Row label={t('set.language')}>
          <Select
            label={t('set.language')}
            value={settings.language ?? 'auto'}
            options={[
              { value: 'auto', label: t('set.languageAuto') },
              ...LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_NAMES[l] })),
            ]}
            onChange={(v) => set('language', v === 'auto' ? null : (v as Language))}
          />
        </Row>
        <Row label={t('set.upDown')}>
          <span className="c-updown">
            <span className="c-updown-sample" aria-hidden="true">
              <span className="up">+1.2%</span>
              <span className="down">−1.2%</span>
            </span>
            <Select
              label={t('set.upDown')}
              value={settings.upDown ?? 'auto'}
              options={[
                { value: 'auto', label: t('set.upDownAuto') },
                ...UP_DOWN_STYLES.map((s) => ({ value: s, label: t(`upDown.${s}`) })),
              ]}
              onChange={(v) => set('upDown', v === 'auto' ? null : (v as UpDownStyle))}
            />
          </span>
        </Row>
        <Row label={t('set.theme')}>
          <Segmented
            label={t('set.theme')}
            value={settings.theme}
            options={THEMES.map((v) => ({
              value: v,
              label: t(v === 'auto' ? 'set.themeAuto' : v === 'light' ? 'set.themeLight' : 'set.themeDark'),
            }))}
            onChange={(v) => set('theme', v)}
          />
        </Row>

        <h2>{t('set.gRefresh')}</h2>
        <Row label={t('set.refresh')}>
          <Select
            label={t('set.refresh')}
            value={settings.refreshInterval}
            options={REFRESH_INTERVALS.map((v) => ({ value: v, label: t(`refresh.${v}`) }))}
            onChange={(v) => set('refreshInterval', v)}
          />
        </Row>
        <Row label={t('set.badge')}>
          <Segmented
            label={t('set.badge')}
            value={settings.badge}
            options={[
              { value: 'price', label: t('set.badgePrice') },
              { value: 'change', label: t('set.badgeChange') },
            ]}
            onChange={(v) => set('badge', v)}
          />
        </Row>

        <h2>{t('set.gData')}</h2>
        <ApiKeyField />
        <button type="button" className="c-li c-li--link" onClick={() => go({ name: 'sources' })}>
          <span>{t('set.sources')}</span>
          <span className="c-val">
            {t('set.sourcesCount', { count: enabledFeeds })}
            <ChevronIcon />
          </span>
        </button>

        <h2>{t('set.gAbout')}</h2>
        <a className="c-li c-li--link" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
          <span>{t('set.feedback')}</span>
          <span className="c-val">
            {t('set.feedbackValue')}
            <ExternalIcon />
          </span>
        </a>
        <button type="button" className="c-li c-li--link" onClick={() => go({ name: 'donate' })}>
          <span>{t('set.donate')}</span>
          <span className="c-val">
            {t('set.donateValue')}
            <ChevronIcon />
          </span>
        </button>
        <Row label={t('set.version')}>
          <span className="c-val">{browser.runtime.getManifest().version}</span>
        </Row>
      </div>
      <TabBar current="settings" />
    </div>
  );
}
