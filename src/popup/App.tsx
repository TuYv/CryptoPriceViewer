import { useCallback, useEffect, useMemo, useState } from 'react';
import { browser } from '#imports';
import { effectiveUpDown, normalizeSettings, type Settings } from '@/core/settings';
import { settingsItem, updateSettings } from '@/core/store';
import { languageFromLocale, type MessageKey, t as translate } from '@/i18n';
import { Ctx, type PopupContext, type View } from './context';
import { useStorageItem } from './hooks';
import { DetailView } from './views/DetailView';
import { MarketView } from './views/MarketView';
import { NewsView } from './views/NewsView';
import { SettingsView } from './views/SettingsView';
import { DonateView, SourcesView } from './views/SubViews';

export function App() {
  const raw = useStorageItem(settingsItem);
  const [view, setView] = useState<View>({ name: 'market' });
  const settings = useMemo(() => (raw === undefined ? null : normalizeSettings(raw)), [raw]);
  const lang = settings?.language ?? languageFromLocale(browser.i18n.getUILanguage());

  // 外观、涨跌颜色、语言写在 <html> 上，样式表据此切换颜色
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.lang = lang === 'zh' ? 'zh-CN' : lang;
    root.dataset.updown = effectiveUpDown(settings, lang);
    if (settings.theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  }, [settings, lang]);

  const update = useCallback(async (change: (s: Settings) => Settings) => {
    await updateSettings(change);
  }, []);

  const ctx = useMemo<PopupContext | null>(
    () =>
      settings && {
        lang,
        settings,
        t: (key: MessageKey, params?: Record<string, string | number>) => translate(lang, key, params),
        update,
        go: setView,
      },
    [settings, lang, update],
  );

  if (!ctx) return null;

  return (
    <Ctx.Provider value={ctx}>
      {view.name === 'market' && <MarketView />}
      {view.name === 'detail' && <DetailView id={view.id} />}
      {view.name === 'news' && <NewsView />}
      {view.name === 'settings' && <SettingsView />}
      {view.name === 'sources' && <SourcesView />}
      {view.name === 'donate' && <DonateView />}
    </Ctx.Provider>
  );
}
