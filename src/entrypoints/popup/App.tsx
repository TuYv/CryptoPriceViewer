import { useState } from 'react';
import { type Tab, TabBar } from '@/components/TabBar';
import { type Language, type MessageKey, t } from '@/i18n';

const TITLES: Record<Tab, MessageKey> = {
  market: 'tab.market',
  news: 'tab.news',
  settings: 'tab.settings',
};

export function App({ lang }: { lang: Language }) {
  const [tab, setTab] = useState<Tab>('market');
  const title = t(lang, TITLES[tab]);

  return (
    <div className="relative flex h-full flex-col">
      <header className="px-4 pt-4 pb-3">
        <h1 className="font-extrabold text-[22px] tracking-tight">{title}</h1>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-20" aria-label={title} />
      <TabBar lang={lang} current={tab} onChange={setTab} />
    </div>
  );
}
