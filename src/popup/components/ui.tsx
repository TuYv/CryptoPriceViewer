import type { ReactNode } from 'react';
import { usePopup, type View } from '../context';
import { BackIcon, MarketIcon, NewsIcon, SettingsIcon } from '../icons';

/** 底部悬浮导航 */
export function TabBar({ current }: { current: 'market' | 'news' | 'settings' }) {
  const { t, go } = usePopup();
  const tabs = [
    { view: { name: 'market' } as View, key: 'market', label: t('tab.market'), icon: <MarketIcon /> },
    { view: { name: 'news' } as View, key: 'news', label: t('tab.news'), icon: <NewsIcon /> },
    { view: { name: 'settings' } as View, key: 'settings', label: t('tab.settings'), icon: <SettingsIcon /> },
  ];
  return (
    <nav className="c-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          aria-current={tab.key === current ? 'page' : undefined}
          onClick={() => go(tab.view)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { t } = usePopup();
  return (
    <header className="c-subhead">
      <button type="button" className="c-round" aria-label={t('common.back')} onClick={onBack}>
        <BackIcon />
      </button>
      <h1>{title}</h1>
    </header>
  );
}

/** 一组互斥的选项按钮 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="c-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        // biome-ignore lint/a11y/useSemanticElements: 用按钮做成分段选择，外观和设计稿一致
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      className="c-select"
      aria-label={label}
      value={String(value)}
      onChange={(e) => {
        const picked = options.find((o) => String(o.value) === e.target.value);
        if (picked) onChange(picked.value);
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="c-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <i />
    </button>
  );
}

export function Row({ label, children, htmlFor }: { label: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="c-li">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
      {children}
    </div>
  );
}
