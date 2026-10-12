import type { ReactNode } from 'react';
import { type Language, type MessageKey, t } from '@/i18n';
import { MarketIcon, NewsIcon, SettingsIcon } from './icons';

export type Tab = 'market' | 'news' | 'settings';

const TABS: { id: Tab; label: MessageKey; icon: ReactNode }[] = [
  { id: 'market', label: 'tab.market', icon: <MarketIcon /> },
  { id: 'news', label: 'tab.news', icon: <NewsIcon /> },
  { id: 'settings', label: 'tab.settings', icon: <SettingsIcon /> },
];

export function TabBar({ lang, current, onChange }: { lang: Language; current: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="-translate-x-1/2 absolute bottom-3.5 left-1/2 flex w-max gap-0.5 rounded-3xl bg-tabbar p-1 shadow-[0_8px_20px_rgb(21_23_28/0.2)]">
      {TABS.map((tab) => {
        const active = tab.id === current;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
            className={`flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-2xl px-3.5 font-semibold text-[12.5px] focus-visible:outline-2 focus-visible:outline-tabbar-active focus-visible:outline-offset-2 ${
              active ? 'bg-tabbar-active text-tabbar-active-fg' : 'text-tabbar-fg'
            }`}
          >
            {tab.icon}
            <span>{t(lang, tab.label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
